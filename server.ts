import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEMO_COURSES,
  DEMO_FACULTY_RESPONSES,
  DEMO_INSTRUCTORS,
  DEMO_MODERATION_REPORTS,
  DEMO_REVIEWS,
  DEMO_UNIVERSITIES,
} from './src/data/demoDataset.ts';
import {
  generateDeterministicInsights,
  rankAndFilterReviews,
} from './src/utils/trustLens.ts';
import type {
  CourseInsightReport,
  FacultyResponse,
  ModerationReport,
  Review,
  StudyMethodKey,
} from './src/types/course.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '.courseglide-demo-store.json');

interface DemoStore {
  reviews: Review[];
  facultyResponses: FacultyResponse[];
  moderationReports: ModerationReport[];
  votesByVoterAndReview: Record<string, 'helpful' | 'not_helpful'>;
  savedCoursesByUser: Record<string, string[]>;
}

function createInitialStore(): DemoStore {
  return {
    reviews: structuredClone(DEMO_REVIEWS),
    facultyResponses: structuredClone(DEMO_FACULTY_RESPONSES),
    moderationReports: structuredClone(DEMO_MODERATION_REPORTS),
    votesByVoterAndReview: {},
    savedCoursesByUser: {
      'demo-student': ['math-137', 'cs-135'],
    },
  };
}

function loadStore(): DemoStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DemoStore>;
      if (Array.isArray(parsed.reviews) && parsed.reviews.length > 0) {
        return {
          reviews: parsed.reviews,
          facultyResponses: Array.isArray(parsed.facultyResponses)
            ? parsed.facultyResponses
            : structuredClone(DEMO_FACULTY_RESPONSES),
          moderationReports: Array.isArray(parsed.moderationReports)
            ? parsed.moderationReports
            : structuredClone(DEMO_MODERATION_REPORTS),
          votesByVoterAndReview: parsed.votesByVoterAndReview ?? {},
          savedCoursesByUser: parsed.savedCoursesByUser ?? {
            'demo-student': ['math-137', 'cs-135'],
          },
        };
      }
    }
  } catch (err) {
    console.warn('Could not load demo store file, using fresh seed:', err);
  }
  const fresh = createInitialStore();
  saveStore(fresh);
  return fresh;
}

function saveStore(store: DemoStore): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist demo store:', err);
  }
}

function sanitizeText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function detectPolicyViolation(text: string): string | null {
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) {
    return 'Submission appears to include a phone number. Please remove personal contact information.';
  }
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    return 'Submission appears to include an email address. Please protect privacy by removing personal emails.';
  }
  if (/\b(kill|threat|harass|doxx|hate\s+speech)\b/i.test(text)) {
    return 'Submission violates community safety rules against threats or harassment.';
  }
  return null;
}

let store = loadStore();

// Cache AI insights in memory per course + review count
const insightsCache = new Map<string, CourseInsightReport>();

const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const aiClient =
  geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY'
    ? new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

const app = express();
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: 'demonstration',
    firebaseConfigured: false,
    geminiConfigured: Boolean(aiClient),
  });
});

app.get('/api/bootstrap', (req, res) => {
  const userId = sanitizeText(req.query.userId, 64) || 'demo-student';
  res.json({
    universities: DEMO_UNIVERSITIES,
    courses: DEMO_COURSES,
    instructors: DEMO_INSTRUCTORS,
    reviews: store.reviews,
    facultyResponses: store.facultyResponses,
    moderationReports: store.moderationReports,
    savedCourseIds: store.savedCoursesByUser[userId] ?? [],
    userVotes: Object.fromEntries(
      Object.entries(store.votesByVoterAndReview)
        .filter(([k]) => k.startsWith(`${userId}::`))
        .map(([k, v]) => [k.split('::')[1], v])
    ),
    capabilities: {
      firebaseConfigured: false,
      geminiConfigured: Boolean(aiClient),
      mode: 'demonstration',
    },
  });
});

app.post('/api/saved-courses', (req, res) => {
  const userId = sanitizeText(req.body?.userId, 64) || 'demo-student';
  const courseId = sanitizeText(req.body?.courseId, 64);
  const courseExists = DEMO_COURSES.some((c) => c.id === courseId);
  if (!courseExists) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const current = new Set(store.savedCoursesByUser[userId] ?? []);
  let saved: boolean;
  if (current.has(courseId)) {
    current.delete(courseId);
    saved = false;
  } else {
    current.add(courseId);
    saved = true;
  }
  store.savedCoursesByUser[userId] = Array.from(current);
  saveStore(store);

  res.json({
    saved,
    savedCourseIds: store.savedCoursesByUser[userId],
  });
});

app.post('/api/reviews', (req, res) => {
  const body = req.body ?? {};
  const courseId = sanitizeText(body.courseId, 64);
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const term = sanitizeText(body.term, 32);
  const instructorName = sanitizeText(body.instructorName, 80);
  const taName = sanitizeText(body.taName, 80);
  const authorAlias =
    body.isAnonymous === false
      ? sanitizeText(body.authorAlias, 48) || 'Verified Demo Student'
      : sanitizeText(body.authorAlias, 48) || 'Anonymous Student';

  const difficultyNum = Number(body.difficulty);
  const difficulty = (
    [1, 2, 3, 4, 5].includes(difficultyNum) ? difficultyNum : 3
  ) as Review['difficulty'];

  const usefulnessNum = Number(body.usefulness);
  const usefulness = (
    [1, 2, 3, 4, 5].includes(usefulnessNum) ? usefulnessNum : 4
  ) as Review['usefulness'];

  const weeklyHours = Math.max(1, Math.min(40, Math.round(Number(body.weeklyHours) || 8)));
  const recommended = Boolean(body.recommended);

  const overallExperience = sanitizeText(body.overallExperience, 600);
  const whatWorkedWell = sanitizeText(body.whatWorkedWell, 500);
  const whatWasChallenging = sanitizeText(body.whatWasChallenging, 500);
  const practicalAdvice = sanitizeText(body.practicalAdvice, 500);

  if (!term || !instructorName || overallExperience.length < 15) {
    res.status(400).json({
      error:
        'Please provide the academic term, instructor name, and at least 15 characters for overall experience.',
    });
    return;
  }

  const combined = `${overallExperience} ${whatWorkedWell} ${whatWasChallenging} ${practicalAdvice}`;
  const violation = detectPolicyViolation(combined);
  if (violation) {
    res.status(400).json({ error: violation });
    return;
  }

  const validMethods = new Set<StudyMethodKey>([
    'practice_problems',
    'lecture_attendance',
    'textbook_reading',
    'study_groups',
    'spaced_repetition',
    'tutorial_sessions',
    'past_exams',
    'project_based',
  ]);

  const studyMethods: StudyMethodKey[] = Array.isArray(body.studyMethods)
    ? body.studyMethods.filter((m: unknown): m is StudyMethodKey =>
        validMethods.has(m as StudyMethodKey)
      )
    : [];

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: course.id,
    universityId: course.universityId,
    term,
    instructorName,
    ...(taName ? { taName } : {}),
    authorAlias,
    isAnonymous: body.isAnonymous !== false,
    verifiedEnrollment: false,
    difficulty,
    weeklyHours,
    recommended,
    usefulness,
    overallExperience,
    whatWorkedWell: whatWorkedWell || 'Not specified.',
    whatWasChallenging: whatWasChallenging || 'Not specified.',
    practicalAdvice: practicalAdvice || 'Stay consistent with weekly coursework.',
    studyMethods,
    helpfulMethods: recommended ? studyMethods : [],
    helpfulVotes: 0,
    notHelpfulVotes: 0,
    createdAt: new Date().toISOString(),
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  };

  store.reviews.unshift(newReview);
  insightsCache.delete(course.id);
  saveStore(store);

  res.status(201).json({ review: newReview });
});

app.post('/api/reviews/:id/vote', (req, res) => {
  const reviewId = sanitizeText(req.params.id, 80);
  const voterId = sanitizeText(req.body?.userId, 64) || 'demo-student';
  const voteType = req.body?.voteType === 'not_helpful' ? 'not_helpful' : 'helpful';

  const review = store.reviews.find((r) => r.id === reviewId);
  if (!review) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }

  const key = `${voterId}::${reviewId}`;
  const previousVote = store.votesByVoterAndReview[key];

  if (previousVote === voteType) {
    res.status(409).json({
      error: 'You have already recorded this vote on this review.',
      review,
      currentVote: previousVote,
    });
    return;
  }

  if (previousVote === 'helpful') review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
  if (previousVote === 'not_helpful')
    review.notHelpfulVotes = Math.max(0, review.notHelpfulVotes - 1);

  if (voteType === 'helpful') review.helpfulVotes += 1;
  else review.notHelpfulVotes += 1;

  store.votesByVoterAndReview[key] = voteType;
  saveStore(store);

  res.json({
    review,
    currentVote: voteType,
  });
});

app.post('/api/reviews/:id/report', (req, res) => {
  const reviewId = sanitizeText(req.params.id, 80);
  const review = store.reviews.find((r) => r.id === reviewId);
  if (!review) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }

  const allowedReasons = new Set(['spam', 'harassment', 'pii', 'off_topic']);
  const reason = allowedReasons.has(req.body?.reason)
    ? (req.body.reason as ModerationReport['reason'])
    : 'off_topic';
  const details = sanitizeText(req.body?.details, 300);

  review.reportCount += 1;
  if (review.reportCount >= 2 && review.moderationStatus === 'visible') {
    review.moderationStatus = 'flagged';
  }

  const report: ModerationReport = {
    id: `mod-${Date.now()}`,
    reviewId: review.id,
    courseId: review.courseId,
    reason,
    details: details || 'Reported for community moderation review.',
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  store.moderationReports.unshift(report);
  saveStore(store);

  res.status(201).json({ report, review });
});

app.post('/api/moderation/:reportId/resolve', (req, res) => {
  const reportId = sanitizeText(req.params.reportId, 80);
  const action = req.body?.action === 'remove' ? 'remove' : 'keep';
  const report = store.moderationReports.find((m) => m.id === reportId);
  if (!report) {
    res.status(404).json({ error: 'Moderation report not found.' });
    return;
  }

  const review = store.reviews.find((r) => r.id === report.reviewId);
  if (action === 'remove') {
    report.status = 'reviewed_removed';
    if (review) review.moderationStatus = 'hidden';
  } else {
    report.status = 'reviewed_kept';
    if (review) review.moderationStatus = 'visible';
  }
  saveStore(store);

  res.json({ report, review });
});

app.post('/api/faculty-responses', (req, res) => {
  const body = req.body ?? {};
  const courseId = sanitizeText(body.courseId, 64);
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const instructorName = sanitizeText(body.instructorName, 80) || 'Course Instructor (Demo)';
  const role = body.role === 'ta' ? 'ta' : 'professor';
  const term = sanitizeText(body.term, 32) || 'Upcoming Term';
  const themeAddressed = sanitizeText(body.themeAddressed, 140);
  const responseText = sanitizeText(body.responseText, 700);

  if (themeAddressed.length < 5 || responseText.length < 20) {
    res.status(400).json({
      error: 'Please enter the aggregate theme addressed and a response of at least 20 characters.',
    });
    return;
  }

  const newResponse: FacultyResponse = {
    id: `fac-${Date.now()}`,
    courseId: course.id,
    instructorName,
    role,
    term,
    themeAddressed,
    responseText,
    updatedAt: new Date().toISOString(),
    isDemo: true,
  };

  store.facultyResponses.unshift(newResponse);
  saveStore(store);

  res.status(201).json({ facultyResponse: newResponse });
});

app.post('/api/insights', async (req, res) => {
  const courseId = sanitizeText(req.body?.courseId, 64);
  const forceRefresh = Boolean(req.body?.forceRefresh);
  const course = DEMO_COURSES.find((c) => c.id === courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const courseReviews = store.reviews.filter((r) => r.courseId === course.id);
  const eligible = rankAndFilterReviews(courseReviews, 'most_informative', 'all').slice(0, 8);
  const cacheKey = `${course.id}:${courseReviews.length}:${eligible.map((r) => r.id).join(',')}`;

  if (!forceRefresh && insightsCache.has(cacheKey)) {
    res.json({ insights: insightsCache.get(cacheKey) });
    return;
  }

  const fallbackReport = generateDeterministicInsights(course, courseReviews);

  if (!aiClient || eligible.length === 0) {
    insightsCache.set(cacheKey, fallbackReport);
    res.json({ insights: fallbackReport });
    return;
  }

  try {
    const validIds = new Set(eligible.map((r) => r.id));
    const reviewDigest = eligible.map((r) => ({
      id: r.id,
      term: r.term,
      difficulty: r.difficulty,
      weeklyHours: r.weeklyHours,
      recommended: r.recommended,
      overall: r.overallExperience,
      workedWell: r.whatWorkedWell,
      challenging: r.whatWasChallenging,
      advice: r.practicalAdvice,
    }));

    const prompt = `Synthesize ONLY the provided student reviews for ${course.code} (${course.title}).
Do NOT invent statistics, grade distributions, or claims not directly present in the reviews.
If the sample size (${eligible.length} reviews) is small, keep language measured and cautious.
Each bullet item must cite 1-2 exact review IDs from the provided list in evidenceReviewIds.

Reviews JSON:
${JSON.stringify(reviewDigest, null, 2)}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are CourseGlide Insights, an academic feedback synthesizer. Produce concise, grounded, balanced bullet points strictly evidenced by the provided student reviews. Keep each point to 1-2 crisp sentences.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sampleNote: { type: Type.STRING },
            appreciate: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  evidenceReviewIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceLabel: { type: Type.STRING },
                },
                required: ['point', 'evidenceReviewIds', 'evidenceLabel'],
              },
            },
            struggleWith: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  evidenceReviewIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceLabel: { type: Type.STRING },
                },
                required: ['point', 'evidenceReviewIds', 'evidenceLabel'],
              },
            },
            recommendBefore: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  evidenceReviewIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceLabel: { type: Type.STRING },
                },
                required: ['point', 'evidenceReviewIds', 'evidenceLabel'],
              },
            },
            experiencesDiffer: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  evidenceReviewIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceLabel: { type: Type.STRING },
                },
                required: ['point', 'evidenceReviewIds', 'evidenceLabel'],
              },
            },
          },
          required: [
            'sampleNote',
            'appreciate',
            'struggleWith',
            'recommendBefore',
            'experiencesDiffer',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as Partial<CourseInsightReport>;
    const sanitizeItems = (items: unknown, fallbackItems: typeof fallbackReport.appreciate) => {
      if (!Array.isArray(items) || items.length === 0) return fallbackItems;
      return items.slice(0, 3).map((item: any) => {
        const filteredIds = Array.isArray(item?.evidenceReviewIds)
          ? item.evidenceReviewIds.filter((id: unknown) => typeof id === 'string' && validIds.has(id))
          : [];
        return {
          point: typeof item?.point === 'string' ? item.point : '',
          evidenceReviewIds: filteredIds.length > 0 ? filteredIds : [eligible[0].id],
          evidenceLabel:
            typeof item?.evidenceLabel === 'string' && item.evidenceLabel
              ? item.evidenceLabel
              : `${filteredIds.length || 1} review(s)`,
        };
      });
    };

    const report: CourseInsightReport = {
      source: 'gemini',
      generatedAt: new Date().toISOString(),
      eligibleReviewCount: eligible.length,
      sampleNote:
        typeof parsed.sampleNote === 'string' && parsed.sampleNote
          ? parsed.sampleNote
          : fallbackReport.sampleNote,
      appreciate: sanitizeItems(parsed.appreciate, fallbackReport.appreciate),
      struggleWith: sanitizeItems(parsed.struggleWith, fallbackReport.struggleWith),
      recommendBefore: sanitizeItems(parsed.recommendBefore, fallbackReport.recommendBefore),
      experiencesDiffer: sanitizeItems(parsed.experiencesDiffer, fallbackReport.experiencesDiffer),
    };

    insightsCache.set(cacheKey, report);
    res.json({ insights: report });
  } catch (err) {
    console.warn('Gemini insights fallback triggered:', err);
    insightsCache.set(cacheKey, fallbackReport);
    res.json({ insights: fallbackReport });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CourseGlide server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

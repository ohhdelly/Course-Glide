import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEMO_FACULTY_RESPONSES,
  DEMO_INSTRUCTORS,
  DEMO_MODERATION_REPORTS,
  DEMO_PULSE_RESPONSES,
  DEMO_REVIEWS,
  DEMO_UNIVERSITIES,
  withDemoReviewSignals,
} from './src/data/demoDataset.ts';
import { CatalogueService } from './server/catalogueService.ts';
import { checkAdvisorRateLimit, runAdvisor } from './server/advisorService.ts';
import { resolveLlmConfig } from './server/llm.ts';
import {
  GRADE_BANDS,
  computeCourseStats,
  generateDeterministicInsights,
  generateDeterministicStaffDigest,
  rankAndFilterReviews,
} from './src/utils/trustLens.ts';
import type {
  CourseFilters,
  CourseInsightReport,
  FacultyResponse,
  FacultyResponseStatus,
  GradeBand,
  ModerationReport,
  PulseAggregate,
  PulseResponse,
  PulseThemeCount,
  Review,
  StaffDigest,
  StudyMethodKey,
  UniversityId,
} from './src/types/course.ts';

// Local development keeps secrets in .env.local (Vite's convention); `.env` remains a
// fallback. On Vercel the real environment variables are injected by the platform.
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '.courseglide-demo-store.json');

interface DemoStore {
  reviews: Review[];
  facultyResponses: FacultyResponse[];
  moderationReports: ModerationReport[];
  pulseResponses: PulseResponse[];
  votesByVoterAndReview: Record<string, 'helpful' | 'not_helpful'>;
  savedCoursesByUser: Record<string, string[]>;
}

function normalizeFacultyResponse(response: FacultyResponse): FacultyResponse {
  const seeded = DEMO_FACULTY_RESPONSES.find((item) => item.id === response.id);
  const status: FacultyResponseStatus =
    response.status === 'changed' || response.status === 'explained'
      ? response.status
      : seeded?.status ?? 'heard';
  return { ...response, status };
}

function createInitialStore(): DemoStore {
  return {
    reviews: structuredClone(DEMO_REVIEWS),
    facultyResponses: structuredClone(DEMO_FACULTY_RESPONSES).map(normalizeFacultyResponse),
    moderationReports: structuredClone(DEMO_MODERATION_REPORTS),
    pulseResponses: structuredClone(DEMO_PULSE_RESPONSES),
    votesByVoterAndReview: {},
    savedCoursesByUser: {
      'demo-student': ['math-137', 'cs-135'],
    },
  };
}

function mergeSeedReviews(stored: Review[]): Review[] {
  const known = new Set(stored.map((review) => review.id));
  const added = DEMO_REVIEWS.filter((review) => !known.has(review.id));
  return added.length > 0 ? [...stored, ...structuredClone(added)] : stored;
}

// Seeded demo responses are authoritative: refresh their wording from the seed and
// append any new ones, while leaving responses a presenter added untouched.
function mergeSeedFacultyResponses(stored: FacultyResponse[]): FacultyResponse[] {
  const seedById = new Map(DEMO_FACULTY_RESPONSES.map((item) => [item.id, item]));
  const refreshed = stored.map((response) => {
    const seed = seedById.get(response.id);
    return seed ? structuredClone(seed) : response;
  });
  const known = new Set(refreshed.map((response) => response.id));
  const added = DEMO_FACULTY_RESPONSES.filter((response) => !known.has(response.id));
  return [...refreshed, ...structuredClone(added)].map(normalizeFacultyResponse);
}

function loadStore(): DemoStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DemoStore>;
      if (Array.isArray(parsed.reviews) && parsed.reviews.length > 0) {
        // A persisted store predates new seed reviews, so append any that are
        // missing instead of discarding the reviews a presenter already typed.
        const loaded: DemoStore = {
          reviews: mergeSeedReviews(parsed.reviews.map(withDemoReviewSignals)),
          facultyResponses: Array.isArray(parsed.facultyResponses)
            ? mergeSeedFacultyResponses(parsed.facultyResponses)
            : structuredClone(DEMO_FACULTY_RESPONSES),
          moderationReports: Array.isArray(parsed.moderationReports)
            ? parsed.moderationReports
            : structuredClone(DEMO_MODERATION_REPORTS),
          pulseResponses: Array.isArray(parsed.pulseResponses)
            ? parsed.pulseResponses
            : structuredClone(DEMO_PULSE_RESPONSES),
          votesByVoterAndReview: parsed.votesByVoterAndReview ?? {},
          savedCoursesByUser: parsed.savedCoursesByUser ?? {
            'demo-student': ['math-137', 'cs-135'],
          },
        };
        if (loaded.reviews.length !== parsed.reviews.length) saveStore(loaded);
        return loaded;
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
const catalogue = new CatalogueService(process.env.UWATERLOO_API_KEY);

// Cache AI insights in memory per course + review count
const insightsCache = new Map<string, CourseInsightReport>();
const staffDigestCache = new Map<string, StaffDigest>();

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

const TERM_CALENDAR: Record<string, { start: string; end: string }> = {
  'Winter 2025': { start: '2025-01-06', end: '2025-04-18' },
  'Fall 2025': { start: '2025-09-04', end: '2025-12-19' },
  'Winter 2026': { start: '2026-01-05', end: '2026-04-17' },
  'Spring 2026': { start: '2026-05-04', end: '2026-08-14' },
  'Fall 2026': { start: '2026-09-08', end: '2026-12-18' },
};

function termCalendar(term: string): { start: string; end: string } {
  return TERM_CALENDAR[term] ?? TERM_CALENDAR['Fall 2026'];
}

function activeTerm(now: Date = new Date()): string {
  const starts = Object.entries(TERM_CALENDAR).sort((a, b) => a[1].start.localeCompare(b[1].start));
  const started = starts.filter(([, range]) => new Date(range.start) <= now);
  return started.length > 0 ? started[started.length - 1][0] : starts[0][0];
}

function termWeek(term: string, now: Date = new Date()): number {
  const { start, end } = termCalendar(term);
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (now < startDate) return 1;
  if (now > endDate) return 13;
  const elapsedWeeks = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000));
  return Math.min(13, Math.max(1, elapsedWeeks + 1));
}

function termHasEnded(term: string, now: Date = new Date()): boolean {
  return now > new Date(termCalendar(term).end);
}

/** Explicit week when it is a real teaching week, otherwise the calendar's current week. */
function resolvePulseWeek(term: string, raw: unknown): number {
  const week = Number(raw);
  return Number.isFinite(week) && week >= 1 && week <= 13 ? Math.round(week) : termWeek(term);
}

const PULSE_THEME_BUCKETS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Workload & deadline clustering', pattern: /workload|deadline|same week|spike|cluster|overlap|hours/i },
  { label: 'Assessment & rubric clarity', pattern: /midterm|exam|quiz|rubric|grading|marks?\b|grades?\b/i },
  { label: 'Tutorial & office-hour support', pattern: /tutorial|office hours|\bTA\b|dgd|session/i },
  { label: 'Lecture pacing & explanation', pattern: /lecture|example|explain|pace|fast|clear/i },
  { label: 'Notes, resources & practice', pattern: /notes|textbook|worksheet|practice|resource|recording/i },
];

function aggregatePulseField(
  entries: PulseResponse[],
  field: 'keepsWorking' | 'notWorking' | 'oneChange'
): PulseThemeCount[] {
  return PULSE_THEME_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: entries.filter((entry) => bucket.pattern.test(entry[field])).length,
  }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);
}

const app = express();
app.use(express.json({ limit: '256kb' }));

const advisorLlm = resolveLlmConfig();

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mode: 'demonstration',
    firebaseConfigured: false,
    geminiConfigured: Boolean(aiClient),
    advisor: {
      enabled: Boolean(advisorLlm),
      provider: advisorLlm?.provider ?? null,
      model: advisorLlm?.model ?? null,
      fallbacks: advisorLlm?.models.slice(1) ?? [],
      fallback: 'rules-based parser',
    },
    catalogue: catalogue.getMetadata(),
  });
});

app.post('/api/advisor', async (req, res) => {
  const query = sanitizeText(req.body?.query, 600);
  if (query.length < 3) {
    res.status(400).json({
      error: 'Please describe the course you are looking for in a few words.',
    });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientId =
    sanitizeText(typeof forwarded === 'string' ? forwarded.split(',')[0] : '', 64) ||
    sanitizeText(req.ip, 64) ||
    'anonymous';
  if (!checkAdvisorRateLimit(clientId)) {
    res.status(429).json({
      error:
        'That is a lot of advisor requests in a short time. Please wait a few minutes and try again.',
    });
    return;
  }

  const uniRaw = sanitizeText(req.body?.universityId, 24);
  const universityId: UniversityId =
    uniRaw === 'uwaterloo' || uniRaw === 'uottawa' ? uniRaw : 'all';

  const briefOverride =
    req.body?.briefOverride && typeof req.body.briefOverride === 'object'
      ? req.body.briefOverride
      : undefined;

  try {
    const response = await runAdvisor(
      { query, universityId, ...(briefOverride ? { briefOverride } : {}) },
      { catalogue, reviews: store.reviews }
    );
    res.json(response);
  } catch (err) {
    console.warn('Advisor request failed:', err);
    res.status(500).json({
      error: 'The advisor could not finish that search. Try rephrasing it.',
    });
  }
});

app.get('/api/bootstrap', (req, res) => {
  const userId = sanitizeText(req.query.userId, 64) || 'demo-student';
  const savedCourseIds = store.savedCoursesByUser[userId] ?? [];
  const bootstrapCourses = catalogue.getBootstrapCourses(store.reviews);
  const bootstrapIds = new Set(bootstrapCourses.map((c) => c.id));
  for (const savedId of savedCourseIds) {
    if (!bootstrapIds.has(savedId)) {
      const found = catalogue.getCourseById(savedId);
      if (found) {
        bootstrapCourses.push(found);
        bootstrapIds.add(savedId);
      }
    }
  }

  res.json({
    universities: DEMO_UNIVERSITIES,
    courses: bootstrapCourses,
    catalogueMeta: catalogue.getMetadata(),
    subjects: catalogue.getSubjects('all'),
    instructors: DEMO_INSTRUCTORS,
    reviews: store.reviews,
    facultyResponses: store.facultyResponses,
    moderationReports: store.moderationReports,
    savedCourseIds,
    userVotes: Object.fromEntries(
      Object.entries(store.votesByVoterAndReview)
        .filter(([k]) => k.startsWith(`${userId}::`))
        .map(([k, v]) => [k.split('::')[1], v])
    ),
    capabilities: {
      firebaseConfigured: false,
      geminiConfigured: Boolean(aiClient),
      openDataConfigured: Boolean(process.env.UWATERLOO_API_KEY?.trim()),
      mode: 'demonstration',
    },
  });
});

app.get('/api/courses', (req, res) => {
  const q = sanitizeText(req.query.q, 120);
  const uniRaw = sanitizeText(req.query.universityId, 24);
  const universityId: UniversityId =
    uniRaw === 'uwaterloo' || uniRaw === 'uottawa' ? uniRaw : 'all';
  const termRaw = sanitizeText(req.query.term, 24);
  const term: NonNullable<CourseFilters['term']> =
    termRaw === 'Fall' || termRaw === 'Winter' || termRaw === 'Spring' ? termRaw : 'all';
  const department = sanitizeText(req.query.department, 80) || 'all';
  const levelRaw = Number(req.query.level);
  const level: CourseFilters['level'] =
    levelRaw === 100 || levelRaw === 200 || levelRaw === 300 || levelRaw === 400 || levelRaw === 500
      ? levelRaw
      : 'all';
  const maxDiffRaw = Number(req.query.maxDifficulty);
  const maxDifficulty: CourseFilters['maxDifficulty'] =
    maxDiffRaw === 2 || maxDiffRaw === 3 || maxDiffRaw === 4 || maxDiffRaw === 5
      ? maxDiffRaw
      : 'all';
  const maxHoursRaw = Number(req.query.maxHours);
  const maxHours: CourseFilters['maxHours'] =
    maxHoursRaw === 6 || maxHoursRaw === 10 || maxHoursRaw === 14 ? maxHoursRaw : 'all';
  const hasReviewsRaw = sanitizeText(req.query.hasReviews, 24);
  const hasReviews: CourseFilters['hasReviews'] =
    hasReviewsRaw === 'with_reviews' || hasReviewsRaw === 'without_reviews'
      ? hasReviewsRaw
      : 'all';
  const sortRaw = sanitizeText(req.query.sortBy, 24);
  const sortBy: CourseFilters['sortBy'] =
    sortRaw === 'recommended' ||
    sortRaw === 'reviews' ||
    sortRaw === 'workload_asc' ||
    sortRaw === 'workload_desc' ||
    sortRaw === 'code'
      ? sortRaw
      : 'relevance';

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(60, Number(req.query.limit) || 24));

  const result = catalogue.queryCourses({
    query: q,
    filters: {
      universityId,
      term,
      department,
      level,
      maxDifficulty,
      maxHours,
      hasReviews,
      sortBy,
    },
    reviews: store.reviews,
    page,
    limit,
  });

  res.json(result);
});

app.get('/api/courses/:id', async (req, res) => {
  const courseId = sanitizeText(req.params.id, 64);
  const baseCourse = catalogue.getCourseById(courseId);
  if (!baseCourse) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const scheduleCheck = await catalogue.getTermScheduleStatus(baseCourse);
  const course = {
    ...baseCourse,
    catalogStatus: scheduleCheck.catalogStatus,
    termScheduleNote: scheduleCheck.termScheduleNote,
  };

  const courseReviews = store.reviews.filter((r) => r.courseId === course.id);

  // Same department anchor the client uses, so the API and the UI cannot disagree.
  const departmentReviews = store.reviews.filter((review) => {
    if (review.moderationStatus === 'hidden') return false;
    const owner = catalogue.getCourseById(review.courseId);
    return owner?.universityId === course.universityId && owner?.department === course.department;
  });
  const departmentPrior =
    departmentReviews.length > 0
      ? {
          priorRating:
            departmentReviews.reduce((sum, review) => sum + review.usefulness, 0) /
            departmentReviews.length,
          priorWeight: Math.min(
            8,
            Math.max(2, new Set(departmentReviews.map((review) => review.courseId)).size)
          ),
          priorLabel: course.department,
        }
      : undefined;

  const stats = computeCourseStats(courseReviews, departmentPrior);
  const instructors = DEMO_INSTRUCTORS.filter((i) => i.courseId === course.id);
  const facultyResponses = store.facultyResponses.filter((f) => f.courseId === course.id);

  res.json({
    course,
    stats,
    reviews: courseReviews,
    instructors,
    facultyResponses,
  });
});

app.post('/api/saved-courses', (req, res) => {
  const userId = sanitizeText(req.body?.userId, 64) || 'demo-student';
  const courseId = sanitizeText(req.body?.courseId, 64);
  if (!catalogue.hasCourse(courseId)) {
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
  const course = catalogue.getCourseById(courseId);
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
  const mentalEffortNum = Number(body.mentalEffort);
  const mentalEffort = (
    [1, 2, 3, 4, 5].includes(mentalEffortNum) ? mentalEffortNum : difficulty
  ) as NonNullable<Review['mentalEffort']>;
  const stressNum = Number(body.stress);
  const stress = (
    [1, 2, 3, 4, 5].includes(stressNum) ? stressNum : difficulty
  ) as NonNullable<Review['stress']>;
  const targetGradeRaw = sanitizeText(body.targetGrade, 12);
  const targetGrade = (GRADE_BANDS as string[]).includes(targetGradeRaw)
    ? (targetGradeRaw as GradeBand)
    : undefined;
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
    mentalEffort,
    stress,
    ...(targetGrade ? { targetGrade } : {}),
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
  catalogue.invalidateCache();
  saveStore(store);

  res.status(201).json({ review: newReview, course });
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
  catalogue.invalidateCache();
  saveStore(store);

  res.json({ report, review });
});

app.post('/api/faculty-responses', (req, res) => {
  const body = req.body ?? {};
  const courseId = sanitizeText(body.courseId, 64);
  const course = catalogue.getCourseById(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const instructorName = sanitizeText(body.instructorName, 80) || 'Course Instructor (Demo)';
  const role = body.role === 'ta' ? 'ta' : 'professor';
  const term = sanitizeText(body.term, 32) || 'Upcoming Term';
  const themeAddressed = sanitizeText(body.themeAddressed, 140);
  const responseText = sanitizeText(body.responseText, 700);
  const status: FacultyResponseStatus =
    body.status === 'changed' || body.status === 'explained' ? body.status : 'heard';

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
    status,
    updatedAt: new Date().toISOString(),
    isDemo: true,
  };

  store.facultyResponses.unshift(newResponse);
  saveStore(store);

  res.status(201).json({ facultyResponse: newResponse });
});

app.get('/api/pulse', (req, res) => {
  const courseId = sanitizeText(req.query.courseId, 64);
  const course = catalogue.getCourseById(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const userId = sanitizeText(req.query.userId, 64) || 'demo-student';
  const term = sanitizeText(req.query.term, 32) || activeTerm();
  const week = resolvePulseWeek(term, req.query.week);

  const entries = store.pulseResponses.filter(
    (entry) => entry.courseId === course.id && entry.term === term
  );
  const usedByStudent = entries.filter((entry) => entry.userId === userId).length;
  const sealed = !termHasEnded(term);

  const pulse: PulseAggregate = {
    courseId: course.id,
    term,
    week,
    windowOpen: week >= 4 && week <= 8,
    windowNote:
      week < 4
        ? 'Not open yet: the pulse runs in weeks 4–8, once the term has settled.'
        : week > 8
        ? 'Closed for this term. The next window opens in week 4.'
        : 'Open: three one-tap questions, no essay required.',
    responseCount: entries.length,
    promptsRemaining: Math.max(0, 2 - usedByStudent),
    sealed,
    sealedUntil: sealed ? termCalendar(term).end : null,
    themes: sealed
      ? { keepsWorking: [], notWorking: [], oneChange: [] }
      : {
          keepsWorking: aggregatePulseField(entries, 'keepsWorking'),
          notWorking: aggregatePulseField(entries, 'notWorking'),
          oneChange: aggregatePulseField(entries, 'oneChange'),
        },
  };

  res.json({ pulse });
});

app.post('/api/pulse', (req, res) => {
  const body = req.body ?? {};
  const courseId = sanitizeText(body.courseId, 64);
  const course = catalogue.getCourseById(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const userId = sanitizeText(body.userId, 64) || 'demo-student';
  const term = sanitizeText(body.term, 32) || activeTerm();
  const week = resolvePulseWeek(term, body.week);

  if (week < 4 || week > 8) {
    res.status(400).json({
      error:
        'The mid-term pulse is open only in weeks 4–8. Answering outside that window produces a biased sample, so it is closed.',
    });
    return;
  }

  const alreadySent = store.pulseResponses.filter(
    (entry) =>
      entry.courseId === course.id && entry.userId === userId && entry.term === term
  ).length;
  if (alreadySent >= 2) {
    res.status(409).json({
      error:
        'You have already sent two mid-term pulses for this course this term. That is the cap. Thanks for answering.',
      promptsRemaining: 0,
    });
    return;
  }

  const keepsWorking = sanitizeText(body.keepsWorking, 300);
  const notWorking = sanitizeText(body.notWorking, 300);
  const oneChange = sanitizeText(body.oneChange, 300);
  const answered = [keepsWorking, notWorking, oneChange].filter((value) => value.length >= 5);
  if (answered.length === 0) {
    res.status(400).json({ error: 'Please answer at least one of the three questions.' });
    return;
  }

  const violation = detectPolicyViolation(`${keepsWorking} ${notWorking} ${oneChange}`);
  if (violation) {
    res.status(400).json({ error: violation });
    return;
  }

  const entry: PulseResponse = {
    id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    courseId: course.id,
    term,
    week,
    userId,
    keepsWorking,
    notWorking,
    oneChange,
    createdAt: new Date().toISOString(),
  };

  store.pulseResponses.unshift(entry);
  saveStore(store);

  res.status(201).json({
    pulse: {
      id: entry.id,
      term,
      week,
      createdAt: entry.createdAt,
      sealed: !termHasEnded(term),
      promptsRemaining: Math.max(0, 2 - (alreadySent + 1)),
    },
  });
});

app.post('/api/staff-digest', async (req, res) => {
  const courseId = sanitizeText(req.body?.courseId, 64);
  const forceRefresh = Boolean(req.body?.forceRefresh);
  const course = catalogue.getCourseById(courseId);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  const courseReviews = store.reviews.filter((review) => review.courseId === course.id);
  const eligible = rankAndFilterReviews(courseReviews, 'most_informative', 'all').slice(0, 8);
  const cacheKey = `${course.id}:${eligible.map((review) => review.id).join(',')}`;

  if (!forceRefresh && staffDigestCache.has(cacheKey)) {
    res.json({ digest: staffDigestCache.get(cacheKey) });
    return;
  }

  const fallback = generateDeterministicStaffDigest(course, courseReviews);

  if (!aiClient || eligible.length === 0) {
    staffDigestCache.set(cacheKey, fallback);
    res.json({ digest: fallback });
    return;
  }

  const validIds = new Set(eligible.map((review) => review.id));

  try {
    const reviewDigest = eligible.map((review) => ({
      id: review.id,
      term: review.term,
      workedWell: review.whatWorkedWell,
      challenging: review.whatWasChallenging,
      advice: review.practicalAdvice,
    }));

    const prompt = `Build a Start / Stop / Continue digest for the teaching team of ${course.code} using ONLY the reviews below.
Each item must quote or closely paraphrase one review and cite its exact review id in evidenceReviewIds.
"start" = something the team should begin doing, "stop" = something to stop or reduce, "keep" = something working that should be preserved.
Also return up to 3 short checklist actions for the teaching team.
Never invent statistics, grades, or student identities.

Reviews JSON:
${JSON.stringify(reviewDigest, null, 2)}`;

    const itemSchema = {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        theme: { type: Type.STRING },
        evidenceReviewIds: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['text', 'theme', 'evidenceReviewIds'],
    };

    const response = await aiClient.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are CourseGlide Staff Digest, a teaching-team assistant. Produce concrete, non-punitive actions grounded strictly in the supplied anonymised student reviews.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            start: { type: Type.ARRAY, items: itemSchema },
            stop: { type: Type.ARRAY, items: itemSchema },
            keep: { type: Type.ARRAY, items: itemSchema },
            checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['start', 'stop', 'keep', 'checklist'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as Partial<StaffDigest>;
    const sanitizeItems = (items: unknown, fallbackItems: StaffDigest['start']) => {
      if (!Array.isArray(items) || items.length === 0) return fallbackItems;
      return items.slice(0, 3).map((item: any) => {
        const ids = Array.isArray(item?.evidenceReviewIds)
          ? item.evidenceReviewIds.filter((id: unknown) => typeof id === 'string' && validIds.has(id))
          : [];
        return {
          text: sanitizeText(item?.text, 260),
          theme: sanitizeText(item?.theme, 80) || 'General course experience',
          evidenceReviewIds: ids.length > 0 ? ids : [eligible[0].id],
          term: eligible.find((review) => review.id === (ids[0] ?? eligible[0].id))?.term ?? '',
        };
      });
    };

    const digest: StaffDigest = {
      ...fallback,
      source: 'gemini',
      generatedAt: new Date().toISOString(),
      start: sanitizeItems(parsed.start, fallback.start),
      stop: sanitizeItems(parsed.stop, fallback.stop),
      keep: sanitizeItems(parsed.keep, fallback.keep),
      checklist:
        Array.isArray(parsed.checklist) && parsed.checklist.length > 0
          ? parsed.checklist
              .slice(0, 3)
              .map((item) => sanitizeText(item, 220))
              .filter(Boolean)
          : fallback.checklist,
    };

    staffDigestCache.set(cacheKey, digest);
    res.json({ digest });
  } catch (err) {
    console.warn('Gemini staff digest fallback triggered:', err);
    staffDigestCache.set(cacheKey, fallback);
    res.json({ digest: fallback });
  }
});

app.post('/api/insights', async (req, res) => {
  const courseId = sanitizeText(req.body?.courseId, 64);
  const forceRefresh = Boolean(req.body?.forceRefresh);
  const course = catalogue.getCourseById(courseId);
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

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '127.0.0.1');
  });
}

/**
 * Another process may already own the requested port (a loopback-only
 * listener still shadows us, even though the wildcard bind succeeds). Walk
 * forward to the first free port so `npm run dev` always starts somewhere
 * reachable, and say which port it landed on.
 */
async function resolvePort(requested: number): Promise<number> {
  for (let port = requested; port < requested + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  return requested;
}

async function startServer() {
  const requestedPort = Number(process.env.PORT) || 3000;
  // Skipping a busy port is a dev convenience only: in production the server must
  // bind exactly the port it was given, so a platform health check never gets a
  // silently relocated app — it fails loudly instead.
  const isProductionRuntime = process.env.NODE_ENV === 'production';
  if (isProductionRuntime && !(await isPortAvailable(requestedPort))) {
    console.error(`Port ${requestedPort} is already in use — refusing to start in production.`);
    process.exit(1);
  }
  const PORT = isProductionRuntime ? requestedPort : await resolvePort(requestedPort);

  if (PORT !== requestedPort) {
    console.log(`Port ${requestedPort} is already in use — starting on port ${PORT} instead.`);
  }

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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`CourseGlide server listening on http://localhost:${PORT}`);
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`Could not start the server on port ${PORT}: ${error.message}`);
    console.error('Free that port or pick another one, e.g. PORT=3020 npm run dev');
    process.exit(1);
  });
}

export default app;

// Vercel imports this module to get the request handler; there is no long-lived
// listener there, and Vercel serves the built assets itself.
if (!process.env.VERCEL) {
  void startServer();
}

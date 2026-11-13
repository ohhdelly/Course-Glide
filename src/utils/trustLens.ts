import type {
  Course,
  CourseFilters,
  CourseInsightReport,
  CourseStats,
  EnrichedReview,
  InsightItem,
  Review,
  StudyFitInsight,
  StudyMethodKey,
  StudyMethodStat,
  StudyPreference,
  TrustLabel,
  TrustLensEvaluation,
  TrustLensMode,
} from '../types/course.ts';

export const STUDY_METHOD_CATALOG: Record<
  StudyMethodKey,
  { label: string; preferenceCategory: Exclude<StudyPreference, 'all'> }
> = {
  practice_problems: { label: 'Weekly practice problems', preferenceCategory: 'independent' },
  lecture_attendance: { label: 'Live lecture attendance', preferenceCategory: 'structured_notes' },
  textbook_reading: { label: 'Textbook & proof readings', preferenceCategory: 'structured_notes' },
  study_groups: { label: 'Peer study groups', preferenceCategory: 'collaborative' },
  spaced_repetition: { label: 'Flashcards & spaced repetition', preferenceCategory: 'visual' },
  tutorial_sessions: { label: 'Weekly tutorial sessions', preferenceCategory: 'collaborative' },
  past_exams: { label: 'Timed past examinations', preferenceCategory: 'independent' },
  project_based: { label: 'Concept mapping & visual diagrams', preferenceCategory: 'visual' },
};

const ACADEMIC_DOMAIN_KEYWORDS = [
  'midterm',
  'final',
  'exam',
  'quiz',
  'quizzes',
  'assignment',
  'assignments',
  'lab',
  'labs',
  'tutorial',
  'tutorials',
  'lecture',
  'lectures',
  'syllabus',
  'grading',
  'rubric',
  'proof',
  'proofs',
  'recursion',
  'racket',
  'calculus',
  'integral',
  'derivatives',
  'mechanics',
  'statics',
  'microeconomics',
  'problem set',
  'office hours',
  'textbook',
  'weekly',
  'hours',
  'practice',
  'concept',
  'feedback',
  'workload',
  'theorem',
  'epsilon',
  'delta',
  'complexity',
  'runtime',
];

const SPAM_OR_OFFTOPIC_PATTERNS = [
  /buy\s+(essay|notes|homework)/i,
  /http[s]?:\/\//i,
  /free\s+crypto/i,
  /subscribe\s+to\s+my/i,
  /lol+\s*idk/i,
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardWordSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeText(a).split(' ').filter((w) => w.length > 2));
  const tokensB = new Set(normalizeText(b).split(' ').filter((w) => w.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function parseTermRecencyScore(term: string): number {
  const yearMatch = term.match(/20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 2024;
  const seasonWeight = /fall/i.test(term) ? 0.9 : /summer|spring/i.test(term) ? 0.6 : 0.3;
  const base = Math.max(0, Math.min(10, (year - 2022) * 3 + seasonWeight * 3));
  return Math.round(base * 10) / 10;
}

/**
 * Evaluates the informational utility of a student review using transparent,
 * sentiment-neutral signals. Negative reviews and strong criticism are NEVER
 * penalized for sentiment.
 */
export function evaluateReviewQuality(
  review: Review,
  allCourseReviews: Review[]
): TrustLensEvaluation {
  const combinedText = [
    review.overallExperience,
    review.whatWorkedWell,
    review.whatWasChallenging,
    review.practicalAdvice,
  ]
    .filter(Boolean)
    .join(' ');

  const normalized = normalizeText(combinedText);
  const wordCount = normalized ? normalized.split(' ').length : 0;

  // 1. Course-specific domain signals
  const matchedKeywords = ACADEMIC_DOMAIN_KEYWORDS.filter((kw) =>
    normalized.includes(kw)
  );
  const hasCourseSpecificDetails = matchedKeywords.length >= 2;
  const hasAssessmentOrWorkloadContext =
    /midterm|final|exam|quiz|assignment|lab|tutorial|hours|grading|problem set|rubric/i.test(
      combinedText
    ) && review.weeklyHours > 0;

  // 2. Actionable structure signals
  const hasWellAndChallenge =
    review.whatWorkedWell.trim().length >= 18 &&
    review.whatWasChallenging.trim().length >= 18;
  const hasActionableAdvice =
    review.practicalAdvice.trim().length >= 20 || review.studyMethods.length >= 2;

  // 3. Duplicate / repetitive check against other reviews for same course
  // Preserve the canonical original (higher helpful votes, verified enrollment, or earlier submission)
  let isDuplicateOrRepetitive = false;
  for (const other of allCourseReviews) {
    if (other.id === review.id) continue;
    const otherCombined = [
      other.overallExperience,
      other.whatWorkedWell,
      other.whatWasChallenging,
      other.practicalAdvice,
    ].join(' ');
    const sim = jaccardWordSimilarity(combinedText, otherCombined);
    if (sim >= 0.72) {
      const otherIsCanonical =
        other.helpfulVotes > review.helpfulVotes ||
        (other.helpfulVotes === review.helpfulVotes &&
          other.verifiedEnrollment &&
          !review.verifiedEnrollment) ||
        (other.helpfulVotes === review.helpfulVotes &&
          other.verifiedEnrollment === review.verifiedEnrollment &&
          new Date(other.createdAt).getTime() < new Date(review.createdAt).getTime());
      if (otherIsCanonical) {
        isDuplicateOrRepetitive = true;
        break;
      }
    }
  }

  // 4. Low information / spam check
  const matchesSpamPattern = SPAM_OR_OFFTOPIC_PATTERNS.some((p) => p.test(combinedText));
  const isLowInformation =
    wordCount < 16 ||
    matchesSpamPattern ||
    (!hasCourseSpecificDetails && wordCount < 25 && !hasActionableAdvice);

  // 5. Sentiment-neutral scoring (0 - 100)
  let score = 20;
  if (wordCount >= 25) score += 15;
  if (wordCount >= 50) score += 12;
  if (matchedKeywords.length >= 2) score += 16;
  if (matchedKeywords.length >= 4) score += 8;
  if (hasAssessmentOrWorkloadContext) score += 10;
  if (hasWellAndChallenge) score += 10;
  if (hasActionableAdvice) score += 10;
  if (review.verifiedEnrollment) score += 5;

  const helpfulnessNet = review.helpfulVotes - review.notHelpfulVotes;
  score += Math.max(-8, Math.min(10, helpfulnessNet * 1.5));

  const recencyScore = parseTermRecencyScore(review.term);
  score += Math.min(6, recencyScore * 0.5);

  if (isDuplicateOrRepetitive) score -= 35;
  if (isLowInformation) score -= 28;
  if (matchesSpamPattern) score -= 40;

  const clampedScore = Math.max(5, Math.min(100, Math.round(score)));

  // 6. Evidence-backed contextual labels (never fabricated)
  const labels: TrustLabel[] = [];
  if (wordCount >= 40 && hasWellAndChallenge && !isDuplicateOrRepetitive) {
    labels.push('Detailed Feedback');
  }
  if (hasCourseSpecificDetails && hasAssessmentOrWorkloadContext) {
    labels.push('Course-Specific');
  }
  if (hasActionableAdvice && !isLowInformation) {
    labels.push('Actionable Advice');
  }
  if (hasWellAndChallenge && !review.recommended && clampedScore >= 60) {
    labels.push('Balanced Critique');
  }
  if (review.verifiedEnrollment) {
    labels.push('Enrollment Verified');
  }
  if (isDuplicateOrRepetitive) {
    labels.push('Possible Duplicate');
  } else if (isLowInformation) {
    labels.push('Limited Context');
  } else if (!hasCourseSpecificDetails && wordCount < 35) {
    labels.push('Low Specificity');
  }

  const tier: TrustLensEvaluation['tier'] =
    clampedScore >= 62 && !isDuplicateOrRepetitive && !isLowInformation
      ? 'most_informative'
      : clampedScore >= 38 && !isDuplicateOrRepetitive
      ? 'standard'
      : 'limited';

  const explanationParts: string[] = [];
  if (hasCourseSpecificDetails) {
    explanationParts.push(
      `References ${matchedKeywords.slice(0, 3).join(', ')}`
    );
  }
  if (hasWellAndChallenge) {
    explanationParts.push('includes both strengths and challenges');
  }
  if (hasActionableAdvice) {
    explanationParts.push('offers preparation advice');
  }
  if (isDuplicateOrRepetitive) {
    explanationParts.push('high lexical overlap with another submission');
  } else if (isLowInformation) {
    explanationParts.push('brief entry with limited course-specific detail');
  }

  return {
    score: clampedScore,
    tier,
    labels,
    signals: {
      hasCourseSpecificDetails,
      hasAssessmentOrWorkloadContext,
      hasActionableAdvice,
      isDuplicateOrRepetitive,
      isLowInformation,
      recencyScore,
      helpfulnessNet,
    },
    explanation:
      explanationParts.length > 0
        ? explanationParts.join(' · ')
        : 'Standard student reflection',
  };
}

export function enrichReviewsWithTrustLens(reviews: Review[]): EnrichedReview[] {
  const byCourse = new Map<string, Review[]>();
  for (const r of reviews) {
    const list = byCourse.get(r.courseId) ?? [];
    list.push(r);
    byCourse.set(r.courseId, list);
  }

  return reviews.map((review) => ({
    ...review,
    trustLens: evaluateReviewQuality(review, byCourse.get(review.courseId) ?? [review]),
  }));
}

export function rankAndFilterReviews(
  reviews: Review[],
  mode: TrustLensMode,
  sentimentFilter: 'all' | 'recommended' | 'critical' = 'all'
): EnrichedReview[] {
  const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
  const enriched = enrichReviewsWithTrustLens(visible);

  const bySentiment = enriched.filter((r) => {
    if (sentimentFilter === 'recommended') return r.recommended;
    if (sentimentFilter === 'critical') return !r.recommended;
    return true;
  });

  if (mode === 'most_informative') {
    const informative = bySentiment.filter((r) => r.trustLens.tier === 'most_informative');
    const pool = informative.length > 0 ? informative : bySentiment.filter((r) => r.trustLens.tier !== 'limited');
    return [...pool].sort((a, b) => {
      if (b.trustLens.score !== a.trustLens.score) {
        return b.trustLens.score - a.trustLens.score;
      }
      return b.helpfulVotes - a.helpfulVotes;
    });
  }

  if (mode === 'most_recent') {
    return [...bySentiment].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 'all' mode shows all non-hidden reviews including limited-context / repetitive entries
  return [...bySentiment].sort((a, b) => {
    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.trustLens.score - a.trustLens.score;
  });
}

export function computeCourseStats(reviews: Review[]): CourseStats {
  const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
  const enriched = enrichReviewsWithTrustLens(visible);
  const n = visible.length;

  if (n === 0) {
    return {
      responseCount: 0,
      informativeCount: 0,
      avgDifficulty: 0,
      avgWeeklyHours: 0,
      recommendationRate: 0,
      avgUsefulness: 0,
      confidenceLevel: 'limited',
      confidenceNote: 'No student responses recorded yet.',
      difficultyDistribution: [1, 2, 3, 4, 5].map((d) => ({
        label: `${d}/5`,
        count: 0,
        percentage: 0,
      })),
      hoursDistribution: [
        { label: '< 6 hrs', count: 0, percentage: 0 },
        { label: '6–10 hrs', count: 0, percentage: 0 },
        { label: '11–15 hrs', count: 0, percentage: 0 },
        { label: '16+ hrs', count: 0, percentage: 0 },
      ],
      usefulnessDistribution: [1, 2, 3, 4, 5].map((u) => ({
        label: `${u}/5`,
        count: 0,
        percentage: 0,
      })),
      termTrends: [],
      studyStrategyStats: Object.entries(STUDY_METHOD_CATALOG).map(([key, meta]) => ({
        key: key as StudyMethodKey,
        label: meta.label,
        preferenceCategory: meta.preferenceCategory,
        usedCount: 0,
        helpfulCount: 0,
        helpfulPercentage: 0,
      })),
    };
  }

  const informativeCount = enriched.filter(
    (r) => r.trustLens.tier === 'most_informative'
  ).length;

  const avgDifficulty =
    Math.round((visible.reduce((acc, r) => acc + r.difficulty, 0) / n) * 10) / 10;
  const avgWeeklyHours =
    Math.round((visible.reduce((acc, r) => acc + r.weeklyHours, 0) / n) * 10) / 10;
  const recommendationRate = Math.round(
    (visible.filter((r) => r.recommended).length / n) * 100
  );
  const avgUsefulness =
    Math.round((visible.reduce((acc, r) => acc + r.usefulness, 0) / n) * 10) / 10;

  const confidenceLevel: CourseStats['confidenceLevel'] =
    n >= 7 ? 'strong' : n >= 4 ? 'moderate' : 'limited';

  const confidenceNote =
    confidenceLevel === 'limited'
      ? `Small sample size (${n} self-reported responses). Interpret averages cautiously.`
      : confidenceLevel === 'moderate'
      ? `Moderate sample (${n} self-reported responses, ${informativeCount} detailed).`
      : `Solid response pool (${n} self-reported responses, ${informativeCount} detailed).`;

  const difficultyDistribution = [1, 2, 3, 4, 5].map((level) => {
    const count = visible.filter((r) => r.difficulty === level).length;
    return {
      label: `${level}/5`,
      count,
      percentage: Math.round((count / n) * 100),
    };
  });

  const hoursBuckets = [
    { label: '< 6 hrs', test: (h: number) => h < 6 },
    { label: '6–10 hrs', test: (h: number) => h >= 6 && h <= 10 },
    { label: '11–15 hrs', test: (h: number) => h >= 11 && h <= 15 },
    { label: '16+ hrs', test: (h: number) => h >= 16 },
  ];
  const hoursDistribution = hoursBuckets.map((b) => {
    const count = visible.filter((r) => b.test(r.weeklyHours)).length;
    return {
      label: b.label,
      count,
      percentage: Math.round((count / n) * 100),
    };
  });

  const usefulnessDistribution = [1, 2, 3, 4, 5].map((level) => {
    const count = visible.filter((r) => r.usefulness === level).length;
    return {
      label: `${level}/5`,
      count,
      percentage: Math.round((count / n) * 100),
    };
  });

  // Group by academic term
  const termMap = new Map<string, Review[]>();
  for (const r of visible) {
    const list = termMap.get(r.term) ?? [];
    list.push(r);
    termMap.set(r.term, list);
  }
  const termTrends = Array.from(termMap.entries())
    .sort((a, b) => parseTermRecencyScore(a[0]) - parseTermRecencyScore(b[0]))
    .map(([term, list]) => ({
      term,
      reviewCount: list.length,
      avgDifficulty:
        Math.round((list.reduce((s, r) => s + r.difficulty, 0) / list.length) * 10) / 10,
      avgWeeklyHours:
        Math.round((list.reduce((s, r) => s + r.weeklyHours, 0) / list.length) * 10) / 10,
      recommendationRate: Math.round(
        (list.filter((r) => r.recommended).length / list.length) * 100
      ),
    }));

  // Study strategy stats
  const studyStrategyStats: StudyMethodStat[] = Object.entries(STUDY_METHOD_CATALOG)
    .map(([key, meta]) => {
      const k = key as StudyMethodKey;
      const users = visible.filter((r) => r.studyMethods.includes(k));
      const helpfulUsers = users.filter((r) =>
        r.helpfulMethods ? r.helpfulMethods.includes(k) : r.recommended || r.usefulness >= 4
      );
      const usedCount = users.length;
      const helpfulCount = helpfulUsers.length;
      return {
        key: k,
        label: meta.label,
        preferenceCategory: meta.preferenceCategory,
        usedCount,
        helpfulCount,
        helpfulPercentage:
          usedCount > 0 ? Math.round((helpfulCount / usedCount) * 100) : 0,
      };
    })
    .filter((s) => s.usedCount > 0)
    .sort((a, b) => b.usedCount - a.usedCount || b.helpfulPercentage - a.helpfulPercentage);

  return {
    responseCount: n,
    informativeCount,
    avgDifficulty,
    avgWeeklyHours,
    recommendationRate,
    avgUsefulness,
    confidenceLevel,
    confidenceNote,
    difficultyDistribution,
    hoursDistribution,
    usefulnessDistribution,
    termTrends,
    studyStrategyStats,
  };
}

export function generateDeterministicInsights(
  course: Course,
  reviews: Review[]
): CourseInsightReport {
  const ranked = rankAndFilterReviews(reviews, 'most_informative', 'all');
  const eligible = ranked.slice(0, 8);
  const count = eligible.length;

  const sampleNote =
    count < 4
      ? `Based on ${count} substantive review${count === 1 ? '' : 's'} — limited sample size; treat patterns as preliminary.`
      : `Synthesized directly from ${count} substantive, course-specific student reviews for ${course.code}.`;

  const appreciate: InsightItem[] = [];
  const struggleWith: InsightItem[] = [];
  const recommendBefore: InsightItem[] = [];
  const experiencesDiffer: InsightItem[] = [];

  for (const r of eligible) {
    if (r.whatWorkedWell.trim().length > 20 && appreciate.length < 3) {
      appreciate.push({
        point: r.whatWorkedWell.trim(),
        evidenceReviewIds: [r.id],
        evidenceLabel: `${r.authorAlias} · ${r.term}`,
      });
    }
    if (r.whatWasChallenging.trim().length > 20 && struggleWith.length < 3) {
      struggleWith.push({
        point: r.whatWasChallenging.trim(),
        evidenceReviewIds: [r.id],
        evidenceLabel: `${r.authorAlias} · ${r.term}`,
      });
    }
    if (r.practicalAdvice.trim().length > 20 && recommendBefore.length < 3) {
      recommendBefore.push({
        point: r.practicalAdvice.trim(),
        evidenceReviewIds: [r.id],
        evidenceLabel: `${r.authorAlias} · ${r.term}`,
      });
    }
  }

  const positive = eligible.filter((r) => r.recommended);
  const critical = eligible.filter((r) => !r.recommended);
  if (positive.length > 0 && critical.length > 0) {
    experiencesDiffer.push({
      point: `Students who found the pace manageable (${positive[0].weeklyHours} hrs/wk) appreciated ${positive[0].whatWorkedWell.slice(0, 90).trim()}..., whereas students reporting higher friction (${critical[0].weeklyHours} hrs/wk) noted ${critical[0].whatWasChallenging.slice(0, 90).trim()}...`,
      evidenceReviewIds: [positive[0].id, critical[0].id],
      evidenceLabel: `Contrasting ${positive[0].term} & ${critical[0].term} accounts`,
    });
  } else if (eligible.length >= 2) {
    const hoursMin = Math.min(...eligible.map((r) => r.weeklyHours));
    const hoursMax = Math.max(...eligible.map((r) => r.weeklyHours));
    experiencesDiffer.push({
      point: `Self-reported weekly workload varied between ${hoursMin} and ${hoursMax} hours depending on prior background and weekly problem-set pacing.`,
      evidenceReviewIds: [eligible[0].id, eligible[1].id],
      evidenceLabel: `${eligible.length} reviewed responses`,
    });
  }

  return {
    source: 'deterministic',
    generatedAt: new Date().toISOString(),
    eligibleReviewCount: count,
    sampleNote,
    appreciate,
    struggleWith,
    recommendBefore,
    experiencesDiffer,
  };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function scoreCourseSearchMatch(
  course: Course,
  instructorNames: string[],
  rawQuery: string
): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 1;

  const compactQ = q.replace(/\s+/g, '');
  const compactCode = course.code.toLowerCase().replace(/\s+/g, '');
  const lowerTitle = course.title.toLowerCase();
  const lowerDept = course.department.toLowerCase();
  const lowerUni = course.universityName.toLowerCase();

  if (compactCode === compactQ) return 100;
  if (compactCode.startsWith(compactQ)) return 90;
  if (compactCode.includes(compactQ)) return 75;
  if (lowerTitle.includes(q)) return 70;
  if (instructorNames.some((n) => n.toLowerCase().includes(q))) return 65;
  if (lowerDept.includes(q) || lowerUni.includes(q)) return 50;

  // Token-level typo tolerance (e.g., "calculas" -> "calculus", "microeconmics")
  const queryTokens = q.split(/\s+/).filter((t) => t.length >= 3);
  const targetTokens = `${course.code} ${course.title} ${course.department} ${instructorNames.join(' ')}`
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  let fuzzyHits = 0;
  for (const qt of queryTokens) {
    const matched = targetTokens.some((tt) => {
      if (tt.includes(qt)) return true;
      if (Math.abs(tt.length - qt.length) <= 2 && levenshtein(qt, tt) <= 2) return true;
      return false;
    });
    if (matched) fuzzyHits++;
  }

  if (queryTokens.length > 0 && fuzzyHits === queryTokens.length) {
    return 45;
  }
  if (fuzzyHits > 0) {
    return 25;
  }
  return 0;
}

export function filterAndSearchCourses(
  courses: Course[],
  statsMap: Record<string, CourseStats>,
  instructorsByCourse: Record<string, string[]>,
  query: string,
  filters: CourseFilters
): Course[] {
  const scored = courses
    .map((course) => {
      const stats = statsMap[course.id];
      const matchScore = scoreCourseSearchMatch(
        course,
        instructorsByCourse[course.id] ?? [],
        query
      );
      return { course, stats, matchScore };
    })
    .filter(({ course, stats, matchScore }) => {
      if (query.trim() && matchScore === 0) return false;
      if (filters.universityId !== 'all' && course.universityId !== filters.universityId) {
        return false;
      }
      if (filters.department !== 'all' && course.department !== filters.department) {
        return false;
      }
      if (filters.level !== 'all' && course.level !== filters.level) {
        return false;
      }
      if (
        filters.maxDifficulty !== 'all' &&
        stats &&
        stats.avgDifficulty > filters.maxDifficulty
      ) {
        return false;
      }
      if (
        filters.maxHours !== 'all' &&
        stats &&
        stats.avgWeeklyHours > filters.maxHours
      ) {
        return false;
      }
      return true;
    });

  scored.sort((a, b) => {
    if (filters.sortBy === 'relevance') {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (b.stats?.responseCount ?? 0) - (a.stats?.responseCount ?? 0);
    }
    if (filters.sortBy === 'recommended') {
      return (b.stats?.recommendationRate ?? 0) - (a.stats?.recommendationRate ?? 0);
    }
    if (filters.sortBy === 'reviews') {
      return (b.stats?.responseCount ?? 0) - (a.stats?.responseCount ?? 0);
    }
    if (filters.sortBy === 'workload_asc') {
      return (a.stats?.avgWeeklyHours ?? 0) - (b.stats?.avgWeeklyHours ?? 0);
    }
    if (filters.sortBy === 'workload_desc') {
      return (b.stats?.avgWeeklyHours ?? 0) - (a.stats?.avgWeeklyHours ?? 0);
    }
    return 0;
  });

  return scored.map((s) => s.course);
}

export function computeStudyFit(
  preference: StudyPreference,
  stats: CourseStats,
  reviews: EnrichedReview[]
): StudyFitInsight {
  const matchingStrategies =
    preference === 'all'
      ? stats.studyStrategyStats
      : stats.studyStrategyStats.filter((s) => s.preferenceCategory === preference);

  const matchingKeys = new Set(matchingStrategies.map((s) => s.key));
  const supportingExcerpts = reviews
    .filter(
      (r) =>
        r.trustLens.tier !== 'limited' &&
        r.practicalAdvice.trim().length > 15 &&
        (preference === 'all' || r.studyMethods.some((m) => matchingKeys.has(m)))
    )
    .slice(0, 3)
    .map((r) => ({
      reviewId: r.id,
      authorAlias: r.authorAlias,
      term: r.term,
      advice: r.practicalAdvice,
    }));

  const preferenceLabels: Record<StudyPreference, string> = {
    all: 'All learning approaches',
    independent: 'Independent problem-solving',
    collaborative: 'Collaborative & peer-guided learning',
    structured_notes: 'Structured lectures & textbook study',
    visual: 'Visual mapping & spaced recall',
  };

  const topStrategy = matchingStrategies[0];
  const headline = topStrategy
    ? `For ${preferenceLabels[preference].toLowerCase()}, ${topStrategy.helpfulPercentage}% of ${topStrategy.usedCount} respondents who used ${topStrategy.label.toLowerCase()} reported finding it helpful.`
    : `No respondents in this sample specifically logged ${preferenceLabels[preference].toLowerCase()} methods yet.`;

  return {
    preference,
    headline,
    matchingStrategies,
    supportingExcerpts,
    disclaimer:
      'Self-reported correlations reflect student perceptions rather than guaranteed grade outcomes.',
  };
}

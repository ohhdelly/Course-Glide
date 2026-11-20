import type {
  Course,
  CourseFilters,
  CourseInsightReport,
  CourseStats,
  EffortToSuccessBand,
  EnrichedReview,
  GradeBand,
  InsightItem,
  InstructorProfile,
  LoadProfile,
  PeakWeekMap,
  RatingRange,
  Review,
  StaffDigest,
  StaffDigestItem,
  StudyFitInsight,
  StudyMethodKey,
  StudyMethodStat,
  StudyPreference,
  TeachingTeamTheme,
  TeachingTeamView,
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

function parseTermKey(term: string): { year: number; seasonRank: number } {
  const yearMatch = term.match(/20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 2024;
  const seasonRank = /fall/i.test(term) ? 3 : /summer/i.test(term) ? 2 : /spring/i.test(term) ? 1 : 0;
  return { year, seasonRank };
}

/** How many academic terms `term` sits behind `reference` (0 = same term). */
function termDistance(term: string, reference: string): number {
  const a = parseTermKey(term);
  const b = parseTermKey(reference);
  return Math.max(0, (b.year - a.year) * 4 + (b.seasonRank - a.seasonRank));
}

/**
 * Freshness weight: the newest term counts fully and each earlier term counts
 * less, floored so older but still-relevant history contributes.
 */
export function termFreshnessWeight(term: string, reference: string): number {
  return Math.max(0.3, Math.pow(0.75, termDistance(term, reference)));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function weightedMean(pairs: Array<{ value: number; weight: number }>): number {
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (totalWeight === 0) return 0;
  return pairs.reduce((sum, pair) => sum + pair.value * pair.weight, 0) / totalWeight;
}

/**
 * Three-axis workload index (0-100). Raw hours are only part of the cost:
 * mental effort is weighted above time because effort is what students price
 * a term by, with stress as the third axis.
 */
export function computeLoadIndex(
  avgWeeklyHours: number,
  avgMentalEffort: number,
  avgStress: number
): number {
  const hoursComponent = Math.min(1, Math.max(0, avgWeeklyHours / 25));
  const effortComponent = Math.min(1, Math.max(0, (avgMentalEffort - 1) / 4));
  const stressComponent = Math.min(1, Math.max(0, (avgStress - 1) / 4));
  return Math.round(
    100 * (0.3 * hoursComponent + 0.45 * effortComponent + 0.25 * stressComponent)
  );
}

function loadIndexLabel(index: number): LoadProfile['label'] {
  if (index < 25) return 'Light';
  if (index < 50) return 'Manageable';
  if (index < 75) return 'Demanding';
  return 'Very demanding';
}

export const GRADE_BAND_LABELS: Record<GradeBand, string> = {
  '85+': 'Working toward 85%+',
  '80-84': 'Working toward 80–84%',
  '70-79': 'Working toward 70–79%',
  '60-69': 'Working toward 60–69%',
  'below-60': 'Working toward a pass (below 60%)',
};

export const GRADE_BANDS: GradeBand[] = ['85+', '80-84', '70-79', '60-69', 'below-60'];

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

export type ReviewSortBy =
  | 'trust_lens'
  | 'most_helpful'
  | 'most_recent'
  | 'rating_desc'
  | 'rating_asc';

export type ReviewRatingFilter =
  | 'all'
  | 'recommended'
  | 'critical'
  | 'rating_5'
  | 'rating_4'
  | 'rating_3'
  | 'rating_2'
  | 'rating_1'
  | 'difficulty_low'
  | 'difficulty_mid'
  | 'difficulty_high';

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

export function sortAndFilterReviews(
  reviews: Review[],
  options: {
    sortBy: ReviewSortBy;
    ratingFilter: ReviewRatingFilter;
    includeLimited: boolean;
  }
): {
  displayed: EnrichedReview[];
  totalVisible: number;
  hiddenLimitedCount: number;
  avgTrustScore: number;
  informativeCount: number;
} {
  const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
  const enriched = enrichReviewsWithTrustLens(visible);

  const informativeCount = enriched.filter(
    (r) => r.trustLens.tier === 'most_informative'
  ).length;
  const avgTrustScore =
    enriched.length > 0
      ? Math.round(
          enriched.reduce((sum, r) => sum + r.trustLens.score, 0) / enriched.length
        )
      : 0;

  const byRating = enriched.filter((r) => {
    switch (options.ratingFilter) {
      case 'recommended':
        return r.recommended;
      case 'critical':
        return !r.recommended;
      case 'rating_5':
        return r.usefulness === 5;
      case 'rating_4':
        return r.usefulness === 4;
      case 'rating_3':
        return r.usefulness === 3;
      case 'rating_2':
        return r.usefulness === 2;
      case 'rating_1':
        return r.usefulness === 1;
      case 'difficulty_low':
        return r.difficulty <= 2;
      case 'difficulty_mid':
        return r.difficulty === 3;
      case 'difficulty_high':
        return r.difficulty >= 4;
      default:
        return true;
    }
  });

  const nonLimited = byRating.filter((r) => r.trustLens.tier !== 'limited');
  const pool =
    options.includeLimited || nonLimited.length === 0 ? byRating : nonLimited;
  const hiddenLimitedCount =
    options.includeLimited || nonLimited.length === 0
      ? 0
      : Math.max(0, byRating.length - nonLimited.length);

  const sorted = [...pool].sort((a, b) => {
    if (options.sortBy === 'most_helpful') {
      const netA = a.helpfulVotes - a.notHelpfulVotes;
      const netB = b.helpfulVotes - b.notHelpfulVotes;
      if (netB !== netA) return netB - netA;
      if (b.helpfulVotes !== a.helpfulVotes) return b.helpfulVotes - a.helpfulVotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (options.sortBy === 'most_recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (options.sortBy === 'rating_desc') {
      if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
      return b.trustLens.score - a.trustLens.score;
    }
    if (options.sortBy === 'rating_asc') {
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      return b.trustLens.score - a.trustLens.score;
    }
    // 'trust_lens'
    if (b.trustLens.score !== a.trustLens.score) {
      return b.trustLens.score - a.trustLens.score;
    }
    return b.helpfulVotes - a.helpfulVotes;
  });

  return {
    displayed: sorted,
    totalVisible: visible.length,
    hiddenLimitedCount,
    avgTrustScore,
    informativeCount,
  };
}

export interface CourseStatsOptions {
  /** Department (or university) rating prior used to shrink small samples. */
  priorRating?: number;
  /** Pseudo-count for that prior; higher anchors small samples harder. */
  priorWeight?: number;
  /** Human label for the anchor, e.g. "Mathematics". */
  priorLabel?: string;
}

export function computeCourseStats(
  reviews: Review[],
  options?: CourseStatsOptions
): CourseStats {
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
      studyStrategyStats: [],
      rating: {
        point: 0,
        low: 0,
        high: 0,
        sampleSize: 0,
        anchoredToDepartment: false,
        priorLabel: options?.priorLabel ?? 'department',
      },
      load: {
        avgWeeklyHours: 0,
        avgMentalEffort: 0,
        avgStress: 0,
        loadIndex: 0,
        label: 'Light',
      },
      effortToSuccess: [],
      asOf: '',
      weightingNote: '',
    };
  }

  const informativeCount = enriched.filter(
    (r) => r.trustLens.tier === 'most_informative'
  ).length;

  // Freshness weighting: recent terms speak loudest, old terms still count.
  const referenceTerm = visible.reduce(
    (best, r) => (parseTermRecencyScore(r.term) > parseTermRecencyScore(best.term) ? r : best),
    visible[0]
  ).term;
  const weightFor = (r: Review) => termFreshnessWeight(r.term, referenceTerm);
  const totalWeight = visible.reduce((sum, r) => sum + weightFor(r), 0);
  const effortOf = (r: Review) => r.mentalEffort ?? r.difficulty;
  const stressOf = (r: Review) => r.stress ?? r.difficulty;

  const avgDifficulty = round1(
    weightedMean(visible.map((r) => ({ value: r.difficulty, weight: weightFor(r) })))
  );
  const avgWeeklyHours = round1(
    weightedMean(visible.map((r) => ({ value: r.weeklyHours, weight: weightFor(r) })))
  );
  const recommendationRate = Math.round(
    weightedMean(visible.map((r) => ({ value: r.recommended ? 100 : 0, weight: weightFor(r) })))
  );
  const avgUsefulness = round1(
    weightedMean(visible.map((r) => ({ value: r.usefulness, weight: weightFor(r) })))
  );
  const avgMentalEffort = round1(
    weightedMean(visible.map((r) => ({ value: effortOf(r), weight: weightFor(r) })))
  );
  const avgStress = round1(
    weightedMean(visible.map((r) => ({ value: stressOf(r), weight: weightFor(r) })))
  );
  const loadIndex = computeLoadIndex(avgWeeklyHours, avgMentalEffort, avgStress);

  // Shrink the rating toward a prior so a three-review course cannot masquerade as precise.
  const priorRating = options?.priorRating ?? 3.5;
  const priorWeight = Math.max(0, options?.priorWeight ?? 3);
  const shrunkRating =
    (visible.reduce((sum, r) => sum + r.usefulness * weightFor(r), 0) + priorRating * priorWeight) /
    Math.max(0.001, totalWeight + priorWeight);
  const ratingVariance =
    visible.reduce(
      (sum, r) => sum + weightFor(r) * Math.pow(r.usefulness - shrunkRating, 2),
      0
    ) / Math.max(1, totalWeight);
  const standardError =
    Math.sqrt(ratingVariance) / Math.sqrt(Math.max(1, totalWeight + priorWeight));
  const margin = Math.min(1.2, Math.max(0.2, 1.96 * standardError));
  const ratingPoint = round1(shrunkRating);
  const rating: RatingRange = {
    point: ratingPoint,
    low: Math.min(ratingPoint, round1(Math.max(1, shrunkRating - margin))),
    high: Math.max(ratingPoint, round1(Math.min(5, shrunkRating + margin))),
    sampleSize: n,
    anchoredToDepartment: typeof options?.priorRating === 'number',
    priorLabel: options?.priorLabel ?? 'department',
  };

  // Effort-to-success: study-hour bands by the grade students were aiming for.
  // Deliberately not a grade distribution and never an "easy A" ranking.
  const effortToSuccess: EffortToSuccessBand[] = GRADE_BANDS.map((band) => {
    const group = visible.filter((r) => r.targetGrade === band);
    if (group.length === 0) return null;
    const hours = group.map((r) => r.weeklyHours);
    const methodCounts = new Map<StudyMethodKey, number>();
    for (const review of group) {
      for (const method of review.helpfulMethods ?? review.studyMethods) {
        methodCounts.set(method, (methodCounts.get(method) ?? 0) + 1);
      }
    }
    const topMethods = Array.from(methodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => STUDY_METHOD_CATALOG[key].label);
    return {
      band,
      label: GRADE_BAND_LABELS[band],
      reviewCount: group.length,
      avgWeeklyHours: round1(hours.reduce((sum, h) => sum + h, 0) / hours.length),
      minWeeklyHours: Math.min(...hours),
      maxWeeklyHours: Math.max(...hours),
      topMethods,
    };
  }).filter((band): band is EffortToSuccessBand => band !== null);

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
    rating,
    load: {
      avgWeeklyHours,
      avgMentalEffort,
      avgStress,
      loadIndex,
      label: loadIndexLabel(loadIndex),
    },
    effortToSuccess,
    asOf: referenceTerm,
    weightingNote: `Averages are weighted toward ${referenceTerm}; each earlier term counts about 25% less.`,
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

  // Fast exact/prefix/substring scoring first; only compute Levenshtein when needed
  const fuzzyHitsLimit = queryTokens.length;
  let fuzzyHits = 0;
  for (const qt of queryTokens) {
    const matched = targetTokens.some((tt) => {
      if (tt.includes(qt)) return true;
      if (qt.length >= 5 && Math.abs(tt.length - qt.length) <= 2 && levenshtein(qt, tt) <= 2) {
        return true;
      }
      return false;
    });
    if (matched) fuzzyHits++;
  }

  if (fuzzyHitsLimit > 0 && fuzzyHits === fuzzyHitsLimit) {
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
      if (filters.term && filters.term !== 'all') {
        const needle = filters.term.toLowerCase();
        const matchesOffered = course.termsOffered.some((t) =>
          t.toLowerCase().includes(needle)
        );
        const matchesTrend =
          stats?.termTrends.some((tt) => tt.term.toLowerCase().includes(needle)) ?? false;
        if (!matchesOffered && !matchesTrend) return false;
      }
      if (filters.department !== 'all') {
        const matchesDeptOrSubject =
          course.department === filters.department ||
          course.subjectCode === filters.department;
        if (!matchesDeptOrSubject) return false;
      }
      if (filters.level !== 'all' && course.level !== filters.level) {
        return false;
      }
      const hasReviews = (stats?.responseCount ?? 0) > 0;
      if (filters.hasReviews === 'with_reviews' && !hasReviews) return false;
      if (filters.hasReviews === 'without_reviews' && hasReviews) return false;

      if (filters.maxDifficulty !== 'all') {
        if (!hasReviews || !stats || stats.avgDifficulty > filters.maxDifficulty) {
          return false;
        }
      }
      if (filters.maxHours !== 'all') {
        if (!hasReviews || !stats || stats.avgWeeklyHours > filters.maxHours) {
          return false;
        }
      }
      return true;
    });

  scored.sort((a, b) => {
    const aCount = a.stats?.responseCount ?? 0;
    const bCount = b.stats?.responseCount ?? 0;

    if (filters.sortBy === 'code') {
      return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
    }
    if (filters.sortBy === 'relevance') {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (bCount !== aCount) return bCount - aCount;
      return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
    }
    if (filters.sortBy === 'recommended') {
      if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
      return (b.stats?.recommendationRate ?? 0) - (a.stats?.recommendationRate ?? 0);
    }
    if (filters.sortBy === 'reviews') {
      if (bCount !== aCount) return bCount - aCount;
      return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
    }
    if (filters.sortBy === 'workload_asc') {
      if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
      return (a.stats?.avgWeeklyHours ?? 0) - (b.stats?.avgWeeklyHours ?? 0);
    }
    if (filters.sortBy === 'workload_desc') {
      if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
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

export type ReviewHighlightCategory = 'assessment' | 'workload' | 'teaching' | 'strategy';

export interface ReviewTextSegment {
  text: string;
  category?: ReviewHighlightCategory;
}

const HIGHLIGHT_RULES: Array<{ category: ReviewHighlightCategory; pattern: RegExp }> = [
  {
    category: 'workload',
    pattern:
      /\b(?:\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*\+?\s*(?:hrs?|hours?)(?:\s*\/\s*wk|\s+per\s+week|\s+a\s+week)?|weekly\s+(?:problem\s+sets?|assignments?|labs?|quizzes?|readings?)(?:\s+workload)?|workload(?:\s+spike[sd]?)?|weeks?\s+\d+(?:\s*[-–to]+\s*\d+)?)\b/gi,
  },
  {
    category: 'assessment',
    pattern:
      /\b(?:midterm(?:\s*\d+)?|final\s+exam|past\s+exams?|grading\s+rubrics?|rubrics?|partial\s+credit|lab\s+exams?|assignments?\s*\d+|problem\s+sets?)\b/gi,
  },
  {
    category: 'teaching',
    pattern:
      /\b(?:TA\s+office\s+hours|office\s+hours|tutorial\s+sessions?|tutorials?|recorded\s+lectures?|lecture\s+notes?)\b/gi,
  },
  {
    category: 'strategy',
    pattern:
      /\b(?:practice\s+(?:problems?|questions?|exams?)|timed\s+conditions|workbook\s+proofs?|spaced\s+repetition|flashcards?|study\s+groups?|start(?:ing)?\s+early)\b/gi,
  },
];

/**
 * Splits review text into verbatim segments, tagging up to 3 concrete, non-overlapping
 * references to workload, assessments, teaching support, or study strategies.
 * Never invents words or alters original characters.
 */
export function extractReviewHighlightSegments(
  input: string,
  maxHighlights = 3
): ReviewTextSegment[] {
  if (!input) return [];

  interface MatchSpan {
    start: number;
    end: number;
    category: ReviewHighlightCategory;
  }

  const candidates: MatchSpan[] = [];
  for (const rule of HIGHLIGHT_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      candidates.push({
        start: match.index,
        end: match.index + match[0].length,
        category: rule.category,
      });
    }
  }

  if (candidates.length === 0) {
    return [{ text: input }];
  }

  // Sort earliest first, prefer longer span on tie
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);

  const chosen: MatchSpan[] = [];
  let cursor = 0;
  for (const span of candidates) {
    if (chosen.length >= maxHighlights) break;
    if (span.start >= cursor) {
      chosen.push(span);
      cursor = span.end;
    }
  }

  const segments: ReviewTextSegment[] = [];
  let pos = 0;
  for (const span of chosen) {
    if (span.start > pos) {
      segments.push({ text: input.slice(pos, span.start) });
    }
    segments.push({
      text: input.slice(span.start, span.end),
      category: span.category,
    });
    pos = span.end;
  }
  if (pos < input.length) {
    segments.push({ text: input.slice(pos) });
  }

  return segments;
}

const FEEDBACK_THEME_BUCKETS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: 'Assessment & rubric clarity',
    pattern: /midterm|exam|quiz|rubric|grading|partial credit|mark(?:ing|s)?\b|grade/i,
  },
  {
    label: 'Pacing & workload spikes',
    pattern: /weekly|workload|\bhours\b|pace|pacing|spike|deadline|crunch/i,
  },
  {
    label: 'Tutorial & office-hour support',
    pattern: /tutorial|office hours|dgd|lab session|review session/i,
  },
  {
    label: 'Prerequisite & background readiness',
    pattern: /prerequisite|background|foundation|notation|assume[sd]?|prior experience/i,
  },
  {
    label: 'Feedback turnaround',
    pattern: /feedback|returned|handed back|turnaround|comments back/i,
  },
];

function themeBucketsFor(texts: string[]): TeachingTeamTheme[] {
  return FEEDBACK_THEME_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: texts.filter((text) => bucket.pattern.test(text)).length,
  }))
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);
}

function normalizeName(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Aggregate themes for one teaching-team member (professor or TA), built only
 * from reviews that named that person. No student identity is ever included.
 */
export function computeTeachingTeamView(
  instructor: InstructorProfile,
  reviews: Review[]
): TeachingTeamView {
  const target = normalizeName(instructor.name);
  const surname = target.split(' ').filter(Boolean).pop() ?? '';
  const matched = reviews.filter((review) => {
    if (review.moderationStatus === 'hidden') return false;
    const named = normalizeName(review.taName);
    if (!named) return false;
    if (named === target) return true;
    return surname.length > 3 && named.includes(surname);
  });

  const confusionThemes = themeBucketsFor(
    matched.map((review) => `${review.whatWasChallenging} ${review.overallExperience}`)
  );
  const helpfulThemes = themeBucketsFor(
    matched.map((review) => `${review.whatWorkedWell} ${review.practicalAdvice}`)
  );
  const excerpts = matched
    .filter(
      (review) =>
        review.whatWorkedWell.trim().length > 20 || review.whatWasChallenging.trim().length > 20
    )
    .slice(0, 2)
    .map((review) => {
      const prefersWorked = review.whatWorkedWell.trim().length > 20;
      return {
        text: (prefersWorked ? review.whatWorkedWell : review.whatWasChallenging)
          .trim()
          .slice(0, 200),
        term: review.term,
        field: (prefersWorked ? 'worked' : 'challenging') as 'worked' | 'challenging',
      };
    });
  const earlierTermMentions = matched.filter(
    (review) => termDistance(review.term, instructor.term) > 0
  ).length;

  const note =
    matched.length === 0
      ? `No reviews have named ${instructor.name} yet. Section-level themes appear once students name their TA.`
      : earlierTermMentions > 0
      ? `${earlierTermMentions} of ${matched.length} mentions come from terms before ${instructor.term}, so part of this pattern may predate this section.`
      : `All ${matched.length} mentions come from ${instructor.term} or later.`;

  return {
    instructorId: instructor.id,
    name: instructor.name,
    role: instructor.role,
    term: instructor.term,
    matchedReviewCount: matched.length,
    confusionThemes,
    helpfulThemes,
    excerpts,
    earlierTermMentions,
    note,
  };
}

/**
 * Peak-week map: where the crunch lands, estimated from catalogue assessment
 * weights plus the weeks students explicitly mention. Planning aid, not a syllabus.
 */
export function computePeakWeekMap(course: Course, reviews: Review[]): PeakWeekMap {
  const WEEK_COUNT = 13; // weeks 1-12 of term plus the finals period
  const scores = new Array<number>(WEEK_COUNT + 1).fill(0);
  const drivers: string[][] = Array.from({ length: WEEK_COUNT + 1 }, () => []);

  const add = (week: number, amount: number, driver?: string) => {
    if (week < 1 || week > WEEK_COUNT) return;
    scores[week] += amount;
    if (driver && !drivers[week].includes(driver) && drivers[week].length < 3) {
      drivers[week].push(driver);
    }
  };

  for (const component of course.assessmentBreakdown ?? []) {
    const name = component.name;
    const lower = name.toLowerCase();
    const weight = Math.max(0.5, Math.min(2, component.weightPercent / 25));
    if (/final/.test(lower)) {
      // The exam period is real, but the map is about in-term collisions.
      add(13, weight * 0.6, name);
    } else if (/midterm/.test(lower)) {
      const twoMidterms = /\b(2|two)\b/.test(lower);
      add(twoMidterms ? 5 : 6, weight * 1.3, name);
      add(twoMidterms ? 9 : 10, weight * 1.1, name);
    } else if (/project|report|paper|presentation/.test(lower)) {
      add(11, weight, name);
    } else if (/quiz|assignment|problem set|lab|homework|exercise/.test(lower)) {
      for (let week = 2; week <= 12; week += 1) add(week, weight * 0.35, name);
    } else {
      add(12, weight * 0.5, name);
    }
  }

  for (const review of reviews) {
    if (review.moderationStatus === 'hidden') continue;
    const text = `${review.overallExperience} ${review.whatWasChallenging} ${review.practicalAdvice}`;
    const rangePattern = /weeks?\s*(\d{1,2})\s*(?:-|–|to|through|and)\s*(\d{1,2})/gi;
    let rangeMatch: RegExpExecArray | null;
    while ((rangeMatch = rangePattern.exec(text)) !== null) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let week = Math.min(start, end); week <= Math.max(start, end); week += 1) {
        add(week, 1.2, 'Student mentions');
      }
    }
    const singlePattern = /\bweek\s*(\d{1,2})\b/gi;
    let singleMatch: RegExpExecArray | null;
    while ((singleMatch = singlePattern.exec(text)) !== null) {
      add(Number(singleMatch[1]), 0.8, 'Student mentions');
    }
  }

  const peak = Math.max(...scores);
  const cells = Array.from({ length: WEEK_COUNT }, (_, index) => {
    const week = index + 1;
    return {
      week,
      label: week === 13 ? 'Finals' : `W${week}`,
      intensity: peak > 0 ? Math.round((scores[week] / peak) * 100) : 0,
      drivers: drivers[week],
    };
  });
  const busiest = cells.reduce(
    (best, cell) => (cell.intensity > best.intensity ? cell : best),
    cells[0]
  );

  return {
    cells,
    busiestWeek: peak > 0 ? busiest.week : 0,
    busiestLabel: peak > 0 ? busiest.label : '',
    note:
      peak > 0
        ? 'Estimated from catalogue assessment weights plus the weeks students mention. A planning aid, not a syllabus.'
        : 'No assessment weights or week-specific student mentions recorded for this course yet.',
  };
}

/**
 * Start / Stop / Continue digest for the teaching team. Uses only verbatim,
 * already-anonymised excerpts from visible reviews, and works with no AI key.
 */
export function generateDeterministicStaffDigest(
  course: Course,
  reviews: Review[]
): StaffDigest {
  const ranked = rankAndFilterReviews(reviews, 'most_informative', 'all').slice(0, 8);
  const count = ranked.length;
  const start: StaffDigestItem[] = [];
  const stop: StaffDigestItem[] = [];
  const keep: StaffDigestItem[] = [];
  const seen = new Set<string>();

  const themeOf = (text: string) =>
    FEEDBACK_THEME_BUCKETS.find((bucket) => bucket.pattern.test(text))?.label ??
    'General course experience';

  const pushItem = (
    target: StaffDigestItem[],
    review: EnrichedReview,
    text: string,
    theme: string
  ) => {
    const key = normalizeText(text).slice(0, 60);
    if (!key || seen.has(key) || target.length >= 3) return;
    seen.add(key);
    target.push({
      text,
      theme,
      evidenceReviewIds: [review.id],
      term: review.term,
    });
  };

  const ASK_PATTERN =
    /\b(more|clearer|unclear|didn'?t|did not|never|assume[sd]?|missing|need(?:ed)?|should|wish|explain(?:ed)?)\b/i;
  const FRICTION_PATTERN =
    /\b(spike|overlap|same week|too fast|too much|harsh|unfair|penal|crush|rushed|unforgiving)\b/i;

  for (const review of ranked) {
    const challenge = review.whatWasChallenging.trim();
    if (challenge.length > 25) {
      const excerpt = challenge.slice(0, 240);
      const theme = themeOf(challenge);
      if (ASK_PATTERN.test(challenge)) pushItem(start, review, excerpt, theme);
      else pushItem(stop, review, excerpt, theme);
    }
    if (review.whatWorkedWell.trim().length > 25) {
      pushItem(keep, review, review.whatWorkedWell.trim().slice(0, 240), themeOf(review.whatWorkedWell));
    }
  }

  // Guarantee all three buckets have something actionable when the sample allows.
  if (start.length === 0 || stop.length === 0) {
    for (const review of ranked) {
      const challenge = review.whatWasChallenging.trim();
      if (challenge.length <= 25) continue;
      const theme = themeOf(challenge);
      if (start.length === 0) pushItem(start, review, challenge.slice(0, 240), theme);
      else pushItem(stop, review, challenge.slice(0, 240), theme);
    }
  }

  const themeCounts = new Map<string, number>();
  for (const review of ranked) {
    const text = `${review.whatWasChallenging} ${review.overallExperience}`;
    for (const bucket of FEEDBACK_THEME_BUCKETS) {
      if (bucket.pattern.test(text)) {
        themeCounts.set(bucket.label, (themeCounts.get(bucket.label) ?? 0) + 1);
      }
    }
  }
  const checklist = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(
      ([label, mentions]) =>
        `${label}: raised in ${mentions} of ${count} substantive responses — pick one concrete change and post it to the Feedback Loop.`
    );

  return {
    courseId: course.id,
    courseCode: course.code,
    source: 'deterministic',
    generatedAt: new Date().toISOString(),
    eligibleReviewCount: count,
    sampleNote:
      count < 4
        ? `Based on ${count} substantive review${count === 1 ? '' : 's'} — treat these buckets as preliminary.`
        : `Built from ${count} substantive ${course.code} reviews; student identities are never included.`,
    start,
    stop,
    keep,
    checklist,
    caveat:
      'Quotes are verbatim excerpts from visible, already-anonymised reviews. No student, grade, or individual is attributable from this digest.',
  };
}


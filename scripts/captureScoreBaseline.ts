/**
 * Captures every user-facing score produced by the pre-refactor calculators into
 * `src/utils/__fixtures__/scoreBaseline.json`.
 *
 * The fixture is the "before" side of the explainable-scores change: the numbers
 * were recorded from the original code, then `scoreBaseline.test.ts` re-runs the
 * same inputs after the refactor and fails if any score moved. Explanations are
 * allowed to be new; scores are not allowed to change.
 *
 * Run with: npx tsx scripts/captureScoreBaseline.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_COURSES, DEMO_REVIEWS } from '../src/data/demoDataset.ts';
import type {
  AdvisorBrief,
  AdvisorResult,
  Course,
  CourseStats,
  Review,
} from '../src/types/course.ts';
import { advisorMatchPercent } from '../src/utils/advisorMatch.ts';
import {
  computeCourseStats,
  computeLoadIndex,
  computePeakWeekMap,
  evaluateReviewQuality,
} from '../src/utils/trustLens.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../src/utils/__fixtures__/scoreBaseline.json');

function groupByCourse(reviews: Review[]): Map<string, Review[]> {
  const map = new Map<string, Review[]>();
  for (const review of reviews) {
    const list = map.get(review.courseId) ?? [];
    list.push(review);
    map.set(review.courseId, list);
  }
  return map;
}

/**
 * Mirrors the department prior that `src/App.tsx` has always applied: mean raw
 * usefulness across visible reviews in the same university + department, with a
 * pseudo-count between 2 and 8 equal to the number of reviewed courses.
 */
function buildDepartmentPriors(
  courses: Course[],
  reviewsByCourse: Map<string, Review[]>
): Map<string, { priorRating: number; priorWeight: number; priorLabel: string }> {
  const totals = new Map<string, { sum: number; count: number; courses: number }>();
  for (const course of courses) {
    const visible = (reviewsByCourse.get(course.id) ?? []).filter(
      (review) => review.moderationStatus !== 'hidden'
    );
    if (visible.length === 0) continue;
    const key = `${course.universityId}::${course.department}`;
    const entry = totals.get(key) ?? { sum: 0, count: 0, courses: 0 };
    entry.sum += visible.reduce((sum, review) => sum + review.usefulness, 0);
    entry.count += visible.length;
    entry.courses += 1;
    totals.set(key, entry);
  }

  const priors = new Map<string, { priorRating: number; priorWeight: number; priorLabel: string }>();
  for (const course of courses) {
    const key = `${course.universityId}::${course.department}`;
    const entry = totals.get(key);
    if (!entry) continue;
    priors.set(key, {
      priorRating: entry.sum / entry.count,
      priorWeight: Math.min(8, Math.max(2, entry.courses)),
      priorLabel: course.department,
    });
  }
  return priors;
}

function statsSnapshot(stats: CourseStats) {
  return {
    responseCount: stats.responseCount,
    informativeCount: stats.informativeCount,
    avgDifficulty: stats.avgDifficulty,
    avgWeeklyHours: stats.avgWeeklyHours,
    recommendationRate: stats.recommendationRate,
    avgUsefulness: stats.avgUsefulness,
    confidenceLevel: stats.confidenceLevel,
    asOf: stats.asOf,
    load: {
      avgWeeklyHours: stats.load.avgWeeklyHours,
      avgMentalEffort: stats.load.avgMentalEffort,
      avgStress: stats.load.avgStress,
      loadIndex: stats.load.loadIndex,
      label: stats.load.label,
    },
    rating: {
      point: stats.rating.point,
      low: stats.rating.low,
      high: stats.rating.high,
      sampleSize: stats.rating.sampleSize,
      anchoredToDepartment: stats.rating.anchoredToDepartment,
      priorLabel: stats.rating.priorLabel,
    },
    difficultyDistribution: stats.difficultyDistribution.map((bucket) => bucket.count),
    hoursDistribution: stats.hoursDistribution.map((bucket) => bucket.count),
    termTrends: stats.termTrends.map((trend) => ({
      term: trend.term,
      reviewCount: trend.reviewCount,
      avgDifficulty: trend.avgDifficulty,
      avgWeeklyHours: trend.avgWeeklyHours,
      recommendationRate: trend.recommendationRate,
    })),
    studyStrategyStats: stats.studyStrategyStats.map((strategy) => ({
      key: strategy.key,
      usedCount: strategy.usedCount,
      helpfulCount: strategy.helpfulCount,
      helpfulPercentage: strategy.helpfulPercentage,
    })),
    effortToSuccess: stats.effortToSuccess.map((band) => ({
      band: band.band,
      reviewCount: band.reviewCount,
      avgWeeklyHours: band.avgWeeklyHours,
      minWeeklyHours: band.minWeeklyHours,
      maxWeeklyHours: band.maxWeeklyHours,
      topMethods: band.topMethods,
    })),
  };
}

const reviewsByCourse = groupByCourse(DEMO_REVIEWS);
const priors = buildDepartmentPriors(DEMO_COURSES, reviewsByCourse);

const courseScores = DEMO_COURSES.map((course) => {
  const courseReviews = reviewsByCourse.get(course.id) ?? [];
  const prior = priors.get(`${course.universityId}::${course.department}`);
  return {
    id: course.id,
    withoutPrior: statsSnapshot(computeCourseStats(courseReviews)),
    withDepartmentPrior: statsSnapshot(computeCourseStats(courseReviews, prior)),
    prior: prior ?? null,
  };
});

const reviewScores = DEMO_REVIEWS.map((review) => {
  const evaluation = evaluateReviewQuality(
    review,
    reviewsByCourse.get(review.courseId) ?? [review]
  );
  return {
    id: review.id,
    courseId: review.courseId,
    score: evaluation.score,
    tier: evaluation.tier,
    labels: evaluation.labels,
  };
});

const loadIndexSamples = [
  [0, 1, 1],
  [5, 2, 2],
  [12.5, 3, 3],
  [20, 4, 5],
  [25, 5, 5],
  [40, 5, 5],
].map(([hours, effort, stress]) => ({
  hours,
  effort,
  stress,
  index: computeLoadIndex(hours, effort, stress),
}));

const peakWeeks = DEMO_COURSES.map((course) => {
  const map = computePeakWeekMap(course, reviewsByCourse.get(course.id) ?? []);
  return {
    id: course.id,
    busiestWeek: map.busiestWeek,
    intensities: map.cells.map((cell) => cell.intensity),
  };
});

const advisorBriefs: AdvisorBrief[] = [
  {
    intent: '',
    subjectCodes: ['CS'],
    keywords: ['machine', 'learning'],
    excludeKeywords: [],
    excludeSubjects: [],
    excludeSubjectsLabel: '',
    level: 300,
    maxDifficulty: 'all',
    maxHours: 'all',
    term: 'all',
    wantsReviews: false,
    constraints: [],
  },
  {
    intent: '',
    subjectCodes: [],
    keywords: ['calculus'],
    excludeKeywords: [],
    excludeSubjects: [],
    excludeSubjectsLabel: '',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 10,
    term: 'all',
    wantsReviews: true,
    constraints: [],
  },
  {
    intent: '',
    subjectCodes: ['ECON'],
    keywords: [],
    excludeKeywords: [],
    excludeSubjects: [],
    excludeSubjectsLabel: '',
    level: 'all',
    maxDifficulty: 2,
    maxHours: 'all',
    term: 'Fall',
    wantsReviews: true,
    constraints: [],
  },
];

const advisorMatches = advisorBriefs.map((brief, briefIndex) => ({
  briefIndex,
  results: DEMO_COURSES.map((course) => {
    const stats = computeCourseStats(reviewsByCourse.get(course.id) ?? []);
    const base: AdvisorResult = {
      course,
      stats,
      score: 0,
      matchReasons: [],
      evidenceReviewIds: [],
    };
    return {
      courseId: course.id,
      percent: advisorMatchPercent(brief, base),
      percentWithCaution: advisorMatchPercent(brief, {
        ...base,
        caution: 'Outside a stated limit.',
      }),
    };
  }),
}));

const fixture = {
  capturedAt: new Date().toISOString(),
  note: 'Produced by scripts/captureScoreBaseline.ts against the pre-refactor scoring code.',
  courseCount: DEMO_COURSES.length,
  reviewCount: DEMO_REVIEWS.length,
  courseScores,
  reviewScores,
  loadIndexSamples,
  peakWeeks,
  advisorMatches: advisorMatches.map(({ briefIndex, results }) => ({
    briefIndex,
    results: results.map((entry) => ({
      courseId: entry.courseId,
      percent: entry.percent,
      percentWithCaution: entry.percentWithCaution,
    })),
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(
  `Wrote ${outPath}: ${courseScores.length} courses, ${reviewScores.length} reviews, ${loadIndexSamples.length} load samples.`
);

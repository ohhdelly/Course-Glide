/**
 * Before/after guard for the explainable-scores work.
 *
 * The expected numbers in `__fixtures__/scoreBaseline.json` were captured from the
 * original calculators by `scripts/captureScoreBaseline.ts` before any refactor.
 * This test re-runs the same inputs through the current code and fails if any
 * user-facing score moved by even one rounding step. Explanations may be added;
 * scores may not change.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_COURSES, DEMO_REVIEWS } from '../data/demoDataset.ts';
import type { AdvisorBrief, AdvisorResult, CourseStats, Review } from '../types/course.ts';
import { buildDepartmentPriors } from './departmentPrior.ts';
import { advisorMatchPercent } from './advisorMatch.ts';
import {
  computeCourseStats,
  computeLoadIndex,
  computePeakWeekMap,
  evaluateReviewQuality,
} from './trustLens.ts';

interface BaselineFixture {
  courseCount: number;
  reviewCount: number;
  courseScores: Array<{
    id: string;
    withoutPrior: unknown;
    withDepartmentPrior: unknown;
    prior: { priorRating: number; priorWeight: number; priorLabel: string } | null;
  }>;
  reviewScores: Array<{ id: string; courseId: string; score: number; tier: string; labels: string[] }>;
  loadIndexSamples: Array<{ hours: number; effort: number; stress: number; index: number }>;
  peakWeeks: Array<{ id: string; busiestWeek: number; intensities: number[] }>;
  advisorMatches: Array<{
    briefIndex: number;
    results: Array<{ courseId: string; percent: number; percentWithCaution: number }>;
  }>;
}

const baseline = JSON.parse(
  readFileSync(new URL('./__fixtures__/scoreBaseline.json', import.meta.url), 'utf8')
) as BaselineFixture;

function groupByCourse(reviews: Review[]): Map<string, Review[]> {
  const map = new Map<string, Review[]>();
  for (const review of reviews) {
    const list = map.get(review.courseId) ?? [];
    list.push(review);
    map.set(review.courseId, list);
  }
  return map;
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

const reviewsByCourse = groupByCourse(DEMO_REVIEWS);

test('course-level scores match the pre-refactor baseline (with and without the department prior)', () => {
  assert.equal(baseline.courseCount, DEMO_COURSES.length);
  const priors = buildDepartmentPriors(DEMO_COURSES, reviewsByCourse);

  for (const expected of baseline.courseScores) {
    const course = DEMO_COURSES.find((entry) => entry.id === expected.id);
    assert.ok(course, `Baseline course ${expected.id} must still exist`);
    const courseReviews = reviewsByCourse.get(course.id) ?? [];
    const prior = priors.get(`${course.universityId}::${course.department}`);

    assert.deepEqual(prior ?? null, expected.prior, `${expected.id}: department prior drifted`);
    assert.deepEqual(
      statsSnapshot(computeCourseStats(courseReviews)),
      expected.withoutPrior,
      `${expected.id}: unanchored scores drifted`
    );
    assert.deepEqual(
      statsSnapshot(computeCourseStats(courseReviews, prior)),
      expected.withDepartmentPrior,
      `${expected.id}: department-anchored scores drifted`
    );
  }
});

test('review Trust Lens scores and tiers match the pre-refactor baseline', () => {
  assert.equal(baseline.reviewCount, DEMO_REVIEWS.length);
  const expectedById = new Map(baseline.reviewScores.map((entry) => [entry.id, entry]));

  for (const review of DEMO_REVIEWS) {
    const expected = expectedById.get(review.id);
    assert.ok(expected, `Baseline review ${review.id} must still exist`);
    const evaluation = evaluateReviewQuality(
      review,
      reviewsByCourse.get(review.courseId) ?? [review]
    );
    assert.deepEqual(
      {
        id: review.id,
        courseId: review.courseId,
        score: evaluation.score,
        tier: evaluation.tier,
        labels: evaluation.labels,
      },
      expected,
      `${review.id}: Trust Lens score drifted`
    );
  }
});

test('load index samples match the pre-refactor baseline', () => {
  for (const sample of baseline.loadIndexSamples) {
    assert.equal(
      computeLoadIndex(sample.hours, sample.effort, sample.stress),
      sample.index,
      `Load index drifted for ${sample.hours}h / effort ${sample.effort} / stress ${sample.stress}`
    );
  }
});

test('peak-week intensities match the pre-refactor baseline', () => {
  for (const expected of baseline.peakWeeks) {
    const course = DEMO_COURSES.find((entry) => entry.id === expected.id);
    assert.ok(course, `Baseline course ${expected.id} must still exist`);
    const map = computePeakWeekMap(course, reviewsByCourse.get(course.id) ?? []);
    assert.equal(map.busiestWeek, expected.busiestWeek, `${expected.id}: busiest week drifted`);
    assert.deepEqual(
      map.cells.map((cell) => cell.intensity),
      expected.intensities,
      `${expected.id}: peak-week intensities drifted`
    );
  }
});

test('advisor match percentages match the pre-refactor baseline', () => {
  for (const entry of baseline.advisorMatches) {
    const brief = advisorBriefs[entry.briefIndex];
    assert.ok(brief, `Baseline advisor brief ${entry.briefIndex} must still exist`);

    for (const expected of entry.results) {
      const course = DEMO_COURSES.find((item) => item.id === expected.courseId);
      assert.ok(course, `Baseline course ${expected.courseId} must still exist`);
      const stats = computeCourseStats(reviewsByCourse.get(course.id) ?? []);
      const base: AdvisorResult = {
        course,
        stats,
        score: 0,
        matchReasons: [],
        evidenceReviewIds: [],
      };
      assert.equal(
        advisorMatchPercent(brief, base),
        expected.percent,
        `${course.code}: advisor match drifted (brief ${entry.briefIndex})`
      );
      assert.equal(
        advisorMatchPercent(brief, { ...base, caution: 'Outside a stated limit.' }),
        expected.percentWithCaution,
        `${course.code}: advisor caution penalty drifted (brief ${entry.briefIndex})`
      );
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_COURSES, DEMO_REVIEWS } from '../data/demoDataset.ts';
import type { AdvisorBrief, AdvisorResult } from '../types/course.ts';
import { advisorMatchBreakdown } from './advisorMatch.ts';
import {
  computeCourseStats,
  computePeakWeekMap,
  evaluateReviewQuality,
} from './trustLens.ts';
import {
  BASIS_LABEL,
  explainDifficulty,
  explainMatch,
  explainPeakWeek,
  explainRating,
  explainRecommend,
  explainTrust,
  explainWorkload,
  explanationToAnswer,
} from './scoreExplanations.ts';

const course = DEMO_COURSES.find((entry) => entry.id === 'math-137');
assert.ok(course, 'math-137 must exist in the demo catalogue');
const reviews = DEMO_REVIEWS.filter((review) => review.courseId === course.id);
const stats = computeCourseStats(reviews);

const brief: AdvisorBrief = {
  intent: '',
  subjectCodes: ['MATH'],
  keywords: ['calculus'],
  excludeKeywords: [],
  excludeSubjects: [],
  excludeSubjectsLabel: '',
  level: 'all',
  maxDifficulty: 'all',
  maxHours: 'all',
  term: 'all',
  wantsReviews: false,
  constraints: [],
};

function resultFor(caution?: string): AdvisorResult {
  return {
    course: course!,
    stats,
    score: 0,
    matchReasons: [],
    evidenceReviewIds: [],
    ...(caution ? { caution } : {}),
  };
}

test('every explanation carries the exact displayed value and its real components', () => {
  const workload = explainWorkload(stats);
  assert.equal(workload.value, `${stats.load.loadIndex} / 100 · ${stats.load.label}`);
  const breakdown = stats.load.breakdown;
  assert.ok(breakdown, 'load index must ship its breakdown');
  const summed = breakdown.components.reduce((sum, component) => sum + component.points, 0);
  assert.equal(
    Math.round(summed),
    stats.load.loadIndex,
    'the rendered component points must reconstruct the index'
  );
  breakdown.components.forEach((component) => {
    assert.equal(
      workload.components.some((entry) => entry.label === component.label),
      true,
      `${component.label} must appear in the explanation`
    );
    assert.equal(
      workload.components.find((entry) => entry.label === component.label)?.contribution,
      `${component.points.toFixed(1)} pts`
    );
  });
  assert.equal(workload.formula, breakdown.formula);
  assert.equal(workload.basis, 'estimate');
  assert.equal(BASIS_LABEL.estimate, 'Estimate · not validated');

  const difficulty = explainDifficulty(stats);
  assert.equal(difficulty.value, `${stats.avgDifficulty.toFixed(1)} / 5`);
  assert.equal(
    difficulty.components[0].input,
    `${stats.scoreBreakdowns?.difficulty.reviews} reviews rated 1–5`
  );
  const terms = stats.scoreBreakdowns?.weighting.terms ?? [];
  assert.equal(
    difficulty.components.filter((entry) => entry.label.startsWith('Term ')).length,
    terms.length
  );

  const recommend = explainRecommend(stats);
  assert.equal(recommend.value, `${Math.round(stats.recommendationRate)}%`);
  assert.ok(
    recommend.components[0].input.includes(
      `${stats.scoreBreakdowns?.recommend.recommends} of ${stats.scoreBreakdowns?.recommend.reviews}`
    ),
    'recommend explanation must quote the real vote counts'
  );

  const rating = explainRating(stats);
  assert.ok(rating.value.includes(stats.rating.low.toFixed(1)));
  assert.ok(rating.value.includes(stats.rating.high.toFixed(1)));
  assert.ok(rating.value.includes(stats.rating.point.toFixed(1)));
  assert.ok(
    rating.components.some((entry) => entry.contribution === stats.rating.breakdown!.shrunk.toFixed(2)),
    'rating explanation must show the shrunk midpoint it produced'
  );
});

test('Trust Lens explanations show every point that produced the score', () => {
  const review = reviews[0];
  const evaluation = evaluateReviewQuality(review, reviews);
  const explanation = explainTrust(evaluation);

  assert.equal(explanation.components.length, evaluation.contributions.length);
  const summed = evaluation.contributions.reduce((sum, entry) => sum + entry.points, 0);
  assert.equal(
    Math.max(5, Math.min(100, Math.round(summed))),
    evaluation.score,
    'the point list must reconstruct the clamped score'
  );
  assert.equal(explanation.value, `${evaluation.score} / 100 · ${evaluation.tier.replace(/_/g, ' ')}`);
  assert.equal(explanation.basis, 'estimate');
  assert.ok(explanation.exclusions.some((line) => /recommend/i.test(line)));
});

test('match explanations renormalise over the real checks and show the caution nudge', () => {
  const withoutCaution = advisorMatchBreakdown(brief, resultFor());
  const explanation = explainMatch(withoutCaution);
  const summed = withoutCaution.checks.reduce((sum, check) => sum + check.points, 0);
  assert.equal(Math.round((summed / withoutCaution.totalWeight) * 100), withoutCaution.rawPercent);
  assert.equal(explanation.value, `${withoutCaution.percent}% match`);
  assert.equal(explanation.components.length, withoutCaution.checks.length);

  const withCaution = advisorMatchBreakdown(brief, resultFor('Outside a stated limit.'));
  const cautionExplanation = explainMatch(withCaution);
  assert.equal(withCaution.cautionApplied, true);
  assert.ok(
    cautionExplanation.components.some((component) => component.label === 'Outside a stated limit'),
    'the penalty must be visible, not silently folded into the total'
  );
  assert.ok(cautionExplanation.components.at(-1)?.contribution.includes(`${withCaution.percent}%`));
});

test('peak-week explanations name the catalogue weights and student mentions behind the map', () => {
  const map = computePeakWeekMap(course!, reviews);
  const explanation = explainPeakWeek(map);
  assert.equal(
    explanation.value,
    map.busiestWeek > 0 ? `Busiest: ${map.busiestLabel}` : 'No signal'
  );
  assert.equal(explanation.basis, 'estimate');
  const assessmentSources = (map.sources ?? []).filter((source) => source.kind === 'assessment');
  for (const source of assessmentSources) {
    const row = explanation.components.find((component) => component.label === source.label);
    assert.ok(row, `${source.label} must be listed`);
    assert.ok(row.input.includes(`${source.weightPercent}%`));
    assert.ok(row.input.includes(source.weeks));
  }
});

test('explanations are deterministic and state what is not included', () => {
  assert.deepEqual(explainWorkload(stats), explainWorkload(stats));
  assert.deepEqual(explainDifficulty(stats), explainDifficulty(stats));

  const answer = explanationToAnswer(explainWorkload(stats));
  assert.ok(answer.includes('Workload index is'));
  assert.ok(answer.includes(`${stats.load.loadIndex} / 100`));
  assert.ok(answer.includes('It does not include:'));
  assert.ok(answer.includes('estimate, not a validated model'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_COURSES, DEMO_REVIEWS } from '../src/data/demoDataset.ts';
import {
  EXPLAINABLE_SCORES,
  buildPhrasingPrompt,
  explainScore,
  type ExplainScoreRequest,
} from './scoreExplainService.ts';
import { CatalogueService } from './catalogueService.ts';
import { explainWorkload, explanationToAnswer } from '../src/utils/scoreExplanations.ts';
import { computeCourseStats } from '../src/utils/trustLens.ts';

const catalogue = new CatalogueService();
const course = catalogue.getCourseById('math-137');
assert.ok(course, 'math-137 must exist in the loaded catalogue');

const mathReview = DEMO_REVIEWS.find((review) => review.courseId === 'math-137');
assert.ok(mathReview, 'math-137 must have a demo review');

const reviewCourse = DEMO_COURSES.find((entry) => entry.id === 'math-137');
assert.ok(reviewCourse);

const deps = { catalogue, reviews: DEMO_REVIEWS };

function requestFor(score: ExplainScoreRequest['score']): ExplainScoreRequest {
  return {
    courseId: 'math-137',
    score,
    reviewId: score === 'trust' ? mathReview!.id : undefined,
    brief:
      score === 'match'
        ? {
            subjectCodes: ['MATH'],
            keywords: ['calculus'],
            level: 'all',
            maxDifficulty: 'all',
            maxHours: 'all',
            term: 'all',
            wantsReviews: false,
          }
        : undefined,
    cautionApplied: false,
    allowAi: false,
  };
}

test('every explainable score returns the deterministic breakdown with no model', async () => {
  for (const score of EXPLAINABLE_SCORES) {
    const response = await explainScore(requestFor(score), deps);
    assert.ok(!('error' in response), `${score}: ${'error' in response ? response.error : ''}`);
    assert.equal(response.source, 'deterministic');
    assert.equal(response.score, score);
    assert.ok(response.explanation.components.length > 0, `${score}: needs components`);
    assert.ok(response.answer.length > 40, `${score}: needs a real answer`);
    assert.ok(response.answer.includes('It does not include:'), `${score}: must name exclusions`);
    assert.ok(response.explanation.exclusions.length > 0, `${score}: must list exclusions`);
  }
});

test('the deterministic path answers well inside the 300ms demo budget', async () => {
  // Warm the catalogue and the department-prior pass so we measure the endpoint
  // path, not first-call module loading.
  await explainScore(requestFor('workload'), deps);

  for (const score of EXPLAINABLE_SCORES) {
    const startedAt = performance.now();
    const response = await explainScore(requestFor(score), deps);
    const elapsed = performance.now() - startedAt;
    assert.ok(!('error' in response), `${score}: failed`);
    assert.ok(
      elapsed < 300,
      `${score}: deterministic explanation took ${elapsed.toFixed(1)}ms (budget 300ms)`
    );
    assert.ok(response.elapsedMs < 300, `${score}: reported ${response.elapsedMs}ms`);
  }
});

test('unknown course and unknown review fail cleanly instead of guessing', async () => {
  const missingCourse = await explainScore({ courseId: 'not-a-course', score: 'workload' }, deps);
  assert.ok('error' in missingCourse);
  assert.equal(missingCourse.status, 404);

  const missingReview = await explainScore(
    { courseId: 'math-137', score: 'trust', reviewId: 'not-a-review' },
    deps
  );
  assert.ok('error' in missingReview);
  assert.equal(missingReview.status, 404);
});

test('the model prompt carries the real inputs, weights and exclusions', () => {
  const stats = computeCourseStats(
    DEMO_REVIEWS.filter((review) => review.courseId === 'math-137')
  );
  const explanation = explainWorkload(stats);
  const prompt = buildPhrasingPrompt(explanation, explanationToAnswer(explanation));

  assert.match(prompt, /Not part of this calculation:/);
  assert.match(prompt, /Never compute or estimate a new number/);
  assert.match(prompt, /say it is not part of this calculation/);
  assert.ok(prompt.includes(explanation.value), 'prompt must carry the displayed value');
  assert.ok(prompt.includes(explanation.formula), 'prompt must carry the formula');
  for (const component of explanation.components) {
    assert.ok(prompt.includes(component.label), `prompt must include ${component.label}`);
    assert.ok(prompt.includes(component.input), `prompt must include ${component.label} input`);
    assert.ok(prompt.includes(component.weight), `prompt must include ${component.label} weight`);
    assert.ok(
      prompt.includes(component.contribution),
      `prompt must include ${component.label} contribution`
    );
  }
});

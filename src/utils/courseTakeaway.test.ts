import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOverviewTakeaway } from './courseTakeaway.ts';
import { computeCourseStats } from './trustLens.ts';
import { DEMO_COURSES, DEMO_REVIEWS } from '../data/demoDataset.ts';

test('buildOverviewTakeaway produces one concise data-grounded sentence for reviewed courses', () => {
  const math137 = DEMO_COURSES.find((c) => c.id === 'math-137')!;
  const stats = computeCourseStats(DEMO_REVIEWS.filter((r) => r.courseId === 'math-137'));
  const takeaway = buildOverviewTakeaway(math137, stats);

  assert.ok(takeaway.includes('MATH 137'));
  assert.ok(takeaway.includes(`${stats.avgDifficulty.toFixed(1)}/5`));
  assert.ok(takeaway.includes(`${stats.avgWeeklyHours.toFixed(1)} h/wk`));
  assert.ok(takeaway.includes(`${stats.recommendationRate}% recommend it`));
  assert.equal(takeaway.split('. ').length, 1);
});

test('buildOverviewTakeaway handles unreviewed courses without inventing metrics', () => {
  const unreviewed = {
    ...DEMO_COURSES[0],
    id: 'actsc-127',
    code: 'ACTSC 127',
    prerequisites: 'CS 115 or CS 135',
  };
  const emptyStats = computeCourseStats([]);
  const takeaway = buildOverviewTakeaway(unreviewed, emptyStats);

  assert.ok(takeaway.includes('No student reviews yet for ACTSC 127'));
  assert.ok(takeaway.includes('prerequisites'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTermWorkloadSummary,
  computeRatingDistribution,
  extractRealWorkloadBreakdown,
  formatHoursCompact,
} from './dataVisuals.ts';
import { computeCourseStats } from './trustLens.ts';
import type { Course, CourseStats, Review } from '../types/course.ts';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'math-137',
    code: 'MATH 137',
    title: 'Calculus 1',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Mathematics',
    level: 100,
    credits: '0.50 units',
    description: 'Intro calculus',
    termsOffered: ['Fall'],
    officialNote: 'Official note',
    ...overrides,
  };
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'rev-1',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Prof. A',
    authorAlias: 'Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 10,
    recommended: true,
    usefulness: 4,
    overallExperience: 'Detailed review covering assignments, midterm, and tutorials.',
    whatWorkedWell: 'Clear tutorials and worked examples.',
    whatWasChallenging: 'Midterm pacing.',
    practicalAdvice: 'Do weekly problem sets early.',
    studyMethods: ['practice_problems'],
    helpfulVotes: 2,
    notHelpfulVotes: 0,
    createdAt: '2025-12-01T00:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
    ...overrides,
  };
}

test('computeRatingDistribution returns 5-to-1 buckets ignoring hidden reviews', () => {
  const reviews = [
    makeReview({ id: 'r1', usefulness: 5 }),
    makeReview({ id: 'r2', usefulness: 5 }),
    makeReview({ id: 'r3', usefulness: 4 }),
    makeReview({ id: 'r4', usefulness: 2 }),
    makeReview({ id: 'r5', usefulness: 1, moderationStatus: 'hidden' }),
  ];

  const dist = computeRatingDistribution(reviews);
  assert.equal(dist.total, 4);
  assert.deepEqual(
    dist.rows.map((r) => [r.rating, r.count, r.percentage]),
    [
      [5, 2, 50],
      [4, 1, 25],
      [3, 0, 0],
      [2, 1, 25],
      [1, 0, 0],
    ]
  );
});

test('extractRealWorkloadBreakdown returns null when course has no real split hours and never invents data', () => {
  const courseWithoutBreakdown = makeCourse();
  assert.equal(extractRealWorkloadBreakdown(courseWithoutBreakdown), null);

  const courseWithZero = makeCourse({
    workloadBreakdown: { lectures: 0, assignments: 0, studying: 0, exams: 0 },
  });
  assert.equal(extractRealWorkloadBreakdown(courseWithZero), null);

  const courseWithRealSplit = makeCourse({
    workloadBreakdown: { lectures: 3, assignments: 4.5, studying: 2.8, exams: 1.5 },
  });
  const parsed = extractRealWorkloadBreakdown(courseWithRealSplit);
  assert.ok(parsed);
  assert.equal(parsed!.totalHours, 11.8);
  assert.equal(parsed!.segments.length, 4);
  assert.deepEqual(
    parsed!.segments.map((s) => [s.label, s.hours]),
    [
      ['Lectures', 3],
      ['Assignments', 4.5],
      ['Studying', 2.8],
      ['Exams', 1.5],
    ]
  );
});

test('buildTermWorkloadSummary computes totals, limit exceedances, and hides unreviewed courses from segments', () => {
  const c1 = makeCourse({ id: 'c1', code: 'MATH 137' });
  const c2 = makeCourse({ id: 'c2', code: 'CS 135' });
  const c3 = makeCourse({ id: 'c3', code: 'ACTSC 127' });

  const statsMap: Record<string, CourseStats> = {
    c1: computeCourseStats([makeReview({ id: 'a', courseId: 'c1', weeklyHours: 12 })]),
    c2: computeCourseStats([makeReview({ id: 'b', courseId: 'c2', weeklyHours: 9 })]),
    c3: computeCourseStats([]),
  };

  const withoutLimit = buildTermWorkloadSummary([c1, c2, c3], statsMap, null);
  assert.equal(withoutLimit.totalHours, 21);
  assert.equal(withoutLimit.reviewedCourseCount, 2);
  assert.equal(withoutLimit.unreviewedCourseCount, 1);
  assert.equal(withoutLimit.headlineText, 'About 21 h/wk across 2 courses');
  assert.equal(withoutLimit.exceededByHours, null);
  assert.equal(withoutLimit.limitMarkerPercent, null);

  const underLimit = buildTermWorkloadSummary([c1, c2], statsMap, 25);
  assert.equal(underLimit.exceededByHours, null);
  assert.equal(underLimit.headlineText, 'About 21 h/wk across 2 courses');
  assert.equal(underLimit.limitMarkerPercent, 100);

  const overLimit = buildTermWorkloadSummary([c1, c2], statsMap, 15);
  assert.equal(overLimit.exceededByHours, 6);
  assert.equal(overLimit.headlineText, 'Over your limit by 6 h');
  assert.ok(overLimit.limitMarkerPercent !== null && Math.abs(overLimit.limitMarkerPercent - (15 / 21) * 100) < 0.01);
});

test('formatHoursCompact formats integer and decimal hours cleanly', () => {
  assert.equal(formatHoursCompact(46), '46');
  assert.equal(formatHoursCompact(46.0), '46');
  assert.equal(formatHoursCompact(11.8), '11.8');
});

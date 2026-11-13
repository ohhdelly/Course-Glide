import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCourseStats,
  evaluateReviewQuality,
  filterAndSearchCourses,
  rankAndFilterReviews,
} from './trustLens.ts';
import { DEMO_COURSES, DEMO_INSTRUCTORS, DEMO_REVIEWS } from '../data/demoDataset.ts';
import type { CourseFilters, Review } from '../types/course.ts';

function makeReview(overrides: Partial<Review>): Review {
  return {
    id: 'r-test',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Elena Vance',
    authorAlias: 'Math Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 12,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Weekly assignments and tutorial quizzes kept pace with lecture proofs.',
    whatWorkedWell:
      'Working through epsilon-delta proofs in tutorial sessions helped clarify grading rubrics before the midterm.',
    whatWasChallenging:
      'The jump from computational calculus to formal proof structure in weeks 3 to 5 required extra office hours.',
    practicalAdvice:
      'Start the weekly problem sets early and compare your proof structure with past exam solutions.',
    studyMethods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 10,
    notHelpfulVotes: 1,
    createdAt: '2025-12-12T10:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
    ...overrides,
  };
}

test('Trust Lens treats detailed negative reviews fairly without sentiment penalty', () => {
  const positiveDetailed = makeReview({ id: 'pos', recommended: true, difficulty: 3 });
  const negativeDetailed = makeReview({
    id: 'neg',
    recommended: false,
    difficulty: 5,
    overallExperience:
      'Very demanding pace where midterm grading felt unforgiving relative to lecture examples.',
    whatWorkedWell:
      'Recorded lecture notes and weekly tutorial worksheets were clearly organized.',
    whatWasChallenging:
      'Weekly problem sets took 14+ hours and the second midterm tested edge-case proofs barely covered in lectures.',
    practicalAdvice:
      'Attend office hours before assignment deadlines and complete every past exam under timed conditions.',
  });

  const posEval = evaluateReviewQuality(positiveDetailed, [positiveDetailed, negativeDetailed]);
  const negEval = evaluateReviewQuality(negativeDetailed, [positiveDetailed, negativeDetailed]);

  assert.equal(posEval.tier, 'most_informative');
  assert.equal(negEval.tier, 'most_informative');
  assert.ok(negEval.labels.includes('Detailed Feedback'));
  assert.ok(negEval.labels.includes('Balanced Critique'));
  assert.ok(Math.abs(posEval.score - negEval.score) <= 10);
});

test('Trust Lens filters out short low-information and duplicate reviews in most_informative mode', () => {
  const mathReviews = DEMO_REVIEWS.filter((r) => r.courseId === 'math-137');
  const informative = rankAndFilterReviews(mathReviews, 'most_informative');
  const all = rankAndFilterReviews(mathReviews, 'all');

  assert.ok(all.length > informative.length, 'All Reviews should include limited-context entries');
  assert.ok(
    informative.some((r) => r.id === 'rev-math137-2' && !r.recommended),
    'Most Informative mode must preserve canonical detailed negative criticism'
  );
  assert.ok(
    !informative.some((r) => r.id === 'rev-math137-8'),
    'Most Informative mode should filter out the duplicate copy rev-math137-8'
  );
  assert.ok(
    informative.every((r) => r.trustLens.tier === 'most_informative'),
    'Most Informative mode should only surface substantive reviews'
  );
  assert.ok(
    all.some((r) => r.trustLens.labels.includes('Limited Context') || r.trustLens.labels.includes('Possible Duplicate')),
    'All Reviews mode should expose limited context or duplicate labels'
  );
});

test('Course statistics accurately reflect underlying visible reviews', () => {
  const sampleReviews = [
    makeReview({ id: 'a', difficulty: 2, weeklyHours: 6, recommended: true, studyMethods: ['practice_problems'], helpfulMethods: ['practice_problems'] }),
    makeReview({ id: 'b', difficulty: 4, weeklyHours: 10, recommended: false, studyMethods: ['practice_problems'], helpfulMethods: [] }),
  ];

  const stats = computeCourseStats(sampleReviews);
  assert.equal(stats.responseCount, 2);
  assert.equal(stats.avgDifficulty, 3);
  assert.equal(stats.avgWeeklyHours, 8);
  assert.equal(stats.recommendationRate, 50);
  const practiceStat = stats.studyStrategyStats.find((s) => s.key === 'practice_problems');
  assert.ok(practiceStat);
  assert.equal(practiceStat.usedCount, 2);
  assert.equal(practiceStat.helpfulCount, 1);
  assert.equal(practiceStat.helpfulPercentage, 50);
});

test('Course search handles partial codes, no-space codes, and minor typos', () => {
  const statsMap = Object.fromEntries(
    DEMO_COURSES.map((c) => [c.id, computeCourseStats(DEMO_REVIEWS.filter((r) => r.courseId === c.id))])
  );
  const instructorsMap: Record<string, string[]> = {};
  for (const inst of DEMO_INSTRUCTORS) {
    instructorsMap[inst.courseId] = [...(instructorsMap[inst.courseId] ?? []), inst.name];
  }

  const baseFilters: CourseFilters = {
    universityId: 'all',
    department: 'all',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 'all',
    sortBy: 'relevance',
  };

  const compactMatch = filterAndSearchCourses(DEMO_COURSES, statsMap, instructorsMap, 'math137', baseFilters);
  assert.equal(compactMatch[0]?.id, 'math-137');

  const typoMatch = filterAndSearchCourses(DEMO_COURSES, statsMap, instructorsMap, 'calculas', baseFilters);
  assert.ok(typoMatch.some((c) => c.id === 'math-137'));
  assert.ok(typoMatch.some((c) => c.id === 'mat-1320'));

  const uottawaOnly = filterAndSearchCourses(DEMO_COURSES, statsMap, instructorsMap, '', {
    ...baseFilters,
    universityId: 'uottawa',
  });
  assert.ok(uottawaOnly.every((c) => c.universityId === 'uottawa'));
  assert.ok(uottawaOnly.some((c) => c.id === 'mat-1320'));
});

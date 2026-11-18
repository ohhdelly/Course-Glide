import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCourseStats,
  evaluateReviewQuality,
  extractReviewHighlightSegments,
  filterAndSearchCourses,
  rankAndFilterReviews,
  sortAndFilterReviews,
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

test('Empty-review courses do not spoof zero difficulty or zero study strategy metrics', () => {
  const emptyStats = computeCourseStats([]);
  assert.equal(emptyStats.responseCount, 0);
  assert.equal(emptyStats.studyStrategyStats.length, 0);

  const statsMap = {
    'math-137': computeCourseStats(DEMO_REVIEWS.filter((r) => r.courseId === 'math-137')),
    'ece-105': emptyStats,
  };
  const fakeUnreviewed = {
    ...DEMO_COURSES[0],
    id: 'ece-105',
    code: 'ECE 105',
    subjectCode: 'ECE',
    title: 'Classical Mechanics',
  };
  const pool = [DEMO_COURSES[0], fakeUnreviewed];

  const under6Hrs = filterAndSearchCourses(pool, statsMap, {}, '', {
    universityId: 'all',
    department: 'all',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 6,
    sortBy: 'relevance',
  });
  assert.equal(under6Hrs.some((c) => c.id === 'ece-105'), false);

  const withoutReviews = filterAndSearchCourses(pool, statsMap, {}, '', {
    universityId: 'all',
    department: 'all',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 'all',
    hasReviews: 'without_reviews',
    sortBy: 'relevance',
  });
  assert.deepEqual(
    withoutReviews.map((c) => c.id),
    ['ece-105']
  );
});

test('CatalogueService loads full Waterloo 2026-2027 catalogue and keeps uOttawa strictly separated', async () => {
  const { CatalogueService } = await import('../../server/catalogueService.ts');
  const service = new CatalogueService();
  const meta = service.getMetadata();

  assert.ok(meta.waterlooCourseCount >= 4000, `Expected 4000+ Waterloo courses, got ${meta.waterlooCourseCount}`);
  assert.equal(meta.uottawaCourseCount, 3);
  assert.equal(meta.totalCourses, meta.waterlooCourseCount + meta.uottawaCourseCount);

  const ece105 = service.getCourseById('ece-105');
  assert.ok(ece105, 'Expected ECE 105 in Waterloo catalogue');
  assert.equal(ece105.universityId, 'uwaterloo');
  assert.equal(ece105.isOfficialCatalog, true);

  const waterlooPage = service.queryCourses({
    query: '',
    filters: {
      universityId: 'uwaterloo',
      department: 'all',
      level: 'all',
      maxDifficulty: 'all',
      maxHours: 'all',
      sortBy: 'code',
    },
    reviews: DEMO_REVIEWS,
    page: 1,
    limit: 24,
  });
  assert.equal(waterlooPage.total, meta.waterlooCourseCount);
  assert.ok(waterlooPage.courses.every((c) => c.universityId === 'uwaterloo'));

  const uottawaPage = service.queryCourses({
    query: '',
    filters: {
      universityId: 'uottawa',
      department: 'all',
      level: 'all',
      maxDifficulty: 'all',
      maxHours: 'all',
      sortBy: 'code',
    },
    reviews: DEMO_REVIEWS,
    page: 1,
    limit: 24,
  });
  assert.equal(uottawaPage.total, 3);
  assert.ok(uottawaPage.courses.every((c) => c.universityId === 'uottawa'));
});

test('Review highlight segmentation preserves verbatim text and tags concrete student details', () => {
  const sample =
    'Weekly problem sets took 12 hrs/wk and the midterm tested proofs, so use TA office hours and practice exams.';
  const segments = extractReviewHighlightSegments(sample);
  assert.equal(
    segments.map((s) => s.text).join(''),
    sample,
    'Concatenated segments must match original review text verbatim'
  );
  const highlighted = segments.filter((s) => Boolean(s.category));
  assert.ok(highlighted.length > 0 && highlighted.length <= 3);
  assert.ok(highlighted.some((s) => s.category === 'workload'));

  const vague = 'This course was alright overall.';
  const vagueSegments = extractReviewHighlightSegments(vague);
  assert.deepEqual(vagueSegments, [{ text: vague }]);
  assert.deepEqual(extractReviewHighlightSegments(''), []);
});

test('Term filter matches courses by termsOffered in local and catalogue queries', async () => {
  const statsMap = Object.fromEntries(
    DEMO_COURSES.map((c) => [c.id, computeCourseStats(DEMO_REVIEWS.filter((r) => r.courseId === c.id))])
  );

  const springCourses = filterAndSearchCourses(DEMO_COURSES, statsMap, {}, '', {
    universityId: 'all',
    term: 'Spring',
    department: 'all',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 'all',
    sortBy: 'code',
  });
  assert.ok(springCourses.some((c) => c.id === 'econ-101'));
  assert.ok(springCourses.some((c) => c.id === 'cs-240'));
  assert.equal(springCourses.some((c) => c.id === 'math-137'), false);

  const { CatalogueService } = await import('../../server/catalogueService.ts');
  const service = new CatalogueService();
  const springPage = service.queryCourses({
    query: '',
    filters: {
      universityId: 'uwaterloo',
      term: 'Spring',
      department: 'all',
      level: 'all',
      maxDifficulty: 'all',
      maxHours: 'all',
      sortBy: 'code',
    },
    reviews: DEMO_REVIEWS,
    page: 1,
    limit: 24,
  });
  assert.ok(springPage.total >= 1);
  assert.ok(springPage.courses.every((c) => c.termsOffered.includes('Spring')));
});

test('sortAndFilterReviews supports most_helpful, most_recent, rating sort, and rating filters', () => {
  const r1 = makeReview({
    id: 'r-helpful',
    helpfulVotes: 25,
    notHelpfulVotes: 1,
    difficulty: 2,
    recommended: true,
    createdAt: '2025-01-10T10:00:00.000Z',
  });
  const r2 = makeReview({
    id: 'r-recent',
    helpfulVotes: 4,
    notHelpfulVotes: 0,
    difficulty: 5,
    recommended: false,
    overallExperience:
      'Challenging midterm weighting and heavy weekly problem sets made pacing hard.',
    whatWorkedWell:
      'Recorded lecture walkthroughs and posted solutions helped clarify tricky proof techniques.',
    whatWasChallenging:
      'Timed exams required fast recall of edge-case counterexamples not emphasized in class.',
    practicalAdvice:
      'Review past finals early and drill counterexamples weekly with a study partner.',
    createdAt: '2026-01-15T10:00:00.000Z',
  });
  const r3 = makeReview({
    id: 'r-brief',
    helpfulVotes: 0,
    notHelpfulVotes: 0,
    difficulty: 3,
    recommended: true,
    overallExperience: 'Pretty good.',
    whatWorkedWell: '',
    whatWasChallenging: '',
    practicalAdvice: '',
    studyMethods: [],
    createdAt: '2025-09-01T10:00:00.000Z',
  });

  const byHelpful = sortAndFilterReviews([r1, r2, r3], {
    sortBy: 'most_helpful',
    ratingFilter: 'all',
    includeLimited: false,
  });
  assert.equal(byHelpful.displayed[0]?.id, 'r-helpful');
  assert.equal(byHelpful.hiddenLimitedCount, 1);

  const byRecent = sortAndFilterReviews([r1, r2, r3], {
    sortBy: 'most_recent',
    ratingFilter: 'all',
    includeLimited: true,
  });
  assert.equal(byRecent.displayed[0]?.id, 'r-recent');
  assert.equal(byRecent.displayed.length, 3);

  const byRatingDesc = sortAndFilterReviews([r1, r2, r3], {
    sortBy: 'rating_desc',
    ratingFilter: 'all',
    includeLimited: true,
  });
  assert.equal(byRatingDesc.displayed[0]?.id, 'r-recent');
  assert.equal(byRatingDesc.displayed[2]?.id, 'r-helpful');

  const highDiffOnly = sortAndFilterReviews([r1, r2, r3], {
    sortBy: 'trust_lens',
    ratingFilter: 'difficulty_high',
    includeLimited: true,
  });
  assert.deepEqual(
    highDiffOnly.displayed.map((r) => r.id),
    ['r-recent']
  );

  const criticalOnly = sortAndFilterReviews([r1, r2, r3], {
    sortBy: 'trust_lens',
    ratingFilter: 'critical',
    includeLimited: true,
  });
  assert.deepEqual(
    criticalOnly.displayed.map((r) => r.id),
    ['r-recent']
  );
});



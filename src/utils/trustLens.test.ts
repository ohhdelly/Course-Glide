import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCourseStats,
  computeLoadIndex,
  computePeakWeekMap,
  computeTeachingTeamView,
  evaluateReviewQuality,
  extractReviewHighlightSegments,
  filterAndSearchCourses,
  generateDeterministicStaffDigest,
  rankAndFilterReviews,
  termFreshnessWeight,
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

test('Load index weights mental effort above raw hours and rises on every axis', () => {
  const base = computeLoadIndex(10, 3, 3);
  assert.ok(base > 0 && base < 100);

  const hoursJump = computeLoadIndex(25, 3, 3) - base;
  const effortJump = computeLoadIndex(10, 5, 3) - base;
  const stressJump = computeLoadIndex(10, 3, 5) - base;

  assert.ok(hoursJump > 0 && effortJump > 0 && stressJump > 0);
  assert.ok(
    effortJump > hoursJump,
    'mental effort must move the load index more than raw hours do'
  );
});

test('Small samples are shrunk into a range instead of a precise score', () => {
  const one = computeCourseStats([makeReview({ id: 'only', usefulness: 5 })], {
    priorRating: 3.6,
    priorWeight: 4,
    priorLabel: 'Mathematics',
  });
  assert.ok(one.rating.point < 5, 'a single 5/5 must not be published as a precise 5.0');
  assert.ok(one.rating.low <= one.rating.point && one.rating.point <= one.rating.high);
  assert.ok(one.rating.high - one.rating.low > 0.2, 'small samples need a visibly wide band');
  assert.equal(one.rating.anchoredToDepartment, true);
  assert.equal(one.rating.priorLabel, 'Mathematics');

  const many = computeCourseStats(
    Array.from({ length: 40 }, (_, index) => makeReview({ id: `bulk-${index}`, usefulness: 5 })),
    { priorRating: 3.6, priorWeight: 4 }
  );
  assert.ok(many.rating.point > 4.8, 'large samples should converge on the observed value');
  assert.ok(many.rating.high - many.rating.low < 0.6, 'large samples should narrow the band');
});

test('Averages are weighted toward the newest term and labelled with an as-of term', () => {
  const reviews = [
    makeReview({ id: 'old', term: 'Fall 2023', weeklyHours: 4, difficulty: 2 }),
    makeReview({ id: 'new', term: 'Fall 2026', weeklyHours: 16, difficulty: 5 }),
  ];
  const stats = computeCourseStats(reviews);

  assert.ok(
    stats.avgWeeklyHours > 10,
    'the recent 16-hour review should pull the average above the plain mean of 10'
  );
  assert.equal(stats.asOf, 'Fall 2026');
  assert.ok(stats.weightingNote.includes('Fall 2026'));
  assert.equal(termFreshnessWeight('Fall 2026', 'Fall 2026'), 1);
  assert.ok(termFreshnessWeight('Fall 2023', 'Fall 2026') < 0.5);
});

test('Legacy reviews without the new axes fall back to difficulty instead of zero', () => {
  const stats = computeCourseStats([makeReview({ id: 'legacy', difficulty: 4 })]);
  assert.equal(stats.load.avgMentalEffort, 4);
  assert.equal(stats.load.avgStress, 4);
  assert.equal(stats.load.avgWeeklyHours, 12);
  assert.ok(stats.load.loadIndex > 0);
});

test('Effort-to-success bands group hours by target grade without exposing a grade distribution', () => {
  const stats = computeCourseStats(DEMO_REVIEWS.filter((review) => review.courseId === 'math-137'));
  assert.ok(stats.effortToSuccess.length > 0, 'demo reviews declare target grades');

  for (const band of stats.effortToSuccess) {
    assert.ok(band.reviewCount > 0);
    assert.ok(band.minWeeklyHours <= band.avgWeeklyHours);
    assert.ok(band.avgWeeklyHours <= band.maxWeeklyHours);
    assert.ok(Array.isArray(band.topMethods));
  }
  assert.equal(
    (stats as unknown as Record<string, unknown>).gradeDistribution,
    undefined,
    'no grade distribution may be exposed on CourseStats'
  );
});

test('Peak-week map stays inside the term and names a busiest week', () => {
  const course = DEMO_COURSES.find((item) => item.id === 'math-137');
  assert.ok(course);
  const map = computePeakWeekMap(
    course!,
    DEMO_REVIEWS.filter((review) => review.courseId === 'math-137')
  );

  assert.equal(map.cells.length, 13);
  assert.ok(map.busiestWeek >= 1 && map.busiestWeek <= 13);
  assert.ok(map.cells.every((cell) => cell.intensity >= 0 && cell.intensity <= 100));
  assert.ok(map.cells.some((cell) => cell.intensity === 100));
  assert.ok(map.note.length > 0);
});

test('TA section view only counts reviews that name that TA', () => {
  const ta = DEMO_INSTRUCTORS.find((instructor) => instructor.name.includes('Maya Lin'));
  assert.ok(ta);
  const courseReviews = DEMO_REVIEWS.filter((review) => review.courseId === 'math-137');
  const view = computeTeachingTeamView(ta!, courseReviews);

  assert.ok(view.matchedReviewCount >= 1);
  assert.ok(view.matchedReviewCount < courseReviews.length, 'the course average must not be reused as a TA view');
  assert.ok(view.confusionThemes.length + view.helpfulThemes.length > 0);
  assert.ok(view.note.length > 0);
});

test('Staff digest produces three actionable buckets without an AI key', () => {
  const course = DEMO_COURSES.find((item) => item.id === 'math-137');
  assert.ok(course);
  const digest = generateDeterministicStaffDigest(
    course!,
    DEMO_REVIEWS.filter((review) => review.courseId === 'math-137')
  );

  assert.equal(digest.source, 'deterministic');
  assert.ok(digest.start.length > 0, 'start bucket should contain something');
  assert.ok(digest.stop.length > 0, 'stop bucket should contain something');
  assert.ok(digest.keep.length > 0, 'keep bucket should contain something');
  assert.ok(digest.checklist.length > 0);

  const knownIds = new Set(DEMO_REVIEWS.map((review) => review.id));
  for (const item of [...digest.start, ...digest.stop, ...digest.keep]) {
    assert.ok(item.evidenceReviewIds.every((id) => knownIds.has(id)));
    assert.ok(item.text.length > 0);
  }
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


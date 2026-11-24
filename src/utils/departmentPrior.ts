import type { Course, Review } from '../types/course.ts';
import type { CourseStatsOptions } from './trustLens.ts';

/**
 * One definition of the department rating prior, shared by the client stats map
 * and the `/api/courses/:id` response. The prior is the mean raw usefulness of
 * every visible review in the same university + department, with a pseudo-count
 * between 2 and 8 equal to the number of reviewed courses in that department.
 *
 * Both the number and its explanation read these constants, so a UI popover can
 * never describe a different prior from the one used in the shrinkage.
 */
export const DEPARTMENT_PRIOR_WEIGHT_MIN = 2;
export const DEPARTMENT_PRIOR_WEIGHT_MAX = 8;

export function departmentPriorKey(universityId: string, department: string): string {
  return `${universityId}::${department}`;
}

interface DepartmentBucket {
  sum: number;
  count: number;
  courseIds: Set<string>;
}

function priorFromBucket(
  bucket: DepartmentBucket | undefined,
  label: string
): CourseStatsOptions | undefined {
  if (!bucket || bucket.count === 0) return undefined;
  return {
    priorRating: bucket.sum / bucket.count,
    priorWeight: Math.min(
      DEPARTMENT_PRIOR_WEIGHT_MAX,
      Math.max(DEPARTMENT_PRIOR_WEIGHT_MIN, bucket.courseIds.size)
    ),
    priorLabel: label,
  };
}

/**
 * Builds every department prior in one pass. Used by the client, which already
 * has all courses and reviews in memory.
 */
export function buildDepartmentPriors(
  courses: Iterable<Course>,
  reviewsByCourse: Map<string, Review[]>
): Map<string, CourseStatsOptions> {
  const buckets = new Map<string, DepartmentBucket>();

  for (const course of courses) {
    const visible = (reviewsByCourse.get(course.id) ?? []).filter(
      (review) => review.moderationStatus !== 'hidden'
    );
    if (visible.length === 0) continue;
    const key = departmentPriorKey(course.universityId, course.department);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0, courseIds: new Set<string>() };
    for (const review of visible) {
      bucket.sum += review.usefulness;
      bucket.count += 1;
    }
    bucket.courseIds.add(course.id);
    buckets.set(key, bucket);
  }

  const priors = new Map<string, CourseStatsOptions>();
  for (const [key, bucket] of buckets) {
    const label = key.slice(key.indexOf('::') + 2);
    const prior = priorFromBucket(bucket, label);
    if (prior) priors.set(key, prior);
  }
  return priors;
}

/**
 * Builds the prior for one course from a flat review list. Used by the server,
 * which resolves each review's owning course through the catalogue.
 */
export function collectDepartmentPrior(
  course: Course,
  reviews: Iterable<Review>,
  courseOf: (courseId: string) => Course | undefined
): CourseStatsOptions | undefined {
  const bucket: DepartmentBucket = { sum: 0, count: 0, courseIds: new Set<string>() };

  for (const review of reviews) {
    if (review.moderationStatus === 'hidden') continue;
    const owner = courseOf(review.courseId);
    if (owner?.universityId !== course.universityId || owner?.department !== course.department) {
      continue;
    }
    bucket.sum += review.usefulness;
    bucket.count += 1;
    bucket.courseIds.add(review.courseId);
  }

  return priorFromBucket(bucket, course.department);
}

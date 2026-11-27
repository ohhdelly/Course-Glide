import type { Course } from '../types/course';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'their', 'they',
  'students', 'student', 'course', 'courses', 'introduction', 'introductory',
  'topics', 'including', 'will', 'are', 'was', 'have', 'has', 'its', 'you',
  'your', 'not', 'but', 'all', 'any', 'may', 'can', 'how', 'use', 'used',
]);

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
  );
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

function prerequisiteSubjects(course: Course): Set<string> {
  const codes = course.prerequisites?.match(/\b[A-Z]{2,6}\s?\d{2,3}[A-Z]?\b/g) ?? [];
  return new Set(codes.map((code) => code.replace(/\s+/g, ' ').split(' ')[0]));
}

/**
 * How close another catalogue course sits to a searched course: same subject and
 * level weigh most, then shared calendar wording (e.g. both are calculus courses)
 * and a shared prerequisite subject. The anchor is always 100.
 */
export function courseSimilarityPercent(anchor: Course, candidate: Course): number {
  if (anchor.id === candidate.id) return 100;

  let score = 0;

  const anchorSubject = anchor.subjectCode ?? anchor.code.split(' ')[0];
  const candidateSubject = candidate.subjectCode ?? candidate.code.split(' ')[0];
  if (anchorSubject === candidateSubject) score += 34;

  const levelGap = Math.abs(anchor.level - candidate.level);
  score += Math.max(0, 26 - levelGap * 9);

  const anchorWords = words(`${anchor.title} ${anchor.description}`);
  const candidateWords = words(`${candidate.title} ${candidate.description}`);
  score += Math.round(26 * overlapRatio(anchorWords, candidateWords));

  const anchorPrereqs = prerequisiteSubjects(anchor);
  const candidatePrereqs = prerequisiteSubjects(candidate);
  const sharedPrereqs = [...anchorPrereqs].filter((subject) => candidatePrereqs.has(subject)).length;
  if (sharedPrereqs > 0) {
    score += Math.round(10 * (sharedPrereqs / Math.max(anchorPrereqs.size, candidatePrereqs.size)));
  }

  return Math.max(8, Math.min(99, score));
}

/** True when a query is a single course code such as "MATH 137" or "cs135". */
export function isCourseCodeQuery(query: string): boolean {
  return /^[a-z]{2,6}\d{2,4}[a-z]?$/.test(query.replace(/\s+/g, '').toLowerCase());
}

export function findCourseByCode(courses: Course[], query: string): Course | undefined {
  const compactQuery = query.replace(/\s+/g, '').toLowerCase();
  return courses.find((course) => course.code.replace(/\s+/g, '').toLowerCase() === compactQuery);
}

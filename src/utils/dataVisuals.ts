import type { Course, CourseStats, Review } from '../types/course.ts';

export interface RatingDistributionRow {
  rating: 1 | 2 | 3 | 4 | 5;
  label: string;
  count: number;
  percentage: number;
}

export interface WorkloadBreakdownSegment {
  key: 'lectures' | 'assignments' | 'studying' | 'exams';
  label: string;
  hours: number;
  percentage: number;
  tokenVar: '--chart-1' | '--chart-2' | '--chart-3' | '--text';
  pattern: 'solid' | 'diagonal' | 'dots' | 'cross';
}

export interface WorkloadBreakdownData {
  totalHours: number;
  segments: WorkloadBreakdownSegment[];
}

export interface TermWorkloadSegment {
  courseId: string;
  code: string;
  title: string;
  weeklyHours: number;
  widthPercent: number;
  sharePercent: number;
  tokenVar: '--chart-1' | '--chart-2' | '--text' | '--text-muted';
  pattern: 'solid' | 'diagonal' | 'dots' | 'vertical';
}

export interface TermWorkloadSummary {
  segments: TermWorkloadSegment[];
  reviewedCourseCount: number;
  unreviewedCourseCount: number;
  totalHours: number;
  scaleMaxHours: number;
  limitHours: number | null;
  exceededByHours: number | null;
  limitMarkerPercent: number | null;
  headlineText: string;
  sublineText: string | null;
}

const SEGMENT_PATTERNS: Array<TermWorkloadSegment['pattern']> = [
  'solid',
  'diagonal',
  'dots',
  'vertical',
];

const SEGMENT_TOKENS: Array<TermWorkloadSegment['tokenVar']> = [
  '--chart-1',
  '--chart-2',
  '--text',
  '--text-muted',
];

export function formatHoursCompact(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function computeRatingDistribution(reviews: Review[]): {
  total: number;
  rows: RatingDistributionRow[];
} {
  const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
  const total = visible.length;
  const ratings: Array<5 | 4 | 3 | 2 | 1> = [5, 4, 3, 2, 1];

  const rows: RatingDistributionRow[] = ratings.map((rating) => {
    const count = visible.filter((r) => r.usefulness === rating).length;
    return {
      rating,
      label: `${rating}`,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  return { total, rows };
}

export function extractRealWorkloadBreakdown(
  course: Course
): WorkloadBreakdownData | null {
  const raw = course.workloadBreakdown;
  if (!raw) return null;

  const candidates: Array<{
    key: WorkloadBreakdownSegment['key'];
    label: string;
    hours: number | undefined;
    tokenVar: WorkloadBreakdownSegment['tokenVar'];
    pattern: WorkloadBreakdownSegment['pattern'];
  }> = [
    { key: 'lectures', label: 'Lectures', hours: raw.lectures, tokenVar: '--chart-1', pattern: 'solid' },
    { key: 'assignments', label: 'Assignments', hours: raw.assignments, tokenVar: '--chart-2', pattern: 'diagonal' },
    { key: 'studying', label: 'Studying', hours: raw.studying, tokenVar: '--text', pattern: 'dots' },
    { key: 'exams', label: 'Exams', hours: raw.exams, tokenVar: '--chart-3', pattern: 'cross' },
  ];

  const valid = candidates.filter(
    (item): item is typeof item & { hours: number } =>
      typeof item.hours === 'number' && Number.isFinite(item.hours) && item.hours > 0
  );

  if (valid.length === 0) return null;

  const totalHours = Math.round(valid.reduce((sum, item) => sum + item.hours, 0) * 10) / 10;
  if (totalHours <= 0) return null;

  return {
    totalHours,
    segments: valid.map((item) => ({
      key: item.key,
      label: item.label,
      hours: Math.round(item.hours * 10) / 10,
      percentage: Math.round((item.hours / totalHours) * 100),
      tokenVar: item.tokenVar,
      pattern: item.pattern,
    })),
  };
}

export function buildTermWorkloadSummary(
  savedCourses: Course[],
  statsMap: Record<string, CourseStats>,
  rawLimit: number | null
): TermWorkloadSummary {
  const reviewed = savedCourses.filter((course) => {
    const s = statsMap[course.id];
    return Boolean(s && s.responseCount > 0 && s.avgWeeklyHours > 0);
  });
  const unreviewedCourseCount = savedCourses.length - reviewed.length;

  const totalHours =
    Math.round(
      reviewed.reduce((sum, course) => sum + (statsMap[course.id]?.avgWeeklyHours ?? 0), 0) * 10
    ) / 10;

  const limitHours =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.round(rawLimit * 10) / 10
      : null;

  const scaleMaxHours =
    limitHours !== null ? Math.max(totalHours, limitHours) : Math.max(totalHours, 0);

  const exceededByHours =
    limitHours !== null && totalHours > limitHours
      ? Math.round((totalHours - limitHours) * 10) / 10
      : null;

  const limitMarkerPercent =
    limitHours !== null && scaleMaxHours > 0
      ? Math.min(100, Math.max(0, (limitHours / scaleMaxHours) * 100))
      : null;

  const segments: TermWorkloadSegment[] = reviewed.map((course, index) => {
    const hours = Math.round((statsMap[course.id]?.avgWeeklyHours ?? 0) * 10) / 10;
    return {
      courseId: course.id,
      code: course.code,
      title: course.title,
      weeklyHours: hours,
      widthPercent: scaleMaxHours > 0 ? (hours / scaleMaxHours) * 100 : 0,
      sharePercent: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
      tokenVar: SEGMENT_TOKENS[index % SEGMENT_TOKENS.length],
      pattern: SEGMENT_PATTERNS[index % SEGMENT_PATTERNS.length],
    };
  });

  const courseWord = reviewed.length === 1 ? 'course' : 'courses';
  const headlineText =
    exceededByHours !== null
      ? `Over your limit by ${formatHoursCompact(exceededByHours)} h`
      : `About ${formatHoursCompact(totalHours)} h/wk across ${reviewed.length} ${courseWord}`;

  const sublineText =
    exceededByHours !== null
      ? `About ${formatHoursCompact(totalHours)} h/wk across ${reviewed.length} ${courseWord} (limit ${formatHoursCompact(limitHours!)} h/wk)`
      : limitHours !== null
      ? `Within your ${formatHoursCompact(limitHours)} h/wk limit (${formatHoursCompact(Math.round((limitHours - totalHours) * 10) / 10)} h remaining)`
      : null;

  return {
    segments,
    reviewedCourseCount: reviewed.length,
    unreviewedCourseCount,
    totalHours,
    scaleMaxHours,
    limitHours,
    exceededByHours,
    limitMarkerPercent,
    headlineText,
    sublineText,
  };
}

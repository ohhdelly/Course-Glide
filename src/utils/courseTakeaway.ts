import type { Course, CourseStats } from '../types/course.ts';

/**
 * Produces a concise, single-sentence decision takeaway grounded strictly in
 * verified course statistics and catalogue metadata.
 */
export function buildOverviewTakeaway(course: Course, stats: CourseStats): string {
  if (stats.responseCount === 0) {
    const hasPrereqs = Boolean(course.prerequisites && course.prerequisites.trim().length > 0);
    return hasPrereqs
      ? `No student reviews yet for ${course.code}; check the prerequisites and official calendar record below before enrolling.`
      : `No student reviews yet for ${course.code}; check the official calendar record below or add the first student report.`;
  }

  const difficultyLabel =
    stats.avgDifficulty >= 4.0
      ? 'demanding'
      : stats.avgDifficulty >= 3.0
      ? 'moderate-to-challenging'
      : 'manageable';

  const topStrategy = stats.studyStrategyStats[0];
  const strategyClause = topStrategy
    ? `, with ${topStrategy.label.toLowerCase()} rated most helpful (${topStrategy.helpfulPercentage}%)`
    : '';

  return `Students rate ${course.code} ${difficultyLabel} (${stats.avgDifficulty.toFixed(
    1
  )}/5) at ${stats.avgWeeklyHours.toFixed(1)} h/wk, and ${
    stats.recommendationRate
  }% recommend it${strategyClause}.`;
}

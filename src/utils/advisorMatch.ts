import type {
  AdvisorBrief,
  AdvisorMatchBreakdown,
  AdvisorMatchCheck,
  AdvisorResult,
} from '../types/course';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * How well a course actually fits the request, as a percentage of the signals the
 * student stated. Each stated limit is scored on its own and the weights are
 * renormalised over only the checks that apply, so a bare "calculus" search is not
 * rewarded as if it satisfied a level, workload and difficulty target.
 *
 * Student evidence always carries a little weight: a course with no reviews can
 * only be judged from the calendar, so it never reads as a perfect fit. A result
 * that stretches a stated limit is capped, however good the rest of it is.
 *
 * The returned breakdown holds the same checks, weights and fits that produced
 * `percent`, so the popover and the AI advisor describe the real calculation.
 */
export function advisorMatchBreakdown(
  brief: AdvisorBrief,
  result: AdvisorResult
): AdvisorMatchBreakdown {
  const { course, stats } = result;
  const checks: AdvisorMatchCheck[] = [];

  const topicParts: number[] = [];
  const topicDetails: string[] = [];
  if (brief.subjectCodes.length > 0) {
    const subject = (course.subjectCode ?? course.code.split(' ')[0]).toLowerCase();
    const matches = brief.subjectCodes.some((code) => code.toLowerCase() === subject);
    topicParts.push(matches ? 1 : 0);
    topicDetails.push(
      `Subject ${subject.toUpperCase()} ${matches ? 'matches' : 'does not match'} ${brief.subjectCodes.join(', ')}`
    );
  }
  const keywords = brief.keywords
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
  if (keywords.length > 0) {
    const haystack = `${course.title} ${course.description}`.toLowerCase();
    const hits = keywords.filter((keyword) => haystack.includes(keyword)).length;
    topicParts.push(Math.min(1, hits / Math.min(3, keywords.length)));
    topicDetails.push(
      `${hits} of your ${keywords.length} keywords appear in the title or description (3 keyword hits earn full credit)`
    );
  }
  if (topicParts.length > 0) {
    const fit = topicParts.reduce((sum, part) => sum + part, 0) / topicParts.length;
    checks.push({
      key: 'topic',
      label: 'Topic fit',
      weight: 34,
      fit,
      input: topicDetails.join('; '),
      points: 34 * fit,
    });
  }

  if (brief.level !== 'all') {
    checks.push({
      key: 'level',
      label: 'Level fit',
      weight: 18,
      fit: course.level === brief.level ? 1 : 0,
      input: `Course is ${course.level}-level; you asked for ${brief.level}-level`,
      points: course.level === brief.level ? 18 : 0,
    });
  }

  if (brief.maxHours !== 'all') {
    const target = brief.maxHours;
    const fit =
      stats.responseCount === 0
        ? 0.3
        : stats.avgWeeklyHours <= target
          ? 1
          : clamp(1 - (stats.avgWeeklyHours - target) / target, 0, 0.5);
    checks.push({
      key: 'hours',
      label: 'Weekly-hours fit',
      weight: 14,
      fit,
      input:
        stats.responseCount === 0
          ? `No reviews, so the ${target} h/week cap cannot be verified (30% credit)`
          : `Students average ${stats.avgWeeklyHours.toFixed(1)} h/week across ${stats.responseCount} review${stats.responseCount === 1 ? '' : 's'}; your cap is ${target} h/week`,
      points: 14 * fit,
    });
  }

  if (brief.maxDifficulty !== 'all') {
    const fit =
      stats.responseCount === 0
        ? 0.3
        : stats.avgDifficulty <= brief.maxDifficulty
          ? 1
          : clamp(1 - (stats.avgDifficulty - brief.maxDifficulty) / 5, 0, 0.5);
    checks.push({
      key: 'difficulty',
      label: 'Difficulty fit',
      weight: 14,
      fit,
      input:
        stats.responseCount === 0
          ? `No reviews, so the ${brief.maxDifficulty}/5 cap cannot be verified (30% credit)`
          : `Students rate difficulty ${stats.avgDifficulty.toFixed(1)}/5; your cap is ${brief.maxDifficulty}/5`,
      points: 14 * fit,
    });
  }

  if (brief.wantsReviews) {
    checks.push({
      key: 'reviews',
      label: 'Reviewed course',
      weight: 12,
      fit: stats.responseCount > 0 ? 1 : 0,
      input: `You asked for reviewed courses; this one has ${stats.responseCount} review${stats.responseCount === 1 ? '' : 's'}`,
      points: stats.responseCount > 0 ? 12 : 0,
    });
  }

  const evidenceFit = Math.min(1, stats.responseCount / 5);
  checks.push({
    key: 'evidence',
    label: 'Student evidence',
    weight: 10,
    fit: evidenceFit,
    input: `${stats.responseCount} review${stats.responseCount === 1 ? '' : 's'} counted toward the 5-review evidence cap`,
    points: 10 * evidenceFit,
  });

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + check.weight * check.fit, 0);
  const rawPercent = Math.round((earned / totalWeight) * 100);
  const cautionPenalty = result.caution ? Math.max(6, Math.round(rawPercent * 0.12)) : 0;
  const percent = clamp(rawPercent - cautionPenalty, 5, 96);

  return {
    percent,
    rawPercent,
    checks,
    totalWeight,
    earned,
    cautionApplied: Boolean(result.caution),
    cautionPenalty,
    minPercent: 5,
    maxPercent: 96,
  };
}

export function advisorMatchPercent(brief: AdvisorBrief, result: AdvisorResult): number {
  return advisorMatchBreakdown(brief, result).percent;
}

import type {
  AdvisorMatchBreakdown,
  CourseStats,
  PeakWeekMap,
  ScoreBasis,
  ScoreComponent,
  ScoreExplanation,
  StudyMethodStat,
  TrustLensEvaluation,
} from '../types/course.ts';
import { LOAD_INDEX_FORMULA, STUDY_METHOD_CATALOG } from './trustLens.ts';

/**
 * Turns the breakdowns emitted by the calculators into the exact text the UI
 * popovers and the explanation endpoint render. Nothing here re-derives a score:
 * every number in an explanation is copied from the calculation output, so copy
 * cannot drift from the value on screen.
 */

export const BASIS_LABEL: Record<ScoreBasis, string> = {
  reported: 'Self-reported · not independently validated',
  estimate: 'Estimate · not validated',
  sample_data: 'Sample data · not calculated',
};

const COMMON_EXCLUSIONS = [
  'Instructor quality and teaching style',
  'Grading policy, curve, or predicted grade',
  'Class times, delivery mode, and personal schedule',
];

function formatWeight(weight: number): string {
  return `${Math.round(weight * 100)}% of the index`;
}

function reviewWord(count: number): string {
  return count === 1 ? 'review' : 'reviews';
}

function termWeightComponents(stats: CourseStats): ScoreComponent[] {
  const weighting = stats.scoreBreakdowns?.weighting;
  if (!weighting) return [];
  return weighting.terms.map((row) => ({
    label: `Term ${row.term}`,
    input: `${row.reviews} ${reviewWord(row.reviews)}`,
    weight: `term weight ${row.weight.toFixed(2)}`,
    contribution: `${row.weightPercent}% of total weight`,
  }));
}

function weightingSentence(stats: CourseStats): string {
  const weighting = stats.scoreBreakdowns?.weighting;
  if (!weighting) return '';
  return `Recent terms count more: each earlier term is ×${weighting.decayPerTerm} the next one, never below ×${weighting.floor}. The newest term here is ${weighting.referenceTerm}.`;
}

export function explainDifficulty(stats: CourseStats): ScoreExplanation {
  const breakdown = stats.scoreBreakdowns?.difficulty;
  const components: ScoreComponent[] = breakdown
    ? [
        {
          label: 'Self-reported difficulty',
          input: `${breakdown.reviews} ${reviewWord(breakdown.reviews)} rated 1–5`,
          weight: 'weighted mean',
          contribution: `= ${breakdown.avg.toFixed(1)} / 5`,
        },
        ...termWeightComponents(stats),
      ]
    : [];

  return {
    key: 'difficulty',
    label: 'Difficulty',
    value: stats.responseCount > 0 ? `${stats.avgDifficulty.toFixed(1)} / 5` : 'N/A',
    summary:
      stats.responseCount > 0
        ? `The freshness-weighted average of the 1–5 difficulty each of ${stats.responseCount} student${stats.responseCount === 1 ? '' : 's'} chose.`
        : 'No student has rated this course yet.',
    formula: 'Σ(difficulty × term weight) ÷ Σ(term weight), rounded to 1 decimal',
    basis: 'reported',
    components,
    exclusions: [
      'Your own background and preparation',
      'Measured hours (shown separately as weekly hours)',
      ...COMMON_EXCLUSIONS,
    ],
    caveat:
      'Difficulty is a self-report, not an audited measure. Read it with the response count and the range in the reviews.',
  };
}

export function explainWorkload(stats: CourseStats): ScoreExplanation {
  const breakdown = stats.load.breakdown;
  const components: ScoreComponent[] = breakdown
    ? breakdown.components.map((component) => ({
        label: component.label,
        input:
          component.key === 'hours'
            ? `${component.input.toFixed(1)} hrs/week`
            : `${component.input.toFixed(1)} / 5`,
        weight: formatWeight(component.weight),
        contribution: `${component.points.toFixed(1)} pts`,
      }))
    : [];

  if (breakdown) {
    const effort = breakdown.components.find((component) => component.key === 'effort');
    const stress = breakdown.components.find((component) => component.key === 'stress');
    const hours = breakdown.components.find((component) => component.key === 'hours');
    components.push({
      label: 'Axis caps',
      input: `Time ${hours?.normalized.toFixed(2)} · effort ${effort?.normalized.toFixed(2)} · stress ${stress?.normalized.toFixed(2)}`,
      weight: 'each axis capped at 1.0',
      contribution: 'caps stop one axis dominating',
    });
  }

  components.push({
    label: 'Band',
    input: 'Light <25 · Manageable <50 · Demanding <75 · Very demanding ≥75',
    weight: 'index bands',
    contribution: stats.load.label,
  });

  return {
    key: 'workload',
    label: 'Workload index',
    value:
      stats.responseCount > 0 ? `${stats.load.loadIndex} / 100 · ${stats.load.label}` : 'N/A',
    summary:
      stats.responseCount > 0
        ? 'A 0–100 estimate that prices a term by time, mental effort, and stress together, with effort weighted highest.'
        : 'No student has reported time, mental effort, or stress for this course yet.',
    formula: LOAD_INDEX_FORMULA,
    basis: 'estimate',
    components,
    exclusions: [
      'Instructor quality, grading policy, and class times',
      'Your own schedule, commute, and other courses',
      'Exam format or assessment structure',
    ],
    caveat:
      'The 30/45/25 weights and the 25-hour cap are design choices, not a validated workload model. Treat this as an estimate, not a verdict.',
  };
}

export function explainRecommend(stats: CourseStats): ScoreExplanation {
  const breakdown = stats.scoreBreakdowns?.recommend;
  const components: ScoreComponent[] = breakdown
    ? [
        {
          label: 'Recommend votes',
          input: `${breakdown.recommends} of ${breakdown.reviews} ${reviewWord(breakdown.reviews)} recommend`,
          weight: 'freshness weighted',
          contribution: `${breakdown.weightedRecommended.toFixed(1)} weighted points`,
        },
        ...termWeightComponents(stats),
      ]
    : [];

  return {
    key: 'recommend',
    label: 'Recommend',
    value: stats.responseCount > 0 ? `${Math.round(stats.recommendationRate)}%` : 'N/A',
    summary:
      'The freshness-weighted share of students who said they would recommend the course.',
    formula: 'Σ(recommended × term weight) ÷ Σ(term weight) × 100',
    basis: 'reported',
    components,
    exclusions: [
      'Grades or learning outcomes',
      'Instructor quality outside the student comments',
      'Your fit with the course content',
    ],
    caveat: `${weightingSentence(stats)} Self-reported and not independently validated.`,
  };
}

export function explainRating(stats: CourseStats): ScoreExplanation {
  const rating = stats.rating;
  const breakdown = rating.breakdown;
  const anchor = rating.anchoredToDepartment
    ? `${rating.priorLabel} prior ${breakdown?.priorRating.toFixed(1) ?? '—'}, weight ${breakdown?.priorWeight.toFixed(1) ?? '—'}`
    : `Neutral prior 3.5, weight ${breakdown?.priorWeight.toFixed(1) ?? '—'}`;

  const components: ScoreComponent[] = breakdown
    ? [
        {
          label: 'Student usefulness',
          input: `${rating.sampleSize} ${reviewWord(rating.sampleSize)} · weighted sum ${breakdown.weightedUsefulnessSum.toFixed(1)}`,
          weight: `Σ term weight ${breakdown.totalWeight.toFixed(1)}`,
          contribution: `${breakdown.weightedUsefulnessSum.toFixed(1)} points`,
        },
        {
          label: 'Prior anchor',
          input: anchor,
          weight: `${breakdown.priorWeight.toFixed(1)} pseudo-reviews`,
          contribution: `${(breakdown.priorRating * breakdown.priorWeight).toFixed(1)} points`,
        },
        {
          label: 'Shrunk midpoint',
          input: `${breakdown.weightedUsefulnessSum.toFixed(1)} + ${(breakdown.priorRating * breakdown.priorWeight).toFixed(1)} over ${(breakdown.totalWeight + breakdown.priorWeight).toFixed(1)}`,
          weight: 'weighted average',
          contribution: breakdown.shrunk.toFixed(2),
        },
        {
          label: 'Uncertainty band',
          input: `standard error ${breakdown.standardError.toFixed(2)} × 1.96 = ${(breakdown.standardError * 1.96).toFixed(2)}`,
          weight: 'clamped to 0.20–1.20',
          contribution: `±${breakdown.margin.toFixed(2)} → ${breakdown.low.toFixed(1)}–${breakdown.high.toFixed(1)}`,
        },
      ]
    : [];

  return {
    key: 'rating',
    label: 'Student rating',
    value:
      rating.sampleSize > 0
        ? `${rating.low.toFixed(1)}–${rating.high.toFixed(1)} / 5 (midpoint ${rating.point.toFixed(1)})`
        : 'N/A',
    summary:
      'Perceived usefulness as a range. The midpoint is pulled toward the department prior so a short sample cannot look precise.',
    formula: '(Σ usefulness × term weight + prior × prior weight) ÷ (Σ term weight + prior weight); band = 1.96 × standard error',
    basis: 'estimate',
    components,
    exclusions: [
      'Predicted grade or difficulty',
      'Instructor quality',
      'Courses outside this department (the prior only)',
    ],
    caveat: `${weightingSentence(stats)} A shrinkage estimate for honest small samples, not a validated psychometric rating.`,
  };
}

export function explainTrust(evaluation?: TrustLensEvaluation): ScoreExplanation {
  const components: ScoreComponent[] = evaluation
    ? evaluation.contributions.map((entry) => ({
        label: entry.label,
        input: entry.detail,
        weight: entry.points >= 0 ? `+${entry.points}` : `${entry.points}`,
        contribution: `${entry.points} pts`,
      }))
    : [
        { label: 'Baseline', input: 'Every submission', weight: '+20', contribution: '+20 pts' },
        {
          label: 'Length',
          input: '25+ words, then 50+ words',
          weight: '+15, then +12',
          contribution: 'up to +27 pts',
        },
        {
          label: 'Course vocabulary',
          input: '2+ then 4+ academic domain terms',
          weight: '+16, then +8',
          contribution: 'up to +24 pts',
        },
        {
          label: 'Context and advice',
          input: 'Assessment/workload context, strengths & challenges, actionable advice',
          weight: '+10 each',
          contribution: 'up to +30 pts',
        },
        {
          label: 'Signals',
          input: 'Verified enrolment, helpfulness net, recency',
          weight: '+5, −8…+10, up to +6',
          contribution: 'varies',
        },
        {
          label: 'Penalties',
          input: 'Duplicate (−35), low information (−28), spam (−40)',
          weight: 'each applies once',
          contribution: 'up to −103 pts',
        },
      ];

  const scoreValue = evaluation ? `${evaluation.score} / 100 · ${evaluation.tier.replace(/_/g, ' ')}` : '5–100';

  return {
    key: 'trust',
    label: 'Trust Lens score',
    value: scoreValue,
    summary:
      'How much usable, course-specific information a review contains. Praise and criticism are scored the same way.',
    formula: 'sum of the points below, clamped to 5–100',
    basis: 'estimate',
    components,
    exclusions: [
      'Whether the student recommends the course',
      'The star rating or sentiment',
      'Whether the claims are true',
    ],
    caveat:
      'A content heuristic: it rewards specificity and detail, not accuracy. Treat it as an estimate of usefulness.',
  };
}

export function explainMatch(breakdown: AdvisorMatchBreakdown): ScoreExplanation {
  const components: ScoreComponent[] = breakdown.checks.map((check) => ({
    label: check.label,
    input: check.input,
    weight: `${check.weight} pts × ${Math.round(check.fit * 100)}% fit`,
    contribution: `${check.points.toFixed(1)} pts`,
  }));

  if (breakdown.cautionApplied) {
    components.push({
      label: 'Outside a stated limit',
      input: 'The course does not meet one of your limits',
      weight: `−${breakdown.cautionPenalty}%`,
      contribution: `${breakdown.rawPercent}% → ${breakdown.percent}%`,
    });
  }

  return {
    key: 'match',
    label: 'Match',
    value: `${breakdown.percent}% match`,
    summary:
      'How much of what you asked for this course satisfies. Only the limits you set are scored, and the weights are renormalised over them.',
    formula: 'Σ(weight × fit) ÷ Σ(weight), then the outside-a-limit nudge, clamped to 5–96',
    basis: 'estimate',
    components,
    exclusions: [
      'Limits you did not state (an unstated cap is not scored)',
      'Class times, instructor quality, and grade outcomes',
      'Anything outside the calendar description and student reviews',
    ],
    caveat:
      'A fit heuristic against your own filters: it is not a prediction that you will do well or enjoy the course.',
  };
}

export function explainPeakWeek(map: PeakWeekMap): ScoreExplanation {
  const components: ScoreComponent[] = (map.sources ?? []).map((source) => ({
    label: source.label,
    input:
      source.kind === 'assessment'
        ? `catalogue weight ${source.weightPercent ?? '—'}% · lands ${source.weeks}`
        : `student week mentions · ${source.weeks}`,
    weight: source.weight !== undefined ? `×${source.weight}` : 'per mention',
    contribution: 'adds to those weeks',
  }));

  components.push({
    label: 'Normalisation',
    input: 'Each week is shown relative to the busiest week',
    weight: 'busiest week = 100',
    contribution: map.busiestWeek > 0 ? `busiest: ${map.busiestLabel}` : 'no signal',
  });

  return {
    key: 'peak_week',
    label: 'Peak-week map',
    value: map.busiestWeek > 0 ? `Busiest: ${map.busiestLabel}` : 'No signal',
    summary:
      'An estimate of where the crunch lands, from catalogue assessment weights and the weeks students explicitly mention.',
    formula:
      'Σ assessment weight placed at its weeks + 0.8–1.2 per student week mention, normalised to the busiest week',
    basis: 'estimate',
    components,
    exclusions: [
      'Assignment release dates and exact deadlines',
      'Your other courses and personal schedule',
      'Reading week or instructor changes',
    ],
    caveat:
      'A planning aid built from a calendar snapshot and review text, not a syllabus. Confirm dates with the course outline.',
  };
}

export function explainStudyMethod(
  strategy: StudyMethodStat,
  stats: CourseStats
): ScoreExplanation {
  const used = strategy.usedCount;
  return {
    key: 'study_method',
    label: `${strategy.label} helpful rate`,
    value: `${strategy.helpfulPercentage}%`,
    summary: `Share of students who used ${strategy.label.toLowerCase()} and reported it as helpful.`,
    formula: 'students who found it helpful ÷ students who used it × 100',
    basis: 'reported',
    components: [
      {
        label: 'Users',
        input: `${used} ${reviewWord(used)} logged this method`,
        weight: 'denominator',
        contribution: `${used}`,
      },
      {
        label: 'Found it helpful',
        input: `${strategy.helpfulCount} marked it helpful (or recommended / rated usefulness 4+)`,
        weight: 'numerator',
        contribution: `${strategy.helpfulCount}`,
      },
      {
        label: 'Preference group',
        input: STUDY_METHOD_CATALOG[strategy.key].preferenceCategory.replace(/_/g, ' '),
        weight: 'filter only',
        contribution: `${strategy.helpfulPercentage}%`,
      },
    ],
    exclusions: [
      'Grades: no method is linked to a measured outcome',
      'Students who never logged the method',
      'Instructor recommendations',
    ],
    caveat:
      'A self-reported correlation from a small sample, not a controlled comparison or guaranteed grade improvement.',
  };
}

/** Deterministic, network-free answer used by the endpoint and as its fallback. */
export function explanationToAnswer(explanation: ScoreExplanation): string {
  const parts = explanation.components
    .slice(0, 7)
    .map((component) => `${component.label}: ${component.input} (${component.weight}) → ${component.contribution}`);
  const basis =
    explanation.basis === 'estimate'
      ? 'This is an estimate, not a validated model.'
      : explanation.basis === 'reported'
        ? 'This comes from what students reported; it is not independently validated.'
        : 'This is sample data, not a calculated score.';
  const exclusions = explanation.exclusions.slice(0, 4).join('; ');
  return `${explanation.label} is ${explanation.value}. ${explanation.summary} ${explanation.formula}. ${parts.join(' · ')}. ${basis} It does not include: ${exclusions}.`;
}

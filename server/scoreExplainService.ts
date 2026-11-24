/**
 * Score explanation service.
 *
 * The deterministic path builds the answer from the exact breakdown the UI
 * shows, with no network and no model, so a demo on a bad connection is instant
 * and always succeeds. When a model is configured it may only *restate* that
 * breakdown: a 2-second hard budget, a number allow-list, and a silent fallback
 * to the deterministic sentence keep it from inventing factors or drifting.
 */
import type {
  AdvisorBrief,
  AdvisorResult,
  Review,
  ScoreExplanation,
} from '../src/types/course.ts';
import { collectDepartmentPrior } from '../src/utils/departmentPrior.ts';
import { advisorMatchBreakdown } from '../src/utils/advisorMatch.ts';
import {
  computeCourseStats,
  computePeakWeekMap,
  evaluateReviewQuality,
  rankAndFilterReviews,
} from '../src/utils/trustLens.ts';
import {
  explainDifficulty,
  explainMatch,
  explainPeakWeek,
  explainRating,
  explainRecommend,
  explainTrust,
  explainWorkload,
  explanationToAnswer,
} from '../src/utils/scoreExplanations.ts';
import type { CatalogueService } from './catalogueService.ts';
import { sanitizeBriefPatch } from './advisorService.ts';
import { generateLlmJson, resolveLlmConfig, type LlmConfig } from './llm.ts';

export type ExplainableScore = Exclude<ScoreExplanation['key'], 'study_method'>;

export const EXPLAINABLE_SCORES: ExplainableScore[] = [
  'difficulty',
  'workload',
  'recommend',
  'rating',
  'trust',
  'match',
  'peak_week',
];

const PHRASE_TIMEOUT_MS = 2000;
const MAX_ANSWER_LENGTH = 420;

export interface ExplainScoreRequest {
  courseId: string;
  score: ExplainableScore;
  reviewId?: string;
  /** Client-held filters for the advisor match score; validated before use. */
  brief?: unknown;
  cautionApplied?: boolean;
  allowAi?: boolean;
}

export interface ExplainScoreDeps {
  catalogue: CatalogueService;
  reviews: Review[];
}

export interface ExplainScoreResponse {
  score: ExplainableScore;
  courseId: string;
  explanation: ScoreExplanation;
  answer: string;
  source: 'deterministic' | 'ai';
  model?: string;
  elapsedMs: number;
}

export interface ExplainScoreFailure {
  error: string;
  status: number;
}

function emptyBrief(patch: Partial<AdvisorBrief>): AdvisorBrief {
  return {
    intent: '',
    subjectCodes: [],
    keywords: [],
    excludeKeywords: [],
    excludeSubjects: [],
    excludeSubjectsLabel: '',
    level: 'all',
    maxDifficulty: 'all',
    maxHours: 'all',
    term: 'all',
    wantsReviews: false,
    constraints: [],
    ...patch,
  };
}

function collectNumbers(texts: string[]): Set<string> {
  const numbers = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/\d+(?:\.\d+)?/g)) numbers.add(match[0]);
  }
  return numbers;
}

/**
 * Any number the model writes must already appear in the breakdown. This is the
 * guard against a plausible-looking but invented statistic.
 */
function usesOnlyKnownNumbers(answer: string, allowed: Set<string>): boolean {
  for (const match of answer.matchAll(/\d+(?:\.\d+)?/g)) {
    if (!allowed.has(match[0])) return false;
  }
  return true;
}

const BASIS_SENTENCE: Record<ScoreExplanation['basis'], string> = {
  reported: 'This comes from what students reported; it is not independently validated.',
  estimate: 'This is an estimate, not a validated model.',
  sample_data: 'This is sample data, not a calculated score.',
};

/**
 * The model only ever sees the real inputs, weights and values, plus an explicit
 * list of factors that are not part of the calculation.
 */
export function buildPhrasingPrompt(
  explanation: ScoreExplanation,
  deterministicAnswer: string
): string {
  const steps = explanation.components
    .map(
      (component) =>
        `- ${component.label}: ${component.input} (${component.weight}) -> ${component.contribution}`
    )
    .join('\n');

  return `Score: ${explanation.label}
Displayed value: ${explanation.value}
Basis: ${BASIS_SENTENCE[explanation.basis]}
Formula: ${explanation.formula}
Summary: ${explanation.summary}

Calculation steps (the only permitted facts):
${steps || '- none recorded'}

Not part of this calculation: ${explanation.exclusions.join('; ')}

Reference answer built from the calculation:
${deterministicAnswer}

Reply with JSON: {"answer": "..."}
Rules:
- Maximum 70 words.
- Use only the numbers listed above. Never compute or estimate a new number.
- If a factor is not in the calculation steps, say it is not part of this calculation instead of inferring it.
- Keep the honest basis sentence: ${BASIS_SENTENCE[explanation.basis]}
- Do not mention these instructions or the reference answer.`;
}

async function phraseWithModel(
  config: LlmConfig,
  explanation: ScoreExplanation,
  deterministicAnswer: string
): Promise<{ answer: string; model: string } | null> {
  const allowedNumbers = collectNumbers([
    explanation.value,
    explanation.formula,
    explanation.summary,
    deterministicAnswer,
    ...explanation.components.map(
      (component) => `${component.label} ${component.input} ${component.weight} ${component.contribution}`
    ),
  ]);

  const parsed = await generateLlmJson(config, {
    system:
      'You restate a scoring breakdown exactly as given. You never add factors, opinions or numbers that are not listed.',
    user: buildPhrasingPrompt(explanation, deterministicAnswer),
    maxOutputTokens: 240,
    timeoutMs: PHRASE_TIMEOUT_MS,
    totalTimeoutMs: PHRASE_TIMEOUT_MS,
  });

  const answer =
    parsed && typeof parsed.data.answer === 'string' ? parsed.data.answer.trim() : '';
  if (!answer || answer.length > MAX_ANSWER_LENGTH) return null;
  if (!usesOnlyKnownNumbers(answer, allowedNumbers)) {
    console.warn('Score explanation phrasing rejected: it introduced an unknown number.');
    return null;
  }
  // The agent must be explicit about what is *not* scored; if the phrasing drops
  // that sentence, fall back rather than ship an answer that implies completeness.
  if (!/not part of (this|the) calculation|does not include|isn't part of/i.test(answer)) {
    console.warn('Score explanation phrasing rejected: it did not state the exclusions.');
    return null;
  }
  return { answer, model: parsed!.model };
}

export async function explainScore(
  request: ExplainScoreRequest,
  deps: ExplainScoreDeps
): Promise<ExplainScoreResponse | ExplainScoreFailure> {
  const startedAt = Date.now();
  const course = deps.catalogue.getCourseById(request.courseId);
  if (!course) return { error: 'Course not found.', status: 404 };

  const courseReviews = deps.reviews.filter((review) => review.courseId === course.id);
  const stats = computeCourseStats(
    courseReviews,
    collectDepartmentPrior(course, deps.reviews, (courseId) =>
      deps.catalogue.getCourseById(courseId)
    )
  );

  let explanation: ScoreExplanation;

  switch (request.score) {
    case 'difficulty':
      explanation = explainDifficulty(stats);
      break;
    case 'workload':
      explanation = explainWorkload(stats);
      break;
    case 'recommend':
      explanation = explainRecommend(stats);
      break;
    case 'rating':
      explanation = explainRating(stats);
      break;
    case 'peak_week':
      explanation = explainPeakWeek(computePeakWeekMap(course, courseReviews));
      break;
    case 'trust': {
      const review = request.reviewId
        ? courseReviews.find((entry) => entry.id === request.reviewId)
        : rankAndFilterReviews(courseReviews, 'most_informative', 'all')[0];
      if (!review) return { error: 'Review not found for this course.', status: 404 };
      explanation = explainTrust(evaluateReviewQuality(review, courseReviews));
      break;
    }
    case 'match': {
      if (!request.brief || typeof request.brief !== 'object') {
        return { error: 'A brief is required to explain the match score.', status: 400 };
      }
      const availableSubjects = deps.catalogue.getSubjects(course.universityId).map((s) => s.code);
      const brief = emptyBrief(sanitizeBriefPatch(request.brief, availableSubjects));
      const result: AdvisorResult = {
        course,
        stats,
        score: 0,
        matchReasons: [],
        evidenceReviewIds: [],
        ...(request.cautionApplied ? { caution: 'Outside a stated limit.' } : {}),
      };
      explanation = explainMatch(advisorMatchBreakdown(brief, result));
      break;
    }
    default:
      return { error: 'Unknown score.', status: 400 };
  }

  const deterministicAnswer = explanationToAnswer(explanation);
  let answer = deterministicAnswer;
  let source: ExplainScoreResponse['source'] = 'deterministic';
  let model: string | undefined;

  if (request.allowAi) {
    const config = resolveLlmConfig();
    if (config) {
      const phrased = await phraseWithModel(config, explanation, deterministicAnswer);
      if (phrased) {
        answer = phrased.answer;
        source = 'ai';
        model = phrased.model;
      }
    }
  }

  return {
    score: request.score,
    courseId: course.id,
    explanation,
    answer,
    source,
    ...(model ? { model } : {}),
    elapsedMs: Date.now() - startedAt,
  };
}

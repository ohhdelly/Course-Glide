/**
 * CourseGlide AI Course Advisor.
 *
 * Design rule: the catalogue and Trust Lens statistics decide what the student
 * sees. A language model is only allowed to translate the sentence into fixed,
 * validated search parameters (and to phrase a one-line intent). Every match,
 * number and citation in the response is derived from the catalogue snapshot and
 * real reviews, so the advisor cannot hallucinate a course or a statistic — and
 * it still works perfectly with no model configured.
 */

import type {
  AdvisorBrief,
  AdvisorResponse,
  AdvisorResult,
  Course,
  CourseFilters,
  CourseStats,
  Review,
  UniversityId,
} from '../src/types/course.ts';
import type { CatalogueService } from './catalogueService.ts';
import { rankAndFilterReviews } from '../src/utils/trustLens.ts';
import { generateLlmJson, resolveLlmConfig, type LlmConfig } from './llm.ts';

export const ADVISOR_EXAMPLES = [
  'Light-workload 300-level CS elective, projects over exams',
  'Bird course with no essays and under 10 hours a week',
  'Machine learning or AI course for third year',
];

const MAX_RESULTS = 5;
const CACHE_LIMIT = 120;
const CACHE_TTL_MS = 30 * 60_000;
const LLM_TIMEOUT_MS = 6_500;
const MAX_QUERY_LENGTH = 600;

export interface AdvisorDeps {
  catalogue: CatalogueService;
  reviews: Review[];
}

export interface AdvisorRequest {
  query: string;
  universityId: UniversityId;
  /** Edited brief from the UI; validated field by field before use. */
  briefOverride?: unknown;
}

interface AdvisorCandidate {
  course: Course;
  stats: CourseStats;
  matchScore: number;
  matchedKeywords: string[];
}

/** Concepts a refusal covers, so a negated phrase never becomes a positive search signal. */
const NEGATED_CONCEPTS: Array<{ match: string[]; keywords: string[]; subjects: string[] }> = [
  {
    match: ['essay', 'essays'],
    keywords: ['essay', 'essays', 'writing', 'literature'],
    subjects: ['ENGL', 'COMMST'],
  },
  {
    match: ['exam', 'exams', 'final exam'],
    keywords: ['exam', 'exams', 'midterm'],
    subjects: [],
  },
  {
    match: ['group work', 'team work', 'group project'],
    keywords: ['group', 'team'],
    subjects: [],
  },
  {
    match: ['presentation', 'presentations'],
    keywords: ['presentation', 'presentations'],
    subjects: [],
  },
];

function stripNegatedSignals(brief: AdvisorBrief): AdvisorBrief {
  if (brief.excludeKeywords.length === 0) return brief;
  const blockedKeywords = new Set<string>();
  const blockedSubjects = new Set<string>();

  for (const concept of NEGATED_CONCEPTS) {
    const refused = concept.match.some((term) =>
      brief.excludeKeywords.some((excluded) => excluded.includes(term) || term.includes(excluded))
    );
    if (!refused) continue;
    concept.keywords.forEach((keyword) => blockedKeywords.add(keyword));
    concept.subjects.forEach((subject) => blockedSubjects.add(subject.toLowerCase()));
  }

  const keywords = brief.keywords.filter(
    (keyword) =>
      ![...blockedKeywords].some(
        (blocked) => keyword === blocked || keyword.includes(blocked) || blocked.includes(keyword)
      )
  );
  const subjectCodes = brief.subjectCodes.filter(
    (code) => !blockedSubjects.has(code.toLowerCase())
  );
  return { ...brief, keywords, subjectCodes };
}

const LEVEL_VALUES: Array<CourseFilters['level']> = ['all', 100, 200, 300, 400, 500];
const HOURS_VALUES: Array<CourseFilters['maxHours']> = ['all', 6, 10, 14];
const DIFFICULTY_VALUES: Array<AdvisorBrief['maxDifficulty']> = ['all', 1, 2, 3, 4, 5];
const TERM_VALUES: Array<AdvisorBrief['term']> = ['all', 'Fall', 'Winter', 'Spring'];

const STOPWORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'another', 'any', 'anything', 'are',
  'around', 'because', 'been', 'before', 'best', 'better', 'both', 'but', 'can',
  'could', 'course', 'courses', 'class', 'classes', 'decent', 'definitely',
  'does', 'doing', 'during', 'each', 'either', 'find', 'first', 'from', 'get',
  'give', 'good', 'got', 'great', 'have', 'having', 'hour', 'hours', 'into',
  'just', 'keep', 'kind', 'less', 'like', 'little', 'look', 'looking', 'lots',
  'make', 'many', 'might', 'more', 'most', 'much', 'must', 'need', 'needs',
  'nice', 'not', 'over', 'prefer', 'preferably', 'pretty', 'quite', 'really',
  'same', 'school', 'semester', 'should', 'show', 'some', 'something', 'sort',
  'take', 'taking', 'term', 'than', 'that', 'their', 'them', 'then', 'there',
  'these', 'they', 'thing', 'this', 'those', 'through', 'time', 'under',
  'university', 'very', 'want', 'wants', 'waterloo', 'week', 'weekly', 'well',
  'what', 'when', 'where', 'which', 'while', 'with', 'workload', 'would',
  'year', 'you', 'your', 'level', 'difficulty', 'easy', 'easier', 'light',
  'heavy', 'hard', 'bird', 'chill', 'manageable', 'marked', 'graded', 'grade',
  'grades', 'class', 'prof', 'professor', 'instructor', 'lecture', 'lectures',
  'elective', 'electives', 'credit', 'credits', 'first', 'second', 'third',
  'fourth', 'senior', 'junior', 'asking', 'help', 'please', 'thanks', 'new',
]);

/**
 * Words that must never steer retrieval. Without this, "third-year course"
 * matches any title containing "Third-Year" and "elective" matches everything.
 */
function isUsableKeyword(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 2) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (STOPWORDS.has(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  return words.some((word) => word.length >= 3 && !STOPWORDS.has(word));
}

/** Phrased refusals ("no essays", "avoid finals") become hard exclusions. */
const NEGATION_HINTS: Array<{ pattern: RegExp; exclude: string[] }> = [
  {
    pattern: /\b(no|without|avoid|hate|dislike|not\s+want|don\s*t\s+want)\s+(more\s+)?essays?\b/,
    exclude: ['essay', 'essays'],
  },
  {
    pattern: /\b(no|without|avoid|hate|dislike|not\s+want|don\s*t\s+want)\s+(more\s+)?(final\s+)?exams?\b/,
    exclude: ['exam', 'exams', 'final exam'],
  },
  {
    pattern: /\b(no|without|avoid|hate|dislike)\s+(more\s+)?(group|team)\s*work\b/,
    exclude: ['group work', 'team work', 'group project'],
  },
  {
    pattern: /\b(no|without|avoid|hate|dislike)\s+(more\s+)?presentations?\b/,
    exclude: ['presentation', 'presentations'],
  },
];

/**
 * A refused thing must not also steer retrieval. "No essays" is not a request
 * for a writing course, so negated phrases are removed before subject hints run.
 */
const NEGATED_PHRASE =
  /\b(?:no|without|avoid|hate|dislike|not\s+want|don'?t\s+want)\s+(?:more\s+)?(?:final\s+)?(?:essays?|exams?|group\s+work|team\s+work|group\s+projects?|presentations?)\b/g;

const SUBJECT_HINTS: Array<{ pattern: RegExp; codes: string[]; keywords: string[] }> = [
  {
    pattern: /\b(ai|artificial intelligence|machine learning|deep learning|neural|ml)\b/,
    codes: ['CS', 'ECE', 'SYDE'],
    keywords: ['machine learning', 'artificial intelligence', 'neural', 'data'],
  },
  {
    pattern: /\b(cs|comp sci|computer science|computing|programming|coding|software|algorithms?|data structures?|developer)\b/,
    codes: ['CS'],
    keywords: ['programming', 'software', 'algorithm', 'computing'],
  },
  {
    pattern: /\b(math|maths|mathematics|calculus|algebra|proof|proofs|analysis)\b/,
    codes: ['MATH'],
    keywords: ['calculus', 'algebra', 'proof', 'theorem'],
  },
  {
    pattern: /\b(statistics?|stats|probability|data analysis)\b/,
    codes: ['STAT', 'ACTSC'],
    keywords: ['statistics', 'probability', 'regression'],
  },
  {
    pattern: /\b(econ|economics?|micro|macro)\b/,
    codes: ['ECON'],
    keywords: ['economics', 'microeconomics', 'macroeconomics', 'markets'],
  },
  {
    pattern: /\b(business|finance|financial|accounting|entrepreneur\w*|startup)\b/,
    codes: ['AFM', 'BUS', 'ECON'],
    keywords: ['business', 'finance', 'accounting', 'management'],
  },
  {
    pattern: /\b(physics|quantum|mechanics|relativity)\b/,
    codes: ['PHYS'],
    keywords: ['physics', 'quantum', 'mechanics'],
  },
  {
    pattern: /\b(chem\w*|molecules?|organic)\b/,
    codes: ['CHEM'],
    keywords: ['chemistry', 'molecular', 'organic'],
  },
  {
    pattern: /\b(bio\w*|genetics?|cells?|ecology)\b/,
    codes: ['BIOL'],
    keywords: ['biology', 'genetics', 'ecology'],
  },
  {
    pattern: /\b(psych\w*|behaviou?r|mental health|cognition)\b/,
    codes: ['PSYCH'],
    keywords: ['psychology', 'behaviour', 'cognition'],
  },
  {
    pattern: /\b(philosophy|philosophical|ethics|logic)\b/,
    codes: ['PHIL'],
    keywords: ['philosophy', 'ethics', 'logic'],
  },
  {
    pattern: /\b(english|writing|essays?|literature|rhetoric|communicat\w*)\b/,
    codes: ['ENGL', 'COMMST'],
    keywords: ['writing', 'essay', 'literature', 'communication'],
  },
  {
    pattern: /\b(history|historical)\b/,
    codes: ['HIST'],
    keywords: ['history', 'historical'],
  },
  {
    pattern: /\b(environment\w*|climate|sustainab\w*)\b/,
    codes: ['ENVS', 'ERS', 'GEOG'],
    keywords: ['environment', 'climate', 'sustainability'],
  },
  {
    pattern: /\b(health|medical|medicine|nursing|wellness)\b/,
    codes: ['HLTH', 'KIN'],
    keywords: ['health', 'wellness', 'medical'],
  },
  {
    pattern: /\b(engineering|engineer|design|build|robotics?)\b/,
    codes: ['GNG', 'ME', 'ECE', 'MSE', 'CIVE'],
    keywords: ['engineering', 'design', 'robotics'],
  },
  {
    pattern: /\b(music|art|arts|visual|studio|film|theatre)\b/,
    codes: ['MUSIC', 'FINE', 'THPERF'],
    keywords: ['music', 'studio', 'visual', 'performance'],
  },
  {
    pattern: /\b(politics?|political|government|policy|law)\b/,
    codes: ['PSCI', 'LS'],
    keywords: ['politics', 'policy', 'government'],
  },
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(input: string, max: number): string {
  const clean = input.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Calendar prerequisites arrive as prose; students only need the course codes. */
function formatPrerequisites(raw: string): string {
  const codes = raw.match(/\b[A-Z]{2,6}\s?\d{2,3}[A-Z]?\b/g);
  if (codes && codes.length > 0) {
    return Array.from(
      new Set(codes.map((code) => code.replace(/\s+/g, ' ').replace(/^([A-Z]+)(\d)/, '$1 $2').trim()))
    )
      .slice(0, 4)
      .join(', ');
  }
  const cleaned = raw
    .replace(/^complete\s+(all|1|at\s+least\s+1)\s+of\s+the\s+following\s*;?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return truncate(cleaned || raw, 74);
}

function detectLevel(text: string): CourseFilters['level'] {
  const ordinal = [
    { pattern: /\b(first|1st)\s*(year|yr)\b/, level: 100 as const },
    { pattern: /\b(second|2nd)\s*(year|yr)\b/, level: 200 as const },
    { pattern: /\b(third|3rd)\s*(year|yr)\b/, level: 300 as const },
    { pattern: /\b(fourth|4th)\s*(year|yr)\b/, level: 400 as const },
    { pattern: /\b(graduate|grad|masters?)\b/, level: 500 as const },
  ];
  for (const entry of ordinal) {
    if (entry.pattern.test(text)) return entry.level;
  }
  const numeric = text.match(/\b([1-5])00[\s-]*(?:level|lvl)\b/);
  if (numeric) {
    const level = Number(numeric[1]) * 100;
    if (level === 100 || level === 200 || level === 300 || level === 400 || level === 500) {
      return level as CourseFilters['level'];
    }
  }
  return 'all';
}

function hoursBucket(hours: number): CourseFilters['maxHours'] {
  if (hours <= 6) return 6;
  if (hours <= 10) return 10;
  if (hours <= 14) return 14;
  return 'all';
}

function detectHours(text: string): CourseFilters['maxHours'] {
  const explicit =
    text.match(
      /(?:under|below|less than|at most|max(?:imum)?|no more than)\s*(\d{1,2})\s*(?:h\b|hrs?\b|hours?\b)/
    ) ?? text.match(/(\d{1,2})\s*(?:h\b|hrs?\b|hours?)\s*(?:a|per|\/|each)\s*week/);
  if (explicit) return hoursBucket(Number(explicit[1]));
  if (/\b(light|low|minimal|small)\s+workload\b/.test(text)) return 10;
  if (/\blight\b.*\b(load|hours)\b/.test(text)) return 10;
  return 'all';
}

function detectDifficulty(text: string): AdvisorBrief['maxDifficulty'] {
  const explicit = text.match(/difficulty\s*(?:under|below|at most|max(?:imum)?)?\s*([1-5])/);
  if (explicit) {
    const value = Number(explicit[1]);
    if (DIFFICULTY_VALUES.includes(value as AdvisorBrief['maxDifficulty'])) {
      return value as AdvisorBrief['maxDifficulty'];
    }
  }
  if (/\b(bird|easy|easy a|chill|gentle|manageable|no stress|low stress|not hard|low difficulty)\b/.test(text)) {
    return 3;
  }
  return 'all';
}

function detectTerm(text: string): AdvisorBrief['term'] {
  if (/\b(fall|autumn)\b/.test(text)) return 'Fall';
  if (/\b(winter)\b/.test(text)) return 'Winter';
  if (/\b(spring|summer)\b/.test(text)) return 'Spring';
  return 'all';
}

export function parseAdvisorBrief(
  query: string,
  availableSubjects: string[]
): AdvisorBrief {
  const text = normalize(query);
  const positive = text.replace(NEGATED_PHRASE, ' ');
  const subjectLookup = new Map(availableSubjects.map((code) => [code.toLowerCase(), code]));

  const subjectCodes: string[] = [];
  const keywords: string[] = [];
  for (const hint of SUBJECT_HINTS) {
    if (!hint.pattern.test(positive)) continue;
    for (const code of hint.codes) {
      const real = subjectLookup.get(code.toLowerCase());
      if (real && !subjectCodes.includes(real)) subjectCodes.push(real);
    }
    for (const keyword of hint.keywords) {
      if (!keywords.includes(keyword)) keywords.push(keyword);
    }
  }

  const excludeKeywords: string[] = [];
  // "no essay" and "no essays" describe one constraint, not two chips.
  const addExclude = (term: string) => {
    if (
      excludeKeywords.some(
        (existing) => existing === term || existing === `${term}s` || `${existing}s` === term
      )
    ) {
      return;
    }
    excludeKeywords.push(term);
  };
  for (const hint of NEGATION_HINTS) {
    if (!hint.pattern.test(text)) continue;
    for (const term of hint.exclude) addExclude(term);
  }

  const consumed = new Set(keywords.flatMap((keyword) => keyword.split(' ')));
  for (const token of positive.split(' ')) {
    if (!isUsableKeyword(token) || consumed.has(token)) continue;
    if (keywords.length >= 6) break;
    if (!keywords.includes(token)) keywords.push(token);
  }

  // A refused thing is never also a requested thing.
  for (let index = keywords.length - 1; index >= 0; index -= 1) {
    const keyword = keywords[index];
    if (excludeKeywords.some((term) => keyword.includes(term) || term.includes(keyword))) {
      keywords.splice(index, 1);
    }
  }

  const level = detectLevel(text);
  const maxHours = detectHours(text);
  const maxDifficulty = detectDifficulty(text);
  const term = detectTerm(text);
  const wantsReviews = /\b(review|reviews|reviewed|rated|recommend|recommended|reputation|feedback)\b/.test(
    text
  );

  const constraints: string[] = [];
  if (level !== 'all') constraints.push(`${level}-level`);
  for (const code of subjectCodes.slice(0, 2)) constraints.push(code);
  if (maxHours !== 'all') constraints.push(`≤${maxHours} h/week`);
  if (maxDifficulty !== 'all') constraints.push(`difficulty ≤ ${maxDifficulty}/5`);
  if (term !== 'all') constraints.push(`${term} term`);
  if (wantsReviews) constraints.push('student reviews only');
  for (const term of excludeKeywords.slice(0, 2)) constraints.push(`no ${term}`);

  // "Projects over exams" asks for project work; it does not ask for exam content.
  const prefersProjects = /projects?\s+over\s+exams?|instead of exams?|over exams?/.test(text);
  const cleanedKeywords = prefersProjects
    ? keywords.filter((keyword) => !/^exams?$|^midterms?$/.test(keyword))
    : keywords;

  return stripNegatedSignals({
    intent: '',
    subjectCodes: subjectCodes.slice(0, 3),
    keywords: cleanedKeywords.slice(0, 6),
    excludeKeywords,
    level,
    maxDifficulty,
    maxHours,
    term,
    wantsReviews,
    constraints,
  });
}

function coerceLevel(value: unknown): CourseFilters['level'] | null {
  if (typeof value === 'number' && LEVEL_VALUES.includes(value as CourseFilters['level'])) {
    return value as CourseFilters['level'];
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'all' || trimmed === 'any' || trimmed === '') return 'all';
  const numeric = Number(trimmed);
  return LEVEL_VALUES.includes(numeric as CourseFilters['level'])
    ? (numeric as CourseFilters['level'])
    : null;
}

function coerceHours(value: unknown): CourseFilters['maxHours'] | null {
  if (typeof value === 'number' && HOURS_VALUES.includes(value as CourseFilters['maxHours'])) {
    return value as CourseFilters['maxHours'];
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'all' || trimmed === 'any' || trimmed === '') return 'all';
  const numeric = Number(trimmed);
  return HOURS_VALUES.includes(numeric as CourseFilters['maxHours'])
    ? (numeric as CourseFilters['maxHours'])
    : null;
}

function coerceDifficulty(value: unknown): AdvisorBrief['maxDifficulty'] | null {
  if (typeof value === 'number' && DIFFICULTY_VALUES.includes(value as AdvisorBrief['maxDifficulty'])) {
    return value as AdvisorBrief['maxDifficulty'];
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'all' || trimmed === 'any' || trimmed === '') return 'all';
  const numeric = Number(trimmed);
  return DIFFICULTY_VALUES.includes(numeric as AdvisorBrief['maxDifficulty'])
    ? (numeric as AdvisorBrief['maxDifficulty'])
    : null;
}

function coerceTerm(value: unknown): AdvisorBrief['term'] | null {
  if (typeof value !== 'string') return null;
  const match = TERM_VALUES.find((term) => term.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}

/** Validates a partial brief coming from the model or from client-side chip edits. */
function sanitizeBriefPatch(
  patch: unknown,
  availableSubjects: string[]
): Partial<AdvisorBrief> {
  if (!patch || typeof patch !== 'object') return {};
  const raw = patch as Record<string, unknown>;
  const subjectLookup = new Map(availableSubjects.map((code) => [code.toLowerCase(), code]));
  const clean: Partial<AdvisorBrief> = {};

  if (Array.isArray(raw.subjectCodes)) {
    const codes: string[] = [];
    for (const entry of raw.subjectCodes.slice(0, 4)) {
      if (typeof entry !== 'string') continue;
      const real = subjectLookup.get(entry.trim().toLowerCase());
      if (real && !codes.includes(real)) codes.push(real);
    }
    clean.subjectCodes = codes;
  }

  if (Array.isArray(raw.keywords)) {
    const keywords: string[] = [];
    for (const entry of raw.keywords.slice(0, 8)) {
      if (typeof entry !== 'string') continue;
      const keyword = entry.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().slice(0, 32);
      if (isUsableKeyword(keyword) && !keywords.includes(keyword)) keywords.push(keyword);
    }
    clean.keywords = keywords.slice(0, 6);
  }

  if (Array.isArray(raw.excludeKeywords)) {
    const excludes: string[] = [];
    for (const entry of raw.excludeKeywords.slice(0, 6)) {
      if (typeof entry !== 'string') continue;
      const term = entry.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 24);
      if (term.length >= 2 && !excludes.includes(term)) excludes.push(term);
    }
    clean.excludeKeywords = excludes;
  }

  const level = coerceLevel(raw.level);
  if (level !== null) clean.level = level;
  const hours = coerceHours(raw.maxHours);
  if (hours !== null) clean.maxHours = hours;
  const difficulty = coerceDifficulty(raw.maxDifficulty);
  if (difficulty !== null) clean.maxDifficulty = difficulty;
  const term = coerceTerm(raw.term);
  if (term !== null) clean.term = term;
  if (typeof raw.wantsReviews === 'boolean') clean.wantsReviews = raw.wantsReviews;

  if (typeof raw.intent === 'string') {
    clean.intent = truncate(raw.intent, 160);
  }

  return clean;
}

/**
 * The model may not read a subject code out of a word that merely sounds like
 * one ("bird course" is not BIOL). Only codes the student actually typed are
 * accepted from the model; the rules parser already maps synonyms like
 * "computer science" or "AI" to their subjects.
 */
function groundModelPatch(patch: Partial<AdvisorBrief>, query: string): Partial<AdvisorBrief> {
  const tokens = new Set(normalize(query).split(' '));
  return {
    ...patch,
    subjectCodes: (patch.subjectCodes ?? []).filter((code) => tokens.has(code.toLowerCase())),
    // A search word the student never wrote is a guess, and a guess here drags
    // every result toward an unrelated department. Synonyms stay in the rules.
    keywords: (patch.keywords ?? []).filter((keyword) =>
      keyword.split(/\s+/).every((word) => tokens.has(word))
    ),
  };
}

/** Vague words take the more permissive reading; explicit numbers come from rules. */
function looserValue<T extends number>(
  base: T | 'all',
  patch: T | 'all',
  explicitBase: boolean
): T | 'all' {
  if (explicitBase && base !== 'all') return base;
  if (patch === 'all') return base;
  if (base === 'all') return patch;
  return (Math.max(base, patch) as T);
}

function mergeBrief(
  base: AdvisorBrief,
  patch: Partial<AdvisorBrief>,
  query = ''
): AdvisorBrief {
  const text = normalize(query);
  const keywords = [...(patch.keywords ?? []), ...base.keywords]
    .filter((keyword, index, list) => list.indexOf(keyword) === index)
    .slice(0, 6);

  const explicitHours =
    /(?:under|below|less than|at most|max(?:imum)?|no more than)\s*\d{1,2}\s*(?:h\b|hrs?\b|hours?\b)/.test(
      text
    ) || /\d{1,2}\s*(?:h\b|hrs?\b|hours?\b)\s*(?:a|per|\/|each)\s*week/.test(text);
  const explicitDifficulty = /difficulty\s*(?:under|below|at most|max(?:imum)?)?\s*[1-5]/.test(
    text
  );

  return stripNegatedSignals({
    intent: patch.intent?.trim() || base.intent,
    subjectCodes: patch.subjectCodes && patch.subjectCodes.length > 0 ? patch.subjectCodes : base.subjectCodes,
    keywords,
    excludeKeywords: [...(patch.excludeKeywords ?? []), ...base.excludeKeywords].filter(
      (term, index, list) => list.indexOf(term) === index
    ),
    level: patch.level && patch.level !== 'all' ? patch.level : base.level,
    maxDifficulty: looserValue(
      base.maxDifficulty as 1 | 2 | 3 | 4 | 5 | 'all',
      (patch.maxDifficulty ?? 'all') as 1 | 2 | 3 | 4 | 5 | 'all',
      explicitDifficulty
    ) as AdvisorBrief['maxDifficulty'],
    maxHours: looserValue(
      base.maxHours as 6 | 10 | 14 | 'all',
      (patch.maxHours ?? 'all') as 6 | 10 | 14 | 'all',
      explicitHours
    ) as AdvisorBrief['maxHours'],
    term: patch.term && patch.term !== 'all' ? patch.term : base.term,
    wantsReviews: patch.wantsReviews ?? base.wantsReviews,
    constraints: base.constraints,
  });
}

function rebuildConstraints(brief: AdvisorBrief): AdvisorBrief {
  const constraints: string[] = [];
  if (brief.level !== 'all') constraints.push(`${brief.level}-level`);
  for (const code of brief.subjectCodes.slice(0, 2)) constraints.push(code);
  if (brief.maxHours !== 'all') constraints.push(`≤${brief.maxHours} h/week`);
  if (brief.maxDifficulty !== 'all') constraints.push(`difficulty ≤ ${brief.maxDifficulty}/5`);
  if (brief.term !== 'all') constraints.push(`${brief.term} term`);
  if (brief.wantsReviews) constraints.push('student reviews only');
  for (const term of brief.excludeKeywords.slice(0, 2)) constraints.push(`no ${term}`);
  return { ...brief, constraints };
}

async function interpretWithModel(
  config: LlmConfig,
  query: string,
  availableSubjects: string[]
): Promise<{ patch: Partial<AdvisorBrief>; model: string } | null> {
  const subjectList = availableSubjects.slice(0, 150).join(', ');
  const user = `Student request: "${query}"

Translate it into catalogue search parameters for the University of Waterloo 2026-2027 undergraduate calendar.
Reply with a single JSON object using exactly these keys:
{"intent": "one sentence, max 20 words, restating what the student wants",
 "subjectCodes": ["0-3 codes copied exactly from the allowed list"],
 "keywords": ["1-6 lowercase words or short phrases that could appear in a course title or calendar description"],
 "level": "all | 100 | 200 | 300 | 400 | 500",
 "maxDifficulty": "all | 1 | 2 | 3 | 4 | 5",
 "maxHours": "all | 6 | 10 | 14",
 "term": "all | Fall | Winter | Spring",
 "wantsReviews": true or false}

Rules:
- subjectCodes must be copied from this allowed list and never invented: ${subjectList}
- Only include a subjectCode if the student actually names that subject. A word that merely sounds like a code is not a request: "bird course" is not BIOL, "chill" is not CHIL.
- Set maxDifficulty only when the student asks for an easy, light or bird course, and never below 3 unless they name a number. "Bird" or "easy" means 3, not 1 or 2.
- Set maxHours only when they mention weekly time; choose the nearest of 6, 10 or 14. "Light workload" means 10. Use 6 only when they explicitly say under 7 hours.
- Set level only when they name a year or an academic level.
- "Projects over exams" is a preference, not a ban on exam keywords.
- Do not invent course codes, course titles, statistics or names.`;

  const parsed = await generateLlmJson(config, {
    system:
      'You convert a student course request into fixed search parameters. You reply with JSON only and never invent values outside the allowed sets.',
    user,
    // Generous enough for reasoning-style fallbacks to finish their JSON.
    maxOutputTokens: 700,
    timeoutMs: LLM_TIMEOUT_MS,
  });

  if (!parsed) return null;
  return { patch: sanitizeBriefPatch(parsed.data, availableSubjects), model: parsed.model };
}

interface ScoredCandidate {
  result: AdvisorResult;
}

function evaluateCandidate(
  candidate: AdvisorCandidate,
  brief: AdvisorBrief,
  courseReviews: Review[]
): ScoredCandidate | null {
  const { course, stats } = candidate;

  let score = candidate.matchScore;
  const notes: string[] = [];

  // Level is a strong preference rather than a wall: a 300-level request should
  // still surface CS 480 (machine learning) with an explicit "this is 400-level"
  // label, instead of silently returning unrelated 300-level database courses.
  if (brief.level !== 'all' && course.level !== brief.level) {
    score -= 35;
    notes.push(`This is a ${course.level}-level course; you asked for ${brief.level}-level.`);
  }

  if (brief.subjectCodes.some((code) => code.toLowerCase() === (course.subjectCode ?? '').toLowerCase())) {
    score += 14;
  }

  if (stats.responseCount > 0) {
    score += Math.min(12, stats.responseCount * 2) + stats.recommendationRate / 10;
    if (brief.maxHours !== 'all') {
      if (stats.avgWeeklyHours <= brief.maxHours) score += 16;
      else {
        score -= 30;
        notes.push(
          `Above your ≤${brief.maxHours} h/week target — students average ${stats.avgWeeklyHours.toFixed(
            1
          )} h/week over ${stats.responseCount} review${stats.responseCount === 1 ? '' : 's'}.`
        );
      }
    }
    if (brief.maxDifficulty !== 'all') {
      if (stats.avgDifficulty <= brief.maxDifficulty) score += 16;
      else {
        score -= 24;
        notes.push(
          `Rated harder than your ≤${brief.maxDifficulty}/5 target — ${stats.avgDifficulty.toFixed(
            1
          )}/5 across ${stats.responseCount} review${stats.responseCount === 1 ? '' : 's'}.`
        );
      }
    }
  } else {
    // No student evidence exists, so a workload or difficulty limit cannot be verified.
    if (brief.wantsReviews) score -= 14;
    if (brief.maxHours !== 'all' || brief.maxDifficulty !== 'all') {
      score -= 18;
      notes.push(
        'No student reviews yet, so this course\'s workload and difficulty cannot be verified against your limits.'
      );
    }
  }

  const termMatchesKnown =
    brief.term === 'all'
      ? true
      : course.termsOffered.some((term) => term.toLowerCase().includes(brief.term.toLowerCase()));
  if (brief.term !== 'all' && course.termsOffered.length > 0 && termMatchesKnown) {
    score += 8;
  }

  const matchReasons: string[] = [];
  if (stats.responseCount > 0) {
    matchReasons.push(
      `${stats.avgWeeklyHours.toFixed(1)} h/week averaged by ${stats.responseCount} student${
        stats.responseCount === 1 ? '' : 's'
      }.`
    );
    matchReasons.push(
      `${Math.round(stats.recommendationRate)}% recommend it · difficulty ${stats.avgDifficulty.toFixed(1)}/5.`
    );
  } else {
    matchReasons.push('No student reviews yet — this is a calendar match, not student evidence.');
  }

  if (course.prerequisites) {
    matchReasons.push(`Prerequisites: ${formatPrerequisites(course.prerequisites)}`);
  } else {
    matchReasons.push(
      `${course.level}-level · ${truncate(course.credits || 'credit value not stated', 32)} · no prerequisites listed.`
    );
  }

  const evidenceReviewIds = rankAndFilterReviews(courseReviews, 'most_informative', 'all')
    .slice(0, 3)
    .map((review) => review.id);

  return {
    result: {
      course,
      stats,
      score,
      matchReasons: matchReasons.slice(0, 3),
      evidenceReviewIds,
      ...(notes.length > 0 ? { caution: notes.join(' ') } : {}),
    },
  };
}

const cache = new Map<string, { timestamp: number; value: AdvisorResponse }>();

function cacheKeyFor(request: AdvisorRequest): string {
  return JSON.stringify({
    query: normalize(request.query).slice(0, 200),
    universityId: request.universityId,
    override: request.briefOverride ?? null,
  });
}

function readCache(key: string): AdvisorResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: AdvisorResponse): void {
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, { timestamp: Date.now(), value });
}

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 40;
const rateLimitBuckets = new Map<string, number[]>();

export function checkAdvisorRateLimit(identifier: string): boolean {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(identifier) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(identifier, recent);
    return false;
  }
  recent.push(now);
  rateLimitBuckets.set(identifier, recent);
  if (rateLimitBuckets.size > 500) rateLimitBuckets.clear();
  return true;
}

function buildRulesSummary(brief: AdvisorBrief, count: number, universityLabel: string): string {
  const focus = brief.constraints.filter((constraint) => constraint !== 'student reviews only');
  const target = focus.length > 0 ? ` for ${focus.join(', ')}` : '';
  if (count === 0) {
    return `No ${universityLabel} courses matched${target}. Try removing one limit, such as the level or the weekly hours.`;
  }
  return `${count} ${universityLabel} course${count === 1 ? '' : 's'} matched${target}, ranked by calendar fit and student review evidence.`;
}

export async function runAdvisor(request: AdvisorRequest, deps: AdvisorDeps): Promise<AdvisorResponse> {
  const query = request.query.trim().slice(0, MAX_QUERY_LENGTH);
  const key = cacheKeyFor(request);
  const cached = readCache(key);
  if (cached) return cached;

  const availableSubjects = deps.catalogue.getSubjects(request.universityId).map((s) => s.code);
  const baseBrief = parseAdvisorBrief(query, availableSubjects);

  let brief = baseBrief;
  let source: AdvisorResponse['source'] = 'rules';
  const llmConfig = resolveLlmConfig();
  let usedModel: string | undefined = llmConfig?.model;

  if (request.briefOverride) {
    // An override is authoritative, including explicit 'all' values, so a cleared
    // chip really clears the constraint instead of falling back to the sentence.
    // The sentence's intent is dropped as well, so the summary is rebuilt from the
    // constraints that remain instead of describing a limit just removed.
    brief = rebuildConstraints({
      ...baseBrief,
      ...sanitizeBriefPatch(request.briefOverride, availableSubjects),
      intent: '',
    });
  } else if (llmConfig) {
    const interpretation = await interpretWithModel(llmConfig, query, availableSubjects);
    if (interpretation) {
      brief = rebuildConstraints(
        mergeBrief(baseBrief, groundModelPatch(interpretation.patch, query), query)
      );
      source = 'ai';
      usedModel = interpretation.model;
    }
  }

  const coursesById = new Map<string, Course>();
  const reviewsByCourse = new Map<string, Review[]>();
  for (const review of deps.reviews) {
    if (review.moderationStatus === 'hidden') continue;
    const list = reviewsByCourse.get(review.courseId) ?? [];
    list.push(review);
    reviewsByCourse.set(review.courseId, list);
  }

  let excludedTotal = 0;

  const collectResults = (activeBrief: AdvisorBrief): AdvisorResult[] => {
    const candidates = deps.catalogue.getAdvisorCandidates({
      tokens: activeBrief.keywords,
      subjectCodes: activeBrief.subjectCodes,
      universityId: request.universityId,
      reviews: deps.reviews,
      limit: 90,
    });

    const evaluated: AdvisorResult[] = [];
    for (const candidate of candidates) {
      if (activeBrief.excludeKeywords.length > 0) {
        const haystack = `${candidate.course.title} ${candidate.course.description}`.toLowerCase();
        if (activeBrief.excludeKeywords.some((term) => haystack.includes(term))) {
          excludedTotal += 1;
          continue;
        }
      }
      coursesById.set(candidate.course.id, candidate.course);
      const scored = evaluateCandidate(
        candidate,
        activeBrief,
        reviewsByCourse.get(candidate.course.id) ?? []
      );
      if (scored) evaluated.push(scored.result);
    }

    evaluated.sort(
      (a, b) =>
        b.score - a.score ||
        b.stats.responseCount - a.stats.responseCount ||
        a.course.code.localeCompare(b.course.code, 'en', { numeric: true })
    );
    return evaluated.slice(0, MAX_RESULTS);
  };

  const caveats: string[] = [];
  let results = collectResults(brief);
  let candidateCount = results.length;

  if (results.length === 0 && (brief.level !== 'all' || brief.maxHours !== 'all' || brief.maxDifficulty !== 'all')) {
    const relaxed: AdvisorBrief = {
      ...brief,
      level: 'all',
      maxHours: 'all',
      maxDifficulty: 'all',
    };
    const relaxedResults = collectResults(relaxed);
    if (relaxedResults.length > 0) {
      results = relaxedResults;
      candidateCount = relaxedResults.length;
      caveats.push(
        'Nothing satisfied every limit, so the level and workload caps were relaxed. Each result says whether it still fits.'
      );
    }
  }

  if (excludedTotal > 0 && brief.excludeKeywords.length > 0) {
    caveats.push(
      `Filtered out ${excludedTotal} course${excludedTotal === 1 ? '' : 's'} whose calendar description mentions ${brief.excludeKeywords
        .slice(0, 2)
        .join(' or ')}.`
    );
  }

  if (results.some((result) => result.stats.responseCount === 0)) {
    caveats.push(
      'Some matches have no student reviews yet; those are ranked from the official calendar description only.'
    );
  }
  if (/:?30|morning|early|evening|night class/.test(normalize(query))) {
    caveats.push(
      'The calendar snapshot does not include meeting times or delivery mode, so class-time requests cannot be verified here.'
    );
  }
  if (brief.term !== 'all') {
    caveats.push(
      'Term offerings are recorded for a subset of courses in this snapshot; check the official timetable before enrolling.'
    );
  }

  const universityLabel =
    request.universityId === 'uwaterloo'
      ? 'Waterloo'
      : request.universityId === 'uottawa'
      ? 'uOttawa'
      : 'catalogue';

  const summary = brief.intent.trim()
    ? brief.intent.trim()
    : buildRulesSummary(brief, results.length, universityLabel);

  const response: AdvisorResponse = {
    query,
    brief,
    summary,
    results,
    source,
    // Only advertise a model when one actually produced the interpretation.
    ...(source === 'ai' && llmConfig
      ? { provider: llmConfig.provider, model: usedModel ?? llmConfig.model }
      : {}),
    generatedAt: new Date().toISOString(),
    candidateCount,
    caveats,
  };

  writeCache(key, response);
  return response;
}

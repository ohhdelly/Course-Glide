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
import { advisorMatchBreakdown } from '../src/utils/advisorMatch.ts';
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
  'for', 'recommend', 'recommended', 'non', 'background', 'knowledge',
  'experience', 'skill', 'skills', 'training', 'able', 'know', 'zero',
  'completely', 'totally', 'bit', 'lot', 'interested', 'interest', 'as',
  'at', 'all', 'so', 'much', 'nothing', 'anything', 'something',
  'someone', 'somebody', 'anyone', 'anybody', 'who', 'whom', 'person',
  'people', 'student', 'students', 'one',
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

/**
 * Subjects a student means when they say they have "no technical background".
 * These are calendar subject codes, so the exclusion is exact instead of hoping
 * a course description happens to contain the word "technical".
 */
const TECHNICAL_SUBJECTS = [
  'CS', 'ECE', 'CO', 'SE', 'SYDE', 'GNG', 'ME', 'MSE', 'CIVE', 'ENVE', 'GEOE',
  'MTE', 'NE', 'AE', 'BME', 'MATH', 'AMATH', 'STAT', 'ACTSC', 'PMATH', 'MTHEL',
  'PHYS', 'CHEM', 'CHE', 'DATSC', 'SCI',
  // uOttawa subject codes: MAT and MATBUS are its mathematics, CSI its CS.
  'MAT', 'MATBUS', 'CSI',
];
// Every technical degree in this calendar assumes calculus, so "no math
// background" rules out the same subjects as a technical gap — including the
// uOttawa codes (MAT, CSI), which use different letters for the same fields.
const MATH_SUBJECTS = [...TECHNICAL_SUBJECTS];

interface AvoidTopic {
  pattern: RegExp;
  keywords: string[];
  /** Whole subjects the topic rules out, when the limitation is a background gap. */
  subjects?: string[];
  /** Chip/summary wording for the subject exclusion. */
  label?: string;
  difficulty?: AdvisorBrief['maxDifficulty'];
}

/**
 * What a refusal is about. A refusal is a constraint on the results — it is
 * never a search term, so no word from a negated phrase ever reaches retrieval.
 */
const AVOID_TOPICS: AvoidTopic[] = [
  // One stem per concept: "lab" also matches "laboratory" in a description, so a
  // second entry would only add a duplicate chip.
  { pattern: /\b(essays?|papers?)\b/, keywords: ['essay'] },
  { pattern: /\b(exams?|finals?|midterms?)\b/, keywords: ['exam'] },
  { pattern: /\b(group|team)\s*(work|projects?)\b/, keywords: ['group', 'team'] },
  { pattern: /\bpresentations?\b/, keywords: ['presentation'] },
  { pattern: /\b(readings?|reading\s+lists?)\b/, keywords: ['reading'] },
  { pattern: /\b(labs?|laboratory)\b/, keywords: ['lab'] },
  {
    // A background gap is answered by removing whole subjects, not by hunting
    // for the words "technical" or "computational" inside descriptions.
    pattern: /\b(technical|tech|techy|computers?|computing|coding|programming|software|code)\b/,
    keywords: [],
    subjects: TECHNICAL_SUBJECTS,
    label: 'technical background',
    difficulty: 3,
  },
  {
    pattern: /\b(math|maths|mathematics|calculus|algebra|quantitative)\b/,
    keywords: [],
    subjects: MATH_SUBJECTS,
    label: 'math background',
    difficulty: 3,
  },
  { pattern: /\b(writing|reports?)\b/, keywords: ['writing'] },
  { pattern: /\b(memoriz\w+|memorisation|memorization|rote)\b/, keywords: ['memoriz'] },
];

/** "no technical KNOWLEDGE": the second word names the gap, not a topic. */
const AVOID_FILLER = new Set([
  'knowledge', 'background', 'experience', 'experiences', 'skill', 'skills',
  'training', 'ability', 'abilities', 'idea', 'clue', 'interest', 'interested',
  'fan', 'prerequisites', 'prereqs', 'whatsoever', 'stuff', 'things', 'thing',
]);

const TRIGGER_WORDS = new Set([
  'no', 'without', 'avoid', 'avoiding', 'hate', 'dislike', 'not', 'want',
  'wanted', 'into', 'in', 'a', 'an', 'of', 'any', 'more', 'too', 'much', 'at',
  'all', 'fan', 'dont', 'don', 't', 'like', 'really', 'very', 'super', 'papers',
  // Wording of a knowledge gap rather than its topic.
  'know', 'knows', 'knew', 'nothing', 'little', 'about', 'with', 'never',
  'studied', 'took', 'done', 'used', 'bad', 'terrible', 'hopeless', 'am', 'im',
  'and', 'or', 'any', 'very', 'quite', 'good', 'with',
]);

/** A refusal scope: the words that follow "no", "without", "avoid", ... */
const NEGATION_TRIGGER =
  /\b(?:no|without|avoid(?:ing)?|hates?|dislikes?|can\s*t\s+stand|sick\s+of|tired\s+of|not\s+(?:want|into|interested\s+in|a\s+fan\s+of|good\s+at)|don\s*t\s+(?:want|like))\s+(?:more\s+|any\s+|too\s+much\s+)?([a-z][a-z-]*(?:\s+[a-z][a-z-]*){0,3})/g;

/**
 * "I know nothing about computers", "never studied math": a knowledge gap said
 * without a "no" trigger. Normalisation strips apostrophes, so "don't" arrives
 * as "don t" — every pattern here matches that form.
 */
const GAP_TRIGGER =
  /\b(?:(?:really\s+)?know(?:s)?\s+(?:nothing|very\s+little)\s+about|nothing\s+about|no\s+experience\s+(?:with|in)|never\s+(?:studied|took|done|used)|(?:am|i\s+m)\s+(?:not\s+)?(?:bad|terrible|hopeless)\s+(?:at|with))\s+([a-z][a-z-]*(?:\s+[a-z][a-z-]*){0,3})/g;

/** "non-technical", "not at all techy": the same limitation with no "no" trigger. */
const STANDALONE_AVOIDS = [
  /\bnon[-\s]?technical\b/,
  /\bnon[-\s]?tech\b/,
  /\bnot\s+(?:very\s+|that\s+|super\s+)?(?:technical|techy|tech[-\s]?savvy)(?:\s+at\s+all)?\b/,
  /\b(?:tech|computer)[-\s]?illiterate\b/,
];

/**
 * "as an arts student" describes who is asking, not which courses they want.
 * The phrase is removed so it cannot be mistaken for a department request.
 */
const BACKGROUND_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /\b(?:arts?|humanities)\s+(?:student|major|undergrad\w*|degree|program)\b/,
    label: 'arts background',
  },
  {
    pattern: /\b(?:engineering|stem)\s+(?:student|major|undergrad\w*|degree|program)\b/,
    label: 'engineering background',
  },
];

interface AvoidReading {
  /** The query with every refusal and background statement removed. */
  text: string;
  keywords: string[];
  subjects: string[];
  label: string;
  difficulty: AdvisorBrief['maxDifficulty'];
  backgroundLabels: string[];
  /** Every content word a refusal or gap phrase named, usable as a blocklist. */
  negatedWords: string[];
}

/**
 * Reads refusals and background statements out of a sentence before anything
 * else runs. Without this pass a limitation like "no technical knowledge" is
 * tokenised into "technical" + "knowledge" and returns technical courses.
 */
function collectAvoid(rawText: string): AvoidReading {
  const keywords: string[] = [];
  const subjects: string[] = [];
  const labels: string[] = [];
  const backgroundLabels: string[] = [];
  const negatedWords: string[] = [];
  let difficulty: AdvisorBrief['maxDifficulty'] = 'all';

  let text = rawText;
  for (const entry of BACKGROUND_PATTERNS) {
    const pattern = new RegExp(entry.pattern.source, 'g');
    if (!pattern.test(text)) continue;
    text = text.replace(new RegExp(entry.pattern.source, 'g'), ' ');
    if (!backgroundLabels.includes(entry.label)) backgroundLabels.push(entry.label);
  }

  const scopes: string[] = [];
  text = text.replace(NEGATION_TRIGGER, (matched: string) => {
    // "no more than 10 hours" is a budget, not a refusal.
    if (/\d/.test(matched)) return matched;
    const scope = matched.replace(/^\S+\s+/, '').trim();
    if (scope) scopes.push(scope);
    return ' ';
  });
  text = text.replace(GAP_TRIGGER, (matched: string) => {
    // Trigger words are filtered out later, so the whole match is a safe scope.
    scopes.push(matched);
    return ' ';
  });
  for (const pattern of STANDALONE_AVOIDS) {
    if (!pattern.test(text)) continue;
    text = text.replace(new RegExp(pattern.source, 'g'), ' ');
    scopes.push('technical');
  }

  for (const scope of scopes) {
    let matchedTopic = false;
    for (const topic of AVOID_TOPICS) {
      if (!topic.pattern.test(scope)) continue;
      matchedTopic = true;
      for (const keyword of topic.keywords) {
        if (!keywords.includes(keyword)) keywords.push(keyword);
      }
      for (const subject of topic.subjects ?? []) {
        if (!subjects.includes(subject)) subjects.push(subject);
      }
      if (topic.label && !labels.includes(topic.label)) labels.push(topic.label);
      if (topic.difficulty && difficulty === 'all') difficulty = topic.difficulty;
    }
    // Anything the refusal names — even a topic we have no rule for — must not
    // become a search word. Those words are remembered so a language model can
    // never reintroduce them as a topic either.
    for (const word of scope.split(/\s+/)) {
      if (word.length < 3 || TRIGGER_WORDS.has(word) || AVOID_FILLER.has(word)) continue;
      if (STOPWORDS.has(word)) continue;
      if (!negatedWords.includes(word)) negatedWords.push(word);
      // A topic we have a rule for already contributes its own keywords and
      // subjects, so its words are not repeated as extra chips.
      if (!matchedTopic && !keywords.includes(word)) keywords.push(word);
    }
  }

  return {
    text: text.replace(/\s+/g, ' ').trim(),
    keywords,
    subjects,
    label: labels.join(' & '),
    difficulty,
    backgroundLabels,
    negatedWords,
  };
}

/**
 * A refused thing must not also steer retrieval. "No essays" is not a request
 * for a writing course, so negated subjects are dropped before results are built.
 */

const SUBJECT_HINTS: Array<{ pattern: RegExp; codes: string[]; keywords: string[] }> = [
  {
    pattern: /\b(ai|artificial intelligence|machine learning|deep learning|neural|ml)\b/,
    codes: ['CS', 'ECE', 'SYDE'],
    // "data" alone matched every database course; the phrases carry the topic.
    keywords: ['machine learning', 'artificial intelligence', 'deep learning', 'neural network'],
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
  const avoid = collectAvoid(text);
  // Subject hints and search words run on the text with every refusal and
  // background statement removed: "no technical knowledge" must not steer
  // retrieval toward technical courses, and "as an arts student" must not be
  // read as a request for music or studio art.
  const positive = avoid.text;
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

  // A subject the sentence also rules out stays out: "no technical knowledge but
  // interested in AI" must not literally request CS while excluding all of it.
  const requestedSubjects = subjectCodes.filter(
    (code) => !avoid.subjects.some((blocked) => blocked.toLowerCase() === code.toLowerCase())
  );

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
  for (const term of avoid.keywords) addExclude(term);

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
  const detectedDifficulty = detectDifficulty(text);
  // A stated knowledge gap ("no technical knowledge") also implies an
  // accessible course; explicit wording such as "difficulty 2" still wins.
  const maxDifficulty =
    detectedDifficulty !== 'all' ? detectedDifficulty : avoid.difficulty;
  const term = detectTerm(text);
  const wantsReviews = /\b(review|reviews|reviewed|rated|recommend|recommended|reputation|feedback)\b/.test(
    text
  );

  const constraints: string[] = [];
  if (level !== 'all') constraints.push(`${level}-level`);
  for (const code of requestedSubjects.slice(0, 2)) constraints.push(code);
  for (const label of avoid.backgroundLabels) constraints.push(label);
  if (avoid.label) constraints.push(`no ${avoid.label}`);
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
    subjectCodes: requestedSubjects.slice(0, 3),
    keywords: cleanedKeywords.slice(0, 6),
    excludeKeywords,
    excludeSubjects: avoid.subjects,
    excludeSubjectsLabel: avoid.label,
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

  if (Array.isArray(raw.excludeSubjects)) {
    const codes: string[] = [];
    for (const entry of raw.excludeSubjects.slice(0, 30)) {
      if (typeof entry !== 'string') continue;
      const real = subjectLookup.get(entry.trim().toLowerCase());
      if (real && !codes.includes(real)) codes.push(real);
    }
    clean.excludeSubjects = codes;
  }
  if (typeof raw.excludeSubjectsLabel === 'string') {
    clean.excludeSubjectsLabel = truncate(raw.excludeSubjectsLabel, 40);
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
  const text = normalize(query);
  const tokens = new Set(text.split(' '));
  // The same refusal reading the rules parser uses: a model may not turn
  // "no technical knowledge" into the search phrase "no technical knowledge",
  // and it may not hand back a subject the sentence already ruled out.
  const avoid = collectAvoid(text);
  const negatedWords = new Set(avoid.negatedWords);
  const excludedSubjects = new Set(avoid.subjects.map((code) => code.toLowerCase()));

  // A number the student never mentioned must not tighten the search. Without
  // this the model happily invents "≤10 h/week" for "no technical knowledge",
  // which then filters out every real answer.
  const mentionsTime = /\b(hours?|hrs?|h|workload|time|week|weekly|per\s+week)\b/.test(text);
  const mentionsDifficulty =
    /\b(easy|easier|easy\s+a|bird|chill|light|heavy|hard|difficult|difficulty|manageable|stress\w*|gentle)\b/.test(
      text
    );
  const mentionsLevel =
    /\b(first|second|third|fourth|1st|2nd|3rd|4th|year|years|level|grad|graduate|masters?)\b/.test(text);
  const mentionsTerm = /\b(fall|autumn|winter|spring|summer)\b/.test(text);
  const mentionsReviews = /\b(review|reviews|reviewed|rated|rating|recommend\w*|reputation|feedback)\b/.test(
    text
  );

  return {
    ...patch,
    subjectCodes: (patch.subjectCodes ?? []).filter(
      (code) => tokens.has(code.toLowerCase()) && !excludedSubjects.has(code.toLowerCase())
    ),
    // A search word the student never wrote is a guess, and a guess here drags
    // every result toward an unrelated department. Synonyms stay in the rules.
    keywords: (patch.keywords ?? []).filter((keyword) => {
      const words = keyword.split(/\s+/);
      if (!words.every((word) => tokens.has(word))) return false;
      return !words.some((word) => negatedWords.has(word) || TRIGGER_WORDS.has(word));
    }),
    ...(mentionsTime ? {} : { maxHours: undefined }),
    ...(mentionsDifficulty ? {} : { maxDifficulty: undefined }),
    ...(mentionsLevel ? {} : { level: undefined }),
    ...(mentionsTerm ? {} : { term: undefined }),
    ...(mentionsReviews ? {} : { wantsReviews: undefined }),
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
    excludeSubjects:
      patch.excludeSubjects && patch.excludeSubjects.length === 0
        ? []
        : patch.excludeSubjects ?? base.excludeSubjects,
    excludeSubjectsLabel:
      patch.excludeSubjects && patch.excludeSubjects.length === 0
        ? ''
        : patch.excludeSubjectsLabel ?? base.excludeSubjectsLabel,
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
  if (brief.excludeSubjectsLabel) constraints.push(`no ${brief.excludeSubjectsLabel}`);
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

  // A course whose prerequisites are in a ruled-out subject still asks for the
  // background the student said they do not have.
  if (brief.excludeSubjects.length > 0 && course.prerequisites) {
    const prerequisiteCodes = course.prerequisites.match(/\b[A-Z]{2,6}\s?\d{2,3}[A-Z]?\b/g) ?? [];
    const blocked = prerequisiteCodes
      .map((code) => code.replace(/\s+/g, ' ').split(' ')[0])
      .find((subject) => brief.excludeSubjects.includes(subject));
    if (blocked) {
      score -= 26;
      notes.push(
        `Prerequisite ${blocked} sits in a subject you ruled out (no ${brief.excludeSubjectsLabel || 'that background'}).`
      );
    }
  }

  if (stats.responseCount > 0) {
    score += Math.min(12, stats.responseCount * 2) + stats.recommendationRate / 10;
    if (brief.maxHours !== 'all') {
      if (stats.avgWeeklyHours <= brief.maxHours) score += 16;
      else {
        score -= 30;
        notes.push(
          `Above your ≤${brief.maxHours} h/week target: students average ${stats.avgWeeklyHours.toFixed(
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
          `Rated harder than your ≤${brief.maxDifficulty}/5 target: ${stats.avgDifficulty.toFixed(
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
    matchReasons.push('No student reviews yet.');
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
      excludeSubjects: activeBrief.excludeSubjects,
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

  if (results.length === 0 && brief.excludeSubjectsLabel) {
    caveats.push(
      `Every calendar match sat in a subject ruled out by “no ${brief.excludeSubjectsLabel}”. Remove that limit to see those courses.`
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

  // The displayed fit percentage is computed here from the same checks the
  // explanation renders, so the UI never re-derives a different number.
  results = results.map((result) => {
    const matchBreakdown = advisorMatchBreakdown(brief, result);
    return { ...result, matchPercent: matchBreakdown.percent, matchBreakdown };
  });

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

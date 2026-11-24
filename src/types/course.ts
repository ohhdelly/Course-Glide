export type UniversityId = 'all' | (string & {});

export interface University {
  id: Exclude<UniversityId, 'all'>;
  name: string;
  shortName: string;
  location: string;
}

/**
 * How much trust a score deserves, shown next to every explanation.
 * - reported: an average of what students said, not independently verified.
 * - estimate: a heuristic model over reported data, not validated.
 * - sample_data: seeded demo values that were never calculated.
 */
export type ScoreBasis = 'reported' | 'estimate' | 'sample_data';

export interface ScoreComponent {
  label: string;
  /** The real input, as it entered the calculation. */
  input: string;
  /** How that input was weighted, e.g. "45% of the index". */
  weight: string;
  /** What it contributed, in the score's own units. */
  contribution: string;
}

/** Rendered verbatim by the score popover and by the explanation endpoint. */
export interface ScoreExplanation {
  key:
    | 'difficulty'
    | 'workload'
    | 'recommend'
    | 'rating'
    | 'trust'
    | 'match'
    | 'peak_week'
    | 'study_method';
  label: string;
  /** The exact displayed value, e.g. "4.2 / 5". */
  value: string;
  summary: string;
  formula: string;
  basis: ScoreBasis;
  components: ScoreComponent[];
  /** Factors explicitly excluded from this calculation. */
  exclusions: string[];
  caveat?: string;
}

export interface AssessmentComponent {
  name: string;
  weightPercent: number;
}

export type CatalogScheduleStatus =
  | 'listed_in_catalog'
  | 'scheduled_for_term'
  | 'not_confirmed_for_term';

export interface Course {
  id: string;
  code: string;
  subjectCode?: string;
  title: string;
  universityId: Exclude<UniversityId, 'all'>;
  universityName: string;
  department: string;
  level: 100 | 200 | 300 | 400 | 500;
  credits: string;
  description: string;
  termsOffered: string[];
  officialNote: string;
  prerequisites?: string;
  corequisites?: string;
  antirequisites?: string;
  calendarVersion?: string;
  sourceUrl?: string;
  lastUpdated?: string;
  catalogPid?: string;
  catalogStatus?: CatalogScheduleStatus;
  termScheduleNote?: string;
  isOfficialCatalog?: boolean;
  assessmentBreakdown?: AssessmentComponent[];
  workloadBreakdown?: {
    lectures?: number;
    assignments?: number;
    studying?: number;
    exams?: number;
  };
}

export type GradeBand = '85+' | '80-84' | '70-79' | '60-69' | 'below-60';

export type StudyMethodKey =
  | 'practice_problems'
  | 'lecture_attendance'
  | 'textbook_reading'
  | 'study_groups'
  | 'spaced_repetition'
  | 'tutorial_sessions'
  | 'past_exams'
  | 'project_based';

export type StudyPreference =
  | 'all'
  | 'independent'
  | 'collaborative'
  | 'structured_notes'
  | 'visual';

export interface StudyMethodStat {
  key: StudyMethodKey;
  label: string;
  preferenceCategory: Exclude<StudyPreference, 'all'>;
  usedCount: number;
  helpfulCount: number;
  helpfulPercentage: number;
}

export interface Review {
  id: string;
  courseId: string;
  universityId: Exclude<UniversityId, 'all'>;
  term: string;
  instructorName: string;
  taName?: string;
  authorAlias: string;
  isAnonymous: boolean;
  verifiedEnrollment: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  weeklyHours: number;
  /** Self-reported mental effort (1 = light, 5 = draining). Optional for legacy entries. */
  mentalEffort?: 1 | 2 | 3 | 4 | 5;
  /** Self-reported stress (1 = calm, 5 = overwhelming). Optional for legacy entries. */
  stress?: 1 | 2 | 3 | 4 | 5;
  /** Grade the student was working toward, used only for study-hour bands. */
  targetGrade?: GradeBand;
  recommended: boolean;
  usefulness: 1 | 2 | 3 | 4 | 5;
  overallExperience: string;
  whatWorkedWell: string;
  whatWasChallenging: string;
  practicalAdvice: string;
  studyMethods: StudyMethodKey[];
  helpfulMethods?: StudyMethodKey[];
  helpfulVotes: number;
  notHelpfulVotes: number;
  createdAt: string;
  moderationStatus: 'visible' | 'flagged' | 'hidden';
  reportCount: number;
  isDemoData: boolean;
}

export type TrustLabel =
  | 'Detailed Feedback'
  | 'Course-Specific'
  | 'Actionable Advice'
  | 'Enrollment Verified'
  | 'Balanced Critique'
  | 'Limited Context'
  | 'Low Specificity'
  | 'Possible Duplicate';

export type TrustLensMode = 'most_informative' | 'most_recent' | 'all';

export interface ReviewScoreContribution {
  label: string;
  points: number;
  detail: string;
}

export interface TrustLensEvaluation {
  score: number;
  tier: 'most_informative' | 'standard' | 'limited';
  labels: TrustLabel[];
  /** Every point added or removed, in the order the score was assembled. */
  contributions: ReviewScoreContribution[];
  signals: {
    hasCourseSpecificDetails: boolean;
    hasAssessmentOrWorkloadContext: boolean;
    hasActionableAdvice: boolean;
    isDuplicateOrRepetitive: boolean;
    isLowInformation: boolean;
    recencyScore: number;
    helpfulnessNet: number;
  };
  explanation: string;
}

export interface EnrichedReview extends Review {
  trustLens: TrustLensEvaluation;
}

export interface DistributionBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface TermTrendPoint {
  term: string;
  reviewCount: number;
  avgDifficulty: number;
  avgWeeklyHours: number;
  recommendationRate: number;
}

export interface RatingBreakdown {
  priorRating: number;
  priorWeight: number;
  weightedUsefulnessSum: number;
  totalWeight: number;
  shrunk: number;
  standardError: number;
  margin: number;
  low: number;
  high: number;
}

export interface RatingRange {
  point: number;
  low: number;
  high: number;
  sampleSize: number;
  anchoredToDepartment: boolean;
  priorLabel: string;
  /** Inputs of the shrinkage that produced point/low/high. */
  breakdown?: RatingBreakdown;
}

export interface LoadIndexComponent {
  key: 'hours' | 'effort' | 'stress';
  label: string;
  input: number;
  inputMax: number;
  weight: number;
  normalized: number;
  points: number;
}

export interface LoadIndexBreakdown {
  index: number;
  formula: string;
  components: LoadIndexComponent[];
}

export interface LoadProfile {
  avgWeeklyHours: number;
  avgMentalEffort: number;
  avgStress: number;
  loadIndex: number;
  label: 'Light' | 'Manageable' | 'Demanding' | 'Very demanding';
  /** Inputs of the 0-100 index, straight from the calculation. */
  breakdown?: LoadIndexBreakdown;
}

export interface EffortToSuccessBand {
  band: GradeBand;
  label: string;
  reviewCount: number;
  avgWeeklyHours: number;
  minWeeklyHours: number;
  maxWeeklyHours: number;
  topMethods: string[];
}

export interface PeakWeekCell {
  week: number;
  label: string;
  intensity: number;
  drivers: string[];
}

export interface PeakWeekSource {
  label: string;
  kind: 'assessment' | 'student_mention';
  weeks: string;
  weight?: number;
  weightPercent?: number;
}

export interface PeakWeekMap {
  cells: PeakWeekCell[];
  busiestWeek: number;
  busiestLabel: string;
  note: string;
  /** Catalogue weights and student mentions that produced the intensities. */
  sources?: PeakWeekSource[];
}

export interface CourseStats {
  responseCount: number;
  informativeCount: number;
  avgDifficulty: number;
  avgWeeklyHours: number;
  recommendationRate: number;
  avgUsefulness: number;
  confidenceLevel: 'limited' | 'moderate' | 'strong';
  confidenceNote: string;
  difficultyDistribution: DistributionBucket[];
  hoursDistribution: DistributionBucket[];
  usefulnessDistribution: DistributionBucket[];
  termTrends: TermTrendPoint[];
  studyStrategyStats: StudyMethodStat[];
  rating: RatingRange;
  load: LoadProfile;
  effortToSuccess: EffortToSuccessBand[];
  asOf: string;
  weightingNote: string;
  /** Raw inputs behind each score, emitted by the same pass that computes them. */
  scoreBreakdowns?: CourseScoreBreakdowns;
}

export interface TermWeightRow {
  term: string;
  reviews: number;
  weight: number;
  weightPercent: number;
}

export interface FreshnessWeighting {
  referenceTerm: string;
  decayPerTerm: number;
  floor: number;
  totalWeight: number;
  terms: TermWeightRow[];
}

export interface CourseScoreBreakdowns {
  weighting: FreshnessWeighting;
  difficulty: { reviews: number; weightedSum: number; avg: number };
  recommend: { reviews: number; recommends: number; weightedRecommended: number };
  load: LoadIndexBreakdown;
  rating: RatingBreakdown;
}

export interface InstructorCategoryScore {
  category: string;
  score: number; // 1 to 5
  responseCount: number;
}

export interface InstructorProfile {
  id: string;
  courseId: string;
  name: string;
  role: 'professor' | 'ta';
  term: string;
  responseCount: number;
  categories: InstructorCategoryScore[];
  constructiveSummary: string;
  isDemoProfile: true;
}

export type FacultyResponseStatus = 'heard' | 'changed' | 'explained';

export interface FacultyResponse {
  id: string;
  courseId: string;
  instructorName: string;
  role: 'professor' | 'ta';
  term: string;
  themeAddressed: string;
  responseText: string;
  status: FacultyResponseStatus;
  updatedAt: string;
  isDemo: true;
}

export interface PulseResponse {
  id: string;
  courseId: string;
  term: string;
  week: number;
  userId: string;
  keepsWorking: string;
  notWorking: string;
  oneChange: string;
  createdAt: string;
}

export interface PulseThemeCount {
  label: string;
  count: number;
}

export interface PulseAggregate {
  courseId: string;
  term: string;
  week: number;
  windowOpen: boolean;
  windowNote: string;
  responseCount: number;
  promptsRemaining: number;
  sealed: boolean;
  sealedUntil: string | null;
  themes: {
    keepsWorking: PulseThemeCount[];
    notWorking: PulseThemeCount[];
    oneChange: PulseThemeCount[];
  };
}

export interface StaffDigestItem {
  text: string;
  theme: string;
  evidenceReviewIds: string[];
  term: string;
}

export interface StaffDigest {
  courseId: string;
  courseCode: string;
  source: 'gemini' | 'deterministic';
  generatedAt: string;
  eligibleReviewCount: number;
  sampleNote: string;
  start: StaffDigestItem[];
  stop: StaffDigestItem[];
  keep: StaffDigestItem[];
  checklist: string[];
  caveat: string;
}

export interface TeachingTeamTheme {
  label: string;
  count: number;
}

export interface TeachingTeamView {
  instructorId: string;
  name: string;
  role: 'professor' | 'ta';
  term: string;
  matchedReviewCount: number;
  confusionThemes: TeachingTeamTheme[];
  helpfulThemes: TeachingTeamTheme[];
  excerpts: Array<{ text: string; term: string; field: 'worked' | 'challenging' }>;
  earlierTermMentions: number;
  note: string;
}

export interface InsightItem {
  point: string;
  evidenceReviewIds: string[];
  evidenceLabel: string;
}

export interface CourseInsightReport {
  source: 'gemini' | 'deterministic';
  generatedAt: string;
  eligibleReviewCount: number;
  sampleNote: string;
  appreciate: InsightItem[];
  struggleWith: InsightItem[];
  recommendBefore: InsightItem[];
  experiencesDiffer: InsightItem[];
}

export interface ModerationReport {
  id: string;
  reviewId: string;
  courseId: string;
  reason: 'spam' | 'harassment' | 'pii' | 'off_topic';
  details: string;
  createdAt: string;
  status: 'pending' | 'reviewed_kept' | 'reviewed_removed';
}

export interface CourseFilters {
  universityId: UniversityId;
  term?: 'all' | 'Fall' | 'Winter' | 'Spring';
  department: string;
  level: 'all' | 100 | 200 | 300 | 400 | 500;
  maxDifficulty: 'all' | 2 | 3 | 4 | 5;
  maxHours: 'all' | 6 | 10 | 14;
  hasReviews?: 'all' | 'with_reviews' | 'without_reviews';
  sortBy: 'relevance' | 'recommended' | 'reviews' | 'workload_asc' | 'workload_desc' | 'code';
}

export interface CatalogueSubject {
  code: string;
  department: string;
  count: number;
  universityId: Exclude<UniversityId, 'all'>;
}

export interface CatalogueMetadata {
  totalCourses: number;
  waterlooCourseCount: number;
  uottawaCourseCount: number;
  waterlooCalendarVersion: string;
  waterlooSourceUrl: string;
  waterlooLastSyncedAt: string;
  openDataConfigured: boolean;
  subjectCount: number;
}

export interface PaginatedCoursesResponse {
  courses: Course[];
  statsMap: Record<string, CourseStats>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  subjects: CatalogueSubject[];
}

export interface StudyFitInsight {
  preference: StudyPreference;
  headline: string;
  matchingStrategies: StudyMethodStat[];
  supportingExcerpts: Array<{
    reviewId: string;
    authorAlias: string;
    term: string;
    advice: string;
  }>;
  disclaimer: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  universityId: Exclude<UniversityId, 'all'>;
  program: string;
  role: 'student' | 'faculty_demo';
}

/**
 * A student's free-text request, translated into catalogue search parameters.
 * Produced by the rules parser and, when a model provider is configured, refined by
 * the model. Only these fixed fields cross the boundary, so the model can never
 * inject arbitrary queries into the catalogue.
 */
export interface AdvisorBrief {
  intent: string;
  subjectCodes: string[];
  keywords: string[];
  /** Terms the student explicitly does not want ("no essays", "avoid finals"). */
  excludeKeywords: string[];
  /**
   * Whole subjects ruled out by a stated limitation rather than a topic request:
   * "no technical knowledge" must never return CS, MATH or engineering courses.
   */
  excludeSubjects: string[];
  /** Human label for those subjects, e.g. "technical background". */
  excludeSubjectsLabel: string;
  level: CourseFilters['level'];
  maxDifficulty: 'all' | 1 | 2 | 3 | 4 | 5;
  maxHours: CourseFilters['maxHours'];
  term: NonNullable<CourseFilters['term']>;
  wantsReviews: boolean;
  constraints: string[];
}

export interface AdvisorMatchCheck {
  key: 'topic' | 'level' | 'hours' | 'difficulty' | 'reviews' | 'evidence';
  label: string;
  weight: number;
  /** 0-1 fit on this check. */
  fit: number;
  input: string;
  points: number;
}

export interface AdvisorMatchBreakdown {
  percent: number;
  rawPercent: number;
  checks: AdvisorMatchCheck[];
  totalWeight: number;
  earned: number;
  cautionApplied: boolean;
  cautionPenalty: number;
  minPercent: number;
  maxPercent: number;
}

export interface AdvisorResult {
  course: Course;
  stats: CourseStats;
  score: number;
  /** Data-grounded reasons, always derived from the catalogue snapshot and reviews. */
  matchReasons: string[];
  evidenceReviewIds: string[];
  /** Optional one-line phrasing from the model; never the sole basis of a match. */
  rationale?: string;
  /** Set when a match stretches one of the student's limits. */
  caution?: string;
  /** Fit percentage shown in the UI, computed from the same checks as the breakdown. */
  matchPercent?: number;
  matchBreakdown?: AdvisorMatchBreakdown;
}

export interface AdvisorResponse {
  query: string;
  brief: AdvisorBrief;
  summary: string;
  results: AdvisorResult[];
  /** 'ai' only when a language model shaped the brief or the phrasing. */
  source: 'ai' | 'rules';
  provider?: 'nvidia';
  model?: string;
  generatedAt: string;
  candidateCount: number;
  caveats: string[];
}

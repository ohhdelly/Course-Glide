import type {
  Course,
  FacultyResponse,
  InstructorProfile,
  ModerationReport,
  PulseResponse,
  Review,
  University,
} from '../types/course.ts';

export const DEMO_UNIVERSITIES: University[] = [
  {
    id: 'uwaterloo',
    name: 'University of Waterloo',
    shortName: 'Waterloo',
    location: 'Waterloo, ON',
  },
  {
    id: 'uottawa',
    name: 'University of Ottawa',
    shortName: 'uOttawa',
    location: 'Ottawa, ON',
  },
];

export const DEMO_COURSES: Course[] = [
  {
    id: 'math-137',
    code: 'MATH 137',
    title: 'Calculus 1 for Honours Mathematics',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Mathematics',
    level: 100,
    credits: '0.50 units',
    description:
      'Rigorous introduction to limits, continuity, derivatives, Mean Value Theorem, and elementary proof techniques for Honours Mathematics students.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official syllabus structure: 3 lecture hours + 1 tutorial hour weekly (demonstration summary; verify current term outline with faculty).',
    assessmentBreakdown: [
      { name: 'Weekly Assignments & Quizzes', weightPercent: 25 },
      { name: 'Midterm Examination', weightPercent: 25 },
      { name: 'Final Examination', weightPercent: 50 },
    ],
  },
  {
    id: 'cs-135',
    code: 'CS 135',
    title: 'Designing Functional Programs',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Computer Science',
    level: 100,
    credits: '0.50 units',
    description:
      'Systematic program design using functional abstraction, structural recursion, higher-order functions, and testing discipline in Racket.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official course overview: no prior programming experience assumed; emphasizes design recipes and invariant reasoning.',
    assessmentBreakdown: [
      { name: 'Weekly Programming Assignments', weightPercent: 25 },
      { name: 'Midterm Exams (2)', weightPercent: 30 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },
  {
    id: 'econ-101',
    code: 'ECON 101',
    title: 'Introduction to Microeconomics',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Economics',
    level: 100,
    credits: '0.50 units',
    description:
      'Foundations of consumer choice, supply and demand elasticity, market structures, welfare economics, and public policy trade-offs.',
    termsOffered: ['Fall', 'Winter', 'Spring'],
    officialNote:
      'Official course overview: introductory social science course open to all faculties.',
    assessmentBreakdown: [
      { name: 'Online Practice Quizzes', weightPercent: 20 },
      { name: 'Midterm Tests', weightPercent: 35 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },
  {
    id: 'mat-1320',
    code: 'MAT 1320',
    title: 'Calculus I',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Mathematics & Statistics',
    level: 100,
    credits: '3.0 units',
    description:
      'Limits, differentiation rules, implicit differentiation, optimization, curve sketching, and introductory integration with engineering and science applications.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official course overview: includes weekly Discussion Group (DGD) problem sessions alongside lectures.',
    assessmentBreakdown: [
      { name: 'Weekly Digital Assignments', weightPercent: 20 },
      { name: 'Midterm Exams', weightPercent: 35 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },
  {
    id: 'gng-1105',
    code: 'GNG 1105',
    title: 'Engineering Mechanics',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Engineering',
    level: 100,
    credits: '3.0 units',
    description:
      'Force systems, equilibrium of particles and rigid bodies in 2D and 3D, trusses, friction, centroids, and introductory particle dynamics.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official course overview: foundational first-year mechanics course with weekly problem-solving DGDs.',
    assessmentBreakdown: [
      { name: 'Weekly Problem Sets & Quizzes', weightPercent: 20 },
      { name: 'Midterm Exam', weightPercent: 30 },
      { name: 'Final Exam', weightPercent: 50 },
    ],
  },
  {
    id: 'cs-240',
    code: 'CS 240',
    title: 'Data Structures and Data Management',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Computer Science',
    level: 200,
    credits: '0.50 units',
    description:
      'Asymptotic analysis, priority queues, balanced search trees, hashing, tries, string matching, and external memory data structures.',
    termsOffered: ['Fall', 'Winter', 'Spring'],
    officialNote:
      'Official course overview: combines theoretical runtime proofs with C++ implementation assignments.',
    assessmentBreakdown: [
      { name: 'Theory & Coding Assignments', weightPercent: 30 },
      { name: 'Midterm Exam', weightPercent: 25 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },
  {
    id: 'csi-2110',
    code: 'CSI 2110',
    title: 'Data Structures and Algorithms',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Computer Science',
    level: 200,
    credits: '3.0 units',
    description:
      'Trees, priority queues, hash tables, graph algorithms, shortest paths, minimum spanning trees, and algorithm complexity analysis in Java.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official course overview: includes weekly programming labs and algorithmic proof assignments.',
    assessmentBreakdown: [
      { name: 'Programming Labs & Assignments', weightPercent: 30 },
      { name: 'Midterm Exam', weightPercent: 25 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },
  {
    id: 'stat-230',
    code: 'STAT 230',
    title: 'Probability',
    universityId: 'uwaterloo',
    universityName: 'University of Waterloo',
    department: 'Statistics',
    level: 200,
    credits: '0.50 units',
    description:
      'Combinatorial probability, discrete and continuous random variables, conditional expectation, generating functions, and limit theorems.',
    termsOffered: ['Fall', 'Winter', 'Spring'],
    officialNote:
      'Official course overview: foundational probability theory for mathematics, statistics, and computer science majors.',
    assessmentBreakdown: [
      { name: 'Online & Written Quizzes', weightPercent: 20 },
      { name: 'Midterm Exams (2)', weightPercent: 35 },
      { name: 'Final Exam', weightPercent: 45 },
    ],
  },

  // ── University of Ottawa: widely taken catalogue courses ─────────────────
  // Codes, titles and descriptions follow the official uOttawa course catalogue
  // (catalogue.uottawa.ca, 2026–2027). Assessment weights are demonstration
  // splits, matching the rest of this dataset.
  {
    id: 'eco-1102',
    code: 'ECO 1102',
    title: 'Introduction to Macroeconomics',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Economics',
    level: 100,
    credits: '3.0 units',
    description:
      'Macro versus micro, national accounting, components of aggregate demand, income determination and multiplier theory, business cycles, fiscal and monetary policy, banking, unemployment and inflation.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: a lecture-format survey of Canadian macroeconomic policy; check the current syllabus for section-specific weights.',
    assessmentBreakdown: [
      { name: 'Online Quizzes', weightPercent: 20 },
      { name: 'Midterm Examination', weightPercent: 30 },
      { name: 'Final Examination', weightPercent: 50 },
    ],
  },
  {
    id: 'eco-1104',
    code: 'ECO 1104',
    title: 'Introduction to Microeconomics',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Economics',
    level: 100,
    credits: '3.0 units',
    description:
      'Scarcity and choice, the market mechanism, demand and supply shifts, elasticity, consumer behaviour, production and cost curves, perfect competition, monopoly, price discrimination and government regulation.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture course open to all faculties and the usual prerequisite for 2000-level economics.',
    assessmentBreakdown: [
      { name: 'Online Quizzes', weightPercent: 20 },
      { name: 'Midterm Examinations (2)', weightPercent: 35 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'psy-1101',
    code: 'PSY 1101',
    title: 'Introduction to Psychology: Foundations',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Psychology',
    level: 100,
    credits: '3.0 units',
    description:
      'Object and method of psychology, historical perspective, the nervous system, consciousness, sensory processes, perception, cognition, memory, language, emotion, motivation and learning.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: the gateway lecture course for psychology programs and a common elective across faculties.',
    assessmentBreakdown: [
      { name: 'Online Chapter Quizzes', weightPercent: 15 },
      { name: 'Midterm Examinations (2)', weightPercent: 40 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'hss-1101',
    code: 'HSS 1101',
    title: 'Determinants of Health',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Health Sciences',
    level: 100,
    credits: '3.0 units',
    description:
      'Introduction to health sciences: models and concepts of health and wellness, illness and disease, and the biological, psychobehavioural, socio-political and environmental determinants of health.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture course required in the health sciences programs and popular as a faculty elective.',
    assessmentBreakdown: [
      { name: 'Written Assignments', weightPercent: 30 },
      { name: 'Midterm Examination', weightPercent: 25 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'adm-1100',
    code: 'ADM 1100',
    title: 'Introduction to Business',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Telfer School of Management',
    level: 100,
    credits: '3.0 units',
    description:
      'Functions of business and management: the manager’s role and how planning, organizing, leading and controlling oversee human, financial, material and commercial resources, with communication and teamwork skills.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: equivalent to ADM 1300; cannot be combined with it for units and is not open to BCom students.',
    assessmentBreakdown: [
      { name: 'Team Project', weightPercent: 25 },
      { name: 'Midterm Examination', weightPercent: 25 },
      { name: 'Final Examination', weightPercent: 50 },
    ],
  },
  {
    id: 'adm-4326',
    code: 'ADM 4326',
    title: 'Digital Marketing Technologies',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Telfer School of Management',
    level: 400,
    credits: '3.0 units',
    description:
      'Strategic and tactical use of digital marketing technologies in business intelligence, competitive and customer analysis, CRM, supply chains, product development, branding, positioning, promotion, advertising and e-commerce.',
    termsOffered: ['Fall'],
    officialNote:
      'Official uOttawa catalogue overview: hands-on experience with selected tools may be provided; expect a project-based deliverable.',
    assessmentBreakdown: [
      { name: 'Case Presentations', weightPercent: 30 },
      { name: 'Digital Campaign Project', weightPercent: 40 },
      { name: 'Final Report', weightPercent: 30 },
    ],
  },
  {
    id: 'mus-2310',
    code: 'MUS 2310',
    title: 'Music in the Movies',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Music',
    level: 200,
    credits: '3.0 units',
    description:
      'Study and critical appreciation of music chosen and composed for films, from orchestral scoring to popular soundtrack placement.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture course with no music-reading prerequisite; listening journals do the heavy lifting.',
    assessmentBreakdown: [
      { name: 'Listening Journals', weightPercent: 30 },
      { name: 'Film Score Essay', weightPercent: 25 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'cmn-2152',
    code: 'CMN 2152',
    title: 'Image and Communication',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Communication',
    level: 200,
    credits: '3.0 units',
    description:
      'Analysis of pictorial, photographic, cinematographic, videographic and computerized images, their meanings and functions, through a communicational approach with exploration and exercises.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: reserved for students in department of communication programs.',
    assessmentBreakdown: [
      { name: 'Visual Analysis Exercises', weightPercent: 35 },
      { name: 'Midterm Examination', weightPercent: 25 },
      { name: 'Final Project', weightPercent: 40 },
    ],
  },
  {
    id: 'mat-1341',
    code: 'MAT 1341',
    title: 'Introduction to Linear Algebra',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Mathematics & Statistics',
    level: 100,
    credits: '3.0 units',
    description:
      'Complex numbers, vector and scalar products, vector spaces, linear independence and bases, systems of linear equations, matrix algebra, determinants, eigenvalues, Gram-Schmidt and linear transformations.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture plus DGD; cannot be combined with MAT 1302 for units.',
    assessmentBreakdown: [
      { name: 'Weekly Assignments', weightPercent: 20 },
      { name: 'Midterm Examinations (2)', weightPercent: 35 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'chm-1311',
    code: 'CHM 1311',
    title: 'Principles of Chemistry',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Chemistry',
    level: 100,
    credits: '3.0 units',
    description:
      'Atoms, orbitals, bonding and molecular geometry; stoichiometry; solutions and redox reactions; gas laws; thermochemistry, thermodynamics and kinetics; equilibrium, acids and bases, pH and buffers, with labs in alternate weeks.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture, DGD and biweekly laboratory; students without 4U chemistry must also register in CHM 1301.',
    assessmentBreakdown: [
      { name: 'Laboratory Reports', weightPercent: 20 },
      { name: 'Midterm Examination', weightPercent: 30 },
      { name: 'Final Examination', weightPercent: 50 },
    ],
  },
  {
    id: 'phi-2394',
    code: 'PHI 2394',
    title: 'Scientific Thought and Social Values',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'Philosophy',
    level: 200,
    credits: '3.0 units',
    description:
      'The nature of scientific thought and the relationships between science, culture, religion, politics, technology and society at large.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: lecture course with no prerequisites, commonly taken as a science-and-society elective.',
    assessmentBreakdown: [
      { name: 'Reading Responses', weightPercent: 25 },
      { name: 'Argumentative Essay', weightPercent: 30 },
      { name: 'Final Examination', weightPercent: 45 },
    ],
  },
  {
    id: 'eng-1120',
    code: 'ENG 1120',
    title: 'Selected Topics in Literature and Composition',
    universityId: 'uottawa',
    universityName: 'University of Ottawa',
    department: 'English',
    level: 100,
    credits: '3.0 units',
    description:
      'Critical reading skills and coherent discourse, proper use and acknowledgement of sources, and topic-based readings in multiple genres that feed frequent written assignments.',
    termsOffered: ['Fall', 'Winter'],
    officialNote:
      'Official uOttawa catalogue overview: not repeatable for credit and not intended for English majors or honours students.',
    assessmentBreakdown: [
      { name: 'Written Assignments', weightPercent: 40 },
      { name: 'Seminar Participation', weightPercent: 10 },
      { name: 'Final Essay', weightPercent: 50 },
    ],
  },
];

type DemoReviewSeed = {
  id: string;
  courseId: string;
  /** Defaults to Waterloo so existing seeds stay untouched. */
  university?: Review['universityId'];
  term: string;
  professor: string;
  ta?: string;
  alias: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hours: number;
  recommended: boolean;
  usefulness?: 1 | 2 | 3 | 4 | 5;
  overall: string;
  worked: string;
  challenging: string;
  advice: string;
  methods?: Review['studyMethods'];
  helpful?: Review['studyMethods'];
  votes?: number;
  created: string;
  effort?: NonNullable<Review['mentalEffort']>;
  stress?: NonNullable<Review['stress']>;
  targetGrade?: NonNullable<Review['targetGrade']>;
  verified?: boolean;
};

/**
 * Compact builder for the wider demo spread. Seeded reviews are still complete
 * Review records; the defaults just keep moderator-only and metadata fields out
 * of the way so each story fits in a few readable lines.
 */
const seedReview = (seed: DemoReviewSeed): Review => ({
  id: seed.id,
  courseId: seed.courseId,
  universityId: seed.university ?? 'uwaterloo',
  term: seed.term,
  instructorName: seed.professor,
  ...(seed.ta ? { taName: seed.ta } : {}),
  authorAlias: seed.alias,
  isAnonymous: true,
  verifiedEnrollment: seed.verified ?? true,
  difficulty: seed.difficulty,
  weeklyHours: seed.hours,
  mentalEffort: seed.effort ?? seed.difficulty,
  stress: seed.stress ?? seed.difficulty,
  ...(seed.targetGrade ? { targetGrade: seed.targetGrade } : {}),
  recommended: seed.recommended,
  usefulness: seed.usefulness ?? 4,
  overallExperience: seed.overall,
  whatWorkedWell: seed.worked,
  whatWasChallenging: seed.challenging,
  practicalAdvice: seed.advice,
  studyMethods: seed.methods ?? ['practice_problems', 'lecture_attendance'],
  helpfulMethods: seed.helpful ?? seed.methods ?? ['practice_problems'],
  helpfulVotes: seed.votes ?? 6,
  notHelpfulVotes: 0,
  createdAt: seed.created,
  moderationStatus: 'visible',
  reportCount: 0,
  isDemoData: true,
});

const DEMO_REVIEW_SEED: Review[] = [
  // MATH 137 — Flagship demonstration narrative (8 varied reviews)
  {
    id: 'rev-math137-1',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Elena Vance (Demo)',
    taName: 'Maya Lin (Demo TA)',
    authorAlias: '2A Honours Math Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 11,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Challenging transition from high school computation to formal epsilon-delta proofs, but deeply rewarding once the weekly proof rhythm clicks.',
    whatWorkedWell:
      'Lecture notes were tightly structured around core theorems, and weekly tutorial quizzes highlighted exactly which proof steps markers look for.',
    whatWasChallenging:
      'Weeks 3 through 6 moved rapidly through formal limit proofs while weekly problem sets required 6 to 8 hours on top of lecture review.',
    practicalAdvice:
      'Draft your assignment proofs in rough form by Tuesday so you can bring specific questions to Wednesday tutorial or TA office hours.',
    studyMethods: ['practice_problems', 'tutorial_sessions', 'past_exams', 'lecture_attendance'],
    helpfulMethods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpfulVotes: 28,
    notHelpfulVotes: 2,
    createdAt: '2025-12-18T14:20:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-2',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Elena Vance (Demo)',
    taName: 'Devon Brooks (Demo TA)',
    authorAlias: '1B Mathematics Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 5,
    weeklyHours: 15,
    recommended: false,
    usefulness: 3,
    overallExperience:
      'The midterm grading felt unexpectedly harsh compared to in-class examples, and the jump in weekly assignment workload caught our section off guard.',
    whatWorkedWell:
      'TA Devon Brooks explained counterexamples clearly during office hours and walked through partial-credit rubrics patiently.',
    whatWasChallenging:
      'Assignment 4 and the midterm included multi-part continuity proofs that assumed comfort with inequality bounding never explicitly drilled in lecture.',
    practicalAdvice:
      'Do not rely solely on lecture slides. Solve extra proof exercises from the course workbook and practice bounding inequalities under timed conditions.',
    studyMethods: ['practice_problems', 'textbook_reading', 'past_exams'],
    helpfulMethods: ['past_exams', 'practice_problems'],
    helpfulVotes: 24,
    notHelpfulVotes: 3,
    createdAt: '2025-12-14T09:10:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-3',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Prof. Julian Reid (Demo)',
    taName: 'Maya Lin (Demo TA)',
    authorAlias: 'CS / Math Double Major',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 4,
    weeklyHours: 10,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Balanced workload if you stay consistent every week. The final exam was fair and closely matched the difficulty of tutorial worksheets.',
    whatWorkedWell:
      'Reviewing marked assignments side-by-side with the solution rubric taught me how to write concise, rigorous arguments.',
    whatWasChallenging:
      'Missing even one lecture made the Mean Value Theorem proofs feel disconnected until I caught up on textbook sections.',
    practicalAdvice:
      'Form a small 3-person study group to test each other’s proofs for logical gaps before submitting assignments.',
    studyMethods: ['study_groups', 'tutorial_sessions', 'lecture_attendance', 'practice_problems'],
    helpfulMethods: ['study_groups', 'tutorial_sessions', 'practice_problems'],
    helpfulVotes: 17,
    notHelpfulVotes: 1,
    createdAt: '2025-04-26T18:45:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-4',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2024',
    instructorName: 'Dr. Elena Vance (Demo)',
    authorAlias: 'Actuarial Science Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 9,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Solid foundational calculus course. If you took AP/IB Calculus, computation is familiar, so redirect your energy toward proof precision.',
    whatWorkedWell:
      'Past midterm archives and weekly tutorial check-ins kept exam surprises minimal.',
    whatWasChallenging:
      'Grading penalized skipped justification steps even when the final numerical limit was right.',
    practicalAdvice:
      'Write out theorem hypotheses explicitly (e.g., continuity on closed interval) on every midterm question.',
    studyMethods: ['past_exams', 'lecture_attendance', 'spaced_repetition'],
    helpfulMethods: ['past_exams', 'lecture_attendance'],
    helpfulVotes: 14,
    notHelpfulVotes: 2,
    createdAt: '2024-12-19T11:30:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-5',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2024',
    instructorName: 'Prof. Julian Reid (Demo)',
    authorAlias: 'Data Science Student',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 4,
    weeklyHours: 12,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Expect to spend real time on weekly assignments; tutorials are much more useful than passive rereading.',
    whatWorkedWell:
      'Visualizing functions alongside formal definitions made intermediate value and Rolle’s theorem intuitive.',
    whatWasChallenging:
      'Balancing MATH 137 problem sets with CS 135 deadlines on Thursday evenings.',
    practicalAdvice:
      'Sketch graphs before starting formal epsilon-delta proofs and practice two timed past exams before finals.',
    studyMethods: ['project_based', 'practice_problems', 'past_exams'],
    helpfulMethods: ['project_based', 'past_exams'],
    helpfulVotes: 11,
    notHelpfulVotes: 0,
    createdAt: '2024-12-11T16:15:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  // Low-information & off-topic/repetitive demo entries for Trust Lens demonstration
  {
    id: 'rev-math137-6',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Elena Vance (Demo)',
    authorAlias: 'Anonymous',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 5,
    weeklyHours: 20,
    recommended: false,
    usefulness: 1,
    overallExperience: 'Worst class ever lol, totally impossible.',
    whatWorkedWell: 'Nothing.',
    whatWasChallenging: 'Everything.',
    practicalAdvice: 'Drop it.',
    studyMethods: [],
    helpfulVotes: 1,
    notHelpfulVotes: 14,
    createdAt: '2025-12-20T08:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-7',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Elena Vance (Demo)',
    authorAlias: 'Anonymous',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 1,
    weeklyHours: 2,
    recommended: true,
    usefulness: 5,
    overallExperience: 'Super easy A+, barely showed up.',
    whatWorkedWell: 'Easy.',
    whatWasChallenging: 'None.',
    practicalAdvice: 'Just wing it.',
    studyMethods: [],
    helpfulVotes: 0,
    notHelpfulVotes: 9,
    createdAt: '2025-12-19T19:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-math137-8',
    courseId: 'math-137',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Prof. Julian Reid (Demo)',
    authorAlias: 'Anonymous',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 5,
    weeklyHours: 15,
    recommended: false,
    usefulness: 3,
    overallExperience:
      'The midterm grading felt unexpectedly harsh compared to in-class examples, and the jump in weekly assignment workload caught our section off guard.',
    whatWorkedWell:
      'TA Devon Brooks explained counterexamples clearly during office hours and walked through partial-credit rubrics patiently.',
    whatWasChallenging:
      'Assignment 4 and the midterm included multi-part continuity proofs that assumed comfort with inequality bounding never explicitly drilled in lecture.',
    practicalAdvice:
      'Do not rely solely on lecture slides. Solve extra proof exercises from the course workbook.',
    studyMethods: ['practice_problems'],
    helpfulVotes: 0,
    notHelpfulVotes: 6,
    createdAt: '2025-04-28T12:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // CS 135 reviews
  {
    id: 'rev-cs135-1',
    courseId: 'cs-135',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Prof. Marcus Chen (Demo)',
    taName: 'Priya Nair (Demo TA)',
    authorAlias: '1A CS Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 10,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Teaches clean recursive problem decomposition even if you already know imperative languages like Python or Java.',
    whatWorkedWell:
      'The design recipe (contracts, purpose statements, examples, tests) eliminated silly edge-case bugs on assignments and midterms.',
    whatWasChallenging:
      'Abstract list functions (foldr, map, filter) and mutual recursion on trees took extra practice before Midterm 2.',
    practicalAdvice:
      'Write check-expect test cases before coding the function body, and test empty-list and single-element base cases every time.',
    studyMethods: ['practice_problems', 'tutorial_sessions', 'past_exams', 'lecture_attendance'],
    helpfulMethods: ['practice_problems', 'past_exams', 'tutorial_sessions'],
    helpfulVotes: 22,
    notHelpfulVotes: 1,
    createdAt: '2025-12-16T15:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-cs135-2',
    courseId: 'cs-135',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Prof. Marcus Chen (Demo)',
    taName: 'Priya Nair (Demo TA)',
    authorAlias: '1A Math/BBA Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 13,
    recommended: false,
    usefulness: 4,
    overallExperience:
      'Weekly Racket assignments were strict on style marks and trace-table formatting, which ate up hours if you started late.',
    whatWorkedWell:
      'ISA/TA office hours in the lab were responsive and helped clarify recursion templates without giving away solutions.',
    whatWasChallenging:
      'Losing 15–20% on assignments for minor design-recipe formatting omissions felt frustrating during the first month.',
    practicalAdvice:
      'Run the style checklist on every assignment file and practice hand-tracing substitution steps for midterm questions.',
    studyMethods: ['practice_problems', 'study_groups', 'past_exams'],
    helpfulMethods: ['past_exams', 'study_groups'],
    helpfulVotes: 15,
    notHelpfulVotes: 2,
    createdAt: '2025-12-10T11:20:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-cs135-3',
    courseId: 'cs-135',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Dr. Hannah Ortiz (Demo)',
    authorAlias: 'CFM Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 9,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Well-paced intro CS course; stepping through recursion trees visually made accumulator passing click.',
    whatWorkedWell:
      'Recorded walkthroughs of past midterm coding questions and clear weekly assignment specs.',
    whatWasChallenging:
      'Accumulator-style recursion in the last third of the term required rethinking state without loops.',
    practicalAdvice:
      'Diagram recursion trees on paper for binary tree and graph problems before typing into DrRacket.',
    studyMethods: ['project_based', 'past_exams', 'lecture_attendance'],
    helpfulMethods: ['project_based', 'past_exams'],
    helpfulVotes: 12,
    notHelpfulVotes: 0,
    createdAt: '2025-04-20T13:10:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-cs135-4',
    courseId: 'cs-135',
    universityId: 'uwaterloo',
    term: 'Fall 2024',
    instructorName: 'Prof. Marcus Chen (Demo)',
    authorAlias: 'Anonymous',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 2,
    weeklyHours: 4,
    recommended: true,
    usefulness: 4,
    overallExperience: 'Racket is weird tbh, just finish the assignments.',
    whatWorkedWell: 'Lectures were okay.',
    whatWasChallenging: 'Parentheses.',
    practicalAdvice: 'Use DrRacket.',
    studyMethods: [],
    helpfulVotes: 1,
    notHelpfulVotes: 7,
    createdAt: '2024-12-08T10:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // ECON 101 reviews
  {
    id: 'rev-econ101-1',
    courseId: 'econ-101',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Nora Alverez (Demo)',
    taName: 'Liam O’Connor (Demo TA)',
    authorAlias: '2B Arts & Business',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 2,
    weeklyHours: 5,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Clear and practical introduction to supply-demand graphs, elasticity, and market welfare if you keep up with weekly quizzes.',
    whatWorkedWell:
      'Real-world policy examples in lecture (rent ceilings, carbon pricing, tariffs) made deadweight loss diagrams memorable.',
    whatWasChallenging:
      'Multiple-choice midterm traps often tested subtle shifts in marginal cost vs average total cost curves.',
    practicalAdvice:
      'Redraw every cost and market-structure diagram from memory and practice explaining why curves shift, not just memorizing directions.',
    studyMethods: ['spaced_repetition', 'lecture_attendance', 'past_exams', 'project_based'],
    helpfulMethods: ['spaced_repetition', 'past_exams', 'project_based'],
    helpfulVotes: 19,
    notHelpfulVotes: 1,
    createdAt: '2025-12-15T16:40:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-econ101-2',
    courseId: 'econ-101',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Dr. Nora Alverez (Demo)',
    authorAlias: '1B Engineering Elective',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 2,
    weeklyHours: 4,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Manageable elective alongside a heavy technical course load; textbook readings reinforce lecture graphs well.',
    whatWorkedWell:
      'Predictable weekly online quizzes kept exam prep low-stress.',
    whatWasChallenging:
      'Game theory and oligopoly payoff matrices at the end of the term needed extra practice.',
    practicalAdvice:
      'Use flashcards for elasticity formulas and market-structure characteristics (perfect competition vs monopolistic competition).',
    studyMethods: ['spaced_repetition', 'textbook_reading', 'practice_problems'],
    helpfulMethods: ['spaced_repetition', 'practice_problems'],
    helpfulVotes: 9,
    notHelpfulVotes: 0,
    createdAt: '2025-04-22T09:50:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-econ101-3',
    courseId: 'econ-101',
    universityId: 'uwaterloo',
    term: 'Fall 2024',
    instructorName: 'Prof. Samir Kapoor (Demo)',
    authorAlias: '1A Economics',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 3,
    weeklyHours: 6,
    recommended: false,
    usefulness: 3,
    overallExperience:
      'Felt overly theoretical in the second half; midterm questions rewarded memorizing exact textbook phrasing over intuition.',
    whatWorkedWell:
      'Clear syllabus schedule and transparent grading weights from day one.',
    whatWasChallenging:
      'Ambiguous wording on two-option multiple choice questions regarding short-run vs long-run shutdown points.',
    practicalAdvice:
      'Read the assigned textbook chapters closely before midterms and double-check definitions of marginal vs average costs.',
    studyMethods: ['textbook_reading', 'past_exams'],
    helpfulMethods: ['textbook_reading', 'past_exams'],
    helpfulVotes: 8,
    notHelpfulVotes: 2,
    createdAt: '2024-12-13T17:15:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // MAT 1320 (uOttawa) reviews
  {
    id: 'rev-mat1320-1',
    courseId: 'mat-1320',
    universityId: 'uottawa',
    term: 'Fall 2025',
    instructorName: 'Dr. Claire Beaumont (Demo)',
    taName: 'Lucas Tremblay (Demo TA)',
    authorAlias: '1st Year Biomedical Science',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 8,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Very well-organized calculus sequence; weekly DGDs and digital practice sets kept everyone sharp before Midterms 1 and 2.',
    whatWorkedWell:
      'Dr. Beaumont worked through step-by-step related rates and optimization problems in lecture and posted annotated PDFs right after class.',
    whatWasChallenging:
      'Trigonometric substitution and implicit differentiation problems on Midterm 2 were tight on time.',
    practicalAdvice:
      'Do not skip the weekly DGD sessions. Lucas’s worked examples mirrored the exact structure of midterm long-answer questions.',
    studyMethods: ['tutorial_sessions', 'practice_problems', 'past_exams', 'lecture_attendance'],
    helpfulMethods: ['tutorial_sessions', 'practice_problems', 'past_exams'],
    helpfulVotes: 21,
    notHelpfulVotes: 1,
    createdAt: '2025-12-17T12:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-mat1320-2',
    courseId: 'mat-1320',
    universityId: 'uottawa',
    term: 'Fall 2025',
    instructorName: 'Dr. Claire Beaumont (Demo)',
    taName: 'Lucas Tremblay (Demo TA)',
    authorAlias: '1st Year Mechanical Eng',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 10,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Solid engineering prep if you do the weekly homework without relying on symbolic calculators.',
    whatWorkedWell:
      'Clear grading breakdown and helpful TA office hours before Friday homework deadlines.',
    whatWasChallenging:
      'The online homework platform was picky with simplified radical forms, and curve sketching on the final was lengthy.',
    practicalAdvice:
      'Practice simplifying algebraic expressions by hand and time yourself on 3 past final exams.',
    studyMethods: ['practice_problems', 'past_exams', 'study_groups'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 13,
    notHelpfulVotes: 0,
    createdAt: '2025-12-09T14:30:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-mat1320-3',
    courseId: 'mat-1320',
    universityId: 'uottawa',
    term: 'Winter 2025',
    instructorName: 'Prof. Tariq Haddad (Demo)',
    authorAlias: '1st Year Honours Physics',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 4,
    weeklyHours: 11,
    recommended: false,
    usefulness: 3,
    overallExperience:
      'Lectures moved quickly through proofs without enough worked numerical examples, forcing students to rely heavily on the textbook.',
    whatWorkedWell:
      'Practice midterms posted two weeks early gave an accurate preview of topic weights.',
    whatWasChallenging:
      'Minimal time spent on L’Hôpital’s rule edge cases and improper limits prior to the final exam.',
    practicalAdvice:
      'Supplement lectures with textbook exercises at the end of each chapter and attend any available DGD section.',
    studyMethods: ['textbook_reading', 'practice_problems', 'tutorial_sessions'],
    helpfulMethods: ['textbook_reading', 'tutorial_sessions'],
    helpfulVotes: 10,
    notHelpfulVotes: 2,
    createdAt: '2025-04-25T10:15:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-mat1320-4',
    courseId: 'mat-1320',
    universityId: 'uottawa',
    term: 'Fall 2024',
    instructorName: 'Dr. Claire Beaumont (Demo)',
    authorAlias: 'Anonymous',
    isAnonymous: true,
    verifiedEnrollment: false,
    difficulty: 2,
    weeklyHours: 3,
    recommended: true,
    usefulness: 4,
    overallExperience: 'Good prof, straightforward exams.',
    whatWorkedWell: 'Notes.',
    whatWasChallenging: 'Nothing much.',
    practicalAdvice: 'Study.',
    studyMethods: [],
    helpfulVotes: 1,
    notHelpfulVotes: 5,
    createdAt: '2024-12-18T08:30:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // GNG 1105 (uOttawa) reviews
  {
    id: 'rev-gng1105-1',
    courseId: 'gng-1105',
    universityId: 'uottawa',
    term: 'Fall 2025',
    instructorName: 'Dr. Robert Kowalski (Demo)',
    taName: 'Amira Mansour (Demo TA)',
    authorAlias: '1st Year Civil Engineering',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 11,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Demanding first-year statics and dynamics course, but mastering free-body diagrams early makes everything later in engineering click.',
    whatWorkedWell:
      'Amira’s DGD walkthroughs of 3D moment equilibrium and truss method-of-sections were crystal clear.',
    whatWasChallenging:
      '3D vector cross-products and friction tipping vs slipping problems on the midterm caused lots of sign errors.',
    practicalAdvice:
      'Draw clean, oversized Free Body Diagrams with explicit coordinate axes on every single problem before writing equilibrium equations.',
    studyMethods: ['practice_problems', 'tutorial_sessions', 'project_based', 'study_groups'],
    helpfulMethods: ['practice_problems', 'tutorial_sessions', 'project_based'],
    helpfulVotes: 20,
    notHelpfulVotes: 1,
    createdAt: '2025-12-16T10:20:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-gng1105-2',
    courseId: 'gng-1105',
    universityId: 'uottawa',
    term: 'Winter 2025',
    instructorName: 'Dr. Robert Kowalski (Demo)',
    taName: 'Amira Mansour (Demo TA)',
    authorAlias: '1st Year Mechanical Eng',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 12,
    recommended: false,
    usefulness: 4,
    overallExperience:
      'The final exam jumped sharply in difficulty when combining friction, frames, and projectile kinematics under a strict 3-hour limit.',
    whatWorkedWell:
      'Weekly problem sets forced steady practice rather than cramming.',
    whatWasChallenging:
      'Very little partial credit if your initial Free Body Diagram missed a reaction component.',
    practicalAdvice:
      'Practice at least 15 multi-body frame and friction problems without looking at the solution manual before the final.',
    studyMethods: ['practice_problems', 'past_exams', 'study_groups'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 16,
    notHelpfulVotes: 2,
    createdAt: '2025-04-27T17:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-gng1105-3',
    courseId: 'gng-1105',
    universityId: 'uottawa',
    term: 'Fall 2024',
    instructorName: 'Prof. Nadia Benali (Demo)',
    authorAlias: '2nd Year Mechanical Eng',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 9,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Essential course for anyone going into civil or mechanical; DGD practice problems were the best indicator of exam style.',
    whatWorkedWell:
      'Formula sheet clarity and physical demonstrations of moments and couples during lectures.',
    whatWasChallenging:
      'Switching from 2D scalar moments to 3D vector equilibrium mid-semester.',
    practicalAdvice:
      'Review dot and cross products from linear algebra in Week 2 so 3D moments don’t slow you down.',
    studyMethods: ['tutorial_sessions', 'lecture_attendance', 'practice_problems'],
    helpfulMethods: ['tutorial_sessions', 'practice_problems'],
    helpfulVotes: 12,
    notHelpfulVotes: 0,
    createdAt: '2024-12-14T11:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // CS 240 reviews
  {
    id: 'rev-cs240-1',
    courseId: 'cs-240',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Dr. Ethan Park (Demo)',
    taName: 'Sonia Verma (Demo TA)',
    authorAlias: '2B Computer Science',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 12,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'One of the most directly useful core CS courses for technical interviews and systems thinking.',
    whatWorkedWell:
      'Balanced split between runtime proofs and C++ coding assignments (AVL rotations, KMP string matching, quadtrees).',
    whatWasChallenging:
      'Amortized analysis and skip-list expectation proofs on written assignments took careful concentration.',
    practicalAdvice:
      'Implement AVL rotations and heapify from scratch on paper before exams, and use valgrind early on coding assignments.',
    studyMethods: ['practice_problems', 'project_based', 'past_exams', 'study_groups'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 19,
    notHelpfulVotes: 1,
    createdAt: '2025-12-17T18:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-cs240-2',
    courseId: 'cs-240',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Dr. Ethan Park (Demo)',
    authorAlias: '2B Software Engineering',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 13,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Heavy coding plus proof deadlines every two weeks, so time management matters.',
    whatWorkedWell:
      'Clear asymptotic notation expectations and constructive TA feedback on algorithm efficiency.',
    whatWasChallenging:
      'B-trees and external memory complexity questions on the final exam.',
    practicalAdvice:
      'Draw state diagrams for every tree rotation and suffix array example.',
    studyMethods: ['project_based', 'past_exams', 'lecture_attendance'],
    helpfulMethods: ['project_based', 'past_exams'],
    helpfulVotes: 14,
    notHelpfulVotes: 0,
    createdAt: '2025-04-21T15:30:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // CSI 2110 reviews
  {
    id: 'rev-csi2110-1',
    courseId: 'csi-2110',
    universityId: 'uottawa',
    term: 'Fall 2025',
    instructorName: 'Dr. Celine Moreau (Demo)',
    taName: 'Kenji Sato (Demo TA)',
    authorAlias: '2nd Year Computer Science',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 9,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Great bridge from intro Java programming to real graph algorithms, priority queues, and complexity proofs.',
    whatWorkedWell:
      'Weekly Java labs reinforced Dijkstra, Kruskal, and DFS/BFS traversal mechanics immediately after lecture.',
    whatWasChallenging:
      'Programming Assignment 3 (graph traversal optimization) had strict memory/runtime test cases.',
    practicalAdvice:
      'Trace Dijkstra and Union-Find with path compression by hand before the midterm.',
    studyMethods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 16,
    notHelpfulVotes: 1,
    createdAt: '2025-12-14T16:00:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-csi2110-2',
    courseId: 'csi-2110',
    universityId: 'uottawa',
    term: 'Winter 2025',
    instructorName: 'Dr. Celine Moreau (Demo)',
    authorAlias: '2nd Year Software Eng',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 8,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Fair workload and clear rubric; great preparation for co-op coding interviews.',
    whatWorkedWell:
      'Lab TAs gave practical debugging tips for Java generics and priority queues.',
    whatWasChallenging:
      'Balanced tree deletion cases and Big-O recurrence relations.',
    practicalAdvice:
      'Keep flashcards for worst-case vs average-case complexities of every structure.',
    studyMethods: ['spaced_repetition', 'tutorial_sessions', 'past_exams'],
    helpfulMethods: ['spaced_repetition', 'past_exams'],
    helpfulVotes: 11,
    notHelpfulVotes: 0,
    createdAt: '2025-04-23T12:40:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // STAT 230 reviews
  {
    id: 'rev-stat230-1',
    courseId: 'stat-230',
    universityId: 'uwaterloo',
    term: 'Fall 2025',
    instructorName: 'Prof. Grace Liu (Demo)',
    taName: 'Omar Farooq (Demo TA)',
    authorAlias: '2A Statistics Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 3,
    weeklyHours: 8,
    recommended: true,
    usefulness: 5,
    overallExperience:
      'Logical and well-structured probability course; doing workbook problems steadily keeps the two midterms very approachable.',
    whatWorkedWell:
      'The official course notes and practice question bank aligned closely with exam style.',
    whatWasChallenging:
      'Joint continuous distributions and multivariate transformations required careful integration bounds.',
    practicalAdvice:
      'Sketch the 2D support region before setting up double integrals for joint probability densities.',
    studyMethods: ['practice_problems', 'textbook_reading', 'past_exams'],
    helpfulMethods: ['practice_problems', 'past_exams'],
    helpfulVotes: 18,
    notHelpfulVotes: 0,
    createdAt: '2025-12-15T10:15:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },
  {
    id: 'rev-stat230-2',
    courseId: 'stat-230',
    universityId: 'uwaterloo',
    term: 'Winter 2025',
    instructorName: 'Prof. Grace Liu (Demo)',
    authorAlias: '2A Math Student',
    isAnonymous: true,
    verifiedEnrollment: true,
    difficulty: 4,
    weeklyHours: 9,
    recommended: true,
    usefulness: 4,
    overallExperience:
      'Conditioning and indicator random variables become huge time-savers once you practice setting them up.',
    whatWorkedWell:
      'TA tutorial sessions showed multiple counting approaches for tricky combinatorics problems.',
    whatWasChallenging:
      'Moment generating function uniqueness proofs and conditional variance identities.',
    practicalAdvice:
      'Build a one-page reference table of distributions (Binomial, Poisson, Geometric, Exponential, Normal) with means and variances.',
    studyMethods: ['spaced_repetition', 'tutorial_sessions', 'practice_problems'],
    helpfulMethods: ['spaced_repetition', 'practice_problems'],
    helpfulVotes: 13,
    notHelpfulVotes: 1,
    createdAt: '2025-04-24T14:20:00.000Z',
    moderationStatus: 'visible',
    reportCount: 0,
    isDemoData: true,
  },

  // ── Wider demo spread: 30 reviews across 13 further courses ───────────────
  // CS 349 runs as the low-workload 300-level CS elective, so it can carry the
  // advisor's "light 300-level CS" example with real numbers behind it.
  seedReview({
    id: 'rev-cs349-1',
    courseId: 'cs-349',
    term: 'Fall 2025',
    professor: 'Prof. Hana Okafor (Demo)',
    ta: 'Iris Bellamy (Demo TA)',
    alias: '3A CS Student',
    difficulty: 2,
    hours: 7,
    recommended: true,
    usefulness: 5,
    overall:
      'The most project-driven CS course I have taken. Marks come from a prototype walkthrough plus a final demo, with no exam to cram for.',
    worked:
      'Weekly critique sessions meant feedback arrived while the prototype could still change, and the rubric was published before every milestone.',
    challenging:
      'Accessibility and keyboard-only testing took longer than expected on the final build.',
    advice:
      'Pick a small, testable interface idea in week two and run one usability session with a friend before each milestone.',
    methods: ['project_based', 'lecture_attendance'],
    helpful: ['project_based'],
    votes: 21,
    created: '2025-12-16T15:10:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-cs349-2',
    courseId: 'cs-349',
    term: 'Winter 2025',
    professor: 'Prof. Derek Iwu (Demo)',
    alias: '2B CS Student',
    difficulty: 3,
    hours: 8,
    recommended: true,
    overall:
      'Light weekly load until the final prototype push, which is genuinely fun if you like building interfaces.',
    worked:
      'Studio time was scheduled during lab hours, so the group had a room and a TA available every week.',
    challenging:
      'Front-end tooling choices are open-ended; picking a stack early saved a lot of churn.',
    advice:
      'Use plain HTML and CSS for the first prototype instead of learning a framework and the course material at once.',
    methods: ['project_based', 'study_groups'],
    helpful: ['project_based'],
    votes: 12,
    created: '2025-04-22T10:05:00.000Z',
    effort: 3,
    stress: 2,
  }),
  seedReview({
    id: 'rev-cs348-1',
    courseId: 'cs-348',
    term: 'Fall 2025',
    professor: 'Prof. Anita Chandra (Demo)',
    alias: '3A CS Student',
    difficulty: 3,
    hours: 8,
    recommended: true,
    overall:
      'A practical database course: SQL, schema design, then transactions. Manageable alongside two other CS courses.',
    worked:
      'Assignments ran against a real database instance, so query plans and index choices actually mattered.',
    challenging:
      'Normalization proofs and isolation-level questions on the midterm needed more precision than the lectures suggested.',
    advice:
      'Rewrite every query with EXPLAIN before submitting; the marking scheme rewards a sensible index choice.',
    methods: ['practice_problems', 'project_based', 'past_exams'],
    helpful: ['practice_problems'],
    votes: 16,
    created: '2025-12-17T09:40:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs348-2',
    courseId: 'cs-348',
    term: 'Winter 2025',
    professor: 'Prof. Anita Chandra (Demo)',
    ta: 'Kenji Mori (Demo TA)',
    alias: '3B CS Student',
    difficulty: 3,
    hours: 10,
    recommended: true,
    usefulness: 5,
    overall:
      'The term project is the whole point: you design and build a small application on top of a database you model yourself.',
    worked:
      'TA Kenji ran an optional schema-review hour before the project proposal was due.',
    challenging:
      'Concurrency control questions were the hardest part of the final, and the readings for them were dense.',
    advice:
      'Model your project schema in week three and get it reviewed; a bad schema makes every later query painful.',
    methods: ['project_based', 'tutorial_sessions'],
    helpful: ['project_based', 'tutorial_sessions'],
    votes: 9,
    created: '2025-04-25T17:20:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs341-1',
    courseId: 'cs-341',
    term: 'Fall 2025',
    professor: 'Prof. Samuel Achebe (Demo)',
    alias: '3A CS Student',
    difficulty: 4,
    hours: 12,
    recommended: true,
    usefulness: 5,
    overall:
      'The backbone algorithms course. Proofs and recurrence analysis are demanding, but every later CS course feels easier afterwards.',
    worked:
      'Problem sets were released with a hint sheet, and the marking scheme rewarded the right invariant even on incomplete proofs.',
    challenging:
      'NP-completeness reductions in the last third of the term demand a lot of independent practice.',
    advice:
      'Write the loop invariant before the code in every dynamic-programming question, then verify the base case by hand.',
    methods: ['practice_problems', 'textbook_reading', 'past_exams'],
    helpful: ['practice_problems', 'past_exams'],
    votes: 26,
    created: '2025-12-19T13:30:00.000Z',
    effort: 4,
    stress: 4,
    targetGrade: '85+',
  }),
  seedReview({
    id: 'rev-cs341-2',
    courseId: 'cs-341',
    term: 'Winter 2025',
    professor: 'Prof. Laila Haddad (Demo)',
    alias: '3B CS Student',
    difficulty: 5,
    hours: 14,
    recommended: false,
    usefulness: 3,
    overall:
      'Heavy but fair. Three assignments landed in the same fortnight as the midterm, which made that stretch brutal.',
    worked:
      'Lecture recordings and annotated slides were posted the same day, which helped when a proof step was missed live.',
    challenging:
      'Amortized analysis and flow networks were taught quickly and then tested in detail.',
    advice:
      'Start each assignment the day it drops; the last question always takes longer than the first three combined.',
    methods: ['practice_problems', 'study_groups'],
    helpful: ['study_groups'],
    votes: 11,
    created: '2025-04-28T08:55:00.000Z',
    effort: 5,
    stress: 5,
    targetGrade: '80-84',
  }),
  seedReview({
    id: 'rev-cs341-3',
    courseId: 'cs-341',
    term: 'Fall 2024',
    professor: 'Prof. Samuel Achebe (Demo)',
    alias: '4A CS Student',
    difficulty: 4,
    hours: 11,
    recommended: true,
    overall:
      'Consistent weekly work beats cramming here. The final was almost exactly the difficulty of the practice set.',
    worked:
      'Practice finals from previous years were posted with solutions, and the tutorial covered the trickiest reduction.',
    challenging:
      'Getting full marks on correctness arguments required precise wording.',
    advice:
      'Keep a one-page list of standard reductions and the exact transformation used for each.',
    methods: ['past_exams', 'practice_problems'],
    helpful: ['past_exams'],
    votes: 14,
    created: '2024-12-20T16:45:00.000Z',
    effort: 4,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs343-1',
    courseId: 'cs-343',
    term: 'Fall 2025',
    professor: 'Prof. Miriam Osei (Demo)',
    ta: 'Rafael Duarte (Demo TA)',
    alias: '4A CS Student',
    difficulty: 4,
    hours: 13,
    recommended: true,
    overall:
      'Threads, locks and message passing taught through projects rather than exams. Debugging races is the whole course.',
    worked:
      'Assignment checkpoints were graded early, so a broken design was caught before the deadline.',
    challenging:
      'Non-deterministic bugs can take hours to reproduce without a good logging strategy.',
    advice:
      'Log every lock acquisition with a thread id from the first assignment; you will need it later.',
    methods: ['project_based', 'practice_problems'],
    helpful: ['project_based'],
    votes: 10,
    created: '2025-12-15T11:25:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-cs343-2',
    courseId: 'cs-343',
    term: 'Winter 2025',
    professor: 'Prof. Miriam Osei (Demo)',
    alias: '4B CS Student',
    difficulty: 5,
    hours: 15,
    recommended: false,
    usefulness: 3,
    overall:
      'Excellent material, but the projects are long and the term has three of them back to back.',
    worked:
      'The professor held extra office hours the week before each project deadline.',
    challenging:
      'Deadlock detection and lock-ordering proofs were the hardest questions of the degree so far.',
    advice:
      'Take it in a term where you can afford two long project weeks, not alongside three other CS courses.',
    methods: ['project_based', 'textbook_reading'],
    helpful: ['project_based'],
    votes: 7,
    created: '2025-04-29T14:10:00.000Z',
    effort: 5,
    stress: 5,
  }),
  seedReview({
    id: 'rev-cs360-1',
    courseId: 'cs-360',
    term: 'Fall 2025',
    professor: 'Prof. Noah Bergstrom (Demo)',
    alias: '3A CS / Math Student',
    difficulty: 3,
    hours: 10,
    recommended: true,
    overall:
      'Proofs about machines and languages, with almost no programming. If you liked MATH 135, this is a comfortable 300-level.',
    worked:
      'Weekly problem sets were short and matched the lecture notes word for word.',
    challenging:
      'Pumping-lemma arguments need careful case analysis and precise notation.',
    advice:
      'Redo every proof from lecture in your own words the same evening before attempting the problem set.',
    methods: ['practice_problems', 'textbook_reading'],
    helpful: ['practice_problems'],
    votes: 13,
    created: '2025-12-18T12:00:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs360-2',
    courseId: 'cs-360',
    term: 'Fall 2024',
    professor: 'Prof. Noah Bergstrom (Demo)',
    alias: '3B CS Student',
    difficulty: 4,
    hours: 12,
    recommended: true,
    overall:
      'A theory course that rewards writing, not coding. Undecidability was the hardest week of the term.',
    worked:
      'The professor walked through one full reduction proof per lecture instead of skipping steps.',
    challenging:
      'The final had a reduction question unlike anything in the problem sets.',
    advice:
      'Keep a proof template for reductions and practise with the older midterms posted online.',
    methods: ['past_exams', 'practice_problems', 'study_groups'],
    helpful: ['past_exams'],
    votes: 8,
    created: '2024-12-21T09:15:00.000Z',
    effort: 4,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs350-1',
    courseId: 'cs-350',
    term: 'Fall 2025',
    professor: 'Prof. Viktor Hale (Demo)',
    alias: '3B CS Student',
    difficulty: 5,
    hours: 14,
    recommended: false,
    usefulness: 3,
    overall:
      'The most time-consuming 300-level CS course in my term. Three large assignments plus a week of reading each.',
    worked:
      'Skeleton code and a working test harness meant the first assignment was approachable.',
    challenging:
      'Synchronization bugs in the second assignment took a full week to isolate.',
    advice:
      'Read the assignment spec twice, and keep a separate branch for each debugging attempt.',
    methods: ['project_based', 'textbook_reading'],
    helpful: ['project_based'],
    votes: 19,
    created: '2025-12-20T18:40:00.000Z',
    effort: 5,
    stress: 5,
    targetGrade: '70-79',
  }),
  seedReview({
    id: 'rev-cs350-2',
    courseId: 'cs-350',
    term: 'Winter 2025',
    professor: 'Prof. Viktor Hale (Demo)',
    ta: 'Sana Qureshi (Demo TA)',
    alias: '4A CS Student',
    difficulty: 4,
    hours: 12,
    recommended: true,
    overall:
      'Demanding in a good way: after this, you understand what your laptop is actually doing.',
    worked:
      'TA Sana held extra lab hours before each deadline and explained the test harness line by line.',
    challenging:
      'Virtual memory and page replacement accounting questions were easy to get off by one.',
    advice:
      'Draw the memory map from the previous assignment on paper before you start the next one.',
    methods: ['project_based', 'tutorial_sessions'],
    helpful: ['tutorial_sessions', 'project_based'],
    votes: 12,
    created: '2025-04-27T10:30:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-cs370-1',
    courseId: 'cs-370',
    term: 'Fall 2025',
    professor: 'Prof. Elena Marsh (Demo)',
    alias: '3A CS Student',
    difficulty: 3,
    hours: 9,
    recommended: true,
    overall:
      'Numerical methods with short coding assignments in Python. The maths is gentle if you finished MATH 237.',
    worked:
      'Each technique was introduced with a demo notebook you could run before writing your own.',
    challenging:
      'Stability and conditioning questions needed more care than the assignments suggested.',
    advice:
      'Compare your implementation against the library function on a toy example before submitting.',
    methods: ['project_based', 'practice_problems'],
    helpful: ['project_based'],
    votes: 9,
    created: '2025-12-14T13:05:00.000Z',
    effort: 3,
    stress: 2,
  }),
  seedReview({
    id: 'rev-cs370-2',
    courseId: 'cs-370',
    term: 'Winter 2025',
    professor: 'Prof. Elena Marsh (Demo)',
    alias: '3B Math Student',
    difficulty: 3,
    hours: 11,
    recommended: true,
    overall:
      'A bridge course between maths and code. Intermediate level workload with no exams, only assignments and a project.',
    worked:
      'Assignments were graded with a clear error breakdown, so a wrong answer still showed where the method failed.',
    challenging:
      'Eigenvalue iterations and interpolation error bounds were the densest units.',
    advice:
      'Keep the error formulas on one page; they are reused in almost every later assignment.',
    methods: ['practice_problems', 'textbook_reading'],
    helpful: ['practice_problems'],
    votes: 6,
    created: '2025-04-24T15:50:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs480-1',
    courseId: 'cs-480',
    term: 'Fall 2025',
    professor: 'Prof. Priyanka Raman (Demo)',
    ta: 'Tomas Lindgren (Demo TA)',
    alias: '4A CS / Stat Student',
    difficulty: 4,
    hours: 11,
    recommended: true,
    usefulness: 5,
    overall:
      'A broad tour of machine learning with assignments in Python. Grading is project-heavy: four assignments and a final project, no closed-book exam.',
    worked:
      'Assignments came with a reference notebook and an autograder, so correctness and report quality were both clear targets.',
    challenging:
      'The kernel-methods and Gaussian-process lectures move fast and assume comfort with linear algebra.',
    advice:
      'Write the report as you build each experiment; the final project is graded mostly on how you explain results.',
    methods: ['project_based', 'practice_problems', 'textbook_reading'],
    helpful: ['project_based', 'practice_problems'],
    votes: 30,
    created: '2025-12-22T16:20:00.000Z',
    effort: 4,
    stress: 3,
    targetGrade: '85+',
  }),
  seedReview({
    id: 'rev-cs480-2',
    courseId: 'cs-480',
    term: 'Winter 2025',
    professor: 'Prof. Daniel Oyelaran (Demo)',
    alias: '4B CS Student',
    difficulty: 4,
    hours: 10,
    recommended: true,
    usefulness: 5,
    overall:
      'The clearest introduction to ML I have taken. Even the deep learning weeks stayed grounded in the earlier derivations.',
    worked:
      'Weekly office hours were run as a Q&A on the current assignment rather than open questions, which kept everyone moving.',
    challenging:
      'Regularization derivations and cross-validation bookkeeping were easy places to lose marks.',
    advice:
      'Implement each method once from scratch before using the library version; the exam-free project expects that understanding.',
    methods: ['project_based', 'lecture_attendance', 'practice_problems'],
    helpful: ['project_based'],
    votes: 17,
    created: '2025-04-30T11:45:00.000Z',
    effort: 4,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs480-3',
    courseId: 'cs-480',
    term: 'Fall 2024',
    professor: 'Prof. Priyanka Raman (Demo)',
    alias: '4A CS Student',
    difficulty: 4,
    hours: 13,
    recommended: false,
    usefulness: 3,
    overall:
      'Great content, but the statistics assumed is much higher than the calendar suggests, and I spent most of the term catching up.',
    worked:
      'Lecture notes were complete and posted before class, which made reviewing possible without recording lectures.',
    challenging:
      'Maximum-likelihood and Bayesian derivations went well beyond the prerequisite courses.',
    advice:
      'Review STAT 230 material in the first two weeks, especially expectations and conditional probability.',
    methods: ['textbook_reading', 'practice_problems'],
    helpful: ['textbook_reading'],
    votes: 12,
    created: '2024-12-23T10:00:00.000Z',
    effort: 5,
    stress: 4,
    targetGrade: '70-79',
  }),
  seedReview({
    id: 'rev-cs485-1',
    courseId: 'cs-485',
    term: 'Fall 2025',
    professor: 'Prof. Yuki Tanabe (Demo)',
    alias: '4B CS / Math Student',
    difficulty: 5,
    hours: 12,
    recommended: false,
    usefulness: 3,
    overall:
      'The theoretical sibling of CS 480: generalization bounds and statistical learning theory, with weekly proof assignments.',
    worked:
      'The professor tied every bound back to a concrete experiment from CS 480.',
    challenging:
      'Concentration inequalities and Rademacher complexity are hard to learn from slides alone.',
    advice:
      'Take it only after CS 341 and a proof-based stats course; otherwise the first month is overwhelming.',
    methods: ['textbook_reading', 'practice_problems'],
    helpful: ['textbook_reading'],
    votes: 8,
    created: '2025-12-21T14:35:00.000Z',
    effort: 5,
    stress: 5,
  }),
  seedReview({
    id: 'rev-cs485-2',
    courseId: 'cs-485',
    term: 'Winter 2025',
    professor: 'Prof. Yuki Tanabe (Demo)',
    ta: 'Hugo Mercier (Demo TA)',
    alias: '4A CS Student',
    difficulty: 4,
    hours: 11,
    recommended: true,
    overall:
      'Rewarding if you want the why behind ML results. The workload is steady rather than spiky.',
    worked:
      'TA Hugo walked through the proofs from the previous week in every tutorial, slowly and with examples.',
    challenging:
      'The final project required reading a recent paper and reproducing a small part of it.',
    advice:
      'Pair up for the paper reproduction; two readers catch much more of the notation.',
    methods: ['textbook_reading', 'study_groups', 'tutorial_sessions'],
    helpful: ['tutorial_sessions'],
    votes: 7,
    created: '2025-04-26T09:20:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-cs486-1',
    courseId: 'cs-486',
    term: 'Fall 2025',
    professor: 'Prof. Amara Diallo (Demo)',
    alias: '4A CS Student',
    difficulty: 3,
    hours: 10,
    recommended: true,
    usefulness: 5,
    overall:
      'Search, logic and probabilistic reasoning, taught with four programming assignments. Comfortable if you already finished CS 341.',
    worked:
      'Assignment specs were unusually precise, with worked examples for the expected output format.',
    challenging:
      'The Bayesian network assignment needed careful probability tables, and small errors were hard to trace.',
    advice:
      'Write a tiny test for each inference step instead of running the full network every time.',
    methods: ['project_based', 'practice_problems'],
    helpful: ['project_based'],
    votes: 22,
    created: '2025-12-17T17:00:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs486-2',
    courseId: 'cs-486',
    term: 'Winter 2025',
    professor: 'Prof. Amara Diallo (Demo)',
    alias: '4B CS Student',
    difficulty: 4,
    hours: 12,
    recommended: true,
    overall:
      'A well-organised AI course with a fair final. The last assignment on reinforcement learning is the biggest time sink.',
    worked:
      'Past finals were posted with marking notes, and the midterm matched their style closely.',
    challenging:
      'Search heuristics questions required proving admissibility, not just running the algorithm.',
    advice:
      'Budget two weeks for the reinforcement learning assignment; the tuning takes longer than the coding.',
    methods: ['past_exams', 'project_based'],
    helpful: ['past_exams'],
    votes: 9,
    created: '2025-04-25T12:15:00.000Z',
    effort: 4,
    stress: 3,
  }),
  seedReview({
    id: 'rev-cs486-3',
    courseId: 'cs-486',
    term: 'Fall 2024',
    professor: 'Prof. Leo Fontaine (Demo)',
    alias: '4A CS Student',
    difficulty: 3,
    hours: 9,
    recommended: true,
    overall:
      'The most fun CS course of my term. Lectures are essentially worked examples of agents solving puzzles.',
    worked:
      'Live demos of each search algorithm made the trade-offs obvious before the assignment.',
    challenging:
      'Propositional logic resolution proofs were the one dry unit.',
    advice:
      'Keep the lecture demo code; adapting it for the assignments saves hours.',
    methods: ['project_based', 'lecture_attendance'],
    helpful: ['project_based'],
    votes: 11,
    created: '2024-12-18T15:35:00.000Z',
    effort: 3,
    stress: 2,
  }),
  seedReview({
    id: 'rev-psych101-1',
    courseId: 'psych-101',
    term: 'Fall 2025',
    professor: 'Dr. Helen Whitmore (Demo)',
    alias: '1A Science Student',
    difficulty: 2,
    hours: 4,
    recommended: true,
    usefulness: 5,
    overall:
      'The classic bird course: online multiple-choice quizzes, two midterms and a final, no essays and no group work.',
    worked:
      'Quiz questions came straight from the lecture slides, and the lowest quiz was dropped.',
    challenging:
      'The research-methods unit has more terminology than the rest of the course combined.',
    advice:
      'Watch lectures at 1.5x and do the practice quiz the same day; the exam wording follows it closely.',
    methods: ['lecture_attendance', 'spaced_repetition'],
    helpful: ['spaced_repetition'],
    votes: 34,
    created: '2025-12-16T09:00:00.000Z',
    effort: 2,
    stress: 1,
    targetGrade: '85+',
  }),
  seedReview({
    id: 'rev-psych101-2',
    courseId: 'psych-101',
    term: 'Winter 2025',
    professor: 'Dr. Helen Whitmore (Demo)',
    alias: '2A Arts Student',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Genuinely light: about five hours a week including lectures, and everything is graded through multiple choice.',
    worked:
      'Lectures were recorded and the textbook was optional for a good grade.',
    challenging:
      'Statistics terminology in the methods lectures is the only dense part.',
    advice:
      'Do the optional practice exams before each midterm; several questions repeat almost verbatim.',
    methods: ['past_exams', 'lecture_attendance'],
    helpful: ['past_exams'],
    votes: 18,
    created: '2025-04-21T13:40:00.000Z',
    effort: 2,
    stress: 1,
  }),
  seedReview({
    id: 'rev-psych101-3',
    courseId: 'psych-101',
    term: 'Spring 2025',
    professor: 'Dr. Marcus Bell (Demo)',
    alias: '1B Health Student',
    difficulty: 2,
    hours: 6,
    recommended: true,
    overall:
      'Took it in the spring term alongside two heavy courses and it never competed for time.',
    worked:
      'Weekly quizzes kept the material fresh without a big exam week.',
    challenging:
      'Attendance-based participation marks caught a few people out.',
    advice:
      'Show up to the tutorials; participation is a free few percent.',
    methods: ['lecture_attendance', 'tutorial_sessions'],
    helpful: ['lecture_attendance'],
    votes: 9,
    created: '2025-08-14T11:10:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-econ102-1',
    courseId: 'econ-102',
    term: 'Fall 2025',
    professor: 'Dr. Nora Alverez (Demo)',
    alias: '1A Environment Student',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Macro paired with ECON 101: same structure, online quizzes, two midterms, no essays.',
    worked:
      'The professor used current policy debates to explain GDP and inflation, which made the graphs stick.',
    challenging:
      'The monetary policy unit introduces a lot of new vocabulary at once.',
    advice:
      'Draw every graph from memory once a week; the exams are mostly graph interpretation.',
    methods: ['practice_problems', 'lecture_attendance'],
    helpful: ['practice_problems'],
    votes: 15,
    created: '2025-12-15T12:30:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-econ102-2',
    courseId: 'econ-102',
    term: 'Winter 2025',
    professor: 'Dr. Peter Nkemelu (Demo)',
    alias: '2A Economics Student',
    difficulty: 3,
    hours: 6,
    recommended: true,
    overall:
      'Slightly harder than ECON 101 because the models build on each other, but still a light elective.',
    worked:
      'Weekly tutorials walked through one past exam question end to end.',
    challenging:
      'The open-economy chapter assumes comfort with exchange rates.',
    advice:
      'Keep the formula sheet from ECON 101 handy; several results carry over directly.',
    methods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpful: ['tutorial_sessions'],
    votes: 8,
    created: '2025-04-23T16:00:00.000Z',
    effort: 3,
    stress: 2,
  }),
  seedReview({
    id: 'rev-stat231-1',
    courseId: 'stat-231',
    term: 'Fall 2025',
    professor: 'Prof. Grace Liu (Demo)',
    alias: '2B Statistics Student',
    difficulty: 3,
    hours: 7,
    recommended: true,
    overall:
      'Applied statistics with a real data project instead of a final exam. A good follow-up to STAT 230.',
    worked:
      'The project used a dataset you chose yourself, and the rubric rewarded a clear limitations section.',
    challenging:
      'Choosing the right test under time pressure is harder than the arithmetic.',
    advice:
      'Write a decision tree of which test applies to which design before the midterm.',
    methods: ['project_based', 'practice_problems'],
    helpful: ['project_based'],
    votes: 12,
    created: '2025-12-19T10:45:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-stat231-2',
    courseId: 'stat-231',
    term: 'Winter 2025',
    professor: 'Prof. Omar Haddad (Demo)',
    alias: '2A Math Student',
    difficulty: 3,
    hours: 8,
    recommended: false,
    usefulness: 3,
    overall:
      'Fine course, but the project feedback arrived after the final submission window, so there was no chance to improve.',
    worked:
      'Lab sessions used R and gave a gentle introduction to the software.',
    challenging:
      'Interpreting confidence intervals in context was marked strictly.',
    advice:
      'Ask for project feedback early, even informally, before the final write-up.',
    methods: ['project_based', 'tutorial_sessions'],
    helpful: ['tutorial_sessions'],
    votes: 6,
    created: '2025-04-27T08:30:00.000Z',
    effort: 3,
    stress: 3,
  }),

  // ── uOttawa catalogue courses (two reviews each) ─────────────────────────
  seedReview({
    id: 'rev-eco1102-1',
    courseId: 'eco-1102',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Marc-André Pelletier (Demo)',
    alias: '1st Year Economics',
    difficulty: 3,
    hours: 7,
    recommended: true,
    overall:
      'The multiplier arithmetic only clicks once you draw the circular flow yourself; after that the exams are fair.',
    worked:
      'Weekly problem sets were posted with full solutions a week before each quiz.',
    challenging:
      'The final pushed a lot of chapters into two long-answer questions.',
    advice:
      'Draw the aggregate expenditure model by hand for every practice question instead of reading the solutions.',
    methods: ['practice_problems', 'lecture_attendance', 'past_exams'],
    helpful: ['practice_problems', 'past_exams'],
    votes: 9,
    created: '2025-12-18T14:10:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-eco1102-2',
    courseId: 'eco-1102',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Dr. Sofia Marchetti (Demo)',
    alias: '2nd Year Political Science',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'A gentle introduction to macro for a non-economics student; the policy discussions kept lectures interesting.',
    worked:
      'Every model was tied to a Bank of Canada announcement from that week.',
    challenging:
      'Shifting the aggregate demand curves stayed abstract until the last month.',
    advice:
      'Keep the formula sheet from ECO 1104 handy; several results carry over directly.',
    methods: ['lecture_attendance', 'textbook_reading'],
    helpful: ['lecture_attendance'],
    votes: 5,
    created: '2026-04-14T09:20:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-eco1104-1',
    courseId: 'eco-1104',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Priya Raman (Demo)',
    alias: '1st Year BCom',
    difficulty: 3,
    hours: 7,
    recommended: true,
    overall:
      'Elasticity and cost curves are basically the whole course, and the weekly quizzes make you learn them early.',
    worked:
      'Quiz feedback named the exact slide that explained a missed concept.',
    challenging:
      'Midterm 2 had three monopoly pricing questions in a row.',
    advice:
      'Redo the midterm practice set under time; the final reuses the same question styles.',
    methods: ['practice_problems', 'past_exams', 'tutorial_sessions'],
    helpful: ['past_exams'],
    votes: 11,
    created: '2025-12-20T11:05:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-eco1104-2',
    courseId: 'eco-1104',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Marc-André Pelletier (Demo)',
    alias: '2nd Year Environmental Science',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Straightforward intro micro; the applied case studies on carbon pricing were the best part.',
    worked:
      'DGD sessions worked through one past exam question per concept.',
    challenging:
      'Graph labelling loses part marks fast if you skip axis titles.',
    advice:
      'Label every axis and curve on the first pass; markers check them explicitly.',
    methods: ['tutorial_sessions', 'practice_problems'],
    helpful: ['tutorial_sessions'],
    votes: 7,
    created: '2026-01-09T16:40:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-psy1101-1',
    courseId: 'psy-1101',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Camille Ouellet (Demo)',
    alias: '1st Year Nursing',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Huge lecture hall, but the online chapter quizzes keep you honest and the exams come straight from the slides.',
    worked:
      'Each midterm blueprint listed the exact textbook sections and lecture numbers being tested.',
    challenging:
      'Two hundred slides per unit made it easy to fall behind.',
    advice:
      'Do the chapter quizzes twice: once open-book to learn, once closed-book before the midterm.',
    methods: ['spaced_repetition', 'lecture_attendance', 'practice_problems'],
    helpful: ['spaced_repetition'],
    votes: 14,
    created: '2025-12-15T10:30:00.000Z',
    effort: 2,
    stress: 3,
  }),
  seedReview({
    id: 'rev-psy1101-2',
    courseId: 'psy-1101',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Dr. Daniel Whitfield (Demo)',
    alias: '1st Year Criminology',
    difficulty: 3,
    hours: 6,
    recommended: true,
    overall:
      'More neuroscience than I expected, but the study guides were accurate and the final was fair.',
    worked:
      'Optional review sessions walked through the trickiest memory and perception questions.',
    challenging:
      'The statistics unit appeared only on the final and felt rushed.',
    advice:
      'Make flashcards for the brain structures early; they show up on both midterms.',
    methods: ['spaced_repetition', 'textbook_reading'],
    helpful: ['spaced_repetition', 'textbook_reading'],
    votes: 8,
    created: '2026-04-11T13:15:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-hss1101-1',
    courseId: 'hss-1101',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Amara Nwosu (Demo)',
    alias: '1st Year Health Sciences',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'Genuinely one of the lighter first-year courses: two short papers, a midterm and a final built from lecture material.',
    worked:
      'Assignment rubrics were posted with the prompt, so marking held no surprises.',
    challenging:
      'The social-determinants readings were long and repetitive week to week.',
    advice:
      'Reuse the same two examples across your papers; the marker rewards depth over breadth.',
    methods: ['lecture_attendance', 'textbook_reading'],
    helpful: ['lecture_attendance'],
    votes: 12,
    created: '2025-12-12T09:00:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-hss1101-2',
    courseId: 'hss-1101',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Louis Chartrand (Demo)',
    alias: '2nd Year Sociology',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Popular elective for a reason: clear slides, guest speakers from public health, and a fair final.',
    worked:
      'Guest lectures connected each determinant to a real Ottawa program.',
    challenging:
      'The final asked for specific Canadian policy examples that lectures mentioned only once.',
    advice:
      'Note every policy example a guest speaker mentions; they turn up as short-answer prompts.',
    methods: ['lecture_attendance', 'study_groups'],
    helpful: ['study_groups'],
    votes: 6,
    created: '2026-01-06T15:45:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-adm1100-1',
    courseId: 'adm-1100',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Renée Bouchard (Demo)',
    alias: '1st Year BCom',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'Most of the grade comes from the team project, so pick your group early and the course stays light.',
    worked:
      'The team project used a real Ottawa small business whose owner answered questions directly.',
    challenging:
      'Free riders are only handled through peer evaluation at the end.',
    advice:
      'Set a written group charter in week two and log every meeting; the peer form asks for dates.',
    methods: ['project_based', 'study_groups'],
    helpful: ['project_based'],
    votes: 10,
    created: '2025-12-11T12:25:00.000Z',
    effort: 2,
    stress: 3,
  }),
  seedReview({
    id: 'rev-adm1100-2',
    courseId: 'adm-1100',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Prof. Mark Sullivan (Demo)',
    alias: '1st Year Political Science',
    difficulty: 2,
    hours: 5,
    recommended: false,
    usefulness: 3,
    overall:
      'Fine content, but the weekly discussion posts felt like busywork and the final repeated the textbook.',
    worked:
      'Lectures used short case studies instead of straight definitions.',
    challenging:
      'Grading on discussion posts was inconsistent between TAs.',
    advice:
      'Keep posts short and cite the textbook section you are responding to.',
    methods: ['textbook_reading', 'lecture_attendance'],
    helpful: ['textbook_reading'],
    votes: 4,
    created: '2026-04-16T17:30:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-adm4326-1',
    courseId: 'adm-4326',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Nadia Haddad (Demo)',
    alias: '4th Year Marketing',
    difficulty: 3,
    hours: 6,
    recommended: true,
    overall:
      'The most useful Telfer elective I took: you build a real campaign in the tools instead of memorizing frameworks.',
    worked:
      'Every class had a hands-on lab with an analytics or advertising platform, licences provided.',
    challenging:
      'Group deliverables stacked up in the last three weeks before the report.',
    advice:
      'Start the campaign project in week three; the data needs a month to say anything.',
    methods: ['project_based', 'study_groups'],
    helpful: ['project_based'],
    votes: 18,
    created: '2025-12-19T18:00:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-adm4326-2',
    courseId: 'adm-4326',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Nadia Haddad (Demo)',
    alias: '4th Year BCom',
    difficulty: 3,
    hours: 7,
    recommended: true,
    usefulness: 5,
    overall:
      'Heavy but rewarding; the case presentations are marked like a client pitch and the feedback is specific.',
    worked:
      'Practitioners came in to critique two of the presentations.',
    challenging:
      'The platform documentation reading load was high in the first month.',
    advice:
      'Book a practice pitch with your group’s TA a week before presenting.',
    methods: ['project_based', 'past_exams'],
    helpful: ['project_based'],
    votes: 9,
    created: '2026-01-14T10:10:00.000Z',
    effort: 3,
    stress: 4,
  }),
  seedReview({
    id: 'rev-mus2310-1',
    courseId: 'mus-2310',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Élodie Gagnon (Demo)',
    alias: '3rd Year Biology',
    difficulty: 1,
    hours: 3,
    recommended: true,
    overall:
      'Exactly the light elective people say it is: weekly listening journals, one essay and a final drawn straight from lectures.',
    worked:
      'Every film clip was posted after class, so nobody had to memorize music from one viewing.',
    challenging:
      'The essay rewards precise musical vocabulary, not plot description.',
    advice:
      'Write the listening journals as you watch, not the night before they are due.',
    methods: ['lecture_attendance', 'project_based'],
    helpful: ['lecture_attendance'],
    votes: 16,
    created: '2025-12-10T14:35:00.000Z',
    effort: 1,
    stress: 1,
  }),
  seedReview({
    id: 'rev-mus2310-2',
    courseId: 'mus-2310',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Prof. Élodie Gagnon (Demo)',
    alias: '2nd Year Commerce',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'Light but not empty: you leave knowing why a score works, and the final is a short listening analysis.',
    worked:
      'Scenes were screened with and without score so the difference was audible.',
    challenging:
      'Two written pieces were due in the same week as midterms in other courses.',
    advice:
      'Pick a film you already know for the essay; the analysis goes much faster.',
    methods: ['lecture_attendance', 'textbook_reading'],
    helpful: ['textbook_reading'],
    votes: 7,
    created: '2026-04-09T11:50:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-cmn2152-1',
    courseId: 'cmn-2152',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Julie Fortin (Demo)',
    alias: '2nd Year Communication',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'The visual analysis exercises are the entire course, and they are genuinely fun if you like images.',
    worked:
      'Each week analysed one advertisement or film still together before the exercise went out.',
    challenging:
      'Nothing explains how the rubric separates description from analysis.',
    advice:
      'Ask in week one for an example of an A-level analysis; it changes how you write.',
    methods: ['lecture_attendance', 'practice_problems'],
    helpful: ['lecture_attendance'],
    votes: 6,
    created: '2025-12-14T16:05:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-cmn2152-2',
    courseId: 'cmn-2152',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Julie Fortin (Demo)',
    alias: '3rd Year Fine Arts',
    difficulty: 3,
    hours: 6,
    recommended: true,
    overall:
      'Comfortable pace, but the final project asks for more theory than the weekly exercises suggest.',
    worked:
      'Feedback on the first exercise was detailed enough to fix everything for the next one.',
    challenging:
      'Reading semiotics papers without the vocabulary took extra hours every week.',
    advice:
      'Keep a glossary of semiotic terms and add the course example next to each.',
    methods: ['textbook_reading', 'project_based'],
    helpful: ['textbook_reading'],
    votes: 5,
    created: '2026-01-12T09:40:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-mat1341-1',
    courseId: 'mat-1341',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Simon Leclerc (Demo)',
    alias: '1st Year Mathematics',
    difficulty: 4,
    hours: 9,
    recommended: true,
    overall:
      'Proof-heavy for a 1000-level course, but the structure is consistent: one concept a week and a DGD that solves it.',
    worked:
      'The DGD ran the same exercise type that appeared on the next assignment.',
    challenging:
      'Row-reduction by hand with fractions is where most marks disappear on midterms.',
    advice:
      'Practice matrix computations until they are automatic; the conceptual questions then have room.',
    methods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpful: ['practice_problems'],
    votes: 15,
    created: '2025-12-16T13:00:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-mat1341-2',
    courseId: 'mat-1341',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Dr. Ana Kovač (Demo)',
    alias: '1st Year Physics',
    difficulty: 3,
    hours: 8,
    recommended: false,
    usefulness: 3,
    overall:
      'Well taught but fast; the second midterm covered four chapters in one week of lectures.',
    worked:
      'Worked solutions were posted within a day of every assignment deadline.',
    challenging:
      'Abstract vector-space proofs were graded strictly on justification steps.',
    advice:
      'Write the justification before the calculation in every proof question; partial marks live there.',
    methods: ['practice_problems', 'textbook_reading'],
    helpful: ['practice_problems', 'textbook_reading'],
    votes: 8,
    created: '2026-04-15T12:20:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-chm1311-1',
    courseId: 'chm-1311',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Dr. Hélène Côté (Demo)',
    alias: '1st Year Biochemistry',
    difficulty: 4,
    hours: 9,
    recommended: true,
    overall:
      'The lab is what makes this course heavy: a report every two weeks on top of weekly problem sets.',
    worked:
      'Pre-lab videos demonstrated each technique before the bench session.',
    challenging:
      'Thermodynamics problems combine three chapters and appear as one long final question.',
    advice:
      'Do the lab calculations before leaving the lab; the report then takes half as long.',
    methods: ['practice_problems', 'tutorial_sessions', 'textbook_reading'],
    helpful: ['practice_problems'],
    votes: 17,
    created: '2025-12-13T10:15:00.000Z',
    effort: 4,
    stress: 4,
  }),
  seedReview({
    id: 'rev-chm1311-2',
    courseId: 'chm-1311',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Dr. Peter Anyang (Demo)',
    alias: '1st Year Biomedical Science',
    difficulty: 3,
    hours: 8,
    recommended: true,
    overall:
      'A standard first-year chemistry course with fair exams if you keep up with the DGD problems.',
    worked:
      'DGD worksheets came with answers, which made the exam style predictable.',
    challenging:
      'Buffer and titration calculations lose marks on significant figures.',
    advice:
      'Track units and sig figs through every stoichiometry problem from week one.',
    methods: ['practice_problems', 'tutorial_sessions', 'past_exams'],
    helpful: ['tutorial_sessions', 'past_exams'],
    votes: 11,
    created: '2026-04-10T08:55:00.000Z',
    effort: 3,
    stress: 3,
  }),
  seedReview({
    id: 'rev-phi2394-1',
    courseId: 'phi-2394',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Étienne Roy (Demo)',
    alias: '2nd Year Engineering',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'A reading-and-essay course that made ethics of technology feel concrete; the final was two essays, no multiple choice.',
    worked:
      'Every reading had three discussion questions posted in advance.',
    challenging:
      'The essay rubric is vague about how much summary is acceptable.',
    advice:
      'Email the professor a one-paragraph outline before each essay; feedback comes back quickly.',
    methods: ['textbook_reading', 'lecture_attendance'],
    helpful: ['lecture_attendance'],
    votes: 6,
    created: '2025-12-18T09:05:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-phi2394-2',
    courseId: 'phi-2394',
    university: 'uottawa',
    term: 'Winter 2026',
    professor: 'Prof. Sara Lindqvist (Demo)',
    alias: '3rd Year Computer Science',
    difficulty: 2,
    hours: 5,
    recommended: true,
    overall:
      'Good elective if you like arguing: participation matters and the readings are short.',
    worked:
      'Debates in the last twenty minutes of each lecture explained the reading better than the lecture did.',
    challenging:
      'Two readings a week with no guidance on which one to prioritize.',
    advice:
      'Read the conclusion first; only one reading per week is actually examined.',
    methods: ['textbook_reading', 'study_groups'],
    helpful: ['textbook_reading'],
    votes: 5,
    created: '2026-04-17T14:45:00.000Z',
    effort: 2,
    stress: 2,
  }),
  seedReview({
    id: 'rev-eng1120-1',
    courseId: 'eng-1120',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Meera Nair (Demo)',
    alias: '1st Year Psychology',
    difficulty: 2,
    hours: 4,
    recommended: true,
    overall:
      'Frequent short essays, but the feedback loop is fast and a final portfolio replaces the exam.',
    worked:
      'Each assignment came back with a model paragraph showing what an A looked like.',
    challenging:
      'Citation formatting was marked strictly from the first paper onward.',
    advice:
      'Book one writing-centre appointment before the second essay; it is worth a full letter grade.',
    methods: ['project_based', 'lecture_attendance'],
    helpful: ['project_based'],
    votes: 9,
    created: '2025-12-12T15:20:00.000Z',
    effort: 2,
    stress: 3,
  }),
  seedReview({
    id: 'rev-eng1120-2',
    courseId: 'eng-1120',
    university: 'uottawa',
    term: 'Fall 2025',
    professor: 'Prof. Thomas Bell (Demo)',
    alias: '1st Year History',
    difficulty: 3,
    hours: 5,
    recommended: false,
    usefulness: 3,
    overall:
      'Clear course, but five written assignments in twelve weeks left no room for other courses.',
    worked:
      'Peer review sessions used a checklist instead of vague comments.',
    challenging:
      'Grammar and structure deductions compound across essays.',
    advice:
      'Write one paragraph a day instead of a full draft the night before.',
    methods: ['project_based', 'textbook_reading'],
    helpful: ['textbook_reading'],
    votes: 7,
    created: '2026-01-08T17:10:00.000Z',
    effort: 3,
    stress: 3,
  }),
];

type DemoReviewSignals = Pick<Review, 'mentalEffort' | 'stress' | 'targetGrade'>;

/**
 * Demo self-reports for the three workload axes and the grade each student was
 * working toward. Reviews without an entry fall back to difficulty as a stand-in
 * effort/stress reading (labelled as an estimate in the UI) and are excluded from
 * the effort-to-success bands rather than given an invented target grade.
 */
const DEMO_REVIEW_SIGNALS: Record<string, Partial<DemoReviewSignals>> = {
  'rev-math137-1': { mentalEffort: 4, stress: 4, targetGrade: '85+' },
  'rev-math137-2': { mentalEffort: 5, stress: 5, targetGrade: '80-84' },
  'rev-math137-3': { mentalEffort: 4, stress: 3, targetGrade: '85+' },
  'rev-math137-4': { mentalEffort: 3, stress: 3, targetGrade: '70-79' },
  'rev-math137-5': { mentalEffort: 4, stress: 4, targetGrade: '80-84' },
  'rev-math137-6': { mentalEffort: 5, stress: 4, targetGrade: '85+' },
  'rev-math137-7': { mentalEffort: 2, stress: 2, targetGrade: '70-79' },
  'rev-math137-8': { mentalEffort: 4, stress: 4 },
};

/**
 * Applies the demo workload/grade signals to a review, including reviews restored
 * from an older persisted demo store that predates these fields.
 */
export function withDemoReviewSignals(review: Review): Review {
  const signals = DEMO_REVIEW_SIGNALS[review.id];
  if (!signals) return review;
  const targetGrade = review.targetGrade ?? signals.targetGrade;
  return {
    ...review,
    mentalEffort: review.mentalEffort ?? signals.mentalEffort ?? review.difficulty,
    stress: review.stress ?? signals.stress ?? review.difficulty,
    ...(targetGrade ? { targetGrade } : {}),
  };
}

export const DEMO_REVIEWS: Review[] = DEMO_REVIEW_SEED.map(withDemoReviewSignals);

export const DEMO_INSTRUCTORS: InstructorProfile[] = [
  {
    id: 'inst-math137-vance',
    courseId: 'math-137',
    name: 'Dr. Elena Vance (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 14,
    categories: [
      { category: 'Clarity of explanations', score: 4.3, responseCount: 14 },
      { category: 'Organization', score: 4.6, responseCount: 14 },
      { category: 'Approachability', score: 4.1, responseCount: 14 },
      { category: 'Quality of feedback', score: 3.7, responseCount: 14 },
      { category: 'Teaching effectiveness', score: 4.2, responseCount: 14 },
    ],
    constructiveSummary:
      'Students praise structured theorem-driven lectures and clear course pacing; several requested more explicit in-class walkthroughs of inequality bounding before Midterm 1.',
    isDemoProfile: true,
  },
  {
    id: 'inst-math137-lin',
    courseId: 'math-137',
    name: 'Maya Lin (Demo TA)',
    role: 'ta',
    term: 'Fall 2025',
    responseCount: 11,
    categories: [
      { category: 'Tutorial helpfulness', score: 4.7, responseCount: 11 },
      { category: 'Clarity of explanations', score: 4.6, responseCount: 11 },
      { category: 'Office-hour support', score: 4.5, responseCount: 11 },
      { category: 'Responsiveness', score: 4.4, responseCount: 11 },
      { category: 'Assignment/lab guidance', score: 4.6, responseCount: 11 },
    ],
    constructiveSummary:
      'Recognized for breaking down marking rubrics and showing common epsilon-delta pitfalls step-by-step during weekly tutorials.',
    isDemoProfile: true,
  },
  {
    id: 'inst-math137-reid',
    courseId: 'math-137',
    name: 'Prof. Julian Reid (Demo)',
    role: 'professor',
    term: 'Winter 2025',
    responseCount: 9,
    categories: [
      { category: 'Clarity of explanations', score: 4.4, responseCount: 9 },
      { category: 'Organization', score: 4.2, responseCount: 9 },
      { category: 'Approachability', score: 4.5, responseCount: 9 },
      { category: 'Quality of feedback', score: 4.1, responseCount: 9 },
      { category: 'Teaching effectiveness', score: 4.3, responseCount: 9 },
    ],
    constructiveSummary:
      'Valued for approachable Q&A during lectures and connecting geometric intuition to formal proofs.',
    isDemoProfile: true,
  },
  {
    id: 'inst-cs135-chen',
    courseId: 'cs-135',
    name: 'Prof. Marcus Chen (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 12,
    categories: [
      { category: 'Clarity of explanations', score: 4.5, responseCount: 12 },
      { category: 'Organization', score: 4.7, responseCount: 12 },
      { category: 'Approachability', score: 4.3, responseCount: 12 },
      { category: 'Quality of feedback', score: 3.9, responseCount: 12 },
      { category: 'Teaching effectiveness', score: 4.6, responseCount: 12 },
    ],
    constructiveSummary:
      'Live DrRacket demonstrations in class were rated highly; students asked for clearer checklists around design-recipe style deductions early in the term.',
    isDemoProfile: true,
  },
  {
    id: 'inst-cs135-nair',
    courseId: 'cs-135',
    name: 'Priya Nair (Demo TA)',
    role: 'ta',
    term: 'Fall 2025',
    responseCount: 10,
    categories: [
      { category: 'Tutorial helpfulness', score: 4.8, responseCount: 10 },
      { category: 'Clarity of explanations', score: 4.7, responseCount: 10 },
      { category: 'Office-hour support', score: 4.8, responseCount: 10 },
      { category: 'Responsiveness', score: 4.6, responseCount: 10 },
      { category: 'Assignment/lab guidance', score: 4.7, responseCount: 10 },
    ],
    constructiveSummary:
      'Praised for guiding students through recursion templates using Socratic hints rather than giving away answers.',
    isDemoProfile: true,
  },
  {
    id: 'inst-econ101-alverez',
    courseId: 'econ-101',
    name: 'Dr. Nora Alverez (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 11,
    categories: [
      { category: 'Clarity of explanations', score: 4.6, responseCount: 11 },
      { category: 'Organization', score: 4.5, responseCount: 11 },
      { category: 'Approachability', score: 4.4, responseCount: 11 },
      { category: 'Quality of feedback', score: 4.2, responseCount: 11 },
      { category: 'Teaching effectiveness', score: 4.5, responseCount: 11 },
    ],
    constructiveSummary:
      'Known for connecting microeconomic graphs to current policy case studies and keeping quiz expectations transparent.',
    isDemoProfile: true,
  },
  {
    id: 'inst-mat1320-beaumont',
    courseId: 'mat-1320',
    name: 'Dr. Claire Beaumont (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 13,
    categories: [
      { category: 'Clarity of explanations', score: 4.7, responseCount: 13 },
      { category: 'Organization', score: 4.8, responseCount: 13 },
      { category: 'Approachability', score: 4.5, responseCount: 13 },
      { category: 'Quality of feedback', score: 4.3, responseCount: 13 },
      { category: 'Teaching effectiveness', score: 4.7, responseCount: 13 },
    ],
    constructiveSummary:
      'Students highlighted prompt posting of annotated lecture PDFs and well-calibrated midterm review packages.',
    isDemoProfile: true,
  },
  {
    id: 'inst-mat1320-tremblay',
    courseId: 'mat-1320',
    name: 'Lucas Tremblay (Demo TA)',
    role: 'ta',
    term: 'Fall 2025',
    responseCount: 10,
    categories: [
      { category: 'Tutorial helpfulness', score: 4.8, responseCount: 10 },
      { category: 'Clarity of explanations', score: 4.7, responseCount: 10 },
      { category: 'Office-hour support', score: 4.6, responseCount: 10 },
      { category: 'Responsiveness', score: 4.5, responseCount: 10 },
      { category: 'Assignment/lab guidance', score: 4.7, responseCount: 10 },
    ],
    constructiveSummary:
      'DGD sessions rated essential for mastering related-rates and integration substitution patterns.',
    isDemoProfile: true,
  },
  {
    id: 'inst-gng1105-kowalski',
    courseId: 'gng-1105',
    name: 'Dr. Robert Kowalski (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 11,
    categories: [
      { category: 'Clarity of explanations', score: 4.1, responseCount: 11 },
      { category: 'Organization', score: 4.4, responseCount: 11 },
      { category: 'Approachability', score: 4.0, responseCount: 11 },
      { category: 'Quality of feedback', score: 3.8, responseCount: 11 },
      { category: 'Teaching effectiveness', score: 4.2, responseCount: 11 },
    ],
    constructiveSummary:
      'Rigorous expectations on Free Body Diagram precision; students recommended adding a worked sample of partial-credit grading early in the term.',
    isDemoProfile: true,
  },
  {
    id: 'inst-gng1105-mansour',
    courseId: 'gng-1105',
    name: 'Amira Mansour (Demo TA)',
    role: 'ta',
    term: 'Fall 2025',
    responseCount: 9,
    categories: [
      { category: 'Tutorial helpfulness', score: 4.8, responseCount: 9 },
      { category: 'Clarity of explanations', score: 4.7, responseCount: 9 },
      { category: 'Office-hour support', score: 4.7, responseCount: 9 },
      { category: 'Responsiveness', score: 4.6, responseCount: 9 },
      { category: 'Assignment/lab guidance', score: 4.8, responseCount: 9 },
    ],
    constructiveSummary:
      'Consistently praised for 3D moment equilibrium step-by-step diagrams during engineering DGD sessions.',
    isDemoProfile: true,
  },
  {
    id: 'inst-cs240-park',
    courseId: 'cs-240',
    name: 'Dr. Ethan Park (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 8,
    categories: [
      { category: 'Clarity of explanations', score: 4.5, responseCount: 8 },
      { category: 'Organization', score: 4.6, responseCount: 8 },
      { category: 'Approachability', score: 4.4, responseCount: 8 },
      { category: 'Quality of feedback', score: 4.2, responseCount: 8 },
      { category: 'Teaching effectiveness', score: 4.6, responseCount: 8 },
    ],
    constructiveSummary:
      'Clear bridging between asymptotic proofs and real C++ memory layouts.',
    isDemoProfile: true,
  },
  {
    id: 'inst-csi2110-moreau',
    courseId: 'csi-2110',
    name: 'Dr. Celine Moreau (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 7,
    categories: [
      { category: 'Clarity of explanations', score: 4.6, responseCount: 7 },
      { category: 'Organization', score: 4.5, responseCount: 7 },
      { category: 'Approachability', score: 4.7, responseCount: 7 },
      { category: 'Quality of feedback', score: 4.4, responseCount: 7 },
      { category: 'Teaching effectiveness', score: 4.6, responseCount: 7 },
    ],
    constructiveSummary:
      'Appreciated for interactive graph algorithm visualizations and approachable office hours.',
    isDemoProfile: true,
  },
  {
    id: 'inst-stat230-liu',
    courseId: 'stat-230',
    name: 'Prof. Grace Liu (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    responseCount: 8,
    categories: [
      { category: 'Clarity of explanations', score: 4.5, responseCount: 8 },
      { category: 'Organization', score: 4.7, responseCount: 8 },
      { category: 'Approachability', score: 4.4, responseCount: 8 },
      { category: 'Quality of feedback', score: 4.3, responseCount: 8 },
      { category: 'Teaching effectiveness', score: 4.6, responseCount: 8 },
    ],
    constructiveSummary:
      'Strong alignment between course workbook problems and exam expectations.',
    isDemoProfile: true,
  },
];

export const DEMO_FACULTY_RESPONSES: FacultyResponse[] = [
  {
    id: 'fac-resp-1',
    courseId: 'math-137',
    instructorName: 'Dr. Elena Vance (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    themeAddressed: 'Inequality bounding & midterm proof expectations (aggregated theme)',
    responseText:
      'Thank you for the constructive aggregate feedback on Weeks 3–5 proof transitions. For upcoming terms, our teaching team has added a dedicated 45-minute inequality-bounding workshop in Week 3 tutorials, where TAs work through two exam-level proofs step by step. We have also published an annotated partial-credit rubric before Midterm 1 that shows exactly where marks are awarded for setup, justification, and final conclusion, so students can calibrate proof rigor early instead of guessing.',
    status: 'changed',
    updatedAt: '2026-01-15T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'fac-resp-3',
    courseId: 'math-137',
    instructorName: 'Dr. Elena Vance (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    themeAddressed: 'Proof difficulty jump in Weeks 3–5 (aggregated theme)',
    responseText:
      'Students told us that the switch from computation-heavy problems to formal proofs felt sudden, and that proof problem sets in Weeks 3–5 arrived in the same week as the midterm review. We have logged this as a course-level priority and are reviewing the Week 3–5 pacing with the tutorial team this term. No schedule or marking change has been made yet, and we will post an update here once the review is complete.',
    status: 'heard',
    updatedAt: '2026-01-14T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'fac-resp-4',
    courseId: 'math-137',
    instructorName: 'Dr. Elena Vance (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    themeAddressed: 'Why Midterm 1 cannot move earlier or become optional (calendar constraint)',
    responseText:
      'We cannot move Midterm 1 earlier than Week 5 or make it optional. MATH 137 is a prerequisite for MATH 138 and a required course in several engineering plans, so the Faculty of Mathematics calendar fixes the assessment window for all first-year math courses. An earlier date would also collide with the CS 135 assignment deadline that most of this class shares. Instead, we kept the same date and moved the review session one week earlier, so students still get feedback before the exam.',
    status: 'explained',
    updatedAt: '2026-01-13T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'fac-resp-2',
    courseId: 'cs-135',
    instructorName: 'Prof. Marcus Chen (Demo)',
    role: 'professor',
    term: 'Fall 2025',
    themeAddressed: 'Design recipe style expectations on early assignments',
    responseText:
      'We reviewed aggregated comments regarding early style deductions. Starting next offering, Assignment 0 and Assignment 1 will include an interactive pre-submission design-recipe checklist in the lab environment before marks are finalized.',
    status: 'heard',
    updatedAt: '2026-01-12T15:30:00.000Z',
    isDemo: true,
  },
];

export const DEMO_PULSE_RESPONSES: PulseResponse[] = [
  {
    id: 'pulse-math137-1',
    courseId: 'math-137',
    term: 'Fall 2025',
    week: 6,
    userId: 'demo-student-2',
    keepsWorking: 'Weekly tutorial quizzes made the marking standard obvious before the midterm.',
    notWorking: 'Problem sets landed the same week as the midterm review, so nothing got enough time.',
    oneChange: 'Spread the proof-heavy problem sets so week 6 is not doubled up.',
    createdAt: '2025-10-17T15:00:00.000Z',
  },
  {
    id: 'pulse-math137-2',
    courseId: 'math-137',
    term: 'Fall 2025',
    week: 6,
    userId: 'demo-student-3',
    keepsWorking: 'TA office hours were the reason the epsilon-delta proofs clicked.',
    notWorking: 'Lecture examples were easier than the midterm, so the difficulty jump was a surprise.',
    oneChange: 'Work one exam-level proof in lecture before the midterm.',
    createdAt: '2025-10-18T09:30:00.000Z',
  },
  {
    id: 'pulse-math137-3',
    courseId: 'math-137',
    term: 'Fall 2025',
    week: 7,
    userId: 'demo-student-4',
    keepsWorking: 'Structured lecture notes matched the textbook sections exactly.',
    notWorking: 'Assignment deadlines clustered right before the second midterm.',
    oneChange: 'Give a one-week heads up before workload spikes.',
    createdAt: '2025-10-24T11:10:00.000Z',
  },
  {
    id: 'pulse-cs135-1',
    courseId: 'cs-135',
    term: 'Fall 2025',
    week: 5,
    userId: 'demo-student-5',
    keepsWorking: 'Live design-recipe demos in lecture made the assignment style clear.',
    notWorking: 'Style deductions showed up only after marks were released.',
    oneChange: 'Publish the style checklist with assignment 1.',
    createdAt: '2025-10-10T13:45:00.000Z',
  },
  {
    id: 'pulse-cs135-2',
    courseId: 'cs-135',
    term: 'Fall 2025',
    week: 6,
    userId: 'demo-student-6',
    keepsWorking: 'Tutorial hints pushed us to find the recursion ourselves.',
    notWorking: 'Two assignments plus the midterm in the same fortnight.',
    oneChange: 'Shift one assignment deadline by a week.',
    createdAt: '2025-10-16T10:00:00.000Z',
  },
];

export const DEMO_MODERATION_REPORTS: ModerationReport[] = [
  {
    id: 'mod-1',
    reviewId: 'rev-math137-8',
    courseId: 'math-137',
    reason: 'spam',
    details: 'Appears to copy large portions of another Fall 2025 submission word-for-word.',
    createdAt: '2025-12-21T09:00:00.000Z',
    status: 'pending',
  },
];

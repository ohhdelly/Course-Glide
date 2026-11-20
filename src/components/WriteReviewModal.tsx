import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleDashed, Lock, Sparkles, X } from 'lucide-react';
import type {
  Course,
  GradeBand,
  InstructorProfile,
  Review,
  StudyMethodKey,
} from '../types/course';
import {
  GRADE_BANDS,
  GRADE_BAND_LABELS,
  STUDY_METHOD_CATALOG,
  evaluateReviewQuality,
} from '../utils/trustLens';

interface WriteReviewModalProps {
  course: Course;
  instructors: InstructorProfile[];
  /** Visible reviews already submitted for this course, used by the live linter. */
  existingReviews: Review[];
  onClose: () => void;
  onSubmit: (payload: {
    courseId: string;
    term: string;
    instructorName: string;
    taName?: string;
    authorAlias: string;
    isAnonymous: boolean;
    difficulty: 1 | 2 | 3 | 4 | 5;
    weeklyHours: number;
    mentalEffort: 1 | 2 | 3 | 4 | 5;
    stress: 1 | 2 | 3 | 4 | 5;
    targetGrade?: GradeBand;
    recommended: boolean;
    usefulness: 1 | 2 | 3 | 4 | 5;
    overallExperience: string;
    whatWorkedWell: string;
    whatWasChallenging: string;
    practicalAdvice: string;
    studyMethods: StudyMethodKey[];
  }) => Promise<void>;
}

const TERMS = ['Fall 2025', 'Winter 2025', 'Spring 2025', 'Fall 2024', 'Winter 2024'];

type FieldErrorMap = Partial<
  Record<'term' | 'instructorName' | 'weeklyHours' | 'overallExperience' | 'submit', string>
>;

const CONTROL_FOCUS_CLASS =
  'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]';

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  course,
  instructors,
  existingReviews,
  onClose,
  onSubmit,
}) => {
  const profOptions = instructors.filter((i) => i.role === 'professor').map((i) => i.name);
  const taOptions = instructors.filter((i) => i.role === 'ta').map((i) => i.name);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [term, setTerm] = useState(TERMS[0]);
  const [instructorName, setInstructorName] = useState(profOptions[0] ?? '');
  const [taName, setTaName] = useState(taOptions[0] ?? '');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorAlias, setAuthorAlias] = useState('');

  const [difficulty, setDifficulty] = useState<Review['difficulty']>(3);
  const [weeklyHours, setWeeklyHours] = useState<string>('9');
  const [mentalEffort, setMentalEffort] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [targetGrade, setTargetGrade] = useState<GradeBand | ''>('');
  const [recommended, setRecommended] = useState<boolean>(true);
  const [usefulness, setUsefulness] = useState<Review['usefulness']>(4);

  const [overallExperience, setOverallExperience] = useState('');
  const [whatWorkedWell, setWhatWorkedWell] = useState('');
  const [whatWasChallenging, setWhatWasChallenging] = useState('');
  const [practicalAdvice, setPracticalAdvice] = useState('');

  const [studyMethods, setStudyMethods] = useState<StudyMethodKey[]>(['practice_problems']);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleMethod = (key: StudyMethodKey) => {
    setStudyMethods((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const parsedHours = Number(weeklyHours);

  // Live linter: scores the draft with the exact same function the Trust Lens uses,
  // so the writing prompt and the published score can never disagree.
  const linter = useMemo(() => {
    const draft: Review = {
      id: 'draft-review',
      courseId: course.id,
      universityId: course.universityId,
      term,
      instructorName: instructorName.trim() || 'Unknown instructor',
      ...(taName.trim() ? { taName: taName.trim() } : {}),
      authorAlias: 'Draft entry',
      isAnonymous,
      verifiedEnrollment: false,
      difficulty,
      weeklyHours: Number.isFinite(parsedHours) ? parsedHours : 9,
      mentalEffort,
      stress,
      ...(targetGrade ? { targetGrade } : {}),
      recommended,
      usefulness,
      overallExperience: overallExperience || 'Not specified.',
      whatWorkedWell: whatWorkedWell || 'Not specified.',
      whatWasChallenging: whatWasChallenging || 'Not specified.',
      // Must mirror the server's stored default, otherwise a blank advice field
      // previews a lower score than the review actually receives on submit.
      practicalAdvice: practicalAdvice || 'Stay consistent with weekly coursework.',
      studyMethods,
      helpfulMethods: recommended ? studyMethods : [],
      helpfulVotes: 0,
      notHelpfulVotes: 0,
      createdAt: new Date().toISOString(),
      moderationStatus: 'visible',
      reportCount: 0,
      isDemoData: true,
    };
    return evaluateReviewQuality(draft, [...existingReviews, draft]);
  }, [
    course.id,
    course.universityId,
    term,
    instructorName,
    taName,
    isAnonymous,
    difficulty,
    parsedHours,
    mentalEffort,
    stress,
    targetGrade,
    recommended,
    usefulness,
    overallExperience,
    whatWorkedWell,
    whatWasChallenging,
    practicalAdvice,
    studyMethods,
    existingReviews,
  ]);

  const linterChecks = [
    {
      label: 'Name the assessment that mattered — midterm, lab, problem set, final.',
      done: linter.signals.hasAssessmentOrWorkloadContext,
    },
    {
      label: 'Reference something course-specific — topics, rubrics, tutorials.',
      done: linter.signals.hasCourseSpecificDetails,
    },
    {
      label: 'Say what you actually did to study (and what you would skip).',
      done: linter.signals.hasActionableAdvice,
    },
    {
      label: 'Give it a few sentences — detail is what reaches the next student.',
      done: !linter.signals.isLowInformation,
    },
  ];

  const validateField = (field: 'term' | 'instructorName' | 'weeklyHours' | 'overallExperience', value: string): string | undefined => {
    if (field === 'term' && !value.trim()) {
      return 'Select the academic term you took this course.';
    }
    if (field === 'instructorName' && !value.trim()) {
      return 'Enter your professor or instructor name.';
    }
    if (field === 'weeklyHours') {
      const n = Number(value);
      if (!value.trim() || Number.isNaN(n) || n < 1 || n > 40) {
        return 'Enter weekly study hours between 1 and 40.';
      }
    }
    if (field === 'overallExperience' && value.trim().length < 15) {
      return 'Write at least 15 characters summarizing your overall experience.';
    }
    return undefined;
  };

  const handleFieldChange = (
    field: 'term' | 'instructorName' | 'weeklyHours' | 'overallExperience',
    value: string
  ) => {
    if (field === 'term') setTerm(value);
    if (field === 'instructorName') setInstructorName(value);
    if (field === 'weeklyHours') setWeeklyHours(value);
    if (field === 'overallExperience') setOverallExperience(value);

    if (fieldErrors[field]) {
      const msg = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleFieldBlur = (
    field: 'term' | 'instructorName' | 'weeklyHours' | 'overallExperience',
    value: string
  ) => {
    const msg = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const validateStep = (): boolean => {
    const nextErrors: FieldErrorMap = {};

    if (step === 1) {
      const termErr = validateField('term', term);
      const instErr = validateField('instructorName', instructorName);
      if (termErr) nextErrors.term = termErr;
      if (instErr) nextErrors.instructorName = instErr;
      setFieldErrors(nextErrors);
      if (termErr) {
        document.getElementById('rev-term')?.focus();
        return false;
      }
      if (instErr) {
        document.getElementById('rev-inst')?.focus();
        return false;
      }
    }

    if (step === 2) {
      const hoursErr = validateField('weeklyHours', weeklyHours);
      if (hoursErr) nextErrors.weeklyHours = hoursErr;
      setFieldErrors(nextErrors);
      if (hoursErr) {
        document.getElementById('rev-hours')?.focus();
        return false;
      }
    }

    if (step === 3) {
      const expErr = validateField('overallExperience', overallExperience);
      if (expErr) nextErrors.overallExperience = expErr;
      setFieldErrors(nextErrors);
      if (expErr) {
        document.getElementById('rev-overall')?.focus();
        return false;
      }
    }

    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    setFieldErrors({});
    try {
      await onSubmit({
        courseId: course.id,
        term,
        instructorName: instructorName.trim(),
        taName: taName.trim() || undefined,
        authorAlias: isAnonymous
          ? authorAlias.trim() || 'Anonymous Student'
          : authorAlias.trim() || 'Demo Student',
        isAnonymous,
        difficulty,
        weeklyHours: parsedHours,
        mentalEffort,
        stress,
        ...(targetGrade ? { targetGrade } : {}),
        recommended,
        usefulness,
        overallExperience: overallExperience.trim(),
        whatWorkedWell: whatWorkedWell.trim(),
        whatWasChallenging: whatWasChallenging.trim(),
        practicalAdvice: practicalAdvice.trim(),
        studyMethods,
      });
      onClose();
    } catch (err) {
      setFieldErrors({
        submit: err instanceof Error ? err.message : 'Unable to submit review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTileClass =
    'border-2 border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold shadow-surface';
  const unselectedTileClass =
    'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-dialog">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">{course.code}</div>
            <h2 id="write-review-title" className="type-h2 text-[var(--text)]">
              Write a Course Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-6 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)] mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && 'Course Context & Term'}
              {step === 2 && 'Workload & Rating'}
              {step === 3 && 'Written Feedback'}
              {step === 4 && 'Study Methods & Submit'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-control transition-colors ${
                  i <= step ? 'bg-[var(--chart)]' : 'bg-[var(--border)]'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Step 1: Course Context & Term */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rev-term"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    Academic Term <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="rev-term"
                    value={term}
                    aria-invalid={Boolean(fieldErrors.term)}
                    aria-describedby={fieldErrors.term ? 'err-rev-term' : undefined}
                    onChange={(e) => handleFieldChange('term', e.target.value)}
                    className={`min-h-[44px] w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS} ${
                      fieldErrors.term ? 'border-[var(--accent-strong)]' : ''
                    }`}
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.term && (
                    <p id="err-rev-term" role="alert" className="mt-1 text-xs font-semibold text-[var(--text)]">
                      {fieldErrors.term}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rev-inst"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    Professor / Instructor <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="rev-inst"
                    type="text"
                    list="course-prof-list"
                    value={instructorName}
                    aria-invalid={Boolean(fieldErrors.instructorName)}
                    aria-describedby={fieldErrors.instructorName ? 'err-rev-inst' : undefined}
                    onChange={(e) => handleFieldChange('instructorName', e.target.value)}
                    onBlur={(e) => handleFieldBlur('instructorName', e.target.value)}
                    placeholder="e.g. Prof. Smith"
                    className={`min-h-[44px] w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS} ${
                      fieldErrors.instructorName ? 'border-[var(--accent-strong)]' : ''
                    }`}
                  />
                  <datalist id="course-prof-list">
                    {profOptions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  {fieldErrors.instructorName && (
                    <p id="err-rev-inst" role="alert" className="mt-1 text-xs font-semibold text-[var(--text)]">
                      {fieldErrors.instructorName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="rev-ta"
                  className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                >
                  Teaching Assistant (optional)
                </label>
                <input
                  id="rev-ta"
                  type="text"
                  list="course-ta-list"
                  value={taName}
                  onChange={(e) => setTaName(e.target.value)}
                  placeholder="Optional TA name from your tutorial or lab"
                  className={`min-h-[44px] w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS}`}
                />
                <datalist id="course-ta-list">
                  {taOptions.map((ta) => (
                    <option key={ta} value={ta} />
                  ))}
                </datalist>
              </div>

              <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                    <Lock className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
                    <span>Privacy-preserving identity</span>
                  </div>
                  <label className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[var(--text)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 rounded-[4px] border border-[var(--border)] accent-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>
                <div>
                  <label
                    htmlFor="rev-alias"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    Display context (optional)
                  </label>
                  <input
                    id="rev-alias"
                    type="text"
                    value={authorAlias}
                    onChange={(e) => setAuthorAlias(e.target.value)}
                    placeholder="e.g. 2A Honours Math Student (no student ID or email)"
                    maxLength={48}
                    className={`min-h-[44px] w-full rounded-[4px] px-3 py-2 text-xs ${CONTROL_FOCUS_CLASS}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Difficulty, Workload, Recommendation & Usefulness */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span
                  id="lbl-difficulty"
                  className="block text-xs font-semibold text-[var(--text)] mb-2"
                >
                  Overall Difficulty (1 = Manageable, 5 = Demanding) <span aria-hidden="true">*</span>
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="lbl-difficulty"
                  className="grid grid-cols-5 gap-2"
                >
                  {([1, 2, 3, 4, 5] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      role="radio"
                      aria-checked={difficulty === val}
                      onClick={() => setDifficulty(val)}
                      className={`min-h-[44px] rounded-control py-2 text-sm tabular-nums transition-colors ${
                        difficulty === val ? selectedTileClass : unselectedTileClass
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Mental effort (1 = light, 5 = draining)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((val) => (
                      <button
                        key={`effort-${val}`}
                        type="button"
                        onClick={() => setMentalEffort(val)}
                        aria-pressed={mentalEffort === val}
                        className={`min-h-[44px] rounded-control py-2 text-sm tabular-nums transition-colors ${
                          mentalEffort === val ? selectedTileClass : unselectedTileClass
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    How draining the work felt, separate from how long it took.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                    Stress (1 = calm, 5 = overwhelming)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((val) => (
                      <button
                        key={`stress-${val}`}
                        type="button"
                        onClick={() => setStress(val)}
                        aria-pressed={stress === val}
                        className={`min-h-[44px] rounded-control py-2 text-sm tabular-nums transition-colors ${
                          stress === val ? selectedTileClass : unselectedTileClass
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    How the term felt week to week, not just at the exam.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rev-hours"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    Estimated Weekly Study Hours <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="rev-hours"
                    type="number"
                    min={1}
                    max={40}
                    value={weeklyHours}
                    aria-invalid={Boolean(fieldErrors.weeklyHours)}
                    aria-describedby={fieldErrors.weeklyHours ? 'err-rev-hours' : 'hint-rev-hours'}
                    onChange={(e) => handleFieldChange('weeklyHours', e.target.value)}
                    onBlur={(e) => handleFieldBlur('weeklyHours', e.target.value)}
                    className={`min-h-[44px] w-full rounded-control px-3 py-2 text-sm tabular-nums ${CONTROL_FOCUS_CLASS} ${
                      fieldErrors.weeklyHours ? 'border-[var(--accent-strong)]' : ''
                    }`}
                  />
                  {fieldErrors.weeklyHours ? (
                    <p id="err-rev-hours" role="alert" className="mt-1 text-xs font-semibold text-[var(--text)]">
                      {fieldErrors.weeklyHours}
                    </p>
                  ) : (
                    <p id="hint-rev-hours" className="mt-1 text-xs text-[var(--text-muted)]">
                      Outside-of-class study, assignments, and exam prep (1–40).
                    </p>
                  )}
                </div>

                <div>
                  <span
                    id="lbl-recommend"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    Would you recommend this course? <span aria-hidden="true">*</span>
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="lbl-recommend"
                    className="grid grid-cols-2 gap-2"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={recommended}
                      onClick={() => setRecommended(true)}
                      className={`min-h-[44px] rounded-control py-2 text-xs transition-colors ${
                        recommended ? selectedTileClass : unselectedTileClass
                      }`}
                    >
                      Yes, recommend
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!recommended}
                      onClick={() => setRecommended(false)}
                      className={`min-h-[44px] rounded-control py-2 text-xs transition-colors ${
                        !recommended ? selectedTileClass : unselectedTileClass
                      }`}
                    >
                      Not recommended
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="rev-grade"
                  className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                >
                  What grade were you working toward? (optional)
                </label>
                <select
                  id="rev-grade"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value as GradeBand | '')}
                  className={`min-h-[44px] w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS}`}
                >
                  <option value="">Prefer not to say</option>
                  {GRADE_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {GRADE_BAND_LABELS[band]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Used only to group study-hour bands for future students. Never shown as a grade
                  distribution or a ranking.
                </p>
              </div>

              <div>
                <span
                  id="lbl-usefulness"
                  className="block text-xs font-semibold text-[var(--text)] mb-2"
                >
                  Course Usefulness (1 = Low, 5 = High) <span aria-hidden="true">*</span>
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="lbl-usefulness"
                  className="grid grid-cols-5 gap-2"
                >
                  {([1, 2, 3, 4, 5] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      role="radio"
                      aria-checked={usefulness === val}
                      onClick={() => setUsefulness(val)}
                      className={`min-h-[44px] rounded-control py-2 text-sm tabular-nums transition-colors ${
                        usefulness === val ? selectedTileClass : unselectedTileClass
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Structured Written Feedback */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rev-overall"
                  className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                >
                  Overall course experience <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="rev-overall"
                  rows={3}
                  value={overallExperience}
                  aria-invalid={Boolean(fieldErrors.overallExperience)}
                  aria-describedby={
                    fieldErrors.overallExperience ? 'err-rev-overall' : 'hint-rev-overall'
                  }
                  onChange={(e) => handleFieldChange('overallExperience', e.target.value)}
                  onBlur={(e) => handleFieldBlur('overallExperience', e.target.value)}
                  placeholder="Summarize pacing, exams, and overall workload..."
                  className={`w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS} ${
                    fieldErrors.overallExperience ? 'border-[var(--accent-strong)]' : ''
                  }`}
                />
                {fieldErrors.overallExperience ? (
                  <p id="err-rev-overall" role="alert" className="mt-1 text-xs font-semibold text-[var(--text)]">
                    {fieldErrors.overallExperience}
                  </p>
                ) : (
                  <p id="hint-rev-overall" className="mt-1 text-xs text-[var(--text-muted)]">
                    Minimum 15 characters. Mentioning midterms, assignments, or tutorials helps Trust Lens rank your review.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="rev-well"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    What worked well (optional)
                  </label>
                  <textarea
                    id="rev-well"
                    rows={3}
                    value={whatWorkedWell}
                    onChange={(e) => setWhatWorkedWell(e.target.value)}
                    placeholder="Lectures, tutorials, TA office hours, or rubrics..."
                    className={`w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="rev-challenge"
                    className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                  >
                    What was challenging (optional)
                  </label>
                  <textarea
                    id="rev-challenge"
                    rows={3}
                    value={whatWasChallenging}
                    onChange={(e) => setWhatWasChallenging(e.target.value)}
                    placeholder="Tough exam topics, assignment spikes, or prerequisites..."
                    className={`w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="rev-advice"
                  className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                >
                  Practical advice for future students (optional)
                </label>
                <textarea
                  id="rev-advice"
                  rows={2}
                  value={practicalAdvice}
                  onChange={(e) => setPracticalAdvice(e.target.value)}
                  placeholder="Preparation tips before or during the term..."
                  className={`w-full rounded-control px-3 py-2 text-sm ${CONTROL_FOCUS_CLASS}`}
                />
              </div>

              {/* Live Trust Lens linter — a nudge, never a blocker */}
              <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    <span>Live Trust Lens score</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--accent)] tabular-nums">
                    {linter.score}/100 · {linter.tier === 'most_informative' ? 'most informative' : linter.tier}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${linter.score}%` }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {linterChecks.map((check) => (
                    <li key={check.label} className="flex items-start gap-2 text-xs leading-relaxed">
                      {check.done ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      ) : (
                        <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      )}
                      <span className={check.done ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--text-muted)]">
                  This is the same score reviewers see after submitting — there is no separate
                  hidden grade, and nothing here blocks you from posting.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Study Methods & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span
                  id="lbl-study-methods"
                  className="block text-xs font-semibold text-[var(--text)] mb-1.5"
                >
                  Study methods used in {course.code} (optional)
                </span>

                <div
                  role="group"
                  aria-labelledby="lbl-study-methods"
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {(Object.keys(STUDY_METHOD_CATALOG) as StudyMethodKey[]).map((key) => {
                    const selected = studyMethods.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMethod(key)}
                        aria-pressed={selected}
                        className={`flex min-h-[44px] items-center justify-between rounded-control px-3 py-2 text-left text-xs transition-colors ${
                          selected ? selectedTileClass : unselectedTileClass
                        }`}
                      >
                        <span>{STUDY_METHOD_CATALOG[key].label}</span>
                        {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs text-[var(--text-muted)] space-y-1">
                <div className="font-semibold text-[var(--text)]">Review Summary</div>
                <div>
                  {term} · {instructorName} · Difficulty {difficulty}/5 · {parsedHours} hrs/wk ·{' '}
                  effort {mentalEffort}/5 · stress {stress}/5 ·{' '}
                  {recommended ? 'Recommended' : 'Not recommended'}
                </div>
              </div>

              {fieldErrors.submit && (
                <p role="alert" className="text-xs font-semibold text-[var(--text)]">
                  {fieldErrors.submit}
                </p>
              )}
            </div>
          )}

          {/* Footer Navigation — Strictly ONE Primary CTA Button */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setFieldErrors({});
                  setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
                }}
                className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 text-xs font-semibold"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary inline-flex min-h-[44px] items-center rounded-control px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                key="next-step-btn"
                type="button"
                onClick={handleNext}
                className="btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-control px-6 py-2 text-xs font-semibold"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                key="submit-review-btn"
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-control px-6 py-2 text-xs font-semibold"
              >
                <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
                <Check className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


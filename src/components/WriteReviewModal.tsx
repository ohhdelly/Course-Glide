import React, { useMemo, useState } from 'react';
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
  // Optional: starting empty keeps an unnamed TA from being credited automatically,
  // which would fabricate a "named mention" in the TA section view.
  const [taName, setTaName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorAlias, setAuthorAlias] = useState('');

  const [difficulty, setDifficulty] = useState<Review['difficulty']>(3);
  const [weeklyHours, setWeeklyHours] = useState<number>(9);
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleMethod = (key: StudyMethodKey) => {
    setStudyMethods((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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
      weeklyHours,
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
    weeklyHours,
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

  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!term.trim() || !instructorName.trim()) {
        setError('Please choose an academic term and instructor.');
        return false;
      }
    }
    if (step === 2) {
      if (weeklyHours < 1 || weeklyHours > 40) {
        setError('Please enter weekly study hours between 1 and 40.');
        return false;
      }
    }
    if (step === 3) {
      if (overallExperience.trim().length < 15) {
        setError(
          'Please share at least 15 characters describing your overall course experience.'
        );
        return false;
      }
    }
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
    setError('');
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
        weeklyHours,
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
      setError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div>
            <div className="font-mono text-xs font-semibold text-[var(--accent-code)]">{course.code}</div>
            <h2 id="write-review-title" className="font-display text-lg font-bold text-[var(--text-primary)]">
              Write a Course Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-6 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && 'Course Context & Term'}
              {step === 2 && 'Workload & Rating'}
              {step === 3 && 'Structured Feedback'}
              {step === 4 && 'Study Methods & Submit'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-[var(--accent-hover)]' : 'bg-[var(--surface-muted)]'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Step 1: Course Context & Term */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-term" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Academic Term
                  </label>
                  <select
                    id="rev-term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rev-inst" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Professor / Instructor
                  </label>
                  <input
                    id="rev-inst"
                    type="text"
                    list="course-prof-list"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Enter instructor name (e.g. Prof. Smith)"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                  />
                  <datalist id="course-prof-list">
                    {profOptions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label htmlFor="rev-ta" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Teaching Assistant (optional)
                </label>
                <input
                  id="rev-ta"
                  type="text"
                  list="course-ta-list"
                  value={taName}
                  onChange={(e) => setTaName(e.target.value)}
                  placeholder="Optional TA name from your tutorial or lab"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                />
                <datalist id="course-ta-list">
                  {taOptions.map((ta) => (
                    <option key={ta} value={ta} />
                  ))}
                </datalist>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <Lock className="h-3.5 w-3.5 text-[var(--status-positive)]" aria-hidden="true" />
                    <span>Privacy-preserving identity</span>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-[var(--border-strong)] accent-[var(--accent-hover)] focus:ring-[var(--ring)]"
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="rev-alias" className="block text-[11px] text-[var(--text-secondary)] mb-1">
                    Optional display context (e.g., “2A Honours Math Student” — never include student ID or email)
                  </label>
                  <input
                    id="rev-alias"
                    type="text"
                    value={authorAlias}
                    onChange={(e) => setAuthorAlias(e.target.value)}
                    placeholder="Anonymous Student"
                    maxLength={48}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Difficulty, Workload, Recommendation & Usefulness */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                  Overall Difficulty (1 = Very manageable, 5 = Highly demanding)
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDifficulty(val)}
                      className={`rounded-lg border py-2.5 font-mono text-sm font-semibold transition-colors ${
                        difficulty === val
                          ? 'btn-primary border-transparent'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-hours" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Estimated Weekly Study Hours
                  </label>
                  <input
                    id="rev-hours"
                    type="number"
                    min={1}
                    max={40}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Include assignments, readings, tutorials, and exam prep.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Would you recommend this course?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommended(true)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        recommended
                          ? 'border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      Yes, recommend
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommended(false)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        !recommended
                          ? 'border-amber-700 bg-[var(--status-warning-bg)] text-[var(--status-warning)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      Not recommended
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                    Mental effort (1 = light, 5 = draining)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((val) => (
                      <button
                        key={`effort-${val}`}
                        type="button"
                        onClick={() => setMentalEffort(val)}
                        aria-pressed={mentalEffort === val}
                        className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                          mentalEffort === val
                            ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    How draining the work felt, separate from how long it took.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                    Stress (1 = calm, 5 = overwhelming)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((val) => (
                      <button
                        key={`stress-${val}`}
                        type="button"
                        onClick={() => setStress(val)}
                        aria-pressed={stress === val}
                        className={`rounded-lg border py-2 font-mono text-xs font-semibold transition-colors ${
                          stress === val
                            ? 'border-amber-700 bg-[var(--status-warning-bg)] text-[var(--status-warning)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    How the term felt week to week, not just at the exam.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="rev-grade" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  What grade were you working toward? (optional)
                </label>
                <select
                  id="rev-grade"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(e.target.value as GradeBand | '')}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                >
                  <option value="">Prefer not to say</option>
                  {GRADE_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {GRADE_BAND_LABELS[band]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  Used only to group study-hour bands for future students. Never shown as a grade
                  distribution or a ranking.
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                  Perceived Course Usefulness (1 = Low, 5 = Highly valuable)
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setUsefulness(val)}
                      className={`rounded-lg border py-2.5 font-mono text-sm font-semibold transition-colors ${
                        usefulness === val
                          ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
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
              <p className="text-xs text-[var(--text-secondary)]">
                Specific observations about midterms, assignments, tutorials, or pacing help Trust
                Lens highlight your review for future students.
              </p>

              <div>
                <label htmlFor="rev-overall" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Concise overall experience <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="rev-overall"
                  rows={2}
                  value={overallExperience}
                  onChange={(e) => setOverallExperience(e.target.value)}
                  placeholder="Summarize how the course felt overall, including assessment pacing and expectations..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-well" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    What worked well
                  </label>
                  <textarea
                    id="rev-well"
                    rows={3}
                    value={whatWorkedWell}
                    onChange={(e) => setWhatWorkedWell(e.target.value)}
                    placeholder="Lectures, tutorials, TA office hours, or rubrics..."
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="rev-challenge" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    What was challenging
                  </label>
                  <textarea
                    id="rev-challenge"
                    rows={3}
                    value={whatWasChallenging}
                    onChange={(e) => setWhatWasChallenging(e.target.value)}
                    placeholder="Tough exam topics, assignment spikes, or prerequisites..."
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rev-advice" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Practical advice for future students
                </label>
                <textarea
                  id="rev-advice"
                  rows={2}
                  value={practicalAdvice}
                  onChange={(e) => setPracticalAdvice(e.target.value)}
                  placeholder="Concrete preparation tips before or during the term..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>

              {/* Live Trust Lens linter — a nudge, never a blocker */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                    <span>Live Trust Lens score</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--accent-code)] tabular-nums">
                    {linter.score}/100 · {linter.tier === 'most_informative' ? 'most informative' : linter.tier}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-hover)] transition-all"
                    style={{ width: `${linter.score}%` }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {linterChecks.map((check) => (
                    <li key={check.label} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      {check.done ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" aria-hidden="true" />
                      ) : (
                        <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      )}
                      <span className={check.done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-[var(--text-muted)]">
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
                <span className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Which study approaches did you use in {course.code}? (Optional)
                </span>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Helps build transparent Study Strategy statistics for future students.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(Object.keys(STUDY_METHOD_CATALOG) as StudyMethodKey[]).map((key) => {
                    const selected = studyMethods.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMethod(key)}
                        aria-pressed={selected}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <span>{STUDY_METHOD_CATALOG[key].label}</span>
                        {selected && <Check className="h-4 w-4 text-[var(--accent-text)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs text-[var(--text-secondary)] space-y-1">
                <div className="font-semibold text-[var(--text-primary)]">Review Summary</div>
                <div>
                  {term} · {instructorName} · Difficulty {difficulty}/5 · {weeklyHours} hrs/wk ·{' '}
                  effort {mentalEffort}/5 · stress {stress}/5 ·{' '}
                  {recommended ? 'Recommended' : 'Not recommended'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              {error}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                key="next-step-btn"
                type="button"
                onClick={handleNext}
                className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                key="submit-review-btn"
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

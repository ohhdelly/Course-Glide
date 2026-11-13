import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Lock, X } from 'lucide-react';
import type { Course, InstructorProfile, Review, StudyMethodKey } from '../types/course';
import { STUDY_METHOD_CATALOG } from '../utils/trustLens';

interface WriteReviewModalProps {
  course: Course;
  instructors: InstructorProfile[];
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
  onClose,
  onSubmit,
}) => {
  const profOptions = instructors.filter((i) => i.role === 'professor').map((i) => i.name);
  const taOptions = instructors.filter((i) => i.role === 'ta').map((i) => i.name);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [term, setTerm] = useState(TERMS[0]);
  const [instructorName, setInstructorName] = useState(
    profOptions[0] ?? 'Course Instructor (Demo)'
  );
  const [taName, setTaName] = useState(taOptions[0] ?? '');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorAlias, setAuthorAlias] = useState('');

  const [difficulty, setDifficulty] = useState<Review['difficulty']>(3);
  const [weeklyHours, setWeeklyHours] = useState<number>(9);
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-4">
          <div>
            <div className="font-mono text-xs font-semibold text-blue-700">{course.code}</div>
            <h2 id="write-review-title" className="font-display text-lg font-bold text-slate-900">
              Write a Course Review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="border-b border-slate-200/70 bg-[#F4F7FB] px-6 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
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
                  i <= step ? 'bg-blue-700' : 'bg-slate-200'
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
                  <label htmlFor="rev-term" className="block text-xs font-semibold text-slate-800 mb-1">
                    Academic Term
                  </label>
                  <select
                    id="rev-term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rev-inst" className="block text-xs font-semibold text-slate-800 mb-1">
                    Professor / Instructor
                  </label>
                  <input
                    id="rev-inst"
                    type="text"
                    list="course-prof-list"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Instructor name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <datalist id="course-prof-list">
                    {profOptions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label htmlFor="rev-ta" className="block text-xs font-semibold text-slate-800 mb-1">
                  Teaching Assistant (optional)
                </label>
                <input
                  id="rev-ta"
                  type="text"
                  list="course-ta-list"
                  value={taName}
                  onChange={(e) => setTaName(e.target.value)}
                  placeholder="Optional TA name from your tutorial or lab"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <datalist id="course-ta-list">
                  {taOptions.map((ta) => (
                    <option key={ta} value={ta} />
                  ))}
                </datalist>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-[#F6F9FD] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Lock className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                    <span>Privacy-preserving identity</span>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span>Post anonymously</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="rev-alias" className="block text-[11px] text-slate-600 mb-1">
                    Optional display context (e.g., “2A Honours Math Student” — never include student ID or email)
                  </label>
                  <input
                    id="rev-alias"
                    type="text"
                    value={authorAlias}
                    onChange={(e) => setAuthorAlias(e.target.value)}
                    placeholder="Anonymous Student"
                    maxLength={48}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Difficulty, Workload, Recommendation & Usefulness */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-2">
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
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-hours" className="block text-xs font-semibold text-slate-800 mb-1">
                    Estimated Weekly Study Hours
                  </label>
                  <input
                    id="rev-hours"
                    type="number"
                    min={1}
                    max={40}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Include assignments, readings, tutorials, and exam prep.
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-800 mb-1">
                    Would you recommend this course?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommended(true)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        recommended
                          ? 'border-teal-700 bg-teal-50 text-teal-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Yes, recommend
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommended(false)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                        !recommended
                          ? 'border-amber-700 bg-amber-50 text-amber-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Not recommended
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-2">
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
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
              <p className="text-xs text-slate-600">
                Specific observations about midterms, assignments, tutorials, or pacing help Trust
                Lens highlight your review for future students.
              </p>

              <div>
                <label htmlFor="rev-overall" className="block text-xs font-semibold text-slate-800 mb-1">
                  Concise overall experience <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="rev-overall"
                  rows={2}
                  value={overallExperience}
                  onChange={(e) => setOverallExperience(e.target.value)}
                  placeholder="Summarize how the course felt overall, including assessment pacing and expectations..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rev-well" className="block text-xs font-semibold text-slate-800 mb-1">
                    What worked well
                  </label>
                  <textarea
                    id="rev-well"
                    rows={3}
                    value={whatWorkedWell}
                    onChange={(e) => setWhatWorkedWell(e.target.value)}
                    placeholder="Lectures, tutorials, TA office hours, or rubrics..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="rev-challenge" className="block text-xs font-semibold text-slate-800 mb-1">
                    What was challenging
                  </label>
                  <textarea
                    id="rev-challenge"
                    rows={3}
                    value={whatWasChallenging}
                    onChange={(e) => setWhatWasChallenging(e.target.value)}
                    placeholder="Tough exam topics, assignment spikes, or prerequisites..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rev-advice" className="block text-xs font-semibold text-slate-800 mb-1">
                  Practical advice for future students
                </label>
                <textarea
                  id="rev-advice"
                  rows={2}
                  value={practicalAdvice}
                  onChange={(e) => setPracticalAdvice(e.target.value)}
                  placeholder="Concrete preparation tips before or during the term..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Study Methods & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-1">
                  Which study approaches did you use in {course.code}? (Optional)
                </span>
                <p className="text-xs text-slate-500 mb-3">
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
                            ? 'border-blue-700 bg-blue-50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{STUDY_METHOD_CATALOG[key].label}</span>
                        {selected && <Check className="h-4 w-4 text-blue-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-[#F6F9FD] p-4 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900">Review Summary</div>
                <div>
                  {term} · {instructorName} · Difficulty {difficulty}/5 · {weeklyHours} hrs/wk ·{' '}
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                key="next-step-btn"
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                key="submit-review-btn"
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
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

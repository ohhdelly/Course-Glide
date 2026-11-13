import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  GraduationCap,
  Lock,
  MessageSquarePlus,
  Shield,
  Users,
} from 'lucide-react';
import type {
  CourseStats,
  FacultyResponse,
  InstructorProfile,
  Review,
} from '../../types/course';

interface TeachingTeamTabProps {
  courseId: string;
  courseCode: string;
  instructors: InstructorProfile[];
  facultyResponses: FacultyResponse[];
  reviews: Review[];
  stats: CourseStats;
  onSubmitFacultyResponse: (payload: {
    courseId: string;
    instructorName: string;
    role: 'professor' | 'ta';
    term: string;
    themeAddressed: string;
    responseText: string;
  }) => Promise<void>;
}

export const TeachingTeamTab: React.FC<TeachingTeamTabProps> = ({
  courseId,
  courseCode,
  instructors,
  facultyResponses,
  reviews,
  stats,
  onSubmitFacultyResponse,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [facultyDemoOpen, setFacultyDemoOpen] = useState(false);

  // Faculty demo response form state
  const [respInstructor, setRespInstructor] = useState(
    instructors[0]?.name ?? 'Course Instructor (Demo)'
  );
  const [respRole, setRespRole] = useState<'professor' | 'ta'>('professor');
  const [respTerm, setRespTerm] = useState('Upcoming Term');
  const [respTheme, setRespTheme] = useState('');
  const [respText, setRespText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const terms = useMemo(
    () => Array.from(new Set(instructors.map((i) => i.term))),
    [instructors]
  );

  const visibleInstructors = useMemo(() => {
    if (selectedTerm === 'all') return instructors;
    return instructors.filter((i) => i.term === selectedTerm);
  }, [instructors, selectedTerm]);

  const professors = visibleInstructors.filter((i) => i.role === 'professor');
  const tas = visibleInstructors.filter((i) => i.role === 'ta');

  // Aggregated theme counts for Faculty Demo Dashboard (never exposes student identities)
  const aggregatedThemes = useMemo(() => {
    const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
    const themes = [
      {
        label: 'Midterm / exam calibration & rubric clarity',
        count: visible.filter((r) =>
          /midterm|exam|rubric|grading|partial/i.test(
            `${r.whatWasChallenging} ${r.overallExperience}`
          )
        ).length,
      },
      {
        label: 'Weekly assignment pacing & workload spikes',
        count: visible.filter((r) =>
          /weekly|assignment|problem set|hours|workload|pace/i.test(
            `${r.whatWasChallenging} ${r.overallExperience}`
          )
        ).length,
      },
      {
        label: 'Tutorial / TA office-hour support valued',
        count: visible.filter((r) =>
          /tutorial|ta|dgd|office hours|counterexample/i.test(
            `${r.whatWorkedWell} ${r.practicalAdvice}`
          )
        ).length,
      },
    ];
    return themes;
  }, [reviews]);

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (respTheme.trim().length < 5 || respText.trim().length < 20) {
      setFormError(
        'Please specify the aggregate theme (5+ characters) and response (20+ characters).'
      );
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitFacultyResponse({
        courseId,
        instructorName: respInstructor,
        role: respRole,
        term: respTerm,
        themeAddressed: respTheme.trim(),
        responseText: respText.trim(),
      });
      setRespTheme('');
      setRespText('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to publish demo response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Term Filter + Faculty Demo Mode Switch */}
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Teaching Team Profiles & Two-Way Feedback
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Constructive category breakdowns for professors and teaching assistants (demonstration profiles).
              Small samples are labeled without ranking individuals.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <div>
              <label htmlFor="teaching-term-filter" className="sr-only">
                Filter by academic term
              </label>
              <select
                id="teaching-term-filter"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="rounded-xl border border-slate-200 bg-[#F7F9FC] px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="all">All Terms</option>
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFacultyDemoOpen((v) => !v)}
              aria-expanded={facultyDemoOpen}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition-all whitespace-nowrap ${
                facultyDemoOpen
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-200 bg-[#EFF4FB] text-blue-800 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{facultyDemoOpen ? 'Hide Faculty Demo' : 'Faculty Demo View'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Faculty Demonstration Dashboard (Strictly Labeled Demo Mode) */}
      {facultyDemoOpen && (
        <section
          aria-label="Faculty Demonstration Dashboard"
          className="rounded-2xl border border-blue-200/80 bg-gradient-to-b from-[#EFF5FD] to-[#F7FAFE] p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-blue-200/70">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Demonstration Mode Only · No real faculty privileges granted</span>
              </div>
              <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                Instructor & TA Aggregate Feedback Console — {courseCode}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                In production, verified faculty authentication restricts access to anonymized,
                aggregated trends—individual student identities are never exposed.
              </p>
            </div>
            <div className="rounded-xl border border-blue-200/70 bg-white/80 px-3.5 py-2 text-right font-mono text-xs text-slate-700 tabular-nums">
              <div>{stats.responseCount} aggregate responses</div>
              <div className="text-teal-700 font-semibold">{stats.recommendationRate}% course recommendation</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Aggregated Recurring Themes */}
            <div className="lg:col-span-5 surface-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-slate-900">
                Recurring Aggregated Themes
              </h4>
              <p className="mt-0.5 text-xs text-slate-500">
                Theme frequencies surfaced from anonymous submissions
              </p>
              <ul className="mt-4 space-y-3">
                {aggregatedThemes.map((t) => (
                  <li key={t.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{t.label}</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {t.count} mentions
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8EEF6]">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{
                          width: `${
                            stats.responseCount > 0
                              ? Math.min(100, Math.round((t.count / stats.responseCount) * 100))
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Publish Aggregate Clarification Response */}
            <form
              onSubmit={handleFacultySubmit}
              className="lg:col-span-7 surface-card rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Publish Response to Aggregate Theme (Demo)
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="fac-name" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Instructor / TA Name
                  </label>
                  <input
                    id="fac-name"
                    type="text"
                    value={respInstructor}
                    onChange={(e) => setRespInstructor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="fac-role" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    id="fac-role"
                    value={respRole}
                    onChange={(e) => setRespRole(e.target.value as 'professor' | 'ta')}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="professor">Professor</option>
                    <option value="ta">Teaching Assistant</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fac-term" className="block text-[11px] font-medium text-slate-600 mb-1">
                    Term Context
                  </label>
                  <input
                    id="fac-term"
                    type="text"
                    value={respTerm}
                    onChange={(e) => setRespTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fac-theme" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Aggregate Theme Addressed
                </label>
                <input
                  id="fac-theme"
                  type="text"
                  value={respTheme}
                  onChange={(e) => setRespTheme(e.target.value)}
                  placeholder="e.g. Midterm 1 partial-credit rubric & weekly workload pacing"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="fac-response" className="block text-[11px] font-medium text-slate-600 mb-1">
                  Teaching Team Clarification / Adjustment
                </label>
                <textarea
                  id="fac-response"
                  rows={3}
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Share planned syllabus adjustments, extra tutorial resources, or clarifications for incoming students..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Demo Response'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Published Faculty Responses */}
      {facultyResponses.length > 0 && (
        <section className="space-y-3" aria-label="Published teaching team responses">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Teaching Team Responses to Aggregate Feedback</span>
          </div>
          {facultyResponses.map((resp) => (
            <article
              key={resp.id}
              className="rounded-2xl border border-teal-200/80 bg-gradient-to-b from-[#EFFAF7] to-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span className="font-semibold text-slate-900">{resp.instructorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.role === 'professor' ? 'Professor' : 'Teaching Assistant'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.term}</span>
                </div>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 border border-teal-200/60">
                  Demo faculty response
                </span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-800">
                Theme addressed: {resp.themeAddressed}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                {resp.responseText}
              </p>
            </article>
          ))}
        </section>
      )}

      {/* Professors Section */}
      {professors.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-display text-base font-bold text-slate-900">
            Professors ({professors.length})
          </h3>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {professors.map((prof) => (
              <article
                key={prof.id}
                className="surface-card-interactive rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-base font-semibold text-slate-900">
                      {prof.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Professor · {prof.term} · {prof.responseCount} responses (Demo)
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-slate-200/65 bg-[#F6F9FD] p-3.5">
                  {prof.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{cat.category}</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E3EAF4]">
                        <div
                          className="h-full rounded-full bg-blue-700"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="pt-1 text-xs leading-relaxed text-slate-600">
                  {prof.constructiveSummary}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Teaching Assistants Section */}
      {tas.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Teaching Assistants ({tas.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {tas.map((ta) => (
              <article
                key={ta.id}
                className="surface-card-interactive rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h4 className="font-display text-base font-semibold text-slate-900">
                    {ta.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Teaching Assistant · {ta.term} · {ta.responseCount} responses (Demo)
                  </p>
                </div>

                <div className="space-y-2.5 rounded-xl border border-slate-200/65 bg-[#F6F9FC] p-3.5">
                  {ta.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{cat.category}</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E3EAF4]">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="pt-1 text-xs leading-relaxed text-slate-600">
                  {ta.constructiveSummary}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleInstructors.length === 0 && (
        <div className="surface-card rounded-2xl p-10 text-center text-sm text-slate-600">
          No teaching-team profiles logged for the selected term yet.
        </div>
      )}
    </div>
  );
};

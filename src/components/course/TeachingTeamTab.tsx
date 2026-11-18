import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  GraduationCap,
  Lock,
} from 'lucide-react';
import type {
  CourseStats,
  FacultyResponse,
  InstructorProfile,
  Review,
} from '../../types/course';
import { CollapsibleText } from './CollapsibleText';

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
  onOpenWriteReview?: () => void;
}

export const TeachingTeamTab: React.FC<TeachingTeamTabProps> = ({
  courseId,
  courseCode,
  instructors,
  facultyResponses,
  reviews,
  stats,
  onSubmitFacultyResponse,
  onOpenWriteReview,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [facultyDemoOpen, setFacultyDemoOpen] = useState(false);

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

  const aggregatedThemes = useMemo(() => {
    const visible = reviews.filter((r) => r.moderationStatus !== 'hidden');
    return [
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
      {/* Header + Term Filter + Faculty Demo Switch */}
      <section className="surface-card rounded-card p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="type-h2 text-[var(--text)]">
              Teaching Team &amp; TA Feedback
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Category breakdowns for professors and teaching assistants (demo profiles). Small samples are shown without ranking.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <div>
              <label htmlFor="teaching-term-filter" className="sr-only">
                Filter by academic term
              </label>
              <select
                id="teaching-term-filter"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="min-h-[44px] rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] focus:border-[var(--accent-strong)]"
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
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 text-xs font-semibold shadow-surface whitespace-nowrap ${
                facultyDemoOpen ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>{facultyDemoOpen ? 'Hide Faculty Demo' : 'Faculty Demo View'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Faculty Demonstration Dashboard */}
      {facultyDemoOpen && (
        <section
          aria-label="Faculty Demonstration Dashboard"
          className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6 shadow-surface space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Demonstration Mode · Aggregated anonymous feedback only</span>
              </div>
              <h3 className="mt-1 type-h2 text-[var(--text)]">
                Instructor &amp; TA Feedback Console — {courseCode}
              </h3>
            </div>
            <div className="rounded-control border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-right text-xs text-[var(--text-muted)] tabular-nums">
              <div>{stats.responseCount} responses</div>
              <div className="text-[var(--text)] font-semibold">{stats.recommendationRate}% recommend</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Aggregated Recurring Themes */}
            <div className="lg:col-span-5 surface-card rounded-control p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-[var(--text)]">
                Recurring Themes
              </h4>
              <ul className="mt-4 space-y-3">
                {aggregatedThemes.map((t) => (
                  <li key={t.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-[var(--text)]">{t.label}</span>
                      <span className="text-[var(--text-muted)] tabular-nums shrink-0">
                        {t.count} mentions
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[var(--surface-2)]">
                      <div
                        className="h-full rounded-[4px] bg-[var(--chart)]"
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
              className="lg:col-span-7 surface-card rounded-control p-4 sm:p-6 space-y-3"
            >
              <h4 className="text-sm font-semibold text-[var(--text)]">
                Publish Response to Aggregate Theme (Demo)
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="fac-name" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Instructor / TA Name
                  </label>
                  <input
                    id="fac-name"
                    type="text"
                    value={respInstructor}
                    onChange={(e) => setRespInstructor(e.target.value)}
                    className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent-strong)]"
                  />
                </div>
                <div>
                  <label htmlFor="fac-role" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Role
                  </label>
                  <select
                    id="fac-role"
                    value={respRole}
                    onChange={(e) => setRespRole(e.target.value as 'professor' | 'ta')}
                    className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent-strong)]"
                  >
                    <option value="professor">Professor</option>
                    <option value="ta">Teaching Assistant</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fac-term" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Term Context
                  </label>
                  <input
                    id="fac-term"
                    type="text"
                    value={respTerm}
                    onChange={(e) => setRespTerm(e.target.value)}
                    className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent-strong)]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fac-theme" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Aggregate Theme Addressed
                </label>
                <input
                  id="fac-theme"
                  type="text"
                  value={respTheme}
                  onChange={(e) => setRespTheme(e.target.value)}
                  placeholder="e.g. Midterm 1 partial-credit rubric & weekly workload pacing"
                  className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)]"
                />
              </div>

              <div>
                <label htmlFor="fac-response" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Teaching Team Clarification / Adjustment
                </label>
                <textarea
                  id="fac-response"
                  rows={3}
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Share planned syllabus adjustments, extra tutorial resources, or clarifications..."
                  className="w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)]"
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-control border border-[var(--accent-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text)]">
                  {formError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex min-h-[44px] items-center rounded-control px-4 py-2 text-xs font-semibold"
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
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Teaching Team Responses
          </h3>
          {facultyResponses.map((resp) => (
            <article
              key={resp.id}
              className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6 shadow-surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
                  <span className="font-semibold text-[var(--text)]">{resp.instructorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.role === 'professor' ? 'Professor' : 'Teaching Assistant'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.term}</span>
                </div>
                <span className="rounded-control border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--text)]">
                  Demo faculty response
                </span>
              </div>
              <div className="mt-2 text-xs font-semibold text-[var(--text)]">
                Theme addressed: {resp.themeAddressed}
              </div>
              <CollapsibleText
                text={resp.responseText}
                className="mt-2 text-sm text-[var(--text-muted)]"
              />
            </article>
          ))}
        </section>
      )}

      {/* Professors Section */}
      {professors.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text)]">
            Professors ({professors.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {professors.map((prof) => (
              <article
                key={prof.id}
                className="surface-card-interactive rounded-card p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[var(--text)]">
                      {prof.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Professor · {prof.term} · {prof.responseCount} responses (Demo)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  {prof.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">{cat.category}</span>
                        <span className="font-semibold text-[var(--text)] tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[var(--surface)]">
                        <div
                          className="h-full rounded-[4px] bg-[var(--chart)]"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <CollapsibleText
                  text={prof.constructiveSummary}
                  className="pt-1 text-xs text-[var(--text-muted)]"
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Teaching Assistants Section */}
      {tas.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text)]">
            Teaching Assistants ({tas.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {tas.map((ta) => (
              <article
                key={ta.id}
                className="surface-card-interactive rounded-card p-4 sm:p-6 space-y-4"
              >
                <div>
                  <h4 className="text-base font-semibold text-[var(--text)]">
                    {ta.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Teaching Assistant · {ta.term} · {ta.responseCount} responses (Demo)
                  </p>
                </div>

                <div className="space-y-3 rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  {ta.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">{cat.category}</span>
                        <span className="font-semibold text-[var(--text)] tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[var(--surface)]">
                        <div
                          className="h-full rounded-[4px] bg-[var(--chart)]"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <CollapsibleText
                  text={ta.constructiveSummary}
                  className="pt-1 text-xs text-[var(--text-muted)]"
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleInstructors.length === 0 && (
        <div className="surface-card rounded-card p-8 text-center space-y-3">
          <h3 className="text-base font-semibold text-[var(--text)]">
            No instructor or TA feedback logged for {courseCode} yet
          </h3>
          <p className="mx-auto max-w-md text-xs text-[var(--text-muted)]">
            Submit a course review to share feedback on lectures, labs, or TA support.
          </p>
          {onOpenWriteReview && (
            <button
              type="button"
              onClick={onOpenWriteReview}
              className="btn-primary mt-2 inline-flex min-h-[44px] items-center rounded-control px-4 py-2 text-xs font-semibold"
            >
              Be the first to review
            </button>
          )}
        </div>
      )}
    </div>
  );
};


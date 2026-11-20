import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ListChecks,
  Lock,
  MessageSquarePlus,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  CourseStats,
  FacultyResponse,
  FacultyResponseStatus,
  InstructorProfile,
  Review,
  StaffDigest,
} from '../../types/course';
import { computeTeachingTeamView } from '../../utils/trustLens';
import { PulseStaffPanel } from './MidTermPulseCard';

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
    status: FacultyResponseStatus;
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

  // Faculty demo response form state
  const [respInstructor, setRespInstructor] = useState(
    instructors[0]?.name ?? 'Course Instructor (Demo)'
  );
  const [respRole, setRespRole] = useState<'professor' | 'ta'>('professor');
  const [respTerm, setRespTerm] = useState('Upcoming Term');
  const [respTheme, setRespTheme] = useState('');
  const [respText, setRespText] = useState('');
  const [respStatus, setRespStatus] = useState<FacultyResponseStatus>('heard');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [digest, setDigest] = useState<StaffDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState('');

  const loadDigest = async (forceRefresh = false) => {
    setDigestLoading(true);
    setDigestError('');
    try {
      const res = await fetch('/api/staff-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, forceRefresh }),
      });
      if (!res.ok) {
        setDigestError('Could not build the digest right now.');
        return;
      }
      const data = await res.json();
      setDigest(data.digest ?? null);
    } catch {
      setDigestError('Could not reach the staff digest endpoint.');
    } finally {
      setDigestLoading(false);
    }
  };

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
        status: respStatus,
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
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Teaching Team Profiles & Two-Way Feedback
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
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
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none"
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
                  ? 'btn-primary border-transparent'
                  : 'btn-soft'
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
          className="rounded-2xl border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-text)]">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Demonstration Mode Only · No real faculty privileges granted</span>
              </div>
              <h3 className="mt-1 font-display text-lg font-bold text-[var(--text-primary)]">
                Instructor & TA Aggregate Feedback Console — {courseCode}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                In production, verified faculty authentication restricts access to anonymized,
                aggregated trends—individual student identities are never exposed.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-right font-mono text-xs text-[var(--text-secondary)] tabular-nums">
              <div>{stats.responseCount} aggregate responses</div>
              <div className="text-[var(--status-positive)] font-semibold">{stats.recommendationRate}% course recommendation</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Aggregated Recurring Themes */}
            <div className="lg:col-span-5 surface-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Recurring Aggregated Themes
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Theme frequencies surfaced from anonymous submissions
              </p>
              <ul className="mt-4 space-y-3">
                {aggregatedThemes.map((t) => (
                  <li key={t.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-primary)]">{t.label}</span>
                      <span className="font-mono text-[var(--text-secondary)] tabular-nums">
                        {t.count} mentions
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--chart-primary)]"
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
                <MessageSquarePlus className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Publish Response to Aggregate Theme (Demo)
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="fac-name" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Instructor / TA Name
                  </label>
                  <input
                    id="fac-name"
                    type="text"
                    value={respInstructor}
                    onChange={(e) => setRespInstructor(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="fac-role" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Role
                  </label>
                  <select
                    id="fac-role"
                    value={respRole}
                    onChange={(e) => setRespRole(e.target.value as 'professor' | 'ta')}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  >
                    <option value="professor">Professor</option>
                    <option value="ta">Teaching Assistant</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fac-term" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Term Context
                  </label>
                  <input
                    id="fac-term"
                    type="text"
                    value={respTerm}
                    onChange={(e) => setRespTerm(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fac-status" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  What is the team committing to?
                </label>
                <select
                  id="fac-status"
                  value={respStatus}
                  onChange={(e) => setRespStatus(e.target.value as FacultyResponseStatus)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--ring)] focus:outline-none"
                >
                  <option value="heard">We heard this (acknowledged selection)</option>
                  <option value="changed">We changed this (concrete adjustment)</option>
                  <option value="explained">This can't change, and here's why</option>
                </select>
              </div>

              <div>
                <label htmlFor="fac-theme" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Aggregate Theme Addressed
                </label>
                <input
                  id="fac-theme"
                  type="text"
                  value={respTheme}
                  onChange={(e) => setRespTheme(e.target.value)}
                  placeholder="e.g. Midterm 1 partial-credit rubric & weekly workload pacing"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="fac-response" className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Teaching Team Clarification / Adjustment
                </label>
                <textarea
                  id="fac-response"
                  rows={3}
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Share planned syllabus adjustments, extra tutorial resources, or clarifications for incoming students..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
                />
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Demo Response'}
                </button>
              </div>
            </form>
          </div>

          {/* Start / Stop / Continue digest */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Sparkles className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
                  <span>Start / Stop / Continue digest</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Three buckets of anonymised quotes plus an action checklist, built from the same
                  reviews the Trust Lens ranks highest. Deterministic by default; richer wording when
                  an AI key is configured.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadDigest(Boolean(digest))}
                disabled={digestLoading}
                className="btn-soft inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {digestLoading ? 'Building…' : digest ? 'Rebuild digest' : 'Build digest'}
                </span>
              </button>
            </div>

            {digestError && (
              <p role="alert" className="text-xs text-red-700">
                {digestError}
              </p>
            )}

            {digest && (
              <>
                <div className="rounded-xl border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] p-4">
                  <div className="text-xs font-semibold text-[var(--accent-text)]">
                    Action checklist
                  </div>
                  {digest.checklist.length === 0 ? (
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                      Not enough substantive responses to derive actions yet.
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1">
                      {digest.checklist.map((item) => (
                        <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-positive)]" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {([
                    { title: 'Start doing', items: digest.start },
                    { title: 'Stop or reduce', items: digest.stop },
                    { title: 'Keep doing', items: digest.keep },
                  ] as const).map((column) => (
                    <div key={column.title} className="rounded-xl border border-[var(--border)] p-3.5">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {column.title}
                      </div>
                      {column.items.length === 0 ? (
                        <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">Nothing yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {column.items.map((item, index) => (
                            <li
                              key={`${column.title}-${index}`}
                              className="rounded-lg bg-[var(--surface-subtle)] p-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]"
                            >
                              <p>{item.text}</p>
                              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                {item.theme} · {item.term}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  {digest.sampleNote} {digest.caveat} Source: {digest.source}.
                </p>
              </>
            )}
          </div>

          <PulseStaffPanel courseId={courseId} />
        </section>
      )}

      {/* Published Faculty Responses */}
      {facultyResponses.length > 0 && (
        <section className="space-y-3" aria-label="Published teaching team responses">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Shield className="h-4 w-4 text-[var(--status-positive)]" aria-hidden="true" />
            <span>Teaching Team Responses to Aggregate Feedback</span>
          </div>
          {facultyResponses.map((resp) => (
            <article
              key={resp.id}
              className="rounded-2xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)]/55 p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)]" aria-hidden="true" />
                  <span className="font-semibold text-[var(--text-primary)]">{resp.instructorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.role === 'professor' ? 'Professor' : 'Teaching Assistant'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resp.term}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                      resp.status === 'changed'
                        ? 'border-[var(--status-positive-border)] bg-[var(--status-positive-bg)] text-[var(--status-positive)]'
                        : resp.status === 'explained'
                        ? 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-secondary)]'
                        : 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]'
                    }`}
                  >
                    {resp.status === 'changed'
                      ? 'Changed'
                      : resp.status === 'explained'
                      ? 'Explained, not changing'
                      : 'Heard'}
                  </span>
                  <span className="rounded-md border border-[var(--status-positive-border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--status-positive)]">
                    Demo faculty response
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
                Theme addressed: {resp.themeAddressed}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {resp.responseText}
              </p>
            </article>
          ))}
        </section>
      )}

      {/* Professors Section */}
      {professors.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
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
                    <h4 className="font-display text-base font-semibold text-[var(--text-primary)]">
                      {prof.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Professor · {prof.term} · {prof.responseCount} responses (Demo)
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                  {prof.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{cat.category}</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--chart-primary)]"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="pt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
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
            <Users className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
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
                  <h4 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    {ta.name}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Teaching Assistant · {ta.term} · {ta.responseCount} responses (Demo)
                  </p>
                </div>

                <div className="space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                  {ta.categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{cat.category}</span>
                        <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                          {cat.score.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--chart-secondary)]"
                          style={{ width: `${(cat.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="pt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {ta.constructiveSummary}
                </p>

                <TaSectionPanel ta={ta} reviews={reviews} />
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleInstructors.length === 0 && (
        <div className="surface-card rounded-2xl p-10 text-center space-y-3">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            No instructor or TA feedback logged for {courseCode} yet
          </h3>
          <p className="mx-auto max-w-md text-xs text-[var(--text-secondary)] leading-relaxed">
            CourseGlide does not invent instructor profiles or term assignments when none have been reported or confirmed via an official term schedule feed.
          </p>
          {onOpenWriteReview && (
            <button
              type="button"
              onClick={onOpenWriteReview}
              className="btn-primary mt-2 inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Be the first to review
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Section-level view for one TA: the same aggregate themes, scoped to reviews
 * that actually named them, plus whether the pattern predates their section.
 */
const TaSectionPanel: React.FC<{ ta: InstructorProfile; reviews: Review[] }> = ({
  ta,
  reviews,
}) => {
  const [open, setOpen] = useState(false);
  const view = useMemo(() => computeTeachingTeamView(ta, reviews), [ta, reviews]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <span className="text-xs font-semibold text-[var(--text-primary)]">
          Section detail · {view.matchedReviewCount} named mention
          {view.matchedReviewCount === 1 ? '' : 's'}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-[var(--border)] px-3.5 py-3">
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">{view.note}</p>

          {view.confusionThemes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                What students found hard
              </div>
              <ul className="mt-1 space-y-1">
                {view.confusionThemes.slice(0, 3).map((theme) => (
                  <li
                    key={`ta-hard-${theme.label}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
                  >
                    <span>{theme.label}</span>
                    <span className="font-mono tabular-nums">{theme.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view.helpfulThemes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                What helped
              </div>
              <ul className="mt-1 space-y-1">
                {view.helpfulThemes.slice(0, 3).map((theme) => (
                  <li
                    key={`ta-help-${theme.label}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
                  >
                    <span>{theme.label}</span>
                    <span className="font-mono tabular-nums">{theme.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view.excerpts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-primary)]">In their words</div>
              <ul className="mt-1 space-y-1.5">
                {view.excerpts.map((excerpt) => (
                  <li
                    key={`${excerpt.term}-${excerpt.text.slice(0, 24)}`}
                    className="rounded-md bg-[var(--surface)] p-2 text-[11px] italic leading-relaxed text-[var(--text-secondary)]"
                  >
                    “{excerpt.text}”
                    <span className="ml-1 not-italic text-[var(--text-muted)]">· {excerpt.term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view.matchedReviewCount === 0 && (
            <p className="text-[11px] text-[var(--text-muted)]">
              This panel stays empty until a student names this TA in a review. Nothing is inferred
              from the course average.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

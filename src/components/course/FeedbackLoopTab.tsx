import React from 'react';
import { ArrowRight, Ear, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';
import type { FacultyResponse, FacultyResponseStatus } from '../../types/course';

interface FeedbackLoopTabProps {
  courseCode: string;
  facultyResponses: FacultyResponse[];
}

const GROUPS: Array<{
  status: FacultyResponseStatus;
  title: string;
  blurb: string;
  icon: typeof Ear;
  tone: string;
}> = [
  {
    status: 'heard',
    title: 'What we heard',
    blurb: 'Acknowledged, with no change committed yet.',
    icon: Ear,
    tone: 'var(--chart-secondary)',
  },
  {
    status: 'changed',
    title: 'What we changed',
    blurb: 'A concrete adjustment, with the term it applies to.',
    icon: Wrench,
    tone: 'var(--status-positive)',
  },
  {
    status: 'explained',
    title: "What can't change, and why",
    blurb: 'Constrained by accreditation, prerequisites, or calendar rules.',
    icon: ShieldCheck,
    tone: 'var(--text-secondary)',
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const FeedbackLoopTab: React.FC<FeedbackLoopTabProps> = ({ courseCode, facultyResponses }) => {
  const sorted = [...facultyResponses].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
          The feedback loop — {courseCode}
        </h2>
        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Every entry below is dated and attached to an aggregate theme, not to a student. This is the
          part students rarely get to see: what was heard, what is being kept, and what is actually
          changing next offering. Collecting mid-term feedback only helps when it is acted on — and
          said out loud.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-subtle)] px-2 py-1">
            <MessageSquare className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
            {facultyResponses.length} teaching-team {facultyResponses.length === 1 ? 'entry' : 'entries'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            Aggregated themes only
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
            never individual students
          </span>
        </div>
      </section>

      {sorted.length === 0 ? (
        <section className="surface-card rounded-2xl p-10 text-center">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            No teaching-team response logged yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--text-secondary)]">
            Nothing is invented here. When the teaching team posts a response on the Teaching Team
            tab, it appears in this ledger with a date and a status.
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {GROUPS.map((group) => {
            const entries = sorted.filter(
              (response) => (response.status ?? 'heard') === group.status
            );
            const Icon = group.icon;
            return (
              <section key={group.status} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]"
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: group.tone }} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[var(--text-primary)]">
                      {group.title}
                      <span className="ml-1.5 font-mono text-[11px] font-normal text-[var(--text-muted)]">
                        {entries.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">{group.blurb}</p>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-[11px] text-[var(--text-muted)]">
                    Nothing here yet.
                  </p>
                ) : (
                  entries.map((response) => (
                    <article
                      key={response.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs"
                    >
                      <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                        {response.themeAddressed}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {response.responseText}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          {response.instructorName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{response.role === 'ta' ? 'Teaching Assistant' : 'Professor'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{response.term}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{formatDate(response.updatedAt)}</span>
                      </div>
                    </article>
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

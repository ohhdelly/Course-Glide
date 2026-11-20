import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Lock, Send, Timer } from 'lucide-react';
import type { PulseAggregate } from '../../types/course';

const cardShell = 'surface-card rounded-2xl p-5 sm:p-6';

async function fetchPulse(courseId: string, week: number, term?: string): Promise<PulseAggregate | null> {
  const params = new URLSearchParams({ courseId, week: String(week) });
  if (term) params.set('term', term);
  try {
    const res = await fetch(`/api/pulse?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.pulse ?? null) as PulseAggregate | null;
  } catch {
    return null;
  }
}

export const MidTermPulseCard: React.FC<{ courseId: string; courseCode: string }> = ({
  courseId,
  courseCode,
}) => {
  const [week, setWeek] = useState(6);
  const [pulse, setPulse] = useState<PulseAggregate | null>(null);
  const [keepsWorking, setKeepsWorking] = useState('');
  const [notWorking, setNotWorking] = useState('');
  const [oneChange, setOneChange] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const next = await fetchPulse(courseId, week);
    setPulse(next);
  }, [courseId, week]);

  useEffect(() => {
    setSent(false);
    load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, week, keepsWorking, notWorking, oneChange }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Could not send your pulse.');
        return;
      }
      setSent(true);
      setKeepsWorking('');
      setNotWorking('');
      setOneChange('');
      setPulse((prev) =>
        prev
          ? {
              ...prev,
              responseCount: prev.responseCount + 1,
              promptsRemaining: data.pulse?.promptsRemaining ?? Math.max(0, prev.promptsRemaining - 1),
            }
          : prev
      );
    } catch {
      setMessage('Could not reach the pulse endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  const windowOpen = pulse?.windowOpen ?? (week >= 4 && week <= 8);
  const promptsRemaining = pulse?.promptsRemaining ?? 2;

  return (
    <section className={cardShell} aria-label="Mid-term pulse">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
            <Timer className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            Mid-term pulse — {courseCode}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Three questions, weeks 4–8, capped at two sends per term. Answers stay sealed until the
            term ends, so nobody can act on them mid-course in a way that identifies you.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>Demo week</span>
          <select
            value={week}
            onChange={(event) => setWeek(Number(event.target.value))}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)] focus:border-[var(--ring)] focus:outline-none"
            title="In a live deployment this comes from the registrar calendar; the demo lets you preview any week."
          >
            {Array.from({ length: 13 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value === 13 ? 'Finals' : `Week ${value}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-[var(--text-secondary)]">
        {pulse?.windowNote ?? 'Checking the pulse window…'}
      </p>

      {sent ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-[var(--status-positive-border)] bg-[var(--status-positive-bg)]/60 p-4 text-xs text-[var(--text-secondary)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" aria-hidden="true" />
            <span>
              Sent. Your answers are aggregated with everyone else&apos;s and stay sealed
              {pulse?.sealedUntil ? ` until ${new Date(pulse.sealedUntil).toLocaleDateString()}` : ' until the term ends'}.
              {promptsRemaining > 0
                ? ` You have ${promptsRemaining} more send${promptsRemaining === 1 ? '' : 's'} this term if something changes.`
                : ' That was your last send for this term.'}
            </span>
          </div>
          {promptsRemaining > 0 && (
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setMessage('');
              }}
              className="btn-soft inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Send another</span>
            </button>
          )}
        </div>
      ) : !windowOpen ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs text-[var(--text-secondary)]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <span>
            The pulse opens in week 4 and closes after week 8. Outside the window the form stays
            shut rather than collecting a skewed sample.
          </span>
        </div>
      ) : promptsRemaining === 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs text-[var(--text-secondary)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-positive)]" aria-hidden="true" />
          <span>You have used both of your pulses for this term. Thanks — that is the cap by design.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="pulse-keeps" className="block text-[11px] font-semibold text-[var(--text-primary)]">
              What is working right now?
            </label>
            <input
              id="pulse-keeps"
              type="text"
              value={keepsWorking}
              onChange={(event) => setKeepsWorking(event.target.value)}
              maxLength={300}
              placeholder="One sentence is enough"
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pulse-not" className="block text-[11px] font-semibold text-[var(--text-primary)]">
              What is not working?
            </label>
            <input
              id="pulse-not"
              type="text"
              value={notWorking}
              onChange={(event) => setNotWorking(event.target.value)}
              maxLength={300}
              placeholder="Be specific about the week or the assessment"
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="pulse-change" className="block text-[11px] font-semibold text-[var(--text-primary)]">
              One change you would make
            </label>
            <input
              id="pulse-change"
              type="text"
              value={oneChange}
              onChange={(event) => setOneChange(event.target.value)}
              maxLength={300}
              placeholder="The smallest change that would help"
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--ring)] focus:outline-none"
            />
          </div>

          {message && (
            <p role="alert" className="text-[11px] text-red-700">
              {message}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--text-muted)]">
              {promptsRemaining} send{promptsRemaining === 1 ? '' : 's'} left this term · answers
              aggregate only
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{submitting ? 'Sending…' : 'Send pulse'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export const PulseStaffPanel: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [term, setTerm] = useState('Fall 2025');
  const [pulse, setPulse] = useState<PulseAggregate | null>(null);

  useEffect(() => {
    let active = true;
    fetchPulse(courseId, 6, term).then((next) => {
      if (active) setPulse(next);
    });
    return () => {
      active = false;
    };
  }, [courseId, term]);

  const columns: Array<{ key: 'keepsWorking' | 'notWorking' | 'oneChange'; title: string }> = [
    { key: 'keepsWorking', title: 'Working' },
    { key: 'notWorking', title: 'Not working' },
    { key: 'oneChange', title: 'Requested change' },
  ];

  return (
    <div className="surface-card rounded-xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Mid-term pulse (aggregated)</h4>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Sealed while the term runs; themes appear only after it ends.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>Term</span>
          <select
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)] focus:border-[var(--ring)] focus:outline-none"
          >
            <option value="Fall 2025">Fall 2025 (ended)</option>
            <option value="Fall 2026">Fall 2026 (in progress)</option>
          </select>
        </label>
      </div>

      {!pulse ? (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">No pulse data available.</p>
      ) : pulse.sealed ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 text-[11px] text-[var(--text-secondary)]">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <span>
            {pulse.responseCount} response{pulse.responseCount === 1 ? '' : 's'} collected for{' '}
            {pulse.term}. Themes unlock after {pulse.sealedUntil ?? 'the term ends'} — mid-term answers
            are not shown to staff while students still have to sit the exam.
          </span>
        </div>
      ) : pulse.responseCount === 0 ? (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          No mid-term pulses were sent in {pulse.term}.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.key}>
              <div className="text-[11px] font-semibold text-[var(--text-primary)]">{column.title}</div>
              <ul className="mt-1.5 space-y-1">
                {pulse.themes[column.key].length === 0 ? (
                  <li className="text-[11px] text-[var(--text-muted)]">Nothing logged</li>
                ) : (
                  pulse.themes[column.key].map((theme) => (
                    <li
                      key={`${column.key}-${theme.label}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
                    >
                      <span>{theme.label}</span>
                      <span className="font-mono tabular-nums">{theme.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

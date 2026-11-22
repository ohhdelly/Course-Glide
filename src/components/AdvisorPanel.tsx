import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import type { AdvisorBrief, AdvisorResponse, UniversityId } from '../types/course';

interface AdvisorPanelProps {
  universityId: UniversityId;
  initialQuery?: string;
  onOpenCourse: (courseId: string) => void;
  onApplyBrief: (brief: AdvisorBrief) => void;
}

const EXAMPLE_PROMPTS = [
  'Light-workload 300-level CS elective, projects over exams',
  'Bird course with no essays and under 10 hours a week',
  'Machine learning course for third year',
];

export const AdvisorPanel: React.FC<AdvisorPanelProps> = ({
  universityId,
  initialQuery = '',
  onOpenCourse,
  onApplyBrief,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const lastQueryRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (rawQuery: string, override?: AdvisorBrief) => {
      const query = rawQuery.trim();
      if (query.length < 3) {
        setError('Describe the course you are looking for in a few words.');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastQueryRef.current = query;

      setInput(query);
      setLoading(true);
      setError(null);
      setApplied(false);

      try {
        const res = await fetch('/api/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            universityId,
            ...(override ? { briefOverride: override } : {}),
          }),
          signal: controller.signal,
        });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || 'The advisor could not complete that search.');
        }
        setData(payload as AdvisorResponse);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'The advisor could not complete that search.'
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [universityId]
  );

  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      void run(initialQuery);
    }
  }, [initialQuery, run]);

  const brief = data?.brief;

  const clearDimension = (
    key:
      | 'level'
      | 'maxHours'
      | 'maxDifficulty'
      | 'term'
      | 'wantsReviews'
      | 'subjectCodes'
      | 'excludeKeywords',
    value?: string
  ) => {
    if (!brief) return;
    const next: AdvisorBrief = { ...brief };
    if (key === 'subjectCodes') {
      next.subjectCodes = brief.subjectCodes.filter((code) => code !== value);
    } else if (key === 'excludeKeywords') {
      next.excludeKeywords = brief.excludeKeywords.filter((term) => term !== value);
    } else if (key === 'wantsReviews') {
      next.wantsReviews = false;
    } else if (key === 'level') {
      next.level = 'all';
    } else if (key === 'maxHours') {
      next.maxHours = 'all';
    } else if (key === 'maxDifficulty') {
      next.maxDifficulty = 'all';
    } else {
      next.term = 'all';
    }
    void run(lastQueryRef.current || input, next);
  };

  const isAi = data?.source === 'ai';

  return (
    <section
      aria-label="AI course advisor"
      className="mb-8 rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 shadow-surface sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-[var(--border)] bg-[var(--surface-2)]">
          <Sparkles className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
        </span>
        <h2 className="type-small font-semibold text-[var(--text)]">
          Describe the course you're looking for
        </h2>
        {data && (
          <span
            className="ml-auto rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 type-caption text-[var(--text-muted)]"
            title={
              isAi
                ? `Language model: ${data.provider ?? 'AI'} · ${data.model ?? 'configured model'}`
                : 'Ranked by the deterministic rules parser and Trust Lens statistics. No model needed.'
            }
          >
            {isAi ? 'AI-assisted' : 'Rules-based'}
          </span>
        )}
      </div>

      <p className="mt-1 type-caption text-[var(--text-muted)] text-pretty">
        Plain language is fine — workload, level, subject, what to avoid. Matches come from the
        official calendar plus real student reviews.
      </p>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void run(input);
        }}
      >
        <label htmlFor="advisor-query" className="sr-only">
          Describe your ideal course
        </label>
        <input
          id="advisor-query"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. light-workload 300-level CS elective, projects over exams"
          maxLength={600}
          className="min-h-[44px] w-full min-w-0 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 type-small text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-strong)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-control px-4 py-2 type-small font-semibold whitespace-nowrap disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{loading ? 'Matching…' : 'Find courses'}</span>
        </button>
      </form>

      {!data && !loading && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="type-caption text-[var(--text-muted)]">Try:</span>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void run(prompt)}
              className="btn-secondary inline-flex min-h-[36px] items-center rounded-control px-2.5 py-1 type-caption text-[var(--text)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 type-caption text-[var(--text)]">
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-16 animate-pulse rounded-control border border-[var(--border)] bg-[var(--surface-2)]"
            />
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="mt-4">
          <p className="type-small font-medium text-[var(--text)] text-pretty">{data.summary}</p>

          {brief && brief.constraints.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="type-caption text-[var(--text-muted)]">Understood:</span>
              {brief.level !== 'all' && (
                <Chip label={`${brief.level}-level`} onClear={() => clearDimension('level')} />
              )}
              {brief.subjectCodes.map((code) => (
                <Chip
                  key={code}
                  label={code}
                  onClear={() => clearDimension('subjectCodes', code)}
                />
              ))}
              {brief.maxHours !== 'all' && (
                <Chip
                  label={`≤${brief.maxHours} h/week`}
                  onClear={() => clearDimension('maxHours')}
                />
              )}
              {brief.maxDifficulty !== 'all' && (
                <Chip
                  label={`difficulty ≤ ${brief.maxDifficulty}/5`}
                  onClear={() => clearDimension('maxDifficulty')}
                />
              )}
              {brief.term !== 'all' && (
                <Chip label={`${brief.term} term`} onClear={() => clearDimension('term')} />
              )}
              {brief.wantsReviews && (
                <Chip
                  label="student reviews only"
                  onClear={() => clearDimension('wantsReviews')}
                />
              )}
              {brief.excludeKeywords.map((term) => (
                <Chip
                  key={`exclude-${term}`}
                  label={`no ${term}`}
                  onClear={() => clearDimension('excludeKeywords', term)}
                />
              ))}
            </div>
          )}

          {data.results.length === 0 ? (
            <div className="mt-4 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <p className="type-small font-medium text-[var(--text)]">No close matches.</p>
              <p className="mt-1 type-caption text-[var(--text-muted)]">
                Try removing a limit above, or describe the subject differently.
              </p>
            </div>
          ) : (
            <ol className="mt-3 divide-y divide-[var(--border)] rounded-control border border-[var(--border)]">
              {data.results.map((result, index) => (
                <li key={result.course.id} className="p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenCourse(result.course.id)}
                      className="min-w-0 text-left"
                    >
                      <span className="mr-2 type-small font-semibold tabular-nums text-[var(--text)]">
                        {index + 1}. {result.course.code}
                      </span>
                      <span className="type-small font-medium text-[var(--text)]">
                        {result.course.title}
                      </span>
                      <span className="mt-0.5 block type-caption text-[var(--text-muted)]">
                        {result.course.universityName} · {result.course.department}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(result.course.id)}
                      className="btn-secondary inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-control px-2.5 py-1 type-caption font-semibold"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <ul className="mt-2 space-y-1">
                    {result.rationale && (
                      <li className="type-caption text-[var(--text)]">{result.rationale}</li>
                    )}
                    {result.matchReasons.map((reason) => (
                      <li
                        key={reason}
                        className="type-caption text-[var(--text-muted)] before:mr-1 before:content-['·']"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>

                  {result.caution && (
                    <p className="mt-2 type-caption text-[var(--text)]">⚠ {result.caution}</p>
                  )}

                  {result.evidenceReviewIds.length > 0 && (
                    <p className="mt-1 type-caption text-[var(--text-muted)] tabular-nums">
                      {result.evidenceReviewIds.length} cited review
                      {result.evidenceReviewIds.length === 1 ? '' : 's'} on the course page.
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}

          {data.results.length > 0 && brief && (
            <button
              type="button"
              onClick={() => {
                onApplyBrief(brief);
                setApplied(true);
              }}
              className="btn-secondary mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-control px-3 py-2 type-caption font-semibold"
            >
              <span>{applied ? 'Filters applied below' : 'Apply these as filters'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {data.caveats.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-[var(--border)] pt-2">
              {data.caveats.map((caveat) => (
                <li key={caveat} className="type-caption text-[var(--text-muted)]">
                  {caveat}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

const Chip: React.FC<{ label: string; onClear: () => void }> = ({ label, onClear }) => (
  <button
    type="button"
    onClick={onClear}
    aria-label={`Remove ${label} from the advisor search`}
    className="inline-flex min-h-[32px] items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 type-caption font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-strong)]"
  >
    <span>{label}</span>
    <X className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
  </button>
);

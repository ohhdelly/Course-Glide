import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import type { AdvisorBrief, AdvisorResponse, UniversityId } from '../types/course';
import { advisorMatchBreakdown } from '../utils/advisorMatch';
import { explainMatch } from '../utils/scoreExplanations';
import { MatchRing } from './charts/MatchRing';
import { ScoreInfo } from './ScoreInfo';

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
      | 'excludeKeywords'
      | 'excludeSubjects',
    value?: string
  ) => {
    if (!brief) return;
    const next: AdvisorBrief = { ...brief };
    if (key === 'subjectCodes') {
      next.subjectCodes = brief.subjectCodes.filter((code) => code !== value);
    } else if (key === 'excludeKeywords') {
      next.excludeKeywords = brief.excludeKeywords.filter((term) => term !== value);
    } else if (key === 'excludeSubjects') {
      next.excludeSubjects = [];
      next.excludeSubjectsLabel = '';
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

  // Fit is scored per course against the request itself, so the list is ordered by
  // what the percentage says rather than by the backend's internal rank.
  const orderedResults = data
    ? data.results
        .map((result) => {
          // The backend ships the same breakdown it used for the percentage;
          // the local computation only covers cached responses from before it.
          const breakdown = result.matchBreakdown ?? advisorMatchBreakdown(data.brief, result);
          return { result, breakdown, percent: breakdown.percent };
        })
        .sort(
          (a, b) =>
            b.percent - a.percent ||
            a.result.course.code.localeCompare(b.result.course.code, 'en', { numeric: true })
        )
    : [];

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
            className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 type-caption text-[var(--text-muted)] sm:ml-auto"
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="result-count">
              {orderedResults.length} match{orderedResults.length === 1 ? '' : 'es'}
            </span>
            {brief && brief.constraints.length > 0 && (
              <>
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
                {brief.excludeSubjectsLabel && (
                  <Chip
                    label={`no ${brief.excludeSubjectsLabel}`}
                    onClear={() => clearDimension('excludeSubjects')}
                  />
                )}
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
              </>
            )}

            {orderedResults.length > 0 && brief && (
              <button
                type="button"
                onClick={() => {
                  onApplyBrief(brief);
                  setApplied(true);
                }}
                className="ml-auto inline-flex min-h-[32px] items-center gap-1 rounded-control px-2 type-caption font-semibold text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text)] hover:underline"
              >
                <span>{applied ? 'Filters applied' : 'Apply as filters'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {orderedResults.length === 0 ? (
            <div className="mt-3 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <p className="type-small font-medium text-[var(--text)]">No close matches.</p>
              <p className="mt-1 type-caption text-[var(--text-muted)]">
                Remove a limit above and try again.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {orderedResults.map(({ result, breakdown, percent }) => {
                const hasReviews = result.stats.responseCount > 0;
                return (
                  <li key={result.course.id}>
                    <article className="result-row flex items-center gap-3 rounded-control px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="chip-code rounded-nested px-1.5 py-0.5 type-caption font-semibold tabular-nums">
                            {result.course.code}
                          </span>
                          {universityId === 'all' && (
                            <span className="type-caption text-[var(--text-muted)]">
                              {result.course.universityName}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenCourse(result.course.id)}
                          className="mt-1 block w-full min-w-0 line-clamp-2 text-left type-small font-semibold text-[var(--text)] hover:underline"
                        >
                          {result.course.title}
                        </button>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {hasReviews ? (
                            <>
                              <span className="metric-pill">
                                {result.stats.avgWeeklyHours.toFixed(1)} h/wk
                              </span>
                              <span className="metric-pill">
                                {Math.round(result.stats.recommendationRate)}% recommend
                              </span>
                            </>
                          ) : (
                            <span className="metric-pill">No reviews yet</span>
                          )}
                          {result.caution && (
                            <span className="metric-pill" title={result.caution}>
                              ! Outside a limit
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <MatchRing percent={percent} />
                        <ScoreInfo
                          compact
                          align="right"
                          explanation={explainMatch(breakdown)}
                          request={{
                            courseId: result.course.id,
                            score: 'match',
                            brief: data?.brief,
                            cautionApplied: breakdown.cautionApplied,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => onOpenCourse(result.course.id)}
                          aria-label={`Open ${result.course.code}`}
                          className="btn-secondary inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-control"
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
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

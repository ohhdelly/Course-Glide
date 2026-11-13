import React, { useMemo, useState } from 'react';
import { BookOpenCheck, Compass, Info } from 'lucide-react';
import type { CourseStats, Review, StudyPreference } from '../../types/course';
import { computeStudyFit, rankAndFilterReviews } from '../../utils/trustLens';

interface StudyStrategiesTabProps {
  courseCode: string;
  stats: CourseStats;
  reviews: Review[];
  onJumpToReview: (reviewId: string) => void;
  onOpenWriteReview?: () => void;
}

const PREFERENCE_OPTIONS: Array<{ id: StudyPreference; label: string }> = [
  { id: 'all', label: 'All Study Approaches' },
  { id: 'independent', label: 'Independent Practice' },
  { id: 'collaborative', label: 'Collaborative & Tutorials' },
  { id: 'structured_notes', label: 'Structured Lectures & Readings' },
  { id: 'visual', label: 'Visual Mapping & Recall' },
];

export const StudyStrategiesTab: React.FC<StudyStrategiesTabProps> = ({
  courseCode,
  stats,
  reviews,
  onJumpToReview,
  onOpenWriteReview,
}) => {
  const [preference, setPreference] = useState<StudyPreference>('all');

  const enrichedReviews = useMemo(
    () => rankAndFilterReviews(reviews, 'most_informative', 'all'),
    [reviews]
  );

  const studyFit = useMemo(
    () => computeStudyFit(preference, stats, enrichedReviews),
    [preference, stats, enrichedReviews]
  );

  const displayedStrategies =
    preference === 'all'
      ? stats.studyStrategyStats
      : stats.studyStrategyStats.filter((s) => s.preferenceCategory === preference);

  if (stats.responseCount === 0) {
    return (
      <section className="surface-card rounded-2xl p-10 text-center space-y-3">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent-text)]">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
          No study strategy reports yet for {courseCode}
        </h2>
        <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
          Once students share which study habits helped them succeed in {courseCode}, exact
          respondent counts and advice excerpts will appear here.
        </p>
        {onOpenWriteReview && (
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary mt-2 inline-flex items-center rounded-xl px-5 py-2.5 text-xs font-semibold"
          >
            Be the first to review
          </button>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Study Preference Filter + Study Fit Panel */}
      <section className="surface-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--surface-accent)] text-[var(--accent-text)]">
                <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Study Strategies & Preparation Fit
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Filter student-reported preparation habits for {courseCode} by your preferred way of
              studying.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter by study preference"
            className="flex flex-wrap gap-2"
          >
            {PREFERENCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreference(opt.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  preference === opt.id
                    ? 'btn-primary border-transparent shadow-xs'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Fit Insight Box */}
        <div className="rounded-xl border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)]/65 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-code)]">
            <Compass className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            <span>Study Fit Insight</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{studyFit.headline}</p>

          {studyFit.supportingExcerpts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[var(--border)]">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">
                Relevant advice from matching student reviews:
              </div>
              <ul className="space-y-2">
                {studyFit.supportingExcerpts.map((ex) => (
                  <li key={ex.reviewId} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                    “{ex.advice}”{' '}
                    <button
                      type="button"
                      onClick={() => onJumpToReview(ex.reviewId)}
                      className="font-semibold text-[var(--accent-text)] hover:underline ml-1"
                    >
                      ({ex.authorAlias} · {ex.term})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{studyFit.disclaimer}</span>
          </div>
        </div>
      </section>

      {/* Quantitative Helpfulness Breakdown */}
      <section className="surface-card rounded-2xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
              Reported Strategy Usage & Helpfulness
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Every figure reports exact respondent counts alongside the share who found it helpful.
            </p>
          </div>
          <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
            {displayedStrategies.length} strategies tracked
          </span>
        </div>

        {displayedStrategies.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
            No respondents have logged this specific study category for {courseCode} yet.
          </p>
        ) : (
          <div className="space-y-3.5">
            {displayedStrategies.map((stat) => (
              <div
                key={stat.key}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{stat.label}</span>
                  <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                    <strong className="font-mono font-semibold text-[var(--accent-text)]">
                      {stat.helpfulPercentage}%
                    </strong>{' '}
                    of{' '}
                    <strong className="font-mono font-semibold text-[var(--text-primary)]">
                      {stat.usedCount}
                    </strong>{' '}
                    respondent{stat.usedCount === 1 ? '' : 's'} who used this reported finding it
                    helpful
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--chart-primary)] transition-all duration-300"
                    style={{ width: `${stat.helpfulPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

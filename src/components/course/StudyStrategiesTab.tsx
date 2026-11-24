import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import type { CourseStats, Review, StudyPreference } from '../../types/course';
import { computeStudyFit, rankAndFilterReviews } from '../../utils/trustLens';
import { explainStudyMethod } from '../../utils/scoreExplanations';
import { ScoreInfo } from '../ScoreInfo';
import { CollapsibleText } from './CollapsibleText';

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
      <section className="surface-card rounded-card p-8 text-center space-y-3">
        <h2 className="type-h2 text-[var(--text)]">
          No study strategy reports yet for {courseCode}
        </h2>
        {onOpenWriteReview && (
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary mt-2 inline-flex min-h-[44px] items-center rounded-control px-6 py-2 text-xs font-semibold"
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
      <section className="surface-card rounded-card p-4 sm:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="type-h2 text-[var(--text)]">
              Study Strategies &amp; Preparation Fit
            </h2>
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
                aria-pressed={preference === opt.id}
                onClick={() => setPreference(opt.id)}
                className={`inline-flex min-h-[44px] items-center rounded-control border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  preference === opt.id
                    ? 'btn-primary shadow-surface'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:border-[var(--accent-strong)] hover:text-[var(--text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Fit Insight Box */}
        <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-6 space-y-3">
          <div className="text-xs font-semibold text-[var(--text)]">
            Study Fit Insight
          </div>
          <p className="text-sm font-medium text-[var(--text)]">{studyFit.headline}</p>

          {studyFit.supportingExcerpts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[var(--border)]">
              <div className="text-xs font-semibold text-[var(--text-muted)]">
                Advice from matching student reviews:
              </div>
              <ul className="space-y-2">
                {studyFit.supportingExcerpts.map((ex) => (
                  <li
                    key={ex.reviewId}
                    className="rounded-[4px] bg-[var(--surface)] border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)]"
                  >
                    <CollapsibleText
                      text={`“${ex.advice}”`}
                      className="text-xs text-[var(--text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => onJumpToReview(ex.reviewId)}
                      className="mt-1 inline-flex min-h-[36px] items-center rounded-[2px] px-1 font-semibold text-[var(--text)] hover:underline"
                    >
                      Source: {ex.authorAlias} · {ex.term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{studyFit.disclaimer}</span>
          </div>
        </div>
      </section>

      {/* Quantitative Helpfulness Breakdown */}
      <section className="surface-card rounded-card p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-semibold text-[var(--text)]">
              Reported Strategy Usage &amp; Helpfulness
            </h3>
          </div>
          <span className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)] tabular-nums">
            {displayedStrategies.length} strategies tracked
          </span>
        </div>

        {displayedStrategies.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">
            No respondents have logged this specific study category for {courseCode} yet.
          </p>
        ) : (
          <div className="space-y-3">
            {displayedStrategies.map((stat) => (
              <div
                key={stat.key}
                className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{stat.label}</span>
                  <div className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] tabular-nums">
                    <ScoreInfo
                      compact
                      align="right"
                      explanation={explainStudyMethod(stat, stats)}
                    />
                    <strong className="font-semibold text-[var(--text)]">
                      {stat.helpfulPercentage}%
                    </strong>{' '}
                    of{' '}
                    <strong className="font-semibold text-[var(--text)]">
                      {stat.usedCount}
                    </strong>{' '}
                    respondent{stat.usedCount === 1 ? '' : 's'} who used this reported finding it
                    helpful
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-[4px] bg-[var(--surface)]">
                  <div
                    className="h-full rounded-[2px] bg-[var(--chart)] transition-all duration-300"
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


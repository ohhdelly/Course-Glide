import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import type { Review, TrustLensMode } from '../../types/course';
import { rankAndFilterReviews } from '../../utils/trustLens';
import { ReviewCard } from './ReviewCard';

interface StudentReviewsTabProps {
  reviews: Review[];
  highlightReviewId?: string;
  userVotes: Record<string, 'helpful' | 'not_helpful'>;
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onReport: (reviewId: string) => void;
  onOpenWriteReview: () => void;
}

export const StudentReviewsTab: React.FC<StudentReviewsTabProps> = ({
  reviews,
  highlightReviewId,
  userVotes,
  onVote,
  onReport,
  onOpenWriteReview,
}) => {
  const [trustMode, setTrustMode] = useState<TrustLensMode>(
    highlightReviewId ? 'all' : 'most_informative'
  );
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'recommended' | 'critical'>(
    'all'
  );
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const visibleAllCount = useMemo(
    () => reviews.filter((r) => r.moderationStatus !== 'hidden').length,
    [reviews]
  );

  const displayedReviews = useMemo(
    () => rankAndFilterReviews(reviews, trustMode, sentimentFilter),
    [reviews, trustMode, sentimentFilter]
  );

  const hiddenLowInfoCount =
    trustMode === 'most_informative'
      ? Math.max(0, visibleAllCount - displayedReviews.length)
      : 0;

  return (
    <div className="space-y-5">
      {/* CourseGlide Trust Lens Control Bar */}
      <section
        aria-label="CourseGlide Trust Lens controls"
        className="surface-card rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                CourseGlide Trust Lens
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Surfaces specific, helpful reviews first while keeping valid criticism visible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Trust Lens Mode Selector */}
            <div
              role="group"
              aria-label="Trust Lens ranking mode"
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
            >
              <button
                type="button"
                onClick={() => setTrustMode('most_informative')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'most_informative'
                    ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                Most Informative
              </button>
              <button
                type="button"
                onClick={() => setTrustMode('most_recent')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'most_recent'
                    ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                Most Recent
              </button>
              <button
                type="button"
                onClick={() => setTrustMode('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'all'
                    ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                All Reviews ({visibleAllCount})
              </button>
            </div>

            {/* Sentiment Filter */}
            <label htmlFor="review-sentiment-filter" className="sr-only">
              Filter reviews by recommendation
            </label>
            <select
              id="review-sentiment-filter"
              aria-label="Filter reviews by recommendation"
              value={sentimentFilter}
              onChange={(e) =>
                setSentimentFilter(e.target.value as 'all' | 'recommended' | 'critical')
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)]"
            >
              <option value="all">All Perspectives</option>
              <option value="recommended">Recommended Only</option>
              <option value="critical">Critical / Not Recommended</option>
            </select>
          </div>
        </div>

        {/* Status Summary & How Trust Lens Works Disclosure */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3.5 border-t border-[var(--border)] text-xs">
          <span className="text-[var(--text-secondary)] tabular-nums">
            Showing <strong className="font-semibold text-[var(--text-primary)]">{displayedReviews.length}</strong>{' '}
            review{displayedReviews.length === 1 ? '' : 's'}
            {hiddenLowInfoCount > 0 && sentimentFilter === 'all' && (
              <span className="text-[var(--text-muted)]">
                {' '}
                · {hiddenLowInfoCount} brief or duplicate{' '}
                {hiddenLowInfoCount === 1 ? 'entry' : 'entries'} hidden (switch to All Reviews to view)
              </span>
            )}
          </span>

          <button
            type="button"
            aria-expanded={showHowItWorks}
            onClick={() => setShowHowItWorks((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[var(--accent-text)] transition-colors hover:bg-[var(--surface-accent)]"
          >
            <span>How Trust Lens works</span>
            {showHowItWorks ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {showHowItWorks && (
          <div className="mt-3 rounded-xl border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)]/75 p-4 text-xs leading-relaxed text-[var(--text-secondary)] space-y-2">
            <p>
              <strong className="font-semibold text-[var(--text-primary)]">Transparent signal evaluation:</strong>{' '}
              Trust Lens scores each submission on course-specific detail (references to assessments,
              lectures, grading, or workload), concrete examples of what worked and what was challenging,
              actionable study advice, recency, community helpfulness votes, and repetition/duplicate checks.
            </p>
            <p>
              <strong className="font-semibold text-[var(--text-primary)]">Fairness guarantee:</strong>{' '}
              Trust Lens never assumes positive reviews are truthful or negative reviews are biased.
              Detailed criticism receives high context scores just like detailed praise. Trust Lens
              measures informational utility, not absolute truth.
            </p>
          </div>
        )}
      </section>

      {/* Review List */}
      {visibleAllCount === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            No student reviews yet.
          </h3>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Share concrete insights about assessments, workload, and preparation strategies to help future students.
          </p>
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary mt-5 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-xs"
          >
            Be the first to review
          </button>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            No reviews match this filter selection
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Try switching to All Reviews or All Perspectives, or contribute your own experience.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTrustMode('all');
                setSentimentFilter('all');
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
            >
              Show all reviews
            </button>
            <button
              type="button"
              onClick={onOpenWriteReview}
              className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Write a review
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              highlighted={highlightReviewId === review.id}
              userVote={userVotes[review.id]}
              onVote={onVote}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

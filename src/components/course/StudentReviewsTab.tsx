import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Review } from '../../types/course';
import {
  sortAndFilterReviews,
  type ReviewRatingFilter,
  type ReviewSortBy,
} from '../../utils/trustLens';
import { ReviewCard } from './ReviewCard';
import { TrustLensInfo } from './TrustLensInfo';

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
  const [sortBy, setSortBy] = useState<ReviewSortBy>('trust_lens');
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>('all');
  const [includeLimited, setIncludeLimited] = useState<boolean>(
    Boolean(highlightReviewId)
  );

  const {
    displayed: displayedReviews,
    totalVisible,
    hiddenLimitedCount,
    avgTrustScore,
    informativeCount,
  } = useMemo(
    () =>
      sortAndFilterReviews(reviews, {
        sortBy,
        ratingFilter,
        includeLimited: includeLimited || Boolean(highlightReviewId),
      }),
    [reviews, sortBy, ratingFilter, includeLimited, highlightReviewId]
  );

  const trustSummaryLabel =
    avgTrustScore >= 70
      ? 'High detail'
      : avgTrustScore >= 45
      ? 'Moderate detail'
      : 'Limited detail';

  return (
    <div className="space-y-4">
      {/* Visually Distinct Trust Lens Banner + Sort & Filter Controls */}
      <section
        aria-label="Trust Lens and review controls"
        className="surface-tinted rounded-card p-4 sm:p-6 space-y-4"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[var(--chart)] shrink-0" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--text)]">Trust Lens</h2>
              {totalVisible > 0 && (
                <>
                  <span className="inline-flex items-center rounded-control bg-[var(--accent)] px-2.5 py-0.5 text-xs font-semibold text-[var(--on-accent)] tabular-nums">
                    {avgTrustScore}/100 · {trustSummaryLabel}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
                    {informativeCount} of {totalVisible} detailed
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm text-[var(--text-muted)]">
                Highlights specific, evidence-backed reviews first — positive and negative ratings score equally.
              </p>
              <TrustLensInfo />
            </div>
          </div>

          {/* Simple Sort & Rating Filter Controls */}
          {totalVisible > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-end shrink-0">
              <div>
                <label
                  htmlFor="review-sort-select"
                  className="block text-xs font-semibold text-[var(--text)] mb-1"
                >
                  Sort by
                </label>
                <select
                  id="review-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ReviewSortBy)}
                  className="min-h-[44px] w-full lg:w-48 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] focus:border-[var(--accent-strong)]"
                >
                  <option value="trust_lens">Trust Lens (Best detail)</option>
                  <option value="most_helpful">Most helpful</option>
                  <option value="most_recent">Most recent</option>
                  <option value="rating_desc">Rating: Hardest first</option>
                  <option value="rating_asc">Rating: Easiest first</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="review-rating-filter"
                  className="block text-xs font-semibold text-[var(--text)] mb-1"
                >
                  Filter by rating
                </label>
                <select
                  id="review-rating-filter"
                  value={ratingFilter}
                  onChange={(e) =>
                    setRatingFilter(e.target.value as ReviewRatingFilter)
                  }
                  className="min-h-[44px] w-full lg:w-48 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] focus:border-[var(--accent-strong)]"
                >
                  <option value="all">All ratings</option>
                  <option value="recommended">Recommended</option>
                  <option value="critical">Not recommended</option>
                  <option value="difficulty_low">Difficulty 1–2 (Manageable)</option>
                  <option value="difficulty_mid">Difficulty 3 (Moderate)</option>
                  <option value="difficulty_high">Difficulty 4–5 (Demanding)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Count Summary & Brief/Duplicate Toggle */}
        {totalVisible > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs">
            <span className="text-[var(--text-muted)] tabular-nums">
              Showing{' '}
              <strong className="font-semibold text-[var(--text)]">
                {displayedReviews.length}
              </strong>{' '}
              of {totalVisible} review{totalVisible === 1 ? '' : 's'}
              {hiddenLimitedCount > 0 && (
                <span>
                  {' '}
                  · {hiddenLimitedCount} brief or duplicate hidden
                </span>
              )}
            </span>

            {(hiddenLimitedCount > 0 || includeLimited) && (
              <button
                type="button"
                aria-pressed={includeLimited}
                onClick={() => setIncludeLimited((v) => !v)}
                className="btn-secondary inline-flex min-h-[36px] items-center rounded-control px-3 py-1 text-xs font-semibold"
              >
                {includeLimited
                  ? 'Hide brief & duplicate entries'
                  : `Show all (${totalVisible})`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Review List */}
      {totalVisible === 0 ? (
        <div className="surface-card rounded-card p-8 text-center">
          <h3 className="text-base font-semibold text-[var(--text)]">
            No student reviews yet.
          </h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Share assessment details, weekly hours, and study tips to help students choosing this course.
          </p>
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary mt-4 inline-flex min-h-[44px] items-center rounded-control px-6 py-2 text-xs font-semibold shadow-surface"
          >
            Be the first to review
          </button>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="surface-card rounded-card p-8 text-center">
          <h3 className="text-base font-semibold text-[var(--text)]">
            No reviews match this rating filter
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Reset the rating filter to view all reviews for this course.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRatingFilter('all');
                setIncludeLimited(true);
              }}
              className="btn-secondary inline-flex min-h-[44px] items-center rounded-control px-4 py-2 text-xs font-semibold"
            >
              Show all reviews
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



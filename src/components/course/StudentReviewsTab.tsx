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
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
              <h2 className="font-display text-base font-bold text-slate-900">
                CourseGlide Trust Lens
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Prioritize course-specific, actionable reviews while keeping legitimate critical
              perspectives visible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Trust Lens Mode Selector */}
            <div
              role="group"
              aria-label="Trust Lens ranking mode"
              className="inline-flex rounded-xl border border-slate-200/80 bg-[#E6ECF4] p-1"
            >
              <button
                type="button"
                onClick={() => setTrustMode('most_informative')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'most_informative'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Most Informative
              </button>
              <button
                type="button"
                onClick={() => setTrustMode('most_recent')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'most_recent'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Most Recent
              </button>
              <button
                type="button"
                onClick={() => setTrustMode('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  trustMode === 'all'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
              className="rounded-xl border border-slate-200 bg-[#F7F9FC] px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              <option value="all">All Perspectives</option>
              <option value="recommended">Recommended Only</option>
              <option value="critical">Critical / Not Recommended</option>
            </select>
          </div>
        </div>

        {/* Status Summary & How Trust Lens Works Disclosure */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3.5 border-t border-slate-100 text-xs">
          <span className="text-slate-600 tabular-nums">
            Showing <strong className="font-semibold text-slate-900">{displayedReviews.length}</strong>{' '}
            review{displayedReviews.length === 1 ? '' : 's'}
            {hiddenLowInfoCount > 0 && sentimentFilter === 'all' && (
              <span className="text-slate-500">
                {' '}
                · {hiddenLowInfoCount} low-specificity or duplicate{' '}
                {hiddenLowInfoCount === 1 ? 'entry' : 'entries'} filtered out (switch to All Reviews to inspect)
              </span>
            )}
          </span>

          <button
            type="button"
            aria-expanded={showHowItWorks}
            onClick={() => setShowHowItWorks((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-50/80 hover:text-blue-800"
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
          <div className="mt-3 rounded-xl border border-blue-200/65 bg-[#F4F8FD] p-4 text-xs leading-relaxed text-slate-700 space-y-2">
            <p>
              <strong className="font-semibold text-slate-900">Transparent signal evaluation:</strong>{' '}
              Trust Lens scores each submission on course-specific detail (references to assessments,
              lectures, grading, or workload), concrete examples of what worked and what was challenging,
              actionable study advice, recency, community helpfulness votes, and repetition/duplicate checks.
            </p>
            <p>
              <strong className="font-semibold text-slate-900">Fairness guarantee:</strong>{' '}
              Trust Lens never assumes positive reviews are truthful or negative reviews are biased.
              Detailed criticism receives high context scores just like detailed praise. Trust Lens
              measures informational utility, not absolute truth.
            </p>
          </div>
        )}
      </section>

      {/* Review List */}
      {displayedReviews.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <h3 className="font-display text-base font-semibold text-slate-900">
            No reviews match this filter selection
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Try switching to All Reviews or All Perspectives, or contribute your own experience.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTrustMode('all');
                setSentimentFilter('all');
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F5F8FC]"
            >
              Show all reviews
            </button>
            <button
              type="button"
              onClick={onOpenWriteReview}
              className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
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

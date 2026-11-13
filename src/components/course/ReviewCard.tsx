import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import type { EnrichedReview } from '../../types/course';
import {
  extractReviewHighlightSegments,
  STUDY_METHOD_CATALOG,
} from '../../utils/trustLens';

interface ReviewCardProps {
  review: EnrichedReview;
  highlighted?: boolean;
  userVote?: 'helpful' | 'not_helpful';
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onReport: (reviewId: string) => void;
}

const HighlightedReviewText: React.FC<{ text: string }> = ({ text }) => {
  const segments = extractReviewHighlightSegments(text);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.category ? (
          <mark
            key={idx}
            className="rounded-xs bg-[var(--highlight-bg)] px-0.5 font-medium text-[var(--highlight-text)]"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  highlighted = false,
  userVote,
  onVote,
  onReport,
}) => {
  const isLimited = review.trustLens.tier === 'limited';
  const [expanded, setExpanded] = useState(highlighted);

  useEffect(() => {
    if (highlighted) setExpanded(true);
  }, [highlighted]);

  const hasExpandedDetails =
    review.whatWorkedWell.trim().length > 0 ||
    review.whatWasChallenging.trim().length > 0 ||
    review.practicalAdvice.trim().length > 0 ||
    review.studyMethods.length > 0;

  const utilitySummary = isLimited
    ? review.trustLens.signals.isDuplicateOrRepetitive
      ? 'Possible duplicate · Limited context'
      : 'Brief entry · Limited context'
    : !review.recommended && review.trustLens.labels.includes('Balanced Critique')
    ? 'Balanced critique · Course-specific'
    : review.trustLens.tier === 'most_informative'
    ? 'Detailed & course-specific'
    : 'Standard student review';

  return (
    <article
      id={`review-${review.id}`}
      className={`rounded-2xl p-5 sm:p-6 transition-all ${
        highlighted
          ? 'surface-card border-[var(--ring)] ring-2 ring-[var(--ring-soft)]'
          : isLimited
          ? 'border border-[var(--border)] bg-[var(--surface-subtle)] shadow-xs'
          : 'surface-card'
      }`}
    >
      {/* Top Header Metadata & Essential Ratings */}
      <div className="flex flex-col justify-between gap-3 pb-3.5 border-b border-[var(--border)] sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{review.term}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[var(--text-primary)]">{review.instructorName}</span>
            {review.taName && (
              <>
                <span aria-hidden="true">·</span>
                <span>TA: {review.taName}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="text-[var(--text-muted)]">{review.authorAlias}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            <span
              className={`font-semibold ${
                isLimited ? 'text-[var(--status-warning)]' : 'text-[var(--status-positive)]'
              }`}
            >
              {utilitySummary}
            </span>
            <span aria-hidden="true" className="text-[var(--border-strong)]">
              ·
            </span>
            <span className="font-mono text-[var(--text-muted)] tabular-nums">
              Context {review.trustLens.score}/100
            </span>
          </div>
        </div>

        {/* Essential Metrics (Plain typography + status icon+text) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs shrink-0">
          <span className="font-mono text-[var(--text-secondary)] tabular-nums">
            Difficulty <strong className="font-bold text-[var(--text-primary)]">{review.difficulty}/5</strong>
          </span>
          <span aria-hidden="true" className="text-[var(--border-strong)]">
            ·
          </span>
          <span className="font-mono text-[var(--text-secondary)] tabular-nums">
            <strong className="font-bold text-[var(--text-primary)]">{review.weeklyHours}</strong> hrs/wk
          </span>
          <span aria-hidden="true" className="text-[var(--border-strong)]">
            ·
          </span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              review.recommended ? 'text-[var(--status-positive)]' : 'text-[var(--status-warning)]'
            }`}
          >
            {review.recommended ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
                <span>Recommended</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-[var(--status-warning)] shrink-0" aria-hidden="true" />
                <span>Not recommended</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Primary Summary (Consistent Readable Typography) */}
      <div className="mt-3.5">
        <p className="text-[15px] leading-relaxed text-[var(--text-primary)]">
          <HighlightedReviewText text={review.overallExperience} />
        </p>

        {/* Progressive Disclosure: Full Structured Details */}
        {expanded && hasExpandedDetails && (
          <div className="mt-4 space-y-3 pt-4 border-t border-[var(--border)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {review.whatWorkedWell.trim().length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">What worked well</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    <HighlightedReviewText text={review.whatWorkedWell} />
                  </p>
                </div>
              )}
              {review.whatWasChallenging.trim().length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">What was challenging</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    <HighlightedReviewText text={review.whatWasChallenging} />
                  </p>
                </div>
              )}
            </div>

            {review.practicalAdvice.trim().length > 0 && (
              <div className="rounded-xl border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)]/85 p-3.5">
                <div className="text-xs font-semibold text-[var(--accent-code)]">
                  Practical advice for future students
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">
                  <HighlightedReviewText text={review.practicalAdvice} />
                </p>
              </div>
            )}

            {review.studyMethods.length > 0 && (
              <div className="text-xs text-[var(--text-secondary)] pt-0.5">
                <span className="font-semibold text-[var(--text-primary)] mr-1.5">Study methods used:</span>
                <span>
                  {review.studyMethods
                    .map((m) => STUDY_METHOD_CATALOG[m]?.label ?? m)
                    .join(' · ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions: Expand Details + Helpful Voting + Reporting */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2">
          {hasExpandedDetails && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="btn-soft inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span>{expanded ? 'Hide details' : 'Read full review'}</span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onVote(review.id, 'helpful')}
            aria-pressed={userVote === 'helpful'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              userVote === 'helpful'
                ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Helpful</span>
            <span className="font-mono tabular-nums text-[var(--text-muted)]">
              ({review.helpfulVotes})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onVote(review.id, 'not_helpful')}
            aria-pressed={userVote === 'not_helpful'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              userVote === 'not_helpful'
                ? 'border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text-primary)] shadow-xs font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Not helpful</span>
            <span className="font-mono tabular-nums text-[var(--text-muted)]">
              ({review.notHelpfulVotes})
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onReport(review.id)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Report</span>
        </button>
      </div>
    </article>
  );
};

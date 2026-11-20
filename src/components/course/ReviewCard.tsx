import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import type { EnrichedReview } from '../../types/course';
import {
  extractReviewHighlightSegments,
  STUDY_METHOD_CATALOG,
} from '../../utils/trustLens';
import { CollapsibleText } from './CollapsibleText';
import { TrustLensInfo } from './TrustLensInfo';

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
            className="rounded bg-[var(--surface-2)] px-1 font-medium text-[var(--text)] underline decoration-[var(--chart)] decoration-2 underline-offset-2"
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

  const tierLabel = isLimited
    ? review.trustLens.signals.isDuplicateOrRepetitive
      ? 'Duplicate'
      : 'Brief'
    : review.trustLens.tier === 'most_informative'
    ? 'High detail'
    : 'Standard';

  return (
    <article
      id={`review-${review.id}`}
      className={`surface-card rounded-card p-4 sm:p-6 transition-colors ${
        highlighted ? 'border-2 border-[var(--accent-strong)]' : ''
      }`}
    >
      {/* Consistent Top Header: Term + Context on Left, Rating Metrics on Right */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-muted)] min-w-0">
          <span className="font-semibold text-[var(--text)]">{review.term}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-[var(--text)]">{review.instructorName}</span>
          {review.taName && (
            <>
              <span aria-hidden="true">·</span>
              <span>TA: {review.taName}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{review.authorAlias}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs shrink-0">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              review.recommended ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {review.recommended ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[var(--text)] shrink-0" aria-hidden="true" />
                <span>Recommended</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <span>Not recommended</span>
              </>
            )}
          </span>
          <span aria-hidden="true" className="text-[var(--border)]">
            ·
          </span>
          <span className="text-[var(--text-muted)] tabular-nums">
            Difficulty <strong className="font-semibold text-[var(--text)]">{review.difficulty}/5</strong>
          </span>
          <span aria-hidden="true" className="text-[var(--border)]">
            ·
          </span>
          <span className="text-[var(--text-muted)] tabular-nums">
            <strong className="font-semibold text-[var(--text)]">{review.weeklyHours}</strong> hrs/wk
          </span>
        </div>
      </div>

      {/* Visually Distinct Trust Lens Strip (<5s scan) */}
      <div className="mt-3 flex flex-col gap-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0 text-xs">
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-semibold text-[var(--text)] tabular-nums shrink-0">
            <ShieldCheck className="h-4 w-4 text-[var(--chart)] shrink-0" aria-hidden="true" />
            <span>Trust {review.trustLens.score}/100</span>
            <span className="text-[var(--text-muted)] font-medium">· {tierLabel}</span>
          </span>
          <span className="text-[var(--text-muted)] truncate">
            {review.trustLens.explanation}
          </span>
        </div>

        <div className="shrink-0">
          <TrustLensInfo evaluation={review.trustLens} align="right" />
        </div>
      </div>

      {/* Short Text (Collapsed After 4 Lines) */}
      <div className="mt-3">
        <CollapsibleText
          maxLines={4}
          text={review.overallExperience}
          className="text-sm text-[var(--text)]"
          renderContent={(t) => <HighlightedReviewText text={t} />}
        />

        {/* Structured Details Disclosure */}
        {expanded && hasExpandedDetails && (
          <div className="mt-4 space-y-3 pt-4 border-t border-[var(--border)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {review.whatWorkedWell.trim().length > 0 && (
                <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="text-xs font-semibold text-[var(--text)]">What worked well</div>
                  <CollapsibleText
                    maxLines={4}
                    text={review.whatWorkedWell}
                    className="mt-1 text-sm text-[var(--text-muted)]"
                    renderContent={(t) => <HighlightedReviewText text={t} />}
                  />
                </div>
              )}
              {review.whatWasChallenging.trim().length > 0 && (
                <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="text-xs font-semibold text-[var(--text)]">What was challenging</div>
                  <CollapsibleText
                    maxLines={4}
                    text={review.whatWasChallenging}
                    className="mt-1 text-sm text-[var(--text-muted)]"
                    renderContent={(t) => <HighlightedReviewText text={t} />}
                  />
                </div>
              )}
            </div>

            {review.practicalAdvice.trim().length > 0 && (
              <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="text-xs font-semibold text-[var(--text)]">
                  Practical advice for future students
                </div>
                <CollapsibleText
                  maxLines={4}
                  text={review.practicalAdvice}
                  className="mt-1 text-sm text-[var(--text)]"
                  renderContent={(t) => <HighlightedReviewText text={t} />}
                />
              </div>
            )}

            {review.studyMethods.length > 0 && (
              <div className="text-xs text-[var(--text-muted)] pt-1">
                <span className="font-semibold text-[var(--text)] mr-2">Study methods used:</span>
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

      {/* Consistent Footer: Helpful Votes + Details Toggle + Report */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-3 border-t border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(review.id, 'helpful')}
            aria-pressed={userVote === 'helpful'}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
              userVote === 'helpful'
                ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] shadow-surface font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            <span>Helpful</span>
            <span className="tabular-nums">({review.helpfulVotes})</span>
          </button>

          <button
            type="button"
            onClick={() => onVote(review.id, 'not_helpful')}
            aria-pressed={userVote === 'not_helpful'}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-control border px-3 py-2 text-xs font-medium transition-colors ${
              userVote === 'not_helpful'
                ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] shadow-surface font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
            }`}
          >
            <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            <span>Not helpful</span>
            <span className="tabular-nums">({review.notHelpfulVotes})</span>
          </button>

          {hasExpandedDetails && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 text-xs font-semibold"
            >
              <span>{expanded ? 'Hide details' : 'Read full review'}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onReport(review.id)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          <span>Report</span>
        </button>
      </div>
    </article>
  );
};



import React from 'react';
import {
  CheckCircle2,
  Flag,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import type { EnrichedReview } from '../../types/course';
import { STUDY_METHOD_CATALOG } from '../../utils/trustLens';

interface ReviewCardProps {
  review: EnrichedReview;
  highlighted?: boolean;
  userVote?: 'helpful' | 'not_helpful';
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onReport: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  highlighted = false,
  userVote,
  onVote,
  onReport,
}) => {
  const isLimited = review.trustLens.tier === 'limited';

  return (
    <article
      id={`review-${review.id}`}
      className={`rounded-2xl p-5 sm:p-6 transition-all ${
        highlighted
          ? 'surface-card border-blue-600 ring-2 ring-blue-600/20'
          : isLimited
          ? 'border border-slate-200/80 bg-[#F8FAFD] shadow-xs'
          : 'surface-card'
      }`}
    >
      {/* Top Header Metadata */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span className="rounded-md bg-[#F1F5FB] px-2 py-0.5 font-semibold text-slate-900">
              {review.term}
            </span>
            <span className="font-medium text-slate-700">{review.instructorName}</span>
            {review.taName && (
              <>
                <span aria-hidden="true">·</span>
                <span>TA: {review.taName}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{review.authorAlias}</span>
            {review.isDemoData && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">Demo entry</span>
              </>
            )}
          </div>

          {/* Trust Lens Context Labels */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium">
            {review.trustLens.labels.map((label) => {
              const colorClass =
                label === 'Limited Context' ||
                label === 'Low Specificity' ||
                label === 'Possible Duplicate'
                  ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                  : label === 'Balanced Critique'
                  ? 'bg-blue-50 text-blue-800 border-blue-200/70'
                  : 'bg-teal-50 text-teal-800 border-teal-200/70';
              return (
                <span key={label} className={`rounded-md border px-2 py-0.5 ${colorClass}`}>
                  {label}
                </span>
              );
            })}
            <span className="rounded-md bg-slate-100/90 px-2 py-0.5 font-mono text-slate-600 tabular-nums">
              Context score {review.trustLens.score}/100
            </span>
          </div>
        </div>

        {/* Metrics & Recommendation Status (never hue-only) */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <div className="rounded-lg border border-slate-200/75 bg-[#F4F7FB] px-2.5 py-1 font-mono text-slate-700 tabular-nums">
            Difficulty <strong className="text-slate-900">{review.difficulty}/5</strong>
          </div>
          <div className="rounded-lg border border-slate-200/75 bg-[#F4F7FB] px-2.5 py-1 font-mono text-slate-700 tabular-nums">
            <strong className="text-slate-900">{review.weeklyHours}</strong> hrs/wk
          </div>
          <div
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-medium ${
              review.recommended
                ? 'border-teal-200/75 bg-teal-50/75 text-teal-800'
                : 'border-amber-200/75 bg-amber-50/75 text-amber-900'
            }`}
          >
            {review.recommended ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Recommended</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                <span>Not recommended</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="mt-4 space-y-3.5">
        <p className="text-sm font-medium leading-relaxed text-slate-900">
          {review.overallExperience}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/65 bg-[#F6F8FC] p-3.5">
            <div className="text-xs font-semibold text-slate-800">What worked well</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.whatWorkedWell}</p>
          </div>
          <div className="rounded-xl border border-slate-200/65 bg-[#F6F8FC] p-3.5">
            <div className="text-xs font-semibold text-slate-800">What was challenging</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {review.whatWasChallenging}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200/65 bg-[#EFF5FD]/85 p-3.5">
          <div className="text-xs font-semibold text-blue-900">
            Practical advice for future students
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{review.practicalAdvice}</p>
        </div>

        {review.studyMethods.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 pt-0.5">
            <span className="font-medium text-slate-700 mr-1">Study methods used:</span>
            {review.studyMethods.map((m) => (
              <span
                key={m}
                className="rounded-md border border-slate-200/75 bg-[#F4F7FB] px-2 py-0.5 text-[11px] font-medium text-slate-700"
              >
                {STUDY_METHOD_CATALOG[m]?.label ?? m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions: Helpful Voting & Reporting */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(review.id, 'helpful')}
            aria-pressed={userVote === 'helpful'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              userVote === 'helpful'
                ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-[#F5F8FC] hover:text-slate-900'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Helpful</span>
            <span className="font-mono tabular-nums text-slate-500">
              ({review.helpfulVotes})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onVote(review.id, 'not_helpful')}
            aria-pressed={userVote === 'not_helpful'}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              userVote === 'not_helpful'
                ? 'border-slate-700 bg-slate-100 text-slate-900 shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-[#F5F8FC] hover:text-slate-900'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Not helpful</span>
            <span className="font-mono tabular-nums text-slate-500">
              ({review.notHelpfulVotes})
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onReport(review.id)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Report</span>
        </button>
      </div>
    </article>
  );
};

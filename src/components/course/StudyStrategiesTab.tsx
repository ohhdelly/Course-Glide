import React, { useMemo, useState } from 'react';
import { BookOpenCheck, Compass, Info } from 'lucide-react';
import type { CourseStats, Review, StudyPreference } from '../../types/course';
import { computeStudyFit, rankAndFilterReviews } from '../../utils/trustLens';

interface StudyStrategiesTabProps {
  courseCode: string;
  stats: CourseStats;
  reviews: Review[];
  onJumpToReview: (reviewId: string) => void;
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

  return (
    <div className="space-y-6">
      {/* Study Preference Filter + Study Fit Panel */}
      <section className="surface-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Study Strategies & Preparation Fit
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
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
                    ? 'border-blue-700 bg-blue-700 text-white shadow-xs'
                    : 'border-slate-200/85 bg-[#F4F7FB] text-slate-700 hover:bg-white hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Study Fit Insight Box */}
        <div className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-[#EFF5FD] to-[#F7FAFE] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <Compass className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <span>Study Fit Insight</span>
          </div>
          <p className="text-sm font-medium text-slate-900">{studyFit.headline}</p>

          {studyFit.supportingExcerpts.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-blue-200/60">
              <div className="text-xs font-semibold text-slate-700">
                Relevant advice from matching student reviews:
              </div>
              <ul className="space-y-2">
                {studyFit.supportingExcerpts.map((ex) => (
                  <li key={ex.reviewId} className="rounded-lg bg-white/85 border border-slate-200/60 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                    “{ex.advice}”{' '}
                    <button
                      type="button"
                      onClick={() => onJumpToReview(ex.reviewId)}
                      className="font-semibold text-blue-700 hover:underline ml-1"
                    >
                      ({ex.authorAlias} · {ex.term})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{studyFit.disclaimer}</span>
          </div>
        </div>
      </section>

      {/* Quantitative Helpfulness Breakdown */}
      <section className="surface-card rounded-2xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Reported Strategy Usage & Helpfulness
            </h3>
            <p className="text-xs text-slate-500">
              Every figure reports exact respondent counts alongside the share who found it helpful.
            </p>
          </div>
          <span className="rounded-md bg-[#F4F7FB] px-2.5 py-1 font-mono text-xs text-slate-600 tabular-nums">
            {displayedStrategies.length} strategies tracked
          </span>
        </div>

        {displayedStrategies.length === 0 ? (
          <p className="text-sm text-slate-600 py-6 text-center">
            No respondents have logged this specific study category for {courseCode} yet.
          </p>
        ) : (
          <div className="space-y-3.5">
            {displayedStrategies.map((stat) => (
              <div
                key={stat.key}
                className="rounded-xl border border-slate-200/65 bg-[#F7F9FC] p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">{stat.label}</span>
                  <span className="text-xs text-slate-600 tabular-nums">
                    <strong className="font-mono font-semibold text-teal-700">
                      {stat.helpfulPercentage}%
                    </strong>{' '}
                    of{' '}
                    <strong className="font-mono font-semibold text-slate-900">
                      {stat.usedCount}
                    </strong>{' '}
                    respondent{stat.usedCount === 1 ? '' : 's'} who used this reported finding it
                    helpful
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3EAF4]">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all duration-300"
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

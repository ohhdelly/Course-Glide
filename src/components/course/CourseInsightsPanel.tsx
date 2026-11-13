import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react';
import type { CourseInsightReport } from '../../types/course';

interface CourseInsightsPanelProps {
  courseCode: string;
  insights: CourseInsightReport | null;
  loading: boolean;
  onRefresh: () => void;
  onJumpToEvidence: (reviewId: string) => void;
}

export const CourseInsightsPanel: React.FC<CourseInsightsPanelProps> = ({
  courseCode,
  insights,
  loading,
  onRefresh,
  onJumpToEvidence,
}) => {
  return (
    <section
      aria-label="CourseGlide Insights"
      className="surface-card rounded-2xl overflow-hidden"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/75 bg-gradient-to-r from-[#F2F6FD] via-[#F7FAFE] to-white px-6 py-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 shrink-0">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900">
              CourseGlide Insights
            </h2>
            {insights && (
              <span className="rounded-md bg-white/90 border border-slate-200/75 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {insights.source === 'gemini'
                  ? 'AI synthesis grounded in Trust Lens reviews'
                  : 'Structured review synthesis'}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            {insights?.sampleNote ??
              `Synthesizing substantive student reviews for ${courseCode} without fabricating claims.`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-[#F5F8FC] hover:border-slate-300 disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{loading ? 'Synthesizing...' : 'Refresh insights'}</span>
        </button>
      </div>

      <div className="p-6">
        {loading && !insights ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2.5 rounded-xl border border-slate-200/70 bg-[#F7F9FC] p-4">
                <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-3.5 w-5/6 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* 1. What students commonly appreciate */}
            <div className="rounded-xl border border-slate-200/75 bg-[#F6F9FD] p-4.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
                <span>What students commonly appreciate</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {insights.appreciate.map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-slate-700">
                    <p>{item.point}</p>
                    <button
                      type="button"
                      onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50/70"
                    >
                      <span>Evidence: {item.evidenceLabel}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. What students consistently struggle with */}
            <div className="rounded-xl border border-slate-200/75 bg-[#F7F9FC] p-4.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>What students consistently struggle with</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {insights.struggleWith.map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-slate-700">
                    <p>{item.point}</p>
                    <button
                      type="button"
                      onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50/70"
                    >
                      <span>Evidence: {item.evidenceLabel}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. What students recommend before taking this course */}
            <div className="rounded-xl border border-slate-200/75 bg-[#F7F9FC] p-4.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Compass className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>What students recommend before taking this course</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {insights.recommendBefore.map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-slate-700">
                    <p>{item.point}</p>
                    <button
                      type="button"
                      onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50/70"
                    >
                      <span>Evidence: {item.evidenceLabel}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Where student experiences differ */}
            <div className="rounded-xl border border-slate-200/75 bg-[#F7F9FC] p-4.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Scale className="h-4 w-4 text-slate-700 shrink-0" aria-hidden="true" />
                <span>Where student experiences differ</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {insights.experiencesDiffer.map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed text-slate-700">
                    <p>{item.point}</p>
                    <button
                      type="button"
                      onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50/70"
                    >
                      <span>Evidence: {item.evidenceLabel}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

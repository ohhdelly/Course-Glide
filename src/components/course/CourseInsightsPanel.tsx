import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  RefreshCw,
  Scale,
} from 'lucide-react';
import type { CourseInsightReport, InsightItem } from '../../types/course';
import { CollapsibleText } from './CollapsibleText';

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
  const [showAllPoints, setShowAllPoints] = useState(false);

  const renderBucket = (
    title: string,
    icon: React.ReactNode,
    items: InsightItem[],
    surfaceClass: string
  ) => {
    const visibleItems = showAllPoints ? items : items.slice(0, 1);
    return (
      <div className={`p-4 sm:p-6 ${surfaceClass}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          {icon}
          <span>{title}</span>
        </h3>
        <ul className="mt-3 space-y-3">
          {visibleItems.map((item, idx) => (
            <li key={idx} className="text-sm text-[var(--text-muted)]">
              <CollapsibleText text={item.point} className="text-sm text-[var(--text-muted)]" />
              {item.evidenceReviewIds[0] && (
                <button
                  type="button"
                  onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                  className="mt-1 inline-flex min-h-[44px] items-center gap-1 rounded-control px-2 text-xs font-semibold text-[var(--text)] underline-offset-4 hover:bg-[var(--surface)] hover:underline"
                >
                  <span>Source: {item.evidenceLabel}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const hasExtraPoints =
    insights &&
    (insights.appreciate.length > 1 ||
      insights.struggleWith.length > 1 ||
      insights.recommendBefore.length > 1 ||
      insights.experiencesDiffer.length > 1);

  return (
    <section
      aria-label="Key Student Takeaways"
      className="surface-card rounded-card overflow-hidden"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text)]">
              Key Student Takeaways
            </h2>
            {insights && (
              <span className="text-xs text-[var(--text-muted)]">
                · {insights.source === 'gemini' ? 'AI summary' : 'Review synthesis'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {insights?.sampleNote ?? `Based on submitted student reviews for ${courseCode}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {hasExtraPoints && (
            <button
              type="button"
              aria-expanded={showAllPoints}
              onClick={() => setShowAllPoints((v) => !v)}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 text-xs font-semibold whitespace-nowrap"
            >
              <span>{showAllPoints ? 'Summary view' : 'More takeaways'}</span>
              {showAllPoints ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{loading ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading && !insights ? (
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-y-0" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3 p-6">
              <div className="h-4 w-44 animate-pulse rounded-control bg-[var(--surface-2)]" />
              <div className="h-4 w-full animate-pulse rounded-control bg-[var(--surface-2)]" />
              <div className="h-4 w-5/6 animate-pulse rounded-control bg-[var(--surface-2)]" />
            </div>
          ))}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-y-0">
          {renderBucket(
            'What students appreciate',
            <CheckCircle2 className="h-4 w-4 text-[var(--text)] shrink-0" aria-hidden="true" />,
            insights.appreciate,
            'md:border-r md:border-b md:border-[var(--border)] bg-[var(--surface-2)]'
          )}
          {renderBucket(
            'Common challenges',
            <AlertTriangle className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />,
            insights.struggleWith,
            'md:border-b md:border-[var(--border)] bg-[var(--surface)]'
          )}
          {renderBucket(
            'How to prepare before starting',
            <Compass className="h-4 w-4 text-[var(--text)] shrink-0" aria-hidden="true" />,
            insights.recommendBefore,
            'md:border-r md:border-[var(--border)] bg-[var(--surface)]'
          )}
          {renderBucket(
            'Where experiences differ',
            <Scale className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />,
            insights.experiencesDiffer,
            'bg-[var(--surface-2)]'
          )}
        </div>
      ) : null}
    </section>
  );
};


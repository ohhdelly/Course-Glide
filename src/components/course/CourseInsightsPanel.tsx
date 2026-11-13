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
  Sparkles,
} from 'lucide-react';
import type { CourseInsightReport, InsightItem } from '../../types/course';

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
      <div className={`p-5 ${surfaceClass}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          {icon}
          <span>{title}</span>
        </h3>
        <ul className="mt-2.5 space-y-2.5">
          {visibleItems.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed text-[var(--text-secondary)]">
              <p>{item.point}</p>
              {item.evidenceReviewIds[0] && (
                <button
                  type="button"
                  onClick={() => onJumpToEvidence(item.evidenceReviewIds[0])}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] transition-colors hover:underline"
                >
                  <span>Source: {item.evidenceLabel}</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
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
      aria-label="CourseGlide Insights"
      className="surface-card rounded-2xl overflow-hidden"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface-hero-mid)] via-[var(--surface-subtle)] to-[var(--surface)] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-accent)] text-[var(--accent-text)] shrink-0">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
              CourseGlide Insights
            </h2>
            {insights && (
              <span className="text-xs font-medium text-[var(--text-muted)]">
                · {insights.source === 'gemini' ? 'AI summary' : 'Review synthesis'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {insights?.sampleNote ??
              `Synthesizing substantive student reviews for ${courseCode}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasExtraPoints && (
            <button
              type="button"
              aria-expanded={showAllPoints}
              onClick={() => setShowAllPoints((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-accent)] whitespace-nowrap"
            >
              <span>{showAllPoints ? 'Summary view' : 'More takeaways'}</span>
              {showAllPoints ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{loading ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {loading && !insights ? (
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-y-0" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2.5 p-5">
              <div className="h-4 w-44 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-3.5 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-[var(--surface-muted)]" />
            </div>
          ))}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-2 md:divide-y-0">
          {renderBucket(
            'What students appreciate',
            <CheckCircle2 className="h-4 w-4 text-[var(--status-positive)] shrink-0" aria-hidden="true" />,
            insights.appreciate,
            'md:border-r md:border-b md:border-[var(--border)] bg-[var(--surface-subtle)]/65'
          )}
          {renderBucket(
            'Common challenges',
            <AlertTriangle className="h-4 w-4 text-[var(--status-warning)] shrink-0" aria-hidden="true" />,
            insights.struggleWith,
            'md:border-b md:border-[var(--border)] bg-[var(--surface)]'
          )}
          {renderBucket(
            'How to prepare before starting',
            <Compass className="h-4 w-4 text-[var(--accent-text)] shrink-0" aria-hidden="true" />,
            insights.recommendBefore,
            'md:border-r md:border-[var(--border)] bg-[var(--surface)]'
          )}
          {renderBucket(
            'Where experiences differ',
            <Scale className="h-4 w-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />,
            insights.experiencesDiffer,
            'bg-[var(--surface-subtle)]/65'
          )}
        </div>
      ) : null}
    </section>
  );
};

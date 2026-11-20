import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Review } from '../../types/course';
import type { ReviewRatingFilter } from '../../utils/trustLens';
import { computeRatingDistribution } from '../../utils/dataVisuals';
import { useChartReveal } from './useChartReveal';

interface RatingDistributionProps {
  reviews: Review[];
  activeFilter: ReviewRatingFilter;
  onSelectRatingFilter: (next: ReviewRatingFilter) => void;
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({
  reviews,
  activeFilter,
  onSelectRatingFilter,
}) => {
  const { total, rows } = useMemo(() => computeRatingDistribution(reviews), [reviews]);
  const { revealed, reducedMotion } = useChartReveal(500);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [focusedRating, setFocusedRating] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoveredRating(null);
        setFocusedRating(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (total === 0) {
    return null;
  }

  const activeNumericRating = activeFilter.startsWith('rating_')
    ? Number(activeFilter.replace('rating_', ''))
    : null;
  const tooltipRating = focusedRating ?? hoveredRating;
  const tooltipRow = tooltipRating !== null ? rows.find((r) => r.rating === tooltipRating) : null;
  const ariaLabel = `Rating distribution across ${total} student ${
    total === 1 ? 'review' : 'reviews'
  }. ${rows.map((r) => `${r.rating} out of 5: ${r.count} (${r.percentage}%)`).join(', ')}`;

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className="surface-card font-explore rounded-card p-4 sm:p-6 space-y-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text)]">Rating distribution</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Select a rating bar to filter reviews below
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums">
            n = {total}
          </span>
          {activeNumericRating !== null && (
            <button
              type="button"
              onClick={() => onSelectRatingFilter('all')}
              className="btn-secondary inline-flex min-h-[32px] items-center rounded-control px-2.5 py-1 text-xs font-semibold"
            >
              Clear ({activeNumericRating}/5)
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5" role="group" aria-label="Filter reviews by rating">
        {rows.map((row) => {
          const filterKey = `rating_${row.rating}` as ReviewRatingFilter;
          const isSelected = activeFilter === filterKey;
          const isTooltipTarget = tooltipRow?.rating === row.rating;

          return (
            <div key={row.rating} className="relative">
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`${row.rating} out of 5: ${row.count} ${
                  row.count === 1 ? 'review' : 'reviews'
                } (${row.percentage}%). ${
                  isSelected ? 'Currently filtering by this rating. Activate to clear.' : 'Activate to filter reviews.'
                }`}
                onClick={() => onSelectRatingFilter(isSelected ? 'all' : filterKey)}
                onMouseEnter={() => setHoveredRating(row.rating)}
                onMouseLeave={() => setHoveredRating((prev) => (prev === row.rating ? null : prev))}
                onFocus={() => setFocusedRating(row.rating)}
                onBlur={() => setFocusedRating((prev) => (prev === row.rating ? null : prev))}
                className={`group flex min-h-[36px] w-full items-center gap-2.5 rounded-control border px-2.5 py-1.5 text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--accent-strong)] bg-[var(--surface-2)]'
                    : 'border-transparent hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className="w-9 shrink-0 text-xs font-semibold text-[var(--text)] tabular-nums">
                  {row.rating} / 5
                </span>

                <span
                  aria-hidden="true"
                  className="relative h-3 flex-1 overflow-hidden rounded-[4px] bg-[var(--chart-3)]"
                >
                  {row.percentage > 0 && (
                    <span
                      className="block h-full rounded-[4px]"
                      style={{
                        width: revealed ? `${row.percentage}%` : '0%',
                        backgroundColor: 'var(--chart-1)',
                        transition: reducedMotion
                          ? 'none'
                          : 'width 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  )}
                </span>

                <span className="w-[74px] shrink-0 text-right text-xs font-medium text-[var(--text-muted)] tabular-nums">
                  <strong className="font-semibold text-[var(--text)]">{row.count}</strong> ({row.percentage}%)
                </span>
              </button>

              {isTooltipTarget && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-2 top-full z-20 mt-1 rounded-control border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] shadow-dialog tabular-nums"
                >
                  <span className="font-semibold">{row.rating} / 5</span>:{' '}
                  <span>
                    {row.count} {row.count === 1 ? 'review' : 'reviews'} ({row.percentage}%)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visually hidden accessible data table */}
      <div className="sr-only">
        <table>
          <caption>Course rating distribution</caption>
          <thead>
            <tr>
              <th scope="col">Rating</th>
              <th scope="col">Reviews</th>
              <th scope="col">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rating}>
                <th scope="row">{row.rating} out of 5</th>
                <td>{row.count}</td>
                <td>{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

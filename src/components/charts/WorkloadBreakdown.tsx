import React, { useEffect, useRef, useState } from 'react';
import type { Course, CourseStats } from '../../types/course';
import {
  extractRealWorkloadBreakdown,
  formatHoursCompact,
  type WorkloadBreakdownSegment,
} from '../../utils/dataVisuals';
import { useChartReveal } from './useChartReveal';

interface WorkloadBreakdownProps {
  course: Course;
  stats: CourseStats;
}

function getPatternStyle(pattern: WorkloadBreakdownSegment['pattern']): string | undefined {
  if (pattern === 'diagonal') {
    return 'repeating-linear-gradient(-45deg, transparent 0 5px, color-mix(in srgb, var(--surface) 32%, transparent) 5px 7px)';
  }
  if (pattern === 'dots') {
    return 'radial-gradient(color-mix(in srgb, var(--surface) 45%, transparent) 1.25px, transparent 1.25px)';
  }
  if (pattern === 'cross') {
    return 'repeating-linear-gradient(90deg, transparent 0 5px, color-mix(in srgb, var(--surface) 36%, transparent) 5px 7px)';
  }
  return undefined;
}

export const WorkloadBreakdown: React.FC<WorkloadBreakdownProps> = ({ course, stats }) => {
  const breakdown = extractRealWorkloadBreakdown(course);
  const { revealed, reducedMotion } = useChartReveal(500);
  const [activeKey, setActiveKey] = useState<WorkloadBreakdownSegment['key'] | null>(null);
  const [tapLocked, setTapLocked] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!tapLocked) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTapLocked(false);
        setActiveKey(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTapLocked(false);
        setActiveKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [tapLocked]);

  const hasReportedHours = stats.responseCount > 0 && Number.isFinite(stats.avgWeeklyHours) && stats.avgWeeklyHours > 0;

  // Hide completely when neither breakdown nor reported weekly hours exist
  if (!breakdown && !hasReportedHours) {
    return null;
  }

  // Real data check: do not invent a breakdown when the course has no activity split
  if (!breakdown) {
    return (
      <section
        aria-label="Weekly workload summary"
        className="surface-card font-explore rounded-card p-4 sm:p-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text)]">Weekly workload</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Total outside-of-class and study hours reported by students (no activity breakdown recorded).
          </p>
        </div>
        <p className="text-xl font-semibold text-[var(--text)] tabular-nums shrink-0">
          {formatHoursCompact(stats.avgWeeklyHours)} h/wk
        </p>
      </section>
    );
  }

  const totalLabel = `${formatHoursCompact(breakdown.totalHours)} h/wk`;
  const chartAriaLabel = `Weekly workload breakdown totaling ${totalLabel}: ${breakdown.segments
    .map((s) => `${s.label} ${formatHoursCompact(s.hours)} hours`)
    .join(', ')}`;
  const activeSegment = breakdown.segments.find((s) => s.key === activeKey) ?? null;

  return (
    <section
      ref={containerRef}
      aria-label="Weekly workload breakdown"
      className="surface-card font-explore rounded-card p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text)]">Workload breakdown</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Weekly hours across lectures, assignments, studying, and exams
          </p>
        </div>
        <div className="text-xl font-semibold text-[var(--text)] tabular-nums shrink-0">
          {totalLabel}
        </div>
      </div>

      {/* Single stacked horizontal bar + total at end */}
      <div className="relative space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div
            role="img"
            aria-label={chartAriaLabel}
            className="flex h-6 w-full overflow-hidden rounded-control border border-[var(--border)] bg-[var(--chart-3)]"
          >
            {breakdown.segments.map((segment, index) => {
              const targetWidth = `${(segment.hours / breakdown.totalHours) * 100}%`;
              const isHighlighted = activeKey === segment.key;
              const isDimmed = activeKey !== null && !isHighlighted;
              const patternBg = getPatternStyle(segment.pattern);

              return (
                <button
                  key={segment.key}
                  type="button"
                  onMouseEnter={() => {
                    if (!tapLocked) setActiveKey(segment.key);
                  }}
                  onMouseLeave={() => {
                    if (!tapLocked) setActiveKey(null);
                  }}
                  onFocus={() => setActiveKey(segment.key)}
                  onBlur={() => {
                    if (!tapLocked) setActiveKey(null);
                  }}
                  onClick={() => {
                    if (tapLocked && activeKey === segment.key) {
                      setTapLocked(false);
                      setActiveKey(null);
                    } else {
                      setTapLocked(true);
                      setActiveKey(segment.key);
                    }
                  }}
                  aria-label={`${segment.label}: ${formatHoursCompact(segment.hours)} hours (${segment.percentage}%)`}
                  style={{
                    width: revealed ? targetWidth : '0%',
                    backgroundColor: `var(${segment.tokenVar})`,
                    backgroundImage: patternBg,
                    backgroundSize: segment.pattern === 'dots' ? '7px 7px' : undefined,
                    opacity: isDimmed ? 0.5 : 1,
                    transition: reducedMotion
                      ? 'none'
                      : 'width 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease',
                  }}
                  className={`relative h-full shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-strong)] ${
                    index > 0 ? 'border-l border-[var(--surface)]' : ''
                  }`}
                />
              );
            })}
          </div>

          <span
            aria-hidden="true"
            className="text-sm font-semibold text-[var(--text)] tabular-nums whitespace-nowrap shrink-0"
          >
            {totalLabel}
          </span>
        </div>

        {/* Tooltip for hover / focus / tap */}
        {activeSegment && (
          <div
            role="tooltip"
            className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] flex flex-wrap items-center justify-between gap-2 tabular-nums"
          >
            <span className="font-semibold text-[var(--text)]">{activeSegment.label}</span>
            <span className="text-[var(--text-muted)]">
              {formatHoursCompact(activeSegment.hours)} h/wk ({activeSegment.percentage}% of total)
            </span>
          </div>
        )}

        {/* Direct segment labels with name, hours, and non-color pattern swatch */}
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {breakdown.segments.map((segment) => {
            const patternBg = getPatternStyle(segment.pattern);
            const isHighlighted = activeKey === segment.key;
            return (
              <li key={segment.key} className="min-w-0">
                <button
                  type="button"
                  onMouseEnter={() => {
                    if (!tapLocked) setActiveKey(segment.key);
                  }}
                  onMouseLeave={() => {
                    if (!tapLocked) setActiveKey(null);
                  }}
                  onFocus={() => setActiveKey(segment.key)}
                  onBlur={() => {
                    if (!tapLocked) setActiveKey(null);
                  }}
                  onClick={() => {
                    if (tapLocked && activeKey === segment.key) {
                      setTapLocked(false);
                      setActiveKey(null);
                    } else {
                      setTapLocked(true);
                      setActiveKey(segment.key);
                    }
                  }}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-control border px-3 py-2 text-left text-xs transition-colors ${
                    isHighlighted
                      ? 'border-[var(--accent-strong)] bg-[var(--surface-2)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent-strong)]'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-[2px] border border-[var(--border)]"
                      style={{
                        backgroundColor: `var(${segment.tokenVar})`,
                        backgroundImage: patternBg,
                        backgroundSize: segment.pattern === 'dots' ? '6px 6px' : undefined,
                      }}
                    />
                    <span className="font-medium text-[var(--text)] truncate">{segment.label}</span>
                  </span>
                  <span className="font-semibold text-[var(--text)] tabular-nums shrink-0">
                    {formatHoursCompact(segment.hours)} h
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Visually hidden accessible data table */}
      <div className="sr-only">
        <table>
          <caption>Weekly workload breakdown for {course.code}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Weekly hours</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.segments.map((segment) => (
              <tr key={segment.key}>
                <th scope="row">{segment.label}</th>
                <td>{formatHoursCompact(segment.hours)} h/wk</td>
                <td>{segment.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

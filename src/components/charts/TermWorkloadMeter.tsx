import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Course, CourseStats } from '../../types/course';
import {
  buildTermWorkloadSummary,
  formatHoursCompact,
  type TermWorkloadSegment,
} from '../../utils/dataVisuals';
import { useChartReveal } from './useChartReveal';

interface TermWorkloadMeterProps {
  courses: Course[];
  statsMap: Record<string, CourseStats>;
}

function getSegmentPattern(pattern: TermWorkloadSegment['pattern']): string | undefined {
  if (pattern === 'diagonal') {
    return 'repeating-linear-gradient(-45deg, transparent 0 5px, color-mix(in srgb, var(--surface) 32%, transparent) 5px 7px)';
  }
  if (pattern === 'dots') {
    return 'radial-gradient(color-mix(in srgb, var(--surface) 45%, transparent) 1.25px, transparent 1.25px)';
  }
  if (pattern === 'vertical') {
    return 'repeating-linear-gradient(90deg, transparent 0 5px, color-mix(in srgb, var(--surface) 34%, transparent) 5px 7px)';
  }
  return undefined;
}

export const TermWorkloadMeter: React.FC<TermWorkloadMeterProps> = ({
  courses,
  statsMap,
}) => {
  const limitInputId = useId();
  const [limitInput, setLimitInput] = useState<string>('');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [tapLocked, setTapLocked] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const { revealed, drawComplete, reducedMotion } = useChartReveal(500);

  const parsedLimit = useMemo(() => {
    const trimmed = limitInput.trim();
    if (!trimmed) return null;
    const val = Number(trimmed);
    return Number.isFinite(val) && val > 0 ? val : null;
  }, [limitInput]);

  const summary = useMemo(
    () => buildTermWorkloadSummary(courses, statsMap, parsedLimit),
    [courses, statsMap, parsedLimit]
  );

  useEffect(() => {
    if (!tapLocked) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTapLocked(false);
        setActiveCourseId(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTapLocked(false);
        setActiveCourseId(null);
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

  useEffect(() => {
    if (activeCourseId && !summary.segments.some((seg) => seg.courseId === activeCourseId)) {
      setActiveCourseId(null);
      setTapLocked(false);
    }
  }, [activeCourseId, summary.segments]);

  if (summary.reviewedCourseCount === 0) {
    return null;
  }

  const widthTransition = reducedMotion
    ? 'none'
    : drawComplete
    ? 'width 300ms ease-out, opacity 150ms ease'
    : 'width 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease';

  const activeSegment =
    summary.segments.find((segment) => segment.courseId === activeCourseId) ?? null;

  const isOverLimit = summary.exceededByHours !== null;
  const chartAriaLabel = `${summary.headlineText}. ${summary.segments
    .map((s) => `${s.code} ${formatHoursCompact(s.weeklyHours)} hours per week`)
    .join(', ')}${
    summary.limitHours !== null ? `. Target limit ${formatHoursCompact(summary.limitHours)} hours per week.` : '.'
  }`;

  return (
    <section
      ref={containerRef}
      aria-label="Term workload meter"
      className="surface-card font-explore rounded-card p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-xs font-medium text-[var(--text-muted)]">
            Term workload meter
          </div>
          <h2
            className={`text-xl font-semibold tabular-nums text-balance ${
              isOverLimit ? 'text-[var(--accent-strong)]' : 'text-[var(--text)]'
            }`}
          >
            {summary.headlineText}
          </h2>
          {summary.sublineText && (
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {summary.sublineText}
            </p>
          )}
          {summary.unreviewedCourseCount > 0 && (
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {summary.unreviewedCourseCount} saved{' '}
              {summary.unreviewedCourseCount === 1 ? 'course has' : 'courses have'} no student
              workload reports yet.
            </p>
          )}
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <label
            htmlFor={limitInputId}
            className="block text-xs font-semibold text-[var(--text)] mb-1"
          >
            My limit (h/wk)
          </label>
          <input
            id={limitInputId}
            type="number"
            min="1"
            max="120"
            step="0.5"
            inputMode="decimal"
            placeholder="Optional"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] tabular-nums placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Stacked horizontal workload bar + optional limit marker */}
      <div className="relative pt-1">
        <div
          role="img"
          aria-label={chartAriaLabel}
          className="relative flex h-7 w-full overflow-hidden rounded-control border border-[var(--border)] bg-[var(--chart-3)]"
        >
          {summary.segments.map((segment, index) => {
            const isHighlighted = activeCourseId === segment.courseId;
            const isDimmed = activeCourseId !== null && !isHighlighted;
            const patternBg = getSegmentPattern(segment.pattern);

            return (
              <button
                key={segment.courseId}
                type="button"
                aria-label={`${segment.code} (${segment.title}): ${formatHoursCompact(
                  segment.weeklyHours
                )} hours per week (${segment.sharePercent}% of total)`}
                onMouseEnter={() => {
                  if (!tapLocked) setActiveCourseId(segment.courseId);
                }}
                onMouseLeave={() => {
                  if (!tapLocked) setActiveCourseId(null);
                }}
                onFocus={() => setActiveCourseId(segment.courseId)}
                onBlur={() => {
                  if (!tapLocked) setActiveCourseId(null);
                }}
                onClick={() => {
                  if (tapLocked && activeCourseId === segment.courseId) {
                    setTapLocked(false);
                    setActiveCourseId(null);
                  } else {
                    setTapLocked(true);
                    setActiveCourseId(segment.courseId);
                  }
                }}
                style={{
                  width: revealed ? `${segment.widthPercent}%` : '0%',
                  backgroundColor: `var(${segment.tokenVar})`,
                  backgroundImage: patternBg,
                  backgroundSize: segment.pattern === 'dots' ? '7px 7px' : undefined,
                  opacity: isDimmed ? 0.45 : 1,
                  transition: widthTransition,
                }}
                className={`relative h-full shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-strong)] ${
                  index > 0 ? 'border-l border-[var(--surface)]' : ''
                }`}
              />
            );
          })}
        </div>

        {/* Limit marker rendered directly over the bar when exceeded or set within bar width */}
        {summary.limitMarkerPercent !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 z-10 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${summary.limitMarkerPercent}%` }}
          >
            <span className="h-9 w-0.5 bg-[var(--text)] ring-2 ring-[var(--surface)]" />
          </div>
        )}
      </div>

      {/* Hover / focus / tap tooltip readout */}
      {activeSegment && (
        <div
          role="tooltip"
          className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] flex flex-wrap items-center justify-between gap-2 tabular-nums"
        >
          <span className="font-semibold text-[var(--text)]">
            {activeSegment.code}: {activeSegment.title}
          </span>
          <span className="text-[var(--text-muted)]">
            {formatHoursCompact(activeSegment.weeklyHours)} h/wk ({activeSegment.sharePercent}% of saved total)
          </span>
        </div>
      )}

      {/* Legend of course codes */}
      <ul className="flex flex-wrap gap-2" aria-label="Course legend">
        {summary.segments.map((segment) => {
          const isHighlighted = activeCourseId === segment.courseId;
          const patternBg = getSegmentPattern(segment.pattern);

          return (
            <li key={segment.courseId}>
              <button
                type="button"
                onMouseEnter={() => {
                  if (!tapLocked) setActiveCourseId(segment.courseId);
                }}
                onMouseLeave={() => {
                  if (!tapLocked) setActiveCourseId(null);
                }}
                onFocus={() => setActiveCourseId(segment.courseId)}
                onBlur={() => {
                  if (!tapLocked) setActiveCourseId(null);
                }}
                onClick={() => {
                  if (tapLocked && activeCourseId === segment.courseId) {
                    setTapLocked(false);
                    setActiveCourseId(null);
                  } else {
                    setTapLocked(true);
                    setActiveCourseId(segment.courseId);
                  }
                }}
                className={`inline-flex min-h-[36px] items-center gap-2 rounded-control border px-2.5 py-1 text-xs transition-colors tabular-nums ${
                  isHighlighted
                    ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent-strong)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-[2px] border border-[var(--border)]"
                  style={{
                    backgroundColor: `var(${segment.tokenVar})`,
                    backgroundImage: patternBg,
                    backgroundSize: segment.pattern === 'dots' ? '6px 6px' : undefined,
                  }}
                />
                <span className="font-semibold">{segment.code}</span>
                <span className="text-[var(--text-muted)]">
                  {formatHoursCompact(segment.weeklyHours)} h
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Visually hidden accessible data table */}
      <div className="sr-only">
        <table>
          <caption>Weekly workload breakdown for saved courses</caption>
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Weekly hours</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {summary.segments.map((segment) => (
              <tr key={segment.courseId}>
                <th scope="row">
                  {segment.code} {segment.title}
                </th>
                <td>{formatHoursCompact(segment.weeklyHours)} h/wk</td>
                <td>{segment.sharePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

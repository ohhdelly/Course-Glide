import React, { useEffect, useRef, useState } from 'react';
import { useChartReveal } from './useChartReveal';

interface RecommendRingProps {
  percentage: number | null | undefined;
  size: 40 | 96;
  interactive?: boolean;
  responseCount?: number;
  className?: string;
}

export const RecommendRing: React.FC<RecommendRingProps> = ({
  percentage,
  size,
  interactive = false,
  responseCount,
  className = '',
}) => {
  const { revealed, reducedMotion } = useChartReveal(500);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [tapOpen, setTapOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tapOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setTapOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTapOpen(false);
        setHoverOpen(false);
        setFocusOpen(false);
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
  }, [tapOpen]);

  if (percentage === null || percentage === undefined || !Number.isFinite(percentage)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const strokeWidth = size === 96 ? 8 : 4;
  const radius = size === 96 ? 40 : 16;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - clamped / 100);
  const strokeDashoffset = revealed ? targetOffset : circumference;
  const ariaLabel = `${clamped}% recommend`;
  const tooltipVisible = interactive && (hoverOpen || focusOpen || tapOpen);

  const ringSvg = (
    <span
      className="font-explore relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth={strokeWidth}
        />
        {clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: reducedMotion
                ? 'none'
                : 'stroke-dashoffset 500ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center font-semibold leading-none tabular-nums text-[var(--text)] ${
          size === 96 ? 'text-[20px]' : 'text-[11px]'
        }`}
      >
        {clamped}%
      </span>
    </span>
  );

  if (!interactive) {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={`font-explore relative inline-flex items-center justify-center shrink-0 ${className}`}
      >
        {ringSvg}
        <span className="sr-only">
          {ariaLabel}
          {typeof responseCount === 'number' && responseCount > 0
            ? ` across ${responseCount} student responses.`
            : '.'}
        </span>
      </span>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`font-explore relative inline-flex items-center justify-center shrink-0 ${className}`}
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        type="button"
        onClick={() => setTapOpen((prev) => !prev)}
        onFocus={() => setFocusOpen(true)}
        onBlur={() => setFocusOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setTapOpen(false);
            setFocusOpen(false);
            setHoverOpen(false);
          }
        }}
        aria-label={ariaLabel}
        aria-expanded={tooltipVisible}
        className="relative inline-flex items-center justify-center rounded-card p-1 transition-colors hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
      >
        {ringSvg}
        <span className="sr-only">
          {ariaLabel}
          {typeof responseCount === 'number' && responseCount > 0
            ? ` across ${responseCount} student responses.`
            : '.'}
        </span>
      </button>

      {tooltipVisible && (
        <div
          role="tooltip"
          className="font-explore absolute left-1/2 top-full z-30 mt-2 w-48 -translate-x-1/2 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-xs text-[var(--text)] shadow-dialog pointer-events-none"
        >
          <div className="font-semibold text-[var(--text)] tabular-nums">{ariaLabel}</div>
          <p className="mt-0.5 text-[var(--text-muted)] tabular-nums">
            {typeof responseCount === 'number' && responseCount > 0
              ? `Based on ${responseCount} student ${responseCount === 1 ? 'review' : 'reviews'}.`
              : 'Share of reviewed students who recommend this course.'}
          </p>
        </div>
      )}
    </div>
  );
};

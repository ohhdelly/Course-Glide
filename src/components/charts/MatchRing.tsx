import React from 'react';

interface MatchRingProps {
  percent: number;
}

/**
 * Circular fit indicator for advisor results. The arc uses the theme's chart
 * accent, which stays above 3:1 against the surface in every palette (the raw
 * accent is gold on white for Waterloo).
 */
export const MatchRing: React.FC<MatchRingProps> = ({ percent }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <span
        role="img"
        aria-label={`${clamped}% match to your request`}
        className="relative inline-flex items-center justify-center"
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
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            style={{ transition: 'stroke-dashoffset 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-[var(--text)]"
        >
          {clamped}%
        </span>
      </span>
      <span aria-hidden="true" className="type-caption leading-none text-[var(--text-muted)]">
        match
      </span>
    </div>
  );
};

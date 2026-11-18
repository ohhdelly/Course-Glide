import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, HelpCircle, Minus } from 'lucide-react';
import type { TrustLensEvaluation } from '../../types/course';

interface TrustLensInfoProps {
  evaluation?: TrustLensEvaluation;
  align?: 'left' | 'right';
}

export const TrustLensInfo: React.FC<TrustLensInfoProps> = ({
  evaluation,
  align = 'left',
}) => {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);

  const isOpen = hovered || focused || pinned;

  useEffect(() => {
    if (!pinned) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setHovered(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [pinned]);

  const signalRows = evaluation
    ? [
        {
          label: 'Course & workload specifics',
          met:
            evaluation.signals.hasCourseSpecificDetails ||
            evaluation.signals.hasAssessmentOrWorkloadContext,
        },
        {
          label: 'Actionable study advice',
          met: evaluation.signals.hasActionableAdvice,
        },
        {
          label: 'Not duplicate or low-detail',
          met:
            !evaluation.signals.isDuplicateOrRepetitive &&
            !evaluation.signals.isLowInformation,
        },
      ]
    : [
        {
          label: 'Specific course details (exams, workload, grading)',
          met: true,
        },
        {
          label: 'Pros, challenges, and actionable study advice',
          met: true,
        },
        {
          label: 'Recency, helpful votes, and duplicate filtering',
          met: true,
        },
      ];

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setPinned((v) => !v)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-semibold text-[var(--text)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:bg-[var(--surface-2)] hover:decoration-[var(--accent-strong)]"
      >
        <HelpCircle className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
        <span>How is this calculated?</span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-label="Trust Lens calculation breakdown"
          className={`absolute top-full z-40 mt-1.5 w-72 sm:w-80 rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 text-xs shadow-dialog ${
            align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0'
          }`}
        >
          <div className="font-semibold text-[var(--text)]">
            {evaluation ? `Trust Lens score: ${evaluation.score}/100` : 'How Trust Lens calculates scores'}
          </div>
          <p className="mt-1 text-[var(--text-muted)]">
            Measures review specificity and usefulness — positive and critical reviews are scored equally.
          </p>
          <ul className="mt-2.5 space-y-1.5 border-t border-[var(--border)] pt-2.5">
            {signalRows.map((row) => (
              <li key={row.label} className="flex items-start gap-2 text-[var(--text)]">
                {row.met ? (
                  <Check
                    className="mt-0.5 h-4 w-4 text-[var(--chart)] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Minus
                    className="mt-0.5 h-4 w-4 text-[var(--text-muted)] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className={row.met ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                  {row.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

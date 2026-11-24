import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import type { AdvisorBrief, ScoreExplanation } from '../types/course';
import { BASIS_LABEL, explanationToAnswer } from '../utils/scoreExplanations';

/**
 * The request the popover sends to `/api/score-explanation` when the user asks
 * the advisor to explain. Only identifiers and the user's own filters travel;
 * the server recomputes the breakdown and never trusts client numbers.
 */
export interface ScoreExplanationRequest {
  courseId: string;
  score: ScoreExplanation['key'];
  reviewId?: string;
  brief?: AdvisorBrief;
  cautionApplied?: boolean;
}

interface ScoreInfoProps {
  explanation: ScoreExplanation;
  align?: 'left' | 'right';
  /** Icon-only trigger for tight metric rows. */
  compact?: boolean;
  triggerLabel?: string;
  request?: ScoreExplanationRequest;
}

interface AskState {
  answer: string;
  source: 'deterministic' | 'ai';
  model?: string;
  degraded?: boolean;
  /** The instant deterministic answer is on screen while the model rephrases. */
  pending?: boolean;
}

export const ScoreInfo: React.FC<ScoreInfoProps> = ({
  explanation,
  align = 'left',
  compact = false,
  triggerLabel = 'How is this calculated?',
  request,
}) => {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState<AskState | null>(null);

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

  // A new score (or a new advisor brief) starts a new conversation.
  const requestKey = `${request?.courseId ?? ''}:${request?.score ?? ''}:${request?.reviewId ?? ''}:${
    request?.brief ? JSON.stringify(request.brief) : ''
  }`;
  useEffect(() => {
    setAsk(null);
    abortRef.current?.abort();
  }, [requestKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const askAdvisor = async () => {
    if (!request || asking) return;
    const fallbackAnswer = explanationToAnswer(explanation);
    // Demo safety: show the real breakdown immediately, then let the model only
    // improve the wording. A slow or dead connection never leaves a blank panel.
    setAsk({ answer: fallbackAnswer, source: 'deterministic', pending: true });
    setAsking(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/score-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      const payload = await res.json();
      if (!res.ok || typeof payload?.answer !== 'string' || !payload.answer) {
        throw new Error('explanation unavailable');
      }
      setAsk({
        answer: payload.answer,
        source: payload.source === 'ai' ? 'ai' : 'deterministic',
        model: typeof payload.model === 'string' ? payload.model : undefined,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // The instant answer is already on screen; just note the advisor was away.
      setAsk({ answer: fallbackAnswer, source: 'deterministic', degraded: true });
    } finally {
      if (!controller.signal.aborted) setAsking(false);
    }
  };

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
        aria-label={compact ? `How ${explanation.label} is calculated` : undefined}
        onClick={() => setPinned((value) => !value)}
        className={
          compact
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent-strong)]'
            : 'inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-semibold text-[var(--text)] underline decoration-[var(--border)] underline-offset-4 transition-colors hover:bg-[var(--surface-2)] hover:decoration-[var(--accent-strong)]'
        }
      >
        <HelpCircle className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        {!compact && <span>{triggerLabel}</span>}
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-label={`${explanation.label} calculation breakdown`}
          className={`absolute top-full z-40 mt-1.5 max-h-[70vh] w-80 overflow-y-auto rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 text-xs shadow-dialog sm:w-96 ${
            align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-[var(--text)]">
              {explanation.label}: {explanation.value}
            </div>
          </div>
          <span className="mt-1 inline-flex rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            {BASIS_LABEL[explanation.basis]}
          </span>

          <p className="mt-2 leading-relaxed text-[var(--text-muted)]">{explanation.summary}</p>

          <p className="mt-2 rounded-control bg-[var(--surface-2)] px-2 py-1.5 font-mono text-[10px] leading-relaxed text-[var(--text)]">
            {explanation.formula}
          </p>

          {explanation.components.length > 0 && (
            <ul className="mt-2.5 space-y-2 border-t border-[var(--border)] pt-2.5">
              {explanation.components.map((component, index) => (
                <li key={`${component.label}-${index}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[var(--text)]">{component.label}</span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                      {component.weight}
                    </span>
                  </div>
                  <div className="text-[11px] leading-snug text-[var(--text-muted)]">
                    {component.input}
                  </div>
                  <div className="text-[11px] font-medium text-[var(--text)]">
                    {component.contribution}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2.5 border-t border-[var(--border)] pt-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text)]">Not part of this score: </span>
            {explanation.exclusions.join(' · ')}
          </p>

          {explanation.caveat && (
            <p className="mt-1.5 text-[11px] italic leading-relaxed text-[var(--text-muted)]">
              {explanation.caveat}
            </p>
          )}

          {request && (
            <button
              type="button"
              onClick={() => void askAdvisor()}
              disabled={asking}
              className="mt-2.5 inline-flex min-h-[32px] items-center gap-1.5 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent-strong)] disabled:opacity-60"
            >
              {asking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : ask?.source === 'ai' ? (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{asking ? 'Asking the advisor…' : ask ? 'Ask again' : 'Ask the advisor to explain'}</span>
            </button>
          )}

          {ask && (
            <div
              aria-live="polite"
              className="mt-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[11px]"
            >
              <div className="font-semibold text-[var(--text)]">
                {ask.pending
                  ? 'Calculated explanation · the advisor is restating it'
                  : ask.source === 'ai'
                    ? 'AI-assisted explanation'
                    : 'Calculated explanation'}
              </div>
              <p className="mt-0.5 leading-relaxed text-[var(--text)]">{ask.answer}</p>
              {ask.degraded && (
                <p className="mt-1 text-[var(--text-muted)]">
                  Showing the built-in explanation; the advisor could not be reached.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Triggers a single draw-in transition on initial mount (400-600ms ease-out),
 * then remains static with no looping animation. Respects prefers-reduced-motion
 * by revealing the final state immediately.
 */
export function useChartReveal(drawDurationMs = 500): {
  revealed: boolean;
  drawComplete: boolean;
  reducedMotion: boolean;
} {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const [revealed, setRevealed] = useState<boolean>(() => prefersReducedMotion());
  const [drawComplete, setDrawComplete] = useState<boolean>(() => prefersReducedMotion());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const reduced = mq.matches;
      setReducedMotion(reduced);
      if (reduced) {
        setRevealed(true);
        setDrawComplete(true);
      }
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (reducedMotion) {
      setRevealed(true);
      setDrawComplete(true);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setRevealed(true);
    });
    const timer = window.setTimeout(() => {
      setDrawComplete(true);
    }, drawDurationMs + 40);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [drawDurationMs, reducedMotion]);

  return { revealed, drawComplete, reducedMotion };
}

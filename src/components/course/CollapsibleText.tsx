import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface CollapsibleTextProps {
  text: string;
  maxLines?: 2 | 3 | 4;
  className?: string;
  renderContent?: (text: string) => React.ReactNode;
}

export const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  text,
  maxLines = 3,
  className = '',
  renderContent,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;

    const measure = () => {
      if (!textRef.current) return;
      setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight + 2);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, maxLines]);

  const clampClass =
    maxLines === 4 ? 'line-clamp-4' : maxLines === 2 ? 'line-clamp-2' : 'line-clamp-3';

  return (
    <div>
      <p
        ref={textRef}
        className={`${className} ${!expanded ? clampClass : ''}`}
      >
        {renderContent ? renderContent(text) : text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 inline-flex min-h-[36px] items-center rounded-[4px] px-1 text-xs font-semibold text-[var(--text)] underline underline-offset-4 hover:text-[var(--accent-strong)]"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

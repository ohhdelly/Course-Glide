import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ExploreSelectOption {
  value: string;
  label: string;
}

interface ExploreSelectProps {
  id?: string;
  ariaLabel: string;
  value: string;
  options: ExploreSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  menuAlign?: 'left' | 'right';
}

export const ExploreSelect: React.FC<ExploreSelectProps> = ({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  className = '',
  menuAlign = 'left',
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((opt) => opt.value === value)
    )
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    const idx = options.findIndex((opt) => opt.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [value, options]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = optionRefs.current[activeIndex];
    target?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        const currentIdx = Math.max(
          0,
          options.findIndex((opt) => opt.value === value)
        );
        setActiveIndex(currentIdx);
        setOpen(true);
      } else {
        setActiveIndex((prev) =>
          e.key === 'ArrowDown'
            ? (prev + 1) % options.length
            : (prev - 1 + options.length) % options.length
        );
      }
    } else if (e.key === 'Home' && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && open) {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) handleSelect(opt.value);
    }
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left type-small font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-strong)]"
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute top-full z-30 mt-2 max-h-72 min-w-full w-max max-w-[min(320px,calc(100vw-2rem))] overflow-y-auto rounded-card border border-[var(--border)] bg-[var(--surface)] p-1 shadow-dialog ${
            menuAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive = idx === activeIndex;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(opt.value)}
                className={`flex min-h-[40px] w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left type-small transition-colors ${
                  isSelected
                    ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]'
                    : isActive
                    ? 'bg-[var(--surface-2)] text-[var(--text)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    className="h-4 w-4 shrink-0 text-[var(--accent-strong)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

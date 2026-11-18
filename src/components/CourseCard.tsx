import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';

interface CourseCardProps {
  course: Course;
  stats?: CourseStats;
  isSaved: boolean;
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
  layout?: 'grid' | 'list';
  variant?: 'default' | 'explore';
  index?: number;
  registerItemRef?: (index: number, el: HTMLButtonElement | null) => void;
  onItemKeyDown?: (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const RING_SIZE = 40;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2 - 2; // 16px radius inside 40x40 viewBox
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ExploreMetricsProps {
  courseCode: string;
  stats?: CourseStats;
  hasReviews: boolean;
  tooltipOpen: boolean;
  tooltipBelow?: boolean;
  tooltipAlign?: 'left' | 'right';
  onToggleTapTooltip: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCloseTooltip: () => void;
}

const ExploreMetricsCluster: React.FC<ExploreMetricsProps> = ({
  courseCode,
  stats,
  hasReviews,
  tooltipOpen,
  tooltipBelow = false,
  tooltipAlign = 'right',
  onToggleTapTooltip,
  onCloseTooltip,
}) => {
  const [ringRevealed, setRingRevealed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const hasAnimatedOnceRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedOnceRef.current) return;
    hasAnimatedOnceRef.current = true;
    if (ringRevealed) return;
    const raf = window.requestAnimationFrame(() => {
      setRingRevealed(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [ringRevealed]);

  const recommendPct =
    hasReviews && stats ? Math.max(0, Math.min(100, Math.round(stats.recommendationRate))) : 0;
  const targetOffset = hasReviews
    ? RING_CIRCUMFERENCE * (1 - recommendPct / 100)
    : RING_CIRCUMFERENCE;
  const strokeDashoffset = ringRevealed ? targetOffset : RING_CIRCUMFERENCE;

  const roundedDots =
    hasReviews && stats ? Math.max(1, Math.min(5, Math.round(stats.avgDifficulty))) : 0;
  const hoursLabel =
    hasReviews && stats ? `${stats.avgWeeklyHours.toFixed(1)} h/wk` : 'No reviews';

  const metricsAriaLabel =
    hasReviews && stats
      ? `${courseCode}: ${recommendPct}% recommend, difficulty ${stats.avgDifficulty.toFixed(1)} out of 5, ${stats.avgWeeklyHours.toFixed(1)} hours per week`
      : `${courseCode}: No student reviews yet`;

  return (
    <div className="relative z-10 flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onToggleTapTooltip}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && tooltipOpen) {
            e.stopPropagation();
            onCloseTooltip();
          }
        }}
        aria-label={metricsAriaLabel}
        aria-expanded={tooltipOpen}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-[var(--accent-strong)]"
      >
        <span className="relative inline-flex h-10 w-10 items-center justify-center">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth={RING_STROKE}
            />
            {hasReviews && (
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--chart)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            )}
          </svg>
          <span
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center text-[11px] font-semibold leading-none tabular-nums ${
              hasReviews ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {hasReviews ? `${recommendPct}%` : '—'}
          </span>
        </span>
      </button>

      <div className="flex flex-col items-end gap-1 min-w-[68px]" aria-hidden="true">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className={`h-1.5 w-1.5 rounded-full ${
                hasReviews && dot <= roundedDots
                  ? 'bg-[var(--chart)]'
                  : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-normal text-[var(--text-muted)] tabular-nums leading-none">
          {hoursLabel}
        </span>
      </div>

      {tooltipOpen && (
        <div
          role="tooltip"
          className={`absolute z-30 w-56 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left type-caption text-[var(--text)] shadow-dialog pointer-events-none ${
            tooltipAlign === 'left' ? 'left-0' : 'right-0'
          } ${
            tooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          {hasReviews && stats ? (
            <dl className="space-y-1 tabular-nums">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Recommend</dt>
                <dd className="font-semibold text-[var(--text)]">{recommendPct}%</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Difficulty</dt>
                <dd className="font-semibold text-[var(--text)]">
                  {stats.avgDifficulty.toFixed(1)} / 5
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[var(--text-muted)]">Workload</dt>
                <dd className="font-semibold text-[var(--text)]">
                  {stats.avgWeeklyHours.toFixed(1)} h/wk
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-[var(--text-muted)]">
              Recommend %, difficulty dots (1–5), and weekly hours appear once students submit reviews.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  stats,
  isSaved,
  onToggleSave,
  onOpenCourse,
  layout = 'grid',
  variant = 'default',
  index = 0,
  registerItemRef,
  onItemKeyDown,
}) => {
  const responseCount = stats?.responseCount ?? 0;
  const hasReviews = responseCount > 0;
  const [hoverTooltip, setHoverTooltip] = useState(false);
  const [tapTooltip, setTapTooltip] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const tooltipOpen = hoverTooltip || tapTooltip;

  useEffect(() => {
    if (!tapTooltip) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setTapTooltip(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTapTooltip(false);
        setHoverTooltip(false);
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
  }, [tapTooltip]);

  if (variant === 'explore') {
    const handlePrimaryKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ') {
        e.preventDefault();
        onToggleSave(course.id);
        return;
      }
      onItemKeyDown?.(index, e);
    };

    const handleRingTap = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setTapTooltip((prev) => !prev);
    };

    const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleSave(course.id);
    };

    const saveButton = (
      <button
        type="button"
        onClick={handleSaveClick}
        aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
        aria-pressed={isSaved}
        className={`relative z-10 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-control border transition-colors ${
          isSaved
            ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent-strong)] hover:text-[var(--text)]'
        }`}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
      </button>
    );

    if (layout === 'list') {
      return (
        <article
          ref={cardRef}
          data-course-row="true"
          onMouseEnter={() => setHoverTooltip(true)}
          onMouseLeave={() => setHoverTooltip(false)}
          className="font-explore group relative flex items-center justify-between gap-3 px-4 py-3 first:rounded-t-card last:rounded-b-card transition-colors hover:bg-[var(--surface-2)] has-[[data-course-primary]:focus-visible]:outline-2 has-[[data-course-primary]:focus-visible]:-outline-offset-2 has-[[data-course-primary]:focus-visible]:outline-[var(--accent-strong)]"
        >
          <div className="min-w-0 flex-1">
            <button
              ref={(el) => registerItemRef?.(index, el)}
              data-course-primary="true"
              type="button"
              onClick={() => onOpenCourse(course.id)}
              onKeyDown={handlePrimaryKeyDown}
              className="block w-full min-w-0 text-left focus-visible:outline-none after:absolute after:inset-0"
            >
              <div className="text-base font-semibold text-[var(--text)] tabular-nums truncate">
                {course.code}
              </div>
              <div className="mt-0.5 text-sm font-normal text-[var(--text-muted)] truncate">
                {course.title}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ExploreMetricsCluster
              courseCode={course.code}
              stats={stats}
              hasReviews={hasReviews}
              tooltipOpen={tooltipOpen}
              tooltipBelow={index === 0}
              onToggleTapTooltip={handleRingTap}
              onCloseTooltip={() => {
                setTapTooltip(false);
                setHoverTooltip(false);
              }}
            />
            {saveButton}
          </div>
        </article>
      );
    }

    return (
      <article
        ref={cardRef}
        data-course-row="true"
        onMouseEnter={() => setHoverTooltip(true)}
        onMouseLeave={() => setHoverTooltip(false)}
        className="font-explore group relative flex h-full flex-col justify-between gap-4 rounded-card border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent-strong)] has-[[data-course-primary]:focus-visible]:outline-2 has-[[data-course-primary]:focus-visible]:outline-offset-2 has-[[data-course-primary]:focus-visible]:outline-[var(--accent-strong)]"
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <button
            ref={(el) => registerItemRef?.(index, el)}
            data-course-primary="true"
            type="button"
            onClick={() => onOpenCourse(course.id)}
            onKeyDown={handlePrimaryKeyDown}
            className="min-w-0 flex-1 text-left focus-visible:outline-none after:absolute after:inset-0"
          >
            <div className="text-base font-semibold text-[var(--text)] tabular-nums truncate">
              {course.code}
            </div>
            <div className="mt-1 text-sm font-normal text-[var(--text-muted)] truncate">
              {course.title}
            </div>
          </button>

          {saveButton}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <ExploreMetricsCluster
            courseCode={course.code}
            stats={stats}
            hasReviews={hasReviews}
            tooltipOpen={tooltipOpen}
            tooltipBelow={index < 4}
            tooltipAlign="left"
            onToggleTapTooltip={handleRingTap}
            onCloseTooltip={() => {
              setTapTooltip(false);
              setHoverTooltip(false);
            }}
          />
        </div>
      </article>
    );
  }

  // Default variant preserved untouched for LandingPage & SavedCoursesPage
  if (layout === 'list') {
    return (
      <article className="surface-card-interactive group relative flex flex-col justify-between gap-4 rounded-card p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-[var(--text-muted)]">
            <span className="type-small font-semibold tabular-nums text-[var(--text)]">
              {course.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[var(--text-muted)]">{course.universityName}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="mt-1 inline-flex min-h-[44px] items-center rounded-control text-left"
          >
            <h3 className="type-body font-semibold text-[var(--text)]">
              {course.title}
            </h3>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 shrink-0 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0">
          {hasReviews && stats ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:items-center sm:gap-4 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2">
              <div className="text-left sm:text-right">
                <div className="type-caption text-[var(--text-muted)]">Difficulty</div>
                <div className="type-small font-semibold text-[var(--text)] tabular-nums">
                  {stats.avgDifficulty.toFixed(1)}/5
                </div>
              </div>
              <div className="sm:border-l sm:border-[var(--border)] sm:pl-4 text-left sm:text-right">
                <div className="type-caption text-[var(--text-muted)]">Weekly study</div>
                <div className="type-small font-semibold text-[var(--text)] tabular-nums">
                  {stats.avgWeeklyHours.toFixed(1)} hrs
                </div>
              </div>
              <div className="sm:border-l sm:border-[var(--border)] sm:pl-4 text-left sm:text-right">
                <div className="type-caption text-[var(--text-muted)]">Recommend</div>
                <div className="type-small font-semibold text-[var(--text)] tabular-nums">
                  {stats.recommendationRate}%
                </div>
              </div>
              <div className="sm:border-l sm:border-[var(--border)] sm:pl-4 text-left sm:text-right">
                <div className="type-caption text-[var(--text-muted)]">Responses</div>
                <div className="type-small font-semibold text-[var(--text)] tabular-nums">
                  {responseCount}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 type-caption text-[var(--text-muted)]">
              No student reviews yet.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
              aria-pressed={isSaved}
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control border transition-colors ${
                isSaved
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="btn-primary inline-flex flex-1 sm:flex-initial min-h-[44px] items-center justify-center gap-1 rounded-control px-3 py-2 type-caption font-semibold whitespace-nowrap"
            >
              <span>{hasReviews ? 'Open profile' : 'Be first to review'}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="surface-card-interactive group relative flex h-full flex-col justify-between rounded-card p-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-[var(--text-muted)]">
              <span className="type-small font-semibold tabular-nums text-[var(--text)]">
                {course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate font-medium text-[var(--text-muted)]">
                {course.universityName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="mt-1 inline-flex min-h-[44px] items-center rounded-control text-left"
            >
              <h3 className="type-body font-semibold text-[var(--text)] line-clamp-2">
                {course.title}
              </h3>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(course.id)}
            aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
            aria-pressed={isSaved}
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-control border transition-colors ${
              isSaved
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface)] hover:border-[var(--accent-strong)] hover:text-[var(--text)]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {hasReviews && stats ? (
          <div className="grid grid-cols-3 gap-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
            <div className="min-w-0">
              <div className="type-caption text-[var(--text-muted)] truncate">Difficulty</div>
              <div className="mt-1 type-small sm:type-body font-semibold text-[var(--text)] tabular-nums">
                {stats.avgDifficulty.toFixed(1)}
                <span className="type-caption font-normal text-[var(--text-muted)]">/5</span>
              </div>
            </div>
            <div className="min-w-0 border-l border-[var(--border)] pl-2 sm:pl-3">
              <div className="type-caption text-[var(--text-muted)] truncate">Weekly</div>
              <div className="mt-1 type-small sm:type-body font-semibold text-[var(--text)] tabular-nums">
                {stats.avgWeeklyHours.toFixed(1)}
                <span className="type-caption font-normal text-[var(--text-muted)]">h</span>
              </div>
            </div>
            <div className="min-w-0 border-l border-[var(--border)] pl-2 sm:pl-3">
              <div className="type-caption text-[var(--text-muted)] truncate">Recommend</div>
              <div className="mt-1 type-small sm:type-body font-semibold text-[var(--text)] tabular-nums">
                {stats.recommendationRate}%
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 type-small font-medium text-[var(--text-muted)]">
            No student reviews yet.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 type-caption">
          <span className="font-medium text-[var(--text-muted)] tabular-nums truncate">
            {hasReviews
              ? `${responseCount} ${responseCount === 1 ? 'response' : 'responses'}`
              : 'Official 2026–2027 Catalogue'}
          </span>

          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="btn-soft inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 type-caption font-semibold whitespace-nowrap shrink-0"
          >
            <span>{hasReviews ? 'Open profile' : 'Be first to review'}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

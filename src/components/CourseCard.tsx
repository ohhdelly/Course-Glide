import React from 'react';
import { ArrowUpRight, Bookmark } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';
import { useUniversityTheme } from '../theme/ThemeContext';
import { getUniversityCardAccent } from '../theme/universityTheme';

interface CourseCardProps {
  course: Course;
  stats?: CourseStats;
  isSaved: boolean;
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
  layout?: 'grid' | 'list';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  stats,
  isSaved,
  onToggleSave,
  onOpenCourse,
  layout = 'grid',
}) => {
  const { themeId } = useUniversityTheme();
  const isMixedNeutral = themeId === 'neutral';
  const uniAccent = getUniversityCardAccent(course.universityId);
  const responseCount = stats?.responseCount ?? 0;
  const hasReviews = responseCount > 0;

  const codeClass = isMixedNeutral ? uniAccent.codeClass : 'text-[var(--accent-code)]';

  if (layout === 'list') {
    return (
      <article
        className={`surface-card-interactive group relative flex flex-col justify-between gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center focus-within:border-[var(--ring)] ${
          isMixedNeutral ? uniAccent.hoverBorderClass : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
            {isMixedNeutral && (
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-[2px] shrink-0"
                style={{ backgroundColor: uniAccent.stripeColor }}
              />
            )}
            <span className={`font-mono text-sm font-bold tabular-nums ${codeClass}`}>
              {course.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[var(--text-secondary)]">{course.universityName}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="mt-1 block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
          >
            <h3 className="font-display text-[17px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
              {course.title}
            </h3>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0">
          {hasReviews && stats ? (
            <div className="flex items-center gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2">
              <div className="text-left sm:text-right">
                <div className="text-xs font-medium text-[var(--text-muted)]">Difficulty</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
                  {stats.avgDifficulty.toFixed(1)}/5
                </div>
              </div>
              <div className="border-l border-[var(--border)] pl-4 text-left sm:text-right">
                <div className="text-xs font-medium text-[var(--text-muted)]">Weekly study</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
                  {stats.avgWeeklyHours.toFixed(1)} hrs
                </div>
              </div>
              <div className="border-l border-[var(--border)] pl-4 text-left sm:text-right">
                <div className="text-xs font-medium text-[var(--text-muted)]">Recommend</div>
                <div className="font-mono text-sm font-bold text-[var(--status-positive)] tabular-nums">
                  {stats.recommendationRate}%
                </div>
              </div>
              <div className="border-l border-[var(--border)] pl-4 text-left sm:text-right">
                <div className="text-xs font-medium text-[var(--text-muted)]">Responses</div>
                <div className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
                  {responseCount}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
              No student reviews yet.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
              aria-pressed={isSaved}
              className={`inline-flex items-center justify-center rounded-xl border p-2.5 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                isSaved
                  ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="btn-primary inline-flex items-center gap-1 rounded-xl px-3.5 py-2.5 text-xs font-semibold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap"
            >
              <span>{hasReviews ? 'Open profile' : 'Be first to review'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`surface-card-interactive group relative flex h-full flex-col justify-between rounded-2xl p-5 focus-within:border-[var(--ring)] ${
        isMixedNeutral ? uniAccent.hoverBorderClass : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
              {isMixedNeutral && (
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-[2px] shrink-0"
                  style={{ backgroundColor: uniAccent.stripeColor }}
                />
              )}
              <span className={`font-mono text-sm font-bold tabular-nums ${codeClass}`}>
                {course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate font-medium text-[var(--text-secondary)]">
                {course.universityName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="mt-1.5 block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              <h3 className="font-display text-[17px] font-semibold leading-snug text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-text)] transition-colors">
                {course.title}
              </h3>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(course.id)}
            aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
            aria-pressed={isSaved}
            className={`shrink-0 rounded-xl border p-2 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              isSaved
                ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {hasReviews && stats ? (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-3">
            <div>
              <div className="text-xs font-medium text-[var(--text-muted)]">Difficulty</div>
              <div className="mt-0.5 font-mono text-base font-bold text-[var(--text-primary)] tabular-nums">
                {stats.avgDifficulty.toFixed(1)}
                <span className="text-xs font-normal text-[var(--text-muted)]">/5</span>
              </div>
            </div>
            <div className="border-l border-[var(--border)] pl-3">
              <div className="text-xs font-medium text-[var(--text-muted)]">Weekly</div>
              <div className="mt-0.5 font-mono text-base font-bold text-[var(--text-primary)] tabular-nums">
                {stats.avgWeeklyHours.toFixed(1)}
                <span className="text-xs font-normal text-[var(--text-muted)]">h</span>
              </div>
            </div>
            <div className="border-l border-[var(--border)] pl-3">
              <div className="text-xs font-medium text-[var(--text-muted)]">Recommend</div>
              <div className="mt-0.5 font-mono text-base font-bold text-[var(--status-positive)] tabular-nums">
                {stats.recommendationRate}%
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-3.5 text-sm font-medium text-[var(--text-secondary)]">
            No student reviews yet.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          <span className="font-medium text-[var(--text-secondary)] tabular-nums">
            {hasReviews
              ? `${responseCount} ${responseCount === 1 ? 'response' : 'responses'}`
              : 'Official 2026–2027 Catalogue'}
          </span>

          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="btn-soft inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap shrink-0"
          >
            <span>{hasReviews ? 'Open profile' : 'Be first to review'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};


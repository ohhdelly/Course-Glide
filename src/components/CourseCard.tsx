import React from 'react';
import { ArrowUpRight, Bookmark, CheckCircle2, Info } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';

interface CourseCardProps {
  course: Course;
  stats: CourseStats;
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
  const confidenceText =
    stats.confidenceLevel === 'strong'
      ? 'High response depth'
      : stats.confidenceLevel === 'moderate'
      ? 'Moderate sample'
      : 'Limited sample';

  if (layout === 'list') {
    return (
      <article className="surface-card-interactive group flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-1.5">
            <span className="rounded-md bg-blue-50/90 px-2 py-0.5 font-mono font-semibold text-blue-800 tabular-nums">
              {course.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-600">{course.universityName}</span>
            <span aria-hidden="true">·</span>
            <span>{course.department}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
              {course.title}
            </h3>
          </button>
          <p className="mt-1 line-clamp-1 text-sm text-slate-600">{course.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
          <div className="flex items-center gap-5 rounded-xl border border-slate-200/70 bg-[#F4F7FB] px-4 py-2.5">
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-medium text-slate-500">Difficulty</div>
              <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {stats.avgDifficulty.toFixed(1)} / 5
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-medium text-slate-500">Weekly study</div>
              <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {stats.avgWeeklyHours.toFixed(1)} hrs
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-medium text-slate-500">Recommended</div>
              <div className="font-mono text-sm font-semibold text-teal-700 tabular-nums">
                {stats.recommendationRate}%
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-medium text-slate-500">Responses</div>
              <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {stats.responseCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
              aria-pressed={isSaved}
              className={`inline-flex items-center justify-center rounded-xl border px-2.5 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSaved
                  ? 'border-blue-200 bg-blue-50/90 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-[#F5F8FC] hover:text-slate-900'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-blue-700' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
            >
              <span>Inspect</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="surface-card-interactive group flex flex-col justify-between rounded-2xl p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className="rounded-md bg-blue-50/95 px-2 py-0.5 font-mono font-semibold text-blue-800 tabular-nums">
                {course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate font-medium text-slate-600">{course.universityName}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenCourse(course.id)}
              className="mt-2 block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
            >
              <h3 className="font-display text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors">
                {course.title}
              </h3>
            </button>
            <p className="mt-1 text-xs text-slate-500">
              {course.department} · Level {course.level}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(course.id)}
            aria-label={isSaved ? `Remove ${course.code} from saved courses` : `Save ${course.code}`}
            aria-pressed={isSaved}
            className={`shrink-0 rounded-xl border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isSaved
                ? 'border-blue-200 bg-blue-50/90 text-blue-700'
                : 'border-slate-200/90 bg-[#F8FAFD] text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-blue-700' : ''}`} />
          </button>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {course.description}
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200/70 bg-[#F4F7FB] p-3">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Difficulty</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {stats.avgDifficulty.toFixed(1)}<span className="text-xs font-normal text-slate-400">/5</span>
            </div>
          </div>
          <div className="border-l border-slate-200/80 pl-2.5">
            <div className="text-[11px] font-medium text-slate-500">Weekly study</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {stats.avgWeeklyHours.toFixed(1)}<span className="text-xs font-normal text-slate-500"> hrs</span>
            </div>
          </div>
          <div className="border-l border-slate-200/80 pl-2.5">
            <div className="text-[11px] font-medium text-slate-500">Recommend</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-teal-700 tabular-nums">
              {stats.recommendationRate}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            {stats.confidenceLevel === 'limited' ? (
              <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" aria-hidden="true" />
            )}
            <span className="tabular-nums">
              {stats.responseCount} responses · {confidenceText}
            </span>
          </span>

          <button
            type="button"
            onClick={() => onOpenCourse(course.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EFF4FB] px-2.5 py-1 font-semibold text-blue-700 transition-colors hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
          >
            <span>Open profile</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

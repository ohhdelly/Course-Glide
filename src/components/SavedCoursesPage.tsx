import React from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';
import { CourseCard } from './CourseCard';
import { useUniversityTheme } from '../theme/ThemeContext';
import { getUniversityCardAccent } from '../theme/universityTheme';

interface SavedCoursesPageProps {
  courses: Course[];
  statsMap: Record<string, CourseStats>;
  savedCourseIds: string[];
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
  onGoExplore: () => void;
}

export const SavedCoursesPage: React.FC<SavedCoursesPageProps> = ({
  courses,
  statsMap,
  savedCourseIds,
  onToggleSave,
  onOpenCourse,
  onGoExplore,
}) => {
  const { themeId } = useUniversityTheme();
  const savedCourses = courses.filter((c) => savedCourseIds.includes(c.id));

  const reviewedSavedCourses = savedCourses.filter(
    (c) => (statsMap[c.id]?.responseCount ?? 0) > 0
  );
  const totalWeeklyHours = reviewedSavedCourses.reduce(
    (sum, c) => sum + (statsMap[c.id]?.avgWeeklyHours ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Saved Courses
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Compare workload expectations and jump directly into saved course profiles.
          </p>
        </div>

        {savedCourses.length > 0 && (
          <div className="surface-card rounded-2xl px-5 py-3.5 text-right">
            <div className="text-xs text-[var(--text-muted)]">Combined self-reported workload</div>
            <div className="font-mono text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {reviewedSavedCourses.length > 0 ? (
                <>
                  {totalWeeklyHours.toFixed(1)} hrs/wk{' '}
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    across {reviewedSavedCourses.length} reviewed course
                    {reviewedSavedCourses.length === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  No student workload data yet
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {savedCourses.length === 0 ? (
        <section className="surface-card rounded-2xl p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent-text)]">
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">
            No courses saved yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--text-secondary)]">
            Bookmark courses while browsing to compare weekly study hours, difficulty ratings, and
            recommended study strategies side by side.
          </p>
          <button
            type="button"
            onClick={onGoExplore}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs"
          >
            <span>Explore Courses</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {savedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                stats={statsMap[course.id]}
                isSaved={true}
                onToggleSave={onToggleSave}
                onOpenCourse={onOpenCourse}
              />
            ))}
          </div>

          {/* Side-by-Side Comparison Table */}
          <section className="surface-card rounded-2xl overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-4">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Workload & Strategy Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-semibold text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">University</th>
                    <th className="px-5 py-3 text-right">Difficulty</th>
                    <th className="px-5 py-3 text-right">Weekly Study</th>
                    <th className="px-5 py-3 text-right">Recommended</th>
                    <th className="px-5 py-3">Top Reported Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {savedCourses.map((course) => {
                    const s = statsMap[course.id];
                    const hasReviews = (s?.responseCount ?? 0) > 0;
                    const topStrategy = s?.studyStrategyStats[0];
                    const codeColor =
                      themeId === 'neutral'
                        ? getUniversityCardAccent(course.universityId).codeClass
                        : 'text-[var(--accent-code)]';
                    return (
                      <tr key={course.id} className="transition-colors hover:bg-[var(--surface-accent)]/40">
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => onOpenCourse(course.id)}
                            className="font-semibold hover:underline text-left"
                          >
                            <span className={`font-mono mr-1.5 ${codeColor}`}>{course.code}</span>
                            <span className="text-[var(--text-primary)]">{course.title}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)]">{course.universityName}</td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[var(--text-primary)]">
                          {hasReviews && s ? `${s.avgDifficulty.toFixed(1)} / 5` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[var(--text-primary)]">
                          {hasReviews && s ? `${s.avgWeeklyHours.toFixed(1)} hrs` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-[var(--status-positive)] font-semibold">
                          {hasReviews && s ? `${s.recommendationRate}%` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)]">
                          {topStrategy
                            ? `${topStrategy.label} (${topStrategy.helpfulPercentage}% of ${topStrategy.usedCount})`
                            : 'No student reviews yet'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

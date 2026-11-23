import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';
import { CourseCard } from './CourseCard';
import { TermWorkloadMeter } from './charts/TermWorkloadMeter';

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
  const savedCourses = courses.filter((c) => savedCourseIds.includes(c.id));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="type-h1 text-[var(--text)]">
          Saved Courses
        </h1>
      </div>

      {savedCourses.length > 0 && (
        <TermWorkloadMeter courses={savedCourses} statsMap={statsMap} />
      )}

      {savedCourses.length === 0 ? (
        <section className="surface-card rounded-card p-8 sm:p-12 text-center">
          <h2 className="type-h2 text-[var(--text)]">
            No courses saved yet
          </h2>
          <button
            type="button"
            onClick={onGoExplore}
            className="btn-primary mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 type-small font-semibold"
          >
            <span>Explore Courses</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {/* Side-by-Side Comparison: Stacked Cards on Mobile, Structured Table on md+ */}
          <section className="surface-card rounded-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="type-body font-semibold text-[var(--text)]">
                Workload &amp; Strategy Comparison
              </h2>
            </div>

            {/* Mobile stacked comparison cards (< md) */}
            <div className="divide-y divide-[var(--border)] md:hidden">
              {savedCourses.map((course) => {
                const s = statsMap[course.id];
                const hasReviews = (s?.responseCount ?? 0) > 0;
                const topStrategy = s?.studyStrategyStats[0];
                return (
                  <div key={course.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenCourse(course.id)}
                        className="min-h-[44px] text-left rounded-control py-1"
                      >
                        <div className="type-caption font-semibold text-[var(--text)] tabular-nums">{course.code}</div>
                        <div className="type-small font-semibold text-[var(--text)]">
                          {course.title}
                        </div>
                        <div className="type-caption text-[var(--text-muted)]">{course.universityName}</div>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-3 type-caption">
                      <div>
                        <div className="type-caption text-[var(--text-muted)]">Difficulty</div>
                        <div className="font-semibold text-[var(--text)] tabular-nums">
                          {hasReviews && s ? `${s.avgDifficulty.toFixed(1)}/5` : '—'}
                        </div>
                      </div>
                      <div className="border-l border-[var(--border)] pl-2">
                        <div className="type-caption text-[var(--text-muted)]">Weekly</div>
                        <div className="font-semibold text-[var(--text)] tabular-nums">
                          {hasReviews && s ? `${s.avgWeeklyHours.toFixed(1)}h` : '—'}
                        </div>
                      </div>
                      <div className="border-l border-[var(--border)] pl-2">
                        <div className="type-caption text-[var(--text-muted)]">Recommend</div>
                        <div className="font-semibold text-[var(--text)] tabular-nums">
                          {hasReviews && s ? `${s.recommendationRate}%` : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="type-caption text-[var(--text-muted)] tabular-nums">
                      <span className="font-semibold text-[var(--text)]">Top strategy: </span>
                      {topStrategy
                        ? `${topStrategy.label} (${topStrategy.helpfulPercentage}% of ${topStrategy.usedCount})`
                        : 'No student reviews yet'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left type-small">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-2)] type-caption font-semibold text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3 text-right">Difficulty</th>
                    <th className="px-4 py-3 text-right">Weekly Study</th>
                    <th className="px-4 py-3 text-right">Recommended</th>
                    <th className="px-4 py-3">Top Reported Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {savedCourses.map((course) => {
                    const s = statsMap[course.id];
                    const hasReviews = (s?.responseCount ?? 0) > 0;
                    const topStrategy = s?.studyStrategyStats[0];
                    return (
                      <tr key={course.id} className="transition-colors hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onOpenCourse(course.id)}
                            className="inline-flex min-h-[44px] items-center rounded-control px-1 font-semibold hover:underline text-left"
                          >
                            <span className="mr-2 text-[var(--text)] tabular-nums">{course.code}</span>
                            <span className="text-[var(--text)]">{course.title}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{course.universityName}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--text)]">
                          {hasReviews && s ? `${s.avgDifficulty.toFixed(1)} / 5` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--text)]">
                          {hasReviews && s ? `${s.avgWeeklyHours.toFixed(1)} hrs` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--text)] font-semibold">
                          {hasReviews && s ? `${s.recommendationRate}%` : '—'}
                        </td>
                        <td className="px-4 py-3 type-caption text-[var(--text-muted)] tabular-nums">
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

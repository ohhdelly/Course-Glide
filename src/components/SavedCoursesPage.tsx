import React from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import type { Course, CourseStats } from '../types/course';
import { CourseCard } from './CourseCard';

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

  const totalWeeklyHours = savedCourses.reduce(
    (sum, c) => sum + (statsMap[c.id]?.avgWeeklyHours ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Saved Courses
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Compare workload expectations and jump directly into saved course intelligence profiles.
          </p>
        </div>

        {savedCourses.length > 0 && (
          <div className="surface-card rounded-2xl px-5 py-3.5 text-right">
            <div className="text-xs text-slate-500">Combined self-reported workload</div>
            <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
              {totalWeeklyHours.toFixed(1)} hrs/wk{' '}
              <span className="text-xs font-normal text-slate-500">
                across {savedCourses.length} course{savedCourses.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}
      </div>

      {savedCourses.length === 0 ? (
        <section className="surface-card rounded-2xl p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
            No courses saved yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
            Bookmark courses while browsing to compare weekly study hours, difficulty ratings, and
            recommended study strategies side by side.
          </p>
          <button
            type="button"
            onClick={onGoExplore}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-800"
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
            <div className="border-b border-slate-200/80 bg-[#F8FAFD] px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Workload & Strategy Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-[#F4F7FB] text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Course</th>
                    <th className="px-5 py-3">University</th>
                    <th className="px-5 py-3 text-right">Difficulty</th>
                    <th className="px-5 py-3 text-right">Weekly Study</th>
                    <th className="px-5 py-3 text-right">Recommended</th>
                    <th className="px-5 py-3">Top Reported Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedCourses.map((course) => {
                    const s = statsMap[course.id];
                    const topStrategy = s?.studyStrategyStats[0];
                    return (
                      <tr key={course.id} className="transition-colors hover:bg-[#F7FAFE]">
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => onOpenCourse(course.id)}
                            className="font-semibold text-blue-700 hover:underline text-left"
                          >
                            <span className="font-mono mr-1.5">{course.code}</span>
                            <span className="text-slate-900">{course.title}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{course.universityName}</td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-900">
                          {s.avgDifficulty.toFixed(1)} / 5
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-900">
                          {s.avgWeeklyHours.toFixed(1)} hrs
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-teal-700 font-semibold">
                          {s.recommendationRate}%
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {topStrategy
                            ? `${topStrategy.label} (${topStrategy.helpfulPercentage}% of ${topStrategy.usedCount})`
                            : 'No strategy data yet'}
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

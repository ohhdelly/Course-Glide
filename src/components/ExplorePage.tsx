import React, { useMemo, useState } from 'react';
import { LayoutGrid, List, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Course, CourseFilters, CourseStats, University, UniversityId } from '../types/course';
import { filterAndSearchCourses } from '../utils/trustLens';
import { CourseCard } from './CourseCard';

interface ExplorePageProps {
  courses: Course[];
  universities: University[];
  statsMap: Record<string, CourseStats>;
  instructorsByCourse: Record<string, string[]>;
  selectedUniversity: UniversityId;
  onSelectUniversity: (id: UniversityId) => void;
  initialQuery?: string;
  savedCourseIds: string[];
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  courses,
  universities,
  statsMap,
  instructorsByCourse,
  selectedUniversity,
  onSelectUniversity,
  initialQuery = '',
  savedCourseIds,
  onToggleSave,
  onOpenCourse,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [department, setDepartment] = useState<string>('all');
  const [level, setLevel] = useState<CourseFilters['level']>('all');
  const [maxDifficulty, setMaxDifficulty] = useState<CourseFilters['maxDifficulty']>('all');
  const [maxHours, setMaxHours] = useState<CourseFilters['maxHours']>('all');
  const [sortBy, setSortBy] = useState<CourseFilters['sortBy']>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const departments = useMemo(() => {
    const relevantCourses =
      selectedUniversity === 'all'
        ? courses
        : courses.filter((c) => c.universityId === selectedUniversity);
    return Array.from(new Set(relevantCourses.map((c) => c.department))).sort();
  }, [courses, selectedUniversity]);

  const filters: CourseFilters = {
    universityId: selectedUniversity,
    department,
    level,
    maxDifficulty,
    maxHours,
    sortBy,
  };

  const filteredCourses = useMemo(
    () => filterAndSearchCourses(courses, statsMap, instructorsByCourse, query, filters),
    [courses, statsMap, instructorsByCourse, query, selectedUniversity, department, level, maxDifficulty, maxHours, sortBy]
  );

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedUniversity !== 'all' ||
    department !== 'all' ||
    level !== 'all' ||
    maxDifficulty !== 'all' ||
    maxHours !== 'all';

  const resetFilters = () => {
    setQuery('');
    onSelectUniversity('all');
    setDepartment('all');
    setLevel('all');
    setMaxDifficulty('all');
    setMaxHours('all');
    setSortBy('relevance');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Explore Courses
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Compare workload, difficulty, and Trust Lens feedback across institutions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            role="group"
            aria-label="Course view layout"
            className="inline-flex rounded-xl border border-slate-200/80 bg-[#E6ECF4] p-1"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filter Controls */}
      <section
        aria-label="Search and filters"
        className="rounded-2xl border border-slate-200/90 bg-[#F8FAFD] p-4 sm:p-5 mb-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)]"
      >
        <div className="relative">
          <div className="flex items-center rounded-xl border border-slate-200/90 bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-600/12">
            <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAutocompleteOpen(true);
              }}
              onFocus={() => setAutocompleteOpen(true)}
              onBlur={() => setTimeout(() => setAutocompleteOpen(false), 180)}
              placeholder="Search code, title, or instructor..."
              aria-label="Search courses"
              className="w-full bg-transparent px-2.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {autocompleteOpen && query.trim().length > 0 && filteredCourses.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
              <ul className="divide-y divide-slate-100">
                {filteredCourses.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onOpenCourse(c.id);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        <span className="font-mono font-semibold text-blue-700 mr-2">
                          {c.code}
                        </span>
                        <span className="text-slate-900">{c.title}</span>
                      </span>
                      <span className="text-xs text-slate-500">{c.universityName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label htmlFor="filter-uni" className="block text-[11px] font-medium text-slate-500 mb-1">
              University
            </label>
            <select
              id="filter-uni"
              value={selectedUniversity}
              onChange={(e) => {
                onSelectUniversity(e.target.value as UniversityId);
                setDepartment('all');
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-dept" className="block text-[11px] font-medium text-slate-500 mb-1">
              Department
            </label>
            <select
              id="filter-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-level" className="block text-[11px] font-medium text-slate-500 mb-1">
              Course Level
            </label>
            <select
              id="filter-level"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 100 | 200 | 300 | 400))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="100">100-level (Intro)</option>
              <option value="200">200-level (Intermediate)</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-diff" className="block text-[11px] font-medium text-slate-500 mb-1">
              Max Difficulty
            </label>
            <select
              id="filter-diff"
              value={maxDifficulty}
              onChange={(e) =>
                setMaxDifficulty(
                  e.target.value === 'all' ? 'all' : (Number(e.target.value) as 2 | 3 | 4 | 5)
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Any Difficulty</option>
              <option value="3">Up to 3.0 / 5</option>
              <option value="4">Up to 4.0 / 5</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-hours" className="block text-[11px] font-medium text-slate-500 mb-1">
              Avg Weekly Hours
            </label>
            <select
              id="filter-hours"
              value={maxHours}
              onChange={(e) =>
                setMaxHours(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 6 | 10 | 14))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Any Workload</option>
              <option value="6">Under 6 hrs/wk</option>
              <option value="10">Under 10 hrs/wk</option>
              <option value="14">Under 14 hrs/wk</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-sort" className="block text-[11px] font-medium text-slate-500 mb-1">
              Sort By
            </label>
            <select
              id="filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CourseFilters['sortBy'])}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="recommended">Highest Recommended</option>
              <option value="reviews">Most Responses</option>
              <option value="workload_asc">Lowest Workload</option>
              <option value="workload_desc">Highest Workload</option>
            </select>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="tabular-nums">
            Showing <strong className="font-semibold text-slate-900">{filteredCourses.length}</strong> of{' '}
            {courses.length} demonstration courses
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-800"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Results */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            No courses match your current filters
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Try widening your difficulty or weekly study hours threshold, or clearing the search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={statsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={statsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
              layout="list"
            />
          ))}
        </div>
      )}
    </main>
  );
};

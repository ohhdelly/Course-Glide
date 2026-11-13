import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { Course, CourseStats, UniversityId } from '../types/course';
import { scoreCourseSearchMatch } from '../utils/trustLens';
import { CourseCard } from './CourseCard';

interface LandingPageProps {
  courses: Course[];
  statsMap: Record<string, CourseStats>;
  instructorsByCourse: Record<string, string[]>;
  selectedUniversity: UniversityId;
  savedCourseIds: string[];
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (
    courseId: string,
    tab?: 'overview' | 'reviews' | 'teaching' | 'strategies'
  ) => void;
  onSearchSubmit: (query: string) => void;
  onGoExplore: () => void;
  onGoHowItWorks: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  courses,
  statsMap,
  instructorsByCourse,
  selectedUniversity,
  savedCourseIds,
  onToggleSave,
  onOpenCourse,
  onSearchSubmit,
  onGoExplore,
  onGoHowItWorks,
}) => {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [previewTrustMode, setPreviewTrustMode] = useState<'most_informative' | 'all'>(
    'most_informative'
  );

  const universityFiltered = useMemo(() => {
    if (selectedUniversity === 'all') return courses;
    return courses.filter((c) => c.universityId === selectedUniversity);
  }, [courses, selectedUniversity]);

  const autocompleteMatches = useMemo(() => {
    const q = query.trim();
    if (!q) return universityFiltered.slice(0, 5);
    return universityFiltered
      .map((course) => ({
        course,
        score: scoreCourseSearchMatch(course, instructorsByCourse[course.id] ?? [], q),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.course);
  }, [query, universityFiltered, instructorsByCourse]);

  const curatedCourses = useMemo(() => {
    const priorityIds = ['math-137', 'cs-135', 'econ-101', 'mat-1320', 'gng-1105'];
    const pool = universityFiltered;
    const ordered = priorityIds
      .map((id) => pool.find((c) => c.id === id))
      .filter((c): c is Course => Boolean(c));
    if (ordered.length >= 3) return ordered.slice(0, 5);
    return pool.slice(0, 5);
  }, [universityFiltered]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (autocompleteMatches.length === 1 && query.trim().length >= 3) {
      onOpenCourse(autocompleteMatches[0].id);
    } else {
      onSearchSubmit(query);
    }
  };

  return (
    <main>
      {/* Hero Section with Restrained Cool-Mist Gradient */}
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-[#E8EFFA] via-[#F2F6FC] to-[#F1F4F9]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-white/85 px-3.5 py-1 text-xs font-medium text-blue-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              University of Waterloo · University of Ottawa · Demonstration dataset
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-slate-900 text-balance sm:text-5xl">
              Choose your courses with clarity, not chaos.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Discover trustworthy student feedback, transparent course insights, and study
              strategies that help you make smarter academic decisions.
            </p>

            {/* Elevated Search Bar with Autocomplete */}
            <form
              onSubmit={handleFormSubmit}
              className="relative mx-auto mt-8 max-w-2xl text-left"
              role="search"
              aria-label="Course search"
            >
              <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(29,78,216,0.16),0_2px_6px_rgba(15,23,42,0.05)] transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-600/10">
                <Search
                  className="ml-3.5 h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  placeholder="Search courses, course codes, or instructors..."
                  aria-label="Search courses, course codes, or instructors"
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-base"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-700 px-4.5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
                >
                  <span>Search</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {searchFocused && autocompleteMatches.length > 0 && (
                <div
                  role="listbox"
                  aria-label="Course suggestions"
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-12px_rgba(15,23,42,0.14)]"
                >
                  <div className="border-b border-slate-100 bg-[#F5F8FC] px-4 py-2 text-[11px] font-medium text-slate-500">
                    {query.trim() ? 'Matching courses' : 'Popular demonstration courses'}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {autocompleteMatches.map((course) => {
                      const s = statsMap[course.id];
                      return (
                        <li key={course.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onOpenCourse(course.id);
                            }}
                            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[#F5F8FC] focus-visible:bg-[#F5F8FC] focus-visible:outline-none"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-800">
                                  {course.code}
                                </span>
                                <span className="truncate text-sm font-medium text-slate-900">
                                  {course.title}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {course.universityName} · {course.department}
                              </div>
                            </div>
                            <div className="shrink-0 text-right font-mono text-xs text-slate-600 tabular-nums">
                              {s?.avgWeeklyHours.toFixed(1)} hrs/wk · {s?.recommendationRate}% rec
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span>Try searching:</span>
                {['MATH 137', 'CS 135', 'ECON 101', 'MAT 1320', 'GNG 1105'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      const found = courses.find((c) => c.code === sample);
                      if (found) onOpenCourse(found.id);
                    }}
                    className="rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1 font-mono font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Curated Courses Section on Mist Canvas */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Curated Course Profiles
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Explore self-reported workload benchmarks, Trust Lens review analysis, and teaching-team insights.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoExplore}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs transition-all hover:border-blue-200 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap self-start sm:self-auto"
          >
            <span>Browse all {courses.length} courses</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {curatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={statsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={(id) => onOpenCourse(id)}
            />
          ))}
        </div>
      </section>

      {/* Interactive Product Preview & Three Pillars */}
      <section className="border-t border-slate-200/80 bg-[#E8EEF6]/75 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
              Built to answer what actually matters before enrollment.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
              Instead of scrolling through unverified hot takes, CourseGlide structures student
              experience into three connected layers of academic intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            {/* Left: Interactive Trust Lens Preview Card (7 cols) */}
            <div className="surface-card lg:col-span-7 flex flex-col justify-between rounded-2xl p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span>Interactive Preview: CourseGlide Trust Lens on MATH 137</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Toggle modes to see how Trust Lens prioritizes specificity while preserving legitimate criticism.
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Trust Lens preview toggle"
                    className="inline-flex rounded-xl border border-slate-200/80 bg-[#EFF3F8] p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewTrustMode('most_informative')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        previewTrustMode === 'most_informative'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Most Informative
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTrustMode('all')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        previewTrustMode === 'all'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Reviews
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {previewTrustMode === 'most_informative' ? (
                    <>
                      <div className="rounded-xl border border-slate-200/80 bg-[#F7FAFE] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">
                            Fall 2025 · 11 hrs/wk · Recommended
                          </span>
                          <span className="rounded-md bg-teal-50 px-2 py-0.5 font-mono text-[11px] font-medium text-teal-800">
                            Detailed Feedback · Course-Specific
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          “Weeks 3–6 moved rapidly through formal limit proofs. Draft assignment
                          proofs in rough form by Tuesday so you can bring specific questions to
                          Wednesday tutorial or TA office hours.”
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200/80 bg-[#F7FAFE] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">
                            Fall 2025 · 15 hrs/wk · Not Recommended
                          </span>
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-medium text-blue-800">
                            Balanced Critique · Detailed Feedback
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          “Assignment 4 and the midterm tested inequality bounding never drilled in
                          lecture. TA Devon Brooks explained counterexamples clearly during office
                          hours—solve workbook proofs under timed conditions.”
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 opacity-90">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-800">
                            Fall 2025 · 20 hrs/wk · Not Recommended
                          </span>
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-800">
                            Limited Context
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          “Worst class ever lol, totally impossible. Drop it.”
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-4 opacity-90">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-800">
                            Fall 2025 · 2 hrs/wk · Recommended
                          </span>
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-800">
                            Limited Context
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          “Super easy A+, barely showed up. Just wing it.”
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Fairness rule: Critical reviews with concrete evidence rank equally with positive reviews.
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCourse('math-137', 'reviews')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF4FB] px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-700 hover:text-white whitespace-nowrap"
                >
                  <span>Test Trust Lens on MATH 137</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right: Three Pillars Stack (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    01. Trustworthy Feedback
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Evaluate the context and usefulness of student reviews using transparent
                  course-specificity signals, term context, and duplicate detection—without silencing
                  strong criticism.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    02. Course Intelligence
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  See clear difficulty distributions, weekly study hours, teaching-team feedback by
                  professor and TA, and sample-size confidence notes before you register.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <BookOpenCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    03. Study Smarter
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Learn which preparation strategies past students actually found useful, matched to
                  your learning preferences and grounded in real respondent counts.
                </p>
                <button
                  type="button"
                  onClick={onGoHowItWorks}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <span>Read our methodology</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

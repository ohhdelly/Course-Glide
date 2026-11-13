import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  CatalogueMetadata,
  Course,
  CourseStats,
  PaginatedCoursesResponse,
  UniversityId,
} from '../types/course';
import { scoreCourseSearchMatch } from '../utils/trustLens';
import { CourseCard } from './CourseCard';

interface LandingPageProps {
  courses: Course[];
  catalogueMeta: CatalogueMetadata | null;
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
  catalogueMeta,
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
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const [remoteState, setRemoteState] = useState<{
    query: string;
    matches: Course[];
    statsMap: Record<string, CourseStats>;
  } | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [previewTrustMode, setPreviewTrustMode] = useState<'most_informative' | 'all'>(
    'most_informative'
  );

  const universityFiltered = useMemo(() => {
    if (selectedUniversity === 'all') return courses;
    return courses.filter((c) => c.universityId === selectedUniversity);
  }, [courses, selectedUniversity]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setRemoteState(null);
      setRemoteLoading(false);
      setActiveSuggestionIdx(-1);
      return;
    }

    setRemoteLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          universityId: selectedUniversity,
          sortBy: 'relevance',
          limit: '5',
          page: '1',
        });
        const res = await fetch(`/api/courses?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setRemoteLoading(false);
          return;
        }
        const data = (await res.json()) as PaginatedCoursesResponse;
        setRemoteState({
          query: trimmed,
          matches: data.courses,
          statsMap: data.statsMap ?? {},
        });
        setRemoteLoading(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setRemoteState(null);
          setRemoteLoading(false);
        }
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, selectedUniversity]);

  const localAutocompleteMatches = useMemo(() => {
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

  const trimmedQuery = query.trim();
  const hasFreshRemote = trimmedQuery.length > 0 && remoteState?.query === trimmedQuery;
  const autocompleteMatches = !trimmedQuery
    ? localAutocompleteMatches
    : hasFreshRemote
    ? remoteState.matches
    : remoteLoading
    ? []
    : localAutocompleteMatches;

  const curatedCourses = useMemo(() => {
    const priorityIds = ['math-137', 'cs-135', 'econ-101', 'mat-1320', 'gng-1105'];
    const pool = universityFiltered;
    const ordered = priorityIds
      .map((id) => pool.find((c) => c.id === id))
      .filter((c): c is Course => Boolean(c));
    if (ordered.length >= 3) return ordered.slice(0, 5);
    return pool.slice(0, 5);
  }, [universityFiltered]);

  const totalCatalogueCount = useMemo(() => {
    if (!catalogueMeta) return universityFiltered.length;
    if (selectedUniversity === 'uwaterloo') return catalogueMeta.waterlooCourseCount;
    if (selectedUniversity === 'uottawa') return catalogueMeta.uottawaCourseCount;
    return catalogueMeta.totalCourses;
  }, [catalogueMeta, selectedUniversity, universityFiltered.length]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSuggestionIdx >= 0 && autocompleteMatches[activeSuggestionIdx]) {
      onOpenCourse(autocompleteMatches[activeSuggestionIdx].id);
      return;
    }
    if (autocompleteMatches.length === 1 && trimmedQuery.length >= 3) {
      onOpenCourse(autocompleteMatches[0].id);
    } else {
      onSearchSubmit(query);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchFocused || autocompleteMatches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) =>
        prev < autocompleteMatches.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx((prev) =>
        prev > 0 ? prev - 1 : autocompleteMatches.length - 1
      );
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
      setActiveSuggestionIdx(-1);
    }
  };

  return (
    <main>
      {/* Hero Section with Restrained Adaptive Gradient */}
      <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-hero-start)] via-[var(--surface-hero-mid)] to-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--surface)]/90 px-3.5 py-1 text-xs font-medium text-[var(--accent-text)] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              Waterloo 2026–2027 Academic Calendar (
              {(catalogueMeta?.waterlooCourseCount ?? courses.length).toLocaleString()} courses) ·
              uOttawa Demo
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] text-balance sm:text-5xl">
              Choose your courses with clarity, not chaos.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
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
              <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_10px_30px_-12px_var(--accent-soft),0_2px_6px_rgba(15,23,42,0.05)] transition-all focus-within:border-[var(--ring)] focus-within:ring-4 focus-within:ring-[var(--ring-soft)]">
                <Search
                  className="ml-3.5 h-5 w-5 shrink-0 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveSuggestionIdx(-1);
                  }}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  placeholder="Search courses, course codes, or instructors..."
                  aria-label="Search courses, course codes, or instructors"
                  aria-expanded={searchFocused && (autocompleteMatches.length > 0 || remoteLoading)}
                  aria-autocomplete="list"
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none sm:text-base"
                />
                <button
                  type="submit"
                  className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4.5 py-2.5 text-sm font-semibold shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap"
                >
                  <span>Search</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {searchFocused && (autocompleteMatches.length > 0 || (trimmedQuery && remoteLoading)) && (
                <div
                  role="listbox"
                  aria-label="Course suggestions"
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_36px_-12px_rgba(15,23,42,0.14)]"
                >
                  <div className="border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-[11px] font-medium text-[var(--text-muted)]">
                    {trimmedQuery
                      ? remoteLoading && !hasFreshRemote
                        ? 'Searching catalogue...'
                        : 'Matching courses'
                      : 'Popular courses'}
                  </div>
                  {autocompleteMatches.length > 0 ? (
                    <ul className="divide-y divide-[var(--border)]">
                      {autocompleteMatches.map((course, idx) => {
                        const s =
                          (hasFreshRemote ? remoteState.statsMap[course.id] : undefined) ??
                          statsMap[course.id];
                        const hasReviews = (s?.responseCount ?? 0) > 0;
                        const isActive = idx === activeSuggestionIdx;
                        return (
                          <li key={course.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                onOpenCourse(course.id);
                              }}
                              className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors focus-visible:outline-none ${
                                isActive
                                  ? 'bg-[var(--surface-accent)]'
                                  : 'hover:bg-[var(--surface-subtle)] focus-visible:bg-[var(--surface-subtle)]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-[var(--surface-accent)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent-code)]">
                                    {course.code}
                                  </span>
                                  <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                                    {course.title}
                                  </span>
                                </div>
                                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                                  {course.universityName} · {course.department}
                                </div>
                              </div>
                              <div className="shrink-0 text-right font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                                {hasReviews && s
                                  ? `${s.avgWeeklyHours.toFixed(1)} hrs/wk · ${s.recommendationRate}% rec`
                                  : 'No reviews yet'}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      Finding matching courses across Waterloo &amp; uOttawa...
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Try searching:</span>
                {['MATH 137', 'CS 135', 'ECON 101', 'MAT 1320', 'GNG 1105'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      const found = courses.find((c) => c.code === sample);
                      if (found) onOpenCourse(found.id);
                      else onSearchSubmit(sample);
                    }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-2.5 py-1 font-mono font-medium text-[var(--text-primary)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:border-[var(--accent-subtle-border)] hover:bg-[var(--surface-accent)] hover:text-[var(--accent-code)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Curated Courses Section */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Curated Course Profiles
            </h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              Explore self-reported workload benchmarks, Trust Lens review analysis, and teaching-team insights.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoExplore}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-text)] shadow-xs transition-all hover:border-[var(--accent-subtle-border)] hover:bg-[var(--surface-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap self-start sm:self-auto"
          >
            <span>Browse all {totalCatalogueCount.toLocaleString()} courses</span>
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
      <section className="border-t border-[var(--border)] bg-[var(--surface-muted)]/65 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl text-balance">
              Built to answer what actually matters before enrollment.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Instead of scrolling through unverified hot takes, CourseGlide structures student
              experience into three connected layers of academic intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            {/* Left: Interactive Trust Lens Preview Card (7 cols) */}
            <div className="surface-card lg:col-span-7 flex flex-col justify-between rounded-2xl p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span>Interactive Preview: CourseGlide Trust Lens on MATH 137</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Toggle modes to see how Trust Lens prioritizes specificity while preserving legitimate criticism.
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Trust Lens preview toggle"
                    className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewTrustMode('most_informative')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        previewTrustMode === 'most_informative'
                          ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Most Informative
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTrustMode('all')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        previewTrustMode === 'all'
                          ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All Reviews
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {previewTrustMode === 'most_informative' ? (
                    <>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text-primary)]">
                            Fall 2025 · 11 hrs/wk · Recommended
                          </span>
                          <span className="font-semibold text-[var(--status-positive)]">
                            Detailed · Course-Specific
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                          “Weeks 3–6 moved rapidly through formal limit proofs. Draft assignment
                          proofs in rough form by Tuesday so you can bring specific questions to
                          Wednesday tutorial or TA office hours.”
                        </p>
                      </div>

                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text-primary)]">
                            Fall 2025 · 15 hrs/wk · Not Recommended
                          </span>
                          <span className="font-semibold text-[var(--accent-text)]">
                            Balanced Critique · Detailed
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                          “Assignment 4 and the midterm tested inequality bounding never drilled in
                          lecture. TA Devon Brooks explained counterexamples clearly during office
                          hours—solve workbook proofs under timed conditions.”
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 opacity-90">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            Fall 2025 · 20 hrs/wk · Not Recommended
                          </span>
                          <span className="font-semibold text-[var(--status-warning)]">
                            Limited Context
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          “Worst class ever lol, totally impossible. Drop it.”
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 opacity-90">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            Fall 2025 · 2 hrs/wk · Recommended
                          </span>
                          <span className="font-semibold text-[var(--status-warning)]">
                            Limited Context
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          “Super easy A+, barely showed up. Just wing it.”
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-muted)]">
                  Fairness rule: Critical reviews with concrete evidence rank equally with positive reviews.
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCourse('math-137', 'reviews')}
                  className="btn-soft inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
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
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-accent)] text-[var(--accent-text)]">
                    <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    01. Trustworthy Feedback
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Evaluate the context and usefulness of student reviews using transparent
                  course-specificity signals, term context, and duplicate detection—without silencing
                  strong criticism.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)]">
                    <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    02. Course Intelligence
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  See clear difficulty distributions, weekly study hours, teaching-team feedback by
                  professor and TA, and sample-size confidence notes before you register.
                </p>
              </div>

              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--status-positive-bg)] text-[var(--status-positive)]">
                    <BookOpenCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                    03. Study Smarter
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Learn which preparation strategies past students actually found useful, matched to
                  your learning preferences and grounded in real respondent counts.
                </p>
                <button
                  type="button"
                  onClick={onGoHowItWorks}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] hover:underline"
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

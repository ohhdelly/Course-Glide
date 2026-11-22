import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Sparkles,
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
import { CollapsibleText } from './course/CollapsibleText';

type SearchMode = 'auto' | 'catalogue' | 'advisor';

const COURSE_CODE_ONLY = /^[a-z]{2,6}\s?-?\d{2,3}[a-z]?$/i;
const DESCRIPTIVE_REQUEST =
  /\b(easy|bird|light|heavy|hard|chill|workload|hours?|avoid|without|no\s+\w+|projects?|exams?|essays?|assignments?|readings?|level|year|term|semester|recommend(?:ed)?|interesting|enjoy|fun|elective|online|morning|evening|prof(?:essor)?|lecture|seminar|lab|group|presentation|difficult)\b/i;

/**
 * The example prompts used to be a static block under the search box. They now
 * drift behind the hero as ambient, low-opacity buttons: still real clickable
 * examples, but no longer occupying a section of their own.
 */
interface FloatingChip {
  label: string;
  variant: 'course' | 'advisor';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay: string;
  duration: string;
}

const FLOATING_CHIPS: FloatingChip[] = [
  { label: 'MATH 137', variant: 'course', top: '12%', left: '1.5%', delay: '-3s', duration: '26s' },
  { label: 'CS 135', variant: 'course', top: '34%', left: '3%', delay: '-11s', duration: '31s' },
  { label: 'ECON 101', variant: 'course', top: '60%', left: '1%', delay: '-7s', duration: '28s' },
  { label: 'MAT 1320', variant: 'course', top: '79%', left: '9%', delay: '-16s', duration: '34s' },
  { label: 'GNG 1105', variant: 'course', top: '6%', right: '3%', delay: '-13s', duration: '29s' },
  {
    label: 'bird course, under 10 hours a week',
    variant: 'advisor',
    top: '18%',
    right: '1.5%',
    delay: '-5s',
    duration: '30s',
  },
  { label: 'AI course for third year', variant: 'advisor', top: '44%', right: '2%', delay: '-20s', duration: '33s' },
  {
    label: 'writing elective with no final exam',
    variant: 'advisor',
    bottom: '6%',
    right: '3%',
    delay: '-9s',
    duration: '27s',
  },
];

/**
 * One box, two engines: a course code or a couple of keywords is a catalogue
 * lookup, while a sentence about workload, level or what to avoid is an advisor
 * request. This is only the default; the student can pin either mode.
 */
export function detectSearchMode(raw: string): Exclude<SearchMode, 'auto'> {
  const text = raw.trim();
  if (!text) return 'catalogue';
  if (COURSE_CODE_ONLY.test(text)) return 'catalogue';
  if (DESCRIPTIVE_REQUEST.test(text)) return 'advisor';
  return text.split(/\s+/).length <= 2 ? 'catalogue' : 'advisor';
}

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
  onAskAdvisor: (query: string) => void;
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
  onAskAdvisor,
  onGoExplore,
  onGoHowItWorks,
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('auto');
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
  const effectiveMode: Exclude<SearchMode, 'auto'> =
    mode === 'auto' ? detectSearchMode(trimmedQuery) : mode;
  const hasFreshRemote = trimmedQuery.length > 0 && remoteState?.query === trimmedQuery;
  const autocompleteMatches = !trimmedQuery
    ? localAutocompleteMatches
    : hasFreshRemote
    ? remoteState.matches
    : remoteLoading
    ? []
    : localAutocompleteMatches;

  // One condition drives the popover, so the listbox only opens for a catalogue
  // lookup that actually has something to show.
  const suggestionsOpen =
    effectiveMode === 'catalogue' &&
    searchFocused &&
    (autocompleteMatches.length > 0 || Boolean(trimmedQuery && remoteLoading));

  const curatedCourses = useMemo(() => {
    const priorityIds = ['math-137', 'cs-135', 'econ-101', 'mat-1320', 'gng-1105', 'csi-2110'];
    const pool = universityFiltered;
    const ordered = priorityIds
      .map((id) => pool.find((c) => c.id === id))
      .filter((c): c is Course => Boolean(c));
    if (ordered.length >= 3) return ordered.slice(0, 3);
    return pool.slice(0, 3);
  }, [universityFiltered]);

  const getCourseContextNote = (course: Course): string => {
    const notesById: Record<string, string> = {
      'math-137': 'Proof-heavy honours core · 25% weekly assignments, 75% exams',
      'cs-135': 'Functional programming labs · Weekly Racket problem sets',
      'econ-101': 'Lighter breadth elective · 20% online quizzes, open to all faculties',
      'mat-1320': 'Engineering & science calculus · Weekly discussion groups (DGDs)',
      'gng-1105': 'First-year engineering mechanics · Weekly problem-solving DGDs',
      'csi-2110': 'Algorithms & data structures in Java · 30% labs and assignments',
    };
    if (notesById[course.id]) return notesById[course.id];
    const terms = course.termsOffered.length > 0 ? course.termsOffered.join(', ') : 'Calendar listing';
    return `${course.department} · ${terms}`;
  };

  const totalCatalogueCount = useMemo(() => {
    if (!catalogueMeta) return null;
    if (selectedUniversity === 'uwaterloo') return catalogueMeta.waterlooCourseCount;
    if (selectedUniversity === 'uottawa') return catalogueMeta.uottawaCourseCount;
    return catalogueMeta.totalCourses;
  }, [catalogueMeta, selectedUniversity]);

  const heroSourceLabel = useMemo(() => {
    const calendarVersion = catalogueMeta?.waterlooCalendarVersion ?? '2026–2027 Academic Calendar';
    if (selectedUniversity === 'uottawa') {
      return catalogueMeta
        ? `University of Ottawa · ${catalogueMeta.uottawaCourseCount} demo courses`
        : 'University of Ottawa · Seeded demo courses';
    }
    if (selectedUniversity === 'uwaterloo') {
      return catalogueMeta
        ? `Waterloo ${calendarVersion} (${catalogueMeta.waterlooCourseCount.toLocaleString()} courses)`
        : `Waterloo ${calendarVersion}`;
    }
    return catalogueMeta
      ? `Waterloo ${calendarVersion} (${catalogueMeta.waterlooCourseCount.toLocaleString()} courses) · uOttawa (${catalogueMeta.uottawaCourseCount} demo courses)`
      : `Waterloo ${calendarVersion} · uOttawa demo courses`;
  }, [catalogueMeta, selectedUniversity]);

  const runSample = (chip: FloatingChip) => {
    if (chip.variant === 'advisor') {
      setQuery(chip.label);
      setMode('advisor');
      onAskAdvisor(chip.label);
      return;
    }
    const found = courses.find((c) => c.code === chip.label);
    if (found) onOpenCourse(found.id);
    else onSearchSubmit(chip.label);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveMode === 'advisor') {
      if (trimmedQuery.length >= 3) onAskAdvisor(trimmedQuery);
      return;
    }
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
    if (effectiveMode !== 'catalogue' || !searchFocused || autocompleteMatches.length === 0)
      return;
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
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--bg)]">
        {/* Theme-tinted wash behind everything: picks up yellow / garnet / blue per theme. */}
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="hero-copy pointer-events-none relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* pointer-events-none keeps the drifting chips clickable in the gutters;
              the form re-enables pointer events for itself. */}
          <div className="pointer-events-none mx-auto max-w-3xl text-center">
            <span className="hero-badge inline-flex items-center justify-center rounded-control border border-[var(--border)] px-3 py-1 type-caption text-[var(--text-muted)] shadow-surface text-balance tabular-nums">
              {heroSourceLabel}
            </span>
            {/* The webfont swaps in a line later than the fallback, which used to
                push the search box and both chip rows down 35px after load. Two
                reserved line-heights keep everything below it still. */}
            <h1 className="mt-4 min-h-[2lh] type-h1 sm:type-display text-[var(--text)] text-balance">
              See real course workload and student advice before you enroll.
            </h1>
            <p className="mt-4 type-body text-[var(--text-muted)] text-pretty">
              Compare weekly hours, grading breakdowns, and detailed student reviews across
              Waterloo’s 2026–2027 calendar.
            </p>

            {/* Elevated Search Bar with Autocomplete */}
            <form
              onSubmit={handleFormSubmit}
              className="pointer-events-auto mx-auto mt-8 max-w-2xl text-left"
              role="search"
              aria-label="Search courses or describe what you want"
            >
              {/* The popover is anchored here, not to the whole form, so it hugs the box */}
              <div className="relative">
                <div className="flex items-center rounded-card border border-[var(--border)] bg-[var(--surface)] p-2 shadow-surface transition-colors hover:border-[var(--accent-strong)] focus-within:border-[var(--accent-strong)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--accent-strong)]">
                  {effectiveMode === 'advisor' ? (
                    <Sparkles
                      className="ml-2 sm:ml-3 h-4 w-4 shrink-0 text-[var(--accent-strong)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Search
                      className="ml-2 sm:ml-3 h-4 w-4 shrink-0 text-[var(--text-muted)]"
                      aria-hidden="true"
                    />
                  )}
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
                    placeholder={
                      effectiveMode === 'advisor'
                        ? 'Describe the course you want — workload, level, what to avoid'
                        : 'Search a course code, title, or instructor — or describe what you want'
                    }
                    aria-label={
                      effectiveMode === 'advisor'
                        ? 'Describe the course you are looking for'
                        : 'Search courses, course codes, or instructors'
                    }
                    aria-expanded={suggestionsOpen}
                    aria-autocomplete={effectiveMode === 'catalogue' ? 'list' : 'none'}
                    className="min-h-[44px] min-w-0 w-full bg-transparent px-2 sm:px-3 py-2 type-small sm:type-body text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={effectiveMode === 'advisor' && trimmedQuery.length < 3}
                    className="btn-primary inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-control px-4 py-2 type-small font-semibold whitespace-nowrap disabled:opacity-60 sm:min-w-[9.5rem]"
                  >
                    {/* Both labels share one grid cell, so the button is always as wide as the
                        longer one and the input beside it never resizes when the mode flips.
                        visibility:hidden keeps the unused label out of the a11y tree. */}
                    <span className="grid">
                      <span
                        className={`col-start-1 row-start-1 ${
                          effectiveMode === 'advisor' ? 'visible' : 'invisible'
                        }`}
                      >
                        {/* Phones get the short verb so the button doesn't crowd the input. */}
                        <span className="sm:hidden">Find</span>
                        <span className="hidden sm:inline">Find my courses</span>
                      </span>
                      <span
                        className={`col-start-1 row-start-1 ${
                          effectiveMode === 'advisor' ? 'invisible' : 'visible'
                        }`}
                      >
                        Search
                      </span>
                    </span>
                    {effectiveMode === 'advisor' ? (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {suggestionsOpen && (
                  <div
                    role="listbox"
                    aria-label="Course suggestions"
                    className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-dialog"
                  >
                    <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 type-caption text-[var(--text-muted)]">
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
                                className={`flex min-h-[44px] w-full flex-col items-start justify-between gap-1 px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-4 ${
                                  isActive
                                    ? 'bg-[var(--surface-2)]'
                                    : 'hover:bg-[var(--surface-2)]'
                                }`}
                              >
                                <div className="min-w-0 w-full sm:w-auto">
                                  <div className="flex items-center gap-2">
                                    <span className="shrink-0 rounded-control bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 type-caption font-semibold text-[var(--text)] tabular-nums">
                                      {course.code}
                                    </span>
                                    <span className="truncate type-small font-medium text-[var(--text)]">
                                      {course.title}
                                    </span>
                                  </div>
                                  <div className="mt-1 truncate type-caption text-[var(--text-muted)]">
                                    {course.universityName} · {course.department}
                                  </div>
                                </div>
                                <div className="shrink-0 text-left sm:text-right type-caption text-[var(--text-muted)] tabular-nums">
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
                      <div className="px-4 py-3 type-caption text-[var(--text-muted)]">
                        Finding matching courses across Waterloo &amp; uOttawa...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mode follows the sentence until the student pins one */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
                {/* flex-1 pins the hint's box to the space beside the mode toggle, so the
                    sentence changing length rewraps inside a static rect. */}
                <span className="min-h-[36px] min-w-0 flex-1 sm:min-h-[18px] type-caption text-[var(--text-muted)] text-pretty">
                  {effectiveMode === 'advisor'
                    ? 'Plain language → ranked matches from the calendar and real reviews.'
                    : 'Exact course lookup across the catalogue.'}
                </span>
                <div
                  role="group"
                  aria-label="Search mode"
                  className="inline-flex shrink-0 items-center rounded-control border border-[var(--border)] bg-[var(--surface)] p-0.5"
                >
                  {(['catalogue', 'advisor'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(mode === option ? 'auto' : option)}
                      aria-pressed={effectiveMode === option}
                      title={
                        mode === option
                          ? 'Following your wording again'
                          : `Always use ${option === 'catalogue' ? 'course search' : 'the advisor'}`
                      }
                      className={`inline-flex min-h-[32px] items-center rounded-[6px] px-2.5 py-1 type-caption font-medium transition-colors ${
                        effectiveMode === option
                          ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {option === 'catalogue' ? 'Courses' : 'Ask'}
                    </button>
                  ))}
                </div>
              </div>

            </form>


          </div>
        </div>

        {/* Ambient examples: real buttons, dimmed and drifting, no longer a section.
            Kept after the hero copy in the DOM so the search box comes first in the
            tab order; layout is unaffected because these are absolutely placed. */}
        <div className="chip-cloud pointer-events-none absolute inset-0 z-0">
          {FLOATING_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => runSample(chip)}
              style={
                {
                  top: chip.top,
                  bottom: chip.bottom,
                  left: chip.left,
                  right: chip.right,
                  // Custom properties rather than animation-* so the prism spin
                  // on hover keeps its own 6s timing instead of inheriting these.
                  '--chip-delay': chip.delay,
                  '--chip-duration': chip.duration,
                } as React.CSSProperties
              }
              className={`chip-float hidden md:inline-flex ${
                chip.variant === 'course' ? 'chip-course tabular-nums' : 'chip-advisor'
              } min-h-[44px] items-center rounded-control px-3 py-2 type-caption font-medium`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* Sample Course Comparisons */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-8">
          <div>
            <span className="type-caption font-semibold uppercase tracking-[0.16em] text-[var(--chart-1)]">
              Sample comparison
            </span>
            <h2 className="mt-2 type-h1 text-[var(--text)]">
              Compare sample courses
            </h2>
            <p className="mt-1 type-small text-[var(--text-muted)] text-pretty">
              See how weekly hours, difficulty, and student recommendations differ before you enroll.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoExplore}
            className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 type-caption font-semibold shadow-surface whitespace-nowrap self-start sm:self-auto tabular-nums"
          >
            <span>
              {totalCatalogueCount !== null
                ? `Browse all ${totalCatalogueCount.toLocaleString()} courses`
                : 'Browse all courses'}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {curatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={statsMap[course.id]}
              contextNote={getCourseContextNote(course)}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={(id) => onOpenCourse(id)}
            />
          ))}
        </div>
      </section>

      {/* Trust Lens Preview Section */}
      <section className="border-t border-[var(--border)] bg-[var(--surface-2)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-6">
            <span className="type-caption font-semibold uppercase tracking-[0.16em] text-[var(--chart-1)]">
              Trust Lens
            </span>
            <h2 className="mt-2 type-h1 text-[var(--text)] text-balance">
              What students actually need to know before enrolling.
            </h2>
          </div>

          {/* Full-width interactive Trust Lens preview */}
          <div className="surface-card rounded-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 type-small font-semibold text-[var(--text)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>Interactive preview: CourseGlide Trust Lens on MATH 137</span>
              </div>

              <div
                role="group"
                aria-label="Trust Lens preview toggle"
                className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto rounded-control border border-[var(--border)] bg-[var(--surface)] p-1 gap-1 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setPreviewTrustMode('most_informative')}
                  aria-pressed={previewTrustMode === 'most_informative'}
                  className={`min-h-[44px] rounded-control border-b-2 px-3 py-2 type-caption transition-colors whitespace-nowrap ${
                    previewTrustMode === 'most_informative'
                      ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                      : 'border-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                >
                  Most informative
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTrustMode('all')}
                  aria-pressed={previewTrustMode === 'all'}
                  className={`min-h-[44px] rounded-control border-b-2 px-3 py-2 type-caption transition-colors whitespace-nowrap ${
                    previewTrustMode === 'all'
                      ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                      : 'border-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                >
                  All reviews
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {previewTrustMode === 'most_informative' ? (
                <>
                  <div className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="type-caption text-[var(--text-muted)] tabular-nums">
                        Fall 2025 · 11 hrs/wk · Recommended
                      </span>
                      <span className="rounded-control border border-[var(--accent-strong)] px-2 py-0.5 type-caption font-medium text-[var(--text)]">
                        Course-specific
                      </span>
                    </div>
                    <div className="mt-2">
                      <CollapsibleText
                        maxLines={2}
                        text="“Weeks 3–6 moved rapidly through formal limit proofs. Draft assignment proofs in rough form by Tuesday so you can bring specific questions to Wednesday tutorial or TA office hours.”"
                        className="type-small text-[var(--text)] text-pretty"
                      />
                    </div>
                  </div>

                  <div className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="type-caption text-[var(--text-muted)] tabular-nums">
                        Fall 2025 · 15 hrs/wk · Not recommended
                      </span>
                      <span className="rounded-control border border-[var(--accent-strong)] px-2 py-0.5 type-caption font-medium text-[var(--text)]">
                        Balanced critique
                      </span>
                    </div>
                    <div className="mt-2">
                      <CollapsibleText
                        maxLines={2}
                        text="“Assignment 4 and the midterm tested inequality bounding never drilled in lecture. TA Devon Brooks explained counterexamples clearly during office hours—solve workbook proofs under timed conditions.”"
                        className="type-small text-[var(--text)] text-pretty"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="type-caption text-[var(--text-muted)] tabular-nums">
                        Fall 2025 · 20 hrs/wk · Not recommended
                      </span>
                      <span className="rounded-control border border-[var(--border)] px-2 py-0.5 type-caption font-medium text-[var(--text-muted)]">
                        Limited context
                      </span>
                    </div>
                    <div className="mt-2">
                      <CollapsibleText
                        maxLines={2}
                        text="“Worst class ever lol, totally impossible. Drop it.”"
                        className="type-small text-[var(--text)] text-pretty"
                      />
                    </div>
                  </div>

                  <div className="rounded-card border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="type-caption text-[var(--text-muted)] tabular-nums">
                        Fall 2025 · 2 hrs/wk · Recommended
                      </span>
                      <span className="rounded-control border border-[var(--border)] px-2 py-0.5 type-caption font-medium text-[var(--text-muted)]">
                        Limited context
                      </span>
                    </div>
                    <div className="mt-2">
                      <CollapsibleText
                        maxLines={2}
                        text="“Super easy A+, barely showed up. Just wing it.”"
                        className="type-small text-[var(--text)] text-pretty"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <span className="type-caption text-[var(--text-muted)] text-pretty">
                Fairness rule: Critical reviews with concrete evidence rank equally with positive reviews.
              </span>
              <button
                type="button"
                onClick={() => onOpenCourse('math-137', 'reviews')}
                className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-3 py-2 type-caption font-semibold whitespace-nowrap"
              >
                <span>Test Trust Lens on MATH 137</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onGoHowItWorks}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-control px-2 py-2 type-caption font-semibold text-[var(--text)] underline-offset-4 hover:underline whitespace-nowrap"
            >
              <span>Read our methodology</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

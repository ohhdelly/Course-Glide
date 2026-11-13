import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
  CatalogueMetadata,
  CatalogueSubject,
  Course,
  CourseFilters,
  CourseStats,
  PaginatedCoursesResponse,
  University,
  UniversityId,
} from '../types/course';
import { filterAndSearchCourses } from '../utils/trustLens';
import { CourseCard } from './CourseCard';

interface ExplorePageProps {
  courses: Course[];
  universities: University[];
  subjects: CatalogueSubject[];
  catalogueMeta: CatalogueMetadata | null;
  statsMap: Record<string, CourseStats>;
  instructorsByCourse: Record<string, string[]>;
  selectedUniversity: UniversityId;
  onSelectUniversity: (id: UniversityId) => void;
  initialQuery?: string;
  reviewRevision?: number;
  savedCourseIds: string[];
  onToggleSave: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
}

const PAGE_SIZE = 24;

export const ExplorePage: React.FC<ExplorePageProps> = ({
  courses,
  universities,
  subjects: initialSubjects,
  catalogueMeta,
  statsMap: localStatsMap,
  instructorsByCourse,
  selectedUniversity,
  onSelectUniversity,
  initialQuery = '',
  reviewRevision = 0,
  savedCourseIds,
  onToggleSave,
  onOpenCourse,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [department, setDepartment] = useState<string>('all');
  const [level, setLevel] = useState<CourseFilters['level']>('all');
  const [maxDifficulty, setMaxDifficulty] = useState<CourseFilters['maxDifficulty']>('all');
  const [maxHours, setMaxHours] = useState<CourseFilters['maxHours']>('all');
  const [hasReviews, setHasReviews] = useState<NonNullable<CourseFilters['hasReviews']>>('all');
  const [sortBy, setSortBy] = useState<CourseFilters['sortBy']>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [highlightedSuggestionIdx, setHighlightedSuggestionIdx] = useState(-1);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<PaginatedCoursesResponse | null>(null);
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch paginated indexed courses from backend
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({
      q: debouncedQuery,
      universityId: selectedUniversity,
      department,
      level: String(level),
      maxDifficulty: String(maxDifficulty),
      maxHours: String(maxHours),
      hasReviews,
      sortBy,
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    setLoading(true);
    fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load courses'))))
      .then((data: PaginatedCoursesResponse) => {
        setServerData(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          // Graceful fallback to local courses
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    debouncedQuery,
    selectedUniversity,
    department,
    level,
    maxDifficulty,
    maxHours,
    hasReviews,
    sortBy,
    page,
    reviewRevision,
  ]);

  // Fast autocomplete suggestions when typing
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setHighlightedSuggestionIdx(-1);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q: trimmed,
        universityId: selectedUniversity,
        limit: '5',
        page: '1',
      });
      fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: PaginatedCoursesResponse | null) => {
          if (d?.courses) setSuggestions(d.courses.slice(0, 5));
        })
        .catch(() => {});
    }, 100);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedUniversity]);

  const fallbackCourses = useMemo(
    () =>
      filterAndSearchCourses(courses, localStatsMap, instructorsByCourse, debouncedQuery, {
        universityId: selectedUniversity,
        department,
        level,
        maxDifficulty,
        maxHours,
        hasReviews,
        sortBy,
      }),
    [
      courses,
      localStatsMap,
      instructorsByCourse,
      debouncedQuery,
      selectedUniversity,
      department,
      level,
      maxDifficulty,
      maxHours,
      hasReviews,
      sortBy,
    ]
  );

  const displayedCourses = serverData?.courses ?? fallbackCourses.slice(0, PAGE_SIZE);
  const effectiveStatsMap = serverData?.statsMap ?? localStatsMap;
  const totalMatches = serverData?.total ?? fallbackCourses.length;
  const totalPages = serverData?.totalPages ?? Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const currentPage = serverData?.page ?? page;

  const availableSubjects = useMemo(() => {
    const list = serverData?.subjects ?? initialSubjects;
    if (selectedUniversity === 'all') return list;
    return list.filter((s) => s.universityId === selectedUniversity);
  }, [serverData?.subjects, initialSubjects, selectedUniversity]);

  const secondaryFilterCount =
    (department !== 'all' ? 1 : 0) +
    (level !== 'all' ? 1 : 0) +
    (maxDifficulty !== 'all' ? 1 : 0) +
    (maxHours !== 'all' ? 1 : 0) +
    (hasReviews !== 'all' ? 1 : 0);

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedUniversity !== 'all' ||
    secondaryFilterCount > 0;

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (selectedUniversity !== 'all') {
      const uni = universities.find((u) => u.id === selectedUniversity);
      chips.push({
        key: 'uni',
        label: uni?.shortName ?? selectedUniversity,
        onClear: () => {
          onSelectUniversity('all');
          setDepartment('all');
          setPage(1);
        },
      });
    }
    if (department !== 'all') {
      chips.push({
        key: 'dept',
        label: `Subject: ${department}`,
        onClear: () => {
          setDepartment('all');
          setPage(1);
        },
      });
    }
    if (level !== 'all') {
      chips.push({
        key: 'level',
        label: `${level}-level`,
        onClear: () => {
          setLevel('all');
          setPage(1);
        },
      });
    }
    if (hasReviews !== 'all') {
      chips.push({
        key: 'reviews',
        label: hasReviews === 'with_reviews' ? 'With reviews' : 'No reviews yet',
        onClear: () => {
          setHasReviews('all');
          setPage(1);
        },
      });
    }
    if (maxDifficulty !== 'all') {
      chips.push({
        key: 'diff',
        label: `Difficulty ≤ ${maxDifficulty}.0`,
        onClear: () => {
          setMaxDifficulty('all');
          setPage(1);
        },
      });
    }
    if (maxHours !== 'all') {
      chips.push({
        key: 'hours',
        label: `Workload ≤ ${maxHours} hrs/wk`,
        onClear: () => {
          setMaxHours('all');
          setPage(1);
        },
      });
    }
    return chips;
  }, [
    selectedUniversity,
    universities,
    department,
    level,
    hasReviews,
    maxDifficulty,
    maxHours,
    onSelectUniversity,
  ]);

  const resetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    onSelectUniversity('all');
    setDepartment('all');
    setLevel('all');
    setMaxDifficulty('all');
    setMaxHours('all');
    setHasReviews('all');
    setSortBy('relevance');
    setPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!autocompleteOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSuggestionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSuggestionIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightedSuggestionIdx >= 0) {
      e.preventDefault();
      onOpenCourse(suggestions[highlightedSuggestionIdx].id);
    } else if (e.key === 'Escape') {
      setAutocompleteOpen(false);
    }
  };

  const rangeStart = totalMatches === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalMatches, currentPage * PAGE_SIZE);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end mb-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Explore Courses
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {catalogueMeta
              ? `Search ${catalogueMeta.totalCourses.toLocaleString()} official University of Waterloo & uOttawa course profiles.`
              : 'Search course profiles, workload expectations, and student feedback.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            role="group"
            aria-label="Course view layout"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                  ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Search-First Control Bar + Connected All Filters Drawer */}
      <section
        aria-label="Search and filters"
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 sm:p-3 mb-5 shadow-[0_6px_20px_-10px_rgba(15,23,42,0.08)]"
      >
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <label htmlFor="explore-search-input" className="sr-only">
              Search courses
            </label>
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 transition-colors focus-within:border-[var(--ring)] focus-within:bg-[var(--surface)] focus-within:ring-3 focus-within:ring-[var(--ring-soft)]">
              <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
              <input
                id="explore-search-input"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setAutocompleteOpen(true);
                  setHighlightedSuggestionIdx(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setAutocompleteOpen(true)}
                onBlur={() => setTimeout(() => setAutocompleteOpen(false), 180)}
                placeholder="Search course code, title, or instructor (e.g. CS 240, ECE 105)..."
                aria-label="Search courses"
                aria-autocomplete="list"
                className="w-full bg-transparent px-2.5 py-2.5 text-sm sm:text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setDebouncedQuery('');
                    setPage(1);
                  }}
                  aria-label="Clear search query"
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {autocompleteOpen && query.trim().length > 0 && suggestions.length > 0 && (
              <div
                role="listbox"
                aria-label="Instant course suggestions"
                className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
              >
                <ul className="divide-y divide-[var(--border)]">
                  {suggestions.map((c, idx) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onOpenCourse(c.id);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          highlightedSuggestionIdx === idx
                            ? 'bg-[var(--surface-accent)]'
                            : 'hover:bg-[var(--surface-subtle)]'
                        }`}
                      >
                        <span className="truncate pr-3">
                          <span className="font-mono font-semibold text-[var(--accent-code)] mr-2">
                            {c.code}
                          </span>
                          <span className="text-[var(--text-primary)]">{c.title}</span>
                        </span>
                        <span className="text-xs text-[var(--text-muted)] shrink-0">{c.universityName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2 shrink-0">
            <div className="lg:w-52">
              <label htmlFor="filter-uni" className="sr-only">
                University
              </label>
              <select
                id="filter-uni"
                aria-label="University"
                value={selectedUniversity}
                onChange={(e) => {
                  onSelectUniversity(e.target.value as UniversityId);
                  setDepartment('all');
                  setPage(1);
                }}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)] ${
                  selectedUniversity !== 'all'
                    ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
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
              <button
                type="button"
                aria-expanded={showMoreFilters}
                onClick={() => setShowMoreFilters((prev) => !prev)}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  showMoreFilters || secondaryFilterCount > 0
                    ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  All Filters{secondaryFilterCount > 0 ? ` (${secondaryFilterCount})` : ''}
                </span>
                {showMoreFilters ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="col-span-2 sm:col-span-1 lg:w-44">
              <label htmlFor="filter-sort" className="sr-only">
                Sort By
              </label>
              <select
                id="filter-sort"
                aria-label="Sort courses by"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as CourseFilters['sortBy']);
                  setPage(1);
                }}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)] ${
                  sortBy !== 'relevance'
                    ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="code">Sort: Course Code (A–Z)</option>
                <option value="reviews">Sort: Most Responses</option>
                <option value="recommended">Sort: Highest Recommended</option>
                <option value="workload_asc">Sort: Lowest Workload</option>
                <option value="workload_desc">Sort: Highest Workload</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showMoreFilters && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label htmlFor="filter-dept" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Subject / Department
                  </label>
                  <select
                    id="filter-dept"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs font-medium focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none ${
                      department !== 'all'
                        ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <option value="all">All Subjects ({availableSubjects.length})</option>
                    {availableSubjects.map((s) => (
                      <option key={`${s.universityId}-${s.code}`} value={s.code}>
                        {s.code} — {s.department} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-level" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Academic Level
                  </label>
                  <select
                    id="filter-level"
                    value={level}
                    onChange={(e) => {
                      setLevel(
                        e.target.value === 'all'
                          ? 'all'
                          : (Number(e.target.value) as 100 | 200 | 300 | 400 | 500)
                      );
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs font-medium focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none ${
                      level !== 'all'
                        ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <option value="all">All Levels</option>
                    <option value="100">100-level (1st Year)</option>
                    <option value="200">200-level (2nd Year)</option>
                    <option value="300">300-level (3rd Year)</option>
                    <option value="400">400-level (4th Year)</option>
                    <option value="500">500-level (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-reviews-status" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Student Feedback
                  </label>
                  <select
                    id="filter-reviews-status"
                    value={hasReviews}
                    onChange={(e) => {
                      setHasReviews(
                        e.target.value as NonNullable<CourseFilters['hasReviews']>
                      );
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs font-medium focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none ${
                      hasReviews !== 'all'
                        ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <option value="all">All Catalogue Courses</option>
                    <option value="with_reviews">With Student Reviews</option>
                    <option value="without_reviews">No Student Reviews Yet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-diff" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Max Difficulty
                  </label>
                  <select
                    id="filter-diff"
                    value={maxDifficulty}
                    onChange={(e) => {
                      setMaxDifficulty(
                        e.target.value === 'all' ? 'all' : (Number(e.target.value) as 2 | 3 | 4 | 5)
                      );
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs font-medium focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none ${
                      maxDifficulty !== 'all'
                        ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <option value="all">Any Difficulty</option>
                    <option value="3">Up to 3.0 / 5</option>
                    <option value="4">Up to 4.0 / 5</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-hours" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Avg Weekly Hours
                  </label>
                  <select
                    id="filter-hours"
                    value={maxHours}
                    onChange={(e) => {
                      setMaxHours(
                        e.target.value === 'all' ? 'all' : (Number(e.target.value) as 6 | 10 | 14)
                      );
                      setPage(1);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-xs font-medium focus:border-[var(--ring)] focus:bg-[var(--surface)] focus:outline-none ${
                      maxHours !== 'all'
                        ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <option value="all">Any Workload</option>
                    <option value="6">Under 6 hrs/wk</option>
                    <option value="10">Under 10 hrs/wk</option>
                    <option value="14">Under 14 hrs/wk</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Animated Active Filter Chips */}
      <AnimatePresence initial={false}>
        {activeChips.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            {activeChips.map((chip) => (
              <motion.button
                key={chip.key}
                type="button"
                layout={!prefersReducedMotion}
                onClick={chip.onClear}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-code)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3" aria-hidden="true" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
        <span className="tabular-nums">
          Showing <strong className="font-semibold text-[var(--text-primary)]">{rangeStart}–{rangeEnd}</strong> of{' '}
          <strong className="font-semibold text-[var(--text-primary)]">{totalMatches.toLocaleString()}</strong> courses
          {loading && <span className="ml-2 font-medium text-[var(--accent-text)]">Updating…</span>}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-text)] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Results */}
      {displayedCourses.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            No courses match your current filters
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Try widening your subject, academic level, or clearing the search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={effectiveStatsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
              layout="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              stats={effectiveStatsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
              layout="list"
            />
          ))}
        </div>
      )}

      {/* Scalable Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Course results pagination"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 text-xs"
        >
          <span className="text-[var(--text-secondary)] tabular-nums">
            Page <strong className="font-semibold text-[var(--text-primary)]">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-[var(--text-primary)]">{totalPages.toLocaleString()}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </main>
  );
};

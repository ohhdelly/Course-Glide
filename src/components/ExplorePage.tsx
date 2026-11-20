import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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
import { ExploreSelect, type ExploreSelectOption } from './ExploreSelect';

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

const TERM_OPTIONS: ExploreSelectOption[] = [
  { value: 'all', label: 'All terms' },
  { value: 'Fall', label: 'Fall' },
  { value: 'Winter', label: 'Winter' },
  { value: 'Spring', label: 'Spring' },
];

const SORT_OPTIONS: ExploreSelectOption[] = [
  { value: 'relevance', label: 'Sort: Relevance' },
  { value: 'code', label: 'Sort: Code (A–Z)' },
  { value: 'reviews', label: 'Sort: Most reviews' },
  { value: 'recommended', label: 'Sort: Highest recommend' },
  { value: 'workload_asc', label: 'Sort: Lowest h/wk' },
  { value: 'workload_desc', label: 'Sort: Highest h/wk' },
];

const LEVEL_OPTIONS: ExploreSelectOption[] = [
  { value: 'all', label: 'All levels' },
  { value: '100', label: '100-level (1st year)' },
  { value: '200', label: '200-level (2nd year)' },
  { value: '300', label: '300-level (3rd year)' },
  { value: '400', label: '400-level (4th year)' },
  { value: '500', label: '500-level (Advanced)' },
];

const REVIEW_STATUS_OPTIONS: ExploreSelectOption[] = [
  { value: 'all', label: 'All feedback states' },
  { value: 'with_reviews', label: 'With student reviews' },
  { value: 'without_reviews', label: 'No student reviews yet' },
];

const DIFFICULTY_OPTIONS: ExploreSelectOption[] = [
  { value: 'all', label: 'Any difficulty' },
  { value: '3', label: 'Up to 3.0 / 5' },
  { value: '4', label: 'Up to 4.0 / 5' },
];

const HOURS_OPTIONS: ExploreSelectOption[] = [
  { value: 'all', label: 'Any weekly hours' },
  { value: '6', label: 'Under 6 h/wk' },
  { value: '10', label: 'Under 10 h/wk' },
  { value: '14', label: 'Under 14 h/wk' },
];

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
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [term, setTerm] = useState<NonNullable<CourseFilters['term']>>('all');
  const [department, setDepartment] = useState<string>('all');
  const [level, setLevel] = useState<CourseFilters['level']>('all');
  const [maxDifficulty, setMaxDifficulty] = useState<CourseFilters['maxDifficulty']>('all');
  const [maxHours, setMaxHours] = useState<CourseFilters['maxHours']>('all');
  const [hasReviews, setHasReviews] = useState<NonNullable<CourseFilters['hasReviews']>>('all');
  const [sortBy, setSortBy] = useState<CourseFilters['sortBy']>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'grid';
    }
    return 'list';
  });
  const [page, setPage] = useState(1);

  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [highlightedSuggestionIdx, setHighlightedSuggestionIdx] = useState(-1);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<PaginatedCoursesResponse | null>(null);
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  // Reset faculty selection if university switcher changes and current faculty isn't valid
  useEffect(() => {
    setDepartment('all');
    setPage(1);
  }, [selectedUniversity]);

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
      term,
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
    term,
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
        term,
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
      term,
      department,
      level,
      maxDifficulty,
      maxHours,
      hasReviews,
      sortBy,
    ]
  );

  const hasAnyFilter =
    debouncedQuery.trim() !== '' ||
    term !== 'all' ||
    department !== 'all' ||
    level !== 'all' ||
    maxDifficulty !== 'all' ||
    maxHours !== 'all' ||
    hasReviews !== 'all';

  const catalogueFallbackCount = useMemo(() => {
    if (!catalogueMeta) return fallbackCourses.length;
    if (selectedUniversity === 'uwaterloo') return catalogueMeta.waterlooCourseCount;
    if (selectedUniversity === 'uottawa') return catalogueMeta.uottawaCourseCount;
    return catalogueMeta.totalCourses;
  }, [catalogueMeta, selectedUniversity, fallbackCourses.length]);

  const displayedCourses = serverData?.courses ?? fallbackCourses.slice(0, PAGE_SIZE);
  const effectiveStatsMap = serverData?.statsMap ?? localStatsMap;
  // Single source of truth for course count: backend total once fetched, or official catalogue count prior to fetch when unfiltered
  const totalMatches =
    serverData?.total ?? (!hasAnyFilter ? catalogueFallbackCount : fallbackCourses.length);
  const totalPages = serverData?.totalPages ?? Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const currentPage = serverData?.page ?? page;

  const availableSubjects = useMemo(() => {
    const list = serverData?.subjects ?? initialSubjects;
    if (selectedUniversity === 'all') return list;
    return list.filter((s) => s.universityId === selectedUniversity);
  }, [serverData?.subjects, initialSubjects, selectedUniversity]);

  const facultyOptions = useMemo<ExploreSelectOption[]>(() => {
    const base: ExploreSelectOption[] = [
      { value: 'all', label: 'All faculties' },
    ];
    for (const s of availableSubjects) {
      base.push({
        value: s.code,
        label: `${s.code} — ${s.department} (${s.count})`,
      });
    }
    return base;
  }, [availableSubjects]);

  const universityOptions = useMemo<ExploreSelectOption[]>(() => {
    return [
      { value: 'all', label: 'All universities' },
      ...universities.map((u) => ({ value: u.id, label: u.name })),
    ];
  }, [universities]);

  const moreFiltersCount =
    (level !== 'all' ? 1 : 0) +
    (hasReviews !== 'all' ? 1 : 0) +
    (maxDifficulty !== 'all' ? 1 : 0) +
    (maxHours !== 'all' ? 1 : 0);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (term !== 'all') {
      chips.push({
        key: 'term',
        label: `Term: ${term}`,
        onClear: () => {
          setTerm('all');
          setPage(1);
        },
      });
    }
    if (department !== 'all') {
      const subj = availableSubjects.find((s) => s.code === department);
      chips.push({
        key: 'faculty',
        label: subj ? `Faculty: ${subj.code}` : `Faculty: ${department}`,
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
        label: `Workload ≤ ${maxHours} h/wk`,
        onClear: () => {
          setMaxHours('all');
          setPage(1);
        },
      });
    }
    return chips;
  }, [term, department, availableSubjects, level, hasReviews, maxDifficulty, maxHours]);

  const hasClearableFilters =
    query.trim() !== '' || activeChips.length > 0 || sortBy !== 'relevance';

  const resetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setTerm('all');
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

  const registerItemRef = useCallback((idx: number, el: HTMLButtonElement | null) => {
    itemRefs.current[idx] = el;
  }, []);

  const getGridColumnCount = useCallback((): number => {
    if (viewMode === 'list') return 1;
    const gridEl = gridContainerRef.current;
    if (!gridEl) return 1;
    const cols = window.getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length;
    return Math.max(1, cols);
  }, [viewMode]);

  const handleItemKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
      const total = displayedCourses.length;
      if (total === 0) return;

      let targetIdx: number | null = null;
      if (viewMode === 'list') {
        if (e.key === 'ArrowDown') targetIdx = Math.min(total - 1, idx + 1);
        else if (e.key === 'ArrowUp') targetIdx = Math.max(0, idx - 1);
      } else {
        const cols = getGridColumnCount();
        if (e.key === 'ArrowRight') targetIdx = Math.min(total - 1, idx + 1);
        else if (e.key === 'ArrowLeft') targetIdx = Math.max(0, idx - 1);
        else if (e.key === 'ArrowDown') targetIdx = Math.min(total - 1, idx + cols);
        else if (e.key === 'ArrowUp') targetIdx = Math.max(0, idx - cols);
      }

      if (targetIdx !== null) {
        e.preventDefault();
        if (targetIdx !== idx) {
          itemRefs.current[targetIdx]?.focus();
        }
      }
    },
    [displayedCourses.length, viewMode, getGridColumnCount]
  );

  const rangeStart = totalMatches === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalMatches, currentPage * PAGE_SIZE);

  return (
    <main className="font-explore mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 lg:px-8">
      {/* Header Row — clean H1 + compact segmented view toggle, no subtitle */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="type-h1 text-[var(--text)] scroll-mt-24">
          Explore Courses
        </h1>

        <div
          role="group"
          aria-label="Course view layout"
          className="inline-flex shrink-0 items-center rounded-control border border-[var(--border)] bg-[var(--surface)] p-0.5"
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[6px] px-2.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[6px] px-2.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search & Filters directly on --bg (no enclosing card) */}
      <section aria-label="Search and filters" className="mb-6 space-y-3">
        {/* Search Bar first and largest element */}
        <div className="relative w-full">
          <label htmlFor="explore-search-input" className="sr-only">
            Search courses
          </label>
          <div className="flex min-h-[48px] items-center rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 transition-colors hover:border-[var(--accent-strong)] focus-within:border-[var(--accent-strong)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-[var(--accent-strong)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
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
              placeholder="Search by course code, name, or instructor"
              aria-label="Search courses"
              aria-autocomplete="list"
              className="min-h-[44px] w-full min-w-0 bg-transparent pl-2 pr-1 py-2 type-small sm:type-body text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
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
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-control text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {autocompleteOpen && query.trim().length > 0 && suggestions.length > 0 && (
            <div
              role="listbox"
              aria-label="Instant course suggestions"
              className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-dialog"
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
                      className={`flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-2 text-left type-small transition-colors ${
                        highlightedSuggestionIdx === idx
                          ? 'bg-[var(--surface-2)]'
                          : 'hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <span className="truncate min-w-0">
                        <span className="mr-2 font-semibold text-[var(--text)] tabular-nums">
                          {c.code}
                        </span>
                        <span className="text-[var(--text-muted)]">{c.title}</span>
                      </span>
                      {selectedUniversity === 'all' && (
                        <span className="type-caption text-[var(--text-muted)] shrink-0">
                          {c.universityName}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3 Primary Inline Filters (Term, Faculty, Sort) + More filters toggle */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:items-center lg:gap-3">
          <ExploreSelect
            id="filter-term"
            ariaLabel="Term"
            value={term}
            options={TERM_OPTIONS}
            onChange={(val) => {
              setTerm(val as NonNullable<CourseFilters['term']>);
              setPage(1);
            }}
            className="lg:w-40"
          />

          <ExploreSelect
            id="filter-faculty"
            ariaLabel="Faculty"
            value={department}
            options={facultyOptions}
            onChange={(val) => {
              setDepartment(val);
              setPage(1);
            }}
            className="lg:flex-1 lg:max-w-sm"
          />

          <ExploreSelect
            id="filter-sort"
            ariaLabel="Sort courses by"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(val) => {
              setSortBy(val as CourseFilters['sortBy']);
              setPage(1);
            }}
            className="lg:w-56"
          />

          <button
            type="button"
            aria-expanded={showMoreFilters}
            onClick={() => setShowMoreFilters((prev) => !prev)}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control border px-4 py-2 type-small font-medium whitespace-nowrap transition-colors tabular-nums lg:ml-auto ${
              showMoreFilters || moreFiltersCount > 0
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] font-semibold'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent-strong)]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>
              More filters{moreFiltersCount > 0 ? ` (${moreFiltersCount})` : ''}
            </span>
          </button>
        </div>

        {/* Secondary Filters directly on --bg (no enclosing nested box) */}
        {showMoreFilters && (
          <div
            className={`grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-2 ${
              selectedUniversity === 'all' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
            }`}
          >
            <div>
              <label
                htmlFor="filter-level"
                className="mb-1 block type-caption text-[var(--text-muted)]"
              >
                Academic level
              </label>
              <ExploreSelect
                id="filter-level"
                ariaLabel="Academic level"
                value={String(level)}
                options={LEVEL_OPTIONS}
                onChange={(val) => {
                  setLevel(
                    val === 'all' ? 'all' : (Number(val) as 100 | 200 | 300 | 400 | 500)
                  );
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label
                htmlFor="filter-reviews-status"
                className="mb-1 block type-caption text-[var(--text-muted)]"
              >
                Student feedback
              </label>
              <ExploreSelect
                id="filter-reviews-status"
                ariaLabel="Student feedback"
                value={hasReviews}
                options={REVIEW_STATUS_OPTIONS}
                onChange={(val) => {
                  setHasReviews(val as NonNullable<CourseFilters['hasReviews']>);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label
                htmlFor="filter-diff"
                className="mb-1 block type-caption text-[var(--text-muted)]"
              >
                Max difficulty
              </label>
              <ExploreSelect
                id="filter-diff"
                ariaLabel="Max difficulty"
                value={String(maxDifficulty)}
                options={DIFFICULTY_OPTIONS}
                onChange={(val) => {
                  setMaxDifficulty(val === 'all' ? 'all' : (Number(val) as 2 | 3 | 4 | 5));
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label
                htmlFor="filter-hours"
                className="mb-1 block type-caption text-[var(--text-muted)]"
              >
                Max weekly hours
              </label>
              <ExploreSelect
                id="filter-hours"
                ariaLabel="Max weekly hours"
                value={String(maxHours)}
                options={HOURS_OPTIONS}
                onChange={(val) => {
                  setMaxHours(val === 'all' ? 'all' : (Number(val) as 6 | 10 | 14));
                  setPage(1);
                }}
                menuAlign="right"
              />
            </div>

            {selectedUniversity === 'all' && (
              <div>
                <label
                  htmlFor="filter-uni-secondary"
                  className="mb-1 block type-caption text-[var(--text-muted)]"
                >
                  University
                </label>
                <ExploreSelect
                  id="filter-uni-secondary"
                  ariaLabel="University"
                  value={selectedUniversity}
                  options={universityOptions}
                  onChange={(val) => {
                    onSelectUniversity(val as UniversityId);
                    setDepartment('all');
                    setPage(1);
                  }}
                  menuAlign="right"
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Neutral Removable Filter Chips + Clear All */}
      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-control border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 type-caption font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-strong)]"
            >
              <span>{chip.label}</span>
              <X className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            </button>
          ))}

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-[36px] items-center rounded-control px-2 py-1.5 type-caption font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text)] hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Header (Single Source of Truth count) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 type-caption text-[var(--text-muted)]">
        <span className="tabular-nums">
          Showing <strong className="font-semibold text-[var(--text)]">{rangeStart}–{rangeEnd}</strong> of{' '}
          <strong className="font-semibold text-[var(--text)]">{totalMatches.toLocaleString()}</strong> courses
          {loading && <span className="ml-2 text-[var(--text)]">Updating…</span>}
        </span>

        {hasClearableFilters && activeChips.length === 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-[36px] items-center rounded-control px-2 type-caption font-medium text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results List or Grid */}
      {displayedCourses.length === 0 ? (
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 text-center">
          <h2 className="type-h2 text-[var(--text)]">
            No courses match your current filters
          </h2>
          <p className="mt-2 type-small text-[var(--text-muted)]">
            Try widening your term, faculty, or clearing the search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-primary mt-6 inline-flex min-h-[44px] items-center justify-center rounded-control px-4 py-2 type-small font-semibold"
          >
            Clear all
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          {displayedCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              variant="explore"
              layout="list"
              index={idx}
              registerItemRef={registerItemRef}
              onItemKeyDown={handleItemKeyDown}
              course={course}
              stats={effectiveStatsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
            />
          ))}
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          {displayedCourses.map((course, idx) => (
            <CourseCard
              key={course.id}
              variant="explore"
              layout="grid"
              index={idx}
              registerItemRef={registerItemRef}
              onItemKeyDown={handleItemKeyDown}
              course={course}
              stats={effectiveStatsMap[course.id]}
              isSaved={savedCourseIds.includes(course.id)}
              onToggleSave={onToggleSave}
              onOpenCourse={onOpenCourse}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Course results pagination"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 type-caption"
        >
          <span className="text-[var(--text-muted)] tabular-nums">
            Page <strong className="font-semibold text-[var(--text)]">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-[var(--text)]">{totalPages.toLocaleString()}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'auto' });
              }}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 font-semibold"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'auto' });
              }}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 font-semibold"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </main>
  );
};

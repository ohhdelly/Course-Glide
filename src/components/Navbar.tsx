import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  Compass,
  Menu,
  User,
  X,
} from 'lucide-react';
import type { DemoUser, University, UniversityId } from '../types/course';

export type AppRoute =
  | { page: 'landing' }
  | { page: 'explore' }
  | { page: 'saved' }
  | { page: 'how-it-works' }
  | {
      page: 'course';
      courseId: string;
      initialTab?: 'overview' | 'reviews' | 'teaching' | 'feedback' | 'strategies';
      highlightReviewId?: string;
    };

interface NavbarProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  universities: University[];
  selectedUniversity: UniversityId;
  onSelectUniversity: (id: UniversityId) => void;
  savedCount: number;
  currentUser: DemoUser | null;
  onOpenProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  route,
  onNavigate,
  universities,
  selectedUniversity,
  onSelectUniversity,
  savedCount,
  currentUser,
  onOpenProfileModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleNav = (next: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)] shadow-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 lg:gap-8 lg:px-8">
        {/* Zone 1: Independent CourseGlide Brand + University Selector */}
        <div className="flex shrink-0 items-center gap-2 lg:gap-4">
          <button
            type="button"
            onClick={() => handleNav({ page: 'landing' })}
            className="flex min-h-[44px] items-center gap-2 rounded-control px-1 py-1 text-left whitespace-nowrap shrink-0 hover:bg-[var(--surface-2)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-[var(--text)] text-[var(--surface)] type-small font-semibold">
              CG
            </span>
            <span className="type-h2 text-[var(--text)]">
              Course<span className="brand-glide">Glide</span>
            </span>
          </button>

          <div className="hidden sm:flex items-center border-l border-[var(--border)] pl-2.5 lg:pl-4">
            <label htmlFor="uni-selector" className="sr-only">
              Select university
            </label>
            <div className="relative flex items-center">
              <select
                id="uni-selector"
                aria-label="Select university"
                value={selectedUniversity}
                onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
                className={`min-h-[44px] w-[138px] lg:w-[220px] appearance-none rounded-control border py-2 pl-2.5 pr-7 lg:pl-3 lg:pr-8 type-caption font-medium whitespace-nowrap truncate cursor-pointer transition-colors ${
                  selectedUniversity !== 'all'
                    ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent-strong)]'
                }`}
              >
                <option value="all">All Universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`pointer-events-none absolute right-2 h-4 w-4 ${
                  selectedUniversity !== 'all' ? 'text-[var(--accent-strong)]' : 'text-[var(--text-muted)]'
                }`}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 lg:gap-4 shrink-0"
        >
          <button
            type="button"
            onClick={() => handleNav({ page: 'explore' })}
            aria-current={route.page === 'explore' || route.page === 'course' ? 'page' : undefined}
            className={`whitespace-nowrap shrink-0 border-b-2 px-1.5 lg:px-2 py-2 min-h-[44px] type-small transition-colors ${
              route.page === 'explore' || route.page === 'course'
                ? 'border-[var(--accent-strong)] text-[var(--text)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] font-medium hover:text-[var(--text)]'
            }`}
          >
            Explore Courses
          </button>
          <button
            type="button"
            onClick={() => handleNav({ page: 'saved' })}
            aria-current={route.page === 'saved' ? 'page' : undefined}
            className={`whitespace-nowrap shrink-0 border-b-2 px-1.5 lg:px-2 py-2 min-h-[44px] type-small transition-colors ${
              route.page === 'saved'
                ? 'border-[var(--accent-strong)] text-[var(--text)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] font-medium hover:text-[var(--text)]'
            }`}
          >
            Saved Courses
            <span className="ml-1.5 lg:ml-2 type-caption text-[var(--text-muted)] tabular-nums">
              ({savedCount})
            </span>
          </button>
        </nav>

        {/* Zone 3: Sign In / Profile Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="btn-secondary hidden md:inline-flex min-h-[44px] max-w-[130px] lg:max-w-none items-center gap-1.5 lg:gap-2 rounded-control px-2.5 lg:px-3 py-2 type-caption font-medium shadow-surface whitespace-nowrap shrink-0"
          >
            <User className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="truncate">{currentUser ? currentUser.name : 'Sign In / Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="btn-secondary inline-flex min-h-[44px] min-w-[44px] md:hidden items-center justify-center rounded-control"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-dialog md:hidden"
        >
          <div className="mb-3">
            <label htmlFor="mobile-uni-selector" className="block type-caption text-[var(--text-muted)] mb-1">
              University theme &amp; filter
            </label>
            <div className="relative">
              <select
                id="mobile-uni-selector"
                value={selectedUniversity}
                onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
                className="min-h-[44px] w-full appearance-none rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 pr-8 py-2 type-small font-medium text-[var(--text)] hover:border-[var(--accent-strong)]"
              >
                <option value="all">All Universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
                aria-hidden="true"
              />
            </div>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNav({ page: 'explore' })}
              aria-current={route.page === 'explore' || route.page === 'course' ? 'page' : undefined}
              className={`flex min-h-[44px] items-center gap-2 rounded-control border-b-2 px-3 py-2 text-left type-small transition-colors ${
                route.page === 'explore' || route.page === 'course'
                  ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                  : 'border-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Explore Courses</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'saved' })}
              aria-current={route.page === 'saved' ? 'page' : undefined}
              className={`flex min-h-[44px] items-center justify-between rounded-control border-b-2 px-3 py-2 text-left type-small transition-colors ${
                route.page === 'saved'
                  ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                  : 'border-transparent text-[var(--text-muted)] font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Saved Courses</span>
              </span>
              <span className="type-caption text-[var(--text-muted)] tabular-nums">
                {savedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfileModal();
              }}
              className="btn-primary mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-control px-4 py-2 type-small font-semibold"
            >
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{currentUser ? `${currentUser.name} (Profile)` : 'Sign In / Profile'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'how-it-works' })}
              aria-current={route.page === 'how-it-works' ? 'page' : undefined}
              className={`mt-1 flex min-h-[44px] items-center justify-center rounded-control border-b-2 px-3 py-2 text-center type-caption font-medium transition-colors ${
                route.page === 'how-it-works'
                  ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)] font-semibold'
                  : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              How CourseGlide Works &amp; Trust Lens
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

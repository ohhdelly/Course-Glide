import React, { useState } from 'react';
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
  | { page: 'course'; courseId: string; initialTab?: 'overview' | 'reviews' | 'teaching' | 'strategies'; highlightReviewId?: string };

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

  const handleNav = (next: AppRoute) => {
    setMobileMenuOpen(false);
    onNavigate(next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Independent CourseGlide Brand + University Selector */}
        <div className="flex items-center gap-4 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => handleNav({ page: 'landing' })}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-lg py-1 whitespace-nowrap shrink-0 group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] text-white font-display font-bold text-sm tracking-tight shadow-xs transition-transform duration-150 group-hover:scale-[1.03]">
              CG
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
              CourseGlide
            </span>
          </button>

          <div className="hidden sm:flex items-center border-l border-[var(--border)] pl-4">
            <label htmlFor="uni-selector" className="sr-only">
              Select university
            </label>
            <div className="relative flex items-center">
              <select
                id="uni-selector"
                aria-label="Select university"
                value={selectedUniversity}
                onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
                className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-semibold transition-colors focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-soft)] whitespace-nowrap cursor-pointer ${
                  selectedUniversity !== 'all'
                    ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--text-primary)] hover:border-[var(--ring)]'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)]'
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
                className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--text-secondary)]"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-2 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => handleNav({ page: 'explore' })}
            className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              route.page === 'explore' || route.page === 'course'
                ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] font-semibold shadow-[inset_0_0_0_1px_var(--accent-subtle-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]/70 hover:text-[var(--text-primary)]'
            }`}
          >
            Explore Courses
          </button>
          <button
            type="button"
            onClick={() => handleNav({ page: 'saved' })}
            className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              route.page === 'saved'
                ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] font-semibold shadow-[inset_0_0_0_1px_var(--accent-subtle-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]/70 hover:text-[var(--text-primary)]'
            }`}
          >
            Saved Courses
            <span
              className={`ml-1.5 font-mono text-xs tabular-nums ${
                route.page === 'saved' ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              ({savedCount})
            </span>
          </button>
        </nav>

        {/* Zone 3: Sign In / Profile Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap shrink-0"
          >
            <User className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
            <span>{currentUser ? currentUser.name : 'Sign In / Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-[var(--border)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:hidden">
          <div className="mb-3">
            <label htmlFor="mobile-uni-selector" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              University filter
            </label>
            <select
              id="mobile-uni-selector"
              value={selectedUniversity}
              onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNav({ page: 'explore' })}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
            >
              <Compass className="h-4 w-4 text-[var(--accent-text)]" />
              <span>Explore Courses</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'saved' })}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="h-4 w-4 text-[var(--accent-text)]" />
                <span>Saved Courses</span>
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">{savedCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfileModal();
              }}
              className="btn-primary mt-2 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              <User className="h-4 w-4" />
              <span>{currentUser ? `${currentUser.name} (Profile)` : 'Sign In / Profile'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'how-it-works' })}
              className="mt-2 px-3 py-1.5 text-center text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
            >
              How CourseGlide Works &amp; Trust Lens
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

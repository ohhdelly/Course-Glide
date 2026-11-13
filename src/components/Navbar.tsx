import React, { useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  Compass,
  Menu,
  ShieldCheck,
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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#FAFCFF]/90 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Brand + University Selector */}
        <div className="flex items-center gap-4 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => handleNav({ page: 'landing' })}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg py-1 whitespace-nowrap shrink-0 group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-display font-bold text-sm tracking-tight shadow-xs transition-transform duration-150 group-hover:scale-[1.03]">
              CG
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              CourseGlide
            </span>
          </button>

          <div className="hidden sm:flex items-center border-l border-slate-200/90 pl-4">
            <label htmlFor="uni-selector" className="sr-only">
              Select university
            </label>
            <div className="relative flex items-center">
              <select
                id="uni-selector"
                aria-label="Select university"
                value={selectedUniversity}
                onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
                className="appearance-none rounded-lg border border-slate-200/90 bg-[#EFF3F8] py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 transition-colors hover:bg-[#E7EDF6] hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 whitespace-nowrap cursor-pointer"
              >
                <option value="all">All Universities</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-500"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => handleNav({ page: 'explore' })}
            className={`whitespace-nowrap shrink-0 rounded-lg px-3.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              route.page === 'explore' || route.page === 'course'
                ? 'bg-blue-50/95 text-blue-800 font-semibold shadow-[inset_0_0_0_1px_rgba(37,99,235,0.16)]'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            Explore Courses
          </button>
          <button
            type="button"
            onClick={() => handleNav({ page: 'saved' })}
            className={`whitespace-nowrap shrink-0 rounded-lg px-3.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              route.page === 'saved'
                ? 'bg-blue-50/95 text-blue-800 font-semibold shadow-[inset_0_0_0_1px_rgba(37,99,235,0.16)]'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            Saved Courses
            <span
              className={`ml-1.5 font-mono text-xs tabular-nums ${
                route.page === 'saved' ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              ({savedCount})
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleNav({ page: 'how-it-works' })}
            className={`whitespace-nowrap shrink-0 rounded-lg px-3.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              route.page === 'how-it-works'
                ? 'bg-blue-50/95 text-blue-800 font-semibold shadow-[inset_0_0_0_1px_rgba(37,99,235,0.16)]'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            How CourseGlide Works
          </button>
        </nav>

        {/* Zone 3: Sign In / Profile Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:bg-[#F5F8FC] hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
          >
            <User className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            <span>{currentUser ? currentUser.name : 'Sign In / Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-3">
            <label htmlFor="mobile-uni-selector" className="block text-xs font-medium text-slate-500 mb-1">
              University filter
            </label>
            <select
              id="mobile-uni-selector"
              value={selectedUniversity}
              onChange={(e) => onSelectUniversity(e.target.value as UniversityId)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800"
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
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <Compass className="h-4 w-4 text-blue-700" />
              <span>Explore Courses</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'saved' })}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="h-4 w-4 text-blue-700" />
                <span>Saved Courses</span>
              </span>
              <span className="font-mono text-xs text-slate-500">{savedCount}</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav({ page: 'how-it-works' })}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>How CourseGlide Works</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProfileModal();
              }}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <User className="h-4 w-4" />
              <span>{currentUser ? `${currentUser.name} (Profile)` : 'Sign In / Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, CalendarCheck2, CheckCircle2, Info, PenSquare } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type {
  Course,
  CourseInsightReport,
  CourseStats,
  FacultyResponse,
  FacultyResponseStatus,
  InstructorProfile,
  Review,
} from '../types/course';
import { CollapsibleText } from './course/CollapsibleText';
import { CourseOverviewTab } from './course/CourseOverviewTab';
import { StudentReviewsTab } from './course/StudentReviewsTab';
import { TeachingTeamTab } from './course/TeachingTeamTab';
import { StudyStrategiesTab } from './course/StudyStrategiesTab';
import { FeedbackLoopTab } from './course/FeedbackLoopTab';
import { RecommendRing } from './charts/RecommendRing';

export type CourseDetailTab =
  | 'overview'
  | 'reviews'
  | 'teaching'
  | 'feedback'
  | 'strategies';

interface CourseDetailPageProps {
  course: Course;
  stats: CourseStats;
  reviews: Review[];
  instructors: InstructorProfile[];
  facultyResponses: FacultyResponse[];
  initialTab?: CourseDetailTab;
  initialHighlightReviewId?: string;
  isSaved: boolean;
  userVotes: Record<string, 'helpful' | 'not_helpful'>;
  onBackToExplore: () => void;
  onToggleSave: (courseId: string) => void;
  onOpenWriteReview: () => void;
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onReportReview: (reviewId: string) => void;
  onSubmitFacultyResponse: (payload: {
    courseId: string;
    instructorName: string;
    role: 'professor' | 'ta';
    term: string;
    themeAddressed: string;
    responseText: string;
    status: FacultyResponseStatus;
  }) => Promise<void>;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  stats,
  reviews,
  instructors,
  facultyResponses,
  initialTab = 'overview',
  initialHighlightReviewId,
  isSaved,
  userVotes,
  onBackToExplore,
  onToggleSave,
  onOpenWriteReview,
  onVote,
  onReportReview,
  onSubmitFacultyResponse,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<CourseDetailTab>(initialTab);
  const [highlightReviewId, setHighlightReviewId] = useState<string | undefined>(
    initialHighlightReviewId
  );
  const [insights, setInsights] = useState<CourseInsightReport | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const tablistRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<CourseDetailTab, HTMLButtonElement | null>>({
    overview: null,
    reviews: null,
    teaching: null,
    feedback: null,
    strategies: null,
  });

  const hasReviews = stats.responseCount > 0;

  const loadInsights = async (forceRefresh = false) => {
    if (!hasReviews) {
      setInsights(null);
      setInsightsLoading(false);
      return;
    }
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, forceRefresh }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights);
      }
    } catch (err) {
      console.warn('Could not load insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [course.id, initialTab]);

  useEffect(() => {
    loadInsights(false);
  }, [course.id, reviews.length]);

  const selectTab = (nextTab: CourseDetailTab, focusButton = false) => {
    setActiveTab(nextTab);

    // Keep scroll position sensible when switching tabs: if the user has scrolled
    // below the tab bar, gently bring the tab bar back below the sticky header.
    const listEl = tablistRef.current;
    if (listEl) {
      const rect = listEl.getBoundingClientRect();
      if (rect.top < 72) {
        const targetTop = Math.max(0, window.scrollY + rect.top - 80);
        window.scrollTo({
          top: targetTop,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    }

    if (focusButton) {
      tabRefs.current[nextTab]?.focus();
    }
  };

  const jumpToReview = (reviewId: string) => {
    setHighlightReviewId(reviewId);
    setActiveTab('reviews');
    setTimeout(() => {
      const el = document.getElementById(`review-${reviewId}`);
      el?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }, 170);
  };

  const tabs: Array<{ id: CourseDetailTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'reviews',
      label: 'Reviews',
      count: reviews.filter((r) => r.moderationStatus !== 'hidden').length,
    },
    { id: 'teaching', label: 'TA feedback', count: instructors.length },
    { id: 'feedback', label: 'Feedback Loop', count: facultyResponses.length },
    { id: 'strategies', label: 'Study strategies' },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      selectTab(tabs[nextIndex].id, true);
    }
  };

  const scheduleLabel =
    course.catalogStatus === 'scheduled_for_term'
      ? 'Scheduled for active term'
      : course.catalogStatus === 'not_confirmed_for_term'
      ? 'Not confirmed for active term'
      : course.calendarVersion ?? 'Official academic calendar';

  return (
    <main className="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 lg:px-8">
      {/* Top Breadcrumb Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[var(--text-muted)]">
        <button
          type="button"
          onClick={onBackToExplore}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-control px-2 py-2 font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Explore Courses</span>
        </button>
        <span className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <CalendarCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{scheduleLabel}</span>
        </span>
      </div>

      {/* Course Header + Headline Metrics */}
      <section className="surface-card rounded-card p-4 sm:p-6 mb-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">{course.universityName}</span>
              <span aria-hidden="true">·</span>
              <span>{course.department}</span>
              <span aria-hidden="true">·</span>
              <span>{course.credits}</span>
              {course.termsOffered.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{course.termsOffered.join(', ')}</span>
                </>
              )}
            </div>

            <h1 className="mt-2 type-h1 text-[var(--text)] text-balance">
              <span className="tabular-nums whitespace-nowrap">{course.code}</span>
              <span className="mx-1 text-[var(--text-muted)] font-normal" aria-hidden="true">
                :{' '}
              </span>
              <span>{course.title}</span>
            </h1>

            <CollapsibleText
              text={course.description}
              className="mt-3 text-sm text-[var(--text-muted)]"
            />
          </div>

          {/* Save + Primary Action */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-pressed={isSaved}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control border px-4 py-2 text-sm font-semibold shadow-surface transition-colors whitespace-nowrap ${
                isSaved
                  ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent-strong)]'
              }`}
            >
              <Bookmark className={`h-4 w-4 shrink-0 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Course'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWriteReview}
              className="btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold whitespace-nowrap"
            >
              <PenSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{hasReviews ? 'Write a Review' : 'Be the first to review'}</span>
            </button>
          </div>
        </div>

        {/* 4 Headline Metrics — single row on desktop, 2 columns on mobile */}
        <div className="mt-6 grid grid-cols-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] sm:grid-cols-4">
          <div className="p-3 sm:p-4 min-w-0">
            <div className="text-xs font-medium text-[var(--text-muted)]">Difficulty</div>
            <div className="mt-1 type-metric text-[var(--text)]">
              {hasReviews ? (
                <>
                  {stats.avgDifficulty.toFixed(1)}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / 5.0</span>
                </>
              ) : (
                <span className="text-xl font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>

          <div className="border-l border-[var(--border)] p-3 sm:p-4 min-w-0">
            <div className="text-xs font-medium text-[var(--text-muted)]">Load index</div>
            <div className="mt-1 type-metric text-[var(--text)] tabular-nums">
              {hasReviews ? (
                <>
                  {stats.load.loadIndex}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / 100</span>
                </>
              ) : (
                <span className="text-xl font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {hasReviews
                ? `${stats.load.avgWeeklyHours.toFixed(1)} hrs · effort ${stats.load.avgMentalEffort.toFixed(1)}/5 · stress ${stats.load.avgStress.toFixed(1)}/5`
                : 'Time, effort and stress'}
            </div>
          </div>

          <div className="border-t border-[var(--border)] sm:border-t-0 sm:border-l p-3 sm:p-4 min-w-0 flex flex-col justify-between">
            <div className="text-xs font-medium text-[var(--text-muted)]">Recommend</div>
            <div className="mt-2 flex items-center">
              {hasReviews ? (
                <RecommendRing
                  size={96}
                  percentage={stats.recommendationRate}
                  responseCount={stats.responseCount}
                  interactive
                />
              ) : (
                <span className="type-metric text-xl font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>

          <div className="border-t border-l border-[var(--border)] sm:border-t-0 p-3 sm:p-4 min-w-0">
            <div className="text-xs font-medium text-[var(--text-muted)]">Responses</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="type-metric text-[var(--text)]">{stats.responseCount}</span>
              <span className="text-xs font-normal text-[var(--text-muted)] tabular-nums">
                {hasReviews ? `${stats.informativeCount} detailed` : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Sample-size confidence note */}
        {hasReviews && (
          <div className="mt-3.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {stats.confidenceLevel === 'limited' ? (
              <Info className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            )}
            <span>{stats.confidenceNote}</span>
          </div>
        )}

        {hasReviews && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-[11px] text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text)]">As of {stats.asOf}</span>
            <span aria-hidden="true">·</span>
            <span>{stats.weightingNote}</span>
          </div>
        )}
      </section>

      {/* Segmented Section Tabs (horizontal scroll on mobile, arrow-key navigation) */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Course detail sections"
        className="no-scrollbar mb-6 flex overflow-x-auto rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-1 gap-1"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls="course-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`inline-flex min-h-[44px] items-center whitespace-nowrap shrink-0 rounded-[4px] border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                  : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-2 rounded-[2px] px-2 py-0.5 text-xs font-medium tabular-nums ${
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Section Panel. A keyed motion.div swaps panels synchronously: an
          AnimatePresence exit animation left the previous tab rendered after the
          selected tab had changed. */}
      <div
        id="course-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
          <motion.div
            key={`${course.id}-${activeTab}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15, ease: 'easeOut' }}
          >
            {activeTab === 'overview' && (
              <CourseOverviewTab
                course={course}
                stats={stats}
                reviews={reviews}
                insights={insights}
                insightsLoading={insightsLoading}
                onRefreshInsights={() => loadInsights(true)}
                onJumpToEvidence={jumpToReview}
                onOpenWriteReview={onOpenWriteReview}
              />
            )}

            {activeTab === 'reviews' && (
              <StudentReviewsTab
                reviews={reviews}
                highlightReviewId={highlightReviewId}
                userVotes={userVotes}
                onVote={onVote}
                onReport={onReportReview}
                onOpenWriteReview={onOpenWriteReview}
              />
            )}

            {activeTab === 'teaching' && (
              <TeachingTeamTab
                courseId={course.id}
                courseCode={course.code}
                instructors={instructors}
                facultyResponses={facultyResponses}
                reviews={reviews}
                stats={stats}
                onSubmitFacultyResponse={onSubmitFacultyResponse}
                onOpenWriteReview={onOpenWriteReview}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackLoopTab courseCode={course.code} facultyResponses={facultyResponses} />
            )}

            {activeTab === 'strategies' && (
              <StudyStrategiesTab
                courseCode={course.code}
                stats={stats}
                reviews={reviews}
                onJumpToReview={jumpToReview}
                onOpenWriteReview={onOpenWriteReview}
              />
            )}
          </motion.div>
      </div>
    </main>
  );
};


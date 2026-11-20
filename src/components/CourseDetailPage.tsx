import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CalendarCheck2,
  CheckCircle2,
  Info,
  PenSquare,
} from 'lucide-react';
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
import { CourseOverviewTab } from './course/CourseOverviewTab';
import { StudentReviewsTab } from './course/StudentReviewsTab';
import { TeachingTeamTab } from './course/TeachingTeamTab';
import { StudyStrategiesTab } from './course/StudyStrategiesTab';
import { FeedbackLoopTab } from './course/FeedbackLoopTab';

export type CourseDetailTab = 'overview' | 'reviews' | 'teaching' | 'feedback' | 'strategies';

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

  const [showFullDescription, setShowFullDescription] = useState(false);

  const hasReviews = stats.responseCount > 0;
  const isLongDescription = course.description.length > 230;

  useEffect(() => {
    setShowFullDescription(false);
  }, [course.id]);

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

  const jumpToReview = (reviewId: string) => {
    setHighlightReviewId(reviewId);
    setActiveTab('reviews');
    setTimeout(() => {
      const el = document.getElementById(`review-${reviewId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const tabs: Array<{ id: CourseDetailTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'reviews',
      label: 'Student Reviews',
      count: reviews.filter((r) => r.moderationStatus !== 'hidden').length,
    },
    { id: 'teaching', label: 'Teaching Team', count: instructors.length },
    { id: 'feedback', label: 'Feedback Loop', count: facultyResponses.length },
    { id: 'strategies', label: 'Study Strategies' },
  ];

  const scheduleLabel =
    course.catalogStatus === 'scheduled_for_term'
      ? 'Scheduled in term API'
      : course.catalogStatus === 'not_confirmed_for_term'
      ? 'Not confirmed for active term'
      : course.isOfficialCatalog
      ? `Listed in ${course.calendarVersion ?? '2026–2027 Academic Calendar'}`
      : 'Demonstration course profile';

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      {/* Breadcrumb Back Link */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={onBackToExplore}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)]/85 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Explore Courses</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
          <CalendarCheck2 className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
          <span>{scheduleLabel}</span>
        </span>
      </div>

      {/* Course Header Card */}
      <section className="surface-card rounded-2xl bg-gradient-to-b from-[var(--surface-hero-mid)] via-[var(--surface)] to-[var(--surface)] p-6 sm:p-7 mb-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
              <span className="font-mono text-sm font-bold text-[var(--accent-code)] tabular-nums">
                {course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--text-primary)]">{course.universityName}</span>
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

            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl text-balance">
              {course.title}
            </h1>

            <p
              className={`mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px] ${
                isLongDescription && !showFullDescription ? 'line-clamp-2' : ''
              }`}
            >
              {course.description}
            </p>
            {isLongDescription && (
              <button
                type="button"
                aria-expanded={showFullDescription}
                onClick={() => setShowFullDescription((v) => !v)}
                className="mt-1 text-xs font-semibold text-[var(--accent-text)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
              >
                {showFullDescription ? 'Show less' : 'Read full description'}
              </button>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                isSaved
                  ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Course'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWriteReview}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <PenSquare className="h-4 w-4" aria-hidden="true" />
              <span>{hasReviews ? 'Write a Review' : 'Be the first to review'}</span>
            </button>
          </div>
        </div>

        {/* Unified 4-Column Primary Metric Strip */}
        <div className="mt-6 grid grid-cols-2 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          <div className="px-4 py-3.5 sm:px-5">
            <div className="text-xs font-medium text-[var(--text-muted)]">Difficulty</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {hasReviews ? (
                <>
                  {stats.avgDifficulty.toFixed(1)}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / 5.0</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>

          <div className="border-l border-[var(--border)] px-4 py-3.5 sm:border-l-0 sm:px-5">
            <div className="text-xs font-medium text-[var(--text-muted)]">Load index</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {hasReviews ? (
                <>
                  {stats.load.loadIndex}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / 100</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {hasReviews
                ? `${stats.load.avgWeeklyHours.toFixed(1)} hrs · effort ${stats.load.avgMentalEffort.toFixed(1)}/5 · stress ${stats.load.avgStress.toFixed(1)}/5`
                : 'Time, effort and stress'}
            </div>
          </div>

          <div className="px-4 py-3.5 sm:px-5">
            <div className="text-xs font-medium text-[var(--text-muted)]">Student recommendation</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[var(--status-positive)] tabular-nums">
              {hasReviews ? (
                `${stats.recommendationRate}%`
              ) : (
                <span className="text-lg font-semibold text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>

          <div className="border-l border-[var(--border)] px-4 py-3.5 sm:border-l-0 sm:px-5">
            <div className="text-xs font-medium text-[var(--text-muted)]">Student responses</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {stats.responseCount}
              <span className="ml-1.5 font-sans text-xs font-normal text-[var(--text-muted)]">
                {hasReviews ? `(${stats.informativeCount} detailed)` : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Sample-size confidence note */}
        <div className="mt-3.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {!hasReviews || stats.confidenceLevel === 'limited' ? (
            <Info
              className={`h-3.5 w-3.5 shrink-0 ${hasReviews ? 'text-[var(--status-warning)]' : 'text-[var(--accent-text)]'}`}
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)] shrink-0" aria-hidden="true" />
          )}
          <span>
            {hasReviews
              ? stats.confidenceNote
              : 'No student reviews recorded yet. Official academic calendar information is displayed below without fabricated student averages.'}
          </span>
        </div>

        {hasReviews && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-[11px] text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">As of {stats.asOf}</span>
            <span aria-hidden="true">·</span>
            <span>{stats.weightingNote}</span>
          </div>
        )}
      </section>

      {/* Integrated Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Course detail sections"
        className="mb-6 flex overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1.5 gap-1.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                isActive
                  ? 'bg-[var(--surface-accent)] text-[var(--accent-code)] shadow-xs border border-[var(--accent-subtle-border)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]/70 hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                    isActive
                      ? 'bg-[var(--surface)]/90 text-[var(--accent-text)]'
                      : 'bg-[var(--surface)]/65 text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel with Smooth Transition.
          A keyed motion.div (no AnimatePresence) swaps panels synchronously: waiting for an
          exit animation left the previous tab rendered after the selected tab had changed. */}
      <div role="tabpanel">
        <motion.div
          key={`${course.id}-${activeTab}`}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
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

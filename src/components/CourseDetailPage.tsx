import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Info,
  PenSquare,
} from 'lucide-react';
import type {
  Course,
  CourseInsightReport,
  CourseStats,
  FacultyResponse,
  InstructorProfile,
  Review,
} from '../types/course';
import { CourseOverviewTab } from './course/CourseOverviewTab';
import { StudentReviewsTab } from './course/StudentReviewsTab';
import { TeachingTeamTab } from './course/TeachingTeamTab';
import { StudyStrategiesTab } from './course/StudyStrategiesTab';

export type CourseDetailTab = 'overview' | 'reviews' | 'teaching' | 'strategies';

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
  const [activeTab, setActiveTab] = useState<CourseDetailTab>(initialTab);
  const [highlightReviewId, setHighlightReviewId] = useState<string | undefined>(
    initialHighlightReviewId
  );
  const [insights, setInsights] = useState<CourseInsightReport | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadInsights = async (forceRefresh = false) => {
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
    { id: 'strategies', label: 'Study Strategies' },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Back Link */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={onBackToExplore}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-white/80 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Explore Courses</span>
        </button>
        <span className="rounded-md bg-white/70 px-2.5 py-1 text-[11px] font-medium text-slate-500 border border-slate-200/60">
          Demonstration course intelligence profile
        </span>
      </div>

      {/* Course Header Card */}
      <section className="surface-card rounded-2xl bg-gradient-to-b from-[#F5F8FD] via-white to-white p-6 sm:p-7 mb-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500">
              <span className="rounded-md bg-blue-50/95 px-2.5 py-0.5 font-mono text-sm font-bold text-blue-800 tabular-nums">
                {course.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{course.universityName}</span>
              <span aria-hidden="true">·</span>
              <span>{course.department}</span>
              <span aria-hidden="true">·</span>
              <span>{course.credits}</span>
              <span aria-hidden="true">·</span>
              <span>Offered {course.termsOffered.join(', ')}</span>
            </div>

            <h1 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
              {course.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {course.description}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(course.id)}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-xs transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSaved
                  ? 'border-blue-200 bg-blue-50/95 text-blue-800'
                  : 'border-slate-200/90 bg-white text-slate-700 hover:bg-[#F5F8FC] hover:border-slate-300'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-blue-700 text-blue-700' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Course'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenWriteReview}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-800 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <PenSquare className="h-4 w-4" aria-hidden="true" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* 4 Core KPI Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 pt-5 border-t border-slate-200/70 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200/75 bg-[#F4F7FB] px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Difficulty rating</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {stats.avgDifficulty.toFixed(1)}
              <span className="text-sm font-normal text-slate-400"> / 5.0</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/75 bg-[#F4F7FB] px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Avg weekly study</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {stats.avgWeeklyHours.toFixed(1)}
              <span className="text-sm font-normal text-slate-500"> hrs/wk</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/75 bg-[#F4F7FB] px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Student recommendation</div>
            <div className="mt-1 font-mono text-2xl font-bold text-teal-700 tabular-nums">
              {stats.recommendationRate}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/75 bg-[#F4F7FB] px-4 py-3.5">
            <div className="text-xs font-medium text-slate-500">Student responses</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {stats.responseCount}
              <span className="ml-1.5 font-sans text-xs font-normal text-slate-500">
                ({stats.informativeCount} detailed)
              </span>
            </div>
          </div>
        </div>

        {/* Sample-size confidence note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          {stats.confidenceLevel === 'limited' ? (
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0" aria-hidden="true" />
          )}
          <span>{stats.confidenceNote}</span>
        </div>
      </section>

      {/* Integrated Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Course detail sections"
        className="mb-6 flex overflow-x-auto rounded-xl border border-slate-200/80 bg-[#E6ECF4]/80 p-1.5 gap-1.5"
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
              className={`whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div role="tabpanel">
        {activeTab === 'overview' && (
          <CourseOverviewTab
            course={course}
            stats={stats}
            insights={insights}
            insightsLoading={insightsLoading}
            onRefreshInsights={() => loadInsights(true)}
            onJumpToEvidence={jumpToReview}
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
          />
        )}

        {activeTab === 'strategies' && (
          <StudyStrategiesTab
            courseCode={course.code}
            stats={stats}
            reviews={reviews}
            onJumpToReview={jumpToReview}
          />
        )}
      </div>
    </main>
  );
};

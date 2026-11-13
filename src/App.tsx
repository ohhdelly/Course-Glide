import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import type {
  Course,
  CourseStats,
  DemoUser,
  FacultyResponse,
  InstructorProfile,
  ModerationReport,
  Review,
  StudyMethodKey,
  University,
  UniversityId,
} from './types/course';
import { computeCourseStats } from './utils/trustLens';
import {
  DEMO_COURSES,
  DEMO_FACULTY_RESPONSES,
  DEMO_INSTRUCTORS,
  DEMO_MODERATION_REPORTS,
  DEMO_REVIEWS,
  DEMO_UNIVERSITIES,
} from './data/demoDataset';
import { Navbar, type AppRoute } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ExplorePage } from './components/ExplorePage';
import { CourseDetailPage } from './components/CourseDetailPage';
import { SavedCoursesPage } from './components/SavedCoursesPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { WriteReviewModal } from './components/WriteReviewModal';
import { ReportReviewModal } from './components/ReportReviewModal';
import { ProfileModal } from './components/ProfileModal';

const DEMO_STUDENT_PROFILE: DemoUser = {
  id: 'demo-student',
  name: 'Alex Morgan (Demo)',
  email: 'alex.demo@student.courseglide.edu',
  universityId: 'uwaterloo',
  program: 'Honours Computer Science & Mathematics (Demonstration Account)',
  role: 'student',
};

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info';
}

function parseRouteFromHash(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/') return { page: 'landing' };
  if (hash.startsWith('/explore')) return { page: 'explore' };
  if (hash.startsWith('/saved')) return { page: 'saved' };
  if (hash.startsWith('/how-it-works')) return { page: 'how-it-works' };
  if (hash.startsWith('/course/')) {
    const rest = hash.slice('/course/'.length);
    const [courseId, tab] = rest.split('/');
    if (courseId) {
      const validTab =
        tab === 'overview' || tab === 'reviews' || tab === 'teaching' || tab === 'strategies'
          ? tab
          : 'overview';
      return { page: 'course', courseId, initialTab: validTab };
    }
  }
  return { page: 'landing' };
}

function routeToHash(route: AppRoute): string {
  if (route.page === 'landing') return '#/';
  if (route.page === 'explore') return '#/explore';
  if (route.page === 'saved') return '#/saved';
  if (route.page === 'how-it-works') return '#/how-it-works';
  if (route.page === 'course') {
    return `#/course/${route.courseId}/${route.initialTab ?? 'overview'}`;
  }
  return '#/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromHash());
  const [loading, setLoading] = useState(true);

  const [universities, setUniversities] = useState<University[]>(DEMO_UNIVERSITIES);
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [instructors, setInstructors] = useState<InstructorProfile[]>(DEMO_INSTRUCTORS);
  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS);
  const [facultyResponses, setFacultyResponses] =
    useState<FacultyResponse[]>(DEMO_FACULTY_RESPONSES);
  const [moderationReports, setModerationReports] =
    useState<ModerationReport[]>(DEMO_MODERATION_REPORTS);

  const [selectedUniversity, setSelectedUniversity] = useState<UniversityId>('all');
  const [exploreQuery, setExploreQuery] = useState('');
  const [savedCourseIds, setSavedCourseIds] = useState<string[]>(['math-137', 'cs-135']);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'not_helpful'>>({});

  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => {
    try {
      const stored = window.localStorage.getItem('courseglide_demo_user');
      return stored === 'signed_out' ? null : DEMO_STUDENT_PROFILE;
    } catch {
      return DEMO_STUDENT_PROFILE;
    }
  });

  const [writeReviewCourseId, setWriteReviewCourseId] = useState<string | null>(null);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((text: string, tone: 'success' | 'info' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    const nextHash = routeToHash(next);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    let active = true;
    const userId = currentUser?.id ?? 'guest-demo';
    fetch(`/api/bootstrap?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Bootstrap failed'))))
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.universities)) setUniversities(data.universities);
        if (Array.isArray(data.courses)) setCourses(data.courses);
        if (Array.isArray(data.instructors)) setInstructors(data.instructors);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
        if (Array.isArray(data.facultyResponses)) setFacultyResponses(data.facultyResponses);
        if (Array.isArray(data.moderationReports)) setModerationReports(data.moderationReports);
        if (Array.isArray(data.savedCourseIds)) setSavedCourseIds(data.savedCourseIds);
        if (data.userVotes && typeof data.userVotes === 'object') setUserVotes(data.userVotes);
      })
      .catch(() => {
        // Fallback already seeded from DEMO_* constants
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Derived stats per course
  const statsMap = useMemo<Record<string, CourseStats>>(() => {
    const map: Record<string, CourseStats> = {};
    for (const course of courses) {
      const courseReviews = reviews.filter((r) => r.courseId === course.id);
      map[course.id] = computeCourseStats(courseReviews);
    }
    return map;
  }, [courses, reviews]);

  const instructorsByCourse = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const inst of instructors) {
      map[inst.courseId] = [...(map[inst.courseId] ?? []), inst.name];
    }
    return map;
  }, [instructors]);

  const handleToggleSave = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    const wasSaved = savedCourseIds.includes(courseId);
    setSavedCourseIds((prev) =>
      wasSaved ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );

    try {
      const res = await fetch('/api/saved-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id ?? 'guest-demo',
          courseId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedCourseIds(data.savedCourseIds);
      }
    } catch {
      // Keep optimistic state if offline
    }

    pushToast(
      wasSaved
        ? `Removed ${course?.code ?? 'course'} from Saved Courses.`
        : `Saved ${course?.code ?? 'course'} to your Saved Courses list.`
    );
  };

  const handleSubmitReview = async (payload: {
    courseId: string;
    term: string;
    instructorName: string;
    taName?: string;
    authorAlias: string;
    isAnonymous: boolean;
    difficulty: 1 | 2 | 3 | 4 | 5;
    weeklyHours: number;
    recommended: boolean;
    usefulness: 1 | 2 | 3 | 4 | 5;
    overallExperience: string;
    whatWorkedWell: string;
    whatWasChallenging: string;
    practicalAdvice: string;
    studyMethods: StudyMethodKey[];
  }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not submit review.');
    }
    setReviews((prev) => [data.review, ...prev]);
    pushToast('Review submitted and scored by CourseGlide Trust Lens.');
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    if (userVotes[reviewId] === voteType) {
      pushToast('You already submitted this vote on this review.', 'info');
      return;
    }

    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id ?? 'guest-demo',
        voteType,
      }),
    });
    const data = await res.json();
    if (res.status === 409) {
      pushToast(data.error || 'Vote already recorded.', 'info');
      return;
    }
    if (res.ok && data.review) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
      setUserVotes((prev) => ({ ...prev, [reviewId]: voteType }));
      pushToast(
        voteType === 'helpful' ? 'Marked review as helpful.' : 'Recorded feedback on review.'
      );
    }
  };

  const handleReportSubmit = async (payload: {
    reviewId: string;
    reason: ModerationReport['reason'];
    details: string;
  }) => {
    const res = await fetch(`/api/reviews/${encodeURIComponent(payload.reviewId)}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: payload.reason,
        details: payload.details,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setModerationReports((prev) => [data.report, ...prev]);
      if (data.review) {
        setReviews((prev) => prev.map((r) => (r.id === payload.reviewId ? data.review : r)));
      }
      pushToast('Report submitted to the moderation queue.');
    }
  };

  const handleResolveModeration = async (reportId: string, action: 'keep' | 'remove') => {
    const res = await fetch(`/api/moderation/${encodeURIComponent(reportId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setModerationReports((prev) =>
        prev.map((m) => (m.id === reportId ? data.report : m))
      );
      if (data.review) {
        setReviews((prev) =>
          prev.map((r) => (r.id === data.review.id ? data.review : r))
        );
      }
      pushToast(
        action === 'remove'
          ? 'Review hidden by moderation.'
          : 'Review kept visible after moderation check.'
      );
    }
  };

  const handleSubmitFacultyResponse = async (payload: {
    courseId: string;
    instructorName: string;
    role: 'professor' | 'ta';
    term: string;
    themeAddressed: string;
    responseText: string;
  }) => {
    const res = await fetch('/api/faculty-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not publish faculty response.');
    }
    setFacultyResponses((prev) => [data.facultyResponse, ...prev]);
    pushToast('Demo faculty response published to Teaching Team.');
  };

  const handleSignInDemo = () => {
    setCurrentUser(DEMO_STUDENT_PROFILE);
    try {
      window.localStorage.setItem('courseglide_demo_user', 'signed_in');
    } catch {
      // ignore storage errors
    }
    setProfileModalOpen(false);
    pushToast('Signed in to Demonstration Student Profile.');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      window.localStorage.setItem('courseglide_demo_user', 'signed_out');
    } catch {
      // ignore storage errors
    }
    setProfileModalOpen(false);
    pushToast('Signed out of demonstration session.', 'info');
  };

  const activeCourse =
    route.page === 'course'
      ? courses.find((c) => c.id === route.courseId) ?? courses[0]
      : null;

  const writeReviewCourse = writeReviewCourseId
    ? courses.find((c) => c.id === writeReviewCourseId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F4F9] text-[#0F172A]">
      <Navbar
        route={route}
        onNavigate={navigate}
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelectUniversity={setSelectedUniversity}
        savedCount={savedCourseIds.length}
        currentUser={currentUser}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      {loading ? (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8" aria-busy="true">
          <div className="space-y-6">
            <div className="h-10 w-2/3 max-w-lg animate-pulse rounded-lg bg-slate-200/80" />
            <div className="h-5 w-1/2 max-w-md animate-pulse rounded bg-slate-200/80" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl border border-slate-200/80 bg-white/80" />
              ))}
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1">
          {route.page === 'landing' && (
            <LandingPage
              courses={courses}
              statsMap={statsMap}
              instructorsByCourse={instructorsByCourse}
              selectedUniversity={selectedUniversity}
              savedCourseIds={savedCourseIds}
              onToggleSave={handleToggleSave}
              onOpenCourse={(courseId, tab) =>
                navigate({ page: 'course', courseId, initialTab: tab ?? 'overview' })
              }
              onSearchSubmit={(q) => {
                setExploreQuery(q);
                navigate({ page: 'explore' });
              }}
              onGoExplore={() => navigate({ page: 'explore' })}
              onGoHowItWorks={() => navigate({ page: 'how-it-works' })}
            />
          )}

          {route.page === 'explore' && (
            <ExplorePage
              courses={courses}
              universities={universities}
              statsMap={statsMap}
              instructorsByCourse={instructorsByCourse}
              selectedUniversity={selectedUniversity}
              onSelectUniversity={setSelectedUniversity}
              initialQuery={exploreQuery}
              savedCourseIds={savedCourseIds}
              onToggleSave={handleToggleSave}
              onOpenCourse={(courseId) =>
                navigate({ page: 'course', courseId, initialTab: 'overview' })
              }
            />
          )}

          {route.page === 'course' && activeCourse && (
            <CourseDetailPage
              course={activeCourse}
              stats={statsMap[activeCourse.id]}
              reviews={reviews.filter((r) => r.courseId === activeCourse.id)}
              instructors={instructors.filter((i) => i.courseId === activeCourse.id)}
              facultyResponses={facultyResponses.filter((f) => f.courseId === activeCourse.id)}
              initialTab={route.initialTab}
              initialHighlightReviewId={route.highlightReviewId}
              isSaved={savedCourseIds.includes(activeCourse.id)}
              userVotes={userVotes}
              onBackToExplore={() => navigate({ page: 'explore' })}
              onToggleSave={handleToggleSave}
              onOpenWriteReview={() => setWriteReviewCourseId(activeCourse.id)}
              onVote={handleVote}
              onReportReview={(reviewId) => setReportReviewId(reviewId)}
              onSubmitFacultyResponse={handleSubmitFacultyResponse}
            />
          )}

          {route.page === 'saved' && (
            <SavedCoursesPage
              courses={courses}
              statsMap={statsMap}
              savedCourseIds={savedCourseIds}
              onToggleSave={handleToggleSave}
              onOpenCourse={(courseId) =>
                navigate({ page: 'course', courseId, initialTab: 'overview' })
              }
              onGoExplore={() => navigate({ page: 'explore' })}
            />
          )}

          {route.page === 'how-it-works' && (
            <HowItWorksPage
              courses={courses}
              reviews={reviews}
              moderationReports={moderationReports}
              onResolveModeration={handleResolveModeration}
              onOpenCourse={(courseId, tab) =>
                navigate({ page: 'course', courseId, initialTab: tab ?? 'overview' })
              }
            />
          )}
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200/80 bg-[#F7F9FC]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <strong className="font-display font-semibold text-slate-800">CourseGlide</strong>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Better feedback. Smarter course decisions.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>Demonstration dataset (Waterloo &amp; uOttawa)</span>
            <button
              type="button"
              onClick={() => navigate({ page: 'how-it-works' })}
              className="font-medium text-slate-700 hover:text-blue-700"
            >
              Methodology &amp; Moderation
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {writeReviewCourse && (
        <WriteReviewModal
          course={writeReviewCourse}
          instructors={instructors.filter((i) => i.courseId === writeReviewCourse.id)}
          onClose={() => setWriteReviewCourseId(null)}
          onSubmit={handleSubmitReview}
        />
      )}

      {reportReviewId && (
        <ReportReviewModal
          reviewId={reportReviewId}
          onClose={() => setReportReviewId(null)}
          onSubmitReport={handleReportSubmit}
        />
      )}

      {profileModalOpen && (
        <ProfileModal
          currentUser={currentUser}
          savedCourses={courses.filter((c) => savedCourseIds.includes(c.id))}
          onClose={() => setProfileModalOpen(false)}
          onSignInDemo={handleSignInDemo}
          onSignOut={handleSignOut}
          onOpenCourse={(courseId) =>
            navigate({ page: 'course', courseId, initialTab: 'overview' })
          }
        />
      )}

      {/* Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-lg"
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="h-4 w-4 text-blue-400 shrink-0" aria-hidden="true" />
            )}
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Dismiss notification"
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import type {
  CatalogueMetadata,
  CatalogueSubject,
  Course,
  CourseStats,
  DemoUser,
  FacultyResponse,
  FacultyResponseStatus,
  GradeBand,
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
import { ThemeProvider } from './theme/ThemeContext';
import { getConfiguredUniversities, resolveActiveThemeId, UNIVERSITY_THEMES } from './theme/universityTheme';

const DEMO_STUDENT_PROFILE: DemoUser = {
  id: 'demo-student',
  name: 'Alex Morgan (Demo)',
  email: 'alex.demo@student.courseglide.edu',
  universityId: 'uwaterloo',
  program: 'Honours Computer Science & Mathematics',
  role: 'student',
};

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
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
        tab === 'overview' ||
        tab === 'reviews' ||
        tab === 'teaching' ||
        tab === 'feedback' ||
        tab === 'strategies'
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
  const [subjects, setSubjects] = useState<CatalogueSubject[]>([]);
  const [catalogueMeta, setCatalogueMeta] = useState<CatalogueMetadata | null>(null);
  const [instructors, setInstructors] = useState<InstructorProfile[]>(DEMO_INSTRUCTORS);
  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS);
  const [facultyResponses, setFacultyResponses] =
    useState<FacultyResponse[]>(DEMO_FACULTY_RESPONSES);
  const [moderationReports, setModerationReports] =
    useState<ModerationReport[]>(DEMO_MODERATION_REPORTS);

  const [selectedUniversity, setSelectedUniversity] = useState<UniversityId>(() => {
    try {
      const stored = window.localStorage.getItem('courseglide_selected_university');
      if (stored === 'all' || (stored && stored in UNIVERSITY_THEMES)) {
        return stored;
      }
    } catch {
      // Ignore storage access failures
    }
    return 'all';
  });
  const [exploreQuery, setExploreQuery] = useState('');
  const [advisorQuery, setAdvisorQuery] = useState('');
  const [reviewRevision, setReviewRevision] = useState(0);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseNotFoundId, setCourseNotFoundId] = useState<string | null>(null);
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

  const pushToast = useCallback(
    (
      text: string,
      tone: 'success' | 'info' = 'success',
      action?: ToastMessage['action']
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, text, tone, action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    const nextHash = routeToHash(next);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
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
        if (Array.isArray(data.courses)) {
          setCourses((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            for (const c of data.courses as Course[]) {
              byId.set(c.id, { ...byId.get(c.id), ...c });
            }
            return Array.from(byId.values());
          });
        }
        if (Array.isArray(data.subjects)) setSubjects(data.subjects);
        if (data.catalogueMeta) setCatalogueMeta(data.catalogueMeta);
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

  // Fetch full official catalogue record + term schedule status when opening any course route
  useEffect(() => {
    if (route.page !== 'course') {
      setCourseNotFoundId(null);
      setCourseDetailLoading(false);
      return;
    }

    const targetId = route.courseId;
    const alreadyCached = courses.some((c) => c.id === targetId);
    if (!alreadyCached) {
      setCourseDetailLoading(true);
    }
    setCourseNotFoundId(null);

    let active = true;
    fetch(`/api/courses/${encodeURIComponent(targetId)}`)
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error('NOT_FOUND');
        }
        if (!res.ok) {
          throw new Error('FETCH_FAILED');
        }
        return res.json();
      })
      .then((data) => {
        if (!active || !data?.course) return;
        const fetchedCourse = data.course as Course;
        setCourses((prev) => {
          const exists = prev.some((c) => c.id === fetchedCourse.id);
          if (exists) {
            return prev.map((c) => (c.id === fetchedCourse.id ? { ...c, ...fetchedCourse } : c));
          }
          return [...prev, fetchedCourse];
        });
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof Error && err.message === 'NOT_FOUND') {
          setCourseNotFoundId(targetId);
        }
      })
      .finally(() => {
        if (active) setCourseDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [route.page === 'course' ? route.courseId : null]);

  // Derived stats per course
  const statsMap = useMemo<Record<string, CourseStats>>(() => {
    const reviewsByCourse = new Map<string, Review[]>();
    for (const review of reviews) {
      const list = reviewsByCourse.get(review.courseId) ?? [];
      list.push(review);
      reviewsByCourse.set(review.courseId, list);
    }

    // Department rating priors, from raw review usefulness rather than the already-shrunk stats.
    const departmentTotals = new Map<string, { sum: number; count: number; courses: number }>();
    for (const course of courses) {
      const visible = (reviewsByCourse.get(course.id) ?? []).filter(
        (review) => review.moderationStatus !== 'hidden'
      );
      if (visible.length === 0) continue;
      const key = `${course.universityId}::${course.department}`;
      const entry = departmentTotals.get(key) ?? { sum: 0, count: 0, courses: 0 };
      entry.sum += visible.reduce((sum, review) => sum + review.usefulness, 0);
      entry.count += visible.length;
      entry.courses += 1;
      departmentTotals.set(key, entry);
    }

    // One stats pass per course; courses with no reviews keep the empty, unanchored shape.
    const map: Record<string, CourseStats> = {};
    for (const course of courses) {
      const totals = departmentTotals.get(`${course.universityId}::${course.department}`);
      map[course.id] = computeCourseStats(
        reviewsByCourse.get(course.id) ?? [],
        totals
          ? {
              priorRating: totals.sum / totals.count,
              priorWeight: Math.min(8, Math.max(2, totals.courses)),
              priorLabel: course.department,
            }
          : undefined
      );
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

  const handleToggleSave = async (
    courseId: string,
    options?: { silent?: boolean }
  ) => {
    let course = courses.find((c) => c.id === courseId);
    const wasSaved = savedCourseIds.includes(courseId);
    setSavedCourseIds((prev) =>
      wasSaved ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );

    if (!course) {
      try {
        const courseRes = await fetch(`/api/courses/${encodeURIComponent(courseId)}`);
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          if (courseData?.course) {
            const hydrated = courseData.course as Course;
            course = hydrated;
            setCourses((prev) =>
              prev.some((c) => c.id === hydrated.id) ? prev : [...prev, hydrated]
            );
          }
        }
      } catch {
        // ignore hydration error
      }
    }

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

    if (!options?.silent) {
      pushToast(
        wasSaved ? 'Removed from saved' : 'Saved',
        wasSaved ? 'info' : 'success',
        {
          label: 'Undo',
          onClick: () => {
            void handleToggleSave(courseId, { silent: true });
          },
        }
      );
    }
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
    mentalEffort: 1 | 2 | 3 | 4 | 5;
    stress: 1 | 2 | 3 | 4 | 5;
    targetGrade?: GradeBand;
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
    setReviewRevision((v) => v + 1);
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
      setReviewRevision((v) => v + 1);
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
    status: FacultyResponseStatus;
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
      ? courses.find((c) => c.id === route.courseId) ?? null
      : null;

  const activeThemeId = useMemo(
    () =>
      resolveActiveThemeId({
        routePage: route.page,
        selectedUniversity,
        activeCourseUniversityId: activeCourse?.universityId ?? null,
      }),
    [route.page, selectedUniversity, activeCourse?.universityId]
  );

  const configuredUniversities = useMemo(
    () => getConfiguredUniversities(universities),
    [universities]
  );

  const handleSelectUniversity = useCallback(
    (nextUniversity: UniversityId) => {
      setSelectedUniversity(nextUniversity);
      try {
        window.localStorage.setItem('courseglide_selected_university', nextUniversity);
      } catch {
        // Ignore storage access failures
      }
      if (
        route.page === 'course' &&
        activeCourse &&
        nextUniversity !== 'all' &&
        nextUniversity !== activeCourse.universityId
      ) {
        navigate({ page: 'explore' });
      }
    },
    [route.page, activeCourse, navigate]
  );

  const writeReviewCourse = writeReviewCourseId
    ? courses.find((c) => c.id === writeReviewCourseId) ?? null
    : null;

  return (
    <ThemeProvider themeId={activeThemeId}>
      <Navbar
        route={route}
        onNavigate={navigate}
        universities={configuredUniversities}
        selectedUniversity={selectedUniversity}
        onSelectUniversity={handleSelectUniversity}
        savedCount={savedCourseIds.length}
        currentUser={currentUser}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      {loading ? (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
          <div className="space-y-6">
            <div className="h-8 w-2/3 max-w-lg animate-pulse rounded-control bg-[var(--surface-2)]" />
            <div className="h-6 w-1/2 max-w-md animate-pulse rounded-control bg-[var(--surface-2)]" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-card border border-[var(--border)] bg-[var(--surface)]" />
              ))}
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1">
          {route.page === 'landing' && (
            <LandingPage
              courses={courses}
              catalogueMeta={catalogueMeta}
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
                setAdvisorQuery('');
                navigate({ page: 'explore' });
              }}
              onAskAdvisor={(q) => {
                setAdvisorQuery(q);
                setExploreQuery('');
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
              subjects={subjects}
              catalogueMeta={catalogueMeta}
              statsMap={statsMap}
              instructorsByCourse={instructorsByCourse}
              selectedUniversity={selectedUniversity}
              onSelectUniversity={handleSelectUniversity}
              initialQuery={exploreQuery}
              initialAdvisorQuery={advisorQuery}
              reviewRevision={reviewRevision}
              savedCourseIds={savedCourseIds}
              onToggleSave={handleToggleSave}
              onOpenCourse={(courseId) =>
                navigate({ page: 'course', courseId, initialTab: 'overview' })
              }
            />
          )}

          {route.page === 'course' && (
            activeCourse ? (
              <CourseDetailPage
                course={activeCourse}
                stats={statsMap[activeCourse.id] ?? computeCourseStats([])}
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
            ) : courseDetailLoading ? (
              <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
                <div className="surface-card rounded-card p-6 sm:p-8 space-y-4">
                  <div className="h-6 w-32 animate-pulse rounded-control bg-[var(--surface-2)]" />
                  <div className="h-8 w-2/3 animate-pulse rounded-control bg-[var(--surface-2)]" />
                  <div className="h-20 w-full animate-pulse rounded-control bg-[var(--surface-2)]" />
                </div>
              </main>
            ) : (
              <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 text-center">
                <div className="surface-card rounded-card p-6 sm:p-8 space-y-3">
                  <h1 className="type-h1 text-[var(--text)]">
                    Course not found
                  </h1>
                  <p className="type-small text-[var(--text-muted)]">
                    We couldn’t find a catalogue record matching “{courseNotFoundId ?? route.courseId}”.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'explore' })}
                    className="btn-primary mt-3 inline-flex min-h-[44px] items-center rounded-control px-4 py-2 type-small font-medium"
                  >
                    Browse Course Catalogue
                  </button>
                </div>
              </main>
            )
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
              onGoExplore={() => navigate({ page: 'explore' })}
              waterlooCourseCount={catalogueMeta?.waterlooCourseCount}
            />
          )}
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface-2)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 type-caption text-[var(--text-muted)] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <strong className="font-semibold text-[var(--text)]">
              Course<span className="brand-glide">Glide</span>
            </strong>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Seeded demo reviews and teaching-team responses.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              Waterloo {catalogueMeta?.waterlooCalendarVersion ?? '2026–2027 Academic Calendar'} · uOttawa Demo
            </span>
            <button
              type="button"
              onClick={() => navigate({ page: 'how-it-works' })}
              className="inline-flex min-h-[44px] items-center rounded-control px-2 font-medium text-[var(--text)] underline-offset-4 hover:underline"
            >
              How CourseGlide Works
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {writeReviewCourse && (
        <WriteReviewModal
          course={writeReviewCourse}
          instructors={instructors.filter((i) => i.courseId === writeReviewCourse.id)}
          existingReviews={reviews.filter((r) => r.courseId === writeReviewCourse.id)}
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
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-2 rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-2 type-caption text-[var(--text)] shadow-dialog"
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--text)] shrink-0" aria-hidden="true" />
              ) : (
                <Info className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
              )}
              <span className="font-medium">{toast.text}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="btn-secondary inline-flex min-h-[44px] items-center rounded-control px-3 py-1 type-caption font-semibold"
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss notification"
                className="btn-secondary flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-control"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
}

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Info,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
import type { Course, ModerationReport, Review } from '../types/course';

interface HowItWorksPageProps {
  courses: Course[];
  reviews: Review[];
  moderationReports: ModerationReport[];
  onResolveModeration: (reportId: string, action: 'keep' | 'remove') => Promise<void>;
  onOpenCourse: (courseId: string, tab?: 'overview' | 'reviews' | 'teaching' | 'strategies') => void;
  onGoExplore: () => void;
  waterlooCourseCount?: number;
}

interface StageItem {
  id: 'discover' | 'understand' | 'prepare';
  num: string;
  stage: string;
  heading: string;
  revealedCopy: string;
  previewLine: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

interface DemoReviewSegment {
  text: string;
  highlight?: 'detail' | 'advice';
}

interface DemoTrustReview {
  id: string;
  courseCode: string;
  term: string;
  workload: string;
  recommended: boolean;
  specificityLabel: string;
  isInformative: boolean;
  rawOrder: number;
  informativeOrder: number;
  segments: DemoReviewSegment[];
  reasonHeadline: string;
  signals: string[];
}

const FICTIONAL_DEMO_REVIEWS: DemoTrustReview[] = [
  {
    id: 'demo-uninformative',
    courseCode: 'CS 240',
    term: 'Fall 2025',
    workload: 'Workload not specified',
    recommended: false,
    specificityLabel: 'Limited Context',
    isInformative: false,
    rawOrder: 1,
    informativeOrder: 3,
    segments: [{ text: 'This course was awful.' }],
    reasonHeadline: 'Ranked lower in Most Informative mode',
    signals: [
      'Contains strong opinion without naming specific assessments, lectures, or workload',
      'Offers no actionable study advice for incoming students',
      'Still accessible in All Reviews, never deleted for being negative',
    ],
  },
  {
    id: 'demo-informative-pos',
    courseCode: 'MATH 137',
    term: 'Fall 2025',
    workload: '11 hrs/wk',
    recommended: true,
    specificityLabel: 'Detailed · Actionable',
    isInformative: true,
    rawOrder: 2,
    informativeOrder: 1,
    segments: [
      { text: 'The ' },
      { text: 'weekly problem sets', highlight: 'detail' },
      { text: ' were challenging, but ' },
      { text: 'attending tutorials and completing practice questions', highlight: 'advice' },
      { text: ' helped me prepare for the ' },
      { text: 'midterm', highlight: 'detail' },
      { text: '.' },
    ],
    reasonHeadline: 'Prioritized for course-specific detail & preparation advice',
    signals: [
      'References concrete assessments (weekly problem sets, midterm)',
      'Provides actionable preparation advice (tutorials, practice questions)',
      'Includes weekly study-time context (11 hrs/wk)',
    ],
  },
  {
    id: 'demo-informative-neg',
    courseCode: 'MATH 137',
    term: 'Fall 2025',
    workload: '14 hrs/wk',
    recommended: false,
    specificityLabel: 'Balanced Critique',
    isInformative: true,
    rawOrder: 3,
    informativeOrder: 2,
    segments: [
      { text: '' },
      { text: 'Midterm 1 tested inequality proofs', highlight: 'detail' },
      { text: ' faster than lecture examples, and assignments spiked in week 5: ' },
      { text: 'start workbook proofs early and use TA office hours', highlight: 'advice' },
      { text: '.' },
    ],
    reasonHeadline: 'Prioritized equally despite being critical (Sentiment-Neutral)',
    signals: [
      'Trust Lens never penalizes criticism: detailed negative feedback ranks alongside praise',
      'Pinpoints exact difficulty spike (Midterm 1 inequality proofs, week 5)',
      'Includes concrete preparation strategy (workbook proofs + TA office hours)',
    ],
  },
];

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  courses,
  reviews,
  moderationReports,
  onResolveModeration,
  onOpenCourse,
  onGoExplore,
  waterlooCourseCount = 4343,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [focusedStage, setFocusedStage] = useState<string | null>(null);
  const [pinnedStage, setPinnedStage] = useState<string | null>('discover');

  const [demoMode, setDemoMode] = useState<'all' | 'informative'>('all');
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);

  const stages: StageItem[] = useMemo(
    () => [
      {
        id: 'discover',
        num: '01',
        stage: 'Discover',
        heading: 'Find courses that fit you.',
        revealedCopy: 'Explore courses by subject, workload, or teaching experience.',
        previewLine: `${waterlooCourseCount.toLocaleString()} Waterloo courses · 128 subjects`,
        icon: Compass,
      },
      {
        id: 'understand',
        num: '02',
        stage: 'Understand',
        heading: 'Understand before you enroll.',
        revealedCopy: 'Compare workload, trustworthy reviews, and teaching insights.',
        previewLine: 'Difficulty · Weekly hours · Professor & TA notes',
        icon: BarChart3,
      },
      {
        id: 'prepare',
        num: '03',
        stage: 'Prepare',
        heading: 'Discover what works.',
        revealedCopy: 'Explore study strategies shared by previous students.',
        previewLine: 'Practice sets · Tutorials · Past exam prep',
        icon: BookOpenCheck,
      },
    ],
    [waterlooCourseCount]
  );

  const orderedDemoReviews = useMemo(() => {
    return [...FICTIONAL_DEMO_REVIEWS].sort((a, b) =>
      demoMode === 'informative'
        ? a.informativeOrder - b.informativeOrder
        : a.rawOrder - b.rawOrder
    );
  }, [demoMode]);

  const handleModeChange = (mode: 'all' | 'informative') => {
    setDemoMode(mode);
    if (mode === 'informative' && expandedReasonId === null) {
      setExpandedReasonId('demo-informative-pos');
    }
  };

  const toggleStagePin = (id: string) => {
    setPinnedStage((prev) => (prev === id ? null : id));
  };

  return (
    <main className="pb-12">
      {/* 1. Minimal Executive Hero */}
      <section className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <p className="type-caption font-semibold text-[var(--text-muted)]">
            How CourseGlide works
          </p>
          <h1 className="mt-3 type-h1 sm:type-display text-[var(--text)] text-balance">
            Less noise. More clarity.
          </h1>
          <p className="mx-auto mt-4 max-w-xl type-body text-[var(--text-muted)]">
            Discover smarter course insights, trustworthy feedback, and strategies for success.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12 pt-12">
        {/* 2. Interactive Three-Stage Journey: Discover -> Understand -> Prepare */}
        <section
          aria-label="Discover, Understand, Prepare interactive journey"
          className="relative"
        >
          {/* Progression Header */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 type-caption font-semibold text-[var(--text-muted)]">
              <span className="text-[var(--text)]">Discover</span>
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[var(--text)]">Understand</span>
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[var(--text)]">Prepare</span>
            </div>
            <p className="type-caption text-[var(--text-muted)]">
              Hover, focus, or tap any stage to explore
            </p>
          </div>

          {/* Interactive Stage Grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const isRevealed =
                hoveredStage === stage.id ||
                focusedStage === stage.id ||
                pinnedStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') setHoveredStage(stage.id);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') {
                      setHoveredStage((prev) => (prev === stage.id ? null : prev));
                    }
                  }}
                  className="relative h-full"
                >
                  <button
                    type="button"
                    aria-expanded={isRevealed}
                    onFocus={() => setFocusedStage(stage.id)}
                    onBlur={() => setFocusedStage((prev) => (prev === stage.id ? null : prev))}
                    onClick={() => toggleStagePin(stage.id)}
                    className={`group relative flex h-full w-full flex-col justify-between rounded-card border p-6 text-left transition-colors min-h-[220px] ${
                      isRevealed
                        ? 'border-[var(--accent-strong)] bg-[var(--surface)] shadow-surface'
                        : 'border-[var(--border)] bg-[var(--surface)] shadow-surface hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div>
                      {/* Stage Number + Minimal Icon + Interactive Indicator */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-control border ${
                              isRevealed
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                            }`}
                          >
                            <Icon className="h-5 w-5" aria-hidden={true} />
                          </span>
                          <span className="type-caption font-semibold text-[var(--text-muted)] tabular-nums">
                            {stage.num} · {stage.stage}
                          </span>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`flex h-8 w-8 items-center justify-center rounded-control border transition-transform duration-200 ${
                            isRevealed
                              ? 'rotate-45 border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
                              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </span>
                      </div>

                      {/* Large Clean Heading */}
                      <h2 className="mt-6 type-h2 text-[var(--text)] text-balance">
                        {stage.heading}
                      </h2>

                      {/* Subtle Accent Rule */}
                      <div
                        aria-hidden="true"
                        className={`mt-4 h-1 rounded-[2px] transition-all duration-200 ${
                          isRevealed ? 'w-14 bg-[var(--accent)]' : 'w-8 bg-[var(--border)]'
                        }`}
                      />
                    </div>

                    {/* Interactive Reveal Area */}
                    <div className="mt-4">
                      <AnimatePresence initial={false}>
                        {isRevealed ? (
                          <motion.div
                            key="revealed"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 4 }}
                            transition={{
                              duration: prefersReducedMotion ? 0 : 0.2,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="space-y-3"
                          >
                            <p className="type-small text-[var(--text-muted)] font-medium">
                              {stage.revealedCopy}
                            </p>
                            <div className="inline-flex flex-wrap items-center gap-2 rounded-control border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 type-caption text-[var(--text)] tabular-nums">
                              <span>{stage.previewLine}</span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={prefersReducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                            className="pt-2 type-caption text-[var(--text-muted)]"
                          >
                            Tap or hover to explore
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Interactive Trust Lens Demonstration */}
        <section
          aria-label="Interactive Trust Lens demonstration"
          className="surface-card rounded-card p-4 sm:p-8"
        >
          <div className="flex flex-col justify-between gap-4 pb-6 border-b border-[var(--border)] md:flex-row md:items-end">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2 type-caption text-[var(--text-muted)]">
                <ShieldCheck className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
                <span>Interactive Product Demo</span>
                <span aria-hidden="true">·</span>
                <span>Fictional example reviews</span>
              </div>
              <h2 className="mt-2 type-h2 sm:type-h1 text-[var(--text)]">
                Experience Trust Lens
              </h2>
              <p className="mt-2 type-small text-[var(--text-muted)]">
                Switch modes to see how informational quality is surfaced without silencing valid criticism.
              </p>
            </div>

            {/* Clean Segmented Toggle: All Reviews | Most Informative */}
            <div
              role="group"
              aria-label="Trust Lens demonstration mode"
              className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto self-start rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-1 gap-1 md:self-auto"
            >
              <button
                type="button"
                aria-pressed={demoMode === 'all'}
                onClick={() => handleModeChange('all')}
                className={`min-h-[44px] rounded-[4px] border px-3 sm:px-4 py-2 type-caption font-semibold transition-colors whitespace-nowrap ${
                  demoMode === 'all'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                }`}
              >
                All Reviews
              </button>
              <button
                type="button"
                aria-pressed={demoMode === 'informative'}
                onClick={() => handleModeChange('informative')}
                className={`min-h-[44px] rounded-[4px] border px-3 sm:px-4 py-2 type-caption font-semibold transition-colors whitespace-nowrap ${
                  demoMode === 'informative'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                }`}
              >
                Most Informative
              </button>
            </div>
          </div>

          {/* Live Reordering Miniature Review Interface */}
          <div className="mt-6 space-y-3" data-testid="trust-lens-demo-list">
            {orderedDemoReviews.map((item, index) => {
              const isExpanded = expandedReasonId === item.id;
              const isMutedInInformative = demoMode === 'informative' && !item.isInformative;

              return (
                <motion.article
                  key={item.id}
                  layout={!prefersReducedMotion}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.36,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`rounded-control border p-4 sm:p-6 transition-colors ${
                    isMutedInInformative
                      ? 'border-[var(--border)] bg-[var(--surface-2)]'
                      : demoMode === 'informative' && item.isInformative
                      ? 'border-[var(--accent-strong)] bg-[var(--surface)] shadow-surface'
                      : 'border-[var(--border)] bg-[var(--surface)] shadow-surface'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 type-caption text-[var(--text-muted)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text)] tabular-nums">
                        #{index + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[var(--text)] tabular-nums">{item.courseCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.term}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.workload}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[var(--text)]">
                        {item.recommended ? 'Recommended' : 'Not recommended'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`type-caption font-semibold ${
                          item.isInformative ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {item.specificityLabel}
                      </span>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedReasonId(isExpanded ? null : item.id)}
                        className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-nested px-3 py-2 type-caption font-semibold whitespace-nowrap"
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                        <span>{item.isInformative ? 'Why prioritized?' : 'Why ranked lower?'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quote with Dynamic Highlighting */}
                  <p className="mt-3 type-small text-[var(--text)]">
                    “
                    {item.segments.map((seg, segIdx) => {
                      if (demoMode === 'informative' && seg.highlight === 'detail') {
                        return (
                          <mark
                            key={segIdx}
                            className="rounded-[4px] bg-[var(--accent)] px-1 py-1 font-medium text-[var(--on-accent)]"
                          >
                            {seg.text}
                          </mark>
                        );
                      }
                      if (demoMode === 'informative' && seg.highlight === 'advice') {
                        return (
                          <mark
                            key={segIdx}
                            className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] px-1 py-1 font-medium text-[var(--text)]"
                          >
                            {seg.text}
                          </mark>
                        );
                      }
                      return <React.Fragment key={segIdx}>{seg.text}</React.Fragment>;
                    })}
                    ”
                  </p>

                  {demoMode === 'informative' && item.isInformative && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-[2px] bg-[var(--accent)] border border-[var(--border)]" aria-hidden="true" />
                        <span>Course-specific detail</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-[2px] bg-[var(--surface-2)] border border-[var(--border)]" aria-hidden="true" />
                        <span>Actionable advice</span>
                      </span>
                    </div>
                  )}

                  {/* Expandable Signal Explanation */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] p-4 type-caption text-[var(--text-muted)]">
                          <div className="font-semibold text-[var(--text)]">{item.reasonHeadline}</div>
                          <ul className="mt-2 space-y-1 list-disc pl-4 text-[var(--text-muted)]">
                            {item.signals.map((sig) => (
                              <li key={sig}>{sig}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </div>

          {/* Expandable Deeper Methodology + Primary CTAs */}
          <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
              <button
                type="button"
                aria-expanded={methodologyOpen}
                onClick={() => setMethodologyOpen((prev) => !prev)}
                className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-control px-2 type-caption font-semibold text-[var(--text)] underline-offset-4 hover:underline"
              >
                <span>How Trust Lens evaluates feedback</span>
                {methodologyOpen ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onGoExplore}
                  className="btn-secondary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control px-4 py-2 type-caption font-semibold text-center sm:whitespace-nowrap tabular-nums"
                >
                  <span>Browse {waterlooCourseCount.toLocaleString()}+ Waterloo Courses</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCourse('math-137', 'reviews')}
                  className="btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control px-4 py-2 type-caption font-semibold text-center sm:whitespace-nowrap"
                >
                  <span>Inspect live Trust Lens on MATH 137</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {methodologyOpen && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-control border border-[var(--border)] bg-[var(--surface-2)] p-4 type-caption text-[var(--text-muted)] space-y-2">
                    <p>
                      <strong className="text-[var(--text)]">Informational signals, not censorship:</strong>{' '}
                      Trust Lens scores each submission on course-specific detail (assessments, workload hours, concrete study strategies),
                      duplicate similarity, and community helpfulness votes. Low-context reviews remain viewable under{' '}
                      <strong className="text-[var(--text)]">All Reviews</strong>.
                    </p>
                    <p>
                      <strong className="text-[var(--text)]">Honest limitations:</strong>{' '}
                      Automated scoring and AI synthesis surface recurring patterns in submitted experiences. They cannot guarantee objective truth or eliminate individual bias, and sample sizes are always shown.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 4. Progressive Disclosure: Transparency & Community Moderation Queue (Demo) */}
        <section className="surface-warm rounded-card p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="type-body font-semibold text-[var(--text)]">
                Transparency &amp; Community Moderation (Demo)
              </h2>
              <p className="mt-1 type-caption text-[var(--text-muted)]">
                Official 2026–2027 academic calendar records stay strictly separate from student feedback.
              </p>
            </div>

            <button
              type="button"
              aria-expanded={moderationOpen}
              onClick={() => setModerationOpen((v) => !v)}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-2 self-start rounded-control px-4 py-2 type-caption font-semibold shadow-surface sm:self-auto whitespace-nowrap tabular-nums"
            >
              <span>Moderation Queue ({moderationReports.length})</span>
              {moderationOpen ? (
                <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {moderationOpen && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  {moderationReports.length === 0 ? (
                    <p className="type-small text-[var(--text-muted)] py-2">No moderation reports currently queued.</p>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {moderationReports.map((report) => {
                        const targetReview = reviews.find((r) => r.id === report.reviewId);
                        const targetCourse = courses.find((c) => c.id === report.courseId);
                        return (
                          <div
                            key={report.id}
                            className="py-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 type-caption text-[var(--text-muted)]">
                                <span className="font-semibold text-[var(--text)] tabular-nums">
                                  {targetCourse?.code ?? report.courseId.toUpperCase()}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-[var(--text)] capitalize">
                                  Reason: {report.reason.replace('_', ' ')}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="type-caption text-[var(--text-muted)]">
                                  Status: {report.status}
                                </span>
                              </div>
                              <p className="type-small text-[var(--text)] line-clamp-2">
                                “{targetReview?.overallExperience ?? 'Review excerpt unavailable'}”
                              </p>
                              <p className="type-caption text-[var(--text-muted)]">Reporter note: {report.details}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onResolveModeration(report.id, 'keep')}
                                className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 type-caption font-semibold whitespace-nowrap"
                              >
                                <CheckCircle2 className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
                                <span>Keep Visible</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onResolveModeration(report.id, 'remove')}
                                className="btn-secondary inline-flex min-h-[44px] items-center gap-1 rounded-control px-3 py-2 type-caption font-semibold whitespace-nowrap"
                              >
                                <Trash2 className="h-4 w-4 text-[var(--text)]" aria-hidden="true" />
                                <span>Hide Review</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
};

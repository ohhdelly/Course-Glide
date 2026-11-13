import React, { useMemo, useRef, useState } from 'react';
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
  useScroll,
  useTransform,
} from 'motion/react';
import type { Course, ModerationReport, Review } from '../types/course';
import { useUniversityTheme } from '../theme/ThemeContext';

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
  accentGradient: string;
  iconBg: string;
  borderActive: string;
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
      'Still accessible in All Reviews—never deleted for being negative',
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
      { text: ' faster than lecture examples, and assignments spiked in week 5—' },
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
  const { palette } = useUniversityTheme();
  const prefersReducedMotion = useReducedMotion();
  const journeyRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ['start 82%', 'end 48%'],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0.15, 1]);

  // Interactive storytelling state: hover, keyboard focus, or tap/click pin
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [focusedStage, setFocusedStage] = useState<string | null>(null);
  const [pinnedStage, setPinnedStage] = useState<string | null>('discover');

  // Interactive Trust Lens Demo state
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
        accentGradient: 'from-[var(--surface-accent)] via-[var(--surface-subtle)] to-[var(--surface)]',
        iconBg: 'bg-[var(--surface-accent)] text-[var(--accent-text)] border-[var(--accent-subtle-border)]',
        borderActive: 'border-[var(--accent-subtle-border)] shadow-[0_12px_32px_-12px_var(--accent-soft)]',
        icon: Compass,
      },
      {
        id: 'understand',
        num: '02',
        stage: 'Understand',
        heading: 'Understand before you enroll.',
        revealedCopy: 'Compare workload, trustworthy reviews, and teaching insights.',
        previewLine: 'Difficulty · Weekly hours · Professor & TA notes',
        accentGradient: 'from-[var(--surface-subtle)] to-[var(--surface)]',
        iconBg: 'bg-[var(--surface-muted)] text-[var(--text-primary)] border-[var(--border)]',
        borderActive: 'border-[var(--border-strong)] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.12)]',
        icon: BarChart3,
      },
      {
        id: 'prepare',
        num: '03',
        stage: 'Prepare',
        heading: 'Discover what works.',
        revealedCopy: 'Explore study strategies shared by previous students.',
        previewLine: 'Practice sets · Tutorials · Past exam prep',
        accentGradient: 'from-[var(--status-positive-bg)] to-[var(--surface)]',
        iconBg: 'bg-[var(--status-positive-bg)] text-[var(--status-positive)] border-[var(--status-positive-border)]',
        borderActive: 'border-[var(--status-positive-border)] shadow-[0_12px_32px_-12px_rgba(15,118,110,0.16)]',
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
    <main className="pb-20">
      {/* 1. Minimal Executive Hero + Academic Glide Curve */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-hero-start)] via-[var(--surface-hero-mid)] to-[var(--background)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 220"
          fill="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full opacity-50"
          preserveAspectRatio="none"
        >
          <path
            d="M-40 180 C 260 180, 380 70, 620 100 C 860 130, 980 32, 1240 52"
            stroke="url(#glide-stroke)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="glide-stroke" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.chartPrimary} stopOpacity="0.12" />
              <stop offset="50%" stopColor={palette.chartPrimary} stopOpacity="0.42" />
              <stop offset="100%" stopColor={palette.chartSecondary} stopOpacity="0.28" />
            </linearGradient>
          </defs>
        </svg>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-4xl px-4 pt-16 pb-14 sm:px-6 lg:px-8 lg:pt-20 lg:pb-16 text-center"
        >
          <p className="text-xs font-semibold tracking-wider uppercase text-[var(--accent-text)]">
            How CourseGlide Works
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3.35rem] text-balance leading-[1.08]">
            Less noise. More clarity.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Discover smarter course insights, trustworthy feedback, and strategies for success.
          </p>
        </motion.div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-14 pt-12">
        {/* 2. Interactive Apple-Inspired Three-Stage Journey: Discover -> Understand -> Prepare */}
        <section
          ref={journeyRef}
          aria-label="Discover, Understand, Prepare interactive journey"
          className="relative"
        >
          {/* Progression Header & Scroll-Driven Line */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--text-muted)]">
              <span className="text-[var(--accent-text)]">Discover</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[var(--text-primary)]">Understand</span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="text-[var(--status-positive)]">Prepare</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Hover, focus, or tap any stage to explore
            </p>
          </div>

          {/* Scroll-driven horizontal progress line connecting the 3 stages on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none hidden lg:block relative h-0.5 mb-5 mx-12 overflow-hidden rounded-full bg-[var(--surface-muted)]"
          >
            <motion.div
              className="h-full origin-left rounded-full"
              style={{
                ...(prefersReducedMotion ? { scaleX: 1 } : { scaleX: lineScaleX }),
                background: `linear-gradient(90deg, ${palette.chartPrimary}, ${palette.chartSecondary})`,
              }}
            />
          </div>

          {/* Interactive Stage Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isRevealed =
                hoveredStage === stage.id ||
                focusedStage === stage.id ||
                pinnedStage === stage.id;

              return (
                <motion.div
                  key={stage.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.42,
                    delay: prefersReducedMotion ? 0 : idx * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onMouseEnter={() => setHoveredStage(stage.id)}
                  onMouseLeave={() => setHoveredStage((prev) => (prev === stage.id ? null : prev))}
                  className="relative h-full"
                >
                  <button
                    type="button"
                    aria-expanded={isRevealed}
                    onFocus={() => setFocusedStage(stage.id)}
                    onBlur={() => setFocusedStage((prev) => (prev === stage.id ? null : prev))}
                    onClick={() => toggleStagePin(stage.id)}
                    className={`group relative flex h-full w-full flex-col justify-between rounded-3xl border p-7 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] min-h-[268px] bg-gradient-to-b ${stage.accentGradient} ${
                      isRevealed
                        ? stage.borderActive
                        : 'border-[var(--border)] shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div>
                      {/* Stage Number + Minimal Icon + Interactive Indicator */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <motion.span
                            animate={
                              prefersReducedMotion
                                ? undefined
                                : { scale: isRevealed ? 1.05 : 1 }
                            }
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${stage.iconBg}`}
                          >
                            <Icon className="h-5 w-5" aria-hidden={true} />
                          </motion.span>
                          <span className="font-mono text-xs font-semibold tracking-tight text-[var(--text-muted)]">
                            {stage.num} · {stage.stage}
                          </span>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-7 items-center justify-center rounded-full border text-[var(--text-muted)] transition-transform duration-300 ${
                            isRevealed
                              ? 'rotate-45 border-[var(--accent-subtle-border)] bg-[var(--surface)] text-[var(--accent-text)]'
                              : 'border-[var(--border)] bg-[var(--surface)]/80 group-hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      {/* Large Clean Heading (Always Visible) */}
                      <h2 className="mt-7 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] text-balance leading-snug">
                        {stage.heading}
                      </h2>

                      {/* Subtle Accent Rule */}
                      <div
                        aria-hidden="true"
                        className={`mt-4 h-0.5 rounded-full transition-all duration-300 ${
                          isRevealed
                            ? stage.id === 'prepare'
                              ? 'w-14 bg-[var(--status-positive)]'
                              : 'w-14 bg-[var(--accent-hover)]'
                            : 'w-7 bg-[var(--border-strong)]'
                        }`}
                      />
                    </div>

                    {/* Interactive Reveal Area (Smooth opacity + translateY without blocking wait) */}
                    <div className="mt-5">
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
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium">
                              {stage.revealedCopy}
                            </p>
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--text-secondary)]">
                              <span>{stage.previewLine}</span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={prefersReducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                            className="pt-2 text-xs font-medium text-[var(--text-muted)]"
                          >
                            Hover, focus, or tap to reveal
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. Interactive Trust Lens Demonstration */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Interactive Trust Lens demonstration"
          className="rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface-hero-start)] via-[var(--surface-hero-mid)] to-[var(--surface)] p-6 sm:p-8 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.09)]"
        >
          <div className="flex flex-col justify-between gap-5 pb-6 border-b border-[var(--border)] md:flex-row md:items-end">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                <ShieldCheck className="h-4 w-4 text-[var(--status-positive)]" aria-hidden="true" />
                <span>Interactive Product Demo</span>
                <span aria-hidden="true">·</span>
                <span>Fictional example reviews</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Experience Trust Lens
              </h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Switch modes to see how informational quality is surfaced without silencing valid criticism.
              </p>
            </div>

            {/* Clean Segmented Toggle: All Reviews | Most Informative */}
            <div
              role="group"
              aria-label="Trust Lens demonstration mode"
              className="inline-flex self-start rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1 md:self-auto"
            >
              <button
                type="button"
                aria-pressed={demoMode === 'all'}
                onClick={() => handleModeChange('all')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  demoMode === 'all'
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Reviews
              </button>
              <button
                type="button"
                aria-pressed={demoMode === 'informative'}
                onClick={() => handleModeChange('informative')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  demoMode === 'informative'
                    ? 'btn-primary shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                  className={`rounded-2xl border p-5 transition-colors ${
                    isMutedInInformative
                      ? 'border-[var(--border)] bg-[var(--surface-subtle)] opacity-75'
                      : demoMode === 'informative' && item.isInformative
                      ? 'border-[var(--accent-subtle-border)] bg-[var(--surface)] shadow-[0_6px_20px_-8px_var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_3px_rgba(15,23,42,0.03)]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--text-secondary)] tabular-nums">
                        #{index + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-semibold text-[var(--accent-code)]">{item.courseCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.term}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.workload}</span>
                      <span aria-hidden="true">·</span>
                      <span className={item.recommended ? 'font-medium text-[var(--status-positive)]' : 'font-medium text-[var(--text-secondary)]'}>
                        {item.recommended ? 'Recommended' : 'Not recommended'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${
                          item.isInformative ? 'text-[var(--status-positive)]' : 'text-[var(--status-warning)]'
                        }`}
                      >
                        {item.specificityLabel}
                      </span>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedReasonId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--accent-text)] transition-colors hover:bg-[var(--surface-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap"
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{item.isInformative ? 'Why prioritized?' : 'Why ranked lower?'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quote with Dynamic Highlighting */}
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)] sm:text-[15px]">
                    “
                    {item.segments.map((seg, segIdx) => {
                      if (demoMode === 'informative' && seg.highlight === 'detail') {
                        return (
                          <mark
                            key={segIdx}
                            className="rounded bg-[var(--highlight-bg)] px-1 py-0.5 font-medium text-[var(--highlight-text)]"
                          >
                            {seg.text}
                          </mark>
                        );
                      }
                      if (demoMode === 'informative' && seg.highlight === 'advice') {
                        return (
                          <mark
                            key={segIdx}
                            className="rounded bg-[var(--status-positive-bg)] px-1 py-0.5 font-medium text-[var(--status-positive)]"
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
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-[2px] bg-[var(--accent-hover)]" aria-hidden="true" />
                        <span>Course-specific detail</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-[2px] bg-[var(--status-positive)]" aria-hidden="true" />
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
                        <div className="mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5 text-xs text-[var(--text-secondary)]">
                          <div className="font-semibold text-[var(--text-primary)]">{item.reasonHeadline}</div>
                          <ul className="mt-1.5 space-y-1 list-disc pl-4 text-[var(--text-secondary)]">
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
          <div className="mt-6 pt-5 border-t border-[var(--border)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                aria-expanded={methodologyOpen}
                onClick={() => setMethodologyOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)] hover:text-[var(--accent-code)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
              >
                <span>How Trust Lens evaluates feedback</span>
                {methodologyOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onGoExplore}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-subtle)] whitespace-nowrap"
                >
                  <span>Browse {waterlooCourseCount.toLocaleString()}+ Waterloo Courses</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCourse('math-137', 'reviews')}
                  className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs whitespace-nowrap"
                >
                  <span>Inspect live Trust Lens on MATH 137</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
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
                  <div className="rounded-2xl border border-[var(--accent-subtle-border)] bg-[var(--surface)]/90 p-4 text-xs leading-relaxed text-[var(--text-secondary)] space-y-2">
                    <p>
                      <strong className="text-[var(--text-primary)]">Informational signals, not censorship:</strong>{' '}
                      Trust Lens scores specificity (assessments, workload hours, concrete study strategies),
                      duplicate similarity, and community helpfulness votes. Low-context reviews remain viewable under{' '}
                      <strong>All Reviews</strong>.
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Honest limitations:</strong>{' '}
                      Automated scoring and AI synthesis surface recurring patterns in submitted experiences—they cannot guarantee objective truth or eliminate individual bias, and sample sizes are always shown.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* 4. Progressive Disclosure: Transparency & Community Moderation Queue (Demo) */}
        <section className="surface-warm rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Transparency &amp; Community Moderation (Demo)
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Official 2026–2027 academic calendar records stay strictly separate from student feedback.
              </p>
            </div>

            <button
              type="button"
              aria-expanded={moderationOpen}
              onClick={() => setModerationOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--surface-subtle)] sm:self-auto whitespace-nowrap"
            >
              <span>Moderation Queue ({moderationReports.length})</span>
              {moderationOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
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
                    <p className="text-sm text-[var(--text-muted)] py-2">No moderation reports currently queued.</p>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {moderationReports.map((report) => {
                        const targetReview = reviews.find((r) => r.id === report.reviewId);
                        const targetCourse = courses.find((c) => c.id === report.courseId);
                        return (
                          <div
                            key={report.id}
                            className="py-3.5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                <span className="font-mono font-semibold text-[var(--accent-code)]">
                                  {targetCourse?.code ?? report.courseId.toUpperCase()}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-[var(--text-primary)] capitalize">
                                  Reason: {report.reason.replace('_', ' ')}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                                  Status: {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                                “{targetReview?.overallExperience ?? 'Review excerpt unavailable'}”
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">Reporter note: {report.details}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => onResolveModeration(report.id, 'keep')}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] whitespace-nowrap"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-positive)]" />
                                <span>Keep Visible</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onResolveModeration(report.id, 'remove')}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 whitespace-nowrap"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

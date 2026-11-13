import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  MessageSquarePlus,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Course, CourseInsightReport, CourseStats } from '../../types/course';
import { useUniversityTheme } from '../../theme/ThemeContext';
import { CourseInsightsPanel } from './CourseInsightsPanel';

interface CourseOverviewTabProps {
  course: Course;
  stats: CourseStats;
  insights: CourseInsightReport | null;
  insightsLoading: boolean;
  onRefreshInsights: () => void;
  onJumpToEvidence: (reviewId: string) => void;
  onOpenWriteReview: () => void;
}

export const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({
  course,
  stats,
  insights,
  insightsLoading,
  onRefreshInsights,
  onJumpToEvidence,
  onOpenWriteReview,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { palette } = useUniversityTheme();
  const [showMoreBreakdowns, setShowMoreBreakdowns] = useState(false);
  const hasReviews = stats.responseCount > 0;

  const assessmentColors = [
    palette.chartPrimary,
    palette.chartSecondary,
    palette.positive,
    palette.chartTertiary,
  ];

  return (
    <div className="space-y-6">
      {!hasReviews ? (
        <section className="surface-card rounded-2xl p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-accent)] text-[var(--accent-text)]">
            <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[var(--text-primary)]">
            No student reviews yet.
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-[var(--text-secondary)] leading-relaxed">
            CourseGlide never fabricates difficulty ratings, weekly hours, or AI review summaries for
            courses without student submissions. Have you taken {course.code}?
          </p>
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs active:scale-[0.98]"
          >
            <span>Be the first to review</span>
          </button>
        </section>
      ) : (
        <>
          {/* Essential Charts Grid (Difficulty & Weekly Hours) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 1. Difficulty Distribution */}
            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Difficulty Distribution
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">1 = Very manageable · 5 = Highly demanding</p>
                </div>
                <span className="font-mono text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                  n = {stats.responseCount}
                </span>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.difficultyDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: palette.chartCursor }}
                      contentStyle={{
                        backgroundColor: palette.surface,
                        borderRadius: '12px',
                        border: `1px solid ${palette.chartGrid}`,
                        boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                        fontSize: '12px',
                        color: palette.textPrimary,
                      }}
                      formatter={(value: unknown, _name: unknown, props: any) => [
                        `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                        'Count',
                      ]}
                    />
                    <Bar dataKey="count" fill={palette.chartPrimary} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 2. Weekly Study Hours Distribution */}
            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Weekly Study Hours Reported
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">Outside-of-class + tutorial &amp; assignment effort</p>
                </div>
                <span className="font-mono text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                  Avg {stats.avgWeeklyHours.toFixed(1)} hrs · n = {stats.responseCount}
                </span>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hoursDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: palette.chartCursor }}
                      contentStyle={{
                        backgroundColor: palette.surface,
                        borderRadius: '12px',
                        border: `1px solid ${palette.chartGrid}`,
                        boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                        fontSize: '12px',
                        color: palette.textPrimary,
                      }}
                      formatter={(value: unknown, _name: unknown, props: any) => [
                        `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                        'Count',
                      ]}
                    />
                    <Bar dataKey="count" fill={palette.chartSecondary} radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* CourseGlide Insights (Concise AI / Structured Review Summary) */}
          <CourseInsightsPanel
            courseCode={course.code}
            insights={insights}
            loading={insightsLoading}
            onRefresh={onRefreshInsights}
            onJumpToEvidence={onJumpToEvidence}
          />
        </>
      )}

      {/* Compact Official Academic Catalogue Record */}
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-accent)] text-[var(--accent-text)]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                Official Academic Catalogue Record
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {course.calendarVersion ?? 'Official course reference metadata'}
              </p>
            </div>
          </div>

          {course.sourceUrl && (
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-text)] transition-colors hover:bg-[var(--surface-accent)]"
            >
              <span>Official Calendar</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <div className="p-3.5">
            <dt className="font-semibold text-[var(--text-muted)]">Prerequisites</dt>
            <dd className="mt-1 text-[var(--text-primary)] leading-relaxed">
              {course.prerequisites || 'None listed'}
            </dd>
          </div>
          <div className="p-3.5">
            <dt className="font-semibold text-[var(--text-muted)]">Corequisites</dt>
            <dd className="mt-1 text-[var(--text-primary)] leading-relaxed">
              {course.corequisites || 'None listed'}
            </dd>
          </div>
          <div className="p-3.5">
            <dt className="font-semibold text-[var(--text-muted)]">Antirequisites</dt>
            <dd className="mt-1 text-[var(--text-primary)] leading-relaxed">
              {course.antirequisites || 'None listed'}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[var(--accent-text)] shrink-0" aria-hidden="true" />
            <span>{course.termScheduleNote ?? course.officialNote}</span>
          </span>
          {course.lastUpdated && (
            <span className="font-mono text-xs">Updated {course.lastUpdated}</span>
          )}
        </div>
      </section>

      {hasReviews && (
        <>

      {/* Progressive Disclosure for Secondary Breakdowns */}
      <div className="surface-tinted rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Additional Course Breakdowns
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Perceived usefulness, multi-term workload trends, and syllabus assessment weights.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={showMoreBreakdowns}
            onClick={() => setShowMoreBreakdowns((prev) => !prev)}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--surface-accent)] sm:self-auto whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <span>{showMoreBreakdowns ? 'Hide additional breakdowns' : 'Show usefulness, term trends & syllabus'}</span>
            {showMoreBreakdowns ? (
              <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            )}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showMoreBreakdowns && (
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* 3. Perceived Course Usefulness */}
                  <section className="surface-card rounded-2xl p-5 sm:p-6">
                    <div className="flex items-baseline justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                          Perceived Course Usefulness
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">How valuable students found the course content</p>
                      </div>
                      <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                        Avg {stats.avgUsefulness.toFixed(1)} / 5 · n = {stats.responseCount}
                      </span>
                    </div>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.usefulnessDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: palette.chartCursor }}
                            contentStyle={{
                              backgroundColor: palette.surface,
                              borderRadius: '12px',
                              border: `1px solid ${palette.chartGrid}`,
                              boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                              fontSize: '12px',
                              color: palette.textPrimary,
                            }}
                            formatter={(value: unknown, _name: unknown, props: any) => [
                              `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                              'Count',
                            ]}
                          />
                          <Bar dataKey="count" fill={palette.chartTertiary} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* 4. Trends by Academic Term */}
                  <section className="surface-card rounded-2xl p-5 sm:p-6">
                    <div className="flex items-baseline justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                          Trends by Academic Term
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">Average weekly hours &amp; difficulty across terms</p>
                      </div>
                      <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                        {stats.termTrends.length} terms
                      </span>
                    </div>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.termTrends} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                          <XAxis dataKey="term" tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: palette.surface,
                              borderRadius: '12px',
                              border: `1px solid ${palette.chartGrid}`,
                              boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                              fontSize: '12px',
                              color: palette.textPrimary,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="avgWeeklyHours"
                            name="Avg Weekly Hours"
                            stroke={palette.chartPrimary}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: palette.chartPrimary }}
                            isAnimationActive={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="avgDifficulty"
                            name="Avg Difficulty (/5)"
                            stroke={palette.chartSecondary}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: palette.chartSecondary }}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                {/* Assessment Breakdown (when supported by syllabus metadata) */}
                {course.assessmentBreakdown && course.assessmentBreakdown.length > 0 && (
                  <section className="surface-card rounded-2xl p-5 sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                          Typical Assessment Workload Breakdown
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                          Demonstration syllabus weighting summary (exact weights vary by term and section)
                        </p>
                      </div>
                    </div>

                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                      {course.assessmentBreakdown.map((item, idx) => (
                        <div
                          key={item.name}
                          style={{
                            width: `${item.weightPercent}%`,
                            backgroundColor: assessmentColors[idx % assessmentColors.length],
                          }}
                          title={`${item.name}: ${item.weightPercent}%`}
                        />
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {course.assessmentBreakdown.map((item, idx) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-sm"
                        >
                          <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <span
                              className="h-2.5 w-2.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor: assessmentColors[idx % assessmentColors.length],
                              }}
                            />
                            <span>{item.name}</span>
                          </span>
                          <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                            {item.weightPercent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  );
};

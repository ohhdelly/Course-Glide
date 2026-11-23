import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Course, CourseInsightReport, CourseStats, Review } from '../../types/course';
import { useUniversityTheme } from '../../theme/ThemeContext';
import { buildOverviewTakeaway } from '../../utils/courseTakeaway';
import { CollapsibleText } from './CollapsibleText';
import { CourseInsightsPanel } from './CourseInsightsPanel';
import {
  EffortToSuccessCard,
  LoadProfileCard,
  PeakWeekPanel,
  RatingRangeCard,
} from './CourseLoadPanels';
import { MidTermPulseCard } from './MidTermPulseCard';
import { WorkloadBreakdown } from '../charts/WorkloadBreakdown';

interface CourseOverviewTabProps {
  course: Course;
  stats: CourseStats;
  reviews: Review[];
  insights: CourseInsightReport | null;
  insightsLoading: boolean;
  onRefreshInsights: () => void;
  onJumpToEvidence: (reviewId: string) => void;
  onOpenWriteReview: () => void;
}

export const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({
  course,
  stats,
  reviews,
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
  const takeaway = buildOverviewTakeaway(course, stats);

  const assessmentColors = [
    palette.chartPrimary,
    palette.chartSecondary,
    palette.textMuted,
    palette.border,
  ];

  return (
    <div className="space-y-6">
      {!hasReviews ? (
        <section className="surface-card rounded-card p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text)]">
              No student reviews yet for {course.code}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{takeaway}</p>
          </div>
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="btn-primary inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-control px-5 py-2 text-sm font-semibold shadow-surface whitespace-nowrap"
          >
            <span>Be the first to review</span>
          </button>
        </section>
      ) : (
        <>
          {/* One-Sentence Takeaway */}
          <section className="surface-card rounded-card p-4 sm:p-5">
            <p className="text-base font-medium text-[var(--text)]">{takeaway}</p>
          </section>

          {/* Honest headline numbers: a range, not a point; three load axes, not one */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <RatingRangeCard stats={stats} />
            <LoadProfileCard stats={stats} />
          </div>

          {/* Real workload breakdown (or plain-text weekly hours when no split exists) */}
          <WorkloadBreakdown course={course} stats={stats} />

          {/* Effort-to-success bands by target grade (never a grade distribution) */}
          <EffortToSuccessCard stats={stats} reviews={reviews} />

          {/* Where the crunch lands during the term */}
          <PeakWeekPanel course={course} reviews={reviews} />

          {/* Core Graphs Immediately Below Takeaway */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* 1. Difficulty Distribution */}
          <section className="surface-card rounded-card p-4 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  Difficulty Distribution
                </h2>
                <p className="text-xs text-[var(--text-muted)]">1 = Manageable · 5 = Demanding</p>
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums shrink-0">
                n = {stats.responseCount}
              </span>
            </div>
            <div className="h-[205px] sm:h-[225px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.difficultyDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} interval={0} axisLine={false} tickLine={false} />
                  <YAxis width={30} allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: palette.chartCursor }}
                    wrapperStyle={{ maxWidth: 'calc(100vw - 40px)', zIndex: 30 }}
                    contentStyle={{
                      backgroundColor: palette.surface,
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${palette.border}`,
                      boxShadow: 'var(--shadow-dialog)',
                      fontSize: '12px',
                      color: palette.text,
                    }}
                    formatter={(value: unknown, _name: unknown, props: any) => [
                      `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                      'Count',
                    ]}
                  />
                  <Bar dataKey="count" fill={palette.chartPrimary} radius={[8, 8, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 2. Weekly Study Hours Distribution */}
          <section className="surface-card rounded-card p-4 sm:p-6 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  Weekly Study Hours Reported
                </h2>
                <p className="text-xs text-[var(--text-muted)]">Outside-of-class study &amp; assignments</p>
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)] tabular-nums shrink-0">
                Avg {stats.avgWeeklyHours.toFixed(1)} hrs · n = {stats.responseCount}
              </span>
            </div>
            <div className="h-[205px] sm:h-[225px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hoursDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} interval={0} axisLine={false} tickLine={false} />
                  <YAxis width={30} allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: palette.chartCursor }}
                    wrapperStyle={{ maxWidth: 'calc(100vw - 40px)', zIndex: 30 }}
                    contentStyle={{
                      backgroundColor: palette.surface,
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${palette.border}`,
                      boxShadow: 'var(--shadow-dialog)',
                      fontSize: '12px',
                      color: palette.text,
                    }}
                    formatter={(value: unknown, _name: unknown, props: any) => [
                      `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                      'Count',
                    ]}
                  />
                  <Bar dataKey="count" fill={palette.chartSecondary} radius={[8, 8, 0, 0]} maxBarSize={48} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          </div>

          {/* Mid-term pulse (weeks 4-8, sealed until the term ends) */}
          <MidTermPulseCard courseId={course.id} courseCode={course.code} />
        </>
      )}

      {/* Detail Below: Structured Insights */}
      {hasReviews && (
        <CourseInsightsPanel
          courseCode={course.code}
          insights={insights}
          loading={insightsLoading}
          onRefresh={onRefreshInsights}
          onJumpToEvidence={onJumpToEvidence}
        />
      )}

      {/* Official Academic Catalogue Record */}
      <section className="surface-card rounded-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text)]">
              Official Academic Catalogue Record
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {course.calendarVersion ?? 'Official course reference metadata'}
            </p>
          </div>

          {course.sourceUrl && (
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold"
            >
              <span>Official Calendar</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 divide-y divide-[var(--border)] rounded-control border border-[var(--border)] bg-[var(--surface-2)] text-xs sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <div className="p-4">
            <dt className="font-semibold text-[var(--text-muted)]">Prerequisites</dt>
            <dd className="mt-1">
              <CollapsibleText
                text={course.prerequisites || 'None listed'}
                className="text-sm text-[var(--text)]"
              />
            </dd>
          </div>
          <div className="p-4">
            <dt className="font-semibold text-[var(--text-muted)]">Corequisites</dt>
            <dd className="mt-1">
              <CollapsibleText
                text={course.corequisites || 'None listed'}
                className="text-sm text-[var(--text)]"
              />
            </dd>
          </div>
          <div className="p-4">
            <dt className="font-semibold text-[var(--text-muted)]">Antirequisites</dt>
            <dd className="mt-1">
              <CollapsibleText
                text={course.antirequisites || 'None listed'}
                className="text-sm text-[var(--text)]"
              />
            </dd>
          </div>
        </dl>

        {(course.termScheduleNote || course.officialNote || course.lastUpdated) && (
          <div className="mt-3 flex flex-wrap items-start justify-between gap-2 text-xs text-[var(--text-muted)]">
            {(course.termScheduleNote || course.officialNote) && (
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Info className="mt-0.5 h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                <CollapsibleText
                  text={course.termScheduleNote ?? course.officialNote ?? ''}
                  className="text-xs text-[var(--text-muted)]"
                />
              </div>
            )}
            {course.lastUpdated && (
              <span className="text-xs tabular-nums shrink-0">Updated {course.lastUpdated}</span>
            )}
          </div>
        )}
      </section>

      {hasReviews && (
        /* Progressive Disclosure for Secondary Breakdowns */
        <div className="surface-tinted rounded-card p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Additional Course Breakdowns
              </h3>
            </div>
            <button
              type="button"
              aria-expanded={showMoreBreakdowns}
              onClick={() => setShowMoreBreakdowns((prev) => !prev)}
              className="btn-secondary inline-flex min-h-[44px] items-center justify-between sm:justify-center gap-2 self-stretch sm:self-auto rounded-control px-4 py-2 text-left text-xs font-semibold shadow-surface sm:whitespace-nowrap"
            >
              <span>{showMoreBreakdowns ? 'Hide additional breakdowns' : 'Show usefulness, trends & syllabus'}</span>
              {showMoreBreakdowns ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              )}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showMoreBreakdowns && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                    {/* 3. Perceived Course Usefulness */}
                    <section className="surface-card rounded-control p-4 sm:p-6 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text)]">
                            Perceived Course Usefulness
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">How valuable students found the material</p>
                        </div>
                        <span className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs font-medium text-[var(--text-muted)] tabular-nums shrink-0">
                          Avg {stats.avgUsefulness.toFixed(1)} / 5 · n = {stats.responseCount}
                        </span>
                      </div>
                      <div className="h-[205px] sm:h-[225px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.usefulnessDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.chartAxis }} interval={0} axisLine={false} tickLine={false} />
                            <YAxis width={30} allowDecimals={false} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: palette.chartCursor }}
                              wrapperStyle={{ maxWidth: 'calc(100vw - 40px)', zIndex: 30 }}
                              contentStyle={{
                                backgroundColor: palette.surface,
                                borderRadius: 'var(--radius-control)',
                                border: `1px solid ${palette.border}`,
                                boxShadow: 'var(--shadow-dialog)',
                                fontSize: '12px',
                                color: palette.text,
                              }}
                              formatter={(value: unknown, _name: unknown, props: any) => [
                                `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                                'Count',
                              ]}
                            />
                            <Bar dataKey="count" fill={palette.chartPrimary} radius={[8, 8, 0, 0]} maxBarSize={44} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    {/* 4. Trends by Academic Term */}
                    <section className="surface-card rounded-control p-4 sm:p-6 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text)]">
                            Trends by Academic Term
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">Weekly hours &amp; difficulty across terms</p>
                        </div>
                        <span className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs font-medium text-[var(--text-muted)] tabular-nums shrink-0">
                          {stats.termTrends.length} terms
                        </span>
                      </div>
                      <div className="h-[225px] sm:h-[235px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.termTrends} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={palette.chartGrid} vertical={false} />
                            <XAxis dataKey="term" tick={{ fontSize: 12, fill: palette.chartAxis }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                            <YAxis width={30} tick={{ fontSize: 12, fill: palette.chartAxis }} axisLine={false} tickLine={false} />
                            <Tooltip
                              wrapperStyle={{ maxWidth: 'calc(100vw - 40px)', zIndex: 30 }}
                              contentStyle={{
                                backgroundColor: palette.surface,
                                borderRadius: 'var(--radius-control)',
                                border: `1px solid ${palette.border}`,
                                boxShadow: 'var(--shadow-dialog)',
                                fontSize: '12px',
                                color: palette.text,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
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
                              stroke={palette.textMuted}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: palette.textMuted }}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </div>

                  {/* Assessment Breakdown (when supported by syllabus metadata) */}
                  {course.assessmentBreakdown && course.assessmentBreakdown.length > 0 && (
                    <section className="surface-card rounded-control p-4 sm:p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text)]">
                            Typical Assessment Workload Breakdown
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            Typical assessment weights (varies by term)
                          </p>
                        </div>
                      </div>

                      <div className="flex h-3 w-full overflow-hidden rounded-[4px] bg-[var(--surface-2)]">
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
                            className="flex items-center justify-between rounded-[4px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm"
                          >
                            <span className="flex items-center gap-2 text-[var(--text-muted)]">
                              <span
                                className="h-3 w-3 rounded-[2px] shrink-0 border border-[var(--border)]"
                                style={{
                                  backgroundColor: assessmentColors[idx % assessmentColors.length],
                                }}
                              />
                              <span>{item.name}</span>
                            </span>
                            <span className="font-semibold text-[var(--text)] tabular-nums">
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
      )}
    </div>
  );
};


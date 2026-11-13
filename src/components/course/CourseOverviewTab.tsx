import React from 'react';
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
import { Info } from 'lucide-react';
import type { Course, CourseInsightReport, CourseStats } from '../../types/course';
import { CourseInsightsPanel } from './CourseInsightsPanel';

interface CourseOverviewTabProps {
  course: Course;
  stats: CourseStats;
  insights: CourseInsightReport | null;
  insightsLoading: boolean;
  onRefreshInsights: () => void;
  onJumpToEvidence: (reviewId: string) => void;
}

export const CourseOverviewTab: React.FC<CourseOverviewTabProps> = ({
  course,
  stats,
  insights,
  insightsLoading,
  onRefreshInsights,
  onJumpToEvidence,
}) => {
  return (
    <div className="space-y-6">
      {/* AI Course Insights */}
      <CourseInsightsPanel
        courseCode={course.code}
        insights={insights}
        loading={insightsLoading}
        onRefresh={onRefreshInsights}
        onJumpToEvidence={onJumpToEvidence}
      />

      {/* Self-reported vs Official data notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/65 bg-[#F4F8FD] px-4 py-3.5 text-xs text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <Info className="h-4 w-4 shrink-0 text-blue-700 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-semibold text-slate-800">Self-reported student metrics vs. official records:</span>{' '}
          Charts below reflect {stats.responseCount} self-reported demonstration responses. CourseGlide
          does not fabricate official grade distributions or pass rates. {course.officialNote}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Difficulty Distribution */}
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Difficulty Distribution
              </h3>
              <p className="text-xs text-slate-500">1 = Very manageable · 5 = Highly demanding</p>
            </div>
            <span className="rounded-md bg-[#F4F7FB] px-2 py-0.5 font-mono text-xs text-slate-600 tabular-nums">
              n = {stats.responseCount}
            </span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.difficultyDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown, _name: unknown, props: any) => [
                    `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" fill="#1D4ED8" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 2. Weekly Study Hours Distribution */}
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Weekly Study Hours Reported
              </h3>
              <p className="text-xs text-slate-500">Outside-of-class + tutorial & assignment effort</p>
            </div>
            <span className="rounded-md bg-[#F4F7FB] px-2 py-0.5 font-mono text-xs text-slate-600 tabular-nums">
              Avg {stats.avgWeeklyHours.toFixed(1)} hrs · n = {stats.responseCount}
            </span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hoursDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown, _name: unknown, props: any) => [
                    `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Perceived Course Usefulness */}
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Perceived Course Usefulness
              </h3>
              <p className="text-xs text-slate-500">How valuable students found the course content</p>
            </div>
            <span className="rounded-md bg-[#F4F7FB] px-2 py-0.5 font-mono text-xs text-slate-600 tabular-nums">
              Avg {stats.avgUsefulness.toFixed(1)} / 5 · n = {stats.responseCount}
            </span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.usefulnessDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown, _name: unknown, props: any) => [
                    `${value} responses (${props?.payload?.percentage ?? 0}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" fill="#334155" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. Trends by Academic Term */}
        <section className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Trends by Academic Term
              </h3>
              <p className="text-xs text-slate-500">Average weekly hours & difficulty across terms</p>
            </div>
            <span className="rounded-md bg-[#F4F7FB] px-2 py-0.5 font-mono text-xs text-slate-600 tabular-nums">
              {stats.termTrends.length} terms
            </span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.termTrends} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="term" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 20px -6px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgWeeklyHours"
                  name="Avg Weekly Hours"
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1D4ED8' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgDifficulty"
                  name="Avg Difficulty (/5)"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0D9488' }}
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
              <h3 className="font-display text-base font-semibold text-slate-900">
                Typical Assessment Workload Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Demonstration syllabus weighting summary (exact weights vary by term and section)
              </p>
            </div>
          </div>

          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#E8EEF6]">
            {course.assessmentBreakdown.map((item, idx) => {
              const colors = ['bg-blue-700', 'bg-teal-600', 'bg-slate-800', 'bg-amber-600'];
              return (
                <div
                  key={item.name}
                  style={{ width: `${item.weightPercent}%` }}
                  className={colors[idx % colors.length]}
                  title={`${item.name}: ${item.weightPercent}%`}
                />
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {course.assessmentBreakdown.map((item, idx) => {
              const colors = ['bg-blue-700', 'bg-teal-600', 'bg-slate-800', 'bg-amber-600'];
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#F7F9FC] px-3.5 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${colors[idx % colors.length]}`} />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {item.weightPercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GraduationCap,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { Course, ModerationReport, Review } from '../types/course';

interface HowItWorksPageProps {
  courses: Course[];
  reviews: Review[];
  moderationReports: ModerationReport[];
  onResolveModeration: (reportId: string, action: 'keep' | 'remove') => Promise<void>;
  onOpenCourse: (courseId: string, tab?: 'overview' | 'reviews' | 'teaching' | 'strategies') => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  courses,
  reviews,
  moderationReports,
  onResolveModeration,
  onOpenCourse,
}) => {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Intro Hero Band with Subtle Cool Gradient */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-[#E9F0FA] via-[#F4F7FD] to-white p-7 sm:p-10 shadow-[0_2px_14px_-6px_rgba(15,23,42,0.07)]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-blue-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            CourseGlide Methodology &amp; Transparency
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
            Better feedback. Smarter course decisions.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            CourseGlide was designed to fix the signal-to-noise problem in university course reviews.
            Instead of surfacing uncontextualized emotional reactions or hidden averages, every metric
            and summary is structured, explainable, and tied directly to underlying student evidence.
          </p>
        </div>
      </section>

      {/* Four Questions Framework */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          {
            num: '01',
            title: 'Is this course suitable for me?',
            body: 'Compare difficulty distributions, weekly study hours, and term-over-term trends alongside explicit sample-size confidence notes.',
          },
          {
            num: '02',
            title: 'What should I expect from the teaching team?',
            body: 'Review constructive professor and TA breakdowns across clarity, tutorial helpfulness, office hours, and faculty responses to aggregate feedback.',
          },
          {
            num: '03',
            title: 'Which student feedback is genuinely informative?',
            body: 'Use Trust Lens to elevate specific, actionable reviews with real assessment context—without suppressing valid negative experiences.',
          },
          {
            num: '04',
            title: 'How can I prepare and succeed?',
            body: 'Filter study strategies by your learning preferences and inspect exact respondent counts for methods past students found useful.',
          },
        ].map((item) => (
          <div key={item.num} className="surface-card-interactive rounded-2xl p-6">
            <span className="inline-flex items-center rounded-md bg-blue-50/90 px-2.5 py-0.5 font-mono text-xs font-semibold text-blue-800">
              {item.num}
            </span>
            <h2 className="mt-3 font-display text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      {/* Trust Lens Architecture */}
      <section className="rounded-2xl border border-slate-200/90 bg-[#F7FAFE] p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.05)] space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold text-slate-900">
            How Trust Lens Evaluates Feedback Fairness
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 text-sm text-slate-600 leading-relaxed">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1.5">
              <Eye className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>Observable Signals</span>
            </h3>
            <p>
              Evaluates concrete references to midterms, labs, tutorials, grading, weekly workload
              estimates, actionable advice, recency, and duplicate text overlap.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1.5">
              <Scale className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>Sentiment Neutrality</span>
            </h3>
            <p>
              Never assumes praise is honest or criticism is biased. Thorough negative reviews rank
              just as highly as thorough positive reviews.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1.5">
              <GraduationCap className="h-4 w-4 text-slate-700" aria-hidden="true" />
              <span>Data Integrity</span>
            </h3>
            <p>
              Self-reported student metrics are separated from official syllabus notes. CourseGlide
              never invents official grade distributions or pass rates.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Explore MATH 137 to compare Most Informative vs. All Reviews side by side.
          </span>
          <button
            type="button"
            onClick={() => onOpenCourse('math-137', 'reviews')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-xs transition-colors hover:bg-blue-700 hover:text-white hover:border-blue-700"
          >
            <span>Try Trust Lens on MATH 137</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Moderation Queue Demonstration */}
      <section className="surface-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Community Moderation Queue (Demo)
            </h2>
            <p className="text-xs text-slate-600">
              Submitted reports for spam, duplicates, personal info, or harassment appear here for
              administrator review. Valid criticism is preserved.
            </p>
          </div>
          <span className="rounded-lg bg-[#EFF3F8] px-2.5 py-1 font-mono text-xs font-medium text-slate-600 tabular-nums">
            {moderationReports.length} report{moderationReports.length === 1 ? '' : 's'}
          </span>
        </div>

        {moderationReports.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No moderation reports currently queued.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {moderationReports.map((report) => {
              const targetReview = reviews.find((r) => r.id === report.reviewId);
              const targetCourse = courses.find((c) => c.id === report.courseId);
              return (
                <div
                  key={report.id}
                  className="py-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono font-semibold text-blue-800">
                        {targetCourse?.code ?? report.courseId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        Reason: {report.reason.replace('_', ' ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                        Status: {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2">
                      “{targetReview?.overallExperience ?? 'Review excerpt unavailable'}”
                    </p>
                    <p className="text-xs text-slate-500">Reporter note: {report.details}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onResolveModeration(report.id, 'keep')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                      <span>Keep Visible</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolveModeration(report.id, 'remove')}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100"
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
      </section>
    </main>
  );
};

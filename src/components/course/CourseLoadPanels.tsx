import React, { useMemo, useState } from 'react';
import { Activity, CalendarRange, Gauge, Quote, Target } from 'lucide-react';
import type { Course, CourseStats, GradeBand, Review } from '../../types/course';
import { GRADE_BAND_LABELS, computePeakWeekMap } from '../../utils/trustLens';
import { useUniversityTheme } from '../../theme/ThemeContext';

const cardShell = 'surface-card rounded-2xl p-5 sm:p-6';
const muted = 'text-xs text-[var(--text-muted)]';

export const RatingRangeCard: React.FC<{ stats: CourseStats }> = ({ stats }) => {
  const { rating } = stats;
  const cappedSample = rating.sampleSize < 4;

  return (
    <section className={cardShell} aria-label="Student rating range">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">Student rating</h2>
          <p className={muted}>Perceived usefulness, shown as an honest range</p>
        </div>
        <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)] tabular-nums">
          n = {rating.sampleSize}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="font-mono text-3xl font-bold leading-none text-[var(--text-primary)] tabular-nums">
          {rating.low.toFixed(1)}–{rating.high.toFixed(1)}
        </span>
        <span className="text-sm font-normal text-[var(--text-muted)]">/ 5</span>
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
        Midpoint {rating.point.toFixed(1)} · {rating.sampleSize} response
        {rating.sampleSize === 1 ? '' : 's'} · band widens as answers disagree
      </p>

      <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        No single score is printed because {rating.sampleSize} response
        {rating.sampleSize === 1 ? '' : 's'} cannot support that much precision.
        {rating.anchoredToDepartment
          ? ` Small samples are pulled toward the ${rating.priorLabel} average, so three enthusiastic reviews cannot outrank a course with a long record.`
          : ' Small samples are pulled toward a neutral midpoint for the same reason.'}
      </p>

      {cappedSample && (
        <p className="mt-2 text-[11px] font-medium text-[var(--status-warning)]">
          Limited sample — treat this band as a hint, not a verdict.
        </p>
      )}
    </section>
  );
};

export const LoadProfileCard: React.FC<{ stats: CourseStats }> = ({ stats }) => {
  const { load } = stats;
  const axes = [
    { label: 'Time', value: load.avgWeeklyHours, max: 25, suffix: 'hrs/wk' },
    { label: 'Mental effort', value: load.avgMentalEffort, max: 5, suffix: '/ 5' },
    { label: 'Stress', value: load.avgStress, max: 5, suffix: '/ 5' },
  ];

  return (
    <section className={cardShell} aria-label="Course load index">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--text-primary)]">Load index</h2>
          <p className={muted}>Three axes, not one hours figure</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
          <Gauge className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
          {load.loadIndex}/100
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="font-display text-2xl font-bold leading-none text-[var(--text-primary)]">
          {load.label}
        </span>
      </div>

      <div className="mt-4 space-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
        {axes.map((axis) => (
          <div key={axis.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">{axis.label}</span>
              <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                {axis.value.toFixed(1)} {axis.suffix}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round((axis.value / axis.max) * 100))}%`,
                  backgroundColor:
                    axis.label === 'Time'
                      ? 'var(--chart-primary)'
                      : axis.label === 'Mental effort'
                      ? 'var(--chart-secondary)'
                      : 'var(--chart-tertiary)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        Mental effort is weighted above raw hours: students price a term by how draining the work
        feels, not only by how long it takes.
      </p>
    </section>
  );
};

export const EffortToSuccessCard: React.FC<{ stats: CourseStats; reviews: Review[] }> = ({
  stats,
  reviews,
}) => {
  const [selectedBand, setSelectedBand] = useState<GradeBand | null>(null);
  const bands = stats.effortToSuccess;
  const activeBand =
    selectedBand && bands.some((band) => band.band === selectedBand)
      ? selectedBand
      : bands[0]?.band ?? null;
  const active = bands.find((band) => band.band === activeBand) ?? null;

  const advice = useMemo(() => {
    if (!active) return [];
    return reviews
      .filter(
        (review) =>
          review.moderationStatus !== 'hidden' &&
          review.targetGrade === active.band &&
          review.practicalAdvice.trim().length > 20
      )
      .slice(0, 2);
  }, [reviews, active]);

  return (
    <section className={cardShell} aria-label="What it took to reach your target grade">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
            <Target className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            What it took to reach your target grade
          </h2>
          <p className={muted}>
            Study-hour bands from students who named a target grade. Not a grade predictor, and
            deliberately not a grade distribution.
          </p>
        </div>
      </div>

      {bands.length === 0 ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs text-[var(--text-secondary)]">
          No student has shared a target grade for this course yet. The card stays empty rather than
          inventing a grade curve.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {bands.map((band) => {
              const isActive = band.band === activeBand;
              return (
                <button
                  key={band.band}
                  type="button"
                  onClick={() => setSelectedBand(band.band)}
                  aria-pressed={isActive}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'border-[var(--accent-subtle-border)] bg-[var(--surface-accent)] text-[var(--accent-code)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {GRADE_BAND_LABELS[band.band]}
                  <span className="ml-1.5 font-mono font-normal opacity-70">n={band.reviewCount}</span>
                </button>
              );
            })}
          </div>

          {active && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                <div className={muted}>Typical week</div>
                <div className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {active.avgWeeklyHours.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">hrs</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  range {active.minWeeklyHours}–{active.maxWeeklyHours} hrs
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                <div className={muted}>What they leaned on</div>
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-[var(--text-primary)]">
                  {active.topMethods.length > 0 ? (
                    active.topMethods.map((method) => <li key={method}>{method}</li>)
                  ) : (
                    <li className="text-[var(--text-muted)]">No study methods logged</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
                <div className={muted}>How to read this</div>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                  Effort is a lever, not a verdict. The card shows what students in this band actually
                  did — never an "easy A" shortcut.
                </p>
              </div>
            </div>
          )}

          {advice.length > 0 && (
            <ul className="mt-3 space-y-2">
              {advice.map((review) => (
                <li
                  key={review.id}
                  className="flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]"
                >
                  <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
                  <span>
                    {review.practicalAdvice}
                    <span className="ml-1 text-[var(--text-muted)]">· {review.term}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            Grades are coarse bands supplied by students, used only to group effort. No distribution,
            curve, or instructor comparison is derived from them.
          </p>
        </>
      )}
    </section>
  );
};

export const PeakWeekPanel: React.FC<{ course: Course; reviews: Review[] }> = ({
  course,
  reviews,
}) => {
  const { palette } = useUniversityTheme();
  const map = useMemo(() => computePeakWeekMap(course, reviews), [course, reviews]);
  const hasSignal = map.busiestWeek > 0;

  return (
    <section className={cardShell} aria-label="Peak week map">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[var(--text-primary)]">
            <CalendarRange className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
            Peak-week map
          </h2>
          <p className={muted}>Where the crunch actually lands during the term</p>
        </div>
        {hasSignal && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--status-warning)]">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            Busiest: {map.busiestLabel}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {map.cells.map((cell) => (
          <div key={cell.week} className="flex flex-col items-center gap-1">
            <div
              title={
                cell.drivers.length > 0
                  ? `${cell.label}: ${cell.drivers.join(', ')}`
                  : `${cell.label}: no signal`
              }
              className="h-9 w-full rounded-md border border-[var(--border)]"
              style={{
                backgroundColor: hasSignal ? palette.chartPrimary : 'transparent',
                opacity: hasSignal ? Math.max(0.1, cell.intensity / 105) : 1,
              }}
            />
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{cell.label}</span>
          </div>
        ))}
      </div>

      {hasSignal && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {map.cells
            .filter((cell) => cell.drivers.length > 0)
            .slice(0, 4)
            .map((cell) => (
              <span
                key={`driver-${cell.week}`}
                className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
              >
                {cell.label}: {cell.drivers.join(' · ')}
              </span>
            ))}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">{map.note}</p>
    </section>
  );
};


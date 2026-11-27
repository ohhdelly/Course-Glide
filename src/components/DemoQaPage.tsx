import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Compass, Search } from 'lucide-react';

type CategoryId = 'pitch' | 'trust' | 'ai' | 'ethics' | 'tech' | 'hard';

interface QaItem {
  id: string;
  category: CategoryId;
  q: string;
  short: string;
  detail?: string[];
  show?: string;
}

interface DemoQaPageProps {
  totalCourses?: number;
  waterlooCourseCount?: number;
  subjectCount?: number;
  calendarVersion?: string;
  onGoExplore: () => void;
  onOpenCourse: (courseId: string, tab?: 'overview' | 'reviews' | 'teaching' | 'strategies') => void;
}

const CATEGORIES: Array<{ id: CategoryId; label: string; blurb: string }> = [
  { id: 'pitch', label: 'The pitch', blurb: 'What it is, who it is for, why it matters.' },
  {
    id: 'trust',
    label: 'Trust Lens',
    blurb: 'Scoring, moderation, sample sizes and the censorship question.',
  },
  { id: 'ai', label: 'AI & data', blurb: 'What the models do, and what happens without them.' },
  {
    id: 'ethics',
    label: 'Privacy & ethics',
    blurb: 'Anonymity, instructor power balance, legal risk.',
  },
  { id: 'tech', label: 'Technical', blurb: 'Stack, persistence, scale, tests, deployment.' },
  { id: 'hard', label: 'Hard questions', blurb: 'Rate My Professor, cold start, business model, gaps.' },
];

const QA_ITEMS: QaItem[] = [
  // ── The pitch ────────────────────────────────────────────────────────────
  {
    id: 'what-is-it',
    category: 'pitch',
    q: 'What is CourseGlide in one sentence?',
    short:
      'A course-intelligence layer on top of the official academic calendar that answers the question students actually ask — “what is this course really like, and can I handle it?” — with workload-weighted evidence instead of vibes.',
    detail: [
      'Official catalogue data stays official; student experience is a separate, labelled layer.',
      'Four surfaces in one product: catalogue, Trust-Lens-ranked reviews, teaching-team responses, study strategies.',
      'The same data is useful on both sides of the conversation, which is why institutions can adopt it.',
    ],
  },
  {
    id: 'who-for',
    category: 'pitch',
    q: 'Who is this for?',
    short:
      'Students choosing a term, teaching teams who want the class theme rather than individual complaints, and the registrar or dean’s office that pays for both.',
    detail: [
      'Student: pick a term without guesswork, plan weekly hours, find a study method that worked.',
      'Instructor / TA: aggregated themes they can respond to publicly, with no student identities.',
      'Institution: retention and course-planning signal from the courses students actually agonise over.',
    ],
  },
  {
    id: 'why-calendar-not-enough',
    category: 'pitch',
    q: 'The calendar already lists every course. What does this add?',
    short:
      'The calendar tells you prerequisites. It never tells you 14 hours a week, which week the midterms collide, or which study method got students through — that is the gap we fill.',
    detail: [
      'Filters the calendar can’t do: max difficulty, weekly-hour cap, review coverage.',
      'Load Index and peak weeks turn “hard course” into a plan.',
      'Every statistic carries its sample size and recency weighting.',
    ],
  },
  {
    id: 'why-now',
    category: 'pitch',
    q: 'Why now?',
    short:
      'Course selection is high-stakes and information-poor, and the existing options are unstructured review boards that punish instructors. Structured, transparent feedback is now cheap enough to be credible.',
    detail: [
      'Review sites have scale but no structure, no recency weighting, no instructor channel.',
      'Students already self-organise in Discords and spreadsheets — we give that instinct a schema.',
      'Every number we show is explainable, which is the difference between a rumour and a dataset.',
    ],
  },

  // ── Trust Lens ──────────────────────────────────────────────────────────
  {
    id: 'how-scored',
    category: 'trust',
    q: 'How does Trust Lens score a review?',
    short:
      'It is a deterministic 0–100 rubric, not a model: it starts at 20 and adds points for length, course-specific vocabulary, assessment and workload context, describing both strengths and challenges, actionable advice, and verified enrollment — then applies explicit penalties for near-duplicates, low information and spam.',
    detail: [
      'Additions: +15 for 25+ words, +12 for 50+, +16 for two or more course terms (+8 more at four), +10 assessment/workload context, +10 strengths and challenges, +10 actionable advice, +5 verified enrollment.',
      'Community signal: helpfulness net × 1.5, capped between −8 and +10; recency up to +6.',
      'Penalties: −35 for ≥72% word overlap with a canonical review, −28 for low information, −40 for spam patterns. The total is clamped to 5–100.',
      'Bands: 62+ is “most informative”, 38–61 is standard, below that is “limited context”.',
    ],
    show: 'Any review’s “Why this score?” popover shows every line item above with its points.',
  },
  {
    id: 'censorship',
    category: 'trust',
    q: 'Down-ranking criticism sounds like censorship.',
    short:
      'The score never reads sentiment — it reads information. A detailed 3/5 complaint outranks a one-line 5/5 rave, and the sorted-by-score view still lets a reader open the plain chronological list, which shows everything a human moderator has not hidden.',
    detail: [
      'The “How it works” page demonstrates this: a critical review ranks second in Most Informative and is never deleted.',
      'Low-ranked reviews keep a visible reason (“Limited Context”), so the demotion is auditable.',
      'Only a human moderation decision hides text; scoring never does.',
    ],
    show: 'How it works → Experience Trust Lens → toggle All Reviews / Most Informative.',
  },
  {
    id: 'reporting',
    category: 'trust',
    q: 'What happens when a review gets reported?',
    short:
      'It goes to a queue with a reason — spam, harassment, PII or off-topic. A second report flags it, and a human presses Keep or Remove. Removal is the only path that hides a review.',
    detail: [
      'Report counts never auto-delete; the queue records how each report was resolved.',
      'Every submission is screened first for emails, phone numbers and threatening language.',
      'In demo mode the queue is deliberately open so anyone can try the full loop.',
    ],
    show: 'How it works → Transparency & Community Moderation → Moderation Queue.',
  },
  {
    id: 'bombing',
    category: 'trust',
    q: 'How do you stop review bombing and duplicates?',
    short:
      'Near-duplicate text is detected at 72% word overlap against the canonical review and penalised, and votes are one-per-user-per-review at the API level — a repeat vote returns a conflict instead of incrementing the count.',
    detail: [
      'The canonical review is the one with more helpful votes, enrollment verification, or the earlier submission.',
      'Votes can be changed, but the previous vote is decremented first, so counts can’t be inflated.',
      'Rate limits protect the advisor endpoint; the review endpoint is bounded by validation and screening.',
    ],
  },
  {
    id: 'fake-reviews',
    category: 'trust',
    q: 'What actually stops fake reviews?',
    short:
      'Honest answer: today, screening and duplicate detection only. Enrollment verification is the real mechanism — the data model and the +5 scoring bonus already exist, but it needs registrar or SSO integration to mean anything.',
    detail: [
      'Verification is a field on every review, not a comment, so turning it on is a policy switch plus an auth flow.',
      'Until then, every review is labelled and the demo says plainly that submissions are seeded or user-entered.',
    ],
  },
  {
    id: 'small-samples',
    category: 'trust',
    q: 'Why show statistics for a course with two reviews?',
    short:
      'Because a blank page reads as “nothing to worry about”. Instead we show the sample size, widen the rating interval, shrink the point estimate toward the department mean, and label confidence outright: strong at 7+ responses, moderate at 4–6, limited below that.',
    detail: [
      'The rating is shrunk toward a department prior with a pseudo-count of three, so three reviews cannot claim 4.9.',
      'The UI states when a rating is anchored to the department, and the breakdown shows the prior, weight and margin.',
      'Low-confidence courses say so in words, next to the number.',
    ],
  },
  {
    id: 'recency',
    category: 'trust',
    q: 'Why do recent reviews count more?',
    short:
      'Instructors, rubrics and pacing change. Each earlier term counts 75% of the next newer one, with a 30% floor so real history still contributes — and the course page names the reference term and the weighting.',
    detail: [
      'Every average on a course page is a weighted average, and the weighting note is visible.',
      'Term-by-term trends are shown alongside, so a change in difficulty is visible instead of averaged away.',
    ],
  },
  {
    id: 'load-index',
    category: 'trust',
    q: 'What is the Load Index, and why those weights?',
    short:
      '100 × (0.30 × weekly hours + 0.45 × mental effort + 0.25 × stress). Effort outweighs raw hours because that is what students actually price a term by — fifteen easy hours and fifteen grinding hours are not the same course.',
    detail: [
      'Hours are normalised against 25/week; effort and stress against a 1–5 self-report.',
      'Labels: Light, Manageable, Demanding, Very demanding.',
      'The formula and each component are shown in the UI, not buried.',
    ],
  },
  {
    id: 'effort-to-success',
    category: 'trust',
    q: 'Why not show grade distributions?',
    short:
      'Self-reported grades are unverifiable and would immediately become an “easy A” leaderboard. We show hours by the grade band a student was aiming for, explicitly labelled as self-reported correlation, never a prediction.',
    detail: [
      'The band includes the top study methods used by that group and the observed hour range.',
      'Copy states it is not a grade distribution and not a ranking of course difficulty by outcome.',
    ],
  },
  {
    id: 'department-prior',
    category: 'trust',
    q: 'Isn’t a department prior just baked-in bias?',
    short:
      'It is a disclosed prior, not a hidden one: a small sample is pulled toward the department mean so it cannot masquerade as precision. The point estimate, the prior value, its weight and the resulting interval are all shown.',
    detail: [
      'Courses with no reviews get an empty, unanchored shape rather than a fabricated score.',
      'The prior is computed per university and department from the same dataset the page displays.',
    ],
  },

  // ── AI & data ───────────────────────────────────────────────────────────
  {
    id: 'ai-role',
    category: 'ai',
    q: 'What does the AI actually do?',
    short:
      'Two narrow jobs. The Course Advisor translates a request like “light-workload 300-level CS elective, projects over exams” into a structured brief that filters the real catalogue; Insights summarises recurring themes from reviews with the review IDs attached. The model never invents a course.',
    detail: [
      'The catalogue decides what matches; a deterministic matcher scores and explains each result.',
      'Insights are extractive: every bullet cites the review it came from, and the sample note states how many reviews backed it.',
      'If the model returns something unusable, the deterministic path is used instead.',
    ],
    show: 'Landing → ask the advisor; then open MATH 137 → Overview → Insights.',
  },
  {
    id: 'models',
    category: 'ai',
    q: 'Which models are behind it?',
    short:
      'The advisor uses NVIDIA Nemotron (nvidia/nemotron-3.5-bolt-e4b) through an OpenAI-compatible endpoint, with fallback models tried inside one time budget; course insights can use Google Gemini. Both are optional.',
    detail: [
      'Fallbacks: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning, then stepfun-ai/step-5-preview.',
      'Keys stay server-side; the browser never sees a provider key.',
      'Model choice is configuration, not architecture — swapping providers touches one resolver.',
    ],
  },
  {
    id: 'ai-down',
    category: 'ai',
    q: 'What happens if the models are down, or there is no API key?',
    short:
      'The app degrades instead of breaking. The advisor falls back to the rules-based parser and insights to the deterministic Trust Lens generator, so a demo with no keys at all still runs end to end.',
    detail: [
      'The health endpoint reports which capabilities are live, so you can see the mode you are in.',
      'The advisor is rate-limited per client, so a demo cannot burn through a quota in one sitting.',
    ],
  },
  {
    id: 'data-source',
    category: 'ai',
    q: 'Where does the course data come from? Is any of it fake?',
    short:
      'The catalogue is real: undergraduate courses parsed from the University of Waterloo 2026–2027 Academic Calendar, plus a small uOttawa set to prove multi-university theming. The reviews, instructor profiles and faculty responses are seeded demo data and labelled as such.',
    detail: [
      'Each course carries calendar metadata: prerequisites, antirequisites, terms offered, assessment weights.',
      'Seeded content is flagged isDemoData, and the footer says it plainly.',
      'A sync script regenerates the snapshot; the health endpoint reports the last sync date and source URL.',
    ],
  },
  {
    id: 'live-schedule',
    category: 'ai',
    q: 'Is the term schedule live?',
    short:
      'Optionally. With a Waterloo Open Data API key the course page confirms live term-specific offerings; without one it presents the calendar snapshot’s terms and says so instead of guessing.',
    detail: [
      'The schedule check is a labelled confirmation on top of the calendar record, not a replacement.',
    ],
  },

  // ── Privacy & ethics ────────────────────────────────────────────────────
  {
    id: 'identity',
    category: 'ethics',
    q: 'Do you store student identities?',
    short:
      'Reviews are anonymous by default and can be posted under an alias, and the demo has no account system at all — just a clearly fictional demonstration student profile. Emails, phone numbers and threatening language are rejected before anything is written.',
    detail: [
      'Submissions are sanitised and length-capped before storage, and the request body itself is capped.',
      'Teaching-team views aggregate themes and use de-identified excerpts, never a reviewer identity.',
      'Saved courses are keyed to a demo user id, not a person.',
    ],
  },
  {
    id: 'retaliation',
    category: 'ethics',
    q: 'Can an instructor identify or retaliate against a student?',
    short:
      'The design removes the opportunity. The mid-term pulse is sealed — responses aggregate and stay hidden until the term ends — and teaching teams see theme counts rather than quotes with names. Faculty responses must address a class theme, not an individual review.',
    detail: [
      'Pulse feedback is limited to a couple of prompts inside weeks 4–8, so it is cheap to answer and hard to weaponise.',
      'Reviews that name an instructor are aggregated into themes with a mention count and a note when those mentions predate the current section.',
    ],
    show: 'A course → Teaching team tab → mid-term pulse panel.',
  },
  {
    id: 'defensive',
    category: 'ethics',
    q: 'Won’t instructors be defensive about this?',
    short:
      'That is why the teaching-team surface is a channel rather than a scoreboard: responses carry a status — heard, explained, changed — so the record shows action instead of an argument, and students see the answer where they read the theme.',
    detail: [
      'Themes come from aggregate counts, so no single review is put on trial.',
      'Responses are public and attributed to the instructor or TA, which sets the tone for everyone.',
    ],
  },
  {
    id: 'legal',
    category: 'ethics',
    q: 'Is publishing this legally risky?',
    short:
      'What we publish is self-reported experience, aggregated, with moderation and a right of reply — not an allegation of fact about a person. A real deployment still needs a written policy for retention, verification and appeals; that is policy work, not code, and it is the next thing we would build.',
    detail: [
      'No individual is scored: the scores apply to review information quality, not to instructors.',
      'Removal decisions are recorded, which is the basis of an appeal trail.',
    ],
  },
  {
    id: 'named-ta',
    category: 'ethics',
    q: 'What if a review names a TA harshly?',
    short:
      'It is eligible for reporting under harassment or PII, and the teaching-team view only ever shows aggregated themes plus de-identified excerpts — with a note when mentions come from earlier sections.',
    detail: [
      'PII and threat screening runs at submission, before the review exists in the store.',
      'Moderation can hide it entirely, and hidden reviews drop out of every statistic.',
    ],
  },

  // ── Technical ───────────────────────────────────────────────────────────
  {
    id: 'stack',
    category: 'tech',
    q: 'What is the stack?',
    short:
      'React 19 and TypeScript with Vite 8 and Tailwind 4 on the client; a single Express 4 process serving the API and the Vite middleware; hash routing with no router dependency; Recharts for charts and Motion for the small amount of purposeful animation.',
    detail: [
      'One process in development and one entrypoint in production — no separate API service to keep in sync.',
      'Design tokens live in CSS variables, which is how university theming works without a rebuild.',
    ],
  },
  {
    id: 'persistence',
    category: 'tech',
    q: 'How is data persisted?',
    short:
      'A JSON demo store behind a small service layer, so saved courses, reviews, votes, faculty responses and the moderation queue survive a restart. It is explicitly demo-grade — moving to Postgres is swapping a persistence adapter, not a rewrite.',
    detail: [
      'All writes go through save functions, so the storage boundary is already narrow.',
      'The catalogue snapshot is generated, not hand-edited.',
    ],
  },
  {
    id: 'scale',
    category: 'tech',
    q: 'How does it scale?',
    short:
      'Honestly: one process, an in-memory catalogue index and JSON writes — right for a demo and a pilot cohort, not for a university. A real launch needs a database, an async queue for model calls, and the in-memory caches moved to shared storage.',
    detail: [
      'The read path is already cheap: the catalogue is indexed once and filters run over the index.',
      'Insights and staff digests are cached per course and review count, which is the right cache key shape for a shared cache.',
      'A 500 kB+ client bundle is the other known cost — code-splitting the course tabs is the obvious win.',
    ],
  },
  {
    id: 'security',
    category: 'tech',
    q: 'What about security and tests?',
    short:
      'Inputs are sanitised and length-capped, request bodies are capped, the advisor is rate-limited per client, and PII and threat screening runs before storage. Typecheck and production build are green, and six unit suites cover the deterministic logic the product’s claims rest on.',
    detail: [
      'No auth in demo mode by design — anything that looked like a real account system would be a claim we cannot back yet.',
      'Tests use node:test and assert on scoring, ranking, statistics and explanations rather than on copy.',
    ],
  },
  {
    id: 'deploy',
    category: 'tech',
    q: 'How does it deploy?',
    short:
      'The client builds to dist/ and the Express app is re-exported as a serverless handler, so the whole thing runs on one host with no local-only service except the JSON store.',
    detail: [
      'Development is a single command; production is build plus start.',
      'CI would be three steps: typecheck, build, unit tests.',
    ],
  },

  // ── Hard questions ──────────────────────────────────────────────────────
  {
    id: 'rmp',
    category: 'hard',
    q: 'Isn’t this just Rate My Professor with a nicer UI?',
    short:
      'A review board is sentiment with no structure and no instructor participation. Here every review is structured — difficulty, hours, mental effort, stress, grade aim, study methods — ranked on information rather than agreement, aggregated with sample sizes and recency weights, and paired with a channel where the teaching team can answer the class theme.',
    detail: [
      'That structure is what makes the statistics possible at all: you cannot compute a workload index from free-text ratings.',
      'The instructor is a participant with a public record of response, not a target.',
    ],
  },
  {
    id: 'cold-start',
    category: 'hard',
    q: 'How do you get the first 500 reviews?',
    short:
      'Start where feedback is already cheap and already happening: short mid-term pulse prompts during the term, reviews written as advice for the next cohort, and departments that already have informal threads so the catalogue is never empty — and default to a department-anchored range so a zero-review course still shows something defensible.',
    detail: [
      'The pulse asks for two prompts in weeks 4–8, which is far less effort than a full review.',
      'Study strategies give the reviewer something to leave behind, which is a stronger motivator than rating a course.',
      'Seed one department, prove the loop, then expand — that is a pilot, not a launch.',
    ],
  },
  {
    id: 'business',
    category: 'hard',
    q: 'Who pays for this?',
    short:
      'The institution, as a retention and course-planning tool for the registrar or dean’s office — not ads shown to students. Per-student licensing on catalogue plus analytics is the model; the student-facing browser is the free tier that earns the data.',
    detail: [
      'Students are the supply and the demand; charging them would kill both.',
      'Institutions already pay for course evaluations and planning analytics that are slower and less used.',
    ],
  },
  {
    id: 'next',
    category: 'hard',
    q: 'What would you build next?',
    short:
      'Enrollment-verified reviews through SSO, a real database with an audit log, term-over-term change tracking so a rubric or instructor change is visible, and instructor-side analytics.',
    detail: [
      'Verification turns the strongest claim we make — that a review is from someone who took the course — into a fact.',
      'Change tracking is the feature students ask for once the data has two years of history.',
    ],
  },
  {
    id: 'limitations',
    category: 'hard',
    q: 'What is not done, honestly?',
    short:
      'No real accounts or enrollment verification, seeded reviews, single-process JSON persistence, an open moderation queue in demo mode, and an information-quality score that measures usefulness rather than truth. Pedagogical outcomes are self-reported.',
    detail: [
      'The catalogue is real; the conversation around it is not yet.',
      'The AI helps parse and summarise — it does not decide what is true about a course.',
    ],
  },
  {
    id: 'metric',
    category: 'hard',
    q: 'How would you prove it works?',
    short:
      'Two numbers: the share of reviews that clear the informative tier, and vote-weighted helpfulness per course — then, in a pilot department, add/drop churn and the “I didn’t know it would be like this” answers in course evaluations.',
    detail: [
      'Leading indicators are measurable today; outcome indicators need a semester and a partner.',
      'An A/B in one department against the current calendar-only experience is the honest first trial.',
    ],
  },
];

export const DemoQaPage: React.FC<DemoQaPageProps> = ({
  totalCourses = 4358,
  waterlooCourseCount = 4343,
  subjectCount = 140,
  calendarVersion = '2026–2027 Academic Calendar',
  onGoExplore,
  onOpenCourse,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [openIds, setOpenIds] = useState<string[]>([QA_ITEMS[0].id]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      QA_ITEMS.filter((item) => {
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
        if (!normalizedQuery) return true;
        const haystack = [item.q, item.short, ...(item.detail ?? []), item.show ?? '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [activeCategory, normalizedQuery]
  );

  const allFilteredOpen =
    filtered.length > 0 && filtered.every((item) => openIds.includes(item.id));

  const toggleItem = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setOpenIds(allFilteredOpen ? [] : filtered.map((item) => item.id));
  };

  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="type-caption font-semibold text-[var(--text-muted)]">
            Demo day briefing
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl type-h1 text-[var(--text)] text-balance sm:type-display">
            Questions we expect, and the answers.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl type-body text-[var(--text-muted)]">
            Short answers to say out loud, the detail behind each one, and where in the app to
            prove it.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onGoExplore}
              className="btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 type-small font-semibold"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>Open Explore</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCourse('math-137', 'reviews')}
              className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-control px-4 py-2 type-small font-semibold"
            >
              <span>Trust Lens on MATH 137</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        {/* 60-second pitch + numbers */}
        <section className="surface-card rounded-card p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="type-h2 text-[var(--text)]">The 60-second version</h2>
            <span className="type-caption text-[var(--text-muted)]">
              Say this before anyone asks anything
            </span>
          </div>
          <ol className="mt-4 space-y-3">
            <li className="flex gap-3">
              <span className="type-caption font-semibold text-[var(--text-muted)] tabular-nums">
                01
              </span>
              <p className="type-small text-[var(--text)]">
                <strong className="font-semibold">Official data stays official.</strong> Every
                course is a real calendar record — prerequisites, antirequisites, terms,
                assessment weights — not scraped rumour.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="type-caption font-semibold text-[var(--text-muted)] tabular-nums">
                02
              </span>
              <p className="type-small text-[var(--text)]">
                <strong className="font-semibold">
                  Student feedback is structured, then scored for information.
                </strong>{' '}
                Trust Lens is a transparent rubric — detail, context, advice — never sentiment.
                Criticism is never penalised for being negative.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="type-caption font-semibold text-[var(--text-muted)] tabular-nums">
                03
              </span>
              <p className="type-small text-[var(--text)]">
                <strong className="font-semibold">Both sides get something.</strong> Students get
                workload they can plan around; teaching teams get aggregate themes they can answer
                publicly — with no student identities attached.
              </p>
            </li>
          </ol>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-3">
            <div>
              <div className="type-metric text-[var(--text)] tabular-nums">
                {totalCourses.toLocaleString()}
              </div>
              <div className="type-caption text-[var(--text-muted)]">catalogue records</div>
            </div>
            <div>
              <div className="type-metric text-[var(--text)] tabular-nums">
                {waterlooCourseCount.toLocaleString()}
              </div>
              <div className="type-caption text-[var(--text-muted)]">Waterloo courses</div>
            </div>
            <div>
              <div className="type-metric text-[var(--text)] tabular-nums">{subjectCount}</div>
              <div className="type-caption text-[var(--text-muted)]">subjects indexed</div>
            </div>
          </div>
          <p className="mt-3 type-caption text-[var(--text-muted)]">
            Catalogue: {calendarVersion} · demonstration mode — the reviews and teaching-team
            responses around this catalogue are seeded demo data.
          </p>
        </section>

        {/* Controls */}
        <section className="sticky top-16 z-30 -mx-4 border-y border-[var(--border)] bg-[var(--bg)] px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <label htmlFor="qa-search" className="sr-only">
                Search questions
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                id="qa-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: scale, privacy, duplicate, AI…"
                className="min-h-[44px] w-full rounded-control border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 type-small text-[var(--text)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                aria-pressed={activeCategory === 'all'}
                className={`min-h-[44px] rounded-control border px-3 py-2 type-caption font-semibold transition-colors ${
                  activeCategory === 'all'
                    ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={activeCategory === category.id}
                  className={`min-h-[44px] rounded-control border px-3 py-2 type-caption font-semibold transition-colors ${
                    activeCategory === category.id
                      ? 'border-[var(--accent-strong)] bg-[var(--surface-2)] text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="type-caption text-[var(--text-muted)]">
              {filtered.length} of {QA_ITEMS.length} questions
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex min-h-[44px] items-center rounded-control px-2 type-caption font-semibold text-[var(--text)] underline-offset-4 hover:underline"
            >
              {allFilteredOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        </section>

        {/* Question groups */}
        {CATEGORIES.map((category) => {
          const items = filtered.filter((item) => item.category === category.id);
          if (items.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`qa-heading-${category.id}`}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`qa-heading-${category.id}`} className="type-h2 text-[var(--text)]">
                  {category.label}
                </h2>
                <span className="type-caption text-[var(--text-muted)]">{category.blurb}</span>
              </div>

              <div className="divide-y divide-[var(--border)] overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)]">
                {items.map((item) => {
                  const isOpen = openIds.includes(item.id);
                  const panelId = `qa-panel-${item.id}`;
                  return (
                    <div key={item.id}>
                      <h3>
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="flex w-full min-h-[56px] items-start justify-between gap-4 px-4 py-4 text-left hover:bg-[var(--surface-2)] sm:px-5"
                        >
                          <span className="type-body font-semibold text-[var(--text)] text-pretty">
                            {item.q}
                          </span>
                          <ChevronDown
                            className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      </h3>

                      {isOpen && (
                        <div id={panelId} className="px-4 pb-5 sm:px-5">
                          <p className="type-small text-[var(--text)]">{item.short}</p>

                          {item.detail && item.detail.length > 0 && (
                            <ul className="mt-3 space-y-1.5 border-l-2 border-[var(--border)] pl-4">
                              {item.detail.map((line) => (
                                <li key={line} className="type-caption text-[var(--text-muted)]">
                                  {line}
                                </li>
                              ))}
                            </ul>
                          )}

                          {item.show && (
                            <p className="mt-3 type-caption text-[var(--text-muted)]">
                              <span className="font-semibold text-[var(--text)]">Show it: </span>
                              {item.show}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <section className="surface-card rounded-card p-6 text-center">
            <p className="type-body font-semibold text-[var(--text)]">
              No prepared answer matches “{query}”.
            </p>
            <p className="mx-auto mt-2 max-w-md type-small text-[var(--text-muted)]">
              Answer the shape: what it does, what the evidence is, what we have not built.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setActiveCategory('all');
              }}
              className="btn-secondary mt-4 inline-flex min-h-[44px] items-center rounded-control px-4 py-2 type-small font-semibold"
            >
              Clear filters
            </button>
          </section>
        )}

        <p className="type-caption text-[var(--text-muted)]">
          Internal preparation, not a product surface — reachable at{' '}
          <span className="font-semibold text-[var(--text)]">#/demo-qa</span>.
        </p>
      </div>
    </main>
  );
};

# CourseGlide 

**Better feedback. Smarter course decisions.**

CourseGlide is a university course intelligence platform. It pairs an official academic-calendar catalogue with structured, evidence-weighted student reviews so students can pick courses with real information instead of guesswork — while giving teaching teams a respectful, aggregated way to respond.

> ⚠️ This repository runs in **demonstration mode**: reviews, profiles and faculty responses are seeded demo data, and the moderation queue is open for anyone to try.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Course catalogue** | 4,358 course records — 4,343 from the 2026–2027 University of Waterloo Undergraduate Studies Academic Calendar plus 15 uOttawa demo courses — with 140 subjects, prerequisites, antirequisites and calendar metadata. |
| **Trust Lens** | Deterministic scoring that ranks reviews by informational value, computes difficulty/workload/recommendation stats and flags low-confidence samples instead of hiding them. |
| **Explore & filters** | Full-text search, university/department/level filters, max difficulty, weekly-hour caps, review coverage and sortable results. |
| **Course pages** | Overview, student reviews, teaching team and study strategies tabs, plus cited "Insights" bullets tied back to individual review IDs. |
| **Reviews** | Anonymous or named reviews with difficulty, weekly hours, recency and study-method tags; helpful / not-helpful voting with duplicate-vote protection. |
| **Teaching team responses** | Instructors and TAs can answer an aggregated class theme rather than individual reviews. |
| **Moderation** | Report reasons (spam, harassment, PII, off-topic), a pending queue, and keep/remove resolutions. Submissions are screened for emails, phone numbers and harassment language. |
| **Saved courses** | Per-user saved list backed by the local store. |
| **University themes** | Theme system that re-skins the UI per selected university, with the demo student profile. |

## 🧱 Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, `motion`, `lucide-react`, `recharts`
- **Backend:** Express 4 running in the same process as Vite's dev middleware (`tsx server.ts`)
- **AI (optional):** NVIDIA Nemotron (OpenAI-compatible API) for the AI Course Advisor's language layer, and Google Gen AI (Gemini) for synthesising review insights — each with a deterministic fallback
- **Data (optional):** Waterloo Open Data API v3 for live term schedule confirmation
- **Persistence:** JSON file (`.courseglide-demo-store.json`) — demo-grade, not a production datastore

## 🚀 Getting started

```bash
bun install
bun run dev        # http://localhost:3000
```

The app boots in demonstration mode with zero configuration — the API key features simply fall back to deterministic behaviour.

```bash
bun run build      # production client build into dist/
NODE_ENV=production bun run start
bun run lint       # tsc --noEmit
```

Override the port with `PORT`, e.g. `PORT=3010 bun run dev`. If that port is already taken the dev server logs the collision and starts on the next free port instead (e.g. `http://localhost:3001`), so check the startup line for the real URL.

## 🔑 Environment variables

Copy `.env.example` to `.env`. All keys are optional.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NVIDIA_API_KEY` | No | Enables the AI Course Advisor's language layer on `integrate.api.nvidia.com`. Without it the advisor answers from the rules-based parser alone. |
| `NVIDIA_MODEL` | No | Primary advisor model. Defaults to `nvidia/nemotron-3.5-bolt-e4b`. |
| `NVIDIA_FALLBACK_MODELS` | No | Comma-separated models tried after the primary one, inside one overall time budget. |
| `NVIDIA_BASE_URL` | No | OpenAI-compatible base URL. Defaults to `https://integrate.api.nvidia.com/v1`. |
| `GEMINI_API_KEY` | No | Enables AI-generated course insights via `@google/genai`. Without it, insights come from the deterministic Trust Lens generator. |
| `UWATERLOO_API_KEY` | No | Confirms live term-specific schedules against the Waterloo Open Data API v3. Without it, schedule notes are based on the calendar snapshot only. |
| `APP_URL` | No | Public URL of the app (injected by Google AI Studio in the original environment). |
| `PORT` | No | Server port. Defaults to `3000`. |
| `DISABLE_HMR` | No | Set to `true` to disable Vite HMR/file watching. |

`.env*` files are gitignored except `.env.example` — never commit real keys.

## 🗺️ Routes

Hash-based client routing:

- `#/` — landing page
- `#/explore` — catalogue search and filters
- `#/course/:courseId/:tab` — course detail (`overview`, `reviews`, `teaching`, `strategies`)
- `#/saved` — saved courses
- `#/how-it-works` — product explainer and moderation queue

## 🔌 API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Server mode, capability flags, catalogue metadata |
| `GET` | `/api/bootstrap` | Initial universities, courses, subjects, reviews, saved list, votes |
| `GET` | `/api/courses` | Paginated, filtered catalogue query |
| `GET` | `/api/courses/:id` | Course record + stats, reviews, instructors, faculty responses |
| `POST` | `/api/saved-courses` | Toggle a saved course |
| `POST` | `/api/reviews` | Submit a review (policy screened) |
| `POST` | `/api/reviews/:id/vote` | Helpful / not-helpful vote |
| `POST` | `/api/reviews/:id/report` | Report a review |
| `POST` | `/api/moderation/:reportId/resolve` | Keep or remove a reported review |
| `POST` | `/api/faculty-responses` | Publish a teaching-team response |
| `POST` | `/api/insights` | Generate cited insights for a course |

## 📁 Layout

```
server.ts                  Express app, API routes, Vite middleware
server/catalogueService.ts Catalogue indexing, filtering, schedule checks
server/data/               Waterloo calendar snapshot (generated)
scripts/                   Catalogue sync utility
src/components/            Pages, modals and course tabs
src/data/demoDataset.ts    Seeded demo universities, reviews, instructors
src/utils/trustLens.ts     Scoring, ranking and insight generation
src/theme/                 University theming
```

## 🧪 Tests

Six `node:test` suites live beside the logic they cover:

- `src/utils/trustLens.test.ts` — Trust Lens scoring and tiers, review ranking and filtering, course statistics, load index, peak-week map, teaching-team views, search typo tolerance, catalogue loading
- `src/utils/scoreExplanations.test.ts` — every explanation carries its displayed value and real components, and is deterministic
- `src/utils/scoreBaseline.test.ts` — regression baselines for course scores, review scores and tiers, load index, peak-week intensities and advisor match percentages
- `src/utils/courseTakeaway.test.ts` — overview takeaways, including unreviewed courses that must not invent metrics
- `src/utils/dataVisuals.test.ts` — rating distributions, workload breakdowns, term workload summaries and hour formatting
- `src/theme/universityTheme.test.ts` — theme resolution

## 📝 Notes

- Demo accounts and reviews are fictional and marked `isDemoData`.
- The catalogue snapshot in `server/data/uwaterlooCatalogue.json` is generated by `scripts/syncWaterlooCatalogue.ts`; re-run it to refresh the calendar.

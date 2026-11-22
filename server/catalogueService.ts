import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CatalogScheduleStatus,
  CatalogueMetadata,
  CatalogueSubject,
  Course,
  CourseFilters,
  CourseStats,
  PaginatedCoursesResponse,
  Review,
  UniversityId,
} from '../src/types/course.ts';
import { DEMO_COURSES, DEMO_INSTRUCTORS } from '../src/data/demoDataset.ts';
import { computeCourseStats } from '../src/utils/trustLens.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Local runs resolve next to this file; the Vercel function bundle keeps the
// relative path at the deployment root instead.
const CATALOG_PATH =
  [
    path.resolve(__dirname, './data/uwaterlooCatalogue.json'),
    path.resolve(process.cwd(), 'server/data/uwaterlooCatalogue.json'),
  ].find((candidate) => fs.existsSync(candidate)) ??
  path.resolve(__dirname, './data/uwaterlooCatalogue.json');

interface RawWaterlooSnapshot {
  calendarId: string;
  calendarVersion: string;
  sourceName: string;
  sourceUrl: string;
  lastSyncedAt: string;
  courseCount: number;
  courses: Array<{
    id: string;
    code: string;
    subjectCode: string;
    catalogNumber: string;
    title: string;
    department: string;
    level: 100 | 200 | 300 | 400 | 500;
    credits: string;
    description: string;
    prerequisites?: string;
    corequisites?: string;
    antirequisites?: string;
    calendarVersion: string;
    sourceUrl: string;
    lastUpdated: string;
    catalogPid: string;
    kualiId: string;
  }>;
}

interface IndexedCourseEntry {
  course: Course;
  compactCode: string;
  lowerTitle: string;
  lowerSubject: string;
  lowerDept: string;
  lowerDesc: string;
  instructorNamesLower: string[];
}

export interface TermScheduleCheckResult {
  catalogStatus: CatalogScheduleStatus;
  termLabel?: string;
  sectionCount?: number;
  termScheduleNote: string;
}

export class CatalogueService {
  private courses: Course[] = [];
  private courseMap = new Map<string, Course>();
  private index: IndexedCourseEntry[] = [];
  private subjectsByUni: Record<UniversityId, CatalogueSubject[]> = {
    all: [],
    uwaterloo: [],
    uottawa: [],
  };
  private metadata: CatalogueMetadata;
  private queryCache = new Map<string, { timestamp: number; value: PaginatedCoursesResponse }>();
  private scheduleCache = new Map<string, { timestamp: number; value: TermScheduleCheckResult }>();
  private openDataApiKey: string | undefined;
  private cachedCurrentTerm: { timestamp: number; termCode: string; name: string } | null = null;

  constructor(openDataApiKey?: string) {
    this.openDataApiKey = openDataApiKey?.trim() || undefined;
    this.metadata = {
      totalCourses: 0,
      waterlooCourseCount: 0,
      uottawaCourseCount: 0,
      waterlooCalendarVersion: '2026-2027 Undergraduate Studies Academic Calendar',
      waterlooSourceUrl: 'https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog',
      waterlooLastSyncedAt: new Date().toISOString(),
      openDataConfigured: Boolean(this.openDataApiKey),
      subjectCount: 0,
    };
    this.loadCatalogue();
  }

  private loadCatalogue() {
    const demoById = new Map<string, Course>(DEMO_COURSES.map((c) => [c.id, c]));
    const instructorsByCourse = new Map<string, string[]>();
    for (const inst of DEMO_INSTRUCTORS) {
      const list = instructorsByCourse.get(inst.courseId) ?? [];
      list.push(inst.name.toLowerCase());
      instructorsByCourse.set(inst.courseId, list);
    }

    const combined: Course[] = [];
    let waterlooCount = 0;
    let uottawaCount = 0;

    if (fs.existsSync(CATALOG_PATH)) {
      try {
        const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8')) as RawWaterlooSnapshot;
        this.metadata.waterlooCalendarVersion = raw.calendarVersion;
        this.metadata.waterlooSourceUrl = raw.sourceUrl;
        this.metadata.waterlooLastSyncedAt = raw.lastSyncedAt;

        for (const item of raw.courses) {
          const existingDemo = demoById.get(item.id);
          const course: Course = {
            id: item.id,
            code: item.code,
            subjectCode: item.subjectCode,
            title: item.title,
            universityId: 'uwaterloo',
            universityName: 'University of Waterloo',
            department: item.department,
            level: item.level,
            credits: item.credits,
            description: item.description,
            termsOffered: existingDemo?.termsOffered ?? [],
            officialNote: existingDemo?.officialNote ??
              `Official entry from the ${item.calendarVersion}.`,
            prerequisites: item.prerequisites,
            corequisites: item.corequisites,
            antirequisites: item.antirequisites,
            calendarVersion: item.calendarVersion,
            sourceUrl: item.sourceUrl,
            lastUpdated: item.lastUpdated,
            catalogPid: item.catalogPid,
            catalogStatus: 'listed_in_catalog',
            termScheduleNote: this.openDataApiKey
              ? 'Listed in the 2026–2027 Academic Calendar. Live term schedule verified on course profile.'
              : 'Listed in the 2026–2027 Academic Calendar. Term-specific offerings are not confirmed without a Waterloo Open Data API key.',
            isOfficialCatalog: true,
            ...(existingDemo?.assessmentBreakdown
              ? { assessmentBreakdown: existingDemo.assessmentBreakdown }
              : {}),
          };
          combined.push(course);
          waterlooCount++;
        }
      } catch (err) {
        console.warn('Could not parse Waterloo catalogue snapshot, falling back to Waterloo demo courses:', err);
      }
    }

    // Ensure Waterloo demo courses exist even if snapshot missing
    if (waterlooCount === 0) {
      for (const c of DEMO_COURSES.filter((d) => d.universityId === 'uwaterloo')) {
        combined.push({
          ...c,
          subjectCode: c.code.split(' ')[0],
          catalogStatus: 'listed_in_catalog',
          isOfficialCatalog: false,
        });
        waterlooCount++;
      }
    }

    // Keep University of Ottawa courses completely separate from Waterloo
    for (const c of DEMO_COURSES.filter((d) => d.universityId === 'uottawa')) {
      combined.push({
        ...c,
        subjectCode: c.code.split(' ')[0],
        calendarVersion: 'University of Ottawa Demonstration Dataset',
        catalogStatus: 'listed_in_catalog',
        termScheduleNote: 'Demonstration dataset entry; verify official uOttawa timetable prior to enrollment.',
        isOfficialCatalog: false,
      });
      uottawaCount++;
    }

    this.courses = combined;
    this.courseMap.clear();
    this.index = [];

    const subjectAccum = new Map<string, CatalogueSubject>();

    for (const course of combined) {
      this.courseMap.set(course.id, course);
      this.index.push({
        course,
        compactCode: course.code.toLowerCase().replace(/\s+/g, ''),
        lowerTitle: course.title.toLowerCase(),
        lowerSubject: (course.subjectCode ?? '').toLowerCase(),
        lowerDept: course.department.toLowerCase(),
        lowerDesc: course.description.toLowerCase(),
        instructorNamesLower: instructorsByCourse.get(course.id) ?? [],
      });

      const subjKey = `${course.universityId}::${course.subjectCode || course.department}`;
      const existing = subjectAccum.get(subjKey);
      if (existing) {
        existing.count++;
      } else {
        subjectAccum.set(subjKey, {
          code: course.subjectCode || course.department,
          department: course.department,
          count: 1,
          universityId: course.universityId,
        });
      }
    }

    const allSubjects = Array.from(subjectAccum.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
    this.subjectsByUni = {
      all: allSubjects,
      uwaterloo: allSubjects.filter((s) => s.universityId === 'uwaterloo'),
      uottawa: allSubjects.filter((s) => s.universityId === 'uottawa'),
    };

    this.metadata.totalCourses = combined.length;
    this.metadata.waterlooCourseCount = waterlooCount;
    this.metadata.uottawaCourseCount = uottawaCount;
    this.metadata.subjectCount = allSubjects.length;
  }

  public getMetadata(): CatalogueMetadata {
    return this.metadata;
  }

  public getCourseById(id: string): Course | undefined {
    return this.courseMap.get(id);
  }

  public hasCourse(id: string): boolean {
    return this.courseMap.has(id);
  }

  public getSubjects(universityId: UniversityId = 'all'): CatalogueSubject[] {
    return this.subjectsByUni[universityId] ?? this.subjectsByUni.all;
  }

  public invalidateCache(): void {
    this.queryCache.clear();
  }

  /**
   * Returns a lightweight bootstrap list (all reviewed courses + representative featured entries)
   * while keeping full 4,346+ catalogue search/pagination fast on /api/courses.
   */
  public getBootstrapCourses(reviews: Review[]): Course[] {
    const reviewedIds = new Set(reviews.map((r) => r.courseId));
    const priorityIds = new Set([
      'math-137',
      'cs-135',
      'econ-101',
      'cs-240',
      'stat-230',
      'mat-1320',
      'gng-1105',
      'csi-2110',
    ]);
    return this.courses.filter((c) => reviewedIds.has(c.id) || priorityIds.has(c.id));
  }

  /**
   * Advisor retrieval: scores every indexed course against free-text tokens and
   * subject hints. Only text matching runs over the full catalogue; review stats
   * are computed for the shortlist, so a 4,343-course scan stays cheap.
   */
  public getAdvisorCandidates(params: {
    tokens: string[];
    subjectCodes: string[];
    universityId: UniversityId;
    reviews: Review[];
    limit?: number;
  }): Array<{
    course: Course;
    stats: CourseStats;
    matchScore: number;
    matchedKeywords: string[];
  }> {
    const limit = Math.max(1, Math.min(120, params.limit ?? 60));
    const tokens = Array.from(
      new Set(
        params.tokens
          .map((token) => token.toLowerCase().trim())
          .filter((token) => token.length >= 2)
      )
    );
    const subjectHints = new Set(params.subjectCodes.map((code) => code.toLowerCase()));

    const shortlist: Array<{
      course: Course;
      matchScore: number;
      matchedKeywords: string[];
    }> = [];

    for (const entry of this.index) {
      const { course } = entry;
      if (params.universityId !== 'all' && course.universityId !== params.universityId) {
        continue;
      }

      const matchedKeywords: string[] = [];
      let matchScore = 0;

      for (const token of tokens) {
        const compactToken = token.replace(/\s+/g, '');
        let hit = 0;
        if (compactToken.length >= 2 && entry.compactCode.includes(compactToken)) hit = 26;
        else if (entry.lowerTitle.includes(token)) hit = 22;
        else if (entry.lowerSubject === token) hit = 20;
        else if (entry.lowerDept.includes(token)) hit = 14;
        else if (entry.lowerDesc.includes(token)) hit = 10;
        if (hit > 0) {
          matchScore += hit;
          matchedKeywords.push(token);
        }
      }

      if (subjectHints.has(entry.lowerSubject)) {
        matchScore += 24;
        matchedKeywords.push(entry.lowerSubject);
      }

      if (tokens.length > 0 && matchScore === 0) continue;
      shortlist.push({ course, matchScore, matchedKeywords });
    }

    const reviewed = new Map<string, Review[]>();
    for (const review of params.reviews) {
      if (review.moderationStatus === 'hidden') continue;
      const list = reviewed.get(review.courseId) ?? [];
      list.push(review);
      reviewed.set(review.courseId, list);
    }

    const evidenceCount = (courseId: string) => reviewed.get(courseId)?.length ?? 0;
    // A request such as "bird course, under 10 hours" carries no topic words, so
    // every course ties at zero. Lead with courses that have student evidence so
    // the workload and difficulty limits can actually be checked against reviews.
    shortlist.sort(
      (a, b) => b.matchScore - a.matchScore || evidenceCount(b.course.id) - evidenceCount(a.course.id)
    );

    return shortlist.slice(0, limit).map((item) => ({
      ...item,
      stats: computeCourseStats(reviewed.get(item.course.id) ?? []),
    }));
  }

  public queryCourses(params: {
    query?: string;
    filters: CourseFilters;
    reviews: Review[];
    page?: number;
    limit?: number;
  }): PaginatedCoursesResponse {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(60, params.limit ?? 24));
    const q = (params.query ?? '').trim().toLowerCase();
    const compactQ = q.replace(/\s+/g, '');
    const { filters, reviews } = params;

    const cacheKey = JSON.stringify({
      q,
      filters,
      page,
      limit,
      revCount: reviews.length,
    });
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30_000) {
      return cached.value;
    }

    // Group reviews by courseId once
    const reviewsByCourse = new Map<string, Review[]>();
    for (const r of reviews) {
      if (r.moderationStatus === 'hidden') continue;
      const list = reviewsByCourse.get(r.courseId) ?? [];
      list.push(r);
      reviewsByCourse.set(r.courseId, list);
    }

    const statsCache = new Map<string, CourseStats>();
    const getStats = (courseId: string): CourseStats => {
      let s = statsCache.get(courseId);
      if (!s) {
        s = computeCourseStats(reviewsByCourse.get(courseId) ?? []);
        statsCache.set(courseId, s);
      }
      return s;
    };

    const scored: Array<{ course: Course; stats: CourseStats; score: number }> = [];
    const qTokens = q ? q.split(/\s+/).filter((t) => t.length >= 2) : [];

    for (const entry of this.index) {
      const { course } = entry;

      if (filters.universityId !== 'all' && course.universityId !== filters.universityId) {
        continue;
      }
      if (filters.department !== 'all') {
        const matchesDeptOrSubj =
          course.subjectCode === filters.department ||
          course.department === filters.department;
        if (!matchesDeptOrSubj) continue;
      }
      if (filters.level !== 'all' && course.level !== filters.level) {
        continue;
      }

      const courseReviews = reviewsByCourse.get(course.id);
      if (filters.term && filters.term !== 'all') {
        const needle = filters.term.toLowerCase();
        const matchesOffered = course.termsOffered.some((t) =>
          t.toLowerCase().includes(needle)
        );
        const matchesReviewTerm = Boolean(
          courseReviews?.some((r) => r.term.toLowerCase().includes(needle))
        );
        if (!matchesOffered && !matchesReviewTerm) continue;
      }

      const hasReviews = Boolean(courseReviews && courseReviews.length > 0);
      if (filters.hasReviews === 'with_reviews' && !hasReviews) continue;
      if (filters.hasReviews === 'without_reviews' && hasReviews) continue;

      let matchScore = 1;
      if (q) {
        if (entry.compactCode === compactQ) matchScore = 100;
        else if (entry.compactCode.startsWith(compactQ)) matchScore = 90;
        else if (entry.lowerSubject === q) matchScore = 82;
        else if (entry.compactCode.includes(compactQ)) matchScore = 75;
        else if (entry.lowerTitle.includes(q)) matchScore = 70;
        else if (entry.instructorNamesLower.some((n) => n.includes(q))) matchScore = 65;
        else if (entry.lowerDept.includes(q)) matchScore = 52;
        else if (entry.lowerDesc.includes(q)) matchScore = 40;
        else if (
          qTokens.length > 1 &&
          qTokens.every(
            (tk) =>
              entry.compactCode.includes(tk) ||
              entry.lowerTitle.includes(tk) ||
              entry.lowerDept.includes(tk)
          )
        ) {
          matchScore = 45;
        } else {
          continue;
        }
      }

      const stats = getStats(course.id);

      if (filters.maxDifficulty !== 'all') {
        if (stats.responseCount === 0 || stats.avgDifficulty > filters.maxDifficulty) {
          continue;
        }
      }
      if (filters.maxHours !== 'all') {
        if (stats.responseCount === 0 || stats.avgWeeklyHours > filters.maxHours) {
          continue;
        }
      }

      scored.push({ course, stats, score: matchScore });
    }

    scored.sort((a, b) => {
      const aCount = a.stats.responseCount;
      const bCount = b.stats.responseCount;

      if (filters.sortBy === 'code') {
        return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
      }
      if (filters.sortBy === 'relevance') {
        if (b.score !== a.score) return b.score - a.score;
        if (bCount !== aCount) return bCount - aCount;
        return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
      }
      if (filters.sortBy === 'recommended') {
        if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
        if (b.stats.recommendationRate !== a.stats.recommendationRate) {
          return b.stats.recommendationRate - a.stats.recommendationRate;
        }
        return bCount - aCount;
      }
      if (filters.sortBy === 'reviews') {
        if (bCount !== aCount) return bCount - aCount;
        return a.course.code.localeCompare(b.course.code, 'en', { numeric: true });
      }
      if (filters.sortBy === 'workload_asc') {
        if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
        return a.stats.avgWeeklyHours - b.stats.avgWeeklyHours;
      }
      if (filters.sortBy === 'workload_desc') {
        if ((aCount > 0) !== (bCount > 0)) return bCount > 0 ? 1 : -1;
        return b.stats.avgWeeklyHours - a.stats.avgWeeklyHours;
      }
      return 0;
    });

    const total = scored.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageSlice = scored.slice(start, start + limit);

    const statsMap: Record<string, CourseStats> = {};
    for (const item of pageSlice) {
      statsMap[item.course.id] = item.stats;
    }

    const result: PaginatedCoursesResponse = {
      courses: pageSlice.map((s) => s.course),
      statsMap,
      total,
      page: safePage,
      limit,
      totalPages,
      subjects: this.getSubjects(filters.universityId),
    };

    if (this.queryCache.size > 200) {
      this.queryCache.clear();
    }
    this.queryCache.set(cacheKey, { timestamp: Date.now(), value: result });
    return result;
  }

  /**
   * Optional live term-schedule lookup via Waterloo Open Data API v3 when
   * UWATERLOO_API_KEY is configured server-side. Never fabricates schedule status.
   */
  public async getTermScheduleStatus(course: Course): Promise<TermScheduleCheckResult> {
    if (course.universityId !== 'uwaterloo') {
      return {
        catalogStatus: course.catalogStatus ?? 'listed_in_catalog',
        termScheduleNote:
          course.termScheduleNote ??
          'Listed in demonstration reference catalogue. Check official university timetable for term offerings.',
      };
    }

    if (!this.openDataApiKey || !course.subjectCode) {
      return {
        catalogStatus: 'listed_in_catalog',
        termScheduleNote:
          'Listed in the 2026–2027 Undergraduate Studies Academic Calendar. Live term class sections are shown when connected to the Waterloo Open Data schedule feed.',
      };
    }

    const cached = this.scheduleCache.get(course.id);
    if (cached && Date.now() - cached.timestamp < 15 * 60_000) {
      return cached.value;
    }

    try {
      let term = this.cachedCurrentTerm;
      if (!term || Date.now() - term.timestamp > 60 * 60_000) {
        const termRes = await fetch('https://openapi.data.uwaterloo.ca/v3/Terms/current', {
          headers: { 'X-API-KEY': this.openDataApiKey },
          signal: AbortSignal.timeout(4500),
        });
        if (termRes.ok) {
          const termJson = (await termRes.json()) as { termCode?: string; name?: string };
          if (termJson.termCode) {
            term = {
              timestamp: Date.now(),
              termCode: termJson.termCode,
              name: termJson.name || `Term ${termJson.termCode}`,
            };
            this.cachedCurrentTerm = term;
          }
        }
      }

      if (!term) {
        return {
          catalogStatus: 'not_confirmed_for_term',
          termScheduleNote:
            'Listed in the 2026–2027 Academic Calendar. Could not confirm current term code from Waterloo Open Data API.',
        };
      }

      const catalogNumber = course.code.replace(course.subjectCode, '').trim();
      const schedRes = await fetch(
        `https://openapi.data.uwaterloo.ca/v3/ClassSchedules/${encodeURIComponent(term.termCode)}/${encodeURIComponent(course.subjectCode)}/${encodeURIComponent(catalogNumber)}`,
        {
          headers: { 'X-API-KEY': this.openDataApiKey },
          signal: AbortSignal.timeout(4500),
        }
      );

      if (schedRes.ok) {
        const classes = (await schedRes.json()) as unknown[];
        const count = Array.isArray(classes) ? classes.length : 0;
        const result: TermScheduleCheckResult =
          count > 0
            ? {
                catalogStatus: 'scheduled_for_term',
                termLabel: term.name,
                sectionCount: count,
                termScheduleNote: `Confirmed scheduled for ${term.name} (${count} class section${count === 1 ? '' : 's'} via Waterloo Open Data API).`,
              }
            : {
                catalogStatus: 'not_confirmed_for_term',
                termLabel: term.name,
                sectionCount: 0,
                termScheduleNote: `Listed in 2026–2027 Academic Calendar, but no active sections confirmed for ${term.name}.`,
              };
        this.scheduleCache.set(course.id, { timestamp: Date.now(), value: result });
        return result;
      }
    } catch {
      // Fall back gracefully without fabricating schedule confirmation
    }

    return {
      catalogStatus: 'not_confirmed_for_term',
      termScheduleNote:
        'Listed in the 2026–2027 Academic Calendar. Term-specific schedule could not be confirmed at this time.',
    };
  }
}

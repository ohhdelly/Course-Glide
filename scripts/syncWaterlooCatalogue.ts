import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_ID = '67e557ed6ed2fe2bd3a38956';
const CALENDAR_VERSION = '2026-2027 Undergraduate Studies Academic Calendar';
const KUALI_BASE = 'https://uwaterloocm.kuali.co';
const PUBLIC_CATALOG_URL = 'https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog';
const OUTPUT_PATH = path.resolve(__dirname, '../server/data/uwaterlooCatalogue.json');

interface KualiSummaryCourse {
  __catalogCourseId: string;
  pid: string;
  id: string;
  title: string;
  courseLevel?: { name?: string };
  subjectCode?: { name?: string; description?: string };
  dateStart?: string;
  catalogActivationDate?: string;
}

interface KualiCourseDetail extends KualiSummaryCourse {
  description?: string;
  credits?: { value?: string; credits?: { min?: string; max?: string } };
  prerequisites?: string;
  corequisites?: string;
  antirequisites?: string;
}

export interface ImportedWaterlooCourse {
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
}

function cleanKualiHtml(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const cleaned = raw
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(li|p|div|ul|ol)>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s*\n\s*/g, '; ')
    .replace(/[ \t]+/g, ' ')
    .replace(/^[\s;•]+|[\s;•]+$/g, '')
    .replace(/:\s*;\s*•/g, ': ')
    .replace(/;\s*•/g, '; ')
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeSubjectDepartment(subjectName: string, subjectDesc?: string): string {
  if (subjectDesc) {
    return subjectDesc.replace(/\s*\([^)]+\)\s*$/, '').trim() || subjectName;
  }
  return subjectName;
}

function parseLevel(rawLevel?: string, catalogNumber?: string): 100 | 200 | 300 | 400 | 500 {
  const num = Number(rawLevel);
  if (num === 100 || num === 200 || num === 300 || num === 400 || num === 500) {
    return num;
  }
  const digitMatch = (catalogNumber ?? '').match(/^(\d)/);
  if (digitMatch) {
    const first = Number(digitMatch[1]) * 100;
    if (first === 100 || first === 200 || first === 300 || first === 400 || first === 500) {
      return first;
    }
  }
  return 100;
}

function formatCredits(detail: KualiCourseDetail): string {
  const val = detail.credits?.value ?? detail.credits?.credits?.min;
  if (!val) return '0.50 units';
  const num = Number(val);
  if (Number.isFinite(num)) {
    return `${num.toFixed(2)} units`;
  }
  return `${val} units`;
}

async function fetchDetailWithRetry(pid: string, retries = 3): Promise<KualiCourseDetail | null> {
  const url = `${KUALI_BASE}/api/v1/catalog/course/${CATALOG_ID}/${encodeURIComponent(pid)}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        return (await res.json()) as KualiCourseDetail;
      }
      if (res.status === 404) return null;
    } catch {
      if (attempt === retries) return null;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
  }
  return null;
}

async function main() {
  console.log(`Fetching ${CALENDAR_VERSION} course list...`);
  const listRes = await fetch(`${KUALI_BASE}/api/v1/catalog/courses/${CATALOG_ID}?q=`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!listRes.ok) {
    throw new Error(`Failed to fetch catalog list: HTTP ${listRes.status}`);
  }
  const summaryList = (await listRes.json()) as KualiSummaryCourse[];
  console.log(`Found ${summaryList.length} official courses. Hydrating descriptions and requisites...`);

  const CONCURRENCY = 45;
  const results: ImportedWaterlooCourse[] = new Array(summaryList.length);
  let nextIdx = 0;
  let hydrated = 0;
  let fallbackOnly = 0;

  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= summaryList.length) break;

      const summary = summaryList[idx];
      const detail = await fetchDetailWithRetry(summary.pid);
      const source = detail ?? summary;

      const subjectCode = (source.subjectCode?.name || '').trim().toUpperCase();
      const rawCode = (source.__catalogCourseId || '').trim().toUpperCase();
      const catalogNumber = rawCode.startsWith(subjectCode)
        ? rawCode.slice(subjectCode.length)
        : rawCode;

      const id = `${subjectCode}-${catalogNumber}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const code = subjectCode && catalogNumber ? `${subjectCode} ${catalogNumber}` : rawCode;
      const department = normalizeSubjectDepartment(subjectCode, source.subjectCode?.description);

      const description =
        cleanKualiHtml(detail?.description) ||
        'Official course description listed in the University of Waterloo Undergraduate Studies Academic Calendar.';

      if (detail) hydrated++;
      else fallbackOnly++;

      results[idx] = {
        id,
        code,
        subjectCode,
        catalogNumber,
        title: (source.title || code).trim(),
        department,
        level: parseLevel(source.courseLevel?.name, catalogNumber),
        credits: detail ? formatCredits(detail) : '0.50 units',
        description,
        prerequisites: cleanKualiHtml(detail?.prerequisites),
        corequisites: cleanKualiHtml(detail?.corequisites),
        antirequisites: cleanKualiHtml(detail?.antirequisites),
        calendarVersion: CALENDAR_VERSION,
        sourceUrl: `${PUBLIC_CATALOG_URL}#/courses/view/${source.id}`,
        lastUpdated: source.catalogActivationDate || source.dateStart || '2026-04-02',
        catalogPid: source.pid,
        kualiId: source.id,
      };

      if ((idx + 1) % 500 === 0 || idx + 1 === summaryList.length) {
        console.log(`Processed ${idx + 1}/${summaryList.length} courses (${hydrated} hydrated, ${fallbackOnly} summary-only)...`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  results.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const payload = {
    calendarId: CATALOG_ID,
    calendarVersion: CALENDAR_VERSION,
    sourceName: 'University of Waterloo Undergraduate Studies Academic Calendar',
    sourceUrl: PUBLIC_CATALOG_URL,
    lastSyncedAt: new Date().toISOString(),
    courseCount: results.length,
    hydratedCount: hydrated,
    courses: results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload), 'utf-8');
  console.log(`Saved ${results.length} courses to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Waterloo catalogue sync failed:', err);
  process.exit(1);
});

import type { University, UniversityId } from '../types/course';

export type UniversityThemeId = 'neutral' | (string & {});

export interface UniversityThemePalette {
  id: UniversityThemeId;
  label: string;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  accentStrong: string;
  chart: string;
  // Derived chart tokens strictly mapped from the theme palette
  chartPrimary: string;
  chartSecondary: string;
  chartGrid: string;
  chartAxis: string;
  chartCursor: string;
}

export interface UniversityThemeConfig {
  id: UniversityThemeId;
  name: string;
  shortName: string;
  location?: string;
  palette: UniversityThemePalette;
  darkPalette: UniversityThemePalette;
}

const NEUTRAL_PALETTE: UniversityThemePalette = {
  id: 'neutral',
  label: 'CourseGlide Default',
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  surface2: '#EEF0F4',
  text: '#141619',
  textMuted: '#555963',
  border: '#DFE2E8',
  accent: '#1D4ED8',
  onAccent: '#FFFFFF',
  accentStrong: '#1D4ED8',
  chart: '#1D4ED8',
  chartPrimary: '#1D4ED8',
  chartSecondary: '#555963',
  chartGrid: '#DFE2E8',
  chartAxis: '#555963',
  chartCursor: '#EEF0F4',
};

const NEUTRAL_DARK_PALETTE: UniversityThemePalette = {
  id: 'neutral',
  label: 'CourseGlide Default (Dark)',
  bg: '#1C1B1A',
  surface: '#262523',
  surface2: '#2F2D2B',
  text: '#F2EFEA',
  textMuted: '#B8B4AC',
  border: '#3D3A37',
  accent: '#2563EB',
  onAccent: '#FFFFFF',
  accentStrong: '#93C5FD',
  chart: '#93C5FD',
  chartPrimary: '#93C5FD',
  chartSecondary: '#B8B4AC',
  chartGrid: '#3D3A37',
  chartAxis: '#B8B4AC',
  chartCursor: '#2F2D2B',
};

const UWATERLOO_PALETTE: UniversityThemePalette = {
  id: 'uwaterloo',
  label: 'University of Waterloo',
  bg: '#FAF8F3',
  surface: '#FFFFFF',
  surface2: '#F3F0E8',
  text: '#141414',
  textMuted: '#5C5A55',
  border: '#E4E0D5',
  accent: '#FFD54F',
  onAccent: '#141414',
  accentStrong: '#141414',
  chart: '#A67C00',
  chartPrimary: '#A67C00',
  chartSecondary: '#141414',
  chartGrid: '#E4E0D5',
  chartAxis: '#5C5A55',
  chartCursor: '#F3F0E8',
};

const UWATERLOO_DARK_PALETTE: UniversityThemePalette = {
  id: 'uwaterloo',
  label: 'University of Waterloo (Dark)',
  bg: '#1C1B1A',
  surface: '#262523',
  surface2: '#2F2D2B',
  text: '#F2EFEA',
  textMuted: '#B8B4AC',
  border: '#3D3A37',
  accent: '#FFD54F',
  onAccent: '#141414',
  accentStrong: '#FFD54F',
  chart: '#FFD54F',
  chartPrimary: '#FFD54F',
  chartSecondary: '#F2EFEA',
  chartGrid: '#3D3A37',
  chartAxis: '#B8B4AC',
  chartCursor: '#2F2D2B',
};

const UOTTAWA_PALETTE: UniversityThemePalette = {
  id: 'uottawa',
  label: 'University of Ottawa',
  bg: '#FAF9F8',
  surface: '#FFFFFF',
  surface2: '#F2EFEE',
  text: '#1E1E1F',
  textMuted: '#5E5B5C',
  border: '#E3DFDE',
  accent: '#8F001A',
  onAccent: '#FFFFFF',
  accentStrong: '#8F001A',
  chart: '#8F001A',
  chartPrimary: '#8F001A',
  chartSecondary: '#1E1E1F',
  chartGrid: '#E3DFDE',
  chartAxis: '#5E5B5C',
  chartCursor: '#F2EFEE',
};

const UOTTAWA_DARK_PALETTE: UniversityThemePalette = {
  id: 'uottawa',
  label: 'University of Ottawa (Dark)',
  bg: '#1C1B1A',
  surface: '#262523',
  surface2: '#2F2D2B',
  text: '#F2EFEA',
  textMuted: '#B8B4AC',
  border: '#3D3A37',
  accent: '#8F001A',
  onAccent: '#FFFFFF',
  accentStrong: '#E5566D',
  chart: '#E5566D',
  chartPrimary: '#E5566D',
  chartSecondary: '#B8B4AC',
  chartGrid: '#3D3A37',
  chartAxis: '#B8B4AC',
  chartCursor: '#2F2D2B',
};

/**
 * Single theme config registry.
 * Adding a new university requires only adding ONE entry here and ONE `[data-theme='<id>']` block in `src/index.css`.
 */
export const UNIVERSITY_THEMES: Record<string, UniversityThemeConfig> = {
  neutral: {
    id: 'neutral',
    name: 'CourseGlide Standard',
    shortName: 'All Universities',
    palette: NEUTRAL_PALETTE,
    darkPalette: NEUTRAL_DARK_PALETTE,
  },
  uwaterloo: {
    id: 'uwaterloo',
    name: 'University of Waterloo',
    shortName: 'Waterloo',
    location: 'Waterloo, ON',
    palette: UWATERLOO_PALETTE,
    darkPalette: UWATERLOO_DARK_PALETTE,
  },
  uottawa: {
    id: 'uottawa',
    name: 'University of Ottawa',
    shortName: 'uOttawa',
    location: 'Ottawa, ON',
    palette: UOTTAWA_PALETTE,
    darkPalette: UOTTAWA_DARK_PALETTE,
  },
};

export interface ThemeResolutionInput {
  routePage: 'landing' | 'explore' | 'saved' | 'how-it-works' | 'course';
  selectedUniversity: UniversityId;
  activeCourseUniversityId?: Exclude<UniversityId, 'all'> | null;
}

export function resolveActiveThemeId(input: ThemeResolutionInput): UniversityThemeId {
  if (input.routePage === 'course' && input.activeCourseUniversityId) {
    return input.activeCourseUniversityId in UNIVERSITY_THEMES
      ? input.activeCourseUniversityId
      : 'neutral';
  }

  if (input.selectedUniversity !== 'all' && input.selectedUniversity in UNIVERSITY_THEMES) {
    return input.selectedUniversity;
  }

  return 'neutral';
}

export function getThemeConfig(themeId: UniversityThemeId): UniversityThemeConfig {
  return UNIVERSITY_THEMES[themeId] ?? UNIVERSITY_THEMES.neutral;
}

export function getConfiguredUniversities(
  backendUniversities: University[] = [],
  themes: Record<string, UniversityThemeConfig> = UNIVERSITY_THEMES
): University[] {
  const byId = new Map<string, University>();
  for (const uni of backendUniversities) {
    byId.set(uni.id, uni);
  }
  for (const cfg of Object.values(themes)) {
    if (cfg.id === 'neutral') continue;
    if (!byId.has(cfg.id)) {
      byId.set(cfg.id, {
        id: cfg.id,
        name: cfg.name,
        shortName: cfg.shortName,
        location: cfg.location ?? '',
      });
    }
  }
  return Array.from(byId.values());
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function computeContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

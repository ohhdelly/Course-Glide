import type { UniversityId } from '../types/course';

export type UniversityThemeId = 'neutral' | 'uwaterloo' | 'uottawa';

export interface UniversityThemePalette {
  id: UniversityThemeId;
  label: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceMuted: string;
  surfaceAccent: string;
  surfaceHeroStart: string;
  surfaceHeroMid: string;
  headerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  accentText: string;
  accentCode: string;
  accentSubtleBorder: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  ring: string;
  ringSoft: string;
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartGrid: string;
  chartAxis: string;
  chartCursor: string;
  highlightBg: string;
  highlightText: string;
  positive: string;
  positiveBg: string;
  positiveBorder: string;
  warning: string;
  warningBg: string;
}

export interface UniversityThemeConfig {
  id: UniversityThemeId;
  name: string;
  shortName: string;
  palette: UniversityThemePalette;
  cssVars: Record<string, string>;
}

const NEUTRAL_PALETTE: UniversityThemePalette = {
  id: 'neutral',
  label: 'CourseGlide Default',
  background: '#F1F4F9',
  surface: '#FFFFFF',
  surfaceSubtle: '#F7F9FC',
  surfaceMuted: '#E9EEF6',
  surfaceAccent: '#EFF5FD',
  surfaceHeroStart: '#E8EFFA',
  surfaceHeroMid: '#F2F6FC',
  headerBg: 'rgba(250, 252, 255, 0.92)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#1D4ED8',
  accentHover: '#1E40AF',
  accentForeground: '#FFFFFF',
  accentText: '#1E40AF',
  accentCode: '#1E3A8A',
  accentSubtleBorder: 'rgba(147, 197, 253, 0.85)',
  accentSoft: 'rgba(29, 78, 216, 0.08)',
  border: 'rgba(203, 213, 225, 0.8)',
  borderStrong: 'rgba(148, 163, 184, 0.65)',
  ring: '#2563EB',
  ringSoft: 'rgba(37, 99, 235, 0.14)',
  chartPrimary: '#1D4ED8',
  chartSecondary: '#0D9488',
  chartTertiary: '#334155',
  chartGrid: '#E2E8F0',
  chartAxis: '#475569',
  chartCursor: '#F1F5F9',
  highlightBg: '#DBEAFE',
  highlightText: '#1E3A8A',
  positive: '#0F766E',
  positiveBg: '#F0FDFA',
  positiveBorder: 'rgba(153, 246, 228, 0.85)',
  warning: '#B45309',
  warningBg: '#FFFBEB',
};

const UWATERLOO_PALETTE: UniversityThemePalette = {
  id: 'uwaterloo',
  label: 'University of Waterloo',
  background: '#F8F7F2',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F1E8',
  surfaceMuted: '#ECE7D9',
  surfaceAccent: '#FFF5D9',
  surfaceHeroStart: '#FAF2D7',
  surfaceHeroMid: '#F9F6EB',
  headerBg: 'rgba(253, 252, 248, 0.92)',
  textPrimary: '#181818',
  textSecondary: '#52514D',
  textMuted: '#6B6962',
  accent: '#FED34C',
  accentHover: '#EAAB00',
  accentForeground: '#111111',
  accentText: '#7A5200',
  accentCode: '#181818',
  accentSubtleBorder: 'rgba(234, 171, 0, 0.58)',
  accentSoft: 'rgba(254, 211, 76, 0.28)',
  border: 'rgba(212, 206, 190, 0.88)',
  borderStrong: 'rgba(166, 158, 138, 0.8)',
  ring: '#EAAB00',
  ringSoft: 'rgba(234, 171, 0, 0.24)',
  chartPrimary: '#B88000',
  chartSecondary: '#181818',
  chartTertiary: '#52514D',
  chartGrid: '#EAE4D4',
  chartAxis: '#52514D',
  chartCursor: '#F6F0DF',
  highlightBg: '#FFF0C2',
  highlightText: '#181818',
  positive: '#0F766E',
  positiveBg: '#F0FDFA',
  positiveBorder: 'rgba(153, 246, 228, 0.85)',
  warning: '#9A5B00',
  warningBg: '#FFFBEB',
};

const UOTTAWA_PALETTE: UniversityThemePalette = {
  id: 'uottawa',
  label: 'University of Ottawa',
  background: '#FAF8F8',
  surface: '#FFFFFF',
  surfaceSubtle: '#F5EFF0',
  surfaceMuted: '#ECE3E5',
  surfaceAccent: '#F9ECEE',
  surfaceHeroStart: '#F6E8EB',
  surfaceHeroMid: '#FAF3F4',
  headerBg: 'rgba(253, 251, 251, 0.92)',
  textPrimary: '#2D2D2C',
  textSecondary: '#5D5858',
  textMuted: '#756F70',
  accent: '#8F001A',
  accentHover: '#750015',
  accentForeground: '#FFFFFF',
  accentText: '#8F001A',
  accentCode: '#8F001A',
  accentSubtleBorder: 'rgba(143, 0, 26, 0.30)',
  accentSoft: 'rgba(143, 0, 26, 0.09)',
  border: 'rgba(220, 209, 211, 0.88)',
  borderStrong: 'rgba(176, 160, 163, 0.78)',
  ring: '#8F001A',
  ringSoft: 'rgba(143, 0, 26, 0.16)',
  chartPrimary: '#8F001A',
  chartSecondary: '#2D2D2C',
  chartTertiary: '#9C1C30',
  chartGrid: '#ECE2E4',
  chartAxis: '#5D5858',
  chartCursor: '#F8EEF0',
  highlightBg: '#F9E4E8',
  highlightText: '#5C0011',
  positive: '#0F766E',
  positiveBg: '#F0FDFA',
  positiveBorder: 'rgba(153, 246, 228, 0.85)',
  warning: '#B45309',
  warningBg: '#FFFBEB',
};

function paletteToCssVars(p: UniversityThemePalette): Record<string, string> {
  return {
    '--background': p.background,
    '--surface': p.surface,
    '--surface-subtle': p.surfaceSubtle,
    '--surface-muted': p.surfaceMuted,
    '--surface-accent': p.surfaceAccent,
    '--surface-hero-start': p.surfaceHeroStart,
    '--surface-hero-mid': p.surfaceHeroMid,
    '--header-bg': p.headerBg,
    '--text-primary': p.textPrimary,
    '--text-secondary': p.textSecondary,
    '--text-muted': p.textMuted,
    '--accent': p.accent,
    '--accent-hover': p.accentHover,
    '--accent-foreground': p.accentForeground,
    '--accent-text': p.accentText,
    '--accent-code': p.accentCode,
    '--accent-subtle-border': p.accentSubtleBorder,
    '--accent-soft': p.accentSoft,
    '--border': p.border,
    '--border-strong': p.borderStrong,
    '--ring': p.ring,
    '--ring-soft': p.ringSoft,
    '--chart-primary': p.chartPrimary,
    '--chart-secondary': p.chartSecondary,
    '--chart-tertiary': p.chartTertiary,
    '--chart-grid': p.chartGrid,
    '--chart-axis': p.chartAxis,
    '--chart-cursor': p.chartCursor,
    '--highlight-bg': p.highlightBg,
    '--highlight-text': p.highlightText,
    '--status-positive': p.positive,
    '--status-positive-bg': p.positiveBg,
    '--status-positive-border': p.positiveBorder,
    '--status-warning': p.warning,
    '--status-warning-bg': p.warningBg,
  };
}

export const UNIVERSITY_THEMES: Record<UniversityThemeId, UniversityThemeConfig> = {
  neutral: {
    id: 'neutral',
    name: 'CourseGlide Standard',
    shortName: 'All Universities',
    palette: NEUTRAL_PALETTE,
    cssVars: paletteToCssVars(NEUTRAL_PALETTE),
  },
  uwaterloo: {
    id: 'uwaterloo',
    name: 'University of Waterloo',
    shortName: 'Waterloo',
    palette: UWATERLOO_PALETTE,
    cssVars: paletteToCssVars(UWATERLOO_PALETTE),
  },
  uottawa: {
    id: 'uottawa',
    name: 'University of Ottawa',
    shortName: 'uOttawa',
    palette: UOTTAWA_PALETTE,
    cssVars: paletteToCssVars(UOTTAWA_PALETTE),
  },
};

export interface ThemeResolutionInput {
  routePage: 'landing' | 'explore' | 'saved' | 'how-it-works' | 'course';
  selectedUniversity: UniversityId;
  activeCourseUniversityId?: Exclude<UniversityId, 'all'> | null;
}

/**
 * Resolves the active CourseGlide theme from route context and university selection:
 * - Course detail views always adopt that course's university palette.
 * - Navigating back restores the student's selected university context.
 * - Multi-university browsing ('all') uses the neutral CourseGlide theme.
 */
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

/**
 * Subtle per-university card styling tokens used when browsing multiple universities
 * simultaneously in the neutral CourseGlide theme.
 */
export function getUniversityCardAccent(
  universityId: Exclude<UniversityId, 'all'>
): {
  codeClass: string;
  hoverBorderClass: string;
  stripeColor: string;
} {
  if (universityId === 'uwaterloo') {
    return {
      codeClass: 'text-[#7A5200]',
      hoverBorderClass: 'hover:border-[#EAAB00]/65',
      stripeColor: '#EAAB00',
    };
  }
  if (universityId === 'uottawa') {
    return {
      codeClass: 'text-[#8F001A]',
      hoverBorderClass: 'hover:border-[#8F001A]/45',
      stripeColor: '#8F001A',
    };
  }
  return {
    codeClass: 'text-[var(--accent-code)]',
    hoverBorderClass: 'hover:border-[var(--accent-subtle-border)]',
    stripeColor: 'var(--accent)',
  };
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

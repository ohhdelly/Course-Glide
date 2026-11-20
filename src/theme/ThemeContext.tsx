import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getThemeConfig,
  type UniversityThemeConfig,
  type UniversityThemeId,
  type UniversityThemePalette,
} from './universityTheme';

interface ThemeContextValue {
  themeId: UniversityThemeId;
  isDark: boolean;
  config: UniversityThemeConfig;
  palette: UniversityThemePalette;
}

const DEFAULT_CONFIG = getThemeConfig('neutral');

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'neutral',
  isDark: false,
  config: DEFAULT_CONFIG,
  palette: DEFAULT_CONFIG.palette,
});

interface ThemeProviderProps {
  themeId: UniversityThemeId;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ themeId, children }) => {
  const config = useMemo(() => getThemeConfig(themeId), [themeId]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    setIsDark(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const previousThemeRef = React.useRef<UniversityThemeId | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = previousThemeRef.current;
    previousThemeRef.current = config.id;

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prevTheme !== null && prevTheme !== config.id && !reducedMotion) {
      root.classList.add('theme-transitioning');
      root.setAttribute('data-theme', config.id);
      const timer = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 270);
      return () => {
        window.clearTimeout(timer);
        root.classList.remove('theme-transitioning');
      };
    }

    root.setAttribute('data-theme', config.id);
    return undefined;
  }, [config.id]);

  const palette = isDark ? config.darkPalette : config.palette;

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: config.id,
      isDark,
      config,
      palette,
    }),
    [config, isDark, palette]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={config.id}
        className="theme-root min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export function useUniversityTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

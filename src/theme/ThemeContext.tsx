import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  getThemeConfig,
  type UniversityThemeConfig,
  type UniversityThemeId,
  type UniversityThemePalette,
} from './universityTheme';

interface ThemeContextValue {
  themeId: UniversityThemeId;
  config: UniversityThemeConfig;
  palette: UniversityThemePalette;
}

const DEFAULT_CONFIG = getThemeConfig('neutral');

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'neutral',
  config: DEFAULT_CONFIG,
  palette: DEFAULT_CONFIG.palette,
});

interface ThemeProviderProps {
  themeId: UniversityThemeId;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ themeId, children }) => {
  const config = useMemo(() => getThemeConfig(themeId), [themeId]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', config.id);
    for (const [key, value] of Object.entries(config.cssVars)) {
      root.style.setProperty(key, value);
    }
  }, [config]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: config.id,
      config,
      palette: config.palette,
    }),
    [config]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={config.id}
        style={config.cssVars as React.CSSProperties}
        className="theme-root min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export function useUniversityTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

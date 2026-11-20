import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeContrastRatio,
  getConfiguredUniversities,
  getThemeConfig,
  resolveActiveThemeId,
  UNIVERSITY_THEMES,
} from './universityTheme.ts';

test('resolveActiveThemeId handles explicit university selection and multi-university browsing', () => {
  assert.equal(
    resolveActiveThemeId({ routePage: 'landing', selectedUniversity: 'all' }),
    'neutral'
  );
  assert.equal(
    resolveActiveThemeId({ routePage: 'explore', selectedUniversity: 'uwaterloo' }),
    'uwaterloo'
  );
  assert.equal(
    resolveActiveThemeId({ routePage: 'explore', selectedUniversity: 'uottawa' }),
    'uottawa'
  );
  assert.equal(
    resolveActiveThemeId({ routePage: 'saved', selectedUniversity: 'uottawa' }),
    'uottawa'
  );
  assert.equal(
    resolveActiveThemeId({ routePage: 'how-it-works', selectedUniversity: 'uwaterloo' }),
    'uwaterloo'
  );
});

test('resolveActiveThemeId adapts to active course university and restores previous context on back', () => {
  assert.equal(
    resolveActiveThemeId({
      routePage: 'course',
      selectedUniversity: 'all',
      activeCourseUniversityId: 'uottawa',
    }),
    'uottawa'
  );
  assert.equal(
    resolveActiveThemeId({
      routePage: 'explore',
      selectedUniversity: 'all',
    }),
    'neutral'
  );
  assert.equal(
    resolveActiveThemeId({
      routePage: 'course',
      selectedUniversity: 'uwaterloo',
      activeCourseUniversityId: 'uwaterloo',
    }),
    'uwaterloo'
  );
  assert.equal(
    resolveActiveThemeId({
      routePage: 'explore',
      selectedUniversity: 'uwaterloo',
    }),
    'uwaterloo'
  );
});

test('all light and dark university themes meet WCAG AA contrast (>= 4.5:1) for text and muted text', () => {
  for (const theme of Object.values(UNIVERSITY_THEMES)) {
    for (const [mode, p] of [
      ['light', theme.palette],
      ['dark', theme.darkPalette],
    ] as const) {
      assert.ok(
        computeContrastRatio(p.text, p.bg) >= 4.5,
        `${theme.id} (${mode}) text on bg`
      );
      assert.ok(
        computeContrastRatio(p.text, p.surface) >= 4.5,
        `${theme.id} (${mode}) text on surface`
      );
      assert.ok(
        computeContrastRatio(p.text, p.surface2) >= 4.5,
        `${theme.id} (${mode}) text on surface2`
      );
      assert.ok(
        computeContrastRatio(p.textMuted, p.bg) >= 4.5,
        `${theme.id} (${mode}) textMuted on bg`
      );
      assert.ok(
        computeContrastRatio(p.textMuted, p.surface) >= 4.5,
        `${theme.id} (${mode}) textMuted on surface`
      );
      assert.ok(
        computeContrastRatio(p.textMuted, p.surface2) >= 4.5,
        `${theme.id} (${mode}) textMuted on surface2`
      );
      assert.ok(
        computeContrastRatio(p.onAccent, p.accent) >= 4.5,
        `${theme.id} (${mode}) onAccent on accent`
      );
      assert.ok(
        computeContrastRatio(p.accentStrong, p.surface) >= (mode === 'dark' ? 3.0 : 4.5),
        `${theme.id} (${mode}) accentStrong on surface`
      );
      assert.ok(
        computeContrastRatio(p.chart, p.surface) >= 3.0,
        `${theme.id} (${mode}) chart on surface`
      );
      assert.ok(
        computeContrastRatio(p.chart, p.bg) >= 3.0,
        `${theme.id} (${mode}) chart on bg`
      );
    }
  }
});

test('Waterloo and Ottawa themes match exact specified token values and never use gold text or chart on light background', () => {
  const waterloo = getThemeConfig('uwaterloo').palette;
  assert.equal(waterloo.bg, '#FAF8F3');
  assert.equal(waterloo.surface, '#FFFFFF');
  assert.equal(waterloo.surface2, '#F3F0E8');
  assert.equal(waterloo.text, '#141414');
  assert.equal(waterloo.textMuted, '#5C5A55');
  assert.equal(waterloo.border, '#E4E0D5');
  assert.equal(waterloo.accent, '#FFD54F');
  assert.equal(waterloo.onAccent, '#141414');
  assert.equal(waterloo.accentStrong, '#141414');
  assert.equal(waterloo.chart, '#A67C00');
  assert.notEqual(waterloo.accentStrong.toUpperCase(), '#FFD54F');
  assert.notEqual(waterloo.chart.toUpperCase(), '#FFD54F');

  const ottawa = getThemeConfig('uottawa').palette;
  assert.equal(ottawa.bg, '#FAF9F8');
  assert.equal(ottawa.surface, '#FFFFFF');
  assert.equal(ottawa.surface2, '#F2EFEE');
  assert.equal(ottawa.text, '#1E1E1F');
  assert.equal(ottawa.textMuted, '#5E5B5C');
  assert.equal(ottawa.border, '#E3DFDE');
  assert.equal(ottawa.accent, '#8F001A');
  assert.equal(ottawa.onAccent, '#FFFFFF');
  assert.equal(ottawa.accentStrong, '#8F001A');
  assert.equal(ottawa.chart, '#8F001A');

  const waterlooDark = getThemeConfig('uwaterloo').darkPalette;
  assert.equal(waterlooDark.bg, '#1C1B1A');
  assert.equal(waterlooDark.surface, '#262523');
  assert.equal(waterlooDark.surface2, '#2F2D2B');
  assert.equal(waterlooDark.border, '#3D3A37');
  assert.equal(waterlooDark.text, '#F2EFEA');
  assert.equal(waterlooDark.textMuted, '#B8B4AC');
  assert.equal(waterlooDark.accent, '#FFD54F');
  assert.equal(waterlooDark.onAccent, '#141414');
  assert.equal(waterlooDark.accentStrong, '#FFD54F');

  const ottawaDark = getThemeConfig('uottawa').darkPalette;
  assert.equal(ottawaDark.bg, '#1C1B1A');
  assert.equal(ottawaDark.surface, '#262523');
  assert.equal(ottawaDark.surface2, '#2F2D2B');
  assert.equal(ottawaDark.border, '#3D3A37');
  assert.equal(ottawaDark.text, '#F2EFEA');
  assert.equal(ottawaDark.textMuted, '#B8B4AC');
  assert.equal(ottawaDark.accent, '#8F001A');
  assert.equal(ottawaDark.onAccent, '#FFFFFF');
  assert.equal(ottawaDark.accentStrong, '#E5566D');
});

test('adding a new university config entry surfaces it automatically in switcher options', () => {
  const extendedThemes = {
    ...UNIVERSITY_THEMES,
    utoronto: {
      ...UNIVERSITY_THEMES.uwaterloo,
      id: 'utoronto',
      name: 'University of Toronto',
      shortName: 'U of T',
      location: 'Toronto, ON',
    },
  };
  const list = getConfiguredUniversities([], extendedThemes);
  assert.ok(list.some((u) => u.id === 'uwaterloo'));
  assert.ok(list.some((u) => u.id === 'uottawa'));
  assert.ok(list.some((u) => u.id === 'utoronto' && u.name === 'University of Toronto'));
});

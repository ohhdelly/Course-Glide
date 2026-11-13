import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeContrastRatio,
  getThemeConfig,
  getUniversityCardAccent,
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
  // Browsing All Universities ('all'), then opening a uOttawa course -> uOttawa theme
  assert.equal(
    resolveActiveThemeId({
      routePage: 'course',
      selectedUniversity: 'all',
      activeCourseUniversityId: 'uottawa',
    }),
    'uottawa'
  );

  // Navigating back to explore restores neutral CourseGlide theme
  assert.equal(
    resolveActiveThemeId({
      routePage: 'explore',
      selectedUniversity: 'all',
    }),
    'neutral'
  );

  // Browsing Waterloo, opening a Waterloo course -> Waterloo theme, navigating back -> Waterloo
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

test('all university themes meet WCAG AA contrast requirements for text and UI graphics', () => {
  for (const theme of Object.values(UNIVERSITY_THEMES)) {
    const p = theme.palette;

    // Primary text on background, surface, and soft accent surfaces (>= 4.5:1)
    assert.ok(
      computeContrastRatio(p.textPrimary, p.background) >= 4.5,
      `${theme.id} textPrimary on background`
    );
    assert.ok(
      computeContrastRatio(p.textPrimary, p.surface) >= 4.5,
      `${theme.id} textPrimary on surface`
    );
    assert.ok(
      computeContrastRatio(p.textPrimary, p.surfaceAccent) >= 4.5,
      `${theme.id} textPrimary on surfaceAccent`
    );

    // Secondary text on surface and subtle surface (>= 4.5:1)
    assert.ok(
      computeContrastRatio(p.textSecondary, p.surface) >= 4.5,
      `${theme.id} textSecondary on surface`
    );
    assert.ok(
      computeContrastRatio(p.textSecondary, p.surfaceSubtle) >= 4.5,
      `${theme.id} textSecondary on surfaceSubtle`
    );

    // Primary CTA button foreground on accent background & hover (>= 4.5:1)
    assert.ok(
      computeContrastRatio(p.accentForeground, p.accent) >= 4.5,
      `${theme.id} accentForeground on accent`
    );
    assert.ok(
      computeContrastRatio(p.accentForeground, p.accentHover) >= 4.5,
      `${theme.id} accentForeground on accentHover`
    );

    // Accent text links on white surface & accent surface (>= 4.5:1)
    assert.ok(
      computeContrastRatio(p.accentText, p.surface) >= 4.5,
      `${theme.id} accentText on surface`
    );
    assert.ok(
      computeContrastRatio(p.accentText, p.surfaceAccent) >= 4.5,
      `${theme.id} accentText on surfaceAccent`
    );

    // Inline review highlight text on highlight background (>= 4.5:1)
    assert.ok(
      computeContrastRatio(p.highlightText, p.highlightBg) >= 4.5,
      `${theme.id} highlightText on highlightBg`
    );

    // Chart primary & secondary graphics on card surface (>= 3.0:1 WCAG non-text UI contrast)
    assert.ok(
      computeContrastRatio(p.chartPrimary, p.surface) >= 3.0,
      `${theme.id} chartPrimary on surface`
    );
    assert.ok(
      computeContrastRatio(p.chartSecondary, p.surface) >= 3.0,
      `${theme.id} chartSecondary on surface`
    );
  }
});

test('Waterloo and Ottawa themes reflect official brand color specifications', () => {
  const waterloo = getThemeConfig('uwaterloo').palette;
  assert.equal(waterloo.accent, '#FED34C');
  assert.equal(waterloo.accentHover, '#EAAB00');
  assert.equal(waterloo.background, '#F8F7F2');
  assert.equal(waterloo.surfaceAccent, '#FFF5D9');
  assert.equal(waterloo.textPrimary, '#181818');

  const ottawa = getThemeConfig('uottawa').palette;
  assert.equal(ottawa.accent, '#8F001A');
  assert.equal(ottawa.background, '#FAF8F8');
  assert.equal(ottawa.surfaceAccent, '#F9ECEE');
  assert.equal(ottawa.textPrimary, '#2D2D2C');

  const uwCard = getUniversityCardAccent('uwaterloo');
  const uoCard = getUniversityCardAccent('uottawa');
  assert.equal(uwCard.stripeColor, '#EAAB00');
  assert.equal(uoCard.stripeColor, '#8F001A');
});

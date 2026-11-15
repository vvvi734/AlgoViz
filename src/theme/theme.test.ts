import { describe, expect, it } from 'vitest';
import {
  applyThemeAttributes,
  isThemePreference,
  prefersDarkFromMedia,
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './resolve';

describe('theme resolution (pure)', () => {
  it('honours an explicit light/dark choice regardless of the OS', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the OS only in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('rejects unknown stored values and falls back to system', () => {
    expect(isThemePreference('sepia')).toBe(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readStoredPreference(window.localStorage)).toBe('system');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readStoredPreference(window.localStorage)).toBe('light');
    expect(readStoredPreference(null)).toBe('system');
  });

  it('writes resolved theme, raw preference and color-scheme to the root', () => {
    const root = document.createElement('html');
    applyThemeAttributes(root, 'light', 'system');
    expect(root.dataset.theme).toBe('light');
    expect(root.dataset.themePreference).toBe('system');
    expect(root.style.colorScheme).toBe('light');
  });

  it('parses media query strings defensively', () => {
    expect(prefersDarkFromMedia('(prefers-color-scheme: dark)')).toBe(true);
    expect(prefersDarkFromMedia('(prefers-color-scheme: light)')).toBe(false);
  });
});

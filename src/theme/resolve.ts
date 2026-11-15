export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'algolens-theme';

export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Pure resolution: an explicit choice wins, otherwise follow the OS setting. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}

export function readStoredPreference(storage: Pick<Storage, 'getItem'> | null): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function prefersDarkFromMedia(query: string): boolean {
  return /dark/i.test(query) && !/light/i.test(query);
}

/** Writes both the resolved theme and the raw preference to the root element. */
export function applyThemeAttributes(
  root: HTMLElement,
  resolved: ResolvedTheme,
  preference: ThemePreference,
): void {
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyThemeAttributes,
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from './resolve';
import { safeSet } from '../runtime/storage';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference(typeof window === 'undefined' ? null : window.localStorage),
  );
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);
  const resolved = resolveTheme(preference, systemDark);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => setSystemDark(event.matches);
    onChange(query);
    // Safari < 14 only supports the deprecated addListener API.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange as (event: MediaQueryListEvent) => void);
      return () => query.removeEventListener('change', onChange as (event: MediaQueryListEvent) => void);
    }
    query.addListener(onChange as (event: MediaQueryListEvent) => void);
    return () => query.removeListener(onChange as (event: MediaQueryListEvent) => void);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      applyThemeAttributes(document.documentElement, resolved, preference);
    }
  }, [resolved, preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    safeSet(THEME_STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

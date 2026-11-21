import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { THEME_PREFERENCES, type ThemePreference } from '../theme/resolve';

export function TopBar() {
  const { preference, setPreference } = useTheme();
  const { t, lang, toggleLang } = useI18n();
  const headerRef = useRef<HTMLElement | null>(null);
  const labels: Record<ThemePreference, string> = {
    light: t('themeLight'),
    dark: t('themeDark'),
    system: t('themeSystem'),
  };

  // Publish the real sticky-bar height so the directory card can start below
  // it instead of sliding underneath. ResizeObserver keeps this correct after
  // a language switch, theme control change or narrow-screen wrap.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof document === 'undefined') return;
    const sync = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) {
        document.documentElement.style.setProperty('--topbar-height', `${height}px`);
      }
    };
    sync();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', sync);
      return () => window.removeEventListener('resize', sync);
    }
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="topbar" ref={headerRef}>
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="24" height="24" focusable="false">
            <rect x="4" y="20" width="24" height="6" rx="2" fill="currentColor" opacity="0.95" />
            <rect x="7" y="12" width="18" height="6" rx="2" fill="currentColor" opacity="0.75" />
            <rect x="10" y="4" width="12" height="6" rx="2" fill="currentColor" opacity="0.55" />
          </svg>
        </span>
        <span data-testid="brand-name">AlgoViz<small>{t('brandTagline')}</small></span>
      </div>
      <div className="topright">
        <span className="pill smalltext" data-testid="offline-badge">● LOCAL FIRST</span>
        <label className="smalltext muted" htmlFor="theme-select" aria-label={t('themeLabel')}>
          {t('themeLabel')}
        </label>
        <select
          id="theme-select"
          className="select theme-select"
          value={preference}
          title={t('themeHint')}
          aria-label={t('themeLabel')}
          data-testid="theme-select"
          onChange={(event) => setPreference(event.target.value as ThemePreference)}
        >
          {THEME_PREFERENCES.map((value) => (
            <option key={value} value={value}>{labels[value]}</option>
          ))}
        </select>
        <button className="btn ghost" onClick={toggleLang} aria-label="Switch language">
          {lang === 'zh' ? 'EN / 中文' : '中文 / EN'}
        </button>
      </div>
    </header>
  );
}

import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { THEME_PREFERENCES, type ThemePreference } from '../theme/resolve';

export function TopBar() {
  const { preference, setPreference } = useTheme();
  const { t, lang, toggleLang, b } = useI18n();
  const languageLabel = `${lang === 'zh' ? 'EN / 中文' : '中文 / EN'} · ${b('切换语言', 'Switch language')}`;
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
        <img
          className="logo"
          data-testid="brand-mark"
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
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
        <button className="btn ghost" onClick={toggleLang} aria-label={languageLabel}>
          {lang === 'zh' ? 'EN / 中文' : '中文 / EN'}
        </button>
      </div>
    </header>
  );
}

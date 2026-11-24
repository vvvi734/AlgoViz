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
        <a
          className="github-link"
          data-testid="github-link"
          href="https://github.com/vvvi734/AlgoViz"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={b('GitHub 仓库', 'GitHub repository')}
          title={b('打开 GitHub 仓库', 'Open the GitHub repository')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            />
          </svg>
        </a>
      </div>
    </header>
  );
}

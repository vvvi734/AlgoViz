import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { THEME_PREFERENCES, type ThemePreference } from '../theme/resolve';

export function TopBar({ onOpenApi }: { onOpenApi: () => void }) {
  const { preference, setPreference } = useTheme();
  const { t, lang, toggleLang } = useI18n();
  const labels: Record<ThemePreference, string> = {
    light: t('themeLight'),
    dark: t('themeDark'),
    system: t('themeSystem'),
  };
  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo">∑</span>
        <span>AlgoLens<small>INTERACTIVE ALGORITHM STUDIO</small></span>
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
        <button className="btn" onClick={onOpenApi}>{t('apiConfig')}</button>
      </div>
    </header>
  );
}

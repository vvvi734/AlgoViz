import type { ViewName } from '../app/types';
import { useI18n } from '../i18n/I18nProvider';

const VIEWS: Array<{ id: ViewName; key: string }> = [
  { id: 'learn', key: 'learn' },
  { id: 'practice', key: 'practice' },
  { id: 'custom', key: 'custom' },
];

export function NavTabs({ view, onChange }: { view: ViewName; onChange: (view: ViewName) => void }) {
  const { t } = useI18n();
  return (
    <nav className="nav" aria-label="Sections">
      {VIEWS.map(({ id, key }) => (
        <button
          key={id}
          className={`tab ${view === id ? 'active' : ''}`}
          aria-current={view === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          {t(key)}
        </button>
      ))}
    </nav>
  );
}

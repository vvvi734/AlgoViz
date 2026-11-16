import { useEffect, useRef, useState } from 'react';
import type { ViewName } from '../app/types';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Stage 7A: the primary navigation keeps only the two live destinations.
 * Problem sets / AI import remain fully working but move behind a clearly
 * labelled "More tools" menu instead of competing with the learning lab.
 */
export function NavTabs({
  view,
  onChange,
  onOpenApi,
}: {
  view: ViewName;
  onChange: (view: ViewName) => void;
  onOpenApi?: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const select = (next: ViewName) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <nav className="nav" aria-label="Sections">
      <button
        className={`tab ${view === 'learn' ? 'active' : ''}`}
        aria-current={view === 'learn' ? 'page' : undefined}
        data-testid="nav-learn"
        onClick={() => select('learn')}
      >
        {t('navLearn')}
      </button>
      <button
        className={`tab ${view === 'packs' ? 'active' : ''}`}
        aria-current={view === 'packs' ? 'page' : undefined}
        data-testid="nav-packs"
        onClick={() => select('packs')}
      >
        {t('packs')}
      </button>
      <div className="navmore" ref={wrap}>
        <button
          type="button"
          className={`tab navmore-trigger${open ? ' open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          data-testid="nav-more"
          onClick={() => setOpen((value) => !value)}
        >
          {t('navMoreTools')} <span aria-hidden="true">▾</span>
        </button>
        {open && (
          <div className="navmore-menu" role="menu" data-testid="nav-more-menu">
            <button type="button" role="menuitem" data-testid="nav-practice" onClick={() => select('practice')}>
              <span>{t('navPractice')}</span>
              <span className="tag tag-muted">{t('navPaused')}</span>
            </button>
            <button type="button" role="menuitem" data-testid="nav-custom" onClick={() => select('custom')}>
              <span>{t('navCustom')}</span>
              <span className="tag">{t('navExperimental')}</span>
            </button>
            {onOpenApi && (
              <button
                type="button"
                role="menuitem"
                data-testid="nav-api-settings"
                onClick={() => {
                  setOpen(false);
                  onOpenApi();
                }}
              >
                {t('apiConfig')}
              </button>
            )}
            <p className="navmore-note">{t('navMoreNote')}</p>
          </div>
        )}
      </div>
    </nav>
  );
}

import { useId, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UI-02: the course moved into the always-visible explanation rail, so the
 * bottom tab strip now owns only the secondary diagnostic/tool panels.
 */
export type WorkspaceTabId = 'reference' | 'state' | 'mentor' | 'tools';

const ORDER: WorkspaceTabId[] = ['reference', 'state', 'mentor', 'tools'];

/**
 * Accessible tab strip for the secondary workspace panels.
 *
 * UX-04: the whole strip is an advanced, collapsed-by-default panel. Non-lazy
 * panels stay mounted while inactive (`hidden` only toggles rendering), so the
 * mentor's answers and the selected call frame survive tab switches and
 * collapse/expand. `lazyPanels` are withheld until the strip is opened, so the
 * read-only reference viewer never loads Monaco during first paint.
 */
export function WorkspaceTabs({
  active,
  onChange,
  labels,
  panels,
  lazyPanels = [],
}: {
  active: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
  labels: Record<WorkspaceTabId, string>;
  panels: Record<WorkspaceTabId, ReactNode>;
  lazyPanels?: readonly WorkspaceTabId[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  const move = (direction: 1 | -1) => {
    const current = ORDER.indexOf(active);
    const next = ORDER[(current + direction + ORDER.length) % ORDER.length];
    onChange(next);
    document.getElementById(`workspace-tab-${next}`)?.focus();
  };

  return (
    <div
      className={`workspace-tabs${open ? ' is-open' : ' is-collapsed'}`}
      data-testid="workspace-tabs"
      data-expanded={open}
    >
      <header className="workspace-tabs-head">
        <div className="workspace-tabs-heading">
          <span className="workspace-tabs-kicker">{t('workspaceAdvanced')}</span>
          <span className="workspace-tabs-hint">{t('workspaceAdvancedHint')}</span>
        </div>
        <button
          type="button"
          className="btn small workspace-tabs-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          data-testid="workspace-tabs-toggle"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t('workspaceCollapse') : t('workspaceExpand')}
          <span className="workspace-tabs-chevron" aria-hidden="true">
            {open ? '▴' : '▾'}
          </span>
        </button>
      </header>
      <div id={bodyId} className="workspace-tabs-body" hidden={!open}>
        <div className="workspace-tablist" role="tablist" aria-label={t('workspaceTabsAria')}>
          {ORDER.map((id) => (
            <button
              key={id}
              id={`workspace-tab-${id}`}
              type="button"
              role="tab"
              className={`workspace-tab${active === id ? ' active' : ''}`}
              aria-selected={active === id}
              aria-controls={`workspace-panel-${id}`}
              tabIndex={active === id ? 0 : -1}
              data-testid={`workspace-tab-${id}`}
              onClick={() => onChange(id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  move(1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  move(-1);
                }
              }}
            >
              {labels[id]}
            </button>
          ))}
        </div>
        {ORDER.map((id) => (
          <section
            key={id}
            id={`workspace-panel-${id}`}
            role="tabpanel"
            aria-labelledby={`workspace-tab-${id}`}
            hidden={active !== id}
            className="workspace-tabpanel"
            data-testid={`workspace-panel-${id}`}
          >
            {lazyPanels.includes(id) && !open ? null : panels[id]}
          </section>
        ))}
      </div>
    </div>
  );
}

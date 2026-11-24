import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UI-02 / CORE-REFINE-01 — read-only reference-code panel.
 *
 * Variables and the call stack live in the always-visible learning rail, so this
 * collapsed-by-default panel owns exactly one thing: read-only C / C++ / Python
 * reference code. The panel body is not mounted until it is opened, keeping
 * Monaco out of first paint and out of the primary animation space.
 */
export function WorkspaceTabs({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef(false);

  // A shortcut collapse removes thousands of pixels of read-only source. Do the
  // return scroll and focus in the same layout pass as that DOM change so the
  // browser never paints the temporary end-of-document position first.
  useLayoutEffect(() => {
    if (!returnFocusRef.current) return;
    returnFocusRef.current = false;
    const toggle = toggleRef.current;
    if (!toggle) return;
    if (typeof toggle.scrollIntoView === 'function') {
      toggle.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
    toggle.focus({ preventScroll: true });
  }, [open]);

  const collapseFromPanel = () => {
    if (!open) return;
    returnFocusRef.current = true;
    setOpen(false);
  };

  return (
    <section
      className={`workspace-tabs${open ? ' is-open' : ' is-collapsed'}`}
      data-testid="workspace-tabs"
      data-expanded={open}
    >
      <header className="workspace-tabs-head">
        <div className="workspace-tabs-heading">
          <span className="workspace-tabs-kicker">{t('workspaceReference')}</span>
          <span className="workspace-tabs-hint">{t('workspaceReferenceHint')}</span>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="btn small workspace-tabs-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          data-testid="workspace-tabs-toggle"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t('workspaceCollapse') : t('workspaceExpand')}
          <span className="workspace-tabs-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      </header>
      <div id={bodyId} className="workspace-tabs-body" hidden={!open} data-testid="workspace-tabs-body">
        <div className="workspace-tabpanel" data-testid="workspace-panel-reference">
          {open ? children : null}
        </div>
        {open ? (
          <div className="panel-collapse-rail reference-collapse-rail">
            <button
              type="button"
              className="btn small panel-collapse-button"
              data-testid="reference-quick-collapse"
              aria-controls={bodyId}
              onClick={collapseFromPanel}
            >
              <span className="panel-collapse-chevron" aria-hidden="true">▲</span>
              {t('referenceQuickCollapse')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

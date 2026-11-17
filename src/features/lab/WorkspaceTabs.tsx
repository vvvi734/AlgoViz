import type { ReactNode } from 'react';

/**
 * UI-02: the course moved into the always-visible explanation rail, so the
 * bottom tab strip now owns only the secondary diagnostic/tool panels.
 */
export type WorkspaceTabId = 'state' | 'mentor' | 'tools';

const ORDER: WorkspaceTabId[] = ['state', 'mentor', 'tools'];

/**
 * Accessible tab strip for the secondary workspace panels.
 *
 * Panels stay mounted while inactive (`hidden` only toggles rendering), so the
 * mentor's answers, the selected call frame and the session preview survive tab
 * switches. Monaco and the timeline live outside this component entirely.
 */
export function WorkspaceTabs({
  active,
  onChange,
  labels,
  panels,
}: {
  active: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
  labels: Record<WorkspaceTabId, string>;
  panels: Record<WorkspaceTabId, ReactNode>;
}) {
  const move = (direction: 1 | -1) => {
    const current = ORDER.indexOf(active);
    const next = ORDER[(current + direction + ORDER.length) % ORDER.length];
    onChange(next);
    document.getElementById(`workspace-tab-${next}`)?.focus();
  };

  return (
    <div className="workspace-tabs" data-testid="workspace-tabs">
      <div className="workspace-tablist" role="tablist" aria-label={labels.state}>
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
          {panels[id]}
        </section>
      ))}
    </div>
  );
}

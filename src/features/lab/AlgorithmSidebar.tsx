import { useEffect, useMemo, useRef } from 'react';
import type { AlgorithmCatalog, AlgorithmEntry, AlgorithmGroup } from '../../domain/algorithms/types';
import { groupLabel } from '../../domain/algorithms/examples';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * UI-01: grouped, collapsible algorithm directory.
 *
 * The section list is DERIVED from the registry on every render:
 * `groups` supplies the order and ids, `catalog[].group` decides membership and
 * `groupLabel()` supplies the localized title. No algorithm id, section id or
 * item count is written into this component, so adding an algorithm (or a whole
 * group) in the registry shows up here without touching this file.
 *
 * The directory holds no execution state. Collapsing a section or the whole
 * sidebar only changes presentation; `currentAlgo`, the trace and the playhead
 * belong to the lab controller and are passed straight through.
 */

interface Section {
  id: string;
  label: string;
  items: Array<[string, AlgorithmEntry]>;
}

export function AlgorithmSidebar({
  catalog,
  groups,
  currentAlgo,
  onSelect,
  collapsed,
  onToggleCollapsed,
  isGroupOpen,
  onToggleGroup,
  onOpenGroup,
}: {
  catalog: AlgorithmCatalog;
  groups: Array<[AlgorithmGroup, string]>;
  currentAlgo: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isGroupOpen: (groupId: string) => boolean;
  onToggleGroup: (groupId: string) => void;
  onOpenGroup: (groupId: string) => void;
}) {
  const { lang, pick, t } = useI18n();

  const sections = useMemo<Section[]>(() => {
    const order: string[] = groups.map(([groupId]) => groupId);
    // `custom` is created by AI import at runtime and is not part of the
    // generated registry, so append it only when the catalogue actually has it.
    if (catalog.custom && !order.includes('custom')) order.push('custom');
    return order
      .map((id) => ({
        id,
        label: groupLabel(id, lang),
        items: Object.entries(catalog).filter(([, entry]) => entry.group === id),
      }))
      .filter((section) => section.items.length > 0);
  }, [catalog, groups, lang]);

  const currentEntry = catalog[currentAlgo];
  const currentGroup = currentEntry?.group ?? null;

  // Selecting an algorithm whose section is folded (mobile select, rail, …)
  // reveals it. The ref keeps the learner's initial folds intact on mount.
  const previousAlgo = useRef(currentAlgo);
  useEffect(() => {
    if (previousAlgo.current === currentAlgo) return;
    previousAlgo.current = currentAlgo;
    if (currentGroup) onOpenGroup(currentGroup);
  }, [currentAlgo, currentGroup, onOpenGroup]);

  const directoryLabel = t('algorithmDirectory');

  if (collapsed) {
    return (
      <aside
        className="panel pad sidebar sidebar-rail"
        id="algorithm-directory"
        aria-label={directoryLabel}
        data-testid="sidebar"
        data-collapsed="true"
      >
        <button
          type="button"
          className="rail-expand"
          onClick={onToggleCollapsed}
          aria-expanded={false}
          aria-controls="algorithm-directory"
          aria-label={t('expandDirectory')}
          title={t('expandDirectory')}
          data-testid="sidebar-expand"
        >
          <span aria-hidden="true">»</span>
        </button>

        <div className="rail-groups" role="group" aria-label={directoryLabel}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className="rail-group"
              data-testid={`rail-group-${section.id}`}
              data-has-current={section.id === currentGroup ? 'true' : 'false'}
              aria-label={section.label}
              title={section.label}
              onClick={() => {
                onOpenGroup(section.id);
                onToggleCollapsed();
              }}
            >
              <span aria-hidden="true">{section.label.slice(0, 1)}</span>
            </button>
          ))}
        </div>

        {currentEntry && (
          <button
            type="button"
            className="rail-current"
            onClick={onToggleCollapsed}
            aria-label={pick(currentEntry.name)}
            title={pick(currentEntry.name)}
            data-testid="rail-current"
          >
            <span aria-hidden="true">{currentEntry.icon}</span>
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      className="panel pad sidebar"
      id="algorithm-directory"
      aria-label={directoryLabel}
      data-testid="sidebar"
      data-collapsed="false"
    >
      <div className="sidebar-head">
        <span className="sidebar-title">{directoryLabel}</span>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggleCollapsed}
          aria-expanded
          aria-controls="algorithm-directory"
          aria-label={t('hideDirectory')}
          title={t('hideDirectory')}
          data-testid="sidebar-collapse"
        >
          <span aria-hidden="true">«</span>
        </button>
      </div>

      <nav className="sidebar-groups" aria-label={directoryLabel}>
        {sections.map((section) => {
          const open = isGroupOpen(section.id);
          const holdsCurrent = section.id === currentGroup;
          return (
            <section className="alg-group" key={section.id} data-group={section.id}>
              <button
                type="button"
                className="alg-group-head"
                aria-expanded={open}
                aria-controls={`alg-group-${section.id}`}
                data-testid={`group-${section.id}`}
                data-has-current={holdsCurrent ? 'true' : 'false'}
                onClick={() => onToggleGroup(section.id)}
              >
                <span className="alg-group-chevron" aria-hidden="true">›</span>
                <span className="alg-group-name">{section.label}</span>
                {holdsCurrent && <span className="alg-group-dot" aria-hidden="true" />}
                <span className="alg-group-count" aria-hidden="true">{section.items.length}</span>
              </button>

              <div
                className="alg-group-items"
                id={`alg-group-${section.id}`}
                data-open={open ? 'true' : 'false'}
                aria-hidden={!open}
                inert={!open}
              >
                <div className="alg-group-items-inner">
                  {section.items.map(([id, entry]) => {
                    const active = id === currentAlgo;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`alg-item ${active ? 'active' : ''}`}
                        onClick={() => onSelect(id)}
                        data-testid={`algo-${id}`}
                        aria-current={active ? 'true' : undefined}
                      >
                        <span className="alg-icon">{entry.icon}</span>
                        <span className="alg-name">{pick(entry.name)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}

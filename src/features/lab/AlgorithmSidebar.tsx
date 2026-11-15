import type { AlgorithmCatalog } from '../../domain/algorithms/types';
import { groupLabel } from '../../domain/algorithms/examples';
import { useI18n } from '../../i18n/I18nProvider';

export function AlgorithmSidebar({
  catalog,
  groups,
  currentAlgo,
  onSelect,
}: {
  catalog: AlgorithmCatalog;
  groups: Array<[string, string]>;
  currentAlgo: string;
  onSelect: (id: string) => void;
}) {
  const { lang } = useI18n();
  const visibleGroups: string[] = catalog.custom ? [...groups.map(([g]) => g), 'custom'] : groups.map(([g]) => g);
  return (
    <aside className="panel pad sidebar" aria-label="Algorithms">
      {visibleGroups.map((group) => (
        <div key={group}>
          <h3>{groupLabel(group, lang)}</h3>
          {Object.entries(catalog)
            .filter(([, entry]) => entry.group === group)
            .map(([id, entry]) => (
              <button
                key={id}
                className={`alg-item ${id === currentAlgo ? 'active' : ''}`}
                onClick={() => onSelect(id)}
                data-testid={`algo-${id}`}
              >
                <span className="alg-icon">{entry.icon}</span>
                {entry.name[lang === 'zh' ? 0 : 1] ?? id}
              </button>
            ))}
        </div>
      ))}
    </aside>
  );
}

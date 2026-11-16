import { useI18n } from '../../i18n/I18nProvider';
import type { BinaryTreeTraversal } from '../../domain/trace/schema';
import type { TreeMode } from '../../domain/algorithms/treeTraversalExamples';
import { treeModeFromInput } from '../../domain/algorithms/treeTraversalExamples';

const MODES: Array<{ mode: TreeMode; label: string; testId: string }> = [
  { mode: 'preorder', label: 'treeModePreorder', testId: 'tree-mode-preorder' },
  { mode: 'inorder', label: 'treeModeInorder', testId: 'tree-mode-inorder' },
  { mode: 'postorder', label: 'treeModePostorder', testId: 'tree-mode-postorder' },
];

export function TreeTraversalPicker({
  inputJson,
  actualTraversal,
  onSelect,
}: {
  inputJson: string;
  actualTraversal: BinaryTreeTraversal | null;
  onSelect: (mode: TreeMode) => void;
}) {
  const { t } = useI18n();
  let selected: TreeMode = 'inorder';
  try {
    selected = treeModeFromInput(JSON.parse(inputJson));
  } catch {
    selected = 'inorder';
  }
  const actualLabel = actualTraversal
    ? t(MODES.find((item) => item.mode === actualTraversal)?.label ?? 'treeModeNotRun')
    : t('treeModeNotRun');
  const selectedLabel = t(MODES.find((item) => item.mode === selected)?.label ?? 'treeModeInorder');
  const pending = actualTraversal !== null && actualTraversal !== selected;

  return (
    <section
      className="tree-mode-picker"
      data-testid="tree-mode-picker"
      data-selected={selected}
      data-actual={actualTraversal ?? ''}
    >
      <div className="tree-mode-head">
        <span className="tree-mode-title">{t('treeModeLabel')}</span>
        <span className="tree-mode-actual" data-testid="tree-mode-actual">
          {t('treeModeActual').replace('{mode}', actualLabel)}
        </span>
      </div>
      <div className="tree-mode-options" role="group" aria-label={t('treeModeLabel')}>
        {MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            className={`tree-mode-btn${selected === item.mode ? ' is-selected' : ''}`}
            data-testid={item.testId}
            aria-pressed={selected === item.mode}
            onClick={() => onSelect(item.mode)}
          >
            {t(item.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="tree-mode-pending" data-testid="tree-mode-pending">
          {t('treeModePending')
            .replace('{mode}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

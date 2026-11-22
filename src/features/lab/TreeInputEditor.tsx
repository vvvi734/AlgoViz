import { useI18n } from '../../i18n/I18nProvider';
import { TREE_COMMANDS, type TreeGuidedInputAlgorithm } from '../../domain/algorithms/treeInput';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';

const COMMAND_LABELS: Record<string, string> = {
  find: 'treeCommandFind',
  insert: 'treeCommandInsert',
  delete: 'treeCommandDelete',
};

export function TreeInputEditor({
  algorithm,
  draft,
  onChange,
}: {
  algorithm: TreeGuidedInputAlgorithm;
  draft: GuidedInputDraft;
  onChange: (key: keyof GuidedInputDraft, value: string) => void;
}) {
  const { t } = useI18n();
  const commands = TREE_COMMANDS[algorithm];
  const traversal = algorithm === 'inorder' || algorithm === 'threaded-inorder';
  const targetLabel =
    algorithm === 'bst'
      ? t('treeTargetLabel')
      : algorithm === 'avl'
        ? t('treeAvlTargetLabel')
        : t('treeBtreeTargetLabel');
  const sequenceLabel = traversal ? t('treeNodesLabel') : t('treeSequenceLabel');
  const sequencePlaceholder = traversal
    ? '4, 2, 6, null, 3'
    : algorithm === 'btree'
      ? '10, 20, 30, 40, 50'
      : '50, 30, 70, 20, 40';

  return (
    <div className="tree-input-editor" data-testid="tree-input-editor" data-algorithm={algorithm}>
      {traversal ? null : (
        <div className={`guided-field-grid tree-command-grid${commands.length <= 1 ? ' is-single' : ''}`}>
          {commands.length > 1 ? (
            <label className="guided-field">
              <span>{t('treeOperationLabel')}</span>
              <select
                className="input"
                data-testid="tree-command"
                value={draft.command || commands[0]}
                onChange={(event) => onChange('command', event.target.value)}
              >
                {commands.map((command) => (
                  <option key={command} value={command}>
                    {t(COMMAND_LABELS[command] ?? 'treeCommandFind')}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="guided-field">
            <span>{targetLabel}</span>
            <input
              className="input code-dock-input"
              data-testid="tree-target"
              value={draft.target}
              onChange={(event) => onChange('target', event.target.value)}
              placeholder={algorithm === 'bst' ? '35' : algorithm === 'avl' ? '5' : '35'}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </div>
      )}

      <label className="guided-field tree-sequence-field">
        <span>{sequenceLabel}</span>
        <AutoGrowTextarea
          id="run-input"
          data-testid={traversal ? 'tree-nodes' : 'tree-sequence'}
          value={draft.values}
          onChange={(event) => onChange('values', event.target.value)}
          placeholder={sequencePlaceholder}
          minRows={1}
          maxRows={6}
        />
      </label>
    </div>
  );
}

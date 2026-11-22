import { useI18n } from '../../i18n/I18nProvider';
import { HEAP_OPERATIONS, type HeapOperation } from '../../domain/algorithms/heapInput';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';

const OPERATION_LABELS: Record<HeapOperation, string> = {
  build: 'heapOperationBuild',
  push: 'heapOperationPush',
  extract: 'heapOperationExtract',
  sort: 'heapOperationSort',
};

export function HeapInputEditor({
  draft,
  onChange,
}: {
  draft: GuidedInputDraft;
  onChange: (key: keyof GuidedInputDraft, value: string) => void;
}) {
  const { t } = useI18n();
  const operation = HEAP_OPERATIONS.includes(draft.command as HeapOperation)
    ? (draft.command as HeapOperation)
    : 'build';

  return (
    <div className="heap-input-editor" data-testid="heap-input-editor">
      <div className="guided-field-grid tree-command-grid">
        <label className="guided-field">
          <span>{t('heapOperationLabel')}</span>
          <select
            className="input"
            data-testid="heap-operation"
            value={operation}
            onChange={(event) => onChange('command', event.target.value)}
          >
            {HEAP_OPERATIONS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {t(OPERATION_LABELS[candidate])}
              </option>
            ))}
          </select>
        </label>
        {operation === 'push' ? (
          <label className="guided-field">
            <span>{t('heapPushValueLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="heap-value"
              value={draft.target}
              onChange={(event) => onChange('target', event.target.value)}
              placeholder="10"
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>

      <label className="guided-field tree-sequence-field">
        <span>{t('heapValuesLabel')}</span>
        <AutoGrowTextarea
          id="run-input"
          data-testid="heap-values"
          value={draft.values}
          onChange={(event) => onChange('values', event.target.value)}
          placeholder="9, 8, 6, 3, 7, 2, 5"
          minRows={1}
          maxRows={6}
        />
      </label>
    </div>
  );
}

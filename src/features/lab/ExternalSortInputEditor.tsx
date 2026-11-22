import { useI18n } from '../../i18n/I18nProvider';
import type {
  ExternalSortGuidedInputAlgorithm,
  ExternalSortInputFields,
} from '../../domain/algorithms/externalSortInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import '../../styles/externalSort.css';

export function ExternalSortInputEditor({
  algorithm,
  draft,
  onChange,
  onValuesChange,
}: {
  algorithm: ExternalSortGuidedInputAlgorithm;
  draft: { values: string; external?: ExternalSortInputFields };
  onChange: (fields: ExternalSortInputFields) => void;
  onValuesChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const fields = draft.external ?? {
    runs: '2, 5, 9\n1, 6, 10',
    k: '2',
    bufferCapacity: '2',
    blockSize: '1',
    weights: '3, 5, 8, 11',
    workspaceCapacity: '3',
  };
  const set = (key: keyof ExternalSortInputFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };

  if (algorithm === 'multiway') {
    const runLines = fields.runs.split(/\r?\n/);
    return (
      <div className="external-input-editor" data-testid="multiway-input-editor">
        <div className="guided-field-grid">
          <label className="guided-field">
            <span>{t('guidedMultiwayKLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="multiway-k"
              value={fields.k}
              onChange={(event) => set('k', event.target.value)}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="guided-field">
            <span>{t('guidedMultiwayBufferLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="multiway-buffer"
              value={fields.bufferCapacity}
              onChange={(event) => set('bufferCapacity', event.target.value)}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="guided-field">
            <span>{t('guidedMultiwayBlockLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="multiway-block"
              value={fields.blockSize}
              onChange={(event) => set('blockSize', event.target.value)}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </div>
        <label className="guided-external-runs">
          <span>
            {t('guidedMultiwayRunsLabel')}
            <small>{runLines.length} / {fields.k || '?'}</small>
          </span>
          <AutoGrowTextarea
            id="run-input"
            data-testid="multiway-runs-input"
            value={fields.runs}
            onChange={(event) => set('runs', event.target.value)}
            placeholder={'2, 5, 9\n1, 6, 10'}
            className="external-runs-input"
            minRows={4}
            maxRows={10}
          />
        </label>
        <p className="guided-hint note muted">{t('guidedMultiwayHint')}</p>
      </div>
    );
  }

  if (algorithm === 'replacement') {
    return (
      <div className="external-input-editor" data-testid="replacement-input-editor">
        <div className="guided-field-grid">
          <label className="guided-field">
            <span>{t('guidedReplacementValuesLabel')}</span>
            <AutoGrowTextarea
              id="run-input"
              data-testid="run-input"
              value={draft.values}
              onChange={(event) => onValuesChange(event.target.value)}
              placeholder="7, 3, 9, 1, 8, 2, 6, 4, 5"
              minRows={1}
              maxRows={8}
            />
          </label>
          <label className="guided-field">
            <span>{t('guidedReplacementCapacityLabel')}</span>
            <input
              className="input code-dock-input"
              data-testid="replacement-workspace-capacity"
              value={fields.workspaceCapacity}
              onChange={(event) => set('workspaceCapacity', event.target.value)}
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="external-input-editor" data-testid="optimal-input-editor">
      <div className="guided-field-grid">
        <label className="guided-field">
          <span>{t('guidedOptimalWeightsLabel')}</span>
          <AutoGrowTextarea
            id="run-input"
            data-testid="run-input"
            value={fields.weights}
            onChange={(event) => set('weights', event.target.value)}
            placeholder="3, 5, 8, 11"
            minRows={1}
            maxRows={6}
          />
        </label>
        <label className="guided-field">
          <span>{t('guidedOptimalKLabel')}</span>
          <input
            className="input code-dock-input"
            data-testid="optimal-k"
            value={fields.k}
            onChange={(event) => set('k', event.target.value)}
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>
    </div>
  );
}

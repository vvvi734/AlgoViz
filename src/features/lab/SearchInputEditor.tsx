import { useI18n } from '../../i18n/I18nProvider';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';
import type { SearchGuidedInputAlgorithm } from '../../domain/algorithms/searchInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';

type FieldChange = (key: keyof GuidedInputDraft, value: string) => void;

export function SearchInputEditor({
  algorithm,
  draft,
  onChange,
}: {
  algorithm: SearchGuidedInputAlgorithm;
  draft: GuidedInputDraft;
  onChange: FieldChange;
}) {
  const { t } = useI18n();

  if (algorithm === 'block-search') {
    return (
      <div className="guided-field-grid search-input-grid">
        <label className="guided-field">
          <span>{t('guidedSearchDataLabel')}</span>
          <AutoGrowTextarea
            id="run-input"
            data-testid="run-input"
            value={draft.values}
            onChange={(event) => onChange('values', event.target.value)}
            placeholder="22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69"
            minRows={1}
            maxRows={6}
          />
          <small>{t('searchBlockDataHint')}</small>
        </label>
        <label className="guided-field guided-field-target">
          <span>{t('guidedBlockSizeLabel')}</span>
          <input
            id="block-size"
            className="input code-dock-input"
            data-testid="block-size"
            value={draft.blockSize ?? '4'}
            onChange={(event) => onChange('blockSize', event.target.value)}
            placeholder="4"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <label className="guided-field guided-field-target">
          <span>{t('guidedBinaryTargetLabel')}</span>
          <input
            id="block-search-target"
            className="input code-dock-input"
            data-testid="block-search-target"
            value={draft.target}
            onChange={(event) => onChange('target', event.target.value)}
            placeholder="38"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>
    );
  }

  if (algorithm === 'bplus-tree') {
    return (
      <div className="guided-field-grid search-input-grid">
        <label className="guided-field search-input-wide">
          <span>{t('guidedBplusKeysLabel')}</span>
          <AutoGrowTextarea
            id="run-input"
            data-testid="run-input"
            value={draft.values}
            onChange={(event) => onChange('values', event.target.value)}
            placeholder="5, 10, 15, 20, 25, 30, 35, 40"
            minRows={1}
            maxRows={6}
          />
          <small>{t('searchBplusKeysHint')}</small>
        </label>
        <label className="guided-field">
          <span>{t('guidedOperationLabel')}</span>
          <select
            id="search-operation"
            className="input"
            data-testid="search-operation"
            value={draft.mode === 'insert' || draft.mode === 'range' ? draft.mode : 'find'}
            onChange={(event) => onChange('mode', event.target.value)}
          >
            <option value="find">{t('searchOperationFind')}</option>
            <option value="insert">{t('searchOperationInsert')}</option>
            <option value="range">{t('searchOperationRange')}</option>
          </select>
        </label>
        <label className="guided-field guided-field-target">
          <span>{draft.mode === 'range' ? t('guidedRangeLowLabel') : t('guidedBinaryTargetLabel')}</span>
          <input
            id="bplus-target"
            className="input code-dock-input"
            data-testid="bplus-target"
            value={draft.target}
            onChange={(event) => onChange('target', event.target.value)}
            placeholder="25"
            inputMode="numeric"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        {draft.mode === 'range' ? (
          <label className="guided-field guided-field-target">
            <span>{t('guidedRangeHighLabel')}</span>
            <input
              id="bplus-range-end"
              className="input code-dock-input"
              data-testid="bplus-range-end"
              value={draft.end ?? ''}
              onChange={(event) => onChange('end', event.target.value)}
              placeholder="33"
              inputMode="numeric"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        ) : null}
      </div>
    );
  }

  return (
    <div className="guided-field-grid search-input-grid">
      <label className="guided-field search-input-wide">
        <span>{t('guidedKeyWordsLabel')}</span>
        <AutoGrowTextarea
          id="run-input"
          data-testid="run-input"
          value={draft.values}
          onChange={(event) => onChange('values', event.target.value)}
          placeholder="car, card, care, cat, dog, do"
          minRows={1}
          maxRows={6}
        />
        <small>{t('searchKeyWordsHint')}</small>
      </label>
      <label className="guided-field">
        <span>{t('guidedOperationLabel')}</span>
        <select
          id="search-operation"
          className="input"
          data-testid="search-operation"
          value={draft.mode === 'insert' ? 'insert' : 'find'}
          onChange={(event) => onChange('mode', event.target.value)}
        >
          <option value="find">{t('searchOperationFind')}</option>
          <option value="insert">{t('searchOperationInsert')}</option>
        </select>
      </label>
      <label className="guided-field guided-field-target">
        <span>{t('guidedKeyTargetLabel')}</span>
        <input
          id="key-tree-target"
          className="input code-dock-input"
          data-testid="key-tree-target"
          value={draft.target}
          onChange={(event) => onChange('target', event.target.value)}
          placeholder="care"
          spellCheck={false}
          autoComplete="off"
        />
      </label>
    </div>
  );
}

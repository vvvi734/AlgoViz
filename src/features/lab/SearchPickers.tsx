import { useI18n } from '../../i18n/I18nProvider';
import {
  BLOCK_SEARCH_PRESETS,
  blockSearchPresetFromInput,
  type BlockSearchPresetId,
} from '../../domain/algorithms/blockSearchExamples';
import {
  BPLUS_TREE_PRESETS,
  bplusTreePresetFromInput,
  type BplusTreePresetId,
} from '../../domain/algorithms/bplusExamples';
import {
  KEY_TREE_PRESETS,
  keyTreePresetFromInput,
  type KeyTreePresetId,
} from '../../domain/algorithms/keyTreeExamples';

type PickerConfig<T extends string> = {
  testId: string;
  titleKey: string;
  ruleKey: string;
  presets: readonly { id: T; label: string }[];
  fromInput: (input: unknown) => T | null;
  onSelect: (preset: T) => void;
  inputJson: string;
  actual: T | null;
};

function SearchPresetPicker<T extends string>({
  testId,
  titleKey,
  ruleKey,
  presets,
  fromInput,
  onSelect,
  inputJson,
  actual,
}: PickerConfig<T>) {
  const { t } = useI18n();
  let selected: T | null = null;
  try {
    selected = fromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const labelOf = (id: T | null) =>
    id ? t(presets.find((preset) => preset.id === id)?.label ?? 'searchPresetNotRun') : t('searchPresetNotRun');
  return (
    <section className="bst-picker search-picker" data-testid={testId} data-selected={selected ?? ''} data-actual={actual ?? ''}>
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t(titleKey)}</span>
        <span className="bst-picker-actual">
          {t('searchPresetActual').replace('{actual}', labelOf(actual))}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t(titleKey)}>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`${testId}-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      <div className="btree-picker-rule">{t(ruleKey)}</div>
      {selected !== null && actual !== null && selected !== actual ? (
        <div className="bst-picker-pending">
          {t('searchPresetPending')
            .replace('{preset}', labelOf(selected))
            .replace('{actual}', labelOf(actual))}
        </div>
      ) : null}
    </section>
  );
}

export type SearchPickerKind = 'block' | 'bplus' | 'key';

export function SearchPresetPickers({
  activePicker,
  inputJson,
  blockActual,
  bplusActual,
  keyActual,
  onSelectBlock,
  onSelectBplus,
  onSelectKey,
}: {
  activePicker: SearchPickerKind;
  inputJson: string;
  blockActual: BlockSearchPresetId | null;
  bplusActual: BplusTreePresetId | null;
  keyActual: KeyTreePresetId | null;
  onSelectBlock: (preset: BlockSearchPresetId) => void;
  onSelectBplus: (preset: BplusTreePresetId) => void;
  onSelectKey: (preset: KeyTreePresetId) => void;
}) {
  // Each search lesson owns one preset contract. Showing sibling lessons' presets
  // here would let a B+ tree page rewrite its input with block-search or trie data.
  if (activePicker === 'block') {
    return (
      <SearchPresetPicker
        testId="block-search-picker"
        titleKey="blockSearchPickerLabel"
        ruleKey="blockSearchPickerRule"
        presets={BLOCK_SEARCH_PRESETS}
        fromInput={blockSearchPresetFromInput}
        onSelect={onSelectBlock}
        inputJson={inputJson}
        actual={blockActual}
      />
    );
  }
  if (activePicker === 'bplus') {
    return (
      <SearchPresetPicker
        testId="bplus-picker"
        titleKey="bplusPickerLabel"
        ruleKey="bplusPickerRule"
        presets={BPLUS_TREE_PRESETS}
        fromInput={bplusTreePresetFromInput}
        onSelect={onSelectBplus}
        inputJson={inputJson}
        actual={bplusActual}
      />
    );
  }
  return (
    <SearchPresetPicker
      testId="key-tree-picker"
      titleKey="keyTreePickerLabel"
      ruleKey="keyTreePickerRule"
      presets={KEY_TREE_PRESETS}
      fromInput={keyTreePresetFromInput}
      onSelect={onSelectKey}
      inputJson={inputJson}
      actual={keyActual}
    />
  );
}

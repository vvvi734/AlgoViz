import { useI18n } from '../../i18n/I18nProvider';
import {
  BTREE_PRESETS,
  btreePresetFromInput,
  type BtreePresetId,
} from '../../domain/algorithms/btreeExamples';

/** Official order-4 presets. Selecting one rewrites the input JSON; Run owns the Trace. */
export function BTreePicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: BtreePresetId | null;
  onSelect: (preset: BtreePresetId) => void;
}) {
  const { t } = useI18n();
  let selected: BtreePresetId | null = null;
  try {
    selected = btreePresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const actualLabel = actualPreset
    ? t(BTREE_PRESETS.find((item) => item.id === actualPreset)?.label ?? 'btreePresetNotRun')
    : t('btreePresetNotRun');
  const selectedLabel = selected
    ? t(BTREE_PRESETS.find((item) => item.id === selected)?.label ?? 'btreePresetNotRun')
    : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="bst-picker btree-picker"
      data-testid="btree-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t('btreePickerLabel')}</span>
        <span className="bst-picker-actual" data-testid="btree-preset-actual">
          {t('btreePresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t('btreePickerLabel')}>
        {BTREE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`btree-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      <div className="btree-picker-rule">{t('btreePickerRule')}</div>
      {pending ? (
        <div className="bst-picker-pending" data-testid="btree-preset-pending">
          {t('btreePresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

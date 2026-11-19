import { useI18n } from '../../i18n/I18nProvider';
import {
  HUFFMAN_PRESETS,
  huffmanPresetFromInput,
  type HuffmanPresetId,
} from '../../domain/algorithms/huffmanExamples';

export function HuffmanPicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: HuffmanPresetId | null;
  onSelect: (preset: HuffmanPresetId) => void;
}) {
  const { t } = useI18n();
  let selected: HuffmanPresetId | null = null;
  try {
    selected = huffmanPresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const labelFor = (id: string | null) =>
    id ? t(HUFFMAN_PRESETS.find((item) => item.id === id)?.label ?? 'huffmanPresetNotRun') : t('huffmanPresetNotRun');
  const actualLabel = labelFor(actualPreset);
  const selectedLabel = selected ? labelFor(selected) : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="bst-picker huffman-picker"
      data-testid="huffman-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t('huffmanPickerLabel')}</span>
        <span className="bst-picker-actual" data-testid="huffman-preset-actual">
          {t('huffmanPresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t('huffmanPickerLabel')}>
        {HUFFMAN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`huffman-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="bst-picker-pending" data-testid="huffman-preset-pending">
          {t('huffmanPresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

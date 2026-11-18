import { useI18n } from '../../i18n/I18nProvider';
import { HEAP_PRESETS, heapPresetFromInput, type HeapPreset } from '../../domain/algorithms/heapExamples';

export function HeapPicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: HeapPreset['id'] | null;
  onSelect: (preset: HeapPreset['id']) => void;
}) {
  const { t } = useI18n();
  let selected: HeapPreset['id'] | null = null;
  try {
    selected = heapPresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const labelFor = (id: string | null) =>
    id ? t(HEAP_PRESETS.find((item) => item.id === id)?.label ?? 'heapPresetNotRun') : t('heapPresetNotRun');
  const actualLabel = labelFor(actualPreset);
  const selectedLabel = selected ? labelFor(selected) : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="bst-picker heap-picker"
      data-testid="heap-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t('heapPickerLabel')}</span>
        <span className="bst-picker-actual" data-testid="heap-preset-actual">
          {t('heapPresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t('heapPickerLabel')}>
        {HEAP_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`heap-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="bst-picker-pending" data-testid="heap-preset-pending">
          {t('heapPresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

import { useI18n } from '../../i18n/I18nProvider';
import {
  SEQUENTIAL_LIST_PRESETS,
  sequentialListPresetFromInput,
  type SequentialListPresetId,
} from '../../domain/algorithms/sequentialListExamples';

export function SequentialListPicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: SequentialListPresetId | null;
  onSelect: (preset: SequentialListPresetId) => void;
}) {
  const { t } = useI18n();
  let selected: SequentialListPresetId | null = null;
  try {
    selected = sequentialListPresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const actualLabel = actualPreset
    ? t(SEQUENTIAL_LIST_PRESETS.find((item) => item.id === actualPreset)?.label ?? 'seqPresetNotRun')
    : t('seqPresetNotRun');
  const selectedLabel = selected
    ? t(SEQUENTIAL_LIST_PRESETS.find((item) => item.id === selected)?.label ?? 'seqPresetNotRun')
    : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="seqlist-picker"
      data-testid="seqlist-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="seqlist-picker-head">
        <span className="seqlist-picker-title">{t('seqPresetLabel')}</span>
        <span className="seqlist-picker-actual" data-testid="seqlist-preset-actual">
          {t('seqPresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="seqlist-picker-options" role="group" aria-label={t('seqPresetLabel')}>
        {SEQUENTIAL_LIST_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`seqlist-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`seqlist-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="seqlist-picker-pending" data-testid="seqlist-preset-pending">
          {t('seqPresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

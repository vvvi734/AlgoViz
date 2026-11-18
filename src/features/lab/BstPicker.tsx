import { useI18n } from '../../i18n/I18nProvider';
import { BST_PRESETS, bstPresetFromInput, type BstPresetId } from '../../domain/algorithms/bstExamples';

export function BstPicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: BstPresetId | null;
  onSelect: (preset: BstPresetId) => void;
}) {
  const { t } = useI18n();
  let selected: BstPresetId | null = null;
  try {
    selected = bstPresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const actualLabel = actualPreset
    ? t(BST_PRESETS.find((item) => item.id === actualPreset)?.label ?? 'bstPresetNotRun')
    : t('bstPresetNotRun');
  const selectedLabel = selected
    ? t(BST_PRESETS.find((item) => item.id === selected)?.label ?? 'bstPresetNotRun')
    : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="bst-picker"
      data-testid="bst-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t('bstPresetLabel')}</span>
        <span className="bst-picker-actual" data-testid="bst-preset-actual">
          {t('bstPresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t('bstPresetLabel')}>
        {BST_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`bst-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="bst-picker-pending" data-testid="bst-preset-pending">
          {t('bstPresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

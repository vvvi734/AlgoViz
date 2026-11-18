import { useI18n } from '../../i18n/I18nProvider';
import { AVL_PRESETS, avlPresetFromInput, type AvlPresetId } from '../../domain/algorithms/avlExamples';

export function AvlPicker({
  inputJson,
  actualPreset,
  onSelect,
}: {
  inputJson: string;
  actualPreset: AvlPresetId | null;
  onSelect: (preset: AvlPresetId) => void;
}) {
  const { t } = useI18n();
  let selected: AvlPresetId | null = null;
  try {
    selected = avlPresetFromInput(JSON.parse(inputJson));
  } catch {
    selected = null;
  }
  const actualLabel = actualPreset
    ? t(AVL_PRESETS.find((item) => item.id === actualPreset)?.label ?? 'avlPresetNotRun')
    : t('avlPresetNotRun');
  const selectedLabel = selected
    ? t(AVL_PRESETS.find((item) => item.id === selected)?.label ?? 'avlPresetNotRun')
    : actualLabel;
  const pending = selected !== null && actualPreset !== null && actualPreset !== selected;

  return (
    <section
      className="bst-picker avl-picker"
      data-testid="avl-picker"
      data-selected={selected ?? ''}
      data-actual={actualPreset ?? ''}
    >
      <div className="bst-picker-head">
        <span className="bst-picker-title">{t('avlPresetLabel')}</span>
        <span className="bst-picker-actual" data-testid="avl-preset-actual">
          {t('avlPresetActual').replace('{actual}', actualLabel)}
        </span>
      </div>
      <div className="bst-picker-options" role="group" aria-label={t('avlPresetLabel')}>
        {AVL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bst-preset-btn${selected === preset.id ? ' is-selected' : ''}`}
            data-testid={`avl-preset-${preset.id}`}
            aria-pressed={selected === preset.id}
            onClick={() => onSelect(preset.id)}
          >
            {t(preset.label)}
          </button>
        ))}
      </div>
      {pending ? (
        <div className="bst-picker-pending" data-testid="avl-preset-pending">
          {t('avlPresetPending')
            .replace('{preset}', selectedLabel)
            .replace('{actual}', actualLabel)}
        </div>
      ) : null}
    </section>
  );
}

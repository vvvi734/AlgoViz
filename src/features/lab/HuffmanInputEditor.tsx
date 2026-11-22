import { useI18n } from '../../i18n/I18nProvider';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';

export function HuffmanInputEditor({
  draft,
  onChange,
}: {
  draft: GuidedInputDraft;
  onChange: (key: keyof GuidedInputDraft, value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <label className="guided-hash-field huffman-symbol-field">
      <span>{t('huffmanSymbolsLabel')}</span>
      <AutoGrowTextarea
        id="run-input"
        data-testid="huffman-symbols"
        value={draft.symbols}
        onChange={(event) => onChange('symbols', event.target.value)}
        placeholder={'A: 5\nB: 9\nC: 12\nD: 13'}
        className="guided-hash-ops huffman-symbols"
        minRows={5}
        maxRows={10}
      />
    </label>
  );
}

import { useI18n } from '../../i18n/I18nProvider';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';

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
      <textarea
        id="run-input"
        className="input code-dock-input guided-hash-ops huffman-symbols"
        data-testid="huffman-symbols"
        rows={5}
        value={draft.symbols}
        onChange={(event) => onChange('symbols', event.target.value)}
        placeholder={'A: 5\nB: 9\nC: 12\nD: 13'}
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}

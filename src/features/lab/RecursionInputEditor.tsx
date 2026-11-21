import { useI18n } from '../../i18n/I18nProvider';
import {
  recursionInputMax,
  type RecursionGuidedInputAlgorithm,
} from '../../domain/algorithms/recursionInput';
import type { GuidedInputDraft } from '../../domain/algorithms/guidedInput';

/**
 * RECUR-01: one integer argument, not a JSON blob or an array editor.
 *
 * The limit is visible next to the field. It is a teaching bound, not a fake
 * trace: the real Python function rejects an out-of-range value and the
 * controller clears the old animation.
 */
export function RecursionInputEditor({
  algorithm,
  draft,
  onChange,
}: {
  algorithm: RecursionGuidedInputAlgorithm;
  draft: GuidedInputDraft;
  onChange: (key: keyof GuidedInputDraft, value: string) => void;
}) {
  const { t } = useI18n();
  const max = recursionInputMax(algorithm);
  return (
    <div className="guided-field-row guided-recursion-field">
      <label className="guided-field-label" htmlFor="run-input">
        {t('guidedRecursionNLabel')}
      </label>
      <input
        id="run-input"
        className="input code-dock-input guided-recursion-input"
        data-testid="recursion-n"
        value={draft.n}
        onChange={(event) => onChange('n', event.target.value)}
        placeholder="4"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-describedby="recursion-limit-note"
      />
      <span className="guided-limit" id="recursion-limit-note" data-testid="recursion-limit-note">
        {t('guidedRecursionLimitNote').replace('{max}', String(max))}
      </span>
    </div>
  );
}

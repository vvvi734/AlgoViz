import { useI18n } from '../../i18n/I18nProvider';
import type { GeneralizedListInputFields, GeneralizedListGuidedInputAlgorithm } from '../../domain/algorithms/generalizedListInput';

/**
 * 广义表课程的唯一输入控件：一个表达式输入框。
 * 语法限制和错误文案由共享解析器给出，编辑器本身不猜结构。
 */
export function GeneralizedListInputEditor({
  algorithm,
  value,
  onChange,
}: {
  algorithm: GeneralizedListGuidedInputAlgorithm;
  value: GeneralizedListInputFields;
  onChange: (fields: Partial<GeneralizedListInputFields>) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="guided-field-row gl-row">
      <label className="guided-field-label" htmlFor="run-input">
        {t(algorithm === 'gl-depth' ? 'guidedGLDepthExpressionLabel' : 'guidedGLCopyExpressionLabel')}
      </label>
      <input
        id="run-input"
        className="input code-dock-input guided-gl-expression"
        data-testid="gl-expression"
        value={value.expression}
        onChange={(event) => onChange({ expression: event.target.value })}
        placeholder="(a, (b, c), ((d), e))"
        spellCheck={false}
        autoComplete="off"
      />
      <span className="gl-expression-count note muted">
        {value.expression.length}/80
      </span>
    </div>
  );
}

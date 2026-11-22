import { useI18n } from '../../i18n/I18nProvider';
import type { ExpressionGuidedInputAlgorithm } from '../../domain/algorithms/expressionInput';
import { AutoGrowTextarea } from './AutoGrowTextarea';

/**
 * Single-expression editor. `infix-to-postfix` accepts ordinary infix with
 * optional spaces; `postfix-eval` requires spaces between operands/operators
 * so a multi-digit number is never split into digits. The field grows with
 * wrapped content instead of clipping a long expression on one line.
 */
export function ExpressionInputEditor({
  algorithm,
  value,
  onChange,
}: {
  algorithm: ExpressionGuidedInputAlgorithm;
  value: string;
  onChange: (value: string) => void;
}) {
  const { lang } = useI18n();
  const conversion = algorithm === 'infix-to-postfix';
  return (
    <div className="expression-input-editor" data-testid="expression-input-editor">
      <label className="expression-input-label">
        <span>{conversion ? (lang === 'zh' ? '中缀表达式' : 'Infix expression') : lang === 'zh' ? '后缀表达式' : 'Postfix expression'}</span>
        <AutoGrowTextarea
          id="run-input"
          data-testid="expression-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={conversion ? '(3 + 4) * 2' : '3 4 + 2 *'}
          minRows={1}
          maxRows={6}
        />
      </label>
      <span className="expression-input-hint">
        {conversion
          ? lang === 'zh'
            ? '支持非负整数、多位整数、+ − * / 和圆括号；不支持一元负号与隐式乘法。'
            : 'Non-negative and multi-digit integers, + − * / and parentheses; unary minus and implicit multiplication are rejected.'
          : lang === 'zh'
            ? '操作数与运算符之间必须用空格分开，例如 12 3 - 4 *；除数为 0 会在真实执行时报错。'
            : 'Separate every number and operator with spaces, e.g. 12 3 - 4 *; division by zero is reported by the real run.'}
      </span>
    </div>
  );
}

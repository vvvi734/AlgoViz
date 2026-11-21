/**
 * Chapter 3 expression visualizer. It paints a real trace snapshot: token
 * stream, scan position, operator stack, produced suffix and, for evaluation,
 * the operand stack plus the two popped operands.
 *
 * No step is reconstructed from `message`. Every highlighted element comes from
 * `ExpressionSnapshot` fields produced by the Python program.
 */
import { useI18n } from '../../i18n/I18nProvider';
import type { ExpressionVisualModel } from '../../domain/visualization/expressionModel';

const OPERATION_LABELS: Record<ExpressionVisualModel['operation'], [string, string]> = {
  init: ['初始化', 'INIT'],
  read: ['读取 token', 'READ TOKEN'],
  push: ['压入栈', 'PUSH'],
  pop: ['弹出栈顶', 'POP'],
  emit: ['直接输出', 'EMIT'],
  apply: ['弹出两个操作数并计算', 'POP TWO OPERANDS'],
  done: ['完成', 'DONE'],
  error: ['错误', 'ERROR'],
};

function stackCards(
  items: ExpressionVisualModel['operatorStack'],
  empty: string,
) {
  if (items.length === 0) return <div className="expr-stack-empty">{empty}</div>;
  return (
    <div className="expr-stack-list">
      {[...items].reverse().map((item) => (
        <div
          className={`expr-stack-card${item.active ? ' is-active' : ''}`}
          data-testid="expr-stack-item"
          data-value={item.value}
          key={item.id}
        >
          {item.value}
        </div>
      ))}
    </div>
  );
}

export function ExpressionVisual({ model }: { model: ExpressionVisualModel }) {
  const { lang } = useI18n();
  const zh = lang === 'zh';
  const operation = OPERATION_LABELS[model.operation][zh ? 0 : 1];
  const conversion = model.algorithm === 'infix-to-postfix';
  const activeOperator = model.operatorStack.find((item) => item.active);
  return (
    <div
      className={`expression-visual${model.error ? ' has-error' : ''}`}
      data-testid="expression-visual"
      data-algorithm={model.algorithm}
      data-operation={model.operation}
      role="group"
      aria-label={zh ? '表达式栈动画' : 'Expression stack animation'}
    >
      <div className="expression-head">
        <span className="expression-op">{operation}</span>
        <span className="expression-current">
          {model.currentIndex >= 0 && model.currentIndex < model.tokens.length
            ? `${zh ? '当前 token' : 'current token'}：${model.tokens[model.currentIndex]?.value}`
            : model.operation === 'done'
              ? zh
                ? '扫描结束'
                : 'scan finished'
              : zh
                ? '尚未读取'
                : 'not reading yet'}
        </span>
      </div>

      {model.error ? (
        <div className="expression-error" data-testid="expression-error">
          <b>{zh ? '表达式错误：' : 'Expression error: '}</b>
          {model.error}
        </div>
      ) : null}

      <div className="expression-token-strip" data-testid="expression-tokens">
        {model.tokens.map((token) => (
          <span
            className={`expression-token is-${token.state}`}
            data-testid="expression-token"
            data-index={token.index}
            data-state={token.state}
            key={`${token.index}-${token.value}`}
          >
            {token.value}
          </span>
        ))}
        {model.tokens.length === 0 ? <span className="expression-empty">∅</span> : null}
      </div>

      <div className={`expression-board${conversion ? ' is-conversion' : ' is-evaluation'}`}>
        {conversion ? (
          <>
            <section className="expression-panel expression-operator-panel">
              <h4>
                {zh ? '运算符栈' : 'Operator stack'}
                <small>{zh ? '栈顶在右侧' : 'top at the right'}</small>
              </h4>
              {stackCards(model.operatorStack, zh ? '空' : 'empty')}
              </section>
            <section className="expression-panel expression-output-panel">
              <h4>
                {zh ? '已生成后缀' : 'Postfix produced'}
                <small>{model.output.length} {zh ? '个 token' : 'tokens'}</small>
              </h4>
              <div className="expression-output" data-testid="expression-output">
                {model.output.length === 0 ? (
                  <span className="expression-empty">{zh ? '尚未输出' : 'nothing yet'}</span>
                ) : (
                  model.output.map((token, index) => (
                    <span className="expression-output-token" key={`${token}-${index}`}>
                      {token}
                    </span>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="expression-panel expression-operand-panel">
              <h4>
                {zh ? '操作数栈' : 'Operand stack'}
                <small>{zh ? '栈顶在右侧' : 'top at the right'}</small>
              </h4>
              {stackCards(model.operandStack, zh ? '空' : 'empty')}
            </section>
            <section className="expression-panel expression-compute-panel">
              <h4>
                {zh ? '本次计算' : 'Current computation'}
                <small>{model.operands ? `${model.operands.operator}` : '—'}</small>
              </h4>
              {model.operands ? (
                <div className="expression-compute" data-testid="expression-compute">
                  <div className="expression-operand-line">
                    <span className="expression-operand-tag">{zh ? '先弹出 · 右操作数' : 'popped first · right'}</span>
                    <b>{model.operands.right}</b>
                  </div>
                  <div className="expression-operand-line">
                    <span className="expression-operand-tag">{zh ? '后弹出 · 左操作数' : 'popped second · left'}</span>
                    <b>{model.operands.left}</b>
                  </div>
                  <div className="expression-equation">
                    {model.operands.left} {model.operands.operator} {model.operands.right} ={' '}
                    <strong>{model.operands.result}</strong>
                  </div>
                  <div className="expression-order-note">
                    {zh ? '减法/除法必须用「左 op 右」，顺序颠倒会得到错误结果。' : 'For − and ÷ use left op right; reversing them gives a wrong answer.'}
                  </div>
                </div>
              ) : (
                <div className="expression-empty">
                  {zh
                    ? model.operation === 'done'
                      ? '计算结束'
                      : '等待下一次运算符'
                    : model.operation === 'done'
                      ? 'evaluation finished'
                      : 'waiting for the next operator'}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="expression-foot">
        {model.operation === 'pop' && activeOperator ? (
          <span className="expression-reason">
            {zh
              ? `弹出运算符「${activeOperator.value}」：它的优先级不低于新运算符，且左侧运算符先结合。`
              : `Pop “${activeOperator.value}”: it binds at least as tightly as the incoming operator, and the left one must reduce first.`}
          </span>
        ) : model.operation === 'done' && model.result !== null ? (
          <span className="expression-result" data-testid="expression-result">
            {zh ? '最终结果' : 'Result'}：<b>{model.result}</b>
          </span>
        ) : (
          <span className="expression-reason">
            {conversion
              ? zh
                ? '操作数直接进入后缀；运算符按优先级和括号规则入栈/弹栈。'
                : 'Operands go straight to the suffix; operators are pushed/popped by precedence and parentheses.'
              : zh
                ? '操作数入栈；遇到运算符就弹出两个值，算完再压回结果。'
                : 'Operands are pushed; an operator pops two values, computes and pushes the result back.'}
          </span>
        )}
      </div>
    </div>
  );
}

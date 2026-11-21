import { useI18n } from '../../i18n/I18nProvider';
import type { PolynomialListModel, PolynomialVisualModel } from '../../domain/visualization/polynomialModel';

/**
 * TEXTBOOK-02 polynomial canvas: three simultaneous chains plus the current
 * exponent comparison. The result chain is built on screen, one node at a time.
 */
function TermRow({
  label,
  list,
  role,
  emptyLabel,
}: {
  label: string;
  list: PolynomialListModel;
  role: 'a' | 'b' | 'result';
  emptyLabel: string;
}) {
  const { b } = useI18n();
  return (
    <div className="poly-row" data-role={role}>
      <div className="poly-row-head">
        <b>{label}</b>
        <span className="poly-expression" data-testid={`poly-expression-${role}`}>
          {list.expression}
        </span>
      </div>
      <div className="poly-chain" data-testid={`poly-chain-${role}`} data-count={list.terms.length}>
        {list.terms.length === 0 ? (
          <span className="poly-empty">{emptyLabel}</span>
        ) : (
          <>
            {list.terms.map((term) => (
              <span className="poly-term-wrap" key={term.id}>
                <span
                  className={[
                    'poly-term',
                    term.current ? 'is-current' : '',
                    term.appended ? 'is-appended' : '',
                  ].filter(Boolean).join(' ')}
                  data-term-id={term.id}
                  data-testid={`poly-term-${term.id}`}
                >
                  {term.text}
                  <small>{b('指数', 'exp')} {term.exponent}</small>
                </span>
                <span className="poly-arrow">→</span>
              </span>
            ))}
            <span className="poly-null">{b('NULL', 'NULL')}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function PolynomialVisual({ model }: { model: PolynomialVisualModel }) {
  const { b } = useI18n();
  const actionText: Record<PolynomialVisualModel['action'], string> = {
    complete: b('完成', 'complete'),
    compare: b('比较指数', 'compare exponents'),
    merge: b('指数相等 · 系数相加', 'equal exponents · add coefficients'),
    cancel: b('系数抵消 · 丢弃该项', 'coefficients cancel · drop the term'),
    'take-a': b('取 A 当前项', 'take the A term'),
    'take-b': b('取 B 当前项', 'take the B term'),
    'append-a': b('追加 A 剩余项', 'append remaining A terms'),
    'append-b': b('追加 B 剩余项', 'append remaining B terms'),
  };
  const comparison = model.comparison;

  return (
    <section
      className="polynomial-visual"
      data-testid="polynomial-visual"
      data-operation={model.operation}
      data-action={model.action}
      data-result={model.result.expression}
      data-result-tail={model.resultTailId ?? ''}
      data-a-current={model.a.currentId ?? ''}
      data-b-current={model.b.currentId ?? ''}
      aria-label={b('一元多项式相加可视化', 'Polynomial addition visualization')}
    >
      <header className="poly-head">
        <div>
          <b>{b('双指针合并有序链表', 'Merge two ordered chains with two cursors')}</b>
          <span>{actionText[model.action]}</span>
        </div>
        {comparison ? (
          <div className="poly-compare" data-testid="poly-compare">
            <span className="poly-compare-item is-a">
              <small>A</small>
              {comparison.aExp === null ? '—' : comparison.aExp}
            </span>
            <span className={`poly-compare-sign${comparison.aExp !== null && comparison.bExp !== null && comparison.aExp === comparison.bExp ? ' is-equal' : ''}`}>
              {comparison.aExp === null || comparison.bExp === null
                ? '·'
                : comparison.aExp === comparison.bExp ? '=' : comparison.aExp > comparison.bExp ? '>' : '<'}
            </span>
            <span className="poly-compare-item is-b">
              <small>B</small>
              {comparison.bExp === null ? '—' : comparison.bExp}
            </span>
          </div>
        ) : null}
      </header>

      <div className={`poly-lists${model.focusSide ? ` is-focus-${model.focusSide}` : ''}`}>
        <TermRow label="A(x)" list={model.a} role="a" emptyLabel="0" />
        <TermRow label="B(x)" list={model.b} role="b" emptyLabel="0" />
        <div className="poly-result-divider" />
        <TermRow label={b('结果 R(x)', 'Result R(x)')} list={model.result} role="result" emptyLabel="0" />
      </div>

      <footer className="poly-foot">
        <span>
          {b('结果链尾', 'Result tail')}: {model.resultTailId ?? 'NULL'}
        </span>
        <span>
          {b(
            '结果按指数降序建立；抵消项不产生结点，剩余段直接追加。',
            'The result is built in descending exponent order; cancelled terms create no node, and leftover segments are appended.',
          )}
        </span>
      </footer>
    </section>
  );
}

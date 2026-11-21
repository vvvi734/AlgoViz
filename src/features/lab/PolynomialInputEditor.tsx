import { useI18n } from '../../i18n/I18nProvider';
import { CHAPTER2_LIMITS, type PolynomialTermRow } from '../../domain/algorithms/chapter2Input';

/**
 * TEXTBOOK-02 polynomial term editor: A and B are separate row lists. Terms are
 * entered as coefficient/exponent pairs and must already be in descending
 * exponent order; validation reports the row instead of silently sorting it.
 */
function TermList({
  label,
  rows,
  prefix,
  onChange,
}: {
  label: string;
  rows: PolynomialTermRow[];
  prefix: 'a' | 'b';
  onChange: (rows: PolynomialTermRow[]) => void;
}) {
  const { b } = useI18n();

  const update = (index: number, patch: Partial<PolynomialTermRow>) => {
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  };

  const add = () => {
    if (rows.length >= CHAPTER2_LIMITS.POLY_MAX_TERMS) return;
    const used = new Set(rows.map((row) => row.id));
    let sequence = rows.length + 1;
    while (used.has(`${prefix}${sequence}`)) sequence += 1;
    onChange([...rows, { id: `${prefix}${sequence}`, coefficient: '', exponent: '' }]);
  };

  return (
    <section className="poly-editor-side" data-testid={`poly-editor-${prefix}`}>
      <header className="poly-editor-head">
        <b>{label}</b>
        <span>{b('按指数从大到小', 'Exponents descending')}</span>
        <button
          className="btn small"
          type="button"
          onClick={add}
          disabled={rows.length >= CHAPTER2_LIMITS.POLY_MAX_TERMS}
          data-testid={`poly-add-${prefix}`}
        >
          + {b('添加项', 'Add term')}
        </button>
      </header>
      <div className="poly-term-head">
        <span>{b('系数', 'Coefficient')}</span>
        <span>{b('指数', 'Exponent')}</span>
        <span />
      </div>
      {rows.length === 0 ? (
        <div className="poly-term-empty">{b('空多项式（结果按 0 处理）', 'Empty polynomial (treated as 0)')}</div>
      ) : null}
      {rows.map((row, index) => (
        <div className="poly-term-row" key={row.id} data-testid={`poly-row-${prefix}`}>
          <input
            className="input structure-field-input"
            data-testid={`poly-coefficient-${prefix}`}
            type="number"
            value={row.coefficient}
            onChange={(event) => update(index, { coefficient: event.target.value })}
            placeholder={index === 0 ? '3' : '-5'}
            aria-label={`${label} ${b('系数', 'coefficient')} ${index + 1}`}
          />
          <input
            className="input structure-field-input"
            data-testid={`poly-exponent-${prefix}`}
            type="number"
            min={0}
            max={CHAPTER2_LIMITS.POLY_MAX_EXPONENT}
            value={row.exponent}
            onChange={(event) => update(index, { exponent: event.target.value })}
            placeholder={index === 0 ? '4' : '0'}
            aria-label={`${label} ${b('指数', 'exponent')} ${index + 1}`}
          />
          <button
            className="btn small structure-remove"
            type="button"
            onClick={() => onChange(rows.filter((_, position) => position !== index))}
            aria-label={b('删除该项', 'Remove term')}
            data-testid={`poly-remove-${prefix}`}
          >
            ×
          </button>
        </div>
      ))}
    </section>
  );
}

export function PolynomialInputEditor({
  a,
  b,
  onChange,
}: {
  a: PolynomialTermRow[];
  b: PolynomialTermRow[];
  onChange: (a: PolynomialTermRow[], b: PolynomialTermRow[]) => void;
}) {
  const { b: translate } = useI18n();
  return (
    <div className="poly-editor" data-testid="polynomial-editor">
      <p className="poly-editor-note">
        {translate(
          '每行一项：系数非零，指数为非负整数；同一多项式不能重复指数，且必须按指数降序。顺序不符会报错，算法不会悄悄排序。',
          'One term per row: a nonzero coefficient and a non-negative integer exponent. Exponents must be unique and descending; wrong order is reported, never silently sorted.',
        )}
      </p>
      <div className="poly-editor-grid">
        <TermList label="A(x)" rows={a} prefix="a" onChange={(rows) => onChange(rows, b)} />
        <TermList label="B(x)" rows={b} prefix="b" onChange={(rows) => onChange(a, rows)} />
      </div>
    </div>
  );
}

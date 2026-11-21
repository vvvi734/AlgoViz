import { useI18n } from '../../i18n/I18nProvider';
import {
  SPARSE_INPUT_LIMITS,
  nextSparseTriplePosition,
  type SparseInputFields,
  type SparseTripleFields,
} from '../../domain/algorithms/sparseInput';

/**
 * INPUT-07: matrix shape plus a row-major non-zero triple table.
 * The editor never sorts or drops entries; validation reports the exact row
 * that violates the existing Python contract.
 */
export function SparseInputEditor({
  draft,
  onChange,
}: {
  draft: SparseInputFields;
  onChange: (next: SparseInputFields) => void;
}) {
  const { t } = useI18n();
  const canAdd =
    draft.triples.length < SPARSE_INPUT_LIMITS.TRIPLES_MAX &&
    nextSparseTriplePosition(draft) !== null;

  const setTriples = (triples: SparseTripleFields[]) => onChange({ ...draft, triples });
  const addTriple = () => {
    const next = nextSparseTriplePosition(draft);
    if (!next) return;
    setTriples([
      ...draft.triples,
      { row: String(next.row), col: String(next.col), value: '1' },
    ]);
  };
  const updateTriple = (index: number, patch: Partial<SparseTripleFields>) => {
    setTriples(
      draft.triples.map((triple, candidate) =>
        candidate === index ? { ...triple, ...patch } : triple,
      ),
    );
  };

  return (
    <div className="sparse-input-editor" data-testid="sparse-input-editor">
      <div className="sparse-input-summary" data-testid="sparse-input-summary">
        <span className="sparse-input-chip">
          {draft.rows || '—'} × {draft.cols || '—'}
        </span>
        <span className="sparse-input-chip">
          {t('sparseInputNonZero').replace('{count}', String(draft.triples.length))}
        </span>
        <span className="sparse-input-limit">
          {t('sparseInputLimitNote')
            .replace('{size}', String(SPARSE_INPUT_LIMITS.SHAPE_MAX))
            .replace('{count}', String(SPARSE_INPUT_LIMITS.TRIPLES_MAX))}
        </span>
      </div>

      <div className="sparse-shape-row">
        <label className="sparse-shape-field">
          <span>{t('sparseInputRows')}</span>
          <input
            id="run-input"
            className="input"
            data-testid="sparse-rows"
            value={draft.rows}
            onChange={(event) => onChange({ ...draft, rows: event.target.value })}
            inputMode="numeric"
            maxLength={2}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
        <span className="sparse-shape-times" aria-hidden="true">×</span>
        <label className="sparse-shape-field">
          <span>{t('sparseInputCols')}</span>
          <input
            className="input"
            data-testid="sparse-cols"
            value={draft.cols}
            onChange={(event) => onChange({ ...draft, cols: event.target.value })}
            inputMode="numeric"
            maxLength={2}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="sparse-input-block">
        <div className="sparse-input-block-head">
          <span className="sparse-input-block-title">{t('sparseInputTriplesLabel')}</span>
          <button
            className="btn small sparse-add-button"
            type="button"
            onClick={addTriple}
            disabled={!canAdd}
            data-testid="sparse-add-triple"
          >
            {t('sparseAddTriple')}
          </button>
        </div>
        <div className="sparse-triple-table" role="table" aria-label={t('sparseInputTriplesLabel')}>
          <div className="sparse-triple-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{t('sparseTripleRow')}</span>
            <span role="columnheader">{t('sparseTripleCol')}</span>
            <span role="columnheader">{t('sparseTripleValue')}</span>
            <span role="columnheader" className="sparse-row-action-label">
              {t('sparseRowAction')}
            </span>
          </div>
          {draft.triples.length === 0 ? (
            <p className="sparse-table-empty note muted">{t('sparseNoTriples')}</p>
          ) : (
            draft.triples.map((triple, index) => (
              <div className="sparse-triple-row" role="row" key={`triple-${index}`} data-testid="sparse-triple-row">
                <span className="sparse-row-index" role="cell">{index + 1}</span>
                <input
                  className="input sparse-triple-input"
                  data-testid="sparse-triple-row-input"
                  role="cell"
                  aria-label={`${t('sparseTripleRow')} ${index + 1}`}
                  value={triple.row}
                  onChange={(event) => updateTriple(index, { row: event.target.value })}
                  inputMode="numeric"
                  maxLength={2}
                  spellCheck={false}
                  autoComplete="off"
                />
                <input
                  className="input sparse-triple-input"
                  data-testid="sparse-triple-col-input"
                  role="cell"
                  aria-label={`${t('sparseTripleCol')} ${index + 1}`}
                  value={triple.col}
                  onChange={(event) => updateTriple(index, { col: event.target.value })}
                  inputMode="numeric"
                  maxLength={2}
                  spellCheck={false}
                  autoComplete="off"
                />
                <input
                  className="input sparse-triple-input"
                  data-testid="sparse-triple-value-input"
                  role="cell"
                  aria-label={`${t('sparseTripleValue')} ${index + 1}`}
                  value={triple.value}
                  onChange={(event) => updateTriple(index, { value: event.target.value })}
                  inputMode="numeric"
                  maxLength={4}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  className="btn small sparse-row-remove"
                  type="button"
                  onClick={() => setTriples(draft.triples.filter((_, candidate) => candidate !== index))}
                  aria-label={`${t('sparseRemoveTriple')} ${index + 1}`}
                  title={t('sparseRemoveTriple')}
                  data-testid="sparse-triple-remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

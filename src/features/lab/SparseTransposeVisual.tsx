import { useI18n } from '../../i18n/I18nProvider';
import type {
  SparseTransposeOperation,
  SparseTransposePhase,
} from '../../domain/trace/sparseTransposeSchema';
import type {
  SparseMatrixCellModel,
  SparseTransposeVisualModel,
  SparseTripletRowModel,
} from '../../domain/visualization/sparseTransposeModel';
import '../../styles/matrix01.css';

const OPERATION_KEYS: Record<SparseTransposeOperation, string> = {
  init: 'sparseOpInit',
  'count-start': 'sparseOpCountStart',
  'count-scan': 'sparseOpCountScan',
  'count-complete': 'sparseOpCountComplete',
  'cpot-start': 'sparseOpCpotStart',
  'cpot-compute': 'sparseOpCpotCompute',
  'cpot-complete': 'sparseOpCpotComplete',
  'place-start': 'sparseOpPlaceStart',
  'place-read': 'sparseOpPlaceRead',
  'place-write': 'sparseOpPlaceWrite',
  'place-update': 'sparseOpPlaceUpdate',
  done: 'sparseOpDone',
};

const PHASE_KEYS: Record<SparseTransposePhase, string> = {
  count: 'sparsePhaseCount',
  cpot: 'sparsePhaseCpot',
  place: 'sparsePhasePlace',
  done: 'sparsePhaseDone',
};

const MATRIX_CELL = 38;

function MatrixBlock({
  title,
  rows,
  cols,
  cells,
  kind,
  testId,
  emptyLabel,
}: {
  title: string;
  rows: number;
  cols: number;
  cells: SparseMatrixCellModel[];
  kind: 'original' | 'result';
  testId: string;
  emptyLabel: string;
}) {
  const columns = cols > 0 ? `22px repeat(${cols}, ${MATRIX_CELL}px)` : '22px';
  return (
    <section className={`sparse-matrix-block sparse-matrix-${kind}`}>
      <header className="sparse-block-head">
        <span className="sparse-block-title">{title}</span>
        <span className="sparse-shape">
          {rows} × {cols}
        </span>
      </header>
      {rows === 0 || cols === 0 ? (
        <div className="sparse-empty-matrix">{emptyLabel}</div>
      ) : (
        <div
          className="sparse-matrix-grid"
          data-testid={testId}
          style={{ gridTemplateColumns: columns }}
        >
          <span className="sparse-grid-corner" aria-hidden="true" />
          {Array.from({ length: cols }, (_, col) => (
            <span className="sparse-col-label" key={`c-${col}`}>
              {col}
            </span>
          ))}
          {Array.from({ length: rows }, (_, row) => (
            <span className="sparse-grid-line" key={`r-${row}`} style={{ display: 'contents' }}>
              <span className="sparse-row-label">{row}</span>
              {cells
                .filter((cell) => cell.row === row)
                .map((cell) => (
                  <span
                    className={`sparse-cell is-${cell.tone}${cell.pending ? ' is-pending' : ''}`}
                    key={`${row}-${cell.col}`}
                    data-testid={`${testId}-cell`}
                    data-row={cell.row}
                    data-col={cell.col}
                    data-tone={cell.tone}
                    data-value={cell.pending ? '' : cell.value}
                  >
                    {cell.tone === 'zero' ? '0' : cell.pending ? '?' : cell.value}
                  </span>
                ))}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function TripletTable({
  title,
  rows,
  testId,
  kind,
  emptyLabel,
}: {
  title: string;
  rows: SparseTripletRowModel[];
  testId: string;
  kind: 'source' | 'result';
  emptyLabel: string;
}) {
  return (
    <section className={`sparse-triplet-block sparse-triplet-${kind}`}>
      <header className="sparse-block-head">
        <span className="sparse-block-title">{title}</span>
        <span className="sparse-shape">{rows.length} 项</span>
      </header>
      {rows.length === 0 ? (
        <div className="sparse-empty-triplets">{emptyLabel}</div>
      ) : (
        <div className="sparse-triplet-scroll">
          <table className="sparse-triplet-table" data-testid={testId}>
            <thead>
              <tr>
                <th>#</th>
                <th>row</th>
                <th>col</th>
                <th>val</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.index}
                  className={`is-${row.tone}`}
                  data-testid={`${testId}-row`}
                  data-index={row.index}
                  data-tone={row.tone}
                  data-row={row.row ?? ''}
                  data-col={row.col ?? ''}
                  data-value={row.value ?? ''}
                >
                  <td className="sparse-trip-index">{row.index}</td>
                  <td>{row.row ?? '—'}</td>
                  <td>{row.col ?? '—'}</td>
                  <td className="sparse-trip-value">{row.value ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AuxTable({ model }: { model: SparseTransposeVisualModel }) {
  const { t } = useI18n();
  const columns = `58px repeat(${Math.max(model.cols, 1)}, ${MATRIX_CELL}px)`;
  return (
    <section className="sparse-aux" data-testid="sparse-aux">
      <header className="sparse-aux-head">
        <span className="sparse-block-title">{t('sparseAuxTitle')}</span>
        <span className="sparse-shape">
          cpot {model.cpotReady}/{model.cols}
        </span>
      </header>
      {model.cols === 0 ? (
        <div className="sparse-empty-aux">{t('sparseNoColumns')}</div>
      ) : (
        <div className="sparse-aux-grid" style={{ gridTemplateColumns: columns }}>
          <span className="sparse-aux-label">{t('sparseColumn')}</span>
          {model.aux.map((item) => (
            <span
              className={`sparse-aux-col${item.active ? ' is-active' : ''}${
                item.updated ? ' is-updated' : ''
              }`}
              key={`head-${item.col}`}
              data-testid="sparse-aux-col"
              data-col={item.col}
              data-active={item.active}
              data-updated={item.updated}
            >
              {item.col}
            </span>
          ))}
          <span className="sparse-aux-label">{t('sparseNum')}</span>
          {model.aux.map((item) => (
            <span
              className={`sparse-aux-value${item.active ? ' is-active' : ''}`}
              key={`num-${item.col}`}
              data-testid="sparse-num"
            >
              {item.num}
            </span>
          ))}
          <span className="sparse-aux-label">{t('sparseCpot')}</span>
          {model.aux.map((item) => (
            <span
              className={`sparse-aux-value${item.active ? ' is-active' : ''}${
                item.updated ? ' is-updated' : ''
              }${item.cpot === null ? ' is-pending' : ''}`}
              key={`cpot-${item.col}`}
              data-testid="sparse-cpot"
            >
              {item.cpot ?? '—'}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Matrix 01 fast transpose. The canvas intentionally carries only state:
 * matrices, triplet tables, num/cpot and the current source/target slots.
 * The lesson rail owns the prose.
 */
export function SparseTransposeVisual({ model }: { model: SparseTransposeVisualModel }) {
  const { t } = useI18n();
  return (
    <div
      className="sparse-visual"
      data-testid="sparse-transpose-visual"
      data-phase={model.phase}
      data-operation={model.operation}
      data-source-index={model.sourceIndex ?? ''}
      data-target-index={model.targetIndex ?? ''}
      data-column-index={model.columnIndex ?? ''}
      data-written={model.writtenCount}
      data-total={model.triples.length}
      role="group"
      aria-label={t('sparseVisualLabel')}
    >
      <div className="sparse-head">
        <span className="sparse-op" data-testid="sparse-operation">
          {t(OPERATION_KEYS[model.operation])}
        </span>
        <span className="sparse-chip is-phase" data-testid="sparse-phase">
          {t(PHASE_KEYS[model.phase])}
        </span>
        <span className="sparse-chip is-source" data-testid="sparse-source-chip">
          src #{model.sourceIndex ?? '—'} → dst #{model.targetIndex ?? '—'}
        </span>
        {model.columnIndex !== null && (
          <span className="sparse-chip is-column" data-testid="sparse-column-chip">
            col {model.columnIndex}
          </span>
        )}
        <span className="sparse-written" data-testid="sparse-written">
          {t('sparseWritten').replace('{done}', String(model.writtenCount)).replace(
            '{total}',
            String(model.triples.length),
          )}
        </span>
      </div>

      <div className="sparse-main">
        <MatrixBlock
          title={t('sparseOriginalMatrix')}
          rows={model.rows}
          cols={model.cols}
          cells={model.originalCells}
          kind="original"
          testId="sparse-original"
          emptyLabel={t('sparseEmptyMatrix')}
        />
        <span className="sparse-transpose-arrow" aria-hidden="true">
          ⇄
        </span>
        <MatrixBlock
          title={t('sparseResultMatrix')}
          rows={model.cols}
          cols={model.rows}
          cells={model.resultCells}
          kind="result"
          testId="sparse-result"
          emptyLabel={t('sparseEmptyMatrix')}
        />
      </div>

      <AuxTable model={model} />

      <div className="sparse-tables">
        <TripletTable
          title={t('sparseSourceTriples')}
          rows={model.sourceRows}
          testId="sparse-source-triples"
          kind="source"
          emptyLabel={t('sparseEmptyTriples')}
        />
        <div className="sparse-map-note" aria-hidden="true">
          <span>(r, c)</span>
          <b>→</b>
          <span>(c, r)</span>
        </div>
        <TripletTable
          title={t('sparseResultTriples')}
          rows={model.resultRows}
          testId="sparse-result-triples"
          kind="result"
          emptyLabel={t('sparseEmptyTriples')}
        />
      </div>
    </div>
  );
}

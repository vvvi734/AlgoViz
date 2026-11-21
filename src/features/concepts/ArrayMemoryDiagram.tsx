import { useState } from 'react';
import type { Lang } from '../../i18n/types';

const MATRIX = [
  [3, 5, 7, 9],
  [2, 4, 6, 8],
  [1, 10, 11, 12],
] as const;
const ROWS = MATRIX.length;
const COLS = MATRIX[0]!.length;
const BASE = 1000;
const WIDTH = 4;

type Order = 'row' | 'column';

/** 3×4 数组的二维逻辑位置 ↔ 一维连续内存，支持行/列优先切换与选中联动。 */
export function ArrayMemoryDiagram({ lang }: { lang: Lang }) {
  const [order, setOrder] = useState<Order>('row');
  const [selected, setSelected] = useState({ i: 1, j: 2 });
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const sequence = order === 'row'
    ? Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => ({ row, col, value: MATRIX[row]![col]! })))
        .flat()
    : Array.from({ length: COLS }, (_, col) =>
        Array.from({ length: ROWS }, (_, row) => ({ row, col, value: MATRIX[row]![col]! })))
        .flat();
  const selectedIndex = sequence.findIndex(
    (item) => item.row === selected.i && item.col === selected.j,
  );
  const address = BASE + selectedIndex * WIDTH;
  const formula = order === 'row'
    ? `Loc(i,j) = ${BASE} + (i*${COLS} + j)*${WIDTH}`
    : `Loc(i,j) = ${BASE} + (j*${ROWS} + i)*${WIDTH}`;
  const value = MATRIX[selected.i]![selected.j]!;

  return (
    <div className="array-memory" data-testid="array-memory" data-order={order}>
      <div className="array-memory-head">
        <div>
          <h4>{L('二维数组 A[3][4] → 一维连续内存', '2D array A[3][4] → contiguous memory')}</h4>
          <p className="note muted">
            {L('点击任一格，观察它在二维表和一维序列中的同一位置。', 'Click any cell to track the same element in the 2D table and the 1D sequence.')}
          </p>
        </div>
        <div className="array-memory-toggle" role="group" aria-label={L('存储顺序', 'Storage order')}>
          <button
            type="button"
            className={order === 'row' ? 'is-active' : ''}
            aria-pressed={order === 'row'}
            onClick={() => setOrder('row')}
            data-testid="array-order-row"
          >
            {L('行优先', 'Row-major')}
          </button>
          <button
            type="button"
            className={order === 'column' ? 'is-active' : ''}
            aria-pressed={order === 'column'}
            onClick={() => setOrder('column')}
            data-testid="array-order-column"
          >
            {L('列优先', 'Column-major')}
          </button>
        </div>
      </div>

      <div className="array-memory-body">
        <div className="array-matrix-wrap">
          <div className="array-axis-label">
            {L('二维逻辑结构：A[i][j]（0 基）', 'Logical view: A[i][j] (0-based)')}
          </div>
          <div className="array-col-labels" aria-hidden="true">
            {Array.from({ length: COLS }, (_, col) => <span key={col}>j={col}</span>)}
          </div>
          <div className="array-matrix-grid">
            <div className="array-row-labels" aria-hidden="true">
              {Array.from({ length: ROWS }, (_, row) => <span key={row}>i={row}</span>)}
            </div>
            <div className="array-cells">
              {MATRIX.map((rowValues, row) =>
                rowValues.map((cellValue, col) => {
                  const chosen = row === selected.i && col === selected.j;
                  return (
                    <button
                      type="button"
                      key={`${row}-${col}`}
                      className={`array-cell${chosen ? ' is-selected' : ''}`}
                      aria-pressed={chosen}
                      onClick={() => setSelected({ i: row, j: col })}
                      data-testid={`array-cell-${row}-${col}`}
                    >
                      <span className="array-cell-value">{cellValue}</span>
                      <span className="array-cell-index">A[{row}][{col}]</span>
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>

        <div className="array-memory-info">
          <span className="array-info-kicker">{L('选中元素', 'Selected element')}</span>
          <strong data-testid="array-selected-label">A[{selected.i}][{selected.j}] = {value}</strong>
          <span className="note">
            {L('一维位置', '1D position')} <b>k = {selectedIndex}</b>
          </span>
          <span className="note">
            {L('起始地址', 'Base')} = {BASE}，{L('元素宽度', 'element width')} w = {WIDTH}
          </span>
          <span className="array-address" data-testid="array-address">
            Loc = {address}
          </span>
          <code>{formula}</code>
        </div>
      </div>

      <div className="array-memory-strip-wrap">
        <div className="array-axis-label">
          {L('一维物理存储：连续单元格', 'Physical storage: one contiguous row')}
        </div>
        <div className="array-memory-strip" role="list" data-testid="array-memory-strip">
          {sequence.map((item, index) => {
            const chosen = item.row === selected.i && item.col === selected.j;
            return (
              <button
                type="button"
                role="listitem"
                key={`${item.row}-${item.col}-${index}`}
                className={`array-memory-slot${chosen ? ' is-selected' : ''}`}
                onClick={() => setSelected({ i: item.row, j: item.col })}
                data-testid={`array-slot-${index}`}
              >
                <span className="array-slot-index">k={index}</span>
                <span className="array-slot-value">{item.value}</span>
                <span className="array-slot-coord">({item.row},{item.col})</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="array-memory-note">
        {L(
          '公式与图使用同一套 0 基下标；若题目从 1 开始，先把 i、j 各减 1 再代入。',
          'The formula and diagram share 0-based indices; for 1-based problems subtract 1 from i and j first.',
        )}
      </p>
    </div>
  );
}

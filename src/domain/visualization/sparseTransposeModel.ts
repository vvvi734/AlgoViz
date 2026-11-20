import type {
  SparseTransposeOperation,
  SparseTransposePhase,
  SparseTransposeSnapshot,
  SparseTriplet,
} from '../trace/sparseTransposeSchema';

export type SparseMatrixTone = 'zero' | 'value' | 'source' | 'target';
export type SparseTripletTone = 'pending' | 'source' | 'done' | 'target' | 'empty';

export interface SparseMatrixCellModel {
  row: number;
  col: number;
  value: number;
  tone: SparseMatrixTone;
  pending: boolean;
}

export interface SparseTripletRowModel {
  index: number;
  row: number | null;
  col: number | null;
  value: number | null;
  tone: SparseTripletTone;
}

export interface SparseAuxModel {
  col: number;
  num: number;
  cpot: number | null;
  active: boolean;
  updated: boolean;
}

export interface SparseTransposeVisualModel {
  kind: 'sparse-transpose';
  phase: SparseTransposePhase;
  operation: SparseTransposeOperation;
  rows: number;
  cols: number;
  triples: SparseTriplet[];
  num: number[];
  cpot: number[];
  cpotReady: number;
  sourceIndex: number | null;
  targetIndex: number | null;
  columnIndex: number | null;
  result: Array<SparseTriplet | null>;
  sourceRows: SparseTripletRowModel[];
  resultRows: SparseTripletRowModel[];
  originalCells: SparseMatrixCellModel[];
  resultCells: SparseMatrixCellModel[];
  aux: SparseAuxModel[];
  writtenCount: number;
  activeSource: SparseTriplet | null;
  activeTarget: SparseTriplet | null;
}

function indexTriplets(triples: readonly SparseTriplet[]): Map<string, number> {
  return new Map(triples.map((triple, index) => [`${triple.row}:${triple.col}`, index]));
}

function buildOriginalCells(
  snapshot: SparseTransposeSnapshot,
  activeSource: SparseTriplet | null,
): SparseMatrixCellModel[] {
  const values = indexTriplets(snapshot.triples);
  const cells: SparseMatrixCellModel[] = [];
  for (let row = 0; row < snapshot.rows; row += 1) {
    for (let col = 0; col < snapshot.cols; col += 1) {
      const index = values.get(`${row}:${col}`);
      const value = index === undefined ? 0 : snapshot.triples[index].value;
      const isSource = activeSource !== null && activeSource.row === row && activeSource.col === col;
      cells.push({
        row,
        col,
        value,
        tone: isSource ? 'source' : value !== 0 ? 'value' : 'zero',
        pending: false,
      });
    }
  }
  return cells;
}

function buildResultCells(
  snapshot: SparseTransposeSnapshot,
  activeSource: SparseTriplet | null,
): SparseMatrixCellModel[] {
  const cells: SparseMatrixCellModel[] = [];
  const values = new Map<string, number>();
  for (const item of snapshot.result) {
    if (item !== null) values.set(`${item.row}:${item.col}`, item.value);
  }
  // Only the placement phase owns a target slot. During counting/cpot, the
  // source is active but no output slot has been selected yet.
  const targetKey =
    activeSource !== null &&
    snapshot.targetIndex !== null &&
    snapshot.operation.startsWith('place-')
      ? `${activeSource.col}:${activeSource.row}`
      : null;
  for (let row = 0; row < snapshot.cols; row += 1) {
    for (let col = 0; col < snapshot.rows; col += 1) {
      const value = values.get(`${row}:${col}`) ?? 0;
      const key = `${row}:${col}`;
      let tone: SparseMatrixTone = value !== 0 ? 'value' : 'zero';
      if (targetKey === key) tone = 'target';
      cells.push({ row, col, value, tone, pending: tone === 'target' && !values.has(key) });
    }
  }
  return cells;
}

function buildSourceRows(snapshot: SparseTransposeSnapshot): SparseTripletRowModel[] {
  return snapshot.triples.map((triple, index) => {
    const isSource = snapshot.sourceIndex === index;
    const isDone =
      snapshot.operation === 'done' ||
      (snapshot.sourceIndex !== null && index < snapshot.sourceIndex);
    return {
      index,
      row: triple.row,
      col: triple.col,
      value: triple.value,
      tone: isSource ? 'source' : isDone ? 'done' : 'pending',
    };
  });
}

function buildResultRows(
  snapshot: SparseTransposeSnapshot,
  activeSource: SparseTriplet | null,
): SparseTripletRowModel[] {
  return snapshot.result.map((triple, index) => {
    if (snapshot.targetIndex === index && snapshot.operation.startsWith('place-')) {
      return {
        index,
        row: triple?.row ?? activeSource?.col ?? null,
        col: triple?.col ?? activeSource?.row ?? null,
        value: triple?.value ?? null,
        tone: 'target',
      };
    }
    if (triple === null) return { index, row: null, col: null, value: null, tone: 'empty' };
    return { index, row: triple.row, col: triple.col, value: triple.value, tone: 'done' };
  });
}

export function buildSparseTransposeModel(
  snapshot: SparseTransposeSnapshot,
): SparseTransposeVisualModel {
  // The schema keeps the active source derivable from sourceIndex; the extra
  // helper is not stored in the frame so the trace stays compact.
  const activeSource =
    snapshot.sourceIndex === null ? null : (snapshot.triples[snapshot.sourceIndex] ?? null);
  const activeTarget =
    snapshot.targetIndex === null
      ? null
      : (snapshot.result[snapshot.targetIndex] ??
        (activeSource
          ? { row: activeSource.col, col: activeSource.row, value: activeSource.value }
          : null));
  return {
    kind: 'sparse-transpose',
    phase: snapshot.phase,
    operation: snapshot.operation,
    rows: snapshot.rows,
    cols: snapshot.cols,
    triples: snapshot.triples,
    num: snapshot.num,
    cpot: snapshot.cpot,
    cpotReady: snapshot.cpotReady,
    sourceIndex: snapshot.sourceIndex,
    targetIndex: snapshot.targetIndex,
    columnIndex: snapshot.columnIndex,
    result: snapshot.result,
    sourceRows: buildSourceRows(snapshot),
    resultRows: buildResultRows(snapshot, activeSource),
    originalCells: buildOriginalCells(snapshot, activeSource),
    resultCells: buildResultCells(snapshot, activeSource),
    aux: Array.from({ length: snapshot.cols }, (_, col) => ({
      col,
      num: snapshot.num[col],
      cpot: col < snapshot.cpotReady ? snapshot.cpot[col] : null,
      active: snapshot.columnIndex === col,
      updated:
        snapshot.operation === 'place-update' &&
        activeSource !== null &&
        activeSource.col === col,
    })),
    writtenCount: snapshot.result.filter((item) => item !== null).length,
    activeSource,
    activeTarget,
  };
}

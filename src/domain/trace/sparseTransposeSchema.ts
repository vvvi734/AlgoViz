import { z } from 'zod';

/**
 * MATRIX-01 — sparse-matrix fast transpose.
 *
 * A sparse matrix is stored as a row-major triple table `(row, col, value)`.
 * Everything in this course is 0-based: matrix rows/columns and triple indices
 * all start at 0. The result is another row-major triple table for the
 * transposed matrix, with the same number of non-zero entries.
 */
export const SPARSE_TRANSPOSE_PHASES = ['count', 'cpot', 'place', 'done'] as const;
export const SPARSE_TRANSPOSE_OPERATIONS = [
  'init',
  'count-start',
  'count-scan',
  'count-complete',
  'cpot-start',
  'cpot-compute',
  'cpot-complete',
  'place-start',
  'place-read',
  'place-write',
  'place-update',
  'done',
] as const;

export type SparseTransposePhase = (typeof SPARSE_TRANSPOSE_PHASES)[number];
export type SparseTransposeOperation = (typeof SPARSE_TRANSPOSE_OPERATIONS)[number];

export const SPARSE_MAX_ROWS = 10;
export const SPARSE_MAX_COLS = 10;
export const SPARSE_MAX_TRIPLES = 24;

const OPERATION_PHASE: Record<SparseTransposeOperation, SparseTransposePhase> = {
  init: 'count',
  'count-start': 'count',
  'count-scan': 'count',
  'count-complete': 'count',
  'cpot-start': 'cpot',
  'cpot-compute': 'cpot',
  'cpot-complete': 'cpot',
  'place-start': 'place',
  'place-read': 'place',
  'place-write': 'place',
  'place-update': 'place',
  done: 'done',
};

export interface SparseTriplet {
  row: number;
  col: number;
  value: number;
}

const tripleSchema = z.object({
  row: z.number().int().min(0).max(SPARSE_MAX_ROWS),
  col: z.number().int().min(0).max(SPARSE_MAX_COLS),
  value: z.number().int().min(-9999).max(9999),
});

/** Column counts used by the fast-transpose algorithm. */
export function sparseColumnCounts(cols: number, triples: readonly SparseTriplet[]): number[] {
  const num = Array.from({ length: cols }, () => 0);
  for (const triple of triples) num[triple.col] += 1;
  return num;
}

/** `cpot[c]` is the first output slot for column c. */
export function sparseCpot(num: readonly number[]): number[] {
  const cpot = Array.from({ length: num.length }, () => 0);
  for (let col = 1; col < cpot.length; col += 1) {
    cpot[col] = cpot[col - 1] + num[col - 1];
  }
  return cpot;
}

/** Output slot of each source triple under the canonical row-major order. */
export function sparsePlacementOrder(
  cols: number,
  triples: readonly SparseTriplet[],
): number[] {
  const cpot = sparseCpot(sparseColumnCounts(cols, triples));
  return triples.map((triple) => {
    const slot = cpot[triple.col];
    cpot[triple.col] += 1;
    return slot;
  });
}

/** The real transpose result, with each output row filled from the placement. */
export function sparseTranspose(
  cols: number,
  triples: readonly SparseTriplet[],
): SparseTriplet[] {
  const order = sparsePlacementOrder(cols, triples);
  const result: Array<SparseTriplet | null> = Array.from({ length: triples.length }, () => null);
  triples.forEach((triple, index) => {
    result[order[index]] = { row: triple.col, col: triple.row, value: triple.value };
  });
  return result as SparseTriplet[];
}

function countsForPrefix(triples: readonly SparseTriplet[], endExclusive: number, cols: number): number[] {
  return sparseColumnCounts(cols, triples.slice(0, endExclusive));
}

function partialResult(
  triples: readonly SparseTriplet[],
  cols: number,
  endExclusive: number,
): Array<SparseTriplet | null> {
  const cpot = sparseCpot(sparseColumnCounts(cols, triples));
  const result: Array<SparseTriplet | null> = Array.from({ length: triples.length }, () => null);
  for (let index = 0; index < endExclusive; index += 1) {
    const triple = triples[index];
    const slot = cpot[triple.col];
    result[slot] = { row: triple.col, col: triple.row, value: triple.value };
    cpot[triple.col] += 1;
  }
  return result;
}

function cpotDuringPlacement(
  triples: readonly SparseTriplet[],
  cols: number,
  processed: number,
  updateCol: number | null,
): number[] {
  const cpot = sparseCpot(sparseColumnCounts(cols, triples));
  for (let index = 0; index < processed; index += 1) cpot[triples[index].col] += 1;
  if (updateCol !== null) cpot[updateCol] += 1;
  return cpot;
}

function sameTriplet(a: SparseTriplet | null, b: SparseTriplet | null): boolean {
  if (a === null || b === null) return a === b;
  return a.row === b.row && a.col === b.col && a.value === b.value;
}

function sameResult(
  actual: readonly (SparseTriplet | null)[],
  expected: readonly (SparseTriplet | null)[],
): boolean {
  return actual.length === expected.length && actual.every((item, index) => sameTriplet(item, expected[index]));
}

export const sparseTransposeSnapshotSchema = z
  .object({
    kind: z.literal('sparse-transpose'),
    phase: z.enum(SPARSE_TRANSPOSE_PHASES),
    operation: z.enum(SPARSE_TRANSPOSE_OPERATIONS),
    rows: z.number().int().min(0).max(SPARSE_MAX_ROWS),
    cols: z.number().int().min(0).max(SPARSE_MAX_COLS),
    /** Input triple table, sorted row-major and unique per (row, col). */
    triples: z.array(tripleSchema).max(SPARSE_MAX_TRIPLES),
    /** Non-zero counts for every original column. Length = cols. */
    num: z.array(z.number().int().min(0).max(SPARSE_MAX_TRIPLES)).max(SPARSE_MAX_COLS),
    /** Current first-free output slot for every original column. Length = cols. */
    cpot: z.array(z.number().int().min(0).max(SPARSE_MAX_TRIPLES)).max(SPARSE_MAX_COLS),
    /** How many leading cpot entries are computed, from 0 to cols. */
    cpotReady: z.number().int().min(0).max(SPARSE_MAX_COLS),
    /** Source triple being counted, read or written. */
    sourceIndex: z.number().int().min(0).max(SPARSE_MAX_TRIPLES - 1).nullable(),
    /** Destination slot in the result triple table. */
    targetIndex: z.number().int().min(0).max(SPARSE_MAX_TRIPLES - 1).nullable(),
    /** Column whose num/cpot entry is active in this frame. */
    columnIndex: z.number().int().min(0).max(SPARSE_MAX_COLS - 1).nullable(),
    /** Result triple table; empty slots remain null until the write frame. */
    result: z.array(tripleSchema.nullable()).max(SPARSE_MAX_TRIPLES),
  })
  .superRefine((snapshot, ctx) => {
    const issue = (path: string[], message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const count = snapshot.triples.length;
    const num = sparseColumnCounts(snapshot.cols, snapshot.triples);
    const initialCpot = sparseCpot(num);
    const order = sparsePlacementOrder(snapshot.cols, snapshot.triples);

    if (OPERATION_PHASE[snapshot.operation] !== snapshot.phase) {
      issue(['phase'], `${snapshot.operation} belongs to another phase`);
    }
    if (snapshot.num.length !== snapshot.cols) {
      issue(['num'], `num length ${snapshot.num.length} != columns ${snapshot.cols}`);
    }
    if (snapshot.cpot.length !== snapshot.cols) {
      issue(['cpot'], `cpot length ${snapshot.cpot.length} != columns ${snapshot.cols}`);
    }
    if (snapshot.result.length !== count) {
      issue(['result'], `result length ${snapshot.result.length} != triples ${count}`);
    }

    for (let index = 0; index < count; index += 1) {
      const triple = snapshot.triples[index];
      if (triple.row >= snapshot.rows) issue(['triples', String(index), 'row'], 'triple row outside matrix');
      if (triple.col >= snapshot.cols) issue(['triples', String(index), 'col'], 'triple col outside matrix');
      if (triple.value === 0) issue(['triples', String(index), 'value'], 'a sparse triplet must be non-zero');
      if (index > 0) {
        const previous = snapshot.triples[index - 1];
        const rowMajor = previous.row < triple.row || (previous.row === triple.row && previous.col < triple.col);
        if (!rowMajor) issue(['triples', String(index)], 'triples must be strictly row-major');
      }
    }
    for (let index = 0; index < snapshot.result.length; index += 1) {
      const item = snapshot.result[index];
      if (item === null) continue;
      if (item.row >= snapshot.cols) issue(['result', String(index), 'row'], 'result row outside transposed matrix');
      if (item.col >= snapshot.rows) issue(['result', String(index), 'col'], 'result col outside transposed matrix');
      if (item.value === 0) issue(['result', String(index), 'value'], 'a result triplet must be non-zero');
    }

    if (snapshot.cpotReady < 0 || snapshot.cpotReady > snapshot.cols) {
      issue(['cpotReady'], `cpotReady ${snapshot.cpotReady} outside 0..${snapshot.cols}`);
    }
    if (snapshot.columnIndex !== null && snapshot.columnIndex >= snapshot.cols) {
      issue(['columnIndex'], 'active column outside matrix');
    }
    if (snapshot.sourceIndex !== null && snapshot.sourceIndex >= count) {
      issue(['sourceIndex'], 'source index outside the triple table');
    }
    if (snapshot.targetIndex !== null && snapshot.targetIndex >= count) {
      issue(['targetIndex'], 'target index outside the result table');
    }

    const activeTriple =
      snapshot.sourceIndex === null ? null : snapshot.triples[snapshot.sourceIndex] ?? null;

    if (snapshot.phase === 'count') {
      if (snapshot.operation === 'init' || snapshot.operation === 'count-start') {
        if (!snapshot.num.every((value) => value === 0)) issue(['num'], 'counting starts from all zeros');
        if (snapshot.sourceIndex !== null || snapshot.targetIndex !== null || snapshot.columnIndex !== null) {
          issue([], 'counting initialization has no active triple');
        }
      } else if (snapshot.operation === 'count-scan') {
        if (activeTriple === null) {
          issue(['sourceIndex'], 'count-scan needs the triple being counted');
        } else {
          if (snapshot.columnIndex !== activeTriple.col) issue(['columnIndex'], 'active column must match the source triple');
          if (snapshot.targetIndex !== null) issue(['targetIndex'], 'counting has no destination slot');
          const expected = countsForPrefix(snapshot.triples, snapshot.sourceIndex! + 1, snapshot.cols);
          if (snapshot.num.some((value, index) => value !== expected[index])) {
            issue(['num'], 'count-scan num must equal the counts seen so far');
          }
        }
      } else if (snapshot.operation === 'count-complete') {
        if (snapshot.sourceIndex !== null || snapshot.targetIndex !== null || snapshot.columnIndex !== null) {
          issue([], 'completed counting has no active triple');
        }
        if (snapshot.num.some((value, index) => value !== num[index])) {
          issue(['num'], 'count-complete must equal the full column counts');
        }
      }
      if (snapshot.cpotReady !== 0 || !snapshot.cpot.every((value) => value === 0)) {
        issue(['cpot'], 'counting phase keeps cpot untouched');
      }
      if (!sameResult(snapshot.result, Array.from({ length: count }, () => null))) {
        issue(['result'], 'counting phase must not write the result table');
      }
    }

    if (snapshot.phase === 'cpot') {
      if (snapshot.num.some((value, index) => value !== num[index])) {
        issue(['num'], 'cpot phase needs the complete column counts');
      }
      if (snapshot.sourceIndex !== null || snapshot.targetIndex !== null) {
        issue([], 'cpot phase has no source/destination triplet');
      }
      if (!sameResult(snapshot.result, Array.from({ length: count }, () => null))) {
        issue(['result'], 'cpot phase must not write the result table');
      }
      if (snapshot.operation === 'cpot-start') {
        if (snapshot.cols === 0) issue(['cols'], 'empty matrix has no cpot[0]');
        if (snapshot.cpotReady !== 1 || snapshot.columnIndex !== 0) {
          issue(['cpotReady'], 'cpot-start computes only cpot[0]');
        }
      } else if (snapshot.operation === 'cpot-compute') {
        if (snapshot.cols === 0) issue(['cols'], 'empty matrix has no column to compute');
        if (snapshot.columnIndex === null || snapshot.columnIndex < 1 || snapshot.columnIndex >= snapshot.cols) {
          issue(['columnIndex'], 'cpot-compute starts at column 1');
        } else if (snapshot.cpotReady !== snapshot.columnIndex + 1) {
          issue(['cpotReady'], 'cpot-compute must finish the active column');
        }
      } else if (snapshot.operation === 'cpot-complete') {
        if (snapshot.cpotReady !== snapshot.cols || snapshot.columnIndex !== null) {
          issue(['cpotReady'], 'cpot-complete needs every cpot entry');
        }
      }
      for (let col = 0; col < snapshot.cols; col += 1) {
        const expected = col < snapshot.cpotReady ? initialCpot[col] : 0;
        if (snapshot.cpot[col] !== expected) {
          issue(['cpot', String(col)], `cpot[${col}] ${snapshot.cpot[col]} != ${expected}`);
        }
      }
    }

    if (snapshot.phase === 'place' || snapshot.phase === 'done') {
      if (snapshot.cpotReady !== snapshot.cols) issue(['cpotReady'], 'placement needs a complete cpot table');
      if (snapshot.num.some((value, index) => value !== num[index])) {
        issue(['num'], 'placement needs the complete column counts');
      }
    }

    if (snapshot.phase === 'place') {
      if (snapshot.operation === 'place-start') {
        if (snapshot.sourceIndex !== null || snapshot.targetIndex !== null || snapshot.columnIndex !== null) {
          issue([], 'place-start has no active triplet');
        }
        if (snapshot.cpot.some((value, index) => value !== initialCpot[index])) {
          issue(['cpot'], 'place-start resets cpot to its initial starts');
        }
        if (!sameResult(snapshot.result, Array.from({ length: count }, () => null))) {
          issue(['result'], 'place-start has not written any result');
        }
      } else {
        if (activeTriple === null) {
          issue(['sourceIndex'], `${snapshot.operation} needs the source triple`);
        } else {
          if (snapshot.columnIndex !== activeTriple.col) issue(['columnIndex'], 'active column must match the source triple');
          if (snapshot.targetIndex !== order[snapshot.sourceIndex!]) {
            issue(['targetIndex'], 'targetIndex must equal the write slot for this source triple');
          }
          const processed = snapshot.operation === 'place-read' ? snapshot.sourceIndex! : snapshot.sourceIndex! + 1;
          const updateCol =
            snapshot.operation === 'place-update' ? activeTriple.col : null;
          const expectedCpot = cpotDuringPlacement(snapshot.triples, snapshot.cols, snapshot.sourceIndex!, updateCol);
          if (snapshot.cpot.some((value, index) => value !== expectedCpot[index])) {
            issue(['cpot'], 'cpot must point to the next free slot');
          }
          if (!sameResult(snapshot.result, partialResult(snapshot.triples, snapshot.cols, processed))) {
            issue(['result'], 'result table does not match the triples written so far');
          }
          if (snapshot.operation === 'place-read' && snapshot.result[snapshot.targetIndex!] !== null) {
            issue(['result'], 'place-read must not overwrite the destination yet');
          }
        }
      }
    }

    if (snapshot.phase === 'done') {
      if (snapshot.sourceIndex !== null || snapshot.targetIndex !== null || snapshot.columnIndex !== null) {
        issue([], 'done has no active triplet');
      }
      if (snapshot.cpot.some((value, index) => value !== initialCpot[index] + num[index])) {
        issue(['cpot'], 'done cpot must point past every column');
      }
      if (!sameResult(snapshot.result, sparseTranspose(snapshot.cols, snapshot.triples))) {
        issue(['result'], 'done result must equal the real transpose');
      }
    }
  });

export type SparseTransposeSnapshot = z.infer<typeof sparseTransposeSnapshotSchema>;

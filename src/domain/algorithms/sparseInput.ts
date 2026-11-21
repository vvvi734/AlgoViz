/**
 * INPUT-07: sparse-matrix fast-transpose input.
 *
 * The existing MATRIX-01 Python program consumes `{rows, cols, triples}` and
 * requires the triple table to be strictly row-major. This module only parses,
 * validates and randomises that object; the Python loops still build num, cpot,
 * the result table and every frame.
 */
import type {
  GuidedBuildResult,
  GuidedRandomScenario,
} from './guidedInput';

export const SPARSE_GUIDED_INPUT = 'sparse-transpose' as const;
export type SparseGuidedInputAlgorithm = typeof SPARSE_GUIDED_INPUT;

export interface SparseTripleFields {
  row: string;
  col: string;
  value: string;
}

export interface SparseInputFields {
  rows: string;
  cols: string;
  triples: SparseTripleFields[];
}

export const SPARSE_INPUT_LIMITS = {
  SHAPE_MAX: 10,
  TRIPLES_MAX: 24,
  VALUE_ABS_MAX: 999,
} as const;

export const SPARSE_RANDOM_SCENARIOS: Record<
  SparseGuidedInputAlgorithm,
  readonly GuidedRandomScenario[]
> = {
  'sparse-transpose': [
    { id: 'typical', label: ['典型稀疏矩阵', 'Typical sparse matrix'] },
    { id: 'wide', label: ['宽矩阵与空列', 'Wide matrix with empty columns'] },
    { id: 'denser', label: ['非零元素较多', 'Higher non-zero density'] },
  ],
};

export function isSparseGuidedInputAlgorithm(id: string): id is SparseGuidedInputAlgorithm {
  return id === SPARSE_GUIDED_INPUT;
}

export function emptySparseDraft(): SparseInputFields {
  return { rows: '4', cols: '5', triples: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeInteger(value: unknown): string {
  return typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : '';
}

export function sparseDraftFromInput(input: unknown): SparseInputFields {
  if (!isRecord(input)) return emptySparseDraft();
  const triples: SparseTripleFields[] = Array.isArray(input.triples)
    ? input.triples.flatMap((entry) => {
        if (Array.isArray(entry) && entry.length === 3) {
          return [{
            row: describeInteger(entry[0]),
            col: describeInteger(entry[1]),
            value: describeInteger(entry[2]),
          }];
        }
        if (isRecord(entry)) {
          return [{
            row: describeInteger(entry.row),
            col: describeInteger(entry.col),
            value: describeInteger(entry.value),
          }];
        }
        return [];
      })
    : [];
  return {
    rows: describeInteger(input.rows) || '0',
    cols: describeInteger(input.cols) || '0',
    triples,
  };
}

function parseShape(raw: string): number | null {
  const token = raw.trim();
  if (!/^\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || value < 0 || value > SPARSE_INPUT_LIMITS.SHAPE_MAX) return null;
  return value;
}

function parseCoordinate(raw: string): number | null {
  const token = raw.trim();
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  return Number.isSafeInteger(value) ? value : null;
}

function parseValue(raw: string): number | null {
  const token = raw.trim();
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || Math.abs(value) > SPARSE_INPUT_LIMITS.VALUE_ABS_MAX) {
    return null;
  }
  return value;
}

export function buildSparseInput(fields: SparseInputFields): GuidedBuildResult {
  const rows = parseShape(fields.rows);
  const cols = parseShape(fields.cols);
  if (rows === null || cols === null) {
    return { ok: false, error: { key: 'sparseErrorShape', max: SPARSE_INPUT_LIMITS.SHAPE_MAX } };
  }
  if (fields.triples.length > SPARSE_INPUT_LIMITS.TRIPLES_MAX) {
    return { ok: false, error: { key: 'sparseErrorLimit', max: SPARSE_INPUT_LIMITS.TRIPLES_MAX } };
  }

  const triples: Array<{ row: number; col: number; value: number }> = [];
  const used = new Set<string>();
  let lastRow = -1;
  let lastCol = -1;

  for (let index = 0; index < fields.triples.length; index += 1) {
    const rowNumber = index + 1;
    const draft = fields.triples[index]!;
    const row = parseCoordinate(draft.row);
    const col = parseCoordinate(draft.col);
    if (row === null || col === null) {
      return { ok: false, error: { key: 'sparseErrorCoordinate', triple: rowNumber } };
    }
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return { ok: false, error: { key: 'sparseErrorRange', triple: rowNumber } };
    }
    const value = parseValue(draft.value);
    if (value === null) {
      return {
        ok: false,
        error: {
          key: /^[+-]?\d+$/u.test(draft.value.trim()) ? 'sparseErrorValueRange' : 'sparseErrorValue',
          triple: rowNumber,
          max: SPARSE_INPUT_LIMITS.VALUE_ABS_MAX,
        },
      };
    }
    if (value === 0) {
      return { ok: false, error: { key: 'sparseErrorValue', triple: rowNumber } };
    }

    const key = `${row}:${col}`;
    if (used.has(key)) {
      return { ok: false, error: { key: 'sparseErrorDuplicate', triple: rowNumber } };
    }
    if (row < lastRow || (row === lastRow && col <= lastCol)) {
      return { ok: false, error: { key: 'sparseErrorOrder', triple: rowNumber } };
    }
    used.add(key);
    lastRow = row;
    lastCol = col;
    triples.push({ row, col, value });
  }

  return { ok: true, input: { rows, cols, triples } };
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function randomTripletSet(
  rows: number,
  cols: number,
  count: number,
  random: () => number,
  allowedColumnLimit = cols,
): Array<{ row: number; col: number; value: number }> {
  const candidates: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < allowedColumnLimit; col += 1) {
      candidates.push({ row, col });
    }
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = randInt(random, 0, index);
    [candidates[index], candidates[swap]] = [candidates[swap]!, candidates[index]!];
  }
  return candidates
    .slice(0, Math.min(count, candidates.length))
    .sort((left, right) => left.row - right.row || left.col - right.col)
    .map((cell) => {
      const magnitude = 1 + randInt(random, 0, 8);
      return { ...cell, value: random() < 0.25 ? -magnitude : magnitude };
    });
}

export function randomSparseDraft(
  scenario: string,
  random: () => number = Math.random,
): SparseInputFields {
  if (scenario === 'wide') {
    const rows = randInt(random, 3, 5);
    const cols = randInt(random, 7, 9);
    const count = randInt(random, 4, 6);
    const triples = randomTripletSet(rows, cols, count, random, cols - 2);
    return {
      rows: String(rows),
      cols: String(cols),
      triples: triples.map((item) => ({
        row: String(item.row),
        col: String(item.col),
        value: String(item.value),
      })),
    };
  }

  if (scenario === 'denser') {
    const rows = randInt(random, 4, 5);
    const cols = randInt(random, 4, 5);
    const count = Math.min(SPARSE_INPUT_LIMITS.TRIPLES_MAX, Math.ceil((rows * cols) / 2));
    const triples = randomTripletSet(rows, cols, count, random);
    return {
      rows: String(rows),
      cols: String(cols),
      triples: triples.map((item) => ({
        row: String(item.row),
        col: String(item.col),
        value: String(item.value),
      })),
    };
  }

  const rows = randInt(random, 4, 6);
  const cols = randInt(random, 4, 6);
  const count = randInt(random, 5, 7);
  const triples = randomTripletSet(rows, cols, count, random);
  return {
    rows: String(rows),
    cols: String(cols),
    triples: triples.map((item) => ({
      row: String(item.row),
      col: String(item.col),
      value: String(item.value),
    })),
  };
}

/** Used only by the editor to append a legal next triplet; never repairs input silently. */
export function nextSparseTriplePosition(fields: SparseInputFields): { row: number; col: number } | null {
  const rows = parseShape(fields.rows);
  const cols = parseShape(fields.cols);
  if (rows === null || cols === null || rows === 0 || cols === 0) return null;
  if (fields.triples.length >= SPARSE_INPUT_LIMITS.TRIPLES_MAX) return null;

  let lastRow = -1;
  let lastCol = -1;
  const used = new Set<string>();
  for (const triple of fields.triples) {
    const row = parseCoordinate(triple.row);
    const col = parseCoordinate(triple.col);
    if (row === null || col === null) continue;
    used.add(`${row}:${col}`);
    if (row > lastRow || (row === lastRow && col > lastCol)) {
      lastRow = row;
      lastCol = col;
    }
  }

  for (let row = Math.max(0, lastRow); row < rows; row += 1) {
    const startCol = row === lastRow ? lastCol + 1 : 0;
    for (let col = Math.max(0, startCol); col < cols; col += 1) {
      if (!used.has(`${row}:${col}`)) return { row, col };
    }
  }
  return null;
}

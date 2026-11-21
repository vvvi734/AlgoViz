/**
 * TEXTBOOK-02 input contracts for the static linked list and polynomial add.
 *
 * UI rows are turned into the exact object shape consumed by the Python
 * programs. Validation rejects data that breaks the algorithm's preconditions;
 * it never quietly sorts a polynomial or repairs an invalid index.
 */

export interface Chapter2InputError {
  key: string;
  row?: number;
  max?: number;
}

export type Chapter2BuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: Chapter2InputError };

export type StaticLinkedOperation = 'insert' | 'delete' | 'traverse';

export interface StaticLinkedOperationRow {
  id: string;
  op: StaticLinkedOperation;
  position: string;
  value: string;
}

export interface StaticLinkedInputFields {
  capacity: string;
  values: string;
  operations: StaticLinkedOperationRow[];
}

export interface PolynomialTermRow {
  id: string;
  coefficient: string;
  exponent: string;
}

export interface PolynomialInputFields {
  a: PolynomialTermRow[];
  b: PolynomialTermRow[];
}

export const CHAPTER2_LIMITS = {
  STATIC_MIN_CAPACITY: 4,
  STATIC_MAX_CAPACITY: 10,
  STATIC_MAX_OPERATIONS: 8,
  POLY_MAX_TERMS: 8,
  POLY_MAX_COEFFICIENT: 99,
  POLY_MAX_EXPONENT: 12,
} as const;

const INTEGER = /^[+-]?\d+$/u;

function parseInteger(raw: string): number | null {
  const token = raw.trim();
  if (!INTEGER.test(token)) return null;
  const value = Number(token);
  return Number.isSafeInteger(value) ? value : null;
}

function parseList(raw: string): { ok: true; values: number[] } | { ok: false } {
  const source = raw.trim();
  if (source === '') return { ok: true, values: [] };
  const tokens = source.replace(/^\[\s*/u, '').replace(/\s*\]$/u, '').split(/[,\s，]+/u).filter(Boolean);
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseInteger(token);
    if (value === null) return { ok: false };
    values.push(value);
  }
  return { ok: true, values };
}

function rowId(rows: Array<{ id: string }>, sequence: number): string {
  const used = new Set(rows.map((row) => row.id));
  let next = sequence;
  while (used.has(`s${next}`)) next += 1;
  return `s${next}`;
}

export function emptyStaticLinkedDraft(): StaticLinkedInputFields {
  return { capacity: '8', values: '', operations: [] };
}

export function staticLinkedDraftFromInput(input: unknown): StaticLinkedInputFields {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return emptyStaticLinkedDraft();
  const record = input as Record<string, unknown>;
  const values = Array.isArray(record.values) ? record.values.filter((value): value is number => typeof value === 'number') : [];
  const rawOperations = Array.isArray(record.operations) ? record.operations : [];
  const operations: StaticLinkedOperationRow[] = [];
  rawOperations.forEach((entry, index) => {
    if (!Array.isArray(entry) || typeof entry[0] !== 'string') return;
    const op = entry[0] as StaticLinkedOperation;
    if (op !== 'insert' && op !== 'delete' && op !== 'traverse') return;
    operations.push({
      id: rowId(operations, index + 1),
      op,
      position: op === 'traverse' ? '' : String(entry[1] ?? ''),
      value: op === 'insert' ? String(entry[2] ?? '') : '',
    });
  });
  return {
    capacity: typeof record.capacity === 'number' ? String(record.capacity) : '8',
    values: values.join(', '),
    operations,
  };
}

export function randomStaticLinkedDraft(
  scenario: string,
  random: () => number = Math.random,
): StaticLinkedInputFields {
  const capacity = 8;
  const insertValue = () => 11 + Math.floor(random() * 80);
  if (scenario === 'empty') {
    return {
      capacity: String(capacity),
      values: '',
      operations: [
        { id: 's1', op: 'insert', position: '1', value: String(insertValue()) },
        { id: 's2', op: 'traverse', position: '', value: '' },
      ],
    };
  }
  if (scenario === 'full') {
    return {
      capacity: '4',
      values: '4, 8, 12',
      operations: [
        { id: 's1', op: 'insert', position: '2', value: String(insertValue()) },
        { id: 's2', op: 'delete', position: '1', value: '' },
        { id: 's3', op: 'insert', position: '2', value: String(insertValue()) },
        { id: 's4', op: 'traverse', position: '', value: '' },
      ],
    };
  }
  if (scenario === 'delete-head') {
    return {
      capacity: String(capacity),
      values: '7, 14, 21, 28',
      operations: [
        { id: 's1', op: 'delete', position: '1', value: '' },
        { id: 's2', op: 'insert', position: '1', value: String(insertValue()) },
        { id: 's3', op: 'traverse', position: '', value: '' },
      ],
    };
  }
  if (scenario === 'reuse-slot') {
    return {
      capacity: '6',
      values: '5, 9, 13',
      operations: [
        { id: 's1', op: 'insert', position: '2', value: String(insertValue()) },
        { id: 's2', op: 'delete', position: '3', value: '' },
        { id: 's3', op: 'insert', position: '1', value: String(insertValue()) },
        { id: 's4', op: 'traverse', position: '', value: '' },
      ],
    };
  }
  return {
    capacity: String(capacity),
    values: '10, 20, 30',
    operations: [
      { id: 's1', op: 'insert', position: '2', value: String(insertValue()) },
      { id: 's2', op: 'insert', position: '2', value: String(insertValue()) },
      { id: 's3', op: 'delete', position: '3', value: '' },
      { id: 's4', op: 'traverse', position: '', value: '' },
    ],
  };
}

export function buildStaticLinkedInput(fields: StaticLinkedInputFields): Chapter2BuildResult {
  const capacity = parseInteger(fields.capacity);
  if (capacity === null ||
      capacity < CHAPTER2_LIMITS.STATIC_MIN_CAPACITY ||
      capacity > CHAPTER2_LIMITS.STATIC_MAX_CAPACITY) {
    return { ok: false, error: { key: 'chapter2StaticCapacity' } };
  }
  const parsedValues = parseList(fields.values);
  if (!parsedValues.ok) return { ok: false, error: { key: 'chapter2StaticValues' } };
  if (parsedValues.values.length > capacity) {
    return { ok: false, error: { key: 'chapter2StaticValuesLength', max: capacity } };
  }
  if (fields.operations.length > CHAPTER2_LIMITS.STATIC_MAX_OPERATIONS) {
    return { ok: false, error: { key: 'chapter2StaticOperationLimit', max: CHAPTER2_LIMITS.STATIC_MAX_OPERATIONS } };
  }

  let live = parsedValues.values.length;
  const operations: unknown[] = [];
  for (let index = 0; index < fields.operations.length; index += 1) {
    const row = fields.operations[index]!;
    const position = row.op === 'traverse' ? null : parseInteger(row.position);
    if (row.op === 'traverse') {
      operations.push(['traverse']);
      continue;
    }
    if (position === null) {
      return { ok: false, error: { key: 'chapter2StaticPosition', row: index + 1 } };
    }
    if (row.op === 'insert') {
      if (position < 1 || position > live + 1) {
        return { ok: false, error: { key: 'chapter2StaticPositionRange', row: index + 1 } };
      }
      if (live >= capacity) {
        return { ok: false, error: { key: 'chapter2StaticFull', row: index + 1, max: capacity } };
      }
      const value = parseInteger(row.value);
      if (value === null) {
        return { ok: false, error: { key: 'chapter2StaticValue', row: index + 1 } };
      }
      operations.push(['insert', position, value]);
      live += 1;
    } else {
      if (position < 1 || position > live) {
        return { ok: false, error: { key: 'chapter2StaticDeleteRange', row: index + 1 } };
      }
      operations.push(['delete', position]);
      live -= 1;
    }
  }
  return {
    ok: true,
    input: { capacity, values: parsedValues.values, operations },
  };
}

function polyId(rows: Array<{ id: string }>, prefix: string, sequence: number): string {
  const used = new Set(rows.map((row) => row.id));
  let next = sequence;
  while (used.has(`${prefix}${next}`)) next += 1;
  return `${prefix}${next}`;
}

export function emptyPolynomialDraft(): PolynomialInputFields {
  return {
    a: [
      { id: 'a1', coefficient: '', exponent: '' },
      { id: 'a2', coefficient: '', exponent: '' },
    ],
    b: [
      { id: 'b1', coefficient: '', exponent: '' },
      { id: 'b2', coefficient: '', exponent: '' },
    ],
  };
}

export function polynomialDraftFromInput(input: unknown): PolynomialInputFields {
  const empty = emptyPolynomialDraft();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return empty;
  const record = input as Record<string, unknown>;
  const toRows = (raw: unknown, prefix: string): PolynomialTermRow[] => {
    if (!Array.isArray(raw)) return [];
    const rows: PolynomialTermRow[] = [];
    raw.forEach((term, index) => {
      if (!term || typeof term !== 'object') return;
      const source = term as Record<string, unknown>;
      if (typeof source.coefficient !== 'number' || typeof source.exponent !== 'number') return;
      rows.push({
        id: polyId(rows, prefix, index + 1),
        coefficient: String(source.coefficient),
        exponent: String(source.exponent),
      });
    });
    return rows;
  };
  return {
    a: toRows(record.a, 'a'),
    b: toRows(record.b, 'b'),
  };
}

function buildPolynomialSide(
  rows: PolynomialTermRow[],
  prefix: 'A' | 'B',
): Chapter2BuildResult {
  if (rows.length > CHAPTER2_LIMITS.POLY_MAX_TERMS) {
    return { ok: false, error: { key: 'chapter2PolyTermLimit', max: CHAPTER2_LIMITS.POLY_MAX_TERMS } };
  }
  const terms: Array<{ coefficient: number; exponent: number }> = [];
  let previous: number | null = null;
  let populated = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    if (row.coefficient.trim() === '' && row.exponent.trim() === '') continue;
    populated += 1;
    if (populated > CHAPTER2_LIMITS.POLY_MAX_TERMS) {
      return { ok: false, error: { key: 'chapter2PolyTermLimit', max: CHAPTER2_LIMITS.POLY_MAX_TERMS } };
    }
    const coefficient = parseInteger(row.coefficient);
    if (coefficient === null || Math.abs(coefficient) > CHAPTER2_LIMITS.POLY_MAX_COEFFICIENT) {
      return { ok: false, error: { key: 'chapter2PolyCoefficient', row: index + 1 } };
    }
    if (coefficient === 0) {
      return { ok: false, error: { key: 'chapter2PolyZero', row: index + 1 } };
    }
    const exponent = parseInteger(row.exponent);
    if (exponent === null || exponent < 0 || exponent > CHAPTER2_LIMITS.POLY_MAX_EXPONENT) {
      return { ok: false, error: { key: 'chapter2PolyExponent', row: index + 1, max: CHAPTER2_LIMITS.POLY_MAX_EXPONENT } };
    }
    if (previous !== null && exponent === previous) {
      return { ok: false, error: { key: 'chapter2PolyDuplicate', row: index + 1 } };
    }
    if (previous !== null && exponent > previous) {
      return { ok: false, error: { key: 'chapter2PolyOrder', row: index + 1 } };
    }
    previous = exponent;
    terms.push({ coefficient, exponent });
  }
  return { ok: true, input: { prefix, terms } };
}

export function buildPolynomialInput(fields: PolynomialInputFields): Chapter2BuildResult {
  const a = buildPolynomialSide(fields.a, 'A');
  if (!a.ok) return a;
  const b = buildPolynomialSide(fields.b, 'B');
  if (!b.ok) return b;
  // Each side validated its own descending order; the combined object is the
  // exact shape the Python program reads.
  return {
    ok: true,
    input: {
      a: (a.input as { terms: unknown[] }).terms,
      b: (b.input as { terms: unknown[] }).terms,
    },
  };
}

export const POLYNOMIAL_RANDOM_SCENARIOS = [
  { id: 'overlap', label: ['有相同指数', 'Shared exponents'] },
  { id: 'cancel', label: ['系数抵消', 'Coefficients cancel'] },
  { id: 'disjoint', label: ['指数完全不同', 'Disjoint exponents'] },
  { id: 'a-empty', label: ['A 为空', 'Empty A'] },
  { id: 'b-empty', label: ['B 为空', 'Empty B'] },
  { id: 'both-empty', label: ['两个都为空', 'Both empty'] },
] as const;

export const STATIC_LINKED_RANDOM_SCENARIOS = [
  { id: 'standard', label: ['普通插入删除', 'Typical insert/delete'] },
  { id: 'empty', label: ['空表插入', 'Insert into empty list'] },
  { id: 'full', label: ['容量耗尽', 'Capacity exhausted'] },
  { id: 'delete-head', label: ['删除首元', 'Delete the first node'] },
  { id: 'reuse-slot', label: ['回收后复用槽位', 'Reuse a recycled slot'] },
] as const;

function coefficient(random: () => number): number {
  const magnitude = 1 + Math.floor(random() * 9);
  return random() < 0.3 ? -magnitude : magnitude;
}

function termRow(prefix: string, index: number, coefficientValue: number, exponent: number): PolynomialTermRow {
  return {
    id: `${prefix}${index}`,
    coefficient: String(coefficientValue),
    exponent: String(exponent),
  };
}

export function randomPolynomialDraft(
  scenario: string,
  random: () => number = Math.random,
): PolynomialInputFields {
  if (scenario === 'a-empty') {
    return {
      a: [],
      b: [
        termRow('b', 1, coefficient(random), 4),
        termRow('b', 2, coefficient(random), 1),
      ],
    };
  }
  if (scenario === 'b-empty') {
    return {
      a: [
        termRow('a', 1, coefficient(random), 6),
        termRow('a', 2, coefficient(random), 2),
      ],
      b: [],
    };
  }
  if (scenario === 'both-empty') {
    return { a: [], b: [] };
  }
  if (scenario === 'cancel') {
    const shared = 2 + Math.floor(random() * 4);
    const value = coefficient(random);
    return {
      a: [
        termRow('a', 1, value, shared),
        termRow('a', 2, coefficient(random), 1),
      ],
      b: [
        termRow('b', 1, -value, shared),
        termRow('b', 2, coefficient(random), 0),
      ],
    };
  }
  if (scenario === 'disjoint') {
    return {
      a: [
        termRow('a', 1, coefficient(random), 6),
        termRow('a', 2, coefficient(random), 4),
        termRow('a', 3, coefficient(random), 1),
      ],
      b: [
        termRow('b', 1, coefficient(random), 5),
        termRow('b', 2, coefficient(random), 3),
        termRow('b', 3, coefficient(random), 0),
      ],
    };
  }
  const shared = 4 + Math.floor(random() * 3);
  return {
    a: [
      termRow('a', 1, coefficient(random), shared),
      termRow('a', 2, coefficient(random), 2),
      termRow('a', 3, coefficient(random), 0),
    ],
    b: [
      termRow('b', 1, coefficient(random), shared),
      termRow('b', 2, coefficient(random), 3),
      termRow('b', 3, coefficient(random), 1),
    ],
  };
}

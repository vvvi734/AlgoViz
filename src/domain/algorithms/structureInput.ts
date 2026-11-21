/**
 * INPUT-04: structured operation sequences for the linear structures that
 * already have real Python teaching programs.
 *
 * This module owns parsing, validation and random generation only. It never
 * builds visual snapshots: every accepted draft is handed to the existing
 * executor, which creates the real Node objects / list slots and emits every
 * frame. Validation keeps a lightweight semantic model so an illegal index or
 * missing target is rejected before a stale animation can be run.
 */
import type {
  GuidedBuildResult,
  GuidedInputDraft,
  GuidedInputError,
  GuidedRandomScenario,
} from './guidedInput';

export const STRUCTURE_GUIDED_INPUT_ALGORITHMS = [
  'linked',
  'doubly',
  'circular',
  'seqlist',
  'stack',
  'queue',
] as const;
export type StructureGuidedInputAlgorithm = (typeof STRUCTURE_GUIDED_INPUT_ALGORITHMS)[number];

export type StructureField = 'value' | 'index' | 'anchor';

export interface StructureOperationDraft {
  /** Stable React row identity; ignored by the Python input. */
  id: string;
  op: string;
  value: string;
  index: string;
  anchor: string;
}

export interface StructureOperationSpec {
  op: string;
  /** i18n message key for the operation name. */
  labelKey: string;
  fields: readonly StructureField[];
}

export const STRUCTURE_LIMITS = {
  MAX_OPERATIONS: 20,
  MAX_ITEMS: 10,
  SEQUENTIAL_CAPACITY: 8,
  VALUE_ABS_MAX: 1_000_000,
  MAX_INDEX: 999,
} as const;

const FIELD_LABEL_KEYS: Record<StructureField, string> = {
  value: 'structureFieldValue',
  index: 'structureFieldIndex',
  anchor: 'structureFieldAnchor',
};

export function structureFieldLabelKey(field: StructureField): string {
  return FIELD_LABEL_KEYS[field];
}

const LINKED_ONLY: readonly StructureOperationSpec[] = [
  { op: 'insert_head', labelKey: 'structureOpInsertHead', fields: ['value'] },
  { op: 'insert_tail', labelKey: 'structureOpInsertTail', fields: ['value'] },
  { op: 'insert_after', labelKey: 'structureOpInsertAfter', fields: ['anchor', 'value'] },
  { op: 'delete', labelKey: 'structureOpDeleteValue', fields: ['value'] },
  { op: 'traverse', labelKey: 'structureOpTraverse', fields: [] },
];

const DOUBLY_OPERATIONS: readonly StructureOperationSpec[] = [
  { op: 'insert_head', labelKey: 'structureOpInsertHead', fields: ['value'] },
  { op: 'insert_tail', labelKey: 'structureOpInsertTail', fields: ['value'] },
  { op: 'insert_after', labelKey: 'structureOpInsertAfter', fields: ['anchor', 'value'] },
  { op: 'delete', labelKey: 'structureOpDeleteValue', fields: ['value'] },
  { op: 'delete_head', labelKey: 'structureOpDeleteHead', fields: [] },
  { op: 'delete_tail', labelKey: 'structureOpDeleteTail', fields: [] },
  { op: 'traverse_forward', labelKey: 'structureOpTraverseForward', fields: [] },
  { op: 'traverse_reverse', labelKey: 'structureOpTraverseReverse', fields: [] },
  { op: 'find', labelKey: 'structureOpFind', fields: ['value'] },
];

const CIRCULAR_OPERATIONS: readonly StructureOperationSpec[] = [
  { op: 'insert_head', labelKey: 'structureOpInsertHead', fields: ['value'] },
  { op: 'insert_tail', labelKey: 'structureOpInsertTail', fields: ['value'] },
  { op: 'insert_after', labelKey: 'structureOpInsertAfter', fields: ['anchor', 'value'] },
  { op: 'delete', labelKey: 'structureOpDeleteValue', fields: ['value'] },
  { op: 'delete_head', labelKey: 'structureOpDeleteHead', fields: [] },
  { op: 'delete_tail', labelKey: 'structureOpDeleteTail', fields: [] },
  { op: 'traverse_circle', labelKey: 'structureOpTraverseCircle', fields: [] },
  { op: 'find', labelKey: 'structureOpFind', fields: ['value'] },
];

const SEQUENTIAL_OPERATIONS: readonly StructureOperationSpec[] = [
  { op: 'access', labelKey: 'structureOpAccess', fields: ['index'] },
  { op: 'search', labelKey: 'structureOpSearch', fields: ['value'] },
  { op: 'insert', labelKey: 'structureOpInsertAt', fields: ['index', 'value'] },
  { op: 'delete', labelKey: 'structureOpDeleteAt', fields: ['index'] },
  { op: 'traverse', labelKey: 'structureOpTraverse', fields: [] },
];

const STACK_OPERATIONS: readonly StructureOperationSpec[] = [
  { op: 'push', labelKey: 'structureOpPush', fields: ['value'] },
  { op: 'pop', labelKey: 'structureOpPop', fields: [] },
  { op: 'peek', labelKey: 'structureOpPeek', fields: [] },
];

const QUEUE_OPERATIONS: readonly StructureOperationSpec[] = [
  { op: 'enqueue', labelKey: 'structureOpEnqueue', fields: ['value'] },
  { op: 'dequeue', labelKey: 'structureOpDequeue', fields: [] },
  { op: 'front', labelKey: 'structureOpFront', fields: [] },
];

const OPERATIONS: Record<StructureGuidedInputAlgorithm, readonly StructureOperationSpec[]> = {
  linked: LINKED_ONLY,
  doubly: DOUBLY_OPERATIONS,
  circular: CIRCULAR_OPERATIONS,
  seqlist: SEQUENTIAL_OPERATIONS,
  stack: STACK_OPERATIONS,
  queue: QUEUE_OPERATIONS,
};

export function isStructureGuidedInputAlgorithm(id: string): id is StructureGuidedInputAlgorithm {
  return (STRUCTURE_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function structureOperationSpecs(id: StructureGuidedInputAlgorithm): readonly StructureOperationSpec[] {
  return OPERATIONS[id];
}

function specFor(id: StructureGuidedInputAlgorithm, op: string): StructureOperationSpec | undefined {
  return OPERATIONS[id].find((spec) => spec.op === op);
}

const SCENARIOS: Record<StructureGuidedInputAlgorithm, readonly GuidedRandomScenario[]> = {
  linked: [
    { id: 'mixed', label: ['首尾与中间混合', 'Head, tail and middle'] },
    { id: 'middle', label: ['中间插入删除', 'Middle insert / delete'] },
    { id: 'empty', label: ['空表边界', 'Empty-list boundary'] },
  ],
  doubly: [
    { id: 'mixed', label: ['双指针混合操作', 'Mixed two-way operations'] },
    { id: 'delete-ends', label: ['首尾删除', 'Delete both ends'] },
    { id: 'search', label: ['正反向遍历与查找', 'Two-way traversal and find'] },
  ],
  circular: [
    { id: 'circle', label: ['整圈遍历与头尾插入', 'Circle traversal and end inserts'] },
    { id: 'delete-ends', label: ['首尾删除与回环', 'Delete ends and repair the return edge'] },
    { id: 'single', label: ['单节点自环', 'Single-node self-loop'] },
    { id: 'empty', label: ['空表边界', 'Empty-list boundary'] },
  ],
  seqlist: [
    { id: 'shifts', label: ['首尾插删与元素搬移', 'End operations and shifting'] },
    { id: 'search', label: ['访问、查找与遍历', 'Access, search and traversal'] },
    { id: 'capacity', label: ['容量边界', 'Capacity boundary'] },
    { id: 'empty', label: ['空表边界', 'Empty-table boundary'] },
  ],
  stack: [
    { id: 'push-sequence', label: ['连续入栈', 'Consecutive pushes'] },
    { id: 'alternating', label: ['入栈 / 出栈交替', 'Alternating push / pop'] },
    { id: 'clear', label: ['最后清空栈', 'Clear the stack'] },
    { id: 'capacity', label: ['容量边界', 'Capacity boundary'] },
  ],
  queue: [
    { id: 'enqueue-sequence', label: ['连续入队', 'Consecutive enqueues'] },
    { id: 'alternating', label: ['入队 / 出队交替', 'Alternating enqueue / dequeue'] },
    { id: 'clear', label: ['最后清空队列', 'Empty the queue'] },
    { id: 'capacity', label: ['容量边界', 'Capacity boundary'] },
  ],
};

export const STRUCTURE_RANDOM_SCENARIOS = SCENARIOS;

export function structureRandomScenarios(id: StructureGuidedInputAlgorithm): readonly GuidedRandomScenario[] {
  return SCENARIOS[id];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberText(value: unknown): string {
  return typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : '';
}

function row(
  id: string,
  op: string,
  fields: Partial<Pick<StructureOperationDraft, 'value' | 'index' | 'anchor'>> = {},
): StructureOperationDraft {
  return {
    id,
    op,
    value: fields.value ?? '',
    index: fields.index ?? '',
    anchor: fields.anchor ?? '',
  };
}

function draftRowFromTuple(
  id: StructureGuidedInputAlgorithm,
  tuple: unknown[],
  position: number,
): StructureOperationDraft | null {
  if (typeof tuple[0] !== 'string') return null;
  const op = tuple[0];
  const spec = specFor(id, op);
  if (!spec) return null;
  const fields: Partial<Pick<StructureOperationDraft, 'value' | 'index' | 'anchor'>> = {};
  spec.fields.forEach((field, argument) => {
    fields[field] = numberText(tuple[argument + 1]);
  });
  return row(`r${position + 1}`, op, fields);
}

export interface StructureDraftParts {
  values: string;
  rows: StructureOperationDraft[];
}

export function structureDraftFromInput(
  id: StructureGuidedInputAlgorithm,
  input: unknown,
): StructureDraftParts {
  if (id === 'seqlist') {
    const record = isRecord(input) ? input : {};
    const initial = Array.isArray(record.values)
      ? record.values.filter((value): value is number => typeof value === 'number' && Number.isSafeInteger(value))
      : [];
    let tuples: unknown[][] = [];
    if (Array.isArray(record.operations)) {
      tuples = record.operations.filter((operation): operation is unknown[] => Array.isArray(operation));
    } else if (typeof record.operation === 'string') {
      const operation = record.operation;
      const tuple: unknown[] = [operation];
      if (operation === 'insert') tuple.push(record.index, record.value);
      else if (operation === 'delete' || operation === 'access') tuple.push(record.index);
      else if (operation === 'search') tuple.push(record.target);
      tuples = [tuple];
    }
    const rows = tuples
      .map((tuple, position) => draftRowFromTuple(id, tuple, position))
      .filter((item): item is StructureOperationDraft => item !== null && specFor(id, item.op) !== undefined);
    return { values: initial.join(', '), rows };
  }

  const tuples = Array.isArray(input)
    ? input.filter((operation): operation is unknown[] => Array.isArray(operation))
    : [];
  return {
    values: '',
    rows: tuples
      .map((tuple, position) => draftRowFromTuple(id, tuple, position))
      .filter((item): item is StructureOperationDraft => item !== null && specFor(id, item.op) !== undefined),
  };
}

function parseInteger(raw: string): number | null {
  const token = raw.trim();
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || Math.abs(value) > STRUCTURE_LIMITS.VALUE_ABS_MAX) return null;
  return value;
}

function parseIndex(raw: string): number | null {
  const token = raw.trim();
  if (!/^\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || value > STRUCTURE_LIMITS.MAX_INDEX) return null;
  return value;
}

function initialValues(raw: string): { ok: true; values: number[] } | { ok: false } {
  const source = raw.replace(/^\[\s*/u, '').replace(/\s*\]$/u, '').trim();
  if (source === '') return { ok: true, values: [] };
  const tokens = source.split(/[,\s，]+/u).filter(Boolean);
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseInteger(token);
    if (value === null) return { ok: false };
    values.push(value);
  }
  return { ok: true, values };
}

function inputError(key: string, rowNumber: number | null = null, max?: number): GuidedInputError {
  return { key, ...(rowNumber === null ? {} : { row: rowNumber }), ...(max === undefined ? {} : { max }) };
}

type ValidationState =
  | { kind: 'linked'; values: number[] }
  | { kind: 'seqlist'; values: number[] }
  | { kind: 'stack'; values: number[] }
  | { kind: 'queue'; values: number[] };

interface ParsedRow {
  op: string;
  value: number | null;
  index: number | null;
  anchor: number | null;
}

function parseRow(
  id: StructureGuidedInputAlgorithm,
  draft: StructureOperationDraft,
  rowNumber: number,
): { ok: true; parsed: ParsedRow } | { ok: false; error: GuidedInputError } {
  const spec = specFor(id, draft.op);
  if (!spec) return { ok: false, error: inputError('structureErrorOperation', rowNumber) };
  const parsed: ParsedRow = { op: draft.op, value: null, index: null, anchor: null };
  for (const field of spec.fields) {
    if (field === 'value') {
      const value = parseInteger(draft.value);
      if (value === null) return { ok: false, error: inputError('structureErrorValue', rowNumber) };
      parsed.value = value;
    } else if (field === 'index') {
      const index = parseIndex(draft.index);
      if (index === null) return { ok: false, error: inputError('structureErrorIndex', rowNumber) };
      parsed.index = index;
    } else {
      const anchor = parseInteger(draft.anchor);
      if (anchor === null) return { ok: false, error: inputError('structureErrorAnchorValue', rowNumber) };
      parsed.anchor = anchor;
    }
  }
  return { ok: true, parsed };
}

function applyRow(
  id: StructureGuidedInputAlgorithm,
  state: ValidationState,
  parsed: ParsedRow,
  rowNumber: number,
): GuidedInputError | null {
  const values = state.values;
  const empty = () => inputError('structureErrorEmpty', rowNumber);
  const full = () => inputError('structureErrorItemLimit', rowNumber, STRUCTURE_LIMITS.MAX_ITEMS);
  const missing = () => inputError('structureErrorMissing', rowNumber);

  if (id === 'stack') {
    if (parsed.op === 'push') {
      if (values.length >= STRUCTURE_LIMITS.MAX_ITEMS) return full();
      values.push(parsed.value!);
    } else if (values.length === 0) {
      return empty();
    } else if (parsed.op === 'pop') {
      values.pop();
    }
    return null;
  }

  if (id === 'queue') {
    if (parsed.op === 'enqueue') {
      if (values.length >= STRUCTURE_LIMITS.MAX_ITEMS) return full();
      values.push(parsed.value!);
    } else if (values.length === 0) {
      return empty();
    } else if (parsed.op === 'dequeue') {
      values.shift();
    }
    return null;
  }

  if (id === 'seqlist') {
    if (parsed.op === 'insert') {
      if (values.length >= STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY) {
        return inputError('structureErrorCapacity', rowNumber, STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY);
      }
      if (parsed.index! > values.length) return inputError('structureErrorPosition', rowNumber);
      values.splice(parsed.index!, 0, parsed.value!);
      return null;
    }
    if (parsed.op === 'delete') {
      if (values.length === 0) return empty();
      if (parsed.index! >= values.length) return inputError('structureErrorPosition', rowNumber);
      values.splice(parsed.index!, 1);
      return null;
    }
    if ((parsed.op === 'access') && values.length === 0) return empty();
    if (parsed.op === 'access' && parsed.index! >= values.length) {
      return inputError('structureErrorPosition', rowNumber);
    }
    return null;
  }

  if (parsed.op === 'insert_head') {
    if (values.length >= STRUCTURE_LIMITS.MAX_ITEMS) return full();
    values.unshift(parsed.value!);
  } else if (parsed.op === 'insert_tail') {
    if (values.length >= STRUCTURE_LIMITS.MAX_ITEMS) return full();
    values.push(parsed.value!);
  } else if (parsed.op === 'insert_after') {
    const at = values.indexOf(parsed.anchor!);
    if (at < 0) return inputError('structureErrorAnchor', rowNumber);
    if (values.length >= STRUCTURE_LIMITS.MAX_ITEMS) return full();
    values.splice(at + 1, 0, parsed.value!);
  } else if (parsed.op === 'delete') {
    if (values.length === 0) return empty();
    const at = values.indexOf(parsed.value!);
    if (at < 0) return missing();
    values.splice(at, 1);
  } else if (parsed.op === 'delete_head') {
    if (values.length === 0) return empty();
    values.shift();
  } else if (parsed.op === 'delete_tail') {
    if (values.length === 0) return empty();
    values.pop();
  }
  return null;
}

type StructureTuple = [string, ...number[]];

function tupleFor(parsed: ParsedRow): StructureTuple {
  if (parsed.op === 'insert_after') return [parsed.op, parsed.anchor!, parsed.value!];
  if (parsed.op === 'insert') return [parsed.op, parsed.index!, parsed.value!];
  if (parsed.op === 'access') return [parsed.op, parsed.index!];
  if (parsed.op === 'delete' && parsed.index !== null) return [parsed.op, parsed.index];
  if (parsed.value !== null) return [parsed.op, parsed.value];
  return [parsed.op];
}

export function buildStructureInput(
  id: StructureGuidedInputAlgorithm,
  draft: GuidedInputDraft,
): GuidedBuildResult {
  let initial: number[] = [];
  if (id === 'seqlist') {
    const parsed = initialValues(draft.values);
    if (!parsed.ok) return { ok: false, error: { key: 'structureErrorInitialValues' } };
    if (parsed.values.length > STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY) {
      return {
        ok: false,
        error: { key: 'structureErrorInitialLength', max: STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY },
      };
    }
    initial = parsed.values;
  }

  if (draft.rows.length === 0) return { ok: false, error: { key: 'structureErrorNoOperations' } };
  if (draft.rows.length > STRUCTURE_LIMITS.MAX_OPERATIONS) {
    return {
      ok: false,
      error: { key: 'structureErrorOperationLimit', max: STRUCTURE_LIMITS.MAX_OPERATIONS },
    };
  }

  const state: ValidationState =
    id === 'seqlist'
      ? { kind: 'seqlist', values: [...initial] }
      : id === 'stack'
        ? { kind: 'stack', values: [] }
        : id === 'queue'
          ? { kind: 'queue', values: [] }
          : { kind: 'linked', values: [] };
  const tuples: StructureTuple[] = [];

  for (const [position, rowDraft] of draft.rows.entries()) {
    const rowNumber = position + 1;
    const parsed = parseRow(id, rowDraft, rowNumber);
    if (!parsed.ok) return parsed;
    const error = applyRow(id, state, parsed.parsed, rowNumber);
    if (error) return { ok: false, error };
    tuples.push(tupleFor(parsed.parsed));
  }

  if (id === 'seqlist') {
    return {
      ok: true,
      input: {
        capacity: STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY,
        values: initial,
        operations: tuples,
      },
    };
  }
  return { ok: true, input: tuples };
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function makeRows(
  definitions: Array<[string, Partial<Pick<StructureOperationDraft, 'value' | 'index' | 'anchor'>>]>,
): StructureOperationDraft[] {
  return definitions.map(([op, fields], index) => row(`r${index + 1}`, op, fields));
}

function valuesText(values: number[]): string {
  return values.join(', ');
}

function linkedRows(
  scenario: string,
  next: () => number,
): StructureOperationDraft[] {
  const a = next();
  const b = next();
  const c = next();
  if (scenario === 'middle') {
    return makeRows([
      ['insert_head', { value: String(a) }],
      ['insert_tail', { value: String(b) }],
      ['insert_head', { value: String(c) }],
      ['insert_after', { anchor: String(a), value: String(a + 10) }],
      ['delete', { value: String(a + 10) }],
      ['traverse', {}],
    ]);
  }
  if (scenario === 'empty') {
    return makeRows([
      ['traverse', {}],
      ['insert_head', { value: String(a) }],
      ['delete', { value: String(a) }],
      ['traverse', {}],
    ]);
  }
  return makeRows([
    ['insert_head', { value: String(a) }],
    ['insert_tail', { value: String(b) }],
    ['insert_head', { value: String(c) }],
    ['insert_after', { anchor: String(c), value: String(a) }],
    ['delete', { value: String(a) }],
    ['traverse', {}],
  ]);
}

function doublyRows(
  scenario: string,
  next: () => number,
): StructureOperationDraft[] {
  const a = next();
  const b = next();
  const c = next();
  if (scenario === 'delete-ends') {
    return makeRows([
      ['insert_head', { value: String(a) }],
      ['insert_tail', { value: String(b) }],
      ['insert_tail', { value: String(c) }],
      ['delete_head', {}],
      ['delete_tail', {}],
      ['traverse_forward', {}],
    ]);
  }
  if (scenario === 'search') {
    return makeRows([
      ['insert_tail', { value: String(a) }],
      ['insert_tail', { value: String(b) }],
      ['find', { value: String(b) }],
      ['find', { value: String(b + 100) }],
      ['traverse_forward', {}],
      ['traverse_reverse', {}],
    ]);
  }
  return makeRows([
    ['insert_head', { value: String(a) }],
    ['insert_tail', { value: String(b) }],
    ['insert_after', { anchor: String(a), value: String(c) }],
    ['find', { value: String(c) }],
    ['delete', { value: String(c) }],
    ['traverse_forward', {}],
    ['delete_head', {}],
    ['delete_tail', {}],
  ]);
}

function circularRows(
  scenario: string,
  next: () => number,
): StructureOperationDraft[] {
  const a = next();
  const b = next();
  const c = next();
  if (scenario === 'delete-ends') {
    return makeRows([
      ['insert_head', { value: String(a) }],
      ['insert_tail', { value: String(b) }],
      ['insert_tail', { value: String(c) }],
      ['delete_head', {}],
      ['delete_tail', {}],
      ['traverse_circle', {}],
    ]);
  }
  if (scenario === 'single') {
    return makeRows([
      ['insert_head', { value: String(a) }],
      ['traverse_circle', {}],
      ['delete_head', {}],
      ['traverse_circle', {}],
    ]);
  }
  if (scenario === 'empty') {
    return makeRows([
      ['traverse_circle', {}],
      ['insert_tail', { value: String(a) }],
      ['delete_tail', {}],
      ['traverse_circle', {}],
    ]);
  }
  return makeRows([
    ['insert_head', { value: String(a) }],
    ['insert_tail', { value: String(b) }],
    ['insert_tail', { value: String(c) }],
    ['traverse_circle', {}],
    ['delete_head', {}],
    ['insert_after', { anchor: String(b), value: String(a) }],
    ['traverse_circle', {}],
  ]);
}

function sequentialRows(
  scenario: string,
  next: () => number,
  initial: number[],
): StructureOperationDraft[] {
  if (scenario === 'search') {
    return makeRows([
      ['search', { value: String(initial[2] ?? initial[0] ?? next()) }],
      ['search', { value: String(99) }],
      ['access', { index: String(Math.min(2, initial.length - 1)) }],
      ['traverse', {}],
    ]);
  }
  if (scenario === 'capacity') {
    return makeRows([
      ['delete', { index: '0' }],
      ['delete', { index: String(STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY - 2) }],
      ['insert', { index: '0', value: String(next()) }],
      ['insert', { index: String(STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY - 1), value: String(next()) }],
      ['traverse', {}],
    ]);
  }
  if (scenario === 'empty') {
    return makeRows([
      ['insert', { index: '0', value: String(next()) }],
      ['traverse', {}],
      ['delete', { index: '0' }],
      ['traverse', {}],
    ]);
  }
  return makeRows([
    ['delete', { index: '0' }],
    ['delete', { index: '3' }],
    ['insert', { index: '0', value: String(next()) }],
    ['insert', { index: '3', value: String(next()) }],
    ['traverse', {}],
  ]);
}

function stackRows(
  scenario: string,
  next: () => number,
): StructureOperationDraft[] {
  if (scenario === 'clear') {
    return makeRows([
      ['push', { value: String(next()) }],
      ['push', { value: String(next()) }],
      ['push', { value: String(next()) }],
      ['pop', {}],
      ['pop', {}],
      ['pop', {}],
    ]);
  }
  if (scenario === 'alternating') {
    return makeRows([
      ['push', { value: String(next()) }],
      ['push', { value: String(next()) }],
      ['peek', {}],
      ['pop', {}],
      ['push', { value: String(next()) }],
      ['pop', {}],
    ]);
  }
  if (scenario === 'capacity') {
    return makeRows([
      ...Array.from({ length: STRUCTURE_LIMITS.MAX_ITEMS }, (_, index): [string, { value: string }] => [
        'push',
        { value: String(next() + index) },
      ]),
      ['peek', {}],
      ['pop', {}],
    ]);
  }
  const values = Array.from({ length: 4 }, next);
  return makeRows(values.map((value): [string, { value: string }] => ['push', { value: String(value) }]));
}

function queueRows(
  scenario: string,
  next: () => number,
): StructureOperationDraft[] {
  if (scenario === 'clear') {
    return makeRows([
      ['enqueue', { value: String(next()) }],
      ['enqueue', { value: String(next()) }],
      ['enqueue', { value: String(next()) }],
      ['dequeue', {}],
      ['dequeue', {}],
      ['dequeue', {}],
    ]);
  }
  if (scenario === 'alternating') {
    return makeRows([
      ['enqueue', { value: String(next()) }],
      ['enqueue', { value: String(next()) }],
      ['front', {}],
      ['dequeue', {}],
      ['enqueue', { value: String(next()) }],
      ['dequeue', {}],
    ]);
  }
  if (scenario === 'capacity') {
    return makeRows([
      ...Array.from({ length: STRUCTURE_LIMITS.MAX_ITEMS }, (_, index): [string, { value: string }] => [
        'enqueue',
        { value: String(next() + index) },
      ]),
      ['front', {}],
      ['dequeue', {}],
    ]);
  }
  const values = Array.from({ length: 4 }, next);
  return makeRows(values.map((value): [string, { value: string }] => ['enqueue', { value: String(value) }]));
}

export function randomStructureDraft(
  id: StructureGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): GuidedInputDraft {
  let cursor = randInt(random, 1, 9);
  const next = () => {
    cursor += randInt(random, 1, 4);
    return cursor;
  };

  if (id === 'seqlist') {
    const shift = randInt(random, 0, 3);
    const initial =
      scenario === 'empty'
        ? []
        : scenario === 'capacity'
          ? Array.from({ length: STRUCTURE_LIMITS.SEQUENTIAL_CAPACITY }, (_, index) => 10 + shift + index * 10)
          : [10 + shift, 20 + shift, 30 + shift, 40 + shift, 50 + shift];
    return {
      values: valuesText(initial),
      nums: '',
      target: '',
      text: '',
      pattern: '',
      operations: '',
      rows: sequentialRows(scenario, next, initial),
    };
  }

  const rows =
    id === 'linked'
      ? linkedRows(scenario, next)
      : id === 'doubly'
        ? doublyRows(scenario, next)
        : id === 'circular'
          ? circularRows(scenario, next)
          : id === 'stack'
            ? stackRows(scenario, next)
            : queueRows(scenario, next);
  return {
    values: '',
    nums: '',
    target: '',
    text: '',
    pattern: '',
    operations: '',
    rows,
  };
}

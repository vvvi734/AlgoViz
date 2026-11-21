/**
 * INPUT-05: max-heap operation input. The existing Python program already
 * supports build, push, extract and in-place sort; this module only validates
 * the operation-specific prerequisites and keeps random data legal.
 */
export const HEAP_GUIDED_INPUT = 'heap' as const;

export const HEAP_OPERATIONS = ['build', 'push', 'extract', 'sort'] as const;
export type HeapOperation = (typeof HEAP_OPERATIONS)[number];

export const HEAP_INPUT_LIMITS = {
  MAX_ITEMS: 16,
  VALUE_ABS_MAX: 1_000_000,
} as const;

export interface HeapInputFields {
  values: string;
  target: string;
  command: string;
}

export interface HeapInputError {
  key: string;
  max?: number;
}

export type HeapBuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: HeapInputError };

export interface HeapRandomScenario {
  id: string;
  label: [zh: string, en: string];
}

export const HEAP_RANDOM_SCENARIOS: readonly HeapRandomScenario[] = [
  { id: 'heap-valid', label: ['已满足堆性质', 'Already a max heap'] },
  { id: 'sift-up', label: ['需要多次上浮', 'Multiple sift-up swaps'] },
  { id: 'sift-down', label: ['需要多次下沉', 'Multiple sift-down swaps'] },
  { id: 'duplicates', label: ['重复值', 'Duplicate values'] },
  { id: 'sort', label: ['堆排序（沿用现有）', 'Heap sort (existing)'] },
];

export function heapDraftFromInput(input: unknown): HeapInputFields {
  if (!isRecord(input)) return { values: '', target: '', command: 'build' };
  const heap = Array.isArray(input.heap) ? input.heap : [];
  return {
    values: heap
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .join(', '),
    target:
      typeof input.value === 'number' && Number.isFinite(input.value) ? String(input.value) : '',
    command: heapOperationFromInput(input.operation),
  };
}

export function buildHeapInput(fields: HeapInputFields): HeapBuildResult {
  const command = heapOperationFromInput(fields.command);
  const parsed = parseHeapValues(fields.values);
  if (!parsed.ok) return parsed;

  if (command === 'build') {
    if (parsed.values.length < 1) return { ok: false, error: { key: 'heapErrorEmpty' } };
    if (parsed.values.length > HEAP_INPUT_LIMITS.MAX_ITEMS) {
      return { ok: false, error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS } };
    }
    return {
      ok: true,
      input: { preset: null, operation: 'build', heap: parsed.values, value: null },
    };
  }

  if (command === 'sort') {
    if (parsed.values.length < 2) return { ok: false, error: { key: 'heapErrorSortSize' } };
    if (parsed.values.length > HEAP_INPUT_LIMITS.MAX_ITEMS) {
      return { ok: false, error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS } };
    }
    return {
      ok: true,
      input: { preset: null, operation: 'sort', heap: parsed.values, value: null },
    };
  }

  if (!isMaxHeap(parsed.values)) {
    return { ok: false, error: { key: 'heapErrorNotHeap' } };
  }

  if (command === 'push') {
    if (parsed.values.length > HEAP_INPUT_LIMITS.MAX_ITEMS - 1) {
      return { ok: false, error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS } };
    }
    const target = parseInteger(fields.target);
    if (target === null) return { ok: false, error: { key: 'heapErrorValue' } };
    return {
      ok: true,
      input: { preset: null, operation: 'push', heap: parsed.values, value: target },
    };
  }

  if (parsed.values.length < 1) return { ok: false, error: { key: 'heapErrorEmpty' } };
  if (parsed.values.length > HEAP_INPUT_LIMITS.MAX_ITEMS) {
    return { ok: false, error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS } };
  }
  return {
    ok: true,
    input: { preset: null, operation: 'extract', heap: parsed.values, value: null },
  };
}

export function randomHeapDraft(
  scenario: string,
  random: () => number = Math.random,
): HeapInputFields {
  const offset = randInt(random, 0, 3);
  if (scenario === 'sift-up') {
    return {
      values: shift([5, 3, 4, 1, 2], offset).join(', '),
      target: String(10 + offset),
      command: 'push',
    };
  }
  if (scenario === 'sift-down') {
    return {
      values: shift([9, 7, 8, 3, 2, 1, 0], offset).join(', '),
      target: '',
      command: 'extract',
    };
  }
  if (scenario === 'duplicates') {
    return {
      values: shift([9, 9, 8, 9, 8, 7], offset).join(', '),
      target: '',
      command: 'build',
    };
  }
  if (scenario === 'sort') {
    return {
      values: shift([5, 1, 9, 3, 9, 2, 6], offset).join(', '),
      target: '',
      command: 'sort',
    };
  }
  return {
    values: shift([9, 8, 6, 3, 7, 2, 5], offset).join(', '),
    target: '',
    command: 'build',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function heapOperationFromInput(value: unknown): HeapOperation {
  return value === 'push' || value === 'extract' || value === 'sort' ? value : 'build';
}

function parseHeapValues(
  raw: string,
): { ok: true; values: number[] } | { ok: false; error: HeapInputError } {
  const source = raw.trim().replace(/^\[\s*/u, '').replace(/\s*\]$/u, '');
  if (source === '') return { ok: true, values: [] };
  const tokens = source.split(/[,\s，]+/u).filter(Boolean);
  const values: number[] = [];
  for (const token of tokens) {
    const value = parseInteger(token);
    if (value === null) return { ok: false, error: { key: 'heapErrorInteger' } };
    values.push(value);
  }
  if (values.length > HEAP_INPUT_LIMITS.MAX_ITEMS) {
    return { ok: false, error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS } };
  }
  return { ok: true, values };
}

function parseInteger(raw: string): number | null {
  const token = raw.trim();
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || Math.abs(value) > HEAP_INPUT_LIMITS.VALUE_ABS_MAX) return null;
  return value;
}

function isMaxHeap(values: number[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    const parent = Math.floor((index - 1) / 2);
    if (values[parent]! < values[index]!) return false;
  }
  return true;
}

function shift(values: readonly number[], offset: number): number[] {
  return values.map((value) => value + offset);
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

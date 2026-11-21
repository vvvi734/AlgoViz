import { describe, expect, it } from 'vitest';
import {
  HEAP_INPUT_LIMITS,
  HEAP_OPERATIONS,
  HEAP_RANDOM_SCENARIOS,
  buildHeapInput,
  heapDraftFromInput,
  randomHeapDraft,
  type HeapInputFields,
} from './heapInput';

function fields(overrides: Partial<HeapInputFields> = {}): HeapInputFields {
  return { values: '', target: '', command: 'build', ...overrides };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function buildOk(value: HeapInputFields): Record<string, unknown> {
  const result = buildHeapInput(value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return result.input as Record<string, unknown>;
}

function isMaxHeap(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[Math.floor((index - 1) / 2)]! >= value);
}

function siftUpSwaps(initial: number[], pushed: number): number {
  const values = [...initial, pushed];
  let index = values.length - 1;
  let swaps = 0;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (values[parent]! >= values[index]!) break;
    [values[parent], values[index]] = [values[index]!, values[parent]!];
    index = parent;
    swaps += 1;
  }
  return swaps;
}

function siftDownSwaps(initial: number[]): number {
  const values = [...initial];
  values[0] = values[values.length - 1]!;
  values.pop();
  let index = 0;
  let swaps = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    let largest = index;
    if (left < values.length && values[left]! > values[largest]!) largest = left;
    if (right < values.length && values[right]! > values[largest]!) largest = right;
    if (largest === index) break;
    [values[index], values[largest]] = [values[largest]!, values[index]!];
    index = largest;
    swaps += 1;
  }
  return swaps;
}

describe('INPUT-05 max-heap input', () => {
  it('supports build, push, extract and the existing sort command', () => {
    expect(HEAP_OPERATIONS).toEqual(['build', 'push', 'extract', 'sort']);
    expect(buildOk(fields({ values: '4, 9, 2, 7' }))).toEqual({
      preset: null,
      operation: 'build',
      heap: [4, 9, 2, 7],
      value: null,
    });
    expect(buildOk(fields({ values: '5, 3, 4, 1, 2', command: 'push', target: '10' }))).toEqual({
      preset: null,
      operation: 'push',
      heap: [5, 3, 4, 1, 2],
      value: 10,
    });
    expect(buildOk(fields({ values: '9, 7, 8, 3, 2', command: 'extract' }))).toEqual({
      preset: null,
      operation: 'extract',
      heap: [9, 7, 8, 3, 2],
      value: null,
    });
    expect(buildOk(fields({ values: '5, 1, 9, 3', command: 'sort' }))).toEqual({
      preset: null,
      operation: 'sort',
      heap: [5, 1, 9, 3],
      value: null,
    });
    expect(buildOk(fields({ values: '', command: 'push', target: '7' }))).toEqual({
      preset: null,
      operation: 'push',
      heap: [],
      value: 7,
    });
  });

  it('rejects empty build, one-item sort, oversized arrays and malformed values', () => {
    expect(buildHeapInput(fields({ values: '' }))).toEqual({ ok: false, error: { key: 'heapErrorEmpty' } });
    expect(buildHeapInput(fields({ values: '9', command: 'sort' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorSortSize' },
    });
    const tooMany = Array.from({ length: HEAP_INPUT_LIMITS.MAX_ITEMS + 1 }, (_, index) => index).join(', ');
    expect(buildHeapInput(fields({ values: tooMany }))).toEqual({
      ok: false,
      error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS },
    });
    expect(buildHeapInput(fields({ values: '9, x' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorInteger' },
    });
    expect(buildHeapInput(fields({ values: '9, 7', command: 'push', target: '2.5' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorValue' },
    });
  });

  it('requires a real max heap before push or extract', () => {
    expect(buildHeapInput(fields({ values: '4, 9, 2, 7', command: 'push', target: '10' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorNotHeap' },
    });
    expect(buildHeapInput(fields({ values: '4, 9, 2, 7', command: 'extract' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorNotHeap' },
    });
    expect(buildHeapInput(fields({ values: Array.from({ length: 16 }, (_, index) => 16 - index).join(', '), command: 'push', target: '30' }))).toEqual({
      ok: false,
      error: { key: 'heapErrorSize', max: HEAP_INPUT_LIMITS.MAX_ITEMS },
    });
  });

  it('keeps every random scenario legal for the real Python operation', () => {
    const scenarios = HEAP_RANDOM_SCENARIOS.map((scenario) => scenario.id);
    expect(scenarios).toEqual(['heap-valid', 'sift-up', 'sift-down', 'duplicates', 'sort']);

    for (const scenario of scenarios) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const generated = randomHeapDraft(scenario, seeded(seed));
        const input = buildOk(generated);
        const heap = input.heap as number[];
        expect(heap.length).toBeGreaterThanOrEqual(1);
        expect(heap.length).toBeLessThanOrEqual(HEAP_INPUT_LIMITS.MAX_ITEMS);
        if (scenario === 'heap-valid') {
          expect(input.operation).toBe('build');
          expect(isMaxHeap(heap)).toBe(true);
        }
        if (scenario === 'sift-up') {
          expect(input.operation).toBe('push');
          expect(isMaxHeap(heap)).toBe(true);
          expect(siftUpSwaps(heap, input.value as number)).toBeGreaterThanOrEqual(2);
        }
        if (scenario === 'sift-down') {
          expect(input.operation).toBe('extract');
          expect(isMaxHeap(heap)).toBe(true);
          expect(siftDownSwaps(heap)).toBeGreaterThanOrEqual(2);
        }
        if (scenario === 'duplicates') {
          expect(input.operation).toBe('build');
          expect(new Set(heap).size).toBeLessThan(heap.length);
        }
        if (scenario === 'sort') {
          expect(input.operation).toBe('sort');
          expect(heap.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('round-trips official heap presets and operation/value fields', () => {
    expect(heapDraftFromInput({ preset: 'push', operation: 'push', heap: [9, 8, 6], value: 10 })).toEqual({
      values: '9, 8, 6',
      target: '10',
      command: 'push',
    });
    expect(heapDraftFromInput({ preset: 'build', operation: 'build', heap: [4, 9, 2], value: null })).toEqual({
      values: '4, 9, 2',
      target: '',
      command: 'build',
    });
  });
});

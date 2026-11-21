/**
 * TEXTBOOK-11: validation and random scenario generation for the three
 * external-sorting courses.
 *
 * Every builder emits the same JSON consumed by the real Python executor.
 * Multiway runs must arrive already sorted; they are rejected rather than
 * silently reordered. Replacement selection fixes the workspace capacity so
 * the freeze/unfreeze model cannot drift with the UI.
 */
import type { GuidedInputDraft, GuidedInputError, GuidedRandomScenario } from './guidedInput';

export const EXTERNAL_SORT_GUIDED_INPUT_ALGORITHMS = [
  'multiway',
  'replacement',
  'optimal-merge',
] as const;
export type ExternalSortGuidedInputAlgorithm = (typeof EXTERNAL_SORT_GUIDED_INPUT_ALGORITHMS)[number];

export const MULTIWAY_ALGORITHM = 'multiway' as const;
export const REPLACEMENT_ALGORITHM = 'replacement' as const;
export const OPTIMAL_MERGE_ALGORITHM = 'optimal-merge' as const;

export const EXTERNAL_SORT_ALGORITHM_IDS = [
  MULTIWAY_ALGORITHM,
  REPLACEMENT_ALGORITHM,
  OPTIMAL_MERGE_ALGORITHM,
] as const;

export interface ExternalSortInputFields {
  runs: string;
  k: string;
  bufferCapacity: string;
  blockSize: string;
  weights: string;
  workspaceCapacity: string;
}

export function isExternalSortGuidedInputAlgorithm(id: string): id is ExternalSortGuidedInputAlgorithm {
  return (EXTERNAL_SORT_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isExternalSortAlgorithm(id: string): boolean {
  return (EXTERNAL_SORT_ALGORITHM_IDS as readonly string[]).includes(id);
}

const EMPTY_EXTERNAL: ExternalSortInputFields = {
  runs: '',
  k: '2',
  bufferCapacity: '2',
  blockSize: '1',
  weights: '',
  workspaceCapacity: '3',
};

export function emptyExternalDraft(id: ExternalSortGuidedInputAlgorithm): GuidedInputDraft {
  const base = {
    values: '',
    nums: '',
    target: '',
    n: '',
    text: '',
    pattern: '',
    operations: '',
    rows: [],
    mode: '',
    command: '',
    symbols: '',
  } satisfies GuidedInputDraft;
  if (id === MULTIWAY_ALGORITHM) {
    return {
      ...base,
      external: {
        ...EMPTY_EXTERNAL,
        runs: '2, 5, 9\n1, 6, 10',
        k: '2',
        bufferCapacity: '2',
        blockSize: '1',
      },
    };
  }
  if (id === REPLACEMENT_ALGORITHM) {
    return {
      ...base,
      values: '7, 3, 9, 1, 8, 2, 6, 4, 5',
      external: { ...EMPTY_EXTERNAL, workspaceCapacity: '3' },
    };
  }
  return {
    ...base,
    external: { ...EMPTY_EXTERNAL, weights: '3, 5, 8, 11', k: '2' },
  };
}

export function externalDraftFromInput(id: ExternalSortGuidedInputAlgorithm, input: unknown): GuidedInputDraft {
  const base = emptyExternalDraft(id);
  if (!input || typeof input !== 'object') return base;
  const record = input as Record<string, unknown>;
  const existing = base.external ?? EMPTY_EXTERNAL;
  if (id === MULTIWAY_ALGORITHM) {
    const runs = Array.isArray(record.runs)
      ? record.runs.map((run) => (Array.isArray(run) ? run.map(String).join(', ') : '')).join('\n')
      : existing.runs;
    const k = typeof record.k === 'number' ? String(record.k) : existing.k;
    const bufferCapacity = typeof record.bufferCapacity === 'number'
      ? String(record.bufferCapacity)
      : existing.bufferCapacity;
    const blockSize = typeof record.blockSize === 'number' ? String(record.blockSize) : existing.blockSize;
    return { ...base, external: { ...existing, runs, k, bufferCapacity, blockSize } };
  }
  if (id === REPLACEMENT_ALGORITHM) {
    const values = Array.isArray(record.values) ? record.values.map(String).join(', ') : base.values;
    const workspaceCapacity = typeof record.workspaceCapacity === 'number'
      ? String(record.workspaceCapacity)
      : existing.workspaceCapacity;
    return { ...base, values, external: { ...existing, workspaceCapacity } };
  }
  const weights = Array.isArray(record.segmentWeights)
    ? record.segmentWeights.map(String).join(', ')
    : existing.weights;
  const k = typeof record.k === 'number' ? String(record.k) : existing.k;
  return { ...base, external: { ...existing, weights, k } };
}

function parseIntegerList(raw: string, max: number): number[] | null {
  const parts = raw.split(/[\s,，]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > max) return null;
  const values: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    const value = Number(part);
    if (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000) return null;
    values.push(value);
  }
  return values;
}

function parseInteger(raw: string): number | null {
  if (!/^-?\d+$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) ? value : null;
}

export function buildExternalSortInput(
  id: ExternalSortGuidedInputAlgorithm,
  draft: GuidedInputDraft,
): { ok: true; input: unknown } | { ok: false; error: GuidedInputError } {
  const fields = draft.external ?? EMPTY_EXTERNAL;
  if (id === MULTIWAY_ALGORITHM) {
    const k = parseInteger(fields.k);
    if (k === null || k < 2 || k > 4) return { ok: false, error: { key: 'guidedErrorMultiwayK' } };
    const bufferCapacity = parseInteger(fields.bufferCapacity);
    const blockSize = parseInteger(fields.blockSize);
    if (
      bufferCapacity === null || bufferCapacity < 1 || bufferCapacity > 3 ||
      blockSize === null || blockSize < 1 || blockSize > 3
    ) {
      return { ok: false, error: { key: 'guidedErrorMultiwayBuffer' } };
    }
    const lines = fields.runs.split(/\r?\n/);
    if (lines.length !== k) {
      return { ok: false, error: { key: 'guidedErrorMultiwayRunCount', max: k } };
    }
    const runs: number[][] = [];
    let total = 0;
    for (const line of lines) {
      if (line.trim() === '') {
        runs.push([]);
        continue;
      }
      const run = parseIntegerList(line, 6);
      if (run === null) return { ok: false, error: { key: 'guidedErrorMultiwayRunLength', max: 6 } };
      for (let index = 1; index < run.length; index += 1) {
        if (run[index]! < run[index - 1]!) {
          return { ok: false, error: { key: 'guidedErrorMultiwaySorted' } };
        }
      }
      total += run.length;
      runs.push(run);
    }
    if (total < 1) return { ok: false, error: { key: 'guidedErrorMultiwayRecordCount', max: 24 } };
    return {
      ok: true,
      input: { preset: null, k, runs, bufferCapacity, blockSize },
    };
  }

  if (id === REPLACEMENT_ALGORITHM) {
    const values = parseIntegerList(draft.values, 20);
    if (values === null || values.length < 1) {
      return { ok: false, error: { key: 'guidedErrorReplacementLength', max: 20 } };
    }
    const workspaceCapacity = parseInteger(fields.workspaceCapacity);
    if (workspaceCapacity === null || workspaceCapacity < 2 || workspaceCapacity > 6) {
      return { ok: false, error: { key: 'guidedErrorReplacementCapacity' } };
    }
    return { ok: true, input: { preset: null, values, workspaceCapacity } };
  }

  const weights = parseIntegerList(fields.weights, 12);
  if (weights === null || weights.length < 1) {
    return { ok: false, error: { key: 'guidedErrorOptimalWeights', max: 12 } };
  }
  if (weights.some((weight) => weight < 1 || weight > 999)) {
    return { ok: false, error: { key: 'guidedErrorOptimalWeight' } };
  }
  const k = parseInteger(fields.k);
  if (k === null || k < 2 || k > 4) {
    return { ok: false, error: { key: 'guidedErrorOptimalK' } };
  }
  return { ok: true, input: { preset: null, segmentWeights: weights, k } };
}

export const EXTERNAL_SORT_RANDOM_SCENARIOS: Record<
  ExternalSortGuidedInputAlgorithm,
  readonly GuidedRandomScenario[]
> = {
  multiway: [
    { id: 'two-way', label: ['随机二路归并', 'Random two-way merge'] },
    { id: 'three-way', label: ['随机三路归并', 'Random three-way merge'] },
    { id: 'four-way', label: ['随机四路归并', 'Random four-way merge'] },
    { id: 'uneven', label: ['长度不均的归并段', 'Runs with unequal lengths'] },
    { id: 'duplicates', label: ['重复关键字', 'Duplicate keys'] },
  ],
  replacement: [
    { id: 'normal', label: ['随机乱序', 'Random order'] },
    { id: 'nearly-sorted', label: ['基本有序', 'Nearly sorted'] },
    { id: 'reversed', label: ['逆序', 'Reversed'] },
    { id: 'duplicates', label: ['重复关键字', 'Duplicate keys'] },
    { id: 'small-workspace', label: ['小工作区', 'Small workspace'] },
    { id: 'large-workspace', label: ['大工作区', 'Large workspace'] },
  ],
  'optimal-merge': [
    { id: 'two-way', label: ['随机二路树', 'Random two-way tree'] },
    { id: 'three-way', label: ['随机三路树', 'Random three-way tree'] },
    { id: 'four-way', label: ['随机四路树', 'Random four-way tree'] },
    { id: 'equal', label: ['权重相同', 'Equal weights'] },
    { id: 'uneven', label: ['权重悬殊', 'Uneven weights'] },
    { id: 'virtual', label: ['需要虚拟叶节点', 'Virtual leaf required'] },
  ],
};

function randomInt(min: number, max: number, random: () => number = Math.random): number {
  return min + Math.floor(random() * (max - min + 1));
}

function shuffle(values: number[], random: () => number = Math.random): number[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

function randomMultiwayRuns(
  k: number,
  total: number,
  duplicate: boolean,
  random: () => number = Math.random,
): number[][] {
  const lengths = Array.from({ length: k }, () => 1);
  let remaining = total - k;
  while (remaining > 0) {
    const target = Math.floor(random() * k);
    if (lengths[target]! < 6) {
      lengths[target] += 1;
      remaining -= 1;
    } else if (lengths.every((length) => length >= 6)) break;
  }
  const values: number[] = [];
  for (let index = 0; index < total; index += 1) {
    values.push(duplicate ? randomInt(1, 5, random) : randomInt(-20, 60, random));
  }
  const runs: number[][] = [];
  let cursor = 0;
  for (const length of lengths) {
    runs.push(values.slice(cursor, cursor + length).sort((a, b) => a - b));
    cursor += length;
  }
  return runs;
}

function sortedishValues(count: number, scenario: string, random: () => number = Math.random): number[] {
  const base = Array.from({ length: count }, (_, index) => index * 2 + randomInt(0, 1, random));
  if (scenario === 'reversed') return [...base].reverse();
  if (scenario === 'nearly-sorted') {
    const result = [...base];
    const a = randomInt(0, count - 1, random);
    const b = Math.min(count - 1, a + randomInt(1, 3, random));
    [result[a], result[b]] = [result[b]!, result[a]!];
    return result;
  }
  if (scenario === 'duplicates') {
    return Array.from({ length: count }, () => randomInt(1, 6, random));
  }
  return shuffle(base, random);
}

export function randomExternalDraft(
  id: ExternalSortGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): GuidedInputDraft {
  if (id === MULTIWAY_ALGORITHM) {
    const k = scenario === 'three-way' ? 3 : scenario === 'four-way' ? 4 : 2;
    const total = randomInt(k + 3, Math.min(16, k * 4), random);
    const duplicate = scenario === 'duplicates';
    const runs = randomMultiwayRuns(k, total, duplicate, random);
    return {
      ...emptyExternalDraft(id),
      external: {
        ...EMPTY_EXTERNAL,
        runs: runs.map((run) => run.join(', ')).join('\n'),
        k: String(k),
        bufferCapacity: String(randomInt(1, 3, random)),
        blockSize: String(randomInt(1, 3, random)),
      },
    };
  }

  if (id === REPLACEMENT_ALGORITHM) {
    const count = randomInt(8, 14, random);
    const values = sortedishValues(count, scenario, random);
    const workspaceCapacity = scenario === 'small-workspace'
      ? 2
      : scenario === 'large-workspace'
        ? randomInt(5, 6, random)
        : randomInt(2, 4, random);
    return {
      ...emptyExternalDraft(id),
      values: values.join(', '),
      external: { ...EMPTY_EXTERNAL, workspaceCapacity: String(workspaceCapacity) },
    };
  }

  const k = scenario === 'three-way' || scenario === 'virtual'
    ? 3
    : scenario === 'four-way'
      ? 4
      : 2;
  let count = randomInt(3, 10, random);
  if (scenario === 'virtual') {
    // Pick n with (n - 1) not divisible by (k - 1), so d > 0 virtual leaves.
    while ((count - 1) % (k - 1) === 0) count += 1;
  }
  const weights = scenario === 'equal'
    ? Array.from({ length: count }, () => randomInt(3, 9, random))
    : scenario === 'uneven'
      ? [
          1,
          randomInt(40, 80, random),
          randomInt(90, 140, random),
          ...Array.from({ length: Math.max(0, count - 3) }, () => randomInt(2, 20, random)),
        ]
      : Array.from({ length: count }, () => randomInt(1, 40, random));
  if (scenario === 'equal') {
    const value = weights[0]!;
    for (let index = 1; index < weights.length; index += 1) weights[index] = value;
  }
  return {
    ...emptyExternalDraft(id),
    external: { ...EMPTY_EXTERNAL, weights: weights.join(', '), k: String(k) },
  };
}

/**
 * INPUT-01/02: reusable input contracts for guided algorithms.
 *
 * The UI deliberately does not own parsing rules. Every draft is converted here
 * into the exact object shape the existing Python/JavaScript program already
 * consumes, so a custom run goes through the same executor and trace pipeline as
 * an official preset. Random generators only emit inputs that satisfy the
 * algorithm's prerequisites.
 */
import type { CodeLanguage } from './types';
import {
  STRUCTURE_GUIDED_INPUT_ALGORITHMS,
  STRUCTURE_RANDOM_SCENARIOS,
  buildStructureInput,
  isStructureGuidedInputAlgorithm,
  randomStructureDraft,
  structureDraftFromInput,
  type StructureOperationDraft,
} from './structureInput';
import {
  TREE_GUIDED_INPUT_ALGORITHMS,
  TREE_RANDOM_SCENARIOS,
  buildTreeInput,
  randomTreeDraft,
  treeDraftFromInput,
  type TreeGuidedInputAlgorithm,
} from './treeInput';
import {
  HEAP_GUIDED_INPUT,
  HEAP_RANDOM_SCENARIOS,
  buildHeapInput,
  heapDraftFromInput,
  randomHeapDraft,
} from './heapInput';
import {
  HUFFMAN_GUIDED_INPUT,
  HUFFMAN_RANDOM_SCENARIOS,
  buildHuffmanInput,
  huffmanDraftFromInput,
  randomHuffmanDraft,
} from './huffmanInput';
import {
  GRAPH_GUIDED_INPUT_ALGORITHMS,
  GRAPH_RANDOM_SCENARIOS,
  buildGraphInput,
  emptyGraphDraft,
  graphAlgorithmSpec,
  graphDraftFromInput,
  randomGraphDraft,
  type GraphGuidedInputAlgorithm,
  type GraphInputFields,
} from './graphInput';
import {
  SPARSE_GUIDED_INPUT,
  SPARSE_RANDOM_SCENARIOS,
  buildSparseInput,
  emptySparseDraft,
  isSparseGuidedInputAlgorithm,
  randomSparseDraft,
  sparseDraftFromInput,
  type SparseInputFields,
} from './sparseInput';

export { isStructureGuidedInputAlgorithm } from './structureInput';
export { isSparseGuidedInputAlgorithm } from './sparseInput';
export type { StructureOperationDraft, StructureOperationSpec } from './structureInput';
export type { TreeGuidedInputAlgorithm, TreeInputFields } from './treeInput';
export type { HeapInputFields, HeapOperation } from './heapInput';
export type { HuffmanInputFields } from './huffmanInput';
export type { GraphGuidedInputAlgorithm, GraphInputFields } from './graphInput';
export type { SparseGuidedInputAlgorithm, SparseInputFields, SparseTripleFields } from './sparseInput';

export const GUIDED_INPUT_ALGORITHMS = [
  'bubble',
  'selection',
  'insertion',
  'shell',
  'quick',
  'merge',
  'heap',
  'binary',
  'linear',
  'kmp',
  'hash-chain',
  'hash-probe',
  ...STRUCTURE_GUIDED_INPUT_ALGORITHMS,
  ...TREE_GUIDED_INPUT_ALGORITHMS,
  HUFFMAN_GUIDED_INPUT,
  ...GRAPH_GUIDED_INPUT_ALGORITHMS,
  SPARSE_GUIDED_INPUT,
] as const;
export type GuidedInputAlgorithm = (typeof GUIDED_INPUT_ALGORITHMS)[number];

/** Algorithms whose visible input is one integer array. */
export const ARRAY_GUIDED_INPUT_ALGORITHMS = [
  'bubble',
  'selection',
  'insertion',
  'shell',
  'quick',
  'merge',
] as const;
export type ArrayGuidedInputAlgorithm = (typeof ARRAY_GUIDED_INPUT_ALGORITHMS)[number];

/** Search algorithms that consume both an integer array and one target. */
export const NUMS_TARGET_GUIDED_INPUT_ALGORITHMS = ['binary', 'linear'] as const;
export type NumsTargetGuidedInputAlgorithm = (typeof NUMS_TARGET_GUIDED_INPUT_ALGORITHMS)[number];

/** Hash tables consume a simple insert/find/delete operation sequence. */
export const HASH_GUIDED_INPUT_ALGORITHMS = ['hash-chain', 'hash-probe'] as const;
export type HashGuidedInputAlgorithm = (typeof HASH_GUIDED_INPUT_ALGORITHMS)[number];

export type GuidedInputMode = 'official' | 'custom' | 'random';

export const GUIDED_INPUT_LANGUAGE: Record<GuidedInputAlgorithm, CodeLanguage> = {
  // The official bubble lesson keeps its established 25-frame JavaScript
  // classroom trace. Generated bubble traces use real Python; see
  // guidedExecutionLanguage below.
  bubble: 'js',
  selection: 'python',
  insertion: 'python',
  shell: 'python',
  quick: 'python',
  merge: 'python',
  heap: 'python',
  binary: 'python',
  linear: 'python',
  kmp: 'python',
  'hash-chain': 'python',
  'hash-probe': 'python',
  linked: 'python',
  doubly: 'python',
  circular: 'python',
  seqlist: 'python',
  stack: 'python',
  queue: 'python',
  inorder: 'python',
  bst: 'python',
  avl: 'python',
  btree: 'python',
  huffman: 'python',
  bfs: 'python',
  dfs: 'python',
  components: 'python',
  scc: 'python',
  dijkstra: 'python',
  'floyd-warshall': 'python',
  'bellman-ford': 'python',
  prim: 'python',
  kruskal: 'python',
  topological: 'python',
  'critical-path': 'python',
  'sparse-transpose': 'python',
};

export interface GuidedInputDraft {
  /** Integer array for bubble, selection, insertion, Shell, quick and merge. */
  values: string;
  /** Search array, comma/space separated. */
  nums: string;
  /** Integer search target, tree command target or heap push value. */
  target: string;
  /** KMP text. */
  text: string;
  /** KMP pattern. */
  pattern: string;
  /** Hash operation sequence, one `insert/find/delete key` per line. */
  operations: string;
  /** INPUT-04 structured rows for the linear-structure operation editor. */
  rows: StructureOperationDraft[];
  /** INPUT-05 traversal mode; tree/AVL/B-tree commands and heap operation. */
  mode: string;
  command: string;
  /** INPUT-05 Huffman symbol/weight lines. */
  symbols: string;
  /** INPUT-06 shared graph node/edge table. */
  graph?: GraphInputFields;
  /** INPUT-07 sparse matrix shape and row-major non-zero triples. */
  sparse?: SparseInputFields;
}

export interface GuidedInputError {
  key: string;
  max?: number;
  /** 1-based operation row for the structured editor. */
  row?: number;
  /** 1-based graph edge row. */
  edge?: number;
  /** 1-based graph node row. */
  node?: number;
  /** 1-based sparse triplet row. */
  triple?: number;
}

export type GuidedBuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: GuidedInputError };

export interface GuidedRandomScenario {
  id: string;
  label: [zh: string, en: string];
}

export const GUIDED_INPUT_LIMITS = {
  BUBBLE_MIN: 1,
  BUBBLE_MAX: 16,
  SORT_MIN: 2,
  SORT_MAX: 16,
  LINEAR_MAX: 20,
  HASH_TABLE_SIZE: 7,
  HASH_MAX_OPERATIONS: 20,
  HASH_KEY_MAX: 99,
  BINARY_MIN: 1,
  BINARY_MAX: 15,
  KMP_TEXT_MAX: 24,
  KMP_PATTERN_MAX: 12,
  VALUE_ABS_MAX: 1_000_000,
} as const;

const EMPTY_DRAFT: GuidedInputDraft = {
  values: '',
  nums: '',
  target: '',
  text: '',
  pattern: '',
  operations: '',
  rows: [],
  mode: 'inorder',
  command: '',
  symbols: '',
  graph: emptyGraphDraft(),
  sparse: emptySparseDraft(),
};

const SORTING_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'shuffled', label: ['普通乱序', 'Shuffled'] },
  { id: 'nearly-sorted', label: ['基本有序', 'Nearly sorted'] },
  { id: 'reversed', label: ['逆序', 'Reversed'] },
  { id: 'duplicates', label: ['重复值较多', 'Many duplicates'] },
];

const LINEAR_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'normal', label: ['普通查找', 'Ordinary lookup'] },
  { id: 'first', label: ['首元素命中', 'First element hit'] },
  { id: 'last', label: ['末元素命中', 'Last element hit'] },
  { id: 'not-found', label: ['查找失败', 'Lookup failure'] },
  { id: 'duplicates', label: ['重复值', 'Duplicate values'] },
];

const CHAIN_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'no-collision', label: ['无冲突', 'No collision'] },
  { id: 'collision', label: ['同桶冲突', 'Same-bucket collision'] },
  { id: 'delete-head', label: ['删除头节点', 'Delete head node'] },
  { id: 'delete-middle', label: ['删除中间节点', 'Delete middle node'] },
  { id: 'find-miss', label: ['查找失败', 'Lookup failure'] },
];

const PROBE_SCENARIOS: readonly GuidedRandomScenario[] = [
  { id: 'no-collision', label: ['无冲突插入', 'No collision'] },
  { id: 'collision', label: ['发生探测冲突', 'Probe collision'] },
  { id: 'tombstone', label: ['墓碑与后续探测', 'Tombstone and later probe'] },
  { id: 'find-fail', label: ['查找失败', 'Lookup failure'] },
  { id: 'table-full', label: ['表满无法插入', 'Table full'] },
];

const RANDOM_SCENARIOS: Record<GuidedInputAlgorithm, readonly GuidedRandomScenario[]> = {
  bubble: SORTING_SCENARIOS,
  selection: SORTING_SCENARIOS,
  insertion: SORTING_SCENARIOS,
  shell: SORTING_SCENARIOS,
  quick: SORTING_SCENARIOS,
  merge: SORTING_SCENARIOS,
  heap: HEAP_RANDOM_SCENARIOS,
  binary: [
    { id: 'found', label: ['一定能找到', 'Always found'] },
    { id: 'not-found', label: ['一定找不到', 'Never found'] },
  ],
  linear: LINEAR_SCENARIOS,
  kmp: [
    { id: 'success', label: ['成功匹配', 'Successful match'] },
    { id: 'failure', label: ['匹配失败', 'No match'] },
    { id: 'prefix', label: ['重复前后缀', 'Repeated prefix/suffix'] },
    { id: 'fallback', label: ['失配回退', 'Fallback on mismatch'] },
    { id: 'overlap', label: ['多个 / 重叠匹配', 'Multiple / overlapping'] },
  ],
  'hash-chain': CHAIN_SCENARIOS,
  'hash-probe': PROBE_SCENARIOS,
  ...STRUCTURE_RANDOM_SCENARIOS,
  ...TREE_RANDOM_SCENARIOS,
  huffman: HUFFMAN_RANDOM_SCENARIOS,
  ...GRAPH_RANDOM_SCENARIOS,
  ...SPARSE_RANDOM_SCENARIOS,
};

export function isGuidedInputAlgorithm(id: string): id is GuidedInputAlgorithm {
  return (GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isArrayGuidedInputAlgorithm(id: string): id is ArrayGuidedInputAlgorithm {
  return (ARRAY_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isNumsTargetGuidedInputAlgorithm(id: string): id is NumsTargetGuidedInputAlgorithm {
  return (NUMS_TARGET_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isHashGuidedInputAlgorithm(id: string): id is HashGuidedInputAlgorithm {
  return (HASH_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isTreeGuidedInputAlgorithm(id: string): id is TreeGuidedInputAlgorithm {
  return (TREE_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function isHeapGuidedInputAlgorithm(id: string): boolean {
  return id === HEAP_GUIDED_INPUT;
}

export function isHuffmanGuidedInputAlgorithm(id: string): boolean {
  return id === HUFFMAN_GUIDED_INPUT;
}

export function isGraphAlgorithmGuidedInput(id: string): id is GraphGuidedInputAlgorithm {
  return (GRAPH_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function guidedGraphSpec(id: string) {
  return graphAlgorithmSpec(id);
}

export function guidedLanguageFor(id: string): CodeLanguage | null {
  return isGuidedInputAlgorithm(id) ? GUIDED_INPUT_LANGUAGE[id] : null;
}

/**
 * Language used for a generated trace. The bubble official preset stays on its
 * 25-frame JavaScript lesson; every non-official bubble run goes through the
 * real Python bubble program so the trace is genuinely regenerated from the
 * student's data, including variables and lesson steps.
 */
export function guidedExecutionLanguage(id: string, mode: GuidedInputMode): CodeLanguage | null {
  const language = guidedLanguageFor(id);
  if (!language) return null;
  return id === 'bubble' && mode !== 'official' ? 'python' : language;
}

export function guidedRandomScenarios(id: GuidedInputAlgorithm): readonly GuidedRandomScenario[] {
  return RANDOM_SCENARIOS[id];
}

export function defaultGuidedScenario(id: GuidedInputAlgorithm): string {
  return RANDOM_SCENARIOS[id][0]!.id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function describeNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function formatNumbers(values: unknown[]): string {
  return values
    .filter((value): value is number => typeof value === 'number' && Number.isSafeInteger(value))
    .join(', ');
}

/** Accept `8, 3, 5`, `[8 3 5]`, Chinese commas, and a pasted JSON object. */
function parseIntegerList(raw: string): { ok: true; values: number[] } | { ok: false } {
  let source = raw.trim();
  if (source === '') return { ok: false };

  const object = parseObject(source);
  if (object) {
    const candidate = Array.isArray(object.values)
      ? object.values
      : Array.isArray(object.nums)
        ? object.nums
        : null;
    if (!candidate) return { ok: false };
    source = candidate.map(describeNumber).join(', ');
  }

  source = source.replace(/^\[\s*/u, '').replace(/\s*\]$/u, '');
  const tokens = source.split(/[,\s，]+/u).filter(Boolean);
  if (tokens.length === 0) return { ok: false };

  const values: number[] = [];
  for (const token of tokens) {
    if (!/^[+-]?\d+$/u.test(token)) return { ok: false };
    const value = Number(token);
    if (!Number.isSafeInteger(value) || Math.abs(value) > GUIDED_INPUT_LIMITS.VALUE_ABS_MAX) {
      return { ok: false };
    }
    values.push(value);
  }
  return { ok: true, values };
}

function parseInteger(raw: string): number | null {
  const token = raw.trim();
  if (!/^[+-]?\d+$/u.test(token)) return null;
  const value = Number(token);
  if (!Number.isSafeInteger(value) || Math.abs(value) > GUIDED_INPUT_LIMITS.VALUE_ABS_MAX) {
    return null;
  }
  return value;
}

type HashOperation = 'insert' | 'find' | 'delete';
type HashOperationTuple = [HashOperation, number];

const HASH_OPERATION_ALIASES: Record<string, HashOperation> = {
  insert: 'insert',
  find: 'find',
  delete: 'delete',
  插入: 'insert',
  查找: 'find',
  删除: 'delete',
};

function parseHashOperations(
  raw: string,
): { ok: true; operations: HashOperationTuple[] } | { ok: false; error: GuidedInputError } {
  const source = raw.trim();
  if (source === '') return { ok: false, error: { key: 'guidedErrorHashOperations' } };
  const segments = source
    .split(/[\n\r;；,，]+/u)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return { ok: false, error: { key: 'guidedErrorHashOperations' } };

  const operations: HashOperationTuple[] = [];
  for (const segment of segments) {
    const match = /^(insert|find|delete|插入|查找|删除)\s*[:：]?\s*(-?\d+)$/iu.exec(segment);
    if (!match) return { ok: false, error: { key: 'guidedErrorHashOperation' } };
    const operation = HASH_OPERATION_ALIASES[match[1]!.toLocaleLowerCase()];
    const key = Number(match[2]);
    if (!operation) return { ok: false, error: { key: 'guidedErrorHashOperation' } };
    if (!Number.isSafeInteger(key) || key < 0 || key > GUIDED_INPUT_LIMITS.HASH_KEY_MAX) {
      return { ok: false, error: { key: 'guidedErrorHashKey', max: GUIDED_INPUT_LIMITS.HASH_KEY_MAX } };
    }
    operations.push([operation, key]);
  }
  if (operations.length > GUIDED_INPUT_LIMITS.HASH_MAX_OPERATIONS) {
    return {
      ok: false,
      error: { key: 'guidedErrorHashLimit', max: GUIDED_INPUT_LIMITS.HASH_MAX_OPERATIONS },
    };
  }
  return { ok: true, operations };
}

function formatHashOperations(input: unknown): string {
  if (!isRecord(input) || !Array.isArray(input.operations)) return '';
  return input.operations
    .flatMap((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) return [];
      const operation = typeof entry[0] === 'string' ? HASH_OPERATION_ALIASES[entry[0]] : undefined;
      const key = entry[1];
      if (!operation || !Number.isSafeInteger(key) || (key as number) < 0) return [];
      return [`${operation} ${key}`];
    })
    .join('\n');
}

export function guidedDraftFromInput(id: GuidedInputAlgorithm, input: unknown): GuidedInputDraft {
  if (isGraphAlgorithmGuidedInput(id)) {
    return { ...EMPTY_DRAFT, graph: graphDraftFromInput(id, input) };
  }
  if (isSparseGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, sparse: sparseDraftFromInput(input) };
  }
  if (isStructureGuidedInputAlgorithm(id)) {
    const parts = structureDraftFromInput(id, input);
    return { ...EMPTY_DRAFT, values: parts.values, rows: parts.rows };
  }
  if (isTreeGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...treeDraftFromInput(id, input) };
  }
  if (isHeapGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...heapDraftFromInput(input) };
  }
  if (isHuffmanGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...huffmanDraftFromInput(input) };
  }
  if (isArrayGuidedInputAlgorithm(id)) {
    const values = Array.isArray(input)
      ? input
      : isRecord(input) && Array.isArray(input.values)
        ? input.values
        : [];
    return { ...EMPTY_DRAFT, values: formatNumbers(values) };
  }
  if (isNumsTargetGuidedInputAlgorithm(id)) {
    const record = isRecord(input) ? input : {};
    return {
      ...EMPTY_DRAFT,
      nums: Array.isArray(record.nums) ? formatNumbers(record.nums) : '',
      target: describeNumber(record.target),
    };
  }
  if (isHashGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, operations: formatHashOperations(input) };
  }
  const record = isRecord(input) ? input : {};
  return {
    ...EMPTY_DRAFT,
    text: typeof record.text === 'string' ? record.text : '',
    pattern: typeof record.pattern === 'string' ? record.pattern : '',
  };
}

export function buildGuidedInput(id: GuidedInputAlgorithm, draft: GuidedInputDraft): GuidedBuildResult {
  if (isGraphAlgorithmGuidedInput(id)) {
    return buildGraphInput(id, draft.graph ?? emptyGraphDraft());
  }
  if (isSparseGuidedInputAlgorithm(id)) {
    return buildSparseInput(draft.sparse ?? emptySparseDraft());
  }
  if (isStructureGuidedInputAlgorithm(id)) {
    return buildStructureInput(id, draft);
  }
  if (isTreeGuidedInputAlgorithm(id)) {
    return buildTreeInput(id, {
      values: draft.values,
      target: draft.target,
      command: draft.command,
      mode: draft.mode,
    });
  }
  if (isHeapGuidedInputAlgorithm(id)) {
    return buildHeapInput({
      values: draft.values,
      target: draft.target,
      command: draft.command,
    });
  }
  if (isHuffmanGuidedInputAlgorithm(id)) {
    return buildHuffmanInput({ symbols: draft.symbols });
  }
  if (isArrayGuidedInputAlgorithm(id)) {
    const parsed = parseIntegerList(draft.values);
    if (!parsed.ok) return { ok: false, error: { key: 'guidedErrorIntegerList' } };
    const min = id === 'bubble' ? GUIDED_INPUT_LIMITS.BUBBLE_MIN : GUIDED_INPUT_LIMITS.SORT_MIN;
    const max = id === 'bubble' ? GUIDED_INPUT_LIMITS.BUBBLE_MAX : GUIDED_INPUT_LIMITS.SORT_MAX;
    if (parsed.values.length < min || parsed.values.length > max) {
      return {
        ok: false,
        error: {
          key: id === 'bubble' ? 'guidedErrorBubbleLength' : 'guidedErrorSortLength',
          max,
        },
      };
    }
    return { ok: true, input: parsed.values };
  }

  if (isNumsTargetGuidedInputAlgorithm(id)) {
    let numsRaw = draft.nums;
    let targetRaw = draft.target;
    // Backward-compatible paste of the old JSON field: `{"nums":[...],"target":2}`.
    const object = parseObject(numsRaw);
    if (object) {
      if (Array.isArray(object.nums)) numsRaw = object.nums.map(describeNumber).join(', ');
      if (targetRaw.trim() === '' && typeof object.target === 'number') {
        targetRaw = describeNumber(object.target);
      }
    }

    if (id === 'linear' && numsRaw.trim() === '') {
      // An empty array is a valid linear-search input and must reach the real
      // Python program, which emits the correct -1 result instead of an old trace.
      const target = parseInteger(targetRaw);
      if (target === null) return { ok: false, error: { key: 'guidedErrorTarget' } };
      return { ok: true, input: { nums: [], target } };
    }

    const parsed = parseIntegerList(numsRaw);
    if (!parsed.ok) return { ok: false, error: { key: 'guidedErrorIntegerList' } };
    if (id === 'linear') {
      if (parsed.values.length > GUIDED_INPUT_LIMITS.LINEAR_MAX) {
        return {
          ok: false,
          error: { key: 'guidedErrorLinearLength', max: GUIDED_INPUT_LIMITS.LINEAR_MAX },
        };
      }
      const target = parseInteger(targetRaw);
      if (target === null) return { ok: false, error: { key: 'guidedErrorTarget' } };
      // Linear search deliberately does not require or create ascending order.
      return { ok: true, input: { nums: parsed.values, target } };
    }
    if (
      parsed.values.length < GUIDED_INPUT_LIMITS.BINARY_MIN ||
      parsed.values.length > GUIDED_INPUT_LIMITS.BINARY_MAX
    ) {
      return { ok: false, error: { key: 'guidedErrorBinaryLength', max: GUIDED_INPUT_LIMITS.BINARY_MAX } };
    }
    const target = parseInteger(targetRaw);
    if (target === null) return { ok: false, error: { key: 'guidedErrorTarget' } };
    // Sorting the array here would silently change the student's input. The
    // Python program is allowed to reject unsorted data and emit its real
    // invalid trace; this UI never reorders it.
    return { ok: true, input: { nums: parsed.values, target } };
  }

  if (isHashGuidedInputAlgorithm(id)) {
    const parsed = parseHashOperations(draft.operations);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      input: { tableSize: GUIDED_INPUT_LIMITS.HASH_TABLE_SIZE, operations: parsed.operations },
    };
  }

  let text = draft.text;
  let pattern = draft.pattern;
  const object = parseObject(text);
  if (object) {
    if (typeof object.text === 'string') text = object.text;
    if (typeof object.pattern === 'string') pattern = object.pattern;
  }
  if (text.length === 0) return { ok: false, error: { key: 'guidedErrorKmpText' } };
  if (text.length > GUIDED_INPUT_LIMITS.KMP_TEXT_MAX) {
    return { ok: false, error: { key: 'guidedErrorKmpTextLength', max: GUIDED_INPUT_LIMITS.KMP_TEXT_MAX } };
  }
  if (pattern.length === 0) return { ok: false, error: { key: 'guidedErrorKmpPattern' } };
  if (pattern.length > GUIDED_INPUT_LIMITS.KMP_PATTERN_MAX) {
    return { ok: false, error: { key: 'guidedErrorKmpPatternLength', max: GUIDED_INPUT_LIMITS.KMP_PATTERN_MAX } };
  }
  return { ok: true, input: { text, pattern } };
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function isAscending(values: number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1]! <= value);
}

function randomArrayValues(scenario: string, random: () => number): number[] {
  const length = randInt(random, 8, 11);
  const pick = () => randInt(random, -20, 60);

  if (scenario === 'nearly-sorted') {
    const values = Array.from({ length }, (_, index) => -15 + index * randInt(random, 2, 5));
    const swaps = randInt(random, 1, 2);
    for (let count = 0; count < swaps; count += 1) {
      const index = randInt(random, 0, values.length - 2);
      [values[index], values[index + 1]] = [values[index + 1]!, values[index]!];
    }
    return values;
  }

  if (scenario === 'reversed') {
    const step = randInt(random, 2, 6);
    return Array.from({ length }, (_, index) => 70 - index * step);
  }

  if (scenario === 'duplicates') {
    const pool = [-4, 0, 3, 7, 11];
    return Array.from({ length }, () => pool[randInt(random, 0, pool.length - 1)]!);
  }

  const values = Array.from({ length }, pick);
  // Keep "shuffled" visually distinct from an accidentally sorted run.
  if (isAscending(values)) {
    [values[0], values[values.length - 1]] = [values[values.length - 1]!, values[0]!];
  }
  return values;
}

function randomLinearValues(scenario: string, random: () => number): { nums: number[]; target: number } {
  if (scenario === 'duplicates') {
    const target = randInt(random, -5, 20);
    const fill = () => {
      let value = randInt(random, -8, 24);
      if (value === target) value += 3;
      return value;
    };
    // First occurrence is at index 1; the later repeat proves that linear
    // search returns the first match rather than a later duplicate.
    return { nums: [fill(), target, fill(), fill(), target, fill()], target };
  }

  const length = randInt(random, 6, 9);
  const nums = Array.from({ length }, () => randInt(random, -12, 35));
  if (scenario === 'first') {
    nums[0] = randInt(random, -5, 25);
    return { nums, target: nums[0]! };
  }
  if (scenario === 'last') {
    nums[nums.length - 1] = randInt(random, -5, 25);
    return { nums, target: nums[nums.length - 1]! };
  }
  if (scenario === 'not-found') {
    return { nums, target: (Math.max(...nums) ?? 0) + randInt(random, 1, 9) };
  }
  const target = nums[randInt(random, 1, nums.length - 2)]!;
  return { nums, target };
}

function randomHashOperations(
  id: HashGuidedInputAlgorithm,
  scenario: string,
  random: () => number,
): HashOperationTuple[] {
  const shift = randInt(random, 0, 2);
  const collisionKeys = [1 + shift, 8 + shift, 15 + shift];

  if (id === 'hash-chain') {
    if (scenario === 'no-collision') {
      const keys = [1 + shift, 2 + shift, 3 + shift, 4 + shift];
      return [
        ...keys.map((key): HashOperationTuple => ['insert', key]),
        ['find', keys[2]!],
        ['delete', keys[1]!],
      ];
    }
    if (scenario === 'delete-head') {
      return [
        ...collisionKeys.map((key): HashOperationTuple => ['insert', key]),
        ['delete', collisionKeys[2]!],
        ['find', collisionKeys[1]!],
      ];
    }
    if (scenario === 'delete-middle') {
      return [
        ...collisionKeys.map((key): HashOperationTuple => ['insert', key]),
        ['delete', collisionKeys[1]!],
        ['find', collisionKeys[2]!],
      ];
    }
    return [
      ...collisionKeys.map((key): HashOperationTuple => ['insert', key]),
      ['find', collisionKeys[1]!],
      ['find', scenario === 'find-miss' ? 20 + shift : 99],
    ];
  }

  if (scenario === 'no-collision') {
    const keys = [1 + shift, 2 + shift, 3 + shift, 4 + shift];
    return [
      ...keys.map((key): HashOperationTuple => ['insert', key]),
      ['find', keys[2]!],
      ['delete', keys[1]!],
    ];
  }
  if (scenario === 'tombstone') {
    return [
      ...collisionKeys.map((key): HashOperationTuple => ['insert', key]),
      ['delete', collisionKeys[1]!],
      ['find', collisionKeys[2]!],
      ['insert', 22 + shift],
    ];
  }
  if (scenario === 'table-full') {
    return [
      ...Array.from({ length: GUIDED_INPUT_LIMITS.HASH_TABLE_SIZE }, (_, key): HashOperationTuple => ['insert', key]),
      ['insert', GUIDED_INPUT_LIMITS.HASH_TABLE_SIZE],
    ];
  }
  return [
    ...collisionKeys.map((key): HashOperationTuple => ['insert', key]),
    ['find', scenario === 'find-fail' ? 99 : collisionKeys[1]!],
  ];
}

function randomBinaryValues(scenario: string, random: () => number): { nums: number[]; target: number } {
  const length = randInt(random, 7, 10);
  const nums: number[] = [];
  let value = randInt(random, -12, 2);
  for (let index = 0; index < length; index += 1) {
    nums.push(value);
    value += randInt(random, 1, 6);
  }
  const target =
    scenario === 'not-found'
      ? nums[nums.length - 1]! + randInt(random, 1, 5)
      : nums[randInt(random, 0, nums.length - 1)]!;
  return { nums, target };
}

function randomWord(random: () => number, alphabet: string, length: number): string {
  return Array.from({ length }, () => alphabet[randInt(random, 0, alphabet.length - 1)]!).join('');
}

function randomKmpValues(scenario: string, random: () => number): { text: string; pattern: string } {
  if (scenario === 'failure') {
    // No "A" occurs in the text, while the pattern needs one.
    return { text: randomWord(random, 'BC', randInt(random, 10, 16)), pattern: 'ABA' };
  }
  if (scenario === 'prefix') {
    const pattern = 'AABAAB';
    const middle = randomWord(random, 'AB', randInt(random, 1, 4));
    return { text: `${pattern}${middle}${pattern}`, pattern };
  }
  if (scenario === 'fallback') {
    // The mismatch at text[3] forces j = lps[2] = 1 before the next match.
    return { text: 'ABACABAB', pattern: 'ABAB' };
  }
  if (scenario === 'overlap') {
    // "AAA" on a run of A's matches at 0, 1, 2, ... — genuinely overlapping.
    const length = randInt(random, 8, 12);
    return { text: `${'A'.repeat(length)}B`, pattern: 'AAA' };
  }

  const pattern = ['ABA', 'ABAB', 'ABCAB'][randInt(random, 0, 2)]!;
  const prefixLength = randInt(random, 0, 3);
  const suffixLength = randInt(random, 0, 3);
  const prefix = randomWord(random, 'ABC', prefixLength);
  const suffix = randomWord(random, 'ABC', suffixLength);
  return { text: `${prefix}${pattern}${suffix}`, pattern };
}

export function randomGuidedDraft(
  id: GuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): GuidedInputDraft {
  if (isGraphAlgorithmGuidedInput(id)) {
    return { ...EMPTY_DRAFT, graph: randomGraphDraft(id, scenario, random) };
  }
  if (isSparseGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, sparse: randomSparseDraft(scenario, random) };
  }
  if (isStructureGuidedInputAlgorithm(id)) {
    return randomStructureDraft(id, scenario, random);
  }
  if (isTreeGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...randomTreeDraft(id, scenario, random) };
  }
  if (isHeapGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...randomHeapDraft(scenario, random) };
  }
  if (isHuffmanGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, ...randomHuffmanDraft(scenario, random) };
  }
  if (isArrayGuidedInputAlgorithm(id)) {
    return { ...EMPTY_DRAFT, values: randomArrayValues(scenario, random).join(', ') };
  }
  if (id === 'linear') {
    const generated = randomLinearValues(scenario, random);
    return {
      ...EMPTY_DRAFT,
      nums: generated.nums.join(', '),
      target: String(generated.target),
    };
  }
  if (isHashGuidedInputAlgorithm(id)) {
    return {
      ...EMPTY_DRAFT,
      operations: randomHashOperations(id, scenario, random)
        .map(([operation, key]) => `${operation} ${key}`)
        .join('\n'),
    };
  }
  if (id === 'binary') {
    const generated = randomBinaryValues(scenario, random);
    return { ...EMPTY_DRAFT, nums: generated.nums.join(', '), target: String(generated.target) };
  }
  const generated = randomKmpValues(scenario, random);
  return { ...EMPTY_DRAFT, text: generated.text, pattern: generated.pattern };
}

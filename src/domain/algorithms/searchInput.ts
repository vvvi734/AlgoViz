/**
 * TEXTBOOK-09: validation for the three new search courses.
 *
 * All parsers are strict: a block partition that violates the index ranges is
 * rejected instead of being silently re-grouped or re-sorted; B+ range input
 * rejects low > high; a trie word must be lower-case ASCII and unique. The
 * random generators only emit inputs that already satisfy these rules.
 */
import type { GuidedInputDraft, GuidedInputError, GuidedRandomScenario } from './guidedInput';

export const SEARCH_GUIDED_INPUT_ALGORITHMS = ['block-search', 'bplus-tree', 'key-tree'] as const;
export type SearchGuidedInputAlgorithm = (typeof SEARCH_GUIDED_INPUT_ALGORITHMS)[number];

export const BLOCK_SEARCH_ALGORITHM = 'block-search' as const;
export const BPLUS_TREE_ALGORITHM = 'bplus-tree' as const;
export const KEY_TREE_ALGORITHM = 'key-tree' as const;

export const SEARCH_RANDOM_SCENARIOS: Record<SearchGuidedInputAlgorithm, readonly GuidedRandomScenario[]> = {
  'block-search': [
    { id: 'hit', label: ['随机命中', 'random hit'] },
    { id: 'miss', label: ['随机失败', 'random miss'] },
    { id: 'last-block', label: ['最后一块命中', 'hit in last block'] },
    { id: 'boundary', label: ['边界关键字', 'block boundary key'] },
  ],
  'bplus-tree': [
    { id: 'hit', label: ['随机命中', 'random hit'] },
    { id: 'miss', label: ['随机失败', 'random miss'] },
    { id: 'range', label: ['随机范围查询', 'random range'] },
    { id: 'insert', label: ['随机插入', 'random insert'] },
  ],
  'key-tree': [
    { id: 'shared-hit', label: ['共享前缀命中', 'shared-prefix hit'] },
    { id: 'prefix-miss', label: ['前缀不是单词', 'prefix is not a word'] },
    { id: 'missing-branch', label: ['缺失分支', 'missing branch'] },
    { id: 'insert-shared', label: ['共享前缀插入', 'insert under a shared prefix'] },
  ],
};

export function isSearchGuidedInputAlgorithm(id: string): id is SearchGuidedInputAlgorithm {
  return (SEARCH_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

const EMPTY_DRAFT: GuidedInputDraft = {
  values: '',
  nums: '',
  target: '',
  n: '',
  text: '',
  pattern: '',
  operations: '',
  rows: [],
  mode: 'find',
  command: '',
  symbols: '',
  end: '',
  blockSize: '4',
};

export function emptySearchDraft(id: SearchGuidedInputAlgorithm): GuidedInputDraft {
  if (id === BLOCK_SEARCH_ALGORITHM) {
    return { ...EMPTY_DRAFT, values: '22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69', target: '38', blockSize: '4' };
  }
  if (id === BPLUS_TREE_ALGORITHM) {
    return { ...EMPTY_DRAFT, values: '5, 10, 15, 20, 25, 30, 35, 40', target: '25', end: '33', mode: 'find' };
  }
  return { ...EMPTY_DRAFT, values: 'car, card, care, cat, dog, do', target: 'care', mode: 'find' };
}

export function searchDraftFromInput(id: SearchGuidedInputAlgorithm, input: unknown): GuidedInputDraft {
  const base = emptySearchDraft(id);
  if (!input || typeof input !== 'object') return base;
  const record = input as Record<string, unknown>;
  if (id === BLOCK_SEARCH_ALGORITHM) {
    const data = Array.isArray(record.data) ? record.data : [];
    const blockSize = typeof record.blockSize === 'number' ? record.blockSize : 4;
    const target = typeof record.target === 'number' ? record.target : 0;
    return {
      ...base,
      values: data.map((value) => String(value)).join(', '),
      blockSize: String(blockSize),
      target: String(target),
    };
  }
  if (id === BPLUS_TREE_ALGORITHM) {
    const tree = Array.isArray(record.tree) ? record.tree : [];
    const operation = record.operation;
    const target = typeof record.target === 'number' ? record.target : 0;
    const end = typeof record.end === 'number' ? record.end : target;
    return {
      ...base,
      values: tree.map((value) => String(value)).join(', '),
      mode: operation === 'insert' || operation === 'range' ? operation : 'find',
      target: String(target),
      end: String(end),
    };
  }
  const words = Array.isArray(record.words) ? record.words : [];
  const operation = record.operation;
  const target = typeof record.target === 'string' ? record.target : '';
  return {
    ...base,
    values: words.map((word) => String(word)).join(', '),
    mode: operation === 'insert' ? 'insert' : 'find',
    target,
  };
}

function parseIntList(raw: string, max: number): number[] | null {
  const parts = raw.split(/[\s,，]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > max) return null;
  const values: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    const value = Number(part);
    if (!Number.isSafeInteger(value)) return null;
    values.push(value);
  }
  return values;
}

function parseInteger(raw: string): number | null {
  if (!/^-?\d+$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) ? value : null;
}

export function buildSearchInput(
  id: SearchGuidedInputAlgorithm,
  draft: GuidedInputDraft,
): { ok: true; input: unknown } | { ok: false; error: GuidedInputError } {
  if (id === BLOCK_SEARCH_ALGORITHM) {
    const data = parseIntList(draft.values, 24);
    if (!data || data.length < 1) return { ok: false, error: { key: 'searchBlockDataInvalid' } };
    const blockSize = parseInteger(draft.blockSize ?? '4');
    if (blockSize === null || blockSize < 1 || blockSize > 8) {
      return { ok: false, error: { key: 'searchBlockSizeInvalid' } };
    }
    const target = parseInteger(draft.target);
    if (target === null) return { ok: false, error: { key: 'searchTargetInvalid' } };
    const blocks: number[][] = [];
    for (let start = 0; start < data.length; start += blockSize) {
      blocks.push(data.slice(start, start + blockSize));
    }
    if (blocks.length > 8) return { ok: false, error: { key: 'searchBlockTooMany' } };
    for (let index = 0; index < blocks.length; index += 1) {
      const max = Math.max(...blocks[index]);
      if (index > 0) {
        const previousMax = Math.max(...blocks[index - 1]);
        if (max <= previousMax) return { ok: false, error: { key: 'searchBlockMaxOrder', row: index + 1 } };
        if (Math.min(...blocks[index]) <= previousMax) {
          return { ok: false, error: { key: 'searchBlockRangeOrder', row: index + 1 } };
        }
      }
    }
    return { ok: true, input: { preset: null, data, blockSize, target } };
  }

  if (id === BPLUS_TREE_ALGORITHM) {
    const tree = parseIntList(draft.values, 20);
    if (!tree || tree.length < 1) return { ok: false, error: { key: 'searchTreeValuesInvalid' } };
    if (new Set(tree).size !== tree.length) return { ok: false, error: { key: 'searchTreeDuplicate' } };
    const target = parseInteger(draft.target);
    if (target === null) return { ok: false, error: { key: 'searchTargetInvalid' } };
    const operation = draft.mode === 'insert' || draft.mode === 'range' ? draft.mode : 'find';
    const end = operation === 'range' ? parseInteger(draft.end ?? '') : target;
    if (end === null) return { ok: false, error: { key: 'searchRangeEndInvalid' } };
    if (operation === 'range' && target > end) return { ok: false, error: { key: 'searchRangeOrder' } };
    return { ok: true, input: { preset: null, tree, operation, target, end } };
  }

  const words = draft.values
    .split(/[\s,，]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  if (words.length < 1) return { ok: false, error: { key: 'searchWordsEmpty' } };
  if (words.length > 8) return { ok: false, error: { key: 'searchWordsTooMany' } };
  for (const word of words) {
    if (!/^[a-z]{1,8}$/.test(word)) return { ok: false, error: { key: 'searchWordInvalid' } };
  }
  if (new Set(words).size !== words.length) return { ok: false, error: { key: 'searchWordDuplicate' } };
  const target = draft.target.trim().toLowerCase();
  if (!/^[a-z]{1,8}$/.test(target)) return { ok: false, error: { key: 'searchKeyTargetInvalid' } };
  const operation = draft.mode === 'insert' ? 'insert' : 'find';
  return { ok: true, input: { preset: null, words, operation, target } };
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function choose<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function randomBlockDraft(scenario: string, random: () => number): GuidedInputDraft {
  const blockSize = 4;
  const blocks = 3;
  let previousMax = -1;
  const data: number[] = [];
  for (let block = 0; block < blocks; block += 1) {
    const low = previousMax + 2 + randomInt(random, 0, 4);
    const high = low + 8 + randomInt(random, 0, 5);
    const values: number[] = [];
    const used = new Set<number>();
    while (values.length < blockSize) {
      const value = randomInt(random, low, high);
      if (used.has(value)) continue;
      used.add(value);
      values.push(value);
    }
    const max = Math.max(...values);
    data.push(...values);
    previousMax = max;
  }
  const blockCount = blocks;
  const selectedBlock = scenario === 'last-block' ? blockCount - 1 : randomInt(random, 0, blockCount - 1);
  const blockValues = data.slice(selectedBlock * blockSize, (selectedBlock + 1) * blockSize);
  let target: number;
  if (scenario === 'boundary') {
    target = Math.max(...blockValues);
  } else if (scenario === 'miss') {
    target = Math.max(...data) + 1 + randomInt(random, 0, 2);
  } else {
    target = choose(random, blockValues);
  }
  return {
    ...EMPTY_DRAFT,
    values: data.join(', '),
    target: String(target),
    blockSize: String(blockSize),
  };
}

function randomBplusDraft(scenario: string, random: () => number): GuidedInputDraft {
  const count = randomInt(random, 7, 11);
  const values: number[] = [];
  while (values.length < count) {
    const value = randomInt(random, 2, 80);
    if (!values.includes(value)) values.push(value);
  }
  values.sort((a, b) => a - b);
  if (scenario === 'hit') {
    const target = choose(random, values);
    return { ...EMPTY_DRAFT, values: values.join(', '), mode: 'find', target: String(target), end: String(target) };
  }
  if (scenario === 'miss') {
    let target = randomInt(random, 1, 90);
    while (values.includes(target)) target = randomInt(random, 1, 90);
    return { ...EMPTY_DRAFT, values: values.join(', '), mode: 'find', target: String(target), end: String(target) };
  }
  if (scenario === 'range') {
    const low = choose(random, values);
    const high = values[Math.min(values.length - 1, values.indexOf(low) + randomInt(random, 1, 3))];
    return { ...EMPTY_DRAFT, values: values.join(', '), mode: 'range', target: String(low), end: String(high) };
  }
  let target = randomInt(random, 1, 90);
  while (values.includes(target)) target = randomInt(random, 1, 90);
  return { ...EMPTY_DRAFT, values: values.join(', '), mode: 'insert', target: String(target), end: String(target) };
}

function randomKeyTreeDraft(scenario: string, random: () => number): GuidedInputDraft {
  const root = choose(random, ['car', 'star', 'port', 'plan']);
  const expand = (word: string, suffix: string): string => `${word}${suffix}`.slice(0, 8);
  const words = [root, expand(root, 'd'), expand(root, 'er'), expand(root, 's')];
  const other = choose(random, ['dog', 'do', 'dot', 'door']);
  if (!words.includes(other)) words.push(other);
  const extra = choose(random, ['cat', 'cold', 'cook', 'coat']);
  if (!words.includes(extra)) words.push(extra);
  if (scenario === 'shared-hit') {
    return { ...EMPTY_DRAFT, values: words.join(', '), mode: 'find', target: words[2] };
  }
  if (scenario === 'prefix-miss') {
    const word = words[0];
    return { ...EMPTY_DRAFT, values: words.join(', '), mode: 'find', target: word.slice(0, Math.max(2, word.length - 1)) };
  }
  if (scenario === 'missing-branch') {
    const candidate = `${words[0][0]}zz`;
    return { ...EMPTY_DRAFT, values: words.join(', '), mode: 'find', target: candidate };
  }
  return {
    ...EMPTY_DRAFT,
    values: words.join(', '),
    mode: 'insert',
    target: expand(root, 'ing'),
  };
}

export function randomSearchDraft(
  id: SearchGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): GuidedInputDraft {
  if (id === BLOCK_SEARCH_ALGORITHM) return randomBlockDraft(scenario, random);
  if (id === BPLUS_TREE_ALGORITHM) return randomBplusDraft(scenario, random);
  return randomKeyTreeDraft(scenario, random);
}

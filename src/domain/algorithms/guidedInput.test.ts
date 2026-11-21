import { describe, expect, it } from 'vitest';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  guidedLanguageFor,
  isHeapGuidedInputAlgorithm,
  isHuffmanGuidedInputAlgorithm,
  isTreeGuidedInputAlgorithm,
  randomGuidedDraft,
  type GuidedInputAlgorithm,
  type GuidedInputDraft,
} from './guidedInput';

function draft(overrides: Partial<GuidedInputDraft>): GuidedInputDraft {
  return {
    values: '',
    nums: '',
    target: '',
    n: '',
    text: '',
    pattern: '',
    operations: '',
    rows: [],
    mode: 'inorder',
    command: '',
    symbols: '',
    ...overrides,
  };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function buildOk(id: GuidedInputAlgorithm, value: GuidedInputDraft): unknown {
  const result = buildGuidedInput(id, value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return result.input;
}

function occurrences(text: string, pattern: string): number {
  let count = 0;
  let index = text.indexOf(pattern);
  while (index >= 0) {
    count += 1;
    index = text.indexOf(pattern, index + 1);
  }
  return count;
}

function lps(pattern: string): number[] {
  const table = Array.from({ length: pattern.length }, () => 0);
  let length = 0;
  for (let index = 1; index < pattern.length; index += 1) {
    while (length > 0 && pattern[index] !== pattern[length]) length = table[length - 1]!;
    if (pattern[index] === pattern[length]) length += 1;
    table[index] = length;
  }
  return table;
}

describe('INPUT-01/02 guided input parsing', () => {
  it('accepts signed, zero and duplicate sorting values in several separators', () => {
    expect(buildOk('bubble', draft({ values: '8, 3, 5, 1, 7' }))).toEqual([8, 3, 5, 1, 7]);
    expect(buildOk('bubble', draft({ values: '[8 3 -2 0 3]' }))).toEqual([8, 3, -2, 0, 3]);
    expect(buildOk('bubble', draft({ values: '4，4，-1' }))).toEqual([4, 4, -1]);
    for (const id of ['selection', 'insertion', 'shell', 'quick', 'merge'] as const) {
      expect(buildOk(id, draft({ values: '9, -4, 0, 4，4' }))).toEqual([9, -4, 0, 4, 4]);
    }
  });

  it('wraps heap arrays in the real build command by default', () => {
    expect(buildOk('heap', draft({ values: '9, -4, 0, 9, 4' }))).toEqual({
      preset: null,
      operation: 'build',
      heap: [9, -4, 0, 9, 4],
      value: null,
    });
    expect(buildOk('heap', draft({ values: '9, 5, 7, 3', command: 'sort' }))).toEqual({
      preset: null,
      operation: 'sort',
      heap: [9, 5, 7, 3],
      value: null,
    });
  });

  it('rejects malformed, empty and undersized sorting inputs', () => {
    expect(buildGuidedInput('bubble', draft({ values: '8, 3.5' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorIntegerList' },
    });
    expect(buildGuidedInput('bubble', draft({ values: '' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorIntegerList' },
    });
    const tooMany = Array.from({ length: 17 }, (_, index) => index).join(', ');
    expect(buildGuidedInput('bubble', draft({ values: tooMany }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorBubbleLength', max: 16 },
    });
    expect(buildGuidedInput('quick', draft({ values: '7' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorSortLength', max: 16 },
    });
    expect(buildGuidedInput('merge', draft({ values: tooMany }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorSortLength', max: 16 },
    });
  });

  it('keeps binary input order untouched and accepts equal neighbours', () => {
    expect(buildOk('binary', draft({ nums: '1, 3, 3, 9', target: '-2' }))).toEqual({
      nums: [1, 3, 3, 9],
      target: -2,
    });
    // Unsorted data is passed through, not sorted. The real Python program
    // rejects it and emits its invalid trace.
    expect(buildOk('binary', draft({ nums: '3, 1, 2', target: '2' }))).toEqual({
      nums: [3, 1, 2],
      target: 2,
    });
    expect(buildGuidedInput('binary', draft({ nums: '1, 3', target: 'x' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorTarget' },
    });
  });

  it('supports the old JSON paste without changing the new field contract', () => {
    expect(buildOk('binary', draft({ nums: '{"nums":[3,1,2],"target":2}', target: '' }))).toEqual({
      nums: [3, 1, 2],
      target: 2,
    });
    expect(buildOk('kmp', draft({ text: '{"text":"ABAB","pattern":"AB"}', pattern: '' }))).toEqual({
      text: 'ABAB',
      pattern: 'AB',
    });
  });

  it('rejects an empty KMP pattern and enforces readable limits', () => {
    expect(buildGuidedInput('kmp', draft({ text: 'ABAB', pattern: '' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorKmpPattern' },
    });
    expect(buildGuidedInput('kmp', draft({ text: 'A'.repeat(25), pattern: 'A' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorKmpTextLength', max: 24 },
    });
    expect(buildGuidedInput('kmp', draft({ text: 'ABAB', pattern: 'A'.repeat(13) }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorKmpPatternLength', max: 12 },
    });
  });

  it('accepts unsorted linear-search arrays, duplicates and a truly empty array', () => {
    expect(buildOk('linear', draft({ nums: '6, 3, 7, 3, 9', target: '3' }))).toEqual({
      nums: [6, 3, 7, 3, 9],
      target: 3,
    });
    expect(buildOk('linear', draft({ nums: '', target: '5' }))).toEqual({ nums: [], target: 5 });
    expect(buildGuidedInput('linear', draft({ nums: '', target: '' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorTarget' },
    });
    const tooMany = Array.from({ length: 21 }, (_, index) => index).join(', ');
    expect(buildGuidedInput('linear', draft({ nums: tooMany, target: '0' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorLinearLength', max: 20 },
    });
  });

  it('parses concise chaining/probing operation lines without exposing JSON', () => {
    expect(buildOk('hash-chain', draft({ operations: 'insert 1\ninsert 8\nfind 8\ndelete 15' }))).toEqual({
      tableSize: 7,
      operations: [
        ['insert', 1],
        ['insert', 8],
        ['find', 8],
        ['delete', 15],
      ],
    });
    expect(buildOk('hash-probe', draft({ operations: '插入 1；查找 8，删除 15' }))).toEqual({
      tableSize: 7,
      operations: [
        ['insert', 1],
        ['find', 8],
        ['delete', 15],
      ],
    });
    expect(buildGuidedInput('hash-chain', draft({ operations: 'push 1' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorHashOperation' },
    });
    expect(buildGuidedInput('hash-chain', draft({ operations: 'insert 100' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorHashKey', max: 99 },
    });
    expect(buildGuidedInput('hash-probe', draft({ operations: '' }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorHashOperations' },
    });
    const tooMany = Array.from({ length: 21 }, (_, index) => `insert ${index}`).join('\n');
    expect(buildGuidedInput('hash-probe', draft({ operations: tooMany }))).toEqual({
      ok: false,
      error: { key: 'guidedErrorHashLimit', max: 20 },
    });
  });

  it('round-trips official-shaped inputs back into editable fields', () => {
    expect(guidedDraftFromInput('bubble', [5, 2, 8])).toMatchObject({ values: '5, 2, 8' });
    expect(guidedDraftFromInput('selection', [7, 1, 4])).toMatchObject({ values: '7, 1, 4' });
    expect(guidedDraftFromInput('heap', { heap: [9, 2, 6], operation: 'sort' })).toMatchObject({
      values: '9, 2, 6',
    });
    expect(guidedDraftFromInput('linear', { nums: [6, 3, 9], target: 9 })).toMatchObject({
      nums: '6, 3, 9',
      target: '9',
    });
    expect(
      guidedDraftFromInput('hash-chain', {
        tableSize: 7,
        operations: [
          ['insert', 1],
          ['find', 8],
        ],
      }),
    ).toMatchObject({ operations: 'insert 1\nfind 8' });
    expect(guidedDraftFromInput('binary', { nums: [1, 3], target: 3 })).toMatchObject({
      nums: '1, 3',
      target: '3',
    });
    expect(guidedDraftFromInput('kmp', { text: 'ABAB', pattern: 'AB' })).toMatchObject({
      text: 'ABAB',
      pattern: 'AB',
    });
  });

  it('registers the four tree courses, heap and Huffman through the same input pipeline', () => {
    expect(isTreeGuidedInputAlgorithm('inorder')).toBe(true);
    expect(isTreeGuidedInputAlgorithm('bst')).toBe(true);
    expect(isTreeGuidedInputAlgorithm('avl')).toBe(true);
    expect(isTreeGuidedInputAlgorithm('btree')).toBe(true);
    expect(isTreeGuidedInputAlgorithm('heap')).toBe(false);
    expect(isHeapGuidedInputAlgorithm('heap')).toBe(true);
    expect(isHuffmanGuidedInputAlgorithm('huffman')).toBe(true);

    for (const id of ['inorder', 'bst', 'avl', 'btree', 'heap', 'huffman'] as const) {
      expect(guidedLanguageFor(id)).toBe('python');
      expect(guidedExecutionLanguage(id, 'custom')).toBe('python');
      expect(guidedRandomScenarios(id).length).toBeGreaterThan(0);
    }
  });

  it('builds tree, heap and Huffman drafts through their dedicated field editors', () => {
    expect(
      guidedDraftFromInput('inorder', { mode: 'postorder', tree: [4, 2, 6, null, 3] }),
    ).toMatchObject({
      values: '4, 2, 6, null, 3',
      mode: 'postorder',
    });
    expect(guidedDraftFromInput('bst', { operation: 'delete', tree: [50, 30, 70], target: 50 })).toMatchObject({
      values: '50, 30, 70',
      target: '50',
      command: 'delete',
    });
    expect(guidedDraftFromInput('avl', { operation: 'insert', tree: [30, 20, 40], target: 10 })).toMatchObject({
      values: '30, 20, 40',
      target: '10',
      command: 'insert',
    });
    expect(guidedDraftFromInput('btree', { operation: 'find', tree: [10, 20, 30], target: 20 })).toMatchObject({
      values: '10, 20, 30',
      target: '20',
      command: 'find',
    });
    expect(guidedDraftFromInput('heap', { operation: 'push', heap: [9, 8, 6], value: 10 })).toMatchObject({
      values: '9, 8, 6',
      target: '10',
      command: 'push',
    });
    expect(guidedDraftFromInput('huffman', { symbols: [['A', 5], ['B', 9]] })).toMatchObject({
      symbols: 'A: 5\nB: 9',
    });

    expect(buildOk('inorder', draft({ values: '4, 2, 6, null, 3', mode: 'preorder' }))).toEqual({
      mode: 'preorder',
      tree: [4, 2, 6, null, 3],
    });
    expect(buildOk('heap', draft({ values: '5, 3, 4, 1, 2', command: 'push', target: '10' }))).toMatchObject({
      operation: 'push',
      value: 10,
    });
    expect(buildOk('huffman', draft({ symbols: 'A: 5\nB: 9' }))).toEqual({
      preset: null,
      symbols: [
        ['A', 5],
        ['B', 9],
      ],
    });
  });

  it('randomizes every new input family into a buildable draft without executing', () => {
    for (const id of ['inorder', 'bst', 'avl', 'btree', 'heap', 'huffman'] as const) {
      for (const scenario of guidedRandomScenarios(id)) {
        for (let seed = 1; seed <= 4; seed += 1) {
          const generated = randomGuidedDraft(id, scenario.id, seeded(seed));
          expect(buildGuidedInput(id, generated).ok).toBe(true);
        }
      }
    }
  });

  it('uses JavaScript only for official bubble and Python for every generated trace', () => {
    expect(guidedLanguageFor('bubble')).toBe('js');
    expect(guidedLanguageFor('selection')).toBe('python');
    expect(guidedLanguageFor('insertion')).toBe('python');
    expect(guidedLanguageFor('shell')).toBe('python');
    expect(guidedLanguageFor('quick')).toBe('python');
    expect(guidedLanguageFor('merge')).toBe('python');
    expect(guidedLanguageFor('heap')).toBe('python');
    expect(guidedLanguageFor('binary')).toBe('python');
    expect(guidedLanguageFor('linear')).toBe('python');
    expect(guidedLanguageFor('hash-chain')).toBe('python');
    expect(guidedLanguageFor('hash-probe')).toBe('python');
    expect(guidedLanguageFor('kmp')).toBe('python');
    expect(guidedLanguageFor('dijkstra')).toBe('python');
    expect(guidedExecutionLanguage('bubble', 'official')).toBe('js');
    expect(guidedExecutionLanguage('bubble', 'custom')).toBe('python');
    expect(guidedExecutionLanguage('bubble', 'random')).toBe('python');
    expect(guidedExecutionLanguage('quick', 'custom')).toBe('python');
    expect(guidedExecutionLanguage('heap', 'random')).toBe('python');
    expect(guidedExecutionLanguage('binary', 'random')).toBe('python');
    expect(guidedExecutionLanguage('linear', 'custom')).toBe('python');
    expect(guidedExecutionLanguage('hash-probe', 'random')).toBe('python');
    expect(guidedExecutionLanguage('dijkstra', 'custom')).toBe('python');
  });
});

describe('INPUT-01/02 random generation prerequisites', () => {
  it('generates every bubble scenario inside the readable limit', () => {
    for (const scenario of guidedRandomScenarios('bubble')) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const generated = randomGuidedDraft('bubble', scenario.id, seeded(seed));
        const values = buildOk('bubble', generated) as number[];
        expect(values.length).toBeGreaterThanOrEqual(1);
        expect(values.length).toBeLessThanOrEqual(16);
        if (scenario.id === 'reversed') {
          expect(values.every((value, index) => index === 0 || values[index - 1]! >= value)).toBe(true);
        }
        if (scenario.id === 'duplicates') {
          expect(new Set(values).size).toBeLessThan(values.length);
        }
      }
    }
    expect(defaultGuidedScenario('bubble')).toBe('shuffled');
  });

  it('generates four shared scenarios for the five remaining sorting algorithms', () => {
    const sortingIds = ['selection', 'insertion', 'shell', 'quick', 'merge'] as const;
    for (const id of sortingIds) {
      expect(guidedRandomScenarios(id).map((scenario) => scenario.id)).toEqual([
        'shuffled',
        'nearly-sorted',
        'reversed',
        'duplicates',
      ]);
      expect(defaultGuidedScenario(id)).toBe('shuffled');
      for (const scenario of guidedRandomScenarios(id)) {
        for (let seed = 1; seed <= 8; seed += 1) {
          const generated = randomGuidedDraft(id, scenario.id, seeded(seed));
          const values = buildOk(id, generated) as number[];
          expect(values.length).toBeGreaterThanOrEqual(8);
          expect(values.length).toBeLessThanOrEqual(11);
          if (scenario.id === 'reversed') {
            expect(values.every((value, index) => index === 0 || values[index - 1]! >= value)).toBe(true);
          }
          if (scenario.id === 'duplicates') {
            expect(new Set(values).size).toBeLessThan(values.length);
          }
        }
      }
    }
  });

  it('generates all linear-search scenarios with the intended match position', () => {
    expect(guidedRandomScenarios('linear').map((scenario) => scenario.id)).toEqual([
      'normal',
      'first',
      'last',
      'not-found',
      'duplicates',
    ]);
    expect(defaultGuidedScenario('linear')).toBe('normal');
    for (const scenario of guidedRandomScenarios('linear')) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const input = buildOk('linear', randomGuidedDraft('linear', scenario.id, seeded(seed))) as {
          nums: number[];
          target: number;
        };
        expect(input.nums.length).toBeGreaterThanOrEqual(6);
        expect(input.nums.length).toBeLessThanOrEqual(9);
        if (scenario.id === 'first') expect(input.target).toBe(input.nums[0]);
        if (scenario.id === 'last') expect(input.target).toBe(input.nums[input.nums.length - 1]);
        if (scenario.id === 'not-found') expect(input.nums).not.toContain(input.target);
        if (scenario.id === 'duplicates') {
          expect(input.nums.filter((value) => value === input.target).length).toBeGreaterThan(1);
          expect(input.nums.indexOf(input.target)).toBe(1);
        }
      }
    }
  });

  it('generates hash scenarios that satisfy their bucket, delete and tombstone claims', () => {
    expect(guidedRandomScenarios('hash-chain').map((scenario) => scenario.id)).toEqual([
      'no-collision',
      'collision',
      'delete-head',
      'delete-middle',
      'find-miss',
    ]);
    expect(guidedRandomScenarios('hash-probe').map((scenario) => scenario.id)).toEqual([
      'no-collision',
      'collision',
      'tombstone',
      'find-fail',
      'table-full',
    ]);

    for (const id of ['hash-chain', 'hash-probe'] as const) {
      for (const scenario of guidedRandomScenarios(id)) {
        for (let seed = 1; seed <= 8; seed += 1) {
          const input = buildOk(id, randomGuidedDraft(id, scenario.id, seeded(seed))) as {
            tableSize: number;
            operations: [string, number][];
          };
          expect(input.tableSize).toBe(7);
          expect(input.operations.length).toBeLessThanOrEqual(16);
          expect(input.operations.every(([, key]) => key >= 0 && key <= 99)).toBe(true);
          const inserts = input.operations.filter(([operation]) => operation === 'insert').map(([, key]) => key);

          if (id === 'hash-chain') {
            if (scenario.id === 'no-collision') {
              expect(new Set(inserts.map((key) => key % 7)).size).toBe(inserts.length);
            }
            if (scenario.id === 'collision') {
              expect(new Set(inserts.map((key) => key % 7)).size).toBe(1);
              expect(input.operations.some(([operation]) => operation === 'find')).toBe(true);
            }
            if (scenario.id === 'delete-head' || scenario.id === 'delete-middle') {
              const deleted = input.operations.find(([operation]) => operation === 'delete')?.[1];
              expect(deleted).toBe(scenario.id === 'delete-head' ? 15 + (inserts[0]! - 1) : 8 + (inserts[0]! - 1));
            }
            if (scenario.id === 'find-miss') {
              expect(inserts).not.toContain(input.operations.at(-1)?.[1]);
            }
          } else {
            if (scenario.id === 'no-collision') {
              expect(new Set(inserts.map((key) => key % 7)).size).toBe(inserts.length);
            }
            if (scenario.id === 'collision') {
              expect(new Set(inserts.map((key) => key % 7)).size).toBe(1);
            }
            if (scenario.id === 'tombstone') {
              expect(input.operations.some(([operation]) => operation === 'delete')).toBe(true);
              expect(input.operations.some(([operation]) => operation === 'insert')).toBe(true);
            }
            if (scenario.id === 'find-fail') {
              expect(inserts).not.toContain(input.operations.at(-1)?.[1]);
            }
            if (scenario.id === 'table-full') {
              expect(inserts.slice(0, 7).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
              expect(input.operations.at(-1)).toEqual(['insert', 7]);
            }
          }
        }
      }
    }
  });

  it('generates sorted binary arrays and targets that match the chosen scenario', () => {
    for (const scenario of guidedRandomScenarios('binary')) {
      for (let seed = 1; seed <= 16; seed += 1) {
        const generated = randomGuidedDraft('binary', scenario.id, seeded(seed));
        const input = buildOk('binary', generated) as { nums: number[]; target: number };
        expect(input.nums.every((value, index) => index === 0 || input.nums[index - 1]! <= value)).toBe(true);
        if (scenario.id === 'found') expect(input.nums).toContain(input.target);
        if (scenario.id === 'not-found') expect(input.nums).not.toContain(input.target);
      }
    }
    expect(defaultGuidedScenario('binary')).toBe('found');
  });

  it('generates KMP scenarios with the intended match topology', () => {
    for (let seed = 1; seed <= 16; seed += 1) {
      const success = buildOk('kmp', randomGuidedDraft('kmp', 'success', seeded(seed))) as {
        text: string;
        pattern: string;
      };
      expect(success.text).toContain(success.pattern);

      const failure = buildOk('kmp', randomGuidedDraft('kmp', 'failure', seeded(seed))) as {
        text: string;
        pattern: string;
      };
      expect(failure.text).not.toContain(failure.pattern);

      const prefix = buildOk('kmp', randomGuidedDraft('kmp', 'prefix', seeded(seed))) as {
        text: string;
        pattern: string;
      };
      expect(prefix.pattern).toBe('AABAAB');
      expect(lps(prefix.pattern)).toEqual([0, 1, 0, 1, 2, 3]);

      const fallback = buildOk('kmp', randomGuidedDraft('kmp', 'fallback', seeded(seed))) as {
        text: string;
        pattern: string;
      };
      expect(lps(fallback.pattern)[fallback.pattern.length - 1]).toBeGreaterThan(0);

      const overlap = buildOk('kmp', randomGuidedDraft('kmp', 'overlap', seeded(seed))) as {
        text: string;
        pattern: string;
      };
      expect(occurrences(overlap.text, overlap.pattern)).toBeGreaterThan(1);
    }
    expect(guidedRandomScenarios('kmp').map((scenario) => scenario.id)).toEqual([
      'success',
      'failure',
      'prefix',
      'fallback',
      'overlap',
    ]);
  });
});

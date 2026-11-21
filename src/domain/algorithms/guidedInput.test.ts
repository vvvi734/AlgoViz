import { describe, expect, it } from 'vitest';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  guidedLanguageFor,
  randomGuidedDraft,
  type GuidedInputAlgorithm,
  type GuidedInputDraft,
} from './guidedInput';

function draft(overrides: Partial<GuidedInputDraft>): GuidedInputDraft {
  return {
    values: '',
    nums: '',
    target: '',
    text: '',
    pattern: '',
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

  it('wraps heap arrays in a real in-place heap-sort command', () => {
    expect(buildOk('heap', draft({ values: '9, -4, 0, 9, 4' }))).toEqual({
      preset: null,
      operation: 'sort',
      heap: [9, -4, 0, 9, 4],
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

  it('round-trips official-shaped inputs back into editable fields', () => {
    expect(guidedDraftFromInput('bubble', [5, 2, 8])).toMatchObject({ values: '5, 2, 8' });
    expect(guidedDraftFromInput('selection', [7, 1, 4])).toMatchObject({ values: '7, 1, 4' });
    expect(guidedDraftFromInput('heap', { heap: [9, 2, 6], operation: 'sort' })).toMatchObject({
      values: '9, 2, 6',
    });
    expect(guidedDraftFromInput('binary', { nums: [1, 3], target: 3 })).toMatchObject({
      nums: '1, 3',
      target: '3',
    });
    expect(guidedDraftFromInput('kmp', { text: 'ABAB', pattern: 'AB' })).toMatchObject({
      text: 'ABAB',
      pattern: 'AB',
    });
  });

  it('uses JavaScript only for official bubble and Python for every generated sorting trace', () => {
    expect(guidedLanguageFor('bubble')).toBe('js');
    expect(guidedLanguageFor('selection')).toBe('python');
    expect(guidedLanguageFor('insertion')).toBe('python');
    expect(guidedLanguageFor('shell')).toBe('python');
    expect(guidedLanguageFor('quick')).toBe('python');
    expect(guidedLanguageFor('merge')).toBe('python');
    expect(guidedLanguageFor('heap')).toBe('python');
    expect(guidedLanguageFor('binary')).toBe('python');
    expect(guidedLanguageFor('kmp')).toBe('python');
    expect(guidedLanguageFor('dijkstra')).toBeNull();
    expect(guidedExecutionLanguage('bubble', 'official')).toBe('js');
    expect(guidedExecutionLanguage('bubble', 'custom')).toBe('python');
    expect(guidedExecutionLanguage('bubble', 'random')).toBe('python');
    expect(guidedExecutionLanguage('quick', 'custom')).toBe('python');
    expect(guidedExecutionLanguage('heap', 'random')).toBe('python');
    expect(guidedExecutionLanguage('binary', 'random')).toBe('python');
    expect(guidedExecutionLanguage('dijkstra', 'custom')).toBeNull();
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

  it('generates four shared scenarios for all six remaining sorting algorithms', () => {
    const sortingIds = ['selection', 'insertion', 'shell', 'quick', 'merge', 'heap'] as const;
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
          const built = buildOk(id, generated);
          const values = id === 'heap' ? (built as { heap: number[] }).heap : (built as number[]);
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

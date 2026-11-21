import { describe, expect, it } from 'vitest';
import { buildBfModel } from '../visualization/bfModel';
import {
  BF_MAX_PATTERN,
  BF_MAX_TEXT,
  bfSnapshotSchema,
  computeBfMatches,
  structureSchema,
  type BfSnapshot,
} from './schema';

/**
 * Produce every frame the teaching Python program emits, but as plain objects.
 * This keeps the schema contract under test without requiring Pyodide here.
 */
function simulate(text: string, pattern: string): BfSnapshot[] {
  const frames: BfSnapshot[] = [];
  const n = text.length;
  const m = pattern.length;
  const seen = Array<number>(n).fill(0);
  const matches: number[] = [];
  let currentMatchStart: number | null = null;
  let checked = 0;
  let comparisons = 0;

  const emit = (
    operation: BfSnapshot['operation'],
    fields: Partial<BfSnapshot> = {},
  ) => {
    const snapshot: BfSnapshot = {
      kind: 'bf',
      operation,
      text,
      pattern,
      start: null,
      j: null,
      compareIndex: null,
      matched: null,
      nextStart: null,
      seen: [...seen],
      checkedCandidates: checked,
      comparisonCount: comparisons,
      matches: [...matches],
      currentMatchStart,
      ...fields,
    };
    frames.push(bfSnapshotSchema.parse(snapshot));
  };

  emit('init');

  if (n >= m) {
    for (let start = 0; start <= n - m; start += 1) {
      checked += 1;
      emit('candidate-start', { start, j: 0 });

      let j = 0;
      while (j < m) {
        const compareIndex = start + j;
        seen[compareIndex] += 1;
        comparisons += 1;
        const matched = text[compareIndex] === pattern[j];
        emit('compare', { start, j, compareIndex, matched });

        if (matched) {
          j += 1;
          if (j === m) {
            matches.push(start);
            currentMatchStart = start;
            emit('match-found', {
              start,
              j,
              compareIndex: start + m - 1,
              matched: true,
              nextStart: start + 1,
            });
          } else {
            emit('advance', {
              start,
              j,
              compareIndex: start + j - 1,
              matched: true,
            });
          }
        } else {
          emit('mismatch', {
            start,
            j,
            compareIndex,
            matched: false,
            nextStart: start + 1,
          });
          break;
        }
      }
    }
  }

  emit('done');
  return frames;
}

describe('BF schema and pure model', () => {
  it('matches the official default at 2 and 9, including overlaps', () => {
    const frames = simulate('ABABABCABABABC', 'ABABC');
    const found = frames.filter((frame) => frame.operation === 'match-found');
    expect(found.map((frame) => frame.currentMatchStart)).toEqual([2, 9]);
    expect(frames.at(-1)!.matches).toEqual([2, 9]);
    expect(frames.at(-1)!.checkedCandidates).toBe(10);
    expect(computeBfMatches('AAAAA', 'AAA')).toEqual([0, 1, 2]);
    expect(computeBfMatches('ABABAB', 'BAB')).toEqual([1, 3]);
  });

  it('accepts every simulated frame through the union schema and the typed schema', () => {
    for (const [text, pattern] of [
      ['ABABABCABABABC', 'ABABC'],
      ['AAAAA', 'AAA'],
      ['ABC', 'XYZ'],
      ['AB', 'ABC'],
      ['', 'A'],
      ['A', 'A'],
    ] as const) {
      for (const frame of simulate(text, pattern)) {
        expect(structureSchema.safeParse(frame).success).toBe(true);
        expect(bfSnapshotSchema.safeParse(frame).success).toBe(true);
      }
    }
  });

  it('counts every real comparison and marks the rescanned text cell', () => {
    const frames = simulate('AAAA', 'AAA');
    const final = frames.at(-1)!;
    expect(final.matches).toEqual([0, 1]);
    expect(final.comparisonCount).toBe(final.seen.reduce((sum, value) => sum + value, 0));
    expect(final.seen[2]).toBeGreaterThanOrEqual(2);
    expect(final.checkedCandidates).toBe(2);
  });

  it('handles empty text and text shorter than the pattern with a direct done frame', () => {
    for (const [text, pattern] of [['', 'A'], ['AB', 'ABC']]) {
      const frames = simulate(text, pattern);
      expect(frames.map((frame) => frame.operation)).toEqual(['init', 'done']);
      expect(frames.at(-1)!.checkedCandidates).toBe(0);
      expect(frames.at(-1)!.matches).toEqual([]);
    }
  });

  it('rejects an empty pattern and a live start outside 0..n-m', () => {
    const base = simulate('ABABABCABABABC', 'ABABC')[0];
    expect(bfSnapshotSchema.safeParse({ ...base, pattern: '' }).success).toBe(false);
    expect(bfSnapshotSchema.safeParse({ ...base, operation: 'candidate-start', start: 10, j: 0 }).success).toBe(false);
  });

  it('uses the documented limits for text and pattern', () => {
    expect(BF_MAX_TEXT).toBe(24);
    expect(BF_MAX_PATTERN).toBe(12);
  });

  it('translates the final frame into cells, chips and a done model', () => {
    const final = simulate('ABABABCABABABC', 'ABABC').at(-1)!;
    const model = buildBfModel(final);
    expect(model.textCells).toHaveLength(14);
    expect(model.patternCells).toHaveLength(5);
    expect(model.totalCandidates).toBe(10);
    expect(model.matches).toEqual([2, 9]);
    expect(model.currentMatchStart).toBe(9);
    expect(model.textCells.slice(9, 14).every((cell) => cell.tone === 'found')).toBe(true);
    expect(model.patternCells.every((cell) => cell.tone === 'found')).toBe(true);
    expect(model.emptyText).toBe(false);
  });

  it('marks a compare cell and a mismatch start before the shift', () => {
    const compare = simulate('ABXC', 'ABA').find(
      (frame) => frame.operation === 'compare' && frame.matched === false,
    )!;
    const compareModel = buildBfModel(compare);
    expect(compareModel.textCells[compare.start! + compare.j!].tone).toBe('mismatch');
    expect(compareModel.patternCells[compare.j!].tone).toBe('mismatch');

    const mismatch = simulate('ABXC', 'ABA').find((frame) => frame.operation === 'mismatch')!;
    const mismatchModel = buildBfModel(mismatch);
    expect(mismatchModel.nextStartValid).toBe(true);
    expect(mismatchModel.alignment).toBe(mismatch.start);
  });

  it('shows an empty text model without inventing candidates', () => {
    const final = simulate('', 'A').at(-1)!;
    const model = buildBfModel(final);
    expect(model.emptyText).toBe(true);
    expect(model.totalCandidates).toBe(0);
    expect(model.matches).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  HUFFMAN_INPUT_LIMITS,
  HUFFMAN_RANDOM_SCENARIOS,
  buildHuffmanInput,
  huffmanDraftFromInput,
  randomHuffmanDraft,
  type HuffmanInputFields,
} from './huffmanInput';

function fields(symbols: string): HuffmanInputFields {
  return { symbols };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function buildOk(value: HuffmanInputFields): Array<[string, number]> {
  const result = buildHuffmanInput(value);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.key);
  return (result.input as { symbols: Array<[string, number]> }).symbols;
}

describe('INPUT-05 Huffman symbol input', () => {
  it('accepts a compact symbol/weight list and preserves input order', () => {
    expect(buildOk(fields('A: 5\nB: 9\nC: 12\nD: 13'))).toEqual([
      ['A', 5],
      ['B', 9],
      ['C', 12],
      ['D', 13],
    ]);
    expect(buildOk(fields('甲：7\n乙: 7'))).toEqual([
      ['甲', 7],
      ['乙', 7],
    ]);
    expect(buildOk(fields('Z: 21'))).toEqual([['Z', 21]]);
  });

  it('rejects empty, duplicated, multi-character and malformed symbols', () => {
    expect(buildHuffmanInput(fields(''))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorSymbols' },
    });
    expect(buildHuffmanInput(fields('A: 5\nA: 9'))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorDuplicate' },
    });
    expect(buildHuffmanInput(fields('AA: 5'))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorCharacter' },
    });
    expect(buildHuffmanInput(fields('A: 5\nB'))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorFormat' },
    });
    expect(buildHuffmanInput(fields('A: 5, B: 9'))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorFormat' },
    });
  });

  it('rejects non-positive, non-integer and out-of-range weights', () => {
    for (const weight of ['0', '-3', '1.5', '1000', 'x']) {
      expect(buildHuffmanInput(fields(`A: ${weight}`))).toEqual({
        ok: false,
        error: { key: 'huffmanErrorWeight' },
      });
    }
    expect(buildOk(fields('A: 1\nB: 999'))).toEqual([
      ['A', 1],
      ['B', 999],
    ]);
  });

  it('caps the symbol count at the readable limit', () => {
    const tooMany = Array.from({ length: HUFFMAN_INPUT_LIMITS.MAX_SYMBOLS + 1 }, (_, index) => {
      const symbol = String.fromCharCode(65 + index);
      return `${symbol}: ${index + 1}`;
    }).join('\n');
    expect(buildHuffmanInput(fields(tooMany))).toEqual({
      ok: false,
      error: { key: 'huffmanErrorSize', max: HUFFMAN_INPUT_LIMITS.MAX_SYMBOLS },
    });
  });

  it('keeps random wide / close / equal / single weights legal and explainable', () => {
    const scenarios = HUFFMAN_RANDOM_SCENARIOS.map((scenario) => scenario.id);
    expect(scenarios).toEqual(['wide', 'close', 'equal', 'single']);

    for (const scenario of scenarios) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const generated = randomHuffmanDraft(scenario, seeded(seed));
        const symbols = buildOk(generated);
        expect(symbols.length).toBeGreaterThanOrEqual(1);
        expect(symbols.length).toBeLessThanOrEqual(HUFFMAN_INPUT_LIMITS.MAX_SYMBOLS);
        expect(new Set(symbols.map(([symbol]) => symbol)).size).toBe(symbols.length);
        const weights = symbols.map(([, weight]) => weight);
        expect(Math.min(...weights)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...weights)).toBeLessThanOrEqual(999);
        if (scenario === 'wide') {
          expect(Math.max(...weights) / Math.min(...weights)).toBeGreaterThanOrEqual(10);
        }
        if (scenario === 'close') expect(Math.max(...weights) - Math.min(...weights)).toBeLessThanOrEqual(4);
        if (scenario === 'equal') expect(new Set(weights).size).toBe(1);
        if (scenario === 'single') expect(symbols).toHaveLength(1);
      }
    }
  });

  it('round-trips official tuple and object symbol shapes', () => {
    expect(huffmanDraftFromInput({ preset: 'official', symbols: [['A', 5], ['B', 9]] })).toEqual({
      symbols: 'A: 5\nB: 9',
    });
    expect(huffmanDraftFromInput({ symbols: [{ symbol: '甲', weight: 8 }, ['乙', 3]] })).toEqual({
      symbols: '甲: 8\n乙: 3',
    });
  });
});

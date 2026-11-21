/**
 * INPUT-05: compact symbol/weight input for the existing Huffman Python
 * program. Python still owns the real heapq merges, codes and WPL; this module
 * only rejects ambiguous symbols and non-positive weights before execution.
 */
export const HUFFMAN_GUIDED_INPUT = 'huffman' as const;

export const HUFFMAN_INPUT_LIMITS = {
  MAX_SYMBOLS: 10,
  MIN_WEIGHT: 1,
  MAX_WEIGHT: 999,
  VALUE_ABS_MAX: 1_000_000,
} as const;

export interface HuffmanInputFields {
  symbols: string;
}

export interface HuffmanInputError {
  key: string;
  max?: number;
}

export type HuffmanBuildResult =
  | { ok: true; input: unknown }
  | { ok: false; error: HuffmanInputError };

export interface HuffmanRandomScenario {
  id: string;
  label: [zh: string, en: string];
}

export const HUFFMAN_RANDOM_SCENARIOS: readonly HuffmanRandomScenario[] = [
  { id: 'wide', label: ['权值差异较大', 'Wide weight range'] },
  { id: 'close', label: ['权值接近', 'Close weights'] },
  { id: 'equal', label: ['权值相等', 'Equal weights'] },
  { id: 'single', label: ['单一字符', 'Single symbol'] },
];

export function huffmanDraftFromInput(input: unknown): HuffmanInputFields {
  if (!isRecord(input) || !Array.isArray(input.symbols)) return { symbols: '' };
  return {
    symbols: input.symbols
      .flatMap((entry) => {
        if (Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'number') {
          return [`${entry[0]}: ${entry[1]}`];
        }
        if (isRecord(entry) && typeof entry.symbol === 'string' && typeof entry.weight === 'number') {
          return [`${entry.symbol}: ${entry.weight}`];
        }
        return [];
      })
      .join('\n'),
  };
}

export function buildHuffmanInput(fields: HuffmanInputFields): HuffmanBuildResult {
  const parsed = parseSymbols(fields.symbols);
  if (!parsed.ok) return parsed;
  return { ok: true, input: { preset: null, symbols: parsed.symbols } };
}

export function randomHuffmanDraft(
  scenario: string,
  random: () => number = Math.random,
): HuffmanInputFields {
  const offset = randInt(random, 0, 5);
  if (scenario === 'single') {
    return { symbols: `Z: ${7 + offset}` };
  }
  if (scenario === 'equal') {
    const count = randInt(random, 4, 6);
    const symbol = (index: number) => String.fromCharCode(65 + index);
    return {
      symbols: Array.from({ length: count }, (_, index) => `${symbol(index)}: ${4 + offset}`).join('\n'),
    };
  }
  if (scenario === 'close') {
    return {
      symbols: ['A', 'B', 'C', 'D', 'E']
        .map((symbol, index) => `${symbol}: ${10 + index + offset}`)
        .join('\n'),
    };
  }
  return {
    symbols: [
      ['A', 2 + offset],
      ['B', 4 + offset],
      ['C', 8 + offset],
      ['D', 16 + offset],
      ['E', 32 + offset],
      ['F', 64 + offset],
    ]
      .map(([symbol, weight]) => `${symbol}: ${weight}`)
      .join('\n'),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function parseSymbols(
  raw: string,
): { ok: true; symbols: Array<[string, number]> } | { ok: false; error: HuffmanInputError } {
  const lines = raw
    .split(/[\n\r;；]+/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { ok: false, error: { key: 'huffmanErrorSymbols' } };
  if (lines.length > HUFFMAN_INPUT_LIMITS.MAX_SYMBOLS) {
    return { ok: false, error: { key: 'huffmanErrorSize', max: HUFFMAN_INPUT_LIMITS.MAX_SYMBOLS } };
  }

  const symbols: Array<[string, number]> = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const parts = line.split(/[:：,，\s]+/u).filter(Boolean);
    if (parts.length !== 2) return { ok: false, error: { key: 'huffmanErrorFormat' } };
    const symbol = parts[0]!.trim();
    if (Array.from(symbol).length !== 1) {
      return { ok: false, error: { key: 'huffmanErrorCharacter' } };
    }
    if (seen.has(symbol)) return { ok: false, error: { key: 'huffmanErrorDuplicate' } };
    const weight = parseWeight(parts[1]!);
    if (weight === null) return { ok: false, error: { key: 'huffmanErrorWeight' } };
    seen.add(symbol);
    symbols.push([symbol, weight]);
  }
  return { ok: true, symbols };
}

function parseWeight(raw: string): number | null {
  if (!/^[+-]?\d+$/u.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return null;
  if (value < HUFFMAN_INPUT_LIMITS.MIN_WEIGHT || value > HUFFMAN_INPUT_LIMITS.MAX_WEIGHT) return null;
  return value;
}

/**
 * INPUT-01: reusable input contracts for the first three guided algorithms.
 *
 * The UI deliberately does not own parsing rules. Every draft is converted here
 * into the exact object shape the existing Python/JavaScript program already
 * consumes, so a custom run goes through the same executor and trace pipeline as
 * an official preset. Random generators only emit inputs that satisfy the
 * algorithm's prerequisites.
 */
import type { CodeLanguage } from './types';

export const GUIDED_INPUT_ALGORITHMS = ['bubble', 'binary', 'kmp'] as const;
export type GuidedInputAlgorithm = (typeof GUIDED_INPUT_ALGORITHMS)[number];
export type GuidedInputMode = 'official' | 'custom' | 'random';

export const GUIDED_INPUT_LANGUAGE: Record<GuidedInputAlgorithm, CodeLanguage> = {
  // Bubble keeps its established JavaScript classroom trace (25 frames for the
  // official five values); binary and KMP already run real Python programs.
  bubble: 'js',
  binary: 'python',
  kmp: 'python',
};

export interface GuidedInputDraft {
  /** Bubble sort values, comma/space separated. */
  values: string;
  /** Binary search array, comma/space separated. */
  nums: string;
  /** Binary search target. */
  target: string;
  /** KMP text. */
  text: string;
  /** KMP pattern. */
  pattern: string;
}

export interface GuidedInputError {
  key: string;
  max?: number;
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
};

const RANDOM_SCENARIOS: Record<GuidedInputAlgorithm, readonly GuidedRandomScenario[]> = {
  bubble: [
    { id: 'shuffled', label: ['普通乱序', 'Shuffled'] },
    { id: 'nearly-sorted', label: ['基本有序', 'Nearly sorted'] },
    { id: 'reversed', label: ['逆序', 'Reversed'] },
    { id: 'duplicates', label: ['重复值较多', 'Many duplicates'] },
  ],
  binary: [
    { id: 'found', label: ['一定能找到', 'Always found'] },
    { id: 'not-found', label: ['一定找不到', 'Never found'] },
  ],
  kmp: [
    { id: 'success', label: ['成功匹配', 'Successful match'] },
    { id: 'failure', label: ['匹配失败', 'No match'] },
    { id: 'prefix', label: ['重复前后缀', 'Repeated prefix/suffix'] },
    { id: 'fallback', label: ['失配回退', 'Fallback on mismatch'] },
    { id: 'overlap', label: ['多个 / 重叠匹配', 'Multiple / overlapping'] },
  ],
};

export function isGuidedInputAlgorithm(id: string): id is GuidedInputAlgorithm {
  return (GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function guidedLanguageFor(id: string): CodeLanguage | null {
  return isGuidedInputAlgorithm(id) ? GUIDED_INPUT_LANGUAGE[id] : null;
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

export function guidedDraftFromInput(id: GuidedInputAlgorithm, input: unknown): GuidedInputDraft {
  if (id === 'bubble') {
    const values = Array.isArray(input)
      ? input
      : isRecord(input) && Array.isArray(input.values)
        ? input.values
        : [];
    return { ...EMPTY_DRAFT, values: formatNumbers(values) };
  }
  if (id === 'binary') {
    const record = isRecord(input) ? input : {};
    return {
      ...EMPTY_DRAFT,
      nums: Array.isArray(record.nums) ? formatNumbers(record.nums) : '',
      target: describeNumber(record.target),
    };
  }
  const record = isRecord(input) ? input : {};
  return {
    ...EMPTY_DRAFT,
    text: typeof record.text === 'string' ? record.text : '',
    pattern: typeof record.pattern === 'string' ? record.pattern : '',
  };
}

export function buildGuidedInput(id: GuidedInputAlgorithm, draft: GuidedInputDraft): GuidedBuildResult {
  if (id === 'bubble') {
    const parsed = parseIntegerList(draft.values);
    if (!parsed.ok) return { ok: false, error: { key: 'guidedErrorIntegerList' } };
    if (
      parsed.values.length < GUIDED_INPUT_LIMITS.BUBBLE_MIN ||
      parsed.values.length > GUIDED_INPUT_LIMITS.BUBBLE_MAX
    ) {
      return { ok: false, error: { key: 'guidedErrorBubbleLength', max: GUIDED_INPUT_LIMITS.BUBBLE_MAX } };
    }
    return { ok: true, input: parsed.values };
  }

  if (id === 'binary') {
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
    const parsed = parseIntegerList(numsRaw);
    if (!parsed.ok) return { ok: false, error: { key: 'guidedErrorIntegerList' } };
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

function randomBubbleValues(scenario: string, random: () => number): number[] {
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
  if (id === 'bubble') {
    return { ...EMPTY_DRAFT, values: randomBubbleValues(scenario, random).join(', ') };
  }
  if (id === 'binary') {
    const generated = randomBinaryValues(scenario, random);
    return { ...EMPTY_DRAFT, nums: generated.nums.join(', '), target: String(generated.target) };
  }
  const generated = randomKmpValues(scenario, random);
  return { ...EMPTY_DRAFT, text: generated.text, pattern: generated.pattern };
}

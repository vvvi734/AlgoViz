/**
 * RECUR-01: shared input contract for the two recursive teaching programs.
 *
 * Recursion is deliberately not the array/list editor with one number pasted in.
 * The visible argument is one non-negative integer, and the upper bound is
 * chosen per algorithm because the honest call count grows very differently:
 *
 * - factorial(n) makes n calls and is safe at 10 layers;
 * - naive fib(n) makes 2*fib(n+1)-1 calls, so 8 already has 67 calls / ~300
 *   real trace frames. Neither limit truncates the recursion inside Python.
 *
 * The Python programs repeat the same limits and raise a real ValueError when
 * bypassed, so no run can silently show a partial recursion.
 */
export const RECURSION_GUIDED_INPUT_ALGORITHMS = ['factorial', 'fib'] as const;
export type RecursionGuidedInputAlgorithm = (typeof RECURSION_GUIDED_INPUT_ALGORITHMS)[number];

export const RECURSION_INPUT_LIMITS = {
  FACTORIAL_MAX: 10,
  FIB_MAX: 8,
} as const;

export const RECURSION_RANDOM_SCENARIOS: Record<
  RecursionGuidedInputAlgorithm,
  readonly { id: string; label: [zh: string, en: string] }[]
> = {
  factorial: [
    { id: 'small', label: ['浅层递归', 'Shallow recursion'] },
    { id: 'deep', label: ['较深层递归', 'Deeper recursion'] },
  ],
  fib: [
    { id: 'small', label: ['小树', 'Small tree'] },
    { id: 'repeated', label: ['重复子问题明显', 'Visible repeated subproblems'] },
  ],
};

export type RecursionBuildResult =
  | { ok: true; input: number }
  | { ok: false; error: { key: string; max?: number } };

export function isRecursionGuidedInputAlgorithm(id: string): id is RecursionGuidedInputAlgorithm {
  return (RECURSION_GUIDED_INPUT_ALGORITHMS as readonly string[]).includes(id);
}

export function recursionInputMax(id: RecursionGuidedInputAlgorithm): number {
  return id === 'factorial'
    ? RECURSION_INPUT_LIMITS.FACTORIAL_MAX
    : RECURSION_INPUT_LIMITS.FIB_MAX;
}

/** Parse the single visible `n`; negative, decimal and out-of-range values fail. */
export function buildRecursionInput(
  id: RecursionGuidedInputAlgorithm,
  raw: string,
): RecursionBuildResult {
  const token = raw.trim();
  if (!/^\d+$/u.test(token)) {
    return { ok: false, error: { key: 'guidedErrorRecursionInteger' } };
  }
  const value = Number(token);
  const max = recursionInputMax(id);
  if (!Number.isSafeInteger(value) || value > max) {
    return { ok: false, error: { key: 'guidedErrorRecursionRange', max } };
  }
  return { ok: true, input: value };
}

/** A scalar input can be stored as a number, and old JSON `{n: 4}` also works. */
export function recursionDraftFromInput(input: unknown): string {
  if (typeof input === 'number' && Number.isFinite(input) && Number.isInteger(input)) {
    return String(input);
  }
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const n = (input as { n?: unknown }).n;
    if (typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n)) return String(n);
  }
  return '';
}

export function randomRecursionN(
  id: RecursionGuidedInputAlgorithm,
  scenario: string,
  random: () => number = Math.random,
): number {
  const pick = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1));
  if (id === 'factorial') {
    return scenario === 'deep' ? pick(7, 10) : pick(3, 5);
  }
  return scenario === 'repeated' ? pick(6, 8) : pick(3, 5);
}

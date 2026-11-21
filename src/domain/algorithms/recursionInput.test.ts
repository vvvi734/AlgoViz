import { describe, expect, it } from 'vitest';
import {
  RECURSION_GUIDED_INPUT_ALGORITHMS,
  RECURSION_INPUT_LIMITS,
  buildRecursionInput,
  isRecursionGuidedInputAlgorithm,
  randomRecursionN,
  recursionDraftFromInput,
  recursionInputMax,
} from './recursionInput';
import {
  buildGuidedInput,
  defaultGuidedScenario,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  randomGuidedDraft,
} from './guidedInput';
import { defaultInputFor, exampleFor } from './examples';

describe('RECUR-01 recursion input', () => {
  it('uses a per-algorithm honest upper bound', () => {
    expect(recursionInputMax('factorial')).toBe(10);
    expect(recursionInputMax('fib')).toBe(8);
    expect(RECURSION_INPUT_LIMITS.FACTORIAL_MAX).toBe(10);
    expect(RECURSION_INPUT_LIMITS.FIB_MAX).toBe(8);
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      expect(isRecursionGuidedInputAlgorithm(id)).toBe(true);
      expect(isRecursionGuidedInputAlgorithm(`${id}-extra`)).toBe(false);
    }
  });

  it('accepts 0, 1 and the exact maximum for both functions', () => {
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      const max = recursionInputMax(id);
      for (const n of [0, 1, 4, max]) {
        expect(buildRecursionInput(id, String(n)), `${id}/${n}`).toEqual({ ok: true, input: n });
      }
    }
  });

  it('rejects negative, decimal, empty, signed and over-limit values', () => {
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      const max = recursionInputMax(id);
      for (const raw of ['', '-1', '1.5', 'abc', '+4', ' 4x ']) {
        const result = buildRecursionInput(id, raw);
        expect(result.ok, `${id}/${JSON.stringify(raw)}`).toBe(false);
        if (!result.ok) expect(result.error.key).toBe('guidedErrorRecursionInteger');
      }
      const over = buildRecursionInput(id, String(max + 1));
      expect(over.ok).toBe(false);
      if (!over.ok) {
        expect(over.error.key).toBe('guidedErrorRecursionRange');
        expect(over.error.max).toBe(max);
      }
    }
  });

  it('reads a scalar or a legacy {n} object without inventing a value', () => {
    expect(recursionDraftFromInput(4)).toBe('4');
    expect(recursionDraftFromInput({ n: 3 })).toBe('3');
    expect(recursionDraftFromInput({ n: '3' })).toBe('');
    expect(recursionDraftFromInput(null)).toBe('');
    expect(recursionDraftFromInput([3])).toBe('');
  });

  it('generates random candidates inside the bound and never executes by itself', () => {
    let state = 7;
    const random = () => {
      state = (state * 1103515245 + 12345) % 0x8000_0000;
      return state / 0x8000_0000;
    };
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      for (const scenario of guidedRandomScenarios(id)) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const n = randomRecursionN(id, scenario.id, random);
          expect(Number.isInteger(n)).toBe(true);
          expect(n, `${id}/${scenario.id}`).toBeGreaterThanOrEqual(0);
          expect(n, `${id}/${scenario.id}`).toBeLessThanOrEqual(recursionInputMax(id));
          const draft = randomGuidedDraft(id, scenario.id, random);
          expect(draft.n).toBeTruthy();
        }
      }
    }
  });

  it('connects both recursion courses to the official and generated Python path', () => {
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      expect(defaultInputFor(id)).toBe(4);
      expect(exampleFor(id, 'python')).toContain('def ');
      expect(exampleFor(id, 'python')).toContain('@tracked');
      expect(guidedExecutionLanguage(id, 'official')).toBe('python');
      expect(guidedExecutionLanguage(id, 'custom')).toBe('python');
      expect(guidedExecutionLanguage(id, 'random')).toBe('python');
      expect(guidedRandomScenarios(id).length).toBeGreaterThan(0);
      expect(defaultGuidedScenario(id)).toBe(guidedRandomScenarios(id)[0]!.id);

      const official = buildGuidedInput(id, guidedDraftFromInput(id, defaultInputFor(id)));
      expect(official.ok).toBe(true);
      if (official.ok) expect(official.input).toBe(4);
    }
  });

  it('does not let the Python sources silently truncate recursion', () => {
    for (const id of RECURSION_GUIDED_INPUT_ALGORITHMS) {
      const source = exampleFor(id, 'python');
      expect(source, id).toContain(`MAX_N = ${recursionInputMax(id)}`);
      expect(source, id).toContain('raise ValueError');
      expect(source, id).toContain('@tracked(call_step=\'call\', return_step=\'return\')');
    }
    expect(exampleFor('fib', 'python')).toContain('left = fib(n - 1)');
    expect(exampleFor('fib', 'python')).toContain('right = fib(n - 2)');
    expect(exampleFor('fib', 'python')).not.toContain('lru_cache');
    expect(exampleFor('fib', 'python')).not.toContain('memoization');
    expect(exampleFor('factorial', 'python')).toContain('partial = factorial(n - 1)');
  });
});

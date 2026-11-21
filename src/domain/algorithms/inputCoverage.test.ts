import { describe, expect, it } from 'vitest';
import { algorithmIds, defaultInputFor } from './examples';
import {
  GUIDED_INPUT_ALGORITHMS,
  buildGuidedInput,
  guidedDraftFromInput,
  guidedExecutionLanguage,
  guidedRandomScenarios,
  isGuidedInputAlgorithm,
  randomGuidedDraft,
} from './guidedInput';

/**
 * RECUR-01 coverage lock.
 *
 * The registry is the source of truth; theory pages are not dynamic algorithms
 * and are deliberately absent. All 39 dynamic algorithms now have official,
 * custom and random guided inputs; no algorithm is frozen.
 */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('RECUR-01 dynamic algorithm input coverage', () => {
  it('registers every dynamic algorithm exactly once as guided input', () => {
    const ids = algorithmIds();
    const guided = new Set<string>(GUIDED_INPUT_ALGORITHMS);
    expect(ids).toHaveLength(54);
    expect(guided.size).toBe(GUIDED_INPUT_ALGORITHMS.length);
    expect(guided.size).toBe(54);
    for (const id of ids) expect(guided.has(id), id).toBe(true);
  });

  it('provides official, custom and random support for all 54 ids', () => {
    for (const id of GUIDED_INPUT_ALGORITHMS) {
      expect(algorithmIds()).toContain(id);
      expect(isGuidedInputAlgorithm(id)).toBe(true);
      const official = defaultInputFor(id);
      expect(official, `${id} official`).not.toBeNull();
      const builtOfficial = buildGuidedInput(id, guidedDraftFromInput(id, official));
      expect(builtOfficial.ok, `${id} official build`).toBe(true);
      expect(guidedExecutionLanguage(id, 'official'), `${id} official language`).not.toBeNull();
      expect(guidedExecutionLanguage(id, 'custom'), `${id} custom language`).not.toBeNull();
      expect(guidedExecutionLanguage(id, 'random'), `${id} random language`).not.toBeNull();

      const scenarios = guidedRandomScenarios(id);
      expect(scenarios.length, `${id} scenarios`).toBeGreaterThan(0);
      expect(new Set(scenarios.map((scenario) => scenario.id)).size, `${id} unique scenarios`)
        .toBe(scenarios.length);
      for (const scenario of scenarios) {
        for (let seed = 1; seed <= 3; seed += 1) {
          const draft = randomGuidedDraft(id, scenario.id, seeded(seed));
          const built = buildGuidedInput(id, draft);
          expect(built.ok, `${id}/${scenario.id}/${seed}`).toBe(true);
        }
      }
    }
  });

  it('keeps both recursive courses in the registry with their official Python input', () => {
    for (const id of ['factorial', 'fib'] as const) {
      expect(algorithmIds()).toContain(id);
      expect(isGuidedInputAlgorithm(id)).toBe(true);
      expect(defaultInputFor(id)).toBe(4);
      expect(guidedExecutionLanguage(id, 'official')).toBe('python');
      expect(guidedExecutionLanguage(id, 'custom')).toBe('python');
    }
  });
});

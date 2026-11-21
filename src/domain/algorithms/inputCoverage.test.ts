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
 * INPUT-07 coverage lock.
 *
 * The registry is the source of truth; theory pages are not dynamic algorithms
 * and are deliberately absent. Factorial and Fibonacci keep their frozen
 * recursion visualisations and are excluded from guided-input support.
 */
export const INPUT07_FROZEN_ALGORITHMS = ['factorial', 'fib'] as const;

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('INPUT-07 dynamic algorithm input coverage', () => {
  it('classifies every registered dynamic algorithm exactly once', () => {
    const ids = algorithmIds();
    const guided = new Set<string>(GUIDED_INPUT_ALGORITHMS);
    const frozen = new Set<string>(INPUT07_FROZEN_ALGORITHMS);
    expect(ids).toHaveLength(37);
    expect(guided.size).toBe(GUIDED_INPUT_ALGORITHMS.length);
    expect(frozen.size).toBe(2);
    expect([...guided].filter((id) => frozen.has(id))).toEqual([]);
    for (const id of ids) {
      expect(guided.has(id) || frozen.has(id), id).toBe(true);
    }
    expect(guided.size + frozen.size).toBe(ids.length);
    expect(guided.size).toBe(35);
  });

  it('provides official, custom and random guided support for all 35 supported ids', () => {
    for (const id of GUIDED_INPUT_ALGORITHMS) {
      expect(algorithmIds()).toContain(id);
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

  it('keeps frozen recursion lessons outside guided input', () => {
    for (const id of INPUT07_FROZEN_ALGORITHMS) {
      expect(algorithmIds()).toContain(id);
      expect(isGuidedInputAlgorithm(id)).toBe(false);
      expect(defaultInputFor(id)).not.toBeNull();
    }
  });
});

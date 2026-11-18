import { describe, expect, it } from 'vitest';
import { ALGORITHM_CATALOG } from '../algorithms/catalog.generated';
import { lessonRegistry } from '../lessons/registry';
import { buildAlgorithmGuide } from './buildGuide';

const CURATED = [
  ['dijkstra', 'dijkstra'],
  ['topological', 'kahn'],
  ['scc', 'kosaraju'],
] as const;

describe('UX-01B algorithm guide content', () => {
  it.each(CURATED)('%s has complete bilingual curated content', (algorithmId, diagram) => {
    const lesson = lessonRegistry.byAlgorithm(algorithmId);
    const guide = buildAlgorithmGuide(algorithmId, lesson, ALGORITHM_CATALOG[algorithmId]);

    expect(lesson).toBeDefined();
    expect(guide.source).toBe('curated');
    expect(guide.diagram).toBe(diagram);
    expect(guide.problem?.zh.length).toBeGreaterThan(20);
    expect(guide.problem?.en.length).toBeGreaterThan(20);
    expect(guide.coreHeadline?.zh.length).toBeGreaterThan(4);
    expect(guide.coreHeadline?.en.length).toBeGreaterThan(4);
    expect(guide.coreIdea?.zh.length).toBeGreaterThan(40);
    expect(guide.coreIdea?.en.length).toBeGreaterThan(40);
    expect(guide.stages.length).toBeGreaterThanOrEqual(3);
    expect(guide.stages.length).toBeLessThanOrEqual(5);
    expect(guide.steps.length).toBeGreaterThanOrEqual(7);
    expect(guide.conditions.zh.length).toBeGreaterThanOrEqual(4);
    expect(guide.conditions.en.length).toBeGreaterThanOrEqual(4);
    expect(guide.memoryHook?.zh.length).toBeGreaterThan(8);
    expect(guide.memoryHook?.en.length).toBeGreaterThan(8);
    expect(guide.complexity).toEqual(lesson?.complexity);

    for (const stage of guide.stages) {
      expect(stage.title.zh.trim().length).toBeGreaterThan(0);
      expect(stage.title.en.trim().length).toBeGreaterThan(0);
      expect(stage.summary.zh.length).toBeGreaterThan(5);
      expect(stage.summary.en.length).toBeGreaterThan(5);
    }
    for (const step of guide.steps) {
      expect(step.title.zh.trim().length).toBeGreaterThan(0);
      expect(step.title.en.trim().length).toBeGreaterThan(0);
      expect(step.body.zh.length).toBeGreaterThan(10);
      expect(step.body.en.length).toBeGreaterThan(10);
    }
    for (const list of [guide.prerequisites, guide.conditions, guide.pitfalls]) {
      expect(list.zh.length).toBe(list.en.length);
    }
  });

  it('uses the registered lesson for algorithms without curated copy', () => {
    const lesson = lessonRegistry.byAlgorithm('bubble');
    expect(lesson).toBeDefined();
    const guide = buildAlgorithmGuide('bubble', lesson, ALGORITHM_CATALOG.bubble);

    expect(guide.source).toBe('lesson');
    expect(guide.coreHeadline).toBeNull();
    expect(guide.problem).toEqual(lesson?.oneLiner);
    expect(guide.coreIdea).toEqual(lesson?.intuition);
    expect(guide.stages).toHaveLength(5);
    expect(guide.stages[0].title.zh).not.toMatch(/^[\u2460-\u2473]/);
    expect(guide.steps).toHaveLength(lesson?.steps.length ?? 0);
    expect(guide.steps[0].title.zh).not.toMatch(/^[\u2460-\u2473]/);
    expect(guide.complexity).toEqual(lesson?.complexity);
    expect(guide.pitfalls).toEqual(lesson?.commonMistakes);
    expect(guide.conditions.zh).toEqual([]);
    expect(guide.conditions.en).toEqual([]);
  });

  it('keeps long course steps in detail instead of inventing a stage grouping', () => {
    const lesson = lessonRegistry.byAlgorithm('linked');
    expect(lesson).toBeDefined();
    const guide = buildAlgorithmGuide('linked', lesson, ALGORITHM_CATALOG.linked);

    expect(guide.steps).toHaveLength(lesson?.steps.length ?? 0);
    expect(guide.stages).toEqual([]);
    expect(guide.coreHeadline).toBeNull();
  });

  it('shows only catalog-confirmed text for an algorithm without a lesson', () => {
    const entry = ALGORITHM_CATALOG.insertion;
    const guide = buildAlgorithmGuide('insertion', undefined, entry);

    expect(guide.source).toBe('catalog');
    expect(guide.problem).toEqual({ zh: entry.desc[0], en: entry.desc[1] });
    expect(guide.coreHeadline).toBeNull();
    expect(guide.coreIdea).toBeNull();
    expect(guide.stages).toEqual([]);
    expect(guide.steps).toEqual([]);
    expect(guide.memoryHook).toBeNull();
    expect(guide.complexity?.time).toBe(entry.time);
    expect(guide.complexity?.space).toBe(entry.space);
    expect(guide.complexity?.note.zh).toContain('不做推测');
  });

  it('does not invent content for an unknown algorithm with no metadata', () => {
    const guide = buildAlgorithmGuide('missing-algorithm', undefined, undefined);
    expect(guide.source).toBe('none');
    expect(guide.problem).toBeNull();
    expect(guide.coreHeadline).toBeNull();
    expect(guide.stages).toEqual([]);
    expect(guide.steps).toEqual([]);
    expect(guide.complexity).toBeNull();
  });
});

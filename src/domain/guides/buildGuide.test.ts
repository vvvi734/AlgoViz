import { describe, expect, it } from 'vitest';
import { ALGORITHM_CATALOG } from '../algorithms/catalog.generated';
import { localizeComplexity } from '../lessons/localizeMessage';
import { lessonRegistry } from '../lessons/registry';
import { buildAlgorithmGuide } from './buildGuide';

const DIAGRAMMED = [
  ['dijkstra', 'dijkstra'],
  ['topological', 'kahn'],
  ['scc', 'kosaraju'],
] as const;

describe('algorithm review guide', () => {
  it.each(DIAGRAMMED)('%s carries the authored intro, definition, flow and diagram', (algorithmId, diagram) => {
    const lesson = lessonRegistry.byAlgorithm(algorithmId);
    const guide = buildAlgorithmGuide(algorithmId, lesson, ALGORITHM_CATALOG[algorithmId]);

    expect(lesson).toBeDefined();
    expect(guide.source).toBe('curated');
    expect(guide.diagram).toBe(diagram);
    expect(guide.intro?.zh.length).toBeGreaterThan(60);
    expect(guide.intro?.en.length).toBeGreaterThan(60);
    expect(guide.definition?.zh.length).toBeGreaterThan(20);
    expect(guide.definition?.en.length).toBeGreaterThan(20);
    expect(guide.plain?.zh.length).toBeGreaterThan(20);
    expect(guide.plain?.en.length).toBeGreaterThan(20);
    expect(guide.stages.length).toBeGreaterThanOrEqual(3);
    expect(guide.conditions.zh.length).toBeGreaterThanOrEqual(2);
    expect(guide.conditions.en.length).toBe(guide.conditions.zh.length);
    expect(guide.complexity).toEqual(lesson?.complexity);
    expect(guide.pitfalls.zh.length).toBeGreaterThan(0);
    expect(guide.pitfalls.zh.length).toBeLessThanOrEqual(3);
    expect(guide.pitfalls.en.length).toBe(guide.pitfalls.zh.length);
  });

  it('uses an authored abstract flow for every formal course, never the raw Trace captions', () => {
    for (const lesson of lessonRegistry.lessons) {
      const guide = buildAlgorithmGuide(
        lesson.algorithmId,
        lesson,
        ALGORITHM_CATALOG[lesson.algorithmId],
      );
      expect(guide.source).toBe('curated');
      expect(guide.intro?.zh.trim().length).toBeGreaterThan(20);
      expect(guide.intro?.en.trim().length).toBeGreaterThan(20);
      expect(guide.definition?.zh.trim().length).toBeGreaterThan(10);
      expect(guide.definition?.en.trim().length).toBeGreaterThan(10);
      expect(guide.plain?.zh.trim().length).toBeGreaterThan(10);
      expect(guide.plain?.en.trim().length).toBeGreaterThan(10);
      expect(guide.stages.length).toBeGreaterThanOrEqual(3);
      expect(guide.conditions.zh.length).toBeGreaterThan(0);
      expect(guide.conditions.en.length).toBe(guide.conditions.zh.length);
      expect(guide.complexity?.time).toBeTruthy();
      expect(guide.complexity?.space).toBeTruthy();
      expect(localizeComplexity(guide.complexity?.time ?? '', 'en')).not.toMatch(/[\u3400-\u9fff]/);
      expect(localizeComplexity(guide.complexity?.space ?? '', 'en')).not.toMatch(/[\u3400-\u9fff]/);
      expect(guide.pitfalls.zh.length).toBeLessThanOrEqual(3);
      expect(guide.pitfalls.en.length).toBe(guide.pitfalls.zh.length);
      // Correctness conditions replace the old Python-prerequisite list.
      expect(guide.conditions.zh.join(' ')).not.toMatch(/Python|heapq|deque|会读/);
      for (const stage of guide.stages) {
        expect(stage.title.zh.trim().length).toBeGreaterThan(0);
        expect(stage.title.en.trim().length).toBeGreaterThan(0);
        expect(stage.title.zh).not.toMatch(/^[\u2460-\u2473]/);
        if (stage.summary) {
          expect(stage.summary.zh.trim().length).toBeGreaterThan(0);
          expect(stage.summary.en.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('attaches the structured flow to every formal course', () => {
    for (const lesson of lessonRegistry.lessons) {
      const guide = buildAlgorithmGuide(
        lesson.algorithmId,
        lesson,
        ALGORITHM_CATALOG[lesson.algorithmId],
      );
      expect(guide.flow?.algorithmId, lesson.algorithmId).toBe(lesson.algorithmId);
      expect(guide.flow?.sections.length, lesson.algorithmId).toBeGreaterThan(0);
    }
  });

  it('uses core operations for data-structure courses and an algorithmic flow otherwise', () => {
    const linked = buildAlgorithmGuide('linked', lessonRegistry.byAlgorithm('linked'));
    expect(linked.flowKind).toBe('operations');
    expect(linked.stages.map((stage) => stage.title.zh)).toContain('插入节点');

    const stack = buildAlgorithmGuide('stack', lessonRegistry.byAlgorithm('stack'));
    expect(stack.flowKind).toBe('operations');

    const inorder = buildAlgorithmGuide('inorder', lessonRegistry.byAlgorithm('inorder'));
    expect(inorder.flowKind).toBe('algorithm');

    // A long Trace no longer becomes a long guide: the linked course has
    // 8 frames but only 5 abstract operations.
    expect(linked.stages.length).toBeLessThan(lessonRegistry.byAlgorithm('linked')?.steps.length ?? 0);
  });

  it('shows only catalog-confirmed text for an algorithm without a lesson', () => {
    const entry = ALGORITHM_CATALOG.insertion;
    const guide = buildAlgorithmGuide('insertion', undefined, entry);

    expect(guide.source).toBe('catalog');
    expect(guide.definition).toEqual({ zh: entry.desc[0], en: entry.desc[1] });
    expect(guide.intro).toEqual({ zh: entry.desc[0], en: entry.desc[1] });
    expect(guide.plain).toBeNull();
    expect(guide.stages).toEqual([]);
    expect(guide.memoryHook).toBeNull();
    expect(guide.complexity?.time).toBe(entry.time);
    expect(guide.complexity?.space).toBe(entry.space);
    expect(guide.complexity?.note.zh).toContain('不推测流程');
  });

  it('does not invent content for an unknown algorithm with no metadata', () => {
    const guide = buildAlgorithmGuide('missing-algorithm', undefined, undefined);
    expect(guide.source).toBe('none');
    expect(guide.intro).toBeNull();
    expect(guide.definition).toBeNull();
    expect(guide.plain).toBeNull();
    expect(guide.stages).toEqual([]);
    expect(guide.complexity).toBeNull();
  });
});

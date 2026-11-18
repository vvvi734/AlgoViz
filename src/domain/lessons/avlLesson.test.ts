import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/avl-default-frames.json';
import rawEdge from '../../test/fixtures/avl-edge-frames.json';
import { avlLesson } from './avlLesson';
import { lessonRegistry } from './registry';

type RawFrame = { lessonStepId?: string };
const defaults = rawDefault as unknown as Record<string, RawFrame[]>;
const edges = rawEdge as unknown as Record<string, RawFrame[]>;
const allRuns = { ...defaults, ...edges };

describe('T2 AVL course', () => {
  it('registers one AVL course with unique, complete bilingual steps', () => {
    expect(lessonRegistry.byAlgorithm('avl')).toBe(avlLesson);
    expect(avlLesson.steps).toHaveLength(17);
    expect(new Set(avlLesson.steps.map((step) => step.stepId)).size).toBe(17);
    for (const step of avlLesson.steps) {
      expect(step.title.zh.length).toBeGreaterThan(0);
      expect(step.title.en.length).toBeGreaterThan(0);
      expect(step.explanation.zh.length).toBeGreaterThan(20);
      expect(step.explanation.en.length).toBeGreaterThan(20);
    }
  });

  it('maps every real Python lesson_step id to a course step', () => {
    const courseIds = new Set(avlLesson.steps.map((step) => step.stepId));
    const emitted = new Set(
      Object.values(allRuns)
        .flat()
        .map((frame) => frame.lessonStepId)
        .filter((id): id is string => typeof id === 'string'),
    );
    expect([...emitted].sort()).toEqual([
      'compare', 'delete-leaf', 'delete-locate', 'delete-one', 'direction', 'done',
      'duplicate', 'height', 'imbalance', 'init', 'insert', 'not-found',
      'rotate-left', 'rotate-right', 'successor', 'successor-detach', 'transplant',
    ]);
    for (const id of emitted) expect(courseIds.has(id), `missing course step ${id}`).toBe(true);
  });

  it('gives every course step at least one real frame', () => {
    const frameCounts = new Map<string, number>();
    for (const frames of Object.values(allRuns)) {
      for (const frame of frames) {
        if (!frame.lessonStepId) continue;
        frameCounts.set(frame.lessonStepId, (frameCounts.get(frame.lessonStepId) ?? 0) + 1);
      }
    }
    for (const step of avlLesson.steps) {
      expect(frameCounts.get(step.stepId), `step ${step.stepId} has no real frame`).toBeGreaterThan(0);
    }
    expect(avlLesson.complexity.time).toContain('O(log n)');
    expect(avlLesson.complexity.space).toBe('O(n)');
    expect(avlLesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(8);
    expect(avlLesson.commonMistakes.en.length).toBe(avlLesson.commonMistakes.zh.length);
  });
});

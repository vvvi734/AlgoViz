import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/bst-default-frames.json';
import rawEdge from '../../test/fixtures/bst-edge-frames.json';
import { bstLesson } from './bstLesson';
import { lessonRegistry } from './registry';

type RawFrame = { lessonStepId?: string };
const defaults = rawDefault as unknown as Record<string, RawFrame[]>;
const edges = rawEdge as unknown as Record<string, RawFrame[]>;
const allRuns = { ...defaults, ...edges };

describe('T1 BST course', () => {
  it('registers one BST course with unique, complete bilingual steps', () => {
    expect(lessonRegistry.byAlgorithm('bst')).toBe(bstLesson);
    expect(bstLesson.steps).toHaveLength(14);
    expect(new Set(bstLesson.steps.map((step) => step.stepId)).size).toBe(14);
    for (const step of bstLesson.steps) {
      expect(step.title.zh.length).toBeGreaterThan(0);
      expect(step.title.en.length).toBeGreaterThan(0);
      expect(step.explanation.zh.length).toBeGreaterThan(20);
      expect(step.explanation.en.length).toBeGreaterThan(20);
    }
  });

  it('maps every real Python lesson_step id to a course step', () => {
    const courseIds = new Set(bstLesson.steps.map((step) => step.stepId));
    const emitted = new Set(
      Object.values(allRuns)
        .flat()
        .map((frame) => frame.lessonStepId)
        .filter((id): id is string => typeof id === 'string'),
    );
    expect([...emitted].sort()).toEqual([
      'compare', 'delete-leaf', 'delete-locate', 'delete-one', 'direction', 'done',
      'duplicate', 'found', 'init', 'insert', 'not-found', 'successor',
      'successor-detach', 'transplant',
    ]);
    for (const id of emitted) expect(courseIds.has(id), `missing course step ${id}`).toBe(true);
  });

  it('gives each operation its own steps and a real frame for every step', () => {
    const frameCounts = new Map<string, number>();
    for (const frames of Object.values(allRuns)) {
      for (const frame of frames) {
        if (!frame.lessonStepId) continue;
        frameCounts.set(frame.lessonStepId, (frameCounts.get(frame.lessonStepId) ?? 0) + 1);
      }
    }
    for (const step of bstLesson.steps) {
      expect(frameCounts.get(step.stepId), `step ${step.stepId} has no real frame`).toBeGreaterThan(0);
    }
    const findSteps = ['found', 'not-found'];
    const insertSteps = ['duplicate', 'insert'];
    const deleteSteps = ['delete-locate', 'delete-leaf', 'delete-one', 'successor', 'successor-detach', 'transplant'];
    expect(findSteps.every((id) => frameCounts.has(id))).toBe(true);
    expect(insertSteps.every((id) => frameCounts.has(id))).toBe(true);
    expect(deleteSteps.every((id) => frameCounts.has(id))).toBe(true);
    expect(bstLesson.complexity.time).toContain('O(log n)');
    expect(bstLesson.complexity.space).toBe('O(h)');
    expect(bstLesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(6);
    expect(bstLesson.commonMistakes.en.length).toBe(bstLesson.commonMistakes.zh.length);
  });
});

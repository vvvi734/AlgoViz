import { describe, expect, it } from 'vitest';
import defaultFrames from '../../test/fixtures/sorting-s2-default-frames.json';
import { buildAlgorithmGuide } from '../guides/buildGuide';
import { buildFrameInsight } from './frameInsight';
import { mergeSortLesson } from './mergeSortLesson';
import { quickSortLesson } from './quickSortLesson';
import { lessonRegistry } from './registry';
import { validateLessonSet } from './schema';
import type { Lesson } from './types';

type Frame = {
  state: { values: number[] };
  message: string;
  lessonStepId: string;
  structure: Record<string, unknown>;
};

const defaults = defaultFrames as unknown as Record<'quick' | 'merge', Frame[]>;
const lessons: Lesson[] = [quickSortLesson, mergeSortLesson];

describe('S2 quick/merge bilingual courses', () => {
  it('registers one complete course per algorithm', () => {
    expect(lessonRegistry.byAlgorithm('quick')).toBe(quickSortLesson);
    expect(lessonRegistry.byAlgorithm('merge')).toBe(mergeSortLesson);
    expect(validateLessonSet(lessons)).toEqual({ ok: true, errors: [] });
    for (const lesson of lessons) {
      expect(lesson.steps).toHaveLength(5);
      expect(lesson.title.zh.length).toBeGreaterThan(0);
      expect(lesson.title.en.length).toBeGreaterThan(0);
      expect(lesson.oneLiner.zh.length).toBeGreaterThan(0);
      expect(lesson.oneLiner.en.length).toBeGreaterThan(0);
      expect(lesson.prerequisites.zh.length).toBe(lesson.prerequisites.en.length);
      expect(lesson.commonMistakes.zh.length).toBe(lesson.commonMistakes.en.length);
      expect(lesson.commonMistakes.zh.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('uses exactly the lesson steps emitted by real Python frames', () => {
    for (const lesson of lessons) {
      const steps = new Set(lesson.steps.map((step) => step.stepId));
      const emitted = new Set(defaults[lesson.algorithmId as 'quick' | 'merge'].map((frame) => frame.lessonStepId));
      expect([...steps].sort()).toEqual([...emitted].sort());
      expect(steps.size).toBe(lesson.steps.length);
    }
  });

  it('states quick sort complexity, stack and instability correctly', () => {
    expect(quickSortLesson.complexity.time).toContain('O(n log n)');
    expect(quickSortLesson.complexity.time).toContain('O(n²)');
    expect(quickSortLesson.complexity.space).toContain('O(log n)');
    expect(quickSortLesson.complexity.space).toContain('O(n)');
    expect(quickSortLesson.overview.zh).toContain('稳定');
    expect(quickSortLesson.overview.en).toContain('unstable');
    expect(quickSortLesson.overview.zh).toContain('Lomuto');
    expect(quickSortLesson.steps.map((step) => step.stepId)).toContain('quick-place');
  });

  it('states merge sort O(n log n), O(n) buffer space and stable tie handling', () => {
    expect(mergeSortLesson.complexity.time).toContain('O(n log n)');
    expect(mergeSortLesson.complexity.space).toContain('O(n)');
    expect(mergeSortLesson.overview.zh).toContain('稳定');
    expect(mergeSortLesson.overview.en).toContain('stable');
    expect(mergeSortLesson.overview.zh).toContain('缓冲区');
    expect(mergeSortLesson.overview.zh).toContain('相等时优先取左侧');
    expect(mergeSortLesson.overview.en).toContain('take the left side');
    expect(mergeSortLesson.steps.map((step) => step.stepId)).toContain('merge-writeback');
  });

  it('uses authored horizontal flows instead of the raw Trace captions', () => {
    for (const lesson of lessons) {
      const guide = buildAlgorithmGuide(lesson.algorithmId, lesson);
      expect(guide.source).toBe('curated');
      expect(guide.stages.length).toBeGreaterThanOrEqual(3);
      expect(guide.stages.every((stage) => stage.title.zh.length > 0 && stage.title.en.length > 0)).toBe(true);
      expect(guide.conditions.zh.length).toBeGreaterThan(0);
    }
  });

  it('explains each visible quick and merge action from its real frame', () => {
    const quickPlace = defaults.quick.find((frame) => frame.lessonStepId === 'quick-place')!;
    const mergeWrite = defaults.merge.find((frame) => frame.lessonStepId === 'merge-compare' && frame.structure.operation === 'merge-write')!;
    const quick = buildFrameInsight(quickSortLesson, {
      schemaVersion: 1,
      step: 0,
      eventType: 'step',
      visualType: 'array',
      state: quickPlace.state,
      message: quickPlace.message,
      lessonStepId: quickPlace.lessonStepId,
      structure: quickPlace.structure,
    } as never, undefined, 'zh');
    const merge = buildFrameInsight(mergeSortLesson, {
      schemaVersion: 1,
      step: 0,
      eventType: 'step',
      visualType: 'array',
      state: mergeWrite.state,
      message: mergeWrite.message,
      lessonStepId: mergeWrite.lessonStepId,
      structure: mergeWrite.structure,
    } as never, undefined, 'zh');
    expect(quick?.semantic).toBe(true);
    expect(quick?.action).toContain('pivot');
    expect(merge?.semantic).toBe(true);
    expect(merge?.action).toContain('缓冲区');
  });
});

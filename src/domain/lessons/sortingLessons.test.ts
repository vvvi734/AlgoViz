import { describe, expect, it } from 'vitest';
import rawDefault from '../../test/fixtures/sorting-default-frames.json';
import { insertionSortLesson } from './insertionSortLesson';
import { selectionSortLesson } from './selectionSortLesson';
import { shellSortLesson } from './shellSortLesson';
import { validateLessonSet } from './schema';
import { lessonRegistry } from './registry';
import type { Lesson } from './types';

type Frame = { lessonStepId: string };
const defaults = rawDefault as unknown as Record<string, Frame[]>;
const lessons: Lesson[] = [selectionSortLesson, insertionSortLesson, shellSortLesson];

describe('S1 sorting lessons', () => {
  it('registers exactly one bilingual course per sorting algorithm', () => {
    expect(lessonRegistry.byAlgorithm('selection')).toBe(selectionSortLesson);
    expect(lessonRegistry.byAlgorithm('insertion')).toBe(insertionSortLesson);
    expect(lessonRegistry.byAlgorithm('shell')).toBe(shellSortLesson);
    expect(validateLessonSet(lessons)).toEqual({ ok: true, errors: [] });
    for (const lesson of lessons) {
      expect(lesson.title.zh.length).toBeGreaterThan(0);
      expect(lesson.title.en.length).toBeGreaterThan(0);
      expect(lesson.overview.zh.length).toBeGreaterThan(20);
      expect(lesson.overview.en.length).toBeGreaterThan(20);
      expect(lesson.prerequisites.zh.length).toBe(lesson.prerequisites.en.length);
      expect(lesson.commonMistakes.zh.length).toBe(lesson.commonMistakes.en.length);
      expect(lesson.complexity.space).toBe('O(1)');
    }
  });

  it('uses exactly the operation ids emitted by the real Python lesson_step', () => {
    for (const lesson of lessons) {
      const operations = new Set(defaults[lesson.algorithmId]!.map((frame) => frame.lessonStepId));
      expect([...new Set(lesson.steps.map((step) => step.stepId))].sort()).toEqual([...operations].sort());
      expect(new Set(lesson.steps.map((step) => step.stepId)).size).toBe(lesson.steps.length);
    }
  });

  it('states complexity and stability accurately and differently', () => {
    expect(selectionSortLesson.complexity.time).toContain('O(n²)');
    expect(selectionSortLesson.overview.zh).toContain('不稳定');
    expect(selectionSortLesson.overview.en.toLowerCase()).toContain('unstable');

    expect(insertionSortLesson.complexity.time).toContain('最好 O(n)');
    expect(insertionSortLesson.complexity.time).toContain('最坏 O(n²)');
    expect(insertionSortLesson.overview.zh).toContain('稳定');
    expect(insertionSortLesson.overview.en.toLowerCase()).toContain('stable');

    expect(shellSortLesson.complexity.time).toContain('取决于间隔序列');
    expect(shellSortLesson.complexity.time).toContain('O(n²)');
    expect(shellSortLesson.overview.zh).toContain('不能笼统');
    expect(shellSortLesson.overview.zh).toContain('通常不稳定');
    expect(shellSortLesson.overview.en).toContain('not every Shell sort is O(n log n)');
    expect(shellSortLesson.overview.en).toContain('usually unstable');
  });

  it('explains the difference between selection, insertion and gap insertion', () => {
    expect(selectionSortLesson.oneLiner.zh).toContain('交换');
    expect(insertionSortLesson.oneLiner.zh).toContain('右移');
    expect(insertionSortLesson.overview.zh).toContain('不是相邻元素的连续冒泡交换');
    expect(shellSortLesson.oneLiner.zh).toContain('gap');
    expect(shellSortLesson.steps.map((step) => step.stepId)).toContain('gap-done');
  });
});

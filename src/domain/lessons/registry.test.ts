import { describe, expect, it } from 'vitest';
import { ALGORITHM_CATALOG } from '../algorithms/catalog.generated';
import { bubbleSortLesson } from './bubbleSort';
import { factorialLesson } from './factorial';
import { createLessonRegistry, lessonRegistry, validateLessonsAgainstCatalog } from './registry';

const catalogIds = Object.keys(ALGORITHM_CATALOG);

describe('Lesson registry (Stage 3B)', () => {
  it('looks a course up by lesson id and by algorithm id', () => {
    expect(lessonRegistry.byId('bubble-sort-basics')).toBe(bubbleSortLesson);
    expect(lessonRegistry.byId('factorial-recursion-basics')).toBe(factorialLesson);
    expect(lessonRegistry.byAlgorithm('bubble')).toBe(bubbleSortLesson);
    expect(lessonRegistry.byAlgorithm('factorial')).toBe(factorialLesson);
  });

  it('returns undefined (never throws) for algorithms and ids without a course', () => {
    expect(lessonRegistry.byAlgorithm('binary')).toBeUndefined();
    expect(lessonRegistry.byAlgorithm('not-an-algorithm')).toBeUndefined();
    expect(lessonRegistry.byId('missing')).toBeUndefined();
    expect(lessonRegistry.has('binary')).toBe(false);
    expect(lessonRegistry.has('bubble')).toBe(true);
  });

  it('exposes all bundled courses in registration order', () => {
    expect(lessonRegistry.lessons.map((lesson) => lesson.lessonId)).toEqual([
      'bubble-sort-basics',
      'factorial-recursion-basics',
      'stack-lifo-basics',
      'queue-fifo-basics',
      'linked-list-pointer-basics',
      'binary-tree-traversal-basics',
    ]);
  });

  it('refuses to build a registry from invalid content', () => {
    expect(() => createLessonRegistry([{ lessonId: 'halfBaked' }])).toThrow(/Invalid lesson content/);
  });

  it('accepts an externally supplied course set (future .algopack path)', () => {
    const registry = createLessonRegistry([factorialLesson]);
    expect(registry.byAlgorithm('factorial')).toBe(factorialLesson);
    expect(registry.byAlgorithm('bubble')).toBeUndefined();
  });

  it('points every bundled course at a real algorithm in the catalog', () => {
    const result = validateLessonsAgainstCatalog(lessonRegistry.lessons, catalogIds);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    for (const lesson of lessonRegistry.lessons) {
      expect(catalogIds).toContain(lesson.algorithmId);
    }
  });

  it('reports an algorithmId typo instead of silently orphaning the course', () => {
    const broken = validateLessonsAgainstCatalog(
      [{ ...bubbleSortLesson, algorithmId: 'buble-sort' }],
      catalogIds,
    );
    expect(broken.ok).toBe(false);
    expect(broken.errors.join(' ')).toContain('buble-sort');
  });

  it('leaves the other algorithms without a course, and that is legal', () => {
    const covered = lessonRegistry.lessons.map((lesson) => lesson.algorithmId);
    const uncovered = catalogIds.filter((id) => !covered.includes(id));
    expect(catalogIds.length).toBe(14);
    expect(uncovered.length).toBe(8);
  });
});

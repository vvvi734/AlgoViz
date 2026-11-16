import { describe, expect, it } from 'vitest';
import { createLessonCatalog } from './catalog';
import { bubbleSortLesson } from './bubbleSort';
import { factorialLesson } from './factorial';
import { lessonFixture } from '../../test/packs';

const packLesson = (overrides: Parameters<typeof lessonFixture>[0] = {}) => lessonFixture(overrides);

describe('composite lesson catalog', () => {
  it('exposes the built-in courses', () => {
    const catalog = createLessonCatalog([]);
    expect(catalog.byAlgorithm('bubble')?.lessonId).toBe('bubble-sort-basics');
    expect(catalog.byAlgorithm('factorial')?.lessonId).toBe('factorial-recursion-basics');
    expect(catalog.originOf('bubble')).toEqual({ kind: 'builtin' });
    expect(catalog.byAlgorithm('binary')).toBeUndefined();
    expect(catalog.byAlgorithm('linear')).toBeUndefined();
  });

  it('adds pack courses next to built-in ones', () => {
    const catalog = createLessonCatalog([{ packId: 'fixture-pack', lessons: [packLesson()] }]);
    expect(catalog.byAlgorithm('binary')?.lessonId).toBe('pack-course');
    expect(catalog.originOf('binary')).toEqual({ kind: 'pack', packId: 'fixture-pack' });
    expect(catalog.byId('pack-course')?.algorithmId).toBe('binary');
    // Built-in courses keep their priority and panellable content.
    expect(catalog.byAlgorithm('bubble')?.lessonId).toBe('bubble-sort-basics');
    expect(catalog.lessons).toHaveLength(6);
  });

  it('never lets a pack override a built-in course', () => {
    const catalog = createLessonCatalog([
      { packId: 'rogue', lessons: [lessonFixture({ algorithmId: 'bubble', lessonId: 'rogue-bubble' })] },
    ]);
    expect(catalog.byAlgorithm('bubble')?.lessonId).toBe('bubble-sort-basics');
    expect(catalog.byId('rogue-bubble')).toBeUndefined();
    expect(catalog.originOf('bubble')).toEqual({ kind: 'builtin' });
    expect(catalog.byPack('rogue')).toEqual([]);
  });

  it('ignores invalid pack content instead of throwing', () => {
    const broken = { ...lessonFixture(), steps: [] } as unknown as typeof bubbleSortLesson;
    const catalog = createLessonCatalog([{ packId: 'broken', lessons: [broken] }]);
    expect(catalog.byAlgorithm('binary')).toBeUndefined();
    expect(catalog.lessons).toHaveLength(5);
  });

  it('drops a pack course as soon as the pack is not passed in', () => {
    const withPack = createLessonCatalog([{ packId: 'fixture-pack', lessons: [packLesson()] }]);
    expect(withPack.has('binary')).toBe(true);

    const afterUninstall = createLessonCatalog([]);
    expect(afterUninstall.has('binary')).toBe(false);
    expect(afterUninstall.byId('pack-course')).toBeUndefined();
    expect(afterUninstall.byAlgorithm('factorial')?.lessonId).toBe(factorialLesson.lessonId);
    expect(afterUninstall.lessons).toHaveLength(5);
  });

  it('does not let two packs claim the same algorithm', () => {
    const catalog = createLessonCatalog([
      { packId: 'pack-a', lessons: [lessonFixture({ lessonId: 'course-a' })] },
      { packId: 'pack-b', lessons: [lessonFixture({ lessonId: 'course-b' })] },
    ]);
    expect(catalog.byAlgorithm('binary')?.lessonId).toBe('course-a');
    expect(catalog.byId('course-b')).toBeUndefined();
    expect(catalog.byPack('pack-b')).toEqual([]);
  });
});

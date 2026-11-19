import { describe, expect, it } from 'vitest';
import { builtinLessonCatalog, builtinCourseAlgorithms } from './catalog';

describe('built-in lesson catalog', () => {
  it('indexes every official course by id and algorithm', () => {
    expect(builtinLessonCatalog.lessons.length).toBeGreaterThan(0);
    expect(builtinLessonCatalog.byAlgorithm('bubble')).toBeDefined();
    const lesson = builtinLessonCatalog.byAlgorithm('bubble')!;
    expect(builtinLessonCatalog.byId(lesson.lessonId)).toBe(lesson);
    expect(builtinLessonCatalog.has('bubble')).toBe(true);
  });

  it('keeps the official course list independent of external packages', () => {
    expect(builtinCourseAlgorithms()).toContain('bubble');
    expect(builtinCourseAlgorithms()).toContain('dijkstra');
    expect(builtinLessonCatalog.has('unknown-algorithm')).toBe(false);
  });
});

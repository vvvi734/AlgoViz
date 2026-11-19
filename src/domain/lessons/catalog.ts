/**
 * Built-in course catalog.
 *
 * Courses are authored in `domain/lessons/**` and registered once. There is no
 * external package/installation layer: the lab always reads the official
 * bilingual courses below.
 */
import { lessonRegistry } from './registry';
import type { Lesson } from './types';

export interface LessonCatalog {
  readonly lessons: readonly Lesson[];
  byId(lessonId: string): Lesson | undefined;
  byAlgorithm(algorithmId: string): Lesson | undefined;
  has(algorithmId: string): boolean;
}

const byAlgorithm = new Map<string, Lesson>();
const byId = new Map<string, Lesson>();

for (const lesson of lessonRegistry.lessons) {
  byAlgorithm.set(lesson.algorithmId, lesson);
  byId.set(lesson.lessonId, lesson);
}

export const builtinLessonCatalog: LessonCatalog = {
  lessons: lessonRegistry.lessons,
  byId: (lessonId) => byId.get(lessonId),
  byAlgorithm: (algorithmId) => byAlgorithm.get(algorithmId),
  has: (algorithmId) => byAlgorithm.has(algorithmId),
};

/** Algorithms that ship a built-in course. */
export function builtinCourseAlgorithms(): string[] {
  return lessonRegistry.lessons.map((lesson) => lesson.algorithmId);
}

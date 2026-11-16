/**
 * Composite lesson catalog: built-in courses + installed `.algopack` courses.
 *
 * Priority rule (Stage 4): **built-in courses always win.** External packs can
 * only add courses for algorithms that have no built-in course, and two packs
 * may never claim the same algorithm. Validation rejects such packs at import
 * time (`algorithm-builtin-conflict` / `algorithm-pack-conflict`), and this
 * layer re-applies the rule defensively so a corrupted database can never
 * shadow a built-in course or brick the lab.
 */
import { createLessonRegistry, lessonRegistry, type LessonRegistry } from './registry';
import type { Lesson } from './types';

export interface InstalledLessonSet {
  packId: string;
  lessons: readonly Lesson[];
}

export interface LessonOrigin {
  kind: 'builtin' | 'pack';
  /** Set for pack courses. */
  packId?: string;
}

export interface LessonCatalog {
  readonly lessons: readonly Lesson[];
  byId(lessonId: string): Lesson | undefined;
  byAlgorithm(algorithmId: string): Lesson | undefined;
  has(algorithmId: string): boolean;
  /** Where the course for this algorithm came from, if any. */
  originOf(algorithmId: string): LessonOrigin | undefined;
  /** Courses contributed by a specific pack (used after uninstall). */
  byPack(packId: string): readonly Lesson[];
}

const EMPTY: LessonRegistry = { lessons: [], byId: () => undefined, byAlgorithm: () => undefined, has: () => false };

/**
 * Build the catalog for a set of installed packs.
 *
 * Each pack is validated with the same `createLessonRegistry` factory used for
 * built-in content; a pack that fails validation is skipped rather than thrown,
 * because the store is user-writable and must not take the app down.
 */
export function createLessonCatalog(packs: readonly InstalledLessonSet[] = []): LessonCatalog {
  const byAlgorithm = new Map<string, Lesson>();
  const byId = new Map<string, Lesson>();
  const origins = new Map<string, LessonOrigin>();
  const perPack = new Map<string, Lesson[]>();

  for (const lesson of lessonRegistry.lessons) {
    byAlgorithm.set(lesson.algorithmId, lesson);
    byId.set(lesson.lessonId, lesson);
    origins.set(lesson.algorithmId, { kind: 'builtin' });
  }

  for (const pack of packs) {
    let packRegistry: LessonRegistry;
    try {
      packRegistry = createLessonRegistry([...pack.lessons]);
    } catch {
      packRegistry = EMPTY; // invalid content in storage: ignore it
    }
    const accepted: Lesson[] = [];
    for (const lesson of packRegistry.lessons) {
      if (byAlgorithm.has(lesson.algorithmId) || byId.has(lesson.lessonId)) continue;
      byAlgorithm.set(lesson.algorithmId, lesson);
      byId.set(lesson.lessonId, lesson);
      origins.set(lesson.algorithmId, { kind: 'pack', packId: pack.packId });
      accepted.push(lesson);
    }
    perPack.set(pack.packId, accepted);
  }

  return {
    lessons: [...byId.values()],
    byId: (lessonId) => byId.get(lessonId),
    byAlgorithm: (algorithmId) => byAlgorithm.get(algorithmId),
    has: (algorithmId) => byAlgorithm.has(algorithmId),
    originOf: (algorithmId) => origins.get(algorithmId),
    byPack: (packId) => perPack.get(packId) ?? [],
  };
}

/** Algorithms that already ship a built-in course (packs may not claim them). */
export function builtinCourseAlgorithms(): string[] {
  return lessonRegistry.lessons.map((lesson) => lesson.algorithmId);
}

/** The default catalog (built-in only), used before packs finish loading. */
export const builtinLessonCatalog: LessonCatalog = createLessonCatalog([]);

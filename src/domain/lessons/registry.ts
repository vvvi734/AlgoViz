/**
 * Lesson registry — the single place that knows which courses exist.
 *
 * Deliberately a plain data structure with lookups, not a plugin system: a
 * future `.algopack` only has to hand an array of `Lesson` objects to
 * `createLessonRegistry`, and the lab will pick them up. No React, no worker, no
 * file system assumptions live here.
 */
import { bubbleSortLesson } from './bubbleSort';
import { selectionSortLesson } from './selectionSortLesson';
import { insertionSortLesson } from './insertionSortLesson';
import { shellSortLesson } from './shellSortLesson';
import { quickSortLesson } from './quickSortLesson';
import { mergeSortLesson } from './mergeSortLesson';
import { queueLesson } from './queue';
import { stackLesson } from './stack';
import { sequentialListLesson } from './sequentialList';
import { factorialLesson } from './factorial';
import { linkedListLesson } from './linkedList';
import { doublyLinkedListLesson } from './doublyLinkedList';
import { circularLinkedListLesson } from './circularLinkedList';
import { binaryTreeLesson } from './binaryTree';
import { bstLesson } from './bstLesson';
import { avlLesson } from './avlLesson';
import { heapLesson } from './heapLesson';
import { huffmanLesson } from './huffmanLesson';
import { bfsLesson, dfsLesson } from './graphLessons';
import { dijkstraLesson } from './dijkstraLesson';
import { floydWarshallLesson } from './floydWarshallLesson';
import { bellmanFordLesson } from './bellmanFordLesson';
import { primLesson } from './primLesson';
import { kruskalLesson } from './kruskalLesson';
import { topologicalSortLesson } from './topologicalSortLesson';
import { criticalPathLesson } from './criticalPathLesson';
import { connectedComponentsLesson } from './connectedComponentsLesson';
import { stronglyConnectedComponentsLesson } from './stronglyConnectedComponentsLesson';
import { linearSearchLesson } from './linearSearchLesson';
import { binarySearchLesson } from './binarySearchLesson';
import { hashChainingLesson } from './hashChainingLesson';
import { hashProbingLesson } from './hashProbingLesson';
import { kmpLesson } from './kmpLesson';
import { validateLessonSet } from './schema';
import type { Lesson, LessonValidationResult } from './types';

export interface LessonRegistry {
  /** All registered lessons, in registration order. */
  readonly lessons: readonly Lesson[];
  byId(lessonId: string): Lesson | undefined;
  /** The course for an algorithm, or `undefined` when that algorithm has none. */
  byAlgorithm(algorithmId: string): Lesson | undefined;
  has(algorithmId: string): boolean;
}

/**
 * Build a validated registry. Invalid content throws immediately: a broken
 * course is an authoring error, and failing at load beats silently rendering a
 * half-empty panel. Runtime *lookups* never throw — unknown ids return
 * `undefined` so legacy algorithms keep working.
 */
export function createLessonRegistry(input: unknown[]): LessonRegistry {
  const validation = validateLessonSet(input);
  if (!validation.ok) throw new Error(`Invalid lesson content:\n${validation.errors.join('\n')}`);
  const lessons = input as Lesson[];
  const byIdMap = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
  const byAlgorithmMap = new Map(lessons.map((lesson) => [lesson.algorithmId, lesson]));
  return {
    lessons,
    byId: (lessonId) => byIdMap.get(lessonId),
    byAlgorithm: (algorithmId) => byAlgorithmMap.get(algorithmId),
    has: (algorithmId) => byAlgorithmMap.has(algorithmId),
  };
}

const BUNDLED: unknown[] = [
  bubbleSortLesson,
  selectionSortLesson,
  insertionSortLesson,
  shellSortLesson,
  quickSortLesson,
  mergeSortLesson,
  factorialLesson,
  stackLesson,
  queueLesson,
  sequentialListLesson,
  linkedListLesson,
  doublyLinkedListLesson,
  circularLinkedListLesson,
  binaryTreeLesson,
  bstLesson,
  avlLesson,
  heapLesson,
  huffmanLesson,
  bfsLesson,
  dfsLesson,
  dijkstraLesson,
  floydWarshallLesson,
  bellmanFordLesson,
  primLesson,
  kruskalLesson,
  topologicalSortLesson,
  criticalPathLesson,
  connectedComponentsLesson,
  stronglyConnectedComponentsLesson,
  linearSearchLesson,
  binarySearchLesson,
  hashChainingLesson,
  hashProbingLesson,
  kmpLesson,
];

/** Courses shipped with the app itself (bubble, factorial, stack, queue, linked-list, binary-tree). */
export const lessonRegistry: LessonRegistry = createLessonRegistry(BUNDLED);

/**
 * Cross-check the bundled courses against the algorithm catalog so a typo in
 * `algorithmId` cannot silently make a course unreachable.
 */
export function validateLessonsAgainstCatalog(
  lessons: readonly Lesson[],
  catalogIds: readonly string[],
): LessonValidationResult {
  const errors: string[] = [];
  lessons.forEach((lesson) => {
    if (!catalogIds.includes(lesson.algorithmId)) {
      errors.push(`lesson "${lesson.lessonId}" points at unknown algorithm "${lesson.algorithmId}"`);
    }
  });
  return { ok: errors.length === 0, errors };
}

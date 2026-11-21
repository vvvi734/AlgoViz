import { describe, expect, it } from 'vitest';
import { catalog } from '../algorithms/examples';
import { bubbleSortLesson } from './bubbleSort';
import { factorialLesson } from './factorial';
import { fibonacciLesson } from './fibonacci';
import { createLessonRegistry, lessonRegistry, validateLessonsAgainstCatalog } from './registry';

const catalogIds = Object.keys(catalog);

describe('Lesson registry (Stage 3B)', () => {
  it('looks a course up by lesson id and by algorithm id', () => {
    expect(lessonRegistry.byId('bubble-sort-basics')).toBe(bubbleSortLesson);
    expect(lessonRegistry.byId('factorial-recursion-basics')).toBe(factorialLesson);
    expect(lessonRegistry.byId('fibonacci-recursion-basics')).toBe(fibonacciLesson);
    expect(lessonRegistry.byAlgorithm('bubble')).toBe(bubbleSortLesson);
    expect(lessonRegistry.byAlgorithm('factorial')).toBe(factorialLesson);
    expect(lessonRegistry.byAlgorithm('fib')).toBe(fibonacciLesson);
  });

  it('returns undefined (never throws) for algorithms and ids without a course', () => {
    expect(lessonRegistry.byAlgorithm('not-an-algorithm')).toBeUndefined();
    expect(lessonRegistry.byId('missing')).toBeUndefined();
    expect(lessonRegistry.has('not-an-algorithm')).toBe(false);
    expect(lessonRegistry.has('fib')).toBe(true);
    expect(lessonRegistry.has('bubble')).toBe(true);
  });

  it('exposes all bundled courses in registration order', () => {
    expect(lessonRegistry.lessons.map((lesson) => lesson.lessonId)).toEqual([
      'bubble-sort-basics',
      'selection-sort-basics',
      'insertion-sort-basics',
      'shell-sort-basics',
      'quick-sort-basics',
      'merge-sort-basics',
      'tree-selection-sort',
      'radix-sort-basics',
      'factorial-recursion-basics',
      'fibonacci-recursion-basics',
      'stack-lifo-basics',
      'queue-fifo-basics',
      'sequential-list-basics',
      'linked-list-pointer-basics',
      'doubly-linked-list-pointers',
      'circular-linked-list-cycle',
      'binary-tree-traversal-basics',
      'threaded-binary-tree-inorder',
      'binary-search-tree-search-insert-delete',
      'b-tree-search-insert-split',
      'avl-balanced-binary-search-tree',
      'max-heap-build-push-extract-sort',
      'huffman-build-and-prefix-codes',
      'graph-bfs-queue-basics',
      'graph-dfs-stack-basics',
      'dijkstra-weighted-shortest-path',
      'floyd-warshall-all-pairs',
      'bellman-ford-single-source',
      'prim-minimum-spanning-tree',
      'kruskal-minimum-spanning-tree',
      'topological-sort-kahn',
      'aoe-critical-path',
      'connected-components-dfs',
      'strongly-connected-components-kosaraju',
      'articulation-points-low-link',
      'linear-search-basics',
      'binary-search-basics',
      'hash-chaining-basics',
      'hash-probing-basics',
      'bf-naive-pattern-matching',
      'kmp-pattern-matching',
      'sparse-transpose-fast',
      'generalized-list-depth',
      'generalized-list-copy',
      'static-linked-list-operations',
      'polynomial-add-linked-lists',
      'infix-to-postfix-operator-stack',
      'postfix-eval-operand-stack',
      'free-list-allocation',
      'buddy-system-allocation',
      'garbage-collection-trace',
      'block-search-index-then-scan',
      'bplus-tree-search-insert-range',
      'key-tree-prefix-search-insert',
      'multiway-balanced-merge',
      'replacement-selection-runs',
      'optimal-merge-tree',
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

  it('covers all 57 algorithms with a validated course', () => {
    const covered = lessonRegistry.lessons.map((lesson) => lesson.algorithmId);
    const uncovered = catalogIds.filter((id) => !covered.includes(id));
    expect(catalogIds.length).toBe(57);
    expect(lessonRegistry.lessons.length).toBe(57);
    expect(uncovered).toEqual([]);
  });
});

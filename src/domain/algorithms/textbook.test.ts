import { describe, expect, it } from 'vitest';
import { CONCEPT_PAGES, conceptById } from '../concepts/catalog';
import { catalog } from './examples';
import {
  LEGACY_CHAPTER_ID_MAP,
  LEGACY_TOPIC_ID_MAP,
  TEXTBOOK_CHAPTERS,
  TEXTBOOK_REFERENCE,
  buildTextbookNavigation,
  findConceptPath,
  findTextbookPath,
  migrateTextbookId,
  migrateTextbookTopicId,
  textbookAlgorithmIds,
  textbookPathFor,
} from './textbook';

const nav = buildTextbookNavigation(catalog);

describe('textbook directory after TEXTBOOK-01', () => {
  it('keeps the twelve chapters of 严蔚敏《数据结构（C语言版）》 in book order', () => {
    expect(nav).toHaveLength(12);
    expect(nav.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(nav.map((chapter) => chapter.id)).toEqual([
      'ch1-intro',
      'ch2-linear',
      'ch3-stack-queue',
      'ch4-string',
      'ch5-array',
      'ch6-tree',
      'ch7-graph',
      'ch8-dynamic-storage',
      'ch9-search',
      'ch10-sort',
      'ch11-external-sort',
      'ch12-files',
    ]);
    expect(nav.map((chapter) => chapter.title.zh)).toEqual([
      '绪论',
      '线性表',
      '栈和队列',
      '串',
      '数组和广义表',
      '树和二叉树',
      '图',
      '动态存储管理',
      '查找',
      '内部排序',
      '外部排序',
      '文件',
    ]);
    expect(TEXTBOOK_REFERENCE.author).toBe('严蔚敏、吴伟民');
    expect(TEXTBOOK_REFERENCE.edition.zh).toContain('1997');
    expect(nav.every((chapter) => chapter.extension !== true)).toBe(true);
  });

  it('preserves every existing algorithm exactly once in its new primary home', () => {
    const ids = textbookAlgorithmIds(nav);
    expect(ids).toHaveLength(41);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(catalog)));
  });

  it('maps every authored concept page to a real concept topic', () => {
    const conceptTopics = nav
      .flatMap((chapter) => chapter.topics)
      .filter((topic) => topic.conceptId);
    expect(CONCEPT_PAGES).toHaveLength(29);
    expect(conceptTopics.map((topic) => topic.conceptId).sort()).toEqual(
      CONCEPT_PAGES.map((page) => page.id).sort(),
    );
    for (const topic of conceptTopics) {
      const page = conceptById(topic.conceptId!);
      expect(page, topic.id).toBeTruthy();
      expect(page?.topicId).toBe(topic.id);
      expect(findConceptPath(nav, topic.conceptId!)).toEqual({
        chapterId: nav.find((chapter) =>
          chapter.topics.some((entry) => entry.id === topic.id),
        )?.id,
        topicId: topic.id,
      });
    }
  });

  it('keeps the old chapter ids readable after the migration', () => {
    for (const [legacy, current] of Object.entries(LEGACY_CHAPTER_ID_MAP)) {
      expect(migrateTextbookId(legacy)).toBe(current);
      expect(nav.some((chapter) => chapter.id === current), legacy).toBe(true);
    }
    expect(migrateTextbookId('ch7-graph')).toBe('ch7-graph');
    expect(LEGACY_TOPIC_ID_MAP['recursion-extension']).toBe('recursion-examples');
    expect(migrateTextbookTopicId('recursion-extension')).toBe('recursion-examples');
    expect(migrateTextbookTopicId('kmp')).toBe('kmp');
  });

  it('places KMP in chapter 4 and sparse transpose in chapter 5', () => {
    const strings = nav.find((chapter) => chapter.id === 'ch4-string')!;
    expect(strings.topics.map((topic) => topic.id)).toEqual([
      'string-basics',
      'string-storage',
      'naive-match',
      'kmp',
      'string-applications',
    ]);
    expect(strings.topics.find((topic) => topic.id === 'kmp')?.algorithms).toEqual([
      expect.objectContaining({ id: 'kmp' }),
    ]);
    expect(textbookPathFor(catalog, 'kmp')).toEqual({ chapterId: 'ch4-string', topicId: 'kmp' });

    const arrays = nav.find((chapter) => chapter.id === 'ch5-array')!;
    expect(arrays.topics.map((topic) => topic.id)).toEqual([
      'array-basics',
      'special-matrices',
      'sparse-matrix',
      'sparse-transpose',
      'generalized-list',
      'm-variable-polynomial',
    ]);
    expect(textbookPathFor(catalog, 'sparse-transpose')).toEqual({
      chapterId: 'ch5-array',
      topicId: 'sparse-transpose',
    });
  });

  it('wires the three completed concept pages into chapters 2, 3 and 4', () => {
    const staticList = nav.find((chapter) => chapter.id === 'ch2-linear')!;
    const recursion = nav.find((chapter) => chapter.id === 'ch3-stack-queue')!;
    const strings = nav.find((chapter) => chapter.id === 'ch4-string')!;

    for (const [chapter, topicId, pageId] of [
      [staticList, 'static-linked-list', 'static-linked-list'],
      [recursion, 'stack-recursion', 'stack-recursion'],
      [strings, 'string-storage', 'string-storage'],
    ] as const) {
      const topic = chapter.topics.find((entry) => entry.id === topicId)!;
      expect(topic.conceptId).toBe(pageId);
      expect(topic.category).toBe('theory');
      expect(topic.planned).toBeUndefined();
      expect(topic.algorithms).toHaveLength(0);
      expect(conceptById(pageId)).toBeTruthy();
    }

    const recursionTopic = recursion.topics.find((topic) => topic.id === 'stack-recursion')!;
    expect(recursionTopic.algorithms).toHaveLength(0);
    const recursionExamples = recursion.topics.find((topic) => topic.id === 'recursion-examples')!;
    expect(recursionExamples.algorithms.map((algorithm) => algorithm.id)).toEqual([
      'factorial',
      'fib',
    ]);
    expect(recursionExamples.algorithms.every((algorithm) => algorithm.extension)).toBe(true);
  });

  it('keeps chapter 8, 11 and 12 visible as planned knowledge even without algorithms', () => {
    for (const id of ['ch8-dynamic-storage', 'ch11-external-sort', 'ch12-files']) {
      const chapter = nav.find((entry) => entry.id === id)!;
      expect(chapter.algorithmCount).toBe(0);
      expect(chapter.topics.length).toBeGreaterThan(0);
      expect(chapter.topics.every((topic) => topic.category === 'pending')).toBe(true);
      expect(chapter.topics.every((topic) => topic.algorithms.length === 0)).toBe(true);
    }
  });

  it('keeps graph order aligned with the book: connectivity, MST, DAG, shortest paths', () => {
    const graph = nav.find((chapter) => chapter.id === 'ch7-graph')!;
    expect(graph.algorithmCount).toBe(11);
    expect(graph.topics.map((topic) => topic.id)).toEqual([
      'graph-basics',
      'graph-storage',
      'graph-traversal',
      'graph-connectivity',
      'mst',
      'topological',
      'critical-path',
      'shortest-path',
    ]);
    const ids = graph.topics.map((topic) => topic.id);
    expect(ids.indexOf('graph-connectivity')).toBeLessThan(ids.indexOf('mst'));
    expect(ids.indexOf('topological')).toBeLessThan(ids.indexOf('shortest-path'));
    for (const id of ['bfs', 'dfs', 'components', 'scc', 'prim', 'kruskal', 'topological', 'critical-path', 'dijkstra', 'floyd-warshall', 'bellman-ford']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch7-graph');
    }
    expect(
      graph.topics.find((topic) => topic.id === 'shortest-path')?.algorithms.find((algorithm) => algorithm.id === 'bellman-ford')?.extension,
    ).toBe(true);
  });

  it('puts tree traversal and Huffman in chapter 6, and BST/AVL/B-tree/hash in chapter 9', () => {
    const tree = nav.find((chapter) => chapter.id === 'ch6-tree')!;
    const search = nav.find((chapter) => chapter.id === 'ch9-search')!;
    expect(tree.algorithmCount).toBe(2);
    expect(tree.topics.find((topic) => topic.id === 'binary-tree-traversal')?.algorithms[0].id).toBe('inorder');
    expect(tree.topics.find((topic) => topic.id === 'huffman')?.algorithms[0].id).toBe('huffman');
    expect(search.algorithmCount).toBe(7);
    for (const id of ['linear', 'binary', 'bst', 'avl', 'btree', 'hash-chain', 'hash-probe']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch9-search');
    }
    expect(textbookPathFor(catalog, 'btree')).toEqual({
      chapterId: 'ch9-search',
      topicId: 'btree-demo',
    });
  });

  it('orders internal sorting by insertion/quick/selection/merge and keeps bubble as a supplement', () => {
    const sort = nav.find((chapter) => chapter.id === 'ch10-sort')!;
    expect(sort.algorithmCount).toBe(7);
    expect(sort.topics.map((topic) => topic.id)).toEqual([
      'sort-basics',
      'insertion-sort',
      'shell-sort',
      'bubble-sort',
      'quick-sort',
      'selection-sort',
      'heap-sort',
      'merge-sort',
      'radix-sort',
      'sort-comparison',
    ]);
    const bubble = sort.topics.find((topic) => topic.id === 'bubble-sort')!;
    expect(bubble.extension).toBe(true);
    expect(bubble.algorithms[0]).toEqual(expect.objectContaining({ id: 'bubble', extension: true }));
    expect(sort.topics.find((topic) => topic.id === 'radix-sort')?.category).toBe('pending');
    expect(textbookPathFor(catalog, 'quick')).toEqual({ chapterId: 'ch10-sort', topicId: 'quick-sort' });
  });

  it('keeps planned rows target-free and concept rows separate from planned rows', () => {
    for (const chapter of TEXTBOOK_CHAPTERS) {
      for (const topic of chapter.topics) {
        if (topic.concept || topic.planned) {
          expect(topic.algorithms).toHaveLength(0);
        }
        expect(Boolean(topic.concept && topic.planned), topic.id).toBe(false);
      }
    }
    for (const chapter of nav) {
      for (const topic of chapter.topics) {
        expect(
          topic.algorithms.length > 0 ||
            topic.kind === 'planned' ||
            (topic.kind === 'concept' && topic.conceptId !== undefined),
          `${chapter.id}/${topic.id}`,
        ).toBe(true);
        if (topic.kind === 'planned') {
          expect(findTextbookPath(nav, topic.id)).toBeNull();
        }
      }
    }
  });

  it('derives theory, visual and pending categories from row semantics', () => {
    const topics = nav.flatMap((chapter) => chapter.topics);
    const theory = topics.filter((topic) => topic.category === 'theory');
    const visual = topics.filter((topic) => topic.category === 'visual');
    const pending = topics.filter((topic) => topic.category === 'pending');
    expect(theory.length).toBeGreaterThan(0);
    expect(visual.length).toBeGreaterThan(0);
    expect(pending.length).toBeGreaterThan(0);
    expect(theory.every((topic) => topic.kind === 'concept' && Boolean(topic.conceptId))).toBe(true);
    expect(visual.every((topic) => topic.kind === 'algorithm' || topic.kind === 'group')).toBe(true);
    expect(
      pending.every(
        (topic) =>
          topic.kind === 'planned' ||
          (topic.kind === 'concept' && Boolean(topic.conceptId) === false),
      ),
    ).toBe(true);
    expect(topics.find((topic) => topic.id === 'string-storage')?.category).toBe('theory');
    expect(topics.find((topic) => topic.id === 'sparse-transpose')?.category).toBe('visual');
  });
});

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
    expect(ids).toHaveLength(60);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(catalog)));
  });

  it('maps every authored concept page to a real concept topic at any depth', () => {
    const rows = nav.flatMap((chapter) =>
      chapter.topics.flatMap((topic) => [
        { chapterId: chapter.id, parentId: topic.id, row: topic },
        ...topic.children.map((child) => ({
          chapterId: chapter.id,
          parentId: topic.id,
          row: child,
        })),
      ]),
    );
    const conceptRows = rows.filter(({ row }) => row.conceptId);
    expect(CONCEPT_PAGES).toHaveLength(56);
    expect(conceptRows.map(({ row }) => row.conceptId).sort()).toEqual(
      CONCEPT_PAGES.map((page) => page.id).sort(),
    );
    for (const { chapterId, parentId, row } of conceptRows) {
      const page = conceptById(row.conceptId!);
      expect(page, row.id).toBeTruthy();
      expect(page?.topicId).toBe(row.id);
      expect(findConceptPath(nav, row.conceptId!)).toEqual({
        chapterId,
        topicId: parentId,
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

  it('groups BF and KMP under pattern matching, and array/matrix theory under one group', () => {
    const strings = nav.find((chapter) => chapter.id === 'ch4-string')!;
    expect(strings.topics.map((topic) => topic.id)).toEqual([
      'string-basics',
      'string-storage',
      'naive-match',
      'pattern-matching',
    ]);
    const matching = strings.topics.find((topic) => topic.id === 'pattern-matching')!;
    expect(matching.kind).toBe('group');
    expect(matching.children.map((child) => child.id)).toEqual(['bf', 'kmp']);
    expect(matching.children.find((child) => child.id === 'kmp')?.algorithms).toEqual([
      expect.objectContaining({ id: 'kmp' }),
    ]);
    expect(textbookPathFor(catalog, 'kmp')).toEqual({
      chapterId: 'ch4-string',
      topicId: 'pattern-matching',
    });

    const arrays = nav.find((chapter) => chapter.id === 'ch5-array')!;
    expect(arrays.topics.map((topic) => topic.id)).toEqual([
      'array-matrix',
      'sparse-transpose',
      'generalized-list-group',
    ]);
    expect(
      arrays.topics.find((topic) => topic.id === 'array-matrix')?.children.map((child) => child.id),
    ).toEqual(['array-basics', 'special-matrices', 'sparse-matrix']);
    expect(textbookPathFor(catalog, 'sparse-transpose')).toEqual({
      chapterId: 'ch5-array',
      topicId: 'sparse-transpose',
    });
    expect(textbookPathFor(catalog, 'gl-depth')).toEqual({
      chapterId: 'ch5-array',
      topicId: 'generalized-list-group',
    });
  });

  it('keeps the static linked list theory and visual operations under one group', () => {
    const staticList = nav.find((chapter) => chapter.id === 'ch2-linear')!;
    const group = staticList.topics.find((topic) => topic.id === 'static-linked-group')!;
    expect(group.kind).toBe('group');
    expect(group.children.map((child) => child.id)).toEqual([
      'static-linked-list',
      'static-linked-operations',
    ]);
    expect(group.children[0].conceptId).toBe('static-linked-list');
    expect(group.children[0].category).toBe('theory');
    expect(group.children[1].algorithms.map((algorithm) => algorithm.id)).toEqual([
      'static-linked-list',
    ]);
    expect(findConceptPath(nav, 'static-linked-list')).toEqual({
      chapterId: 'ch2-linear',
      topicId: 'static-linked-group',
    });

    const recursion = nav.find((chapter) => chapter.id === 'ch3-stack-queue')!;
    const examples = recursion.topics.find((topic) => topic.id === 'recursion-examples')!;
    expect(examples.children.map((child) => child.id)).toEqual(['factorial', 'fib']);
    expect(examples.children.every((child) => child.algorithms[0].extension === true)).toBe(true);
  });

  it('completes chapter 8 with three dynamic modules and two nested theory pages', () => {
    const chapter = nav.find((entry) => entry.id === 'ch8-dynamic-storage')!;
    expect(chapter.algorithmCount).toBe(3);
    expect(chapter.topics.map((topic) => topic.id)).toEqual([
      'dynamic-storage-overview',
      'free-space-group',
      'buddy-system',
      'garbage-collection-group',
    ]);

    const fundamentals = chapter.topics[0];
    expect(fundamentals.category).toBe('theory');
    expect(fundamentals.conceptId).toBe('dynamic-storage-overview');

    const freeSpace = chapter.topics.find((topic) => topic.id === 'free-space-group')!;
    expect(freeSpace.kind).toBe('group');
    expect(freeSpace.children.map((child) => child.id)).toEqual([
      'free-space-list',
      'boundary-tag',
    ]);
    expect(freeSpace.children[0].algorithms.map((algorithm) => algorithm.id)).toEqual([
      'free-list',
    ]);
    expect(freeSpace.children[1].conceptId).toBe('boundary-tag-method');
    expect(freeSpace.children[1].category).toBe('theory');

    const buddy = chapter.topics.find((topic) => topic.id === 'buddy-system')!;
    expect(buddy.algorithms.map((algorithm) => algorithm.id)).toEqual(['buddy-system']);
    expect(buddy.category).toBe('visual');

    const collection = chapter.topics.find((topic) => topic.id === 'garbage-collection-group')!;
    expect(collection.kind).toBe('group');
    expect(collection.children.map((child) => child.id)).toEqual([
      'garbage-collection',
      'storage-compaction',
    ]);
    expect(collection.children[0].algorithms.map((algorithm) => algorithm.id)).toEqual([
      'garbage-collection',
    ]);
    expect(collection.children[1].conceptId).toBe('storage-compaction');
    expect(collection.children[1].category).toBe('theory');

    for (const id of ['free-list', 'buddy-system', 'garbage-collection']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch8-dynamic-storage');
    }
    expect(findConceptPath(nav, 'boundary-tag-method')).toEqual({
      chapterId: 'ch8-dynamic-storage',
      topicId: 'free-space-group',
    });
    expect(findConceptPath(nav, 'storage-compaction')).toEqual({
      chapterId: 'ch8-dynamic-storage',
      topicId: 'garbage-collection-group',
    });
  });

  it('authors chapter 11 and completes chapter 12 with files theory and three runnable courses', () => {
    const chapter11 = nav.find((entry) => entry.id === 'ch11-external-sort')!;
    expect(chapter11.algorithmCount).toBe(3);
    expect(chapter11.topics.map((topic) => topic.id)).toEqual([
      'external-sort-basics',
      'external-initial-merge',
      'replacement-selection',
      'optimal-merge-tree',
      'external-sort-comparison',
    ]);
    for (const id of ['multiway', 'replacement', 'optimal-merge']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch11-external-sort');
    }
    expect(findConceptPath(nav, 'external-sort-basics')).toEqual({
      chapterId: 'ch11-external-sort',
      topicId: 'external-sort-basics',
    });
    expect(findConceptPath(nav, 'external-initial-runs')).toEqual({
      chapterId: 'ch11-external-sort',
      topicId: 'external-initial-merge',
    });

    const chapter12 = nav.find((entry) => entry.id === 'ch12-files')!;
    expect(chapter12.algorithmCount).toBe(3);
    expect(chapter12.topics.map((topic) => topic.id)).toEqual([
      'file-basics',
      'sequential-file',
      'indexed-files',
      'index-sequential',
      'direct-file',
      'multi-key-files',
      'file-comparison',
    ]);
    expect(chapter12.topics.some((topic) => topic.category === 'pending')).toBe(false);
    for (const id of ['file-index', 'isam', 'inverted-index']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch12-files');
    }
    for (const conceptId of [
      'file-basics',
      'sequential-file',
      'index-file',
      'isam-vsam',
      'hashed-file',
      'multi-table-file',
      'inverted-file',
      'file-comparison',
    ]) {
      expect(findConceptPath(nav, conceptId)).toBeTruthy();
    }
  });

  it('keeps graph order aligned with the book: connectivity, MST, DAG, shortest paths', () => {
    const graph = nav.find((chapter) => chapter.id === 'ch7-graph')!;
    expect(graph.algorithmCount).toBe(12);
    expect(graph.topics.map((topic) => topic.id)).toEqual([
      'graph-basics',
      'graph-storage',
      'graph-traversal',
      'graph-connectivity',
      'mst',
      'dag',
      'shortest-path',
    ]);
    const ids = graph.topics.map((topic) => topic.id);
    expect(ids.indexOf('graph-connectivity')).toBeLessThan(ids.indexOf('mst'));
    expect(ids.indexOf('dag')).toBeLessThan(ids.indexOf('shortest-path'));
    expect(graph.topics.find((topic) => topic.id === 'dag')?.children.map((child) => child.id)).toEqual([
      'topological',
      'critical-path',
    ]);
    for (const id of ['bfs', 'dfs', 'components', 'scc', 'prim', 'kruskal', 'topological', 'critical-path', 'dijkstra', 'floyd-warshall', 'bellman-ford']) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch7-graph');
    }
    const shortest = graph.topics.find((topic) => topic.id === 'shortest-path')!;
    expect(
      shortest.children.find((child) => child.id === 'bellman-ford')?.algorithms[0].extension,
    ).toBe(true);
  });

  it('puts threaded traversal and Huffman in chapter 6, and tree/hash search in chapter 9', () => {
    const tree = nav.find((chapter) => chapter.id === 'ch6-tree')!;
    const search = nav.find((chapter) => chapter.id === 'ch9-search')!;
    expect(tree.algorithmCount).toBe(3);
    expect(tree.topics.find((topic) => topic.id === 'binary-tree-traversal')?.algorithms[0].id).toBe('inorder');
    expect(tree.topics.find((topic) => topic.id === 'huffman')?.algorithms[0].id).toBe('huffman');
    const threaded = tree.topics.find((topic) => topic.id === 'threaded-tree-group')!;
    expect(threaded.kind).toBe('group');
    expect(threaded.children.map((child) => child.id)).toEqual(['threaded-tree', 'threaded-inorder']);
    expect(threaded.children[0].conceptId).toBe('threaded-binary-tree');
    expect(threaded.children[1].algorithms[0].id).toBe('threaded-inorder');
    expect(tree.topics.some((topic) => topic.id === 'backtracking-tree')).toBe(false);

    expect(search.algorithmCount).toBe(10);
    expect(search.topics.map((topic) => topic.id)).toEqual([
      'search-basics',
      'static-search',
      'tree-search',
      'hash-search',
      'search-comparison',
    ]);
    for (const id of [
      'linear',
      'binary',
      'block-search',
      'bst',
      'avl',
      'btree',
      'bplus-tree',
      'key-tree',
      'hash-chain',
      'hash-probe',
    ]) {
      expect(textbookPathFor(catalog, id)?.chapterId).toBe('ch9-search');
    }
    expect(textbookPathFor(catalog, 'btree')).toEqual({
      chapterId: 'ch9-search',
      topicId: 'tree-search',
    });
  });

  it('orders internal sorting by insertion/exchange/selection/merge and keeps bubble as a core course', () => {
    const sort = nav.find((chapter) => chapter.id === 'ch10-sort')!;
    expect(sort.algorithmCount).toBe(9);
    expect(sort.topics.map((topic) => topic.id)).toEqual([
      'sort-basics',
      'insertion-sort',
      'exchange-sort',
      'selection-sort',
      'merge-sort',
      'radix-sort',
      'sort-comparison',
    ]);
    const insertion = sort.topics.find((topic) => topic.id === 'insertion-sort')!;
    expect(insertion.children.map((child) => child.id)).toEqual(['direct-insertion', 'shell-sort']);
    const exchange = sort.topics.find((topic) => topic.id === 'exchange-sort')!;
    expect(exchange.children.map((child) => child.id)).toEqual(['bubble-sort', 'quick-sort']);
    const bubble = exchange.children.find((child) => child.id === 'bubble-sort')!;
    expect(bubble.category).toBe('visual');
    expect(bubble.extension).toBeUndefined();
    expect(bubble.algorithms[0]).toEqual(expect.objectContaining({ id: 'bubble' }));
    expect(bubble.algorithms[0].extension).toBe(false);
    const selection = sort.topics.find((topic) => topic.id === 'selection-sort')!;
    expect(selection.children.map((child) => child.id)).toEqual([
      'simple-selection-sort',
      'tree-selection-sort',
      'heap-sort',
    ]);
    expect(sort.topics.find((topic) => topic.id === 'radix-sort')?.category).toBe('visual');
    expect(textbookPathFor(catalog, 'tournament')).toEqual({
      chapterId: 'ch10-sort',
      topicId: 'selection-sort',
    });
    expect(textbookPathFor(catalog, 'radix')).toEqual({
      chapterId: 'ch10-sort',
      topicId: 'radix-sort',
    });
    expect(textbookPathFor(catalog, 'quick')).toEqual({
      chapterId: 'ch10-sort',
      topicId: 'exchange-sort',
    });
  });

  it('keeps planned rows target-free and groups backed by real children', () => {
    for (const chapter of TEXTBOOK_CHAPTERS) {
      for (const topic of chapter.topics) {
        if (topic.concept || topic.planned) {
          expect(topic.algorithms).toHaveLength(0);
          expect(topic.children ?? []).toHaveLength(0);
        }
        expect(Boolean(topic.concept && topic.planned), topic.id).toBe(false);
      }
    }
    for (const chapter of nav) {
      for (const topic of chapter.topics) {
        expect(
          topic.children.length > 0 ||
            topic.algorithms.length > 0 ||
            topic.kind === 'planned' ||
            (topic.kind === 'concept' && topic.conceptId !== undefined),
          `${chapter.id}/${topic.id}`,
        ).toBe(true);
        if (topic.kind === 'planned') {
          expect(findTextbookPath(nav, topic.id)).toBeNull();
        }
        if (topic.kind === 'group') {
          expect(topic.children.length).toBeGreaterThan(0);
          expect(topic.algorithms).toHaveLength(0);
        }
      }
    }
  });

  it('derives theory, visual and pending categories from row and leaf semantics', () => {
    const topics = nav.flatMap((chapter) => chapter.topics);
    const theory = topics.filter((topic) => topic.category === 'theory');
    const visual = topics.filter((topic) => topic.category === 'visual');
    const pending = topics.filter((topic) => topic.category === 'pending');
    expect(theory.length).toBeGreaterThan(0);
    expect(visual.length).toBeGreaterThan(0);
    expect(pending).toHaveLength(0);
    expect(
      theory.every(
        (topic) =>
          (topic.kind === 'concept' && Boolean(topic.conceptId)) ||
          (topic.kind === 'group' &&
            topic.children.length > 0 &&
            topic.children.every((child) => child.category === 'theory')),
      ),
    ).toBe(true);
    expect(
      visual.every(
        (topic) =>
          topic.kind === 'algorithm' ||
          (topic.kind === 'group' && topic.children.some((child) => child.category === 'visual')),
      ),
    ).toBe(true);
    const staticGroup = topics.find((topic) => topic.id === 'static-linked-group')!;
    expect(staticGroup.category).toBe('visual');
    expect(staticGroup.children.find((child) => child.id === 'static-linked-list')?.category).toBe(
      'theory',
    );
    const matrixGroup = topics.find((topic) => topic.id === 'array-matrix')!;
    expect(matrixGroup.category).toBe('theory');
    expect(topics.find((topic) => topic.id === 'string-storage')?.category).toBe('theory');
    expect(topics.find((topic) => topic.id === 'sparse-transpose')?.category).toBe('visual');
  });
});


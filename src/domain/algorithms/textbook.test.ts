import { describe, expect, it } from 'vitest';
import { catalog } from './examples';
import {
  TEXTBOOK_CHAPTERS,
  TEXTBOOK_REFERENCE,
  buildTextbookNavigation,
  findTextbookPath,
  textbookAlgorithmIds,
  textbookPathFor,
  textbookTitle,
} from './textbook';

const nav = buildTextbookNavigation(catalog);

describe('textbook directory (UX-03)', () => {
  it('keeps the nine 《大话数据结构》 chapters in source order', () => {
    expect(nav).toHaveLength(9);
    expect(nav.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(nav.map((chapter) => chapter.id)).toEqual([
      'ch1-intro',
      'ch2-algorithm',
      'ch3-linear',
      'ch4-stack-queue',
      'ch5-string',
      'ch6-tree',
      'ch7-graph',
      'ch8-search',
      'ch9-sort',
    ]);
    expect(TEXTBOOK_REFERENCE.author).toBe('程杰');
    expect(TEXTBOOK_REFERENCE.edition.zh).toContain('2011');
  });

  it('gives every registered algorithm exactly one primary home', () => {
    const ids = textbookAlgorithmIds(nav);
    expect(ids).toHaveLength(Object.keys(catalog).length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(catalog)));
    expect(ids).toHaveLength(26);
  });

  it('places MST before shortest paths and marks Bellman-Ford / connectivity as extensions', () => {
    const graph = nav.find((chapter) => chapter.id === 'ch7-graph')!;
    expect(graph.algorithmCount).toBe(11);
    expect(graph.topics.map((topic) => topic.id)).toEqual([
      'graph-basics',
      'graph-storage',
      'graph-traversal',
      'mst',
      'shortest-path',
      'topological',
      'critical-path',
      'graph-connectivity',
    ]);

    const mst = graph.topics.find((topic) => topic.id === 'mst')!;
    const shortest = graph.topics.find((topic) => topic.id === 'shortest-path')!;
    const traversal = graph.topics.find((topic) => topic.id === 'graph-traversal')!;
    const connectivity = graph.topics.find((topic) => topic.id === 'graph-connectivity')!;
    expect(graph.topics.indexOf(mst)).toBeLessThan(graph.topics.indexOf(shortest));
    expect(traversal.algorithms.map((algorithm) => algorithm.id)).toEqual(['bfs', 'dfs']);
    expect(mst.algorithms.map((algorithm) => algorithm.id)).toEqual(['prim', 'kruskal']);
    expect(shortest.algorithms.map((algorithm) => algorithm.id)).toEqual([
      'dijkstra',
      'floyd-warshall',
      'bellman-ford',
    ]);
    expect(shortest.algorithms[2].extension).toBe(true);
    expect(connectivity.extension).toBe(true);
    expect(connectivity.algorithms.map((algorithm) => algorithm.id)).toEqual(['components', 'scc']);
  });

  it('puts BST and AVL under 查找, not under 树; Huffman remains a planned tree topic', () => {
    const tree = nav.find((chapter) => chapter.id === 'ch6-tree')!;
    const search = nav.find((chapter) => chapter.id === 'ch8-search')!;
    expect(tree.topics.find((topic) => topic.id === 'binary-tree-traversal')?.algorithms).toEqual([
      expect.objectContaining({ id: 'inorder' }),
    ]);
    expect(tree.topics.find((topic) => topic.id === 'huffman')?.planned).toBe(true);
    expect(tree.topics.find((topic) => topic.id === 'huffman')?.algorithms).toHaveLength(0);
    expect(search.topics.find((topic) => topic.id === 'bst')?.algorithms[0].id).toBe('bst');
    expect(search.topics.find((topic) => topic.id === 'avl')?.algorithms[0].id).toBe('avl');
    expect(search.topics.find((topic) => topic.id === 'sequential-search')?.algorithms[0].id).toBe('linear');
    expect(search.topics.find((topic) => topic.id === 'ordered-search')?.algorithms[0].id).toBe('binary');
  });

  it('follows the textbook sorting order and keeps shell/merge as planned topics while heap is authored', () => {
    const sort = nav.find((chapter) => chapter.id === 'ch9-sort')!;
    expect(sort.topics.map((topic) => topic.id)).toEqual([
      'sort-basics',
      'bubble-sort',
      'selection-sort',
      'insertion-sort',
      'shell-sort',
      'heap-sort',
      'merge-sort',
      'quick-sort',
    ]);
    expect(sort.topics.find((topic) => topic.id === 'shell-sort')?.planned).toBe(true);
    expect(sort.topics.find((topic) => topic.id === 'heap-sort')?.planned).toBeUndefined();
    expect(sort.topics.find((topic) => topic.id === 'heap-sort')?.algorithms[0].id).toBe('heap');
    expect(sort.topics.find((topic) => topic.id === 'merge-sort')?.planned).toBe(true);
    expect(sort.topics.at(-1)?.id).toBe('quick-sort');
  });

  it('keeps planned entries target-free and every authored algorithm valid', () => {
    for (const chapter of TEXTBOOK_CHAPTERS) {
      for (const topic of chapter.topics) {
        if (topic.concept || topic.planned) {
          expect(topic.algorithms).toHaveLength(0);
        }
        // Concept and planned are distinct statuses; an authored topic cannot
        // claim both and cannot be silently left without semantics.
        expect(Boolean(topic.concept && topic.planned)).toBe(false);
      }
    }
    for (const chapter of nav) {
      for (const topic of chapter.topics) {
        expect(
          topic.algorithms.length > 0 ||
            topic.kind === 'concept' ||
            topic.kind === 'planned' ||
            topic.id === 'custom',
        ).toBe(true);
      }
    }
  });

  it('collapses single-algorithm topics into direct entries and keeps multi-algorithm topics expandable', () => {
    const topics = nav.flatMap((chapter) => chapter.topics);
    const direct = topics.filter((topic) => topic.kind === 'algorithm');
    const groups = topics.filter((topic) => topic.kind === 'group');

    expect(direct.map((topic) => topic.id)).toEqual([
      'linked-list',
      'stack-basics',
      'queue-basics',
      'binary-tree-traversal',
      'topological',
      'critical-path',
      'sequential-search',
      'ordered-search',
      'bst',
      'avl',
      'bubble-sort',
      'selection-sort',
      'insertion-sort',
      'heap-sort',
      'quick-sort',
    ]);
    expect(groups.map((topic) => topic.id)).toEqual([
      'recursion-extension',
      'graph-traversal',
      'mst',
      'shortest-path',
      'graph-connectivity',
    ]);

    for (const topic of direct) {
      expect(topic.algorithms).toHaveLength(1);
      expect(topic.concept).toBeUndefined();
      expect(topic.planned).toBeUndefined();
    }
    for (const topic of groups) {
      expect(topic.algorithms.length).toBeGreaterThan(1);
    }

    const graphBasics = topics.find((topic) => topic.id === 'graph-basics');
    const shellSort = topics.find((topic) => topic.id === 'shell-sort');
    expect(graphBasics?.kind).toBe('concept');
    expect(shellSort?.kind).toBe('planned');
    expect(topics.every((topic) => topic.kind !== undefined)).toBe(true);
  });

  it('maps the current algorithm to one chapter/topic path', () => {
    expect(textbookPathFor(catalog, 'bubble')).toEqual({ chapterId: 'ch9-sort', topicId: 'bubble-sort' });
    expect(textbookPathFor(catalog, 'dijkstra')).toEqual({
      chapterId: 'ch7-graph',
      topicId: 'shortest-path',
    });
    expect(textbookPathFor(catalog, 'bst')).toEqual({ chapterId: 'ch8-search', topicId: 'bst' });
    expect(textbookPathFor(catalog, 'avl')).toEqual({ chapterId: 'ch8-search', topicId: 'avl' });
    expect(textbookPathFor(catalog, 'factorial')).toEqual({
      chapterId: 'ch2-algorithm',
      topicId: 'recursion-extension',
    });
    expect(textbookPathFor(catalog, 'scc')).toEqual({
      chapterId: 'ch7-graph',
      topicId: 'graph-connectivity',
    });
    expect(textbookPathFor(catalog, 'missing')).toBeNull();
    expect(findTextbookPath(nav, 'bubble')).toEqual({ chapterId: 'ch9-sort', topicId: 'bubble-sort' });
  });

  it('keeps an explicit extension chapter for AI imports and appends unknown future ids', () => {
    const withCustom = {
      ...catalog,
      custom: {
        ...catalog.bubble,
        group: 'custom' as const,
        name: ['自定义算法', 'Custom algorithm'] as [string, string],
      },
    };
    const withCustomNav = buildTextbookNavigation(withCustom);
    expect(withCustomNav).toHaveLength(10);
    const extension = withCustomNav.at(-1)!;
    expect(extension.id).toBe('ext');
    expect(extension.extension).toBe(true);
    expect(extension.topics.find((topic) => topic.id === 'custom')?.algorithms[0].id).toBe('custom');

    const futureNav = buildTextbookNavigation({
      ...catalog,
      future: {
        ...catalog.bubble,
        name: ['未来算法', 'Future algorithm'] as [string, string],
      },
    });
    expect(futureNav.at(-1)?.topics.find((topic) => topic.id === 'unclassified')?.algorithms[0].id).toBe(
      'future',
    );
    expect(textbookAlgorithmIds(futureNav)).toContain('future');
  });

  it('has bilingual chapter and topic labels for every authored row', () => {
    for (const chapter of TEXTBOOK_CHAPTERS) {
      expect(textbookTitle(chapter.title, 'zh')).toBeTruthy();
      expect(textbookTitle(chapter.title, 'en')).toBeTruthy();
      expect(textbookTitle(chapter.shortTitle, 'zh')).toBeTruthy();
      expect(textbookTitle(chapter.shortTitle, 'en')).toBeTruthy();
      for (const topic of chapter.topics) {
        expect(textbookTitle(topic.title, 'zh')).toBeTruthy();
        expect(textbookTitle(topic.title, 'en')).toBeTruthy();
      }
    }
  });
});

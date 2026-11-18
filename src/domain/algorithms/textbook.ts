import type { Lang } from '../../i18n/types';
import type { AlgorithmCatalog } from './types';

/**
 * UX-03 — textbook directory.
 *
 * The navigation is authored here, once, as data:
 *   chapter (《大话数据结构》 order) → topic → algorithm ids.
 *
 * The React sidebar never hard-codes an algorithm name. It reads the generated
 * registry for icons, localized names and the actual algorithm ids, then builds
 * the tree below. A runtime algorithm that is not in this table (currently only
 * `custom`, created by AI import) still lands in the explicit extension chapter,
 * so an import can never disappear from the directory.
 *
 * Reference edition (fixed before the navigation was written):
 *   程杰《大话数据结构》，清华大学出版社，2011 年 6 月第 1 版。
 *
 * Only the chapter/topic organisation is borrowed. No textbook prose, figures
 * or exercises are copied. Topics with no shipped algorithm are marked
 * `planned` and have no clickable target.
 */

export interface TextbookTitle {
  zh: string;
  en: string;
}

export interface TextbookAlgorithmRef {
  id: string;
  /** Implemented, but not part of the book's core text (shown with a badge). */
  extension?: boolean;
}

export interface TextbookTopic {
  id: string;
  title: TextbookTitle;
  algorithms: TextbookAlgorithmRef[];
  /**
   * Knowledge explanation. Such a topic is never a runnable animation; it may
   * still be awaiting its lesson page, so the sidebar shows the concept type and
   * a pending status instead of inventing an algorithm target.
   */
  concept?: boolean;
  /** Planned algorithm demonstration whose implementation is not shipped yet. */
  planned?: boolean;
  /** Whole topic is an extension beyond the book's core sequence. */
  extension?: boolean;
}

export interface TextbookChapter {
  id: string;
  /** 1–9 for the book chapters; 0 for the extension chapter. */
  number: number;
  title: TextbookTitle;
  shortTitle: TextbookTitle;
  topics: TextbookTopic[];
  /** Not one of the nine book chapters. */
  extension?: boolean;
}

export const TEXTBOOK_REFERENCE = {
  title: { zh: '大话数据结构', en: 'Da Hua Data Structures' },
  author: '程杰',
  publisher: { zh: '清华大学出版社', en: 'Tsinghua University Press' },
  edition: { zh: '2011 年 6 月第 1 版', en: '1st edition, June 2011' },
} as const;

export const TEXTBOOK_CHAPTERS: TextbookChapter[] = [
  {
    id: 'ch1-intro',
    number: 1,
    title: { zh: '数据结构绪论', en: 'Introduction to data structures' },
    shortTitle: { zh: '绪论', en: 'Introduction' },
    topics: [
      {
        id: 'intro-concepts',
        title: { zh: '数据结构的基本概念', en: 'Basic concepts' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'intro-logical-physical',
        title: { zh: '逻辑结构与物理结构', en: 'Logical and physical structures' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'intro-adt',
        title: { zh: '抽象数据类型', en: 'Abstract data types' },
        algorithms: [],
        concept: true,
      },
    ],
  },
  {
    id: 'ch2-algorithm',
    number: 2,
    title: { zh: '算法', en: 'Algorithms' },
    shortTitle: { zh: '算法', en: 'Algorithms' },
    topics: [
      {
        id: 'algorithm-definition',
        title: { zh: '算法的定义与特性', en: 'Definition and properties' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'algorithm-efficiency',
        title: { zh: '算法效率的度量', en: 'Measuring algorithm efficiency' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'recursion-extension',
        title: { zh: '递归算法', en: 'Recursive algorithms' },
        algorithms: [
          { id: 'factorial', extension: true },
          { id: 'fib', extension: true },
        ],
        extension: true,
      },
    ],
  },
  {
    id: 'ch3-linear',
    number: 3,
    title: { zh: '线性表', en: 'Linear lists' },
    shortTitle: { zh: '线性表', en: 'Linear lists' },
    topics: [
      {
        id: 'linear-basics',
        title: { zh: '线性表的定义与抽象数据类型', en: 'Definition and ADT' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'sequential-list',
        title: { zh: '线性表的顺序存储结构', en: 'Sequential storage' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'linked-list',
        title: { zh: '单链表', en: 'Singly linked list' },
        algorithms: [{ id: 'linked' }],
      },
      {
        id: 'static-linked-list',
        title: { zh: '静态链表', en: 'Static linked list' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'circular-linked-list',
        title: { zh: '循环链表', en: 'Circular linked list' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'doubly-linked-list',
        title: { zh: '双向链表', en: 'Doubly linked list' },
        algorithms: [],
        concept: true,
      },
    ],
  },
  {
    id: 'ch4-stack-queue',
    number: 4,
    title: { zh: '栈与队列', en: 'Stacks and queues' },
    shortTitle: { zh: '栈与队列', en: 'Stacks & queues' },
    topics: [
      {
        id: 'stack-basics',
        title: { zh: '栈的定义与实现', en: 'Stack definition and implementation' },
        algorithms: [{ id: 'stack' }],
      },
      {
        id: 'stack-recursion',
        title: { zh: '栈的应用——递归', en: 'Stack application: recursion' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'queue-basics',
        title: { zh: '队列的定义与实现', en: 'Queue definition and implementation' },
        algorithms: [{ id: 'queue' }],
      },
      {
        id: 'circular-queue',
        title: { zh: '循环队列', en: 'Circular queue' },
        algorithms: [],
        concept: true,
      },
    ],
  },
  {
    id: 'ch5-string',
    number: 5,
    title: { zh: '串', en: 'Strings' },
    shortTitle: { zh: '串', en: 'Strings' },
    topics: [
      {
        id: 'string-basics',
        title: { zh: '串的定义、比较与抽象数据类型', en: 'Definition, comparison and ADT' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'string-storage',
        title: { zh: '串的存储结构', en: 'String storage structures' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'naive-match',
        title: { zh: '朴素的模式匹配算法', en: 'Naive pattern matching' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'kmp',
        title: { zh: 'KMP 模式匹配算法', en: 'KMP pattern matching' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch6-tree',
    number: 6,
    title: { zh: '树', en: 'Trees' },
    shortTitle: { zh: '树', en: 'Trees' },
    topics: [
      {
        id: 'tree-basics',
        title: { zh: '树的定义与存储结构', en: 'Tree definition and storage' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'binary-tree',
        title: { zh: '二叉树的性质与存储结构', en: 'Binary tree properties and storage' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'binary-tree-traversal',
        title: { zh: '遍历二叉树', en: 'Binary tree traversal' },
        algorithms: [{ id: 'inorder' }],
      },
      {
        id: 'threaded-tree',
        title: { zh: '线索二叉树', en: 'Threaded binary tree' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'forest-conversion',
        title: { zh: '树、森林与二叉树的转换', en: 'Tree, forest and binary tree conversion' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'huffman',
        title: { zh: '赫夫曼树及其应用', en: 'Huffman trees and applications' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch7-graph',
    number: 7,
    title: { zh: '图', en: 'Graphs' },
    shortTitle: { zh: '图', en: 'Graphs' },
    topics: [
      {
        id: 'graph-basics',
        title: { zh: '图的基本概念', en: 'Graph fundamentals' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'graph-storage',
        title: { zh: '图的存储结构', en: 'Graph storage structures' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'graph-traversal',
        title: { zh: '图的遍历', en: 'Graph traversal' },
        algorithms: [{ id: 'bfs' }, { id: 'dfs' }],
      },
      {
        id: 'mst',
        title: { zh: '最小生成树', en: 'Minimum spanning tree' },
        algorithms: [{ id: 'prim' }, { id: 'kruskal' }],
      },
      {
        id: 'shortest-path',
        title: { zh: '最短路径', en: 'Shortest paths' },
        algorithms: [
          { id: 'dijkstra' },
          { id: 'floyd-warshall' },
          { id: 'bellman-ford', extension: true },
        ],
      },
      {
        id: 'topological',
        title: { zh: '拓扑排序', en: 'Topological sort' },
        algorithms: [{ id: 'topological' }],
      },
      {
        id: 'critical-path',
        title: { zh: '关键路径', en: 'Critical path' },
        algorithms: [{ id: 'critical-path' }],
      },
      {
        id: 'graph-connectivity',
        title: { zh: '图的连通性', en: 'Graph connectivity' },
        algorithms: [{ id: 'components' }, { id: 'scc' }],
        extension: true,
      },
    ],
  },
  {
    id: 'ch8-search',
    number: 8,
    title: { zh: '查找', en: 'Searching' },
    shortTitle: { zh: '查找', en: 'Searching' },
    topics: [
      {
        id: 'sequential-search',
        title: { zh: '顺序表查找', en: 'Sequential-table search' },
        algorithms: [{ id: 'linear' }],
      },
      {
        id: 'ordered-search',
        title: { zh: '有序表查找', en: 'Ordered-table search' },
        algorithms: [{ id: 'binary' }],
      },
      {
        id: 'indexed-search',
        title: { zh: '线性索引查找', en: 'Linear index search' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'bst',
        title: { zh: '二叉排序树', en: 'Binary sort tree' },
        algorithms: [{ id: 'bst' }],
      },
      {
        id: 'avl',
        title: { zh: '平衡二叉树（AVL）', en: 'Balanced binary tree (AVL)' },
        algorithms: [{ id: 'avl' }],
      },
      {
        id: 'multiway-tree',
        title: { zh: '多路查找树', en: 'Multiway search tree' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'hash-search',
        title: { zh: '散列表查找', en: 'Hash-table search' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch9-sort',
    number: 9,
    title: { zh: '排序', en: 'Sorting' },
    shortTitle: { zh: '排序', en: 'Sorting' },
    topics: [
      {
        id: 'sort-basics',
        title: { zh: '排序的基本概念与分类', en: 'Sorting concepts and classification' },
        algorithms: [],
        concept: true,
      },
      {
        id: 'bubble-sort',
        title: { zh: '冒泡排序', en: 'Bubble sort' },
        algorithms: [{ id: 'bubble' }],
      },
      {
        id: 'selection-sort',
        title: { zh: '简单选择排序', en: 'Simple selection sort' },
        algorithms: [{ id: 'selection' }],
      },
      {
        id: 'insertion-sort',
        title: { zh: '直接插入排序', en: 'Direct insertion sort' },
        algorithms: [{ id: 'insertion' }],
      },
      {
        id: 'shell-sort',
        title: { zh: '希尔排序', en: 'Shell sort' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'heap-sort',
        title: { zh: '堆排序', en: 'Heap sort' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'merge-sort',
        title: { zh: '归并排序', en: 'Merge sort' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'quick-sort',
        title: { zh: '快速排序', en: 'Quicksort' },
        algorithms: [{ id: 'quick' }],
      },
    ],
  },
  {
    id: 'ext',
    number: 0,
    title: { zh: '扩展算法', en: 'Extended algorithms' },
    shortTitle: { zh: '扩展', en: 'Extras' },
    extension: true,
    topics: [
      {
        id: 'custom',
        title: { zh: 'AI 自定义算法', en: 'AI-imported algorithms' },
        algorithms: [{ id: 'custom', extension: true }],
        extension: true,
      },
    ],
  },
];

export interface TextbookAlgorithmNode {
  id: string;
  extension: boolean;
}

/**
 * The rendered row type. It is derived from authored semantics plus the live
 * child count, never from a hard-coded algorithm name:
 *   concept   knowledge explanation, no animation target
 *   planned   planned algorithm demonstration, not implemented yet
 *   algorithm one shipped algorithm, shown as a direct entry
 *   group     several shipped algorithms, keeps its disclosure
 */
export type TextbookTopicKind = 'concept' | 'planned' | 'algorithm' | 'group';

export interface TextbookTopicView extends TextbookTopic {
  algorithms: TextbookAlgorithmNode[];
  kind: TextbookTopicKind;
}

export interface TextbookChapterView extends Omit<TextbookChapter, 'topics'> {
  topics: TextbookTopicView[];
  algorithmCount: number;
}

export function textbookTitle(title: TextbookTitle, lang: Lang): string {
  return lang === 'zh' ? title.zh : title.en;
}

/**
 * UX-03B: collapse a one-algorithm topic into a direct row, while keeping every
 * multi-algorithm topic as a disclosure. The authored `concept` / `planned`
 * flags carry semantics; the live child count carries the structural decision.
 */
function textbookTopicKind(
  topic: TextbookTopic,
  algorithms: readonly TextbookAlgorithmNode[],
): TextbookTopicKind {
  if (topic.concept) return 'concept';
  if (topic.planned) return 'planned';
  if (algorithms.length === 1) return 'algorithm';
  if (algorithms.length > 1) return 'group';
  return 'planned';
}

/**
 * Composes the authored table with the live registry.
 *
 * Rules:
 * - ids are resolved in chapter → topic order; the first occurrence owns the id;
 * - `planned` topics keep no algorithm target at all;
 * - every registered id not mentioned in the table is appended to the explicit
 *   extension chapter under "Other algorithms", never silently dropped.
 */
export function buildTextbookNavigation(catalog: AlgorithmCatalog): TextbookChapterView[] {
  const mapped = new Set<string>();
  const chapters: TextbookChapterView[] = [];

  for (const chapter of TEXTBOOK_CHAPTERS) {
    const topics: TextbookTopicView[] = chapter.topics.map((topic) => {
      const algorithms: TextbookAlgorithmNode[] = [];
      for (const ref of topic.algorithms) {
        if (!catalog[ref.id] || mapped.has(ref.id)) continue;
        mapped.add(ref.id);
        algorithms.push({ id: ref.id, extension: ref.extension === true });
      }
      return { ...topic, algorithms, kind: textbookTopicKind(topic, algorithms) };
    });

    if (chapter.extension && topics.every((topic) => topic.algorithms.length === 0)) continue;

    chapters.push({
      ...chapter,
      topics,
      algorithmCount: topics.reduce((total, topic) => total + topic.algorithms.length, 0),
    });
  }

  const unmapped = Object.keys(catalog).filter((id) => !mapped.has(id));
  if (unmapped.length > 0) {
    let extension = chapters.find((chapter) => chapter.id === 'ext');
    if (!extension) {
      const extensionConfig = TEXTBOOK_CHAPTERS.find((chapter) => chapter.extension);
      if (extensionConfig) {
        extension = { ...extensionConfig, topics: [], algorithmCount: 0 };
        chapters.push(extension);
      }
    }
    if (extension) {
      extension.topics.push({
        id: 'unclassified',
        title: { zh: '其他算法', en: 'Other algorithms' },
        algorithms: unmapped.map((id) => ({ id, extension: true })),
        kind: unmapped.length === 1 ? 'algorithm' : 'group',
        extension: true,
      });
      extension.algorithmCount += unmapped.length;
    }
  }

  return chapters;
}

export interface TextbookPath {
  chapterId: string;
  topicId: string;
}

/** The one primary home of an algorithm in the directory. */
export function findTextbookPath(
  chapters: TextbookChapterView[],
  algorithmId: string,
): TextbookPath | null {
  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      if (topic.algorithms.some((algorithm) => algorithm.id === algorithmId)) {
        return { chapterId: chapter.id, topicId: topic.id };
      }
    }
  }
  return null;
}

/** Convenience for callers that only need the current path once. */
export function textbookPathFor(catalog: AlgorithmCatalog, algorithmId: string): TextbookPath | null {
  return findTextbookPath(buildTextbookNavigation(catalog), algorithmId);
}

/** All algorithm ids reachable in the rendered directory. */
export function textbookAlgorithmIds(chapters: TextbookChapterView[]): string[] {
  return chapters.flatMap((chapter) =>
    chapter.topics.flatMap((topic) => topic.algorithms.map((algorithm) => algorithm.id)),
  );
}

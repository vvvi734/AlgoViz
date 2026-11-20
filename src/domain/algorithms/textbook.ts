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
 * the tree below. Runtime algorithms are always registered here; the directory
 * never depends on imported or user-generated content.
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
  /** Concept lesson id, when a static teaching page has been authored. */
  conceptId?: string;
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
        conceptId: 'data-structure-basics',
      },
      {
        id: 'intro-logical-physical',
        title: { zh: '逻辑结构与物理结构', en: 'Logical and physical structures' },
        algorithms: [],
        concept: true,
        conceptId: 'storage-structures',
      },
      {
        id: 'intro-adt',
        title: { zh: '抽象数据类型', en: 'Abstract data types' },
        algorithms: [],
        concept: true,
        conceptId: 'adt',
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
        conceptId: 'complexity',
      },
      {
        id: 'algorithm-cases',
        title: { zh: '最好、平均与最坏', en: 'Best, average and worst' },
        algorithms: [],
        concept: true,
        conceptId: 'algorithm-cases',
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
        title: { zh: '线性表：定义与操作', en: 'Definition and operations' },
        algorithms: [],
        concept: true,
        conceptId: 'linear-list',
      },
      {
        id: 'sequential-list',
        title: { zh: '顺序表（顺序存储结构）', en: 'Sequential list (sequential storage)' },
        algorithms: [{ id: 'seqlist' }],
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
        algorithms: [{ id: 'circular' }],
      },
      {
        id: 'doubly-linked-list',
        title: { zh: '双向链表', en: 'Doubly linked list' },
        algorithms: [{ id: 'doubly' }],
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
        id: 'stack-queue-storage',
        title: { zh: '栈与队列的存储结构', en: 'Storage structures for stacks and queues' },
        algorithms: [],
        concept: true,
        conceptId: 'stack-queue-storage',
      },
      {
        id: 'circular-queue',
        title: { zh: '循环队列', en: 'Circular queue' },
        algorithms: [],
        concept: true,
        conceptId: 'circular-queue',
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
        title: { zh: '串的定义与模式匹配基础', en: 'Strings and the foundations of pattern matching' },
        algorithms: [],
        concept: true,
        conceptId: 'string-basics',
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
        algorithms: [{ id: 'kmp' }],
      },
    ],
  },
  {
    id: 'ch5-array',
    number: 0,
    title: { zh: '数组与矩阵', en: 'Arrays and matrices' },
    shortTitle: { zh: '数组与矩阵', en: 'Arrays & matrices' },
    extension: true,
    topics: [
      {
        id: 'array-basics',
        title: { zh: '数组与多维数组', en: 'Arrays and multidimensional arrays' },
        algorithms: [],
        concept: true,
        conceptId: 'array-basics',
      },
      {
        id: 'special-matrices',
        title: { zh: '特殊矩阵的压缩存储', en: 'Compressed storage for special matrices' },
        algorithms: [],
        concept: true,
        conceptId: 'special-matrices',
      },
      {
        id: 'sparse-matrix',
        title: { zh: '稀疏矩阵与三元组', en: 'Sparse matrices and triplets' },
        algorithms: [],
        concept: true,
        conceptId: 'sparse-matrix',
      },
      {
        id: 'sparse-transpose',
        title: { zh: '稀疏矩阵快速转置', en: 'Fast transpose of a sparse matrix' },
        algorithms: [{ id: 'sparse-transpose' }],
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
        title: { zh: '树的存储结构', en: 'Tree storage structures' },
        algorithms: [],
        concept: true,
        conceptId: 'tree-storage',
      },
      {
        id: 'binary-tree',
        title: { zh: '二叉树的性质与存储结构', en: 'Binary tree properties and storage' },
        algorithms: [],
        concept: true,
        conceptId: 'tree-terms',
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
        conceptId: 'threaded-binary-tree',
      },
      {
        id: 'forest-conversion',
        title: { zh: '树、森林与二叉树的转换', en: 'Tree, forest and binary tree conversion' },
        algorithms: [],
        concept: true,
        conceptId: 'forest-conversion',
      },
      {
        id: 'huffman',
        title: { zh: '哈夫曼树与哈夫曼编码', en: 'Huffman trees and Huffman coding' },
        algorithms: [{ id: 'huffman' }],
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
        conceptId: 'graph-basics',
      },
      {
        id: 'graph-storage',
        title: { zh: '图的存储结构', en: 'Graph storage structures' },
        algorithms: [],
        concept: true,
        conceptId: 'graph-storage',
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
        id: 'search-asl',
        title: { zh: '平均查找长度与判定树', en: 'Average search length and decision trees' },
        algorithms: [],
        concept: true,
        conceptId: 'asl-decision-tree',
      },
      {
        id: 'indexed-search',
        title: { zh: '分块查找（索引顺序查找）', en: 'Block search (indexed sequential search)' },
        algorithms: [],
        concept: true,
        conceptId: 'indexed-search',
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
        title: { zh: 'B 树（B-Tree）', en: 'B-tree' },
        algorithms: [],
        concept: true,
        conceptId: 'b-tree',
      },
      {
        id: 'bplus-tree',
        title: { zh: 'B+ 树（B+ Tree）', en: 'B+ tree' },
        algorithms: [],
        concept: true,
        conceptId: 'b-plus-tree',
      },
      {
        id: 'btree-demo',
        title: { zh: 'B 树查找与插入', en: 'B-tree search and insertion' },
        algorithms: [{ id: 'btree' }],
      },
      {
        id: 'hash-search',
        title: { zh: '散列表查找', en: 'Hash-table search' },
        algorithms: [{ id: 'hash-chain' }, { id: 'hash-probe' }],
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
        title: { zh: '排序基础与分类', en: 'Sorting basics and classification' },
        algorithms: [],
        concept: true,
        conceptId: 'sorting-basics',
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
        algorithms: [{ id: 'shell' }],
      },
      {
        id: 'heap-sort',
        title: { zh: '堆排序', en: 'Heap sort' },
        algorithms: [{ id: 'heap' }],
      },
      {
        id: 'merge-sort',
        title: { zh: '归并排序', en: 'Merge sort' },
        algorithms: [{ id: 'merge' }],
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
    topics: [],
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

/**
 * Directory classification, derived from authored semantics rather than from
 * whether a page happens to contain an SVG. A concept page with a lesson is a
 * theory topic; only a shipped algorithm/group is a visual topic. Planned and
 * still-unbound concept slots stay pending.
 */
export type TextbookTopicCategory = 'theory' | 'visual' | 'pending';

export interface TextbookTopicView extends TextbookTopic {
  algorithms: TextbookAlgorithmNode[];
  kind: TextbookTopicKind;
  category: TextbookTopicCategory;
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
 * Keep the two axes explicit: `kind` describes the row structure, while
 * `category` describes how the student should read it. A concept slot without
 * a lesson is not a theory page yet; an authored static SVG does not turn it
 * into a visual algorithm either.
 */
export function textbookTopicCategory(
  topic: TextbookTopic,
  kind: TextbookTopicKind,
): TextbookTopicCategory {
  if (kind === 'concept') return topic.conceptId ? 'theory' : 'pending';
  if (kind === 'algorithm' || kind === 'group') return 'visual';
  return 'pending';
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
      const kind = textbookTopicKind(topic, algorithms);
      return {
        ...topic,
        algorithms,
        kind,
        category: textbookTopicCategory(topic, kind),
      };
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
      const extensionConfig =
        TEXTBOOK_CHAPTERS.find((chapter) => chapter.id === 'ext') ??
        TEXTBOOK_CHAPTERS.find((chapter) => chapter.extension);
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
        category: 'visual',
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

/** The chapter/topic path for an authored concept lesson. */
export function findConceptPath(
  chapters: TextbookChapterView[],
  conceptId: string,
): TextbookPath | null {
  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      if (topic.conceptId === conceptId) {
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

import type { Lang } from '../../i18n/types';
import type { AlgorithmCatalog } from './types';

/**
 * TEXTBOOK-01 — textbook directory.
 *
 * The navigation is authored here, once, as data:
 *   chapter → section/topic → algorithm ids.
 *
 * Reference edition (fixed for this directory):
 *   严蔚敏、吴伟民《数据结构（C语言版）》，清华大学出版社，1997 年 4 月第 1 版。
 *
 * The twelve chapters follow the book's knowledge structure. Only chapter and
 * section organisation is borrowed; no textbook prose, figures or exercises are
 * copied. Sections with no shipped teaching page/algorithm are explicit
 * `planned` or `concept` rows and never invent a runnable target.
 *
 * Existing learner preferences and deep links may still contain the old
 * 《大话数据结构》 chapter ids. `migrateTextbookId` keeps those ids readable while
 * every authored row below uses the new twelve-chapter ids. Algorithm ids and
 * concept ids are unchanged.
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
  /** 1–12 for the book chapters. Extension chapters are hidden from the nav. */
  number: number;
  title: TextbookTitle;
  shortTitle: TextbookTitle;
  topics: TextbookTopic[];
  /** Not one of the twelve book chapters. */
  extension?: boolean;
}

export const TEXTBOOK_REFERENCE = {
  title: { zh: '数据结构（C语言版）', en: 'Data Structures (C Language Edition)' },
  author: '严蔚敏、吴伟民',
  publisher: { zh: '清华大学出版社', en: 'Tsinghua University Press' },
  edition: { zh: '1997 年 4 月第 1 版', en: '1st edition, April 1997' },
} as const;

/**
 * Compatibility bridge for chapter ids persisted before TEXTBOOK-01.
 * The old directory used 《大话数据结构》's nine chapters; these ids may still be
 * present in `algolens-sidebar` or in an old deep link. Resolve them to the
 * chapter that now owns the same course content.
 */
export const LEGACY_CHAPTER_ID_MAP: Readonly<Record<string, string>> = {
  'ch2-algorithm': 'ch1-intro',
  'ch3-linear': 'ch2-linear',
  'ch4-stack-queue': 'ch3-stack-queue',
  'ch5-string': 'ch4-string',
  'ch8-search': 'ch9-search',
  'ch9-sort': 'ch10-sort',
};

/** The old recursion slot now lives under 3.3 栈与递归的实现. */
export const LEGACY_TOPIC_ID_MAP: Readonly<Record<string, string>> = {
  'recursion-extension': 'recursion-examples',
};

export function migrateTextbookId(id: string): string {
  return LEGACY_CHAPTER_ID_MAP[id] ?? id;
}

export function migrateTextbookTopicId(id: string): string {
  return LEGACY_TOPIC_ID_MAP[id] ?? id;
}

export const TEXTBOOK_CHAPTERS: TextbookChapter[] = [
  {
    id: 'ch1-intro',
    number: 1,
    title: { zh: '绪论', en: 'Introduction' },
    shortTitle: { zh: '绪论', en: 'Introduction' },
    topics: [
      {
        id: 'intro-concepts',
        title: { zh: '数据结构的基本概念', en: 'Basic concepts of data structures' },
        algorithms: [],
        concept: true,
        conceptId: 'data-structure-basics',
      },
      {
        id: 'intro-logical-physical',
        title: { zh: '逻辑结构与存储结构', en: 'Logical and storage structures' },
        algorithms: [],
        concept: true,
        conceptId: 'storage-structures',
      },
      {
        id: 'intro-adt',
        title: { zh: '抽象数据类型的表示与实现', en: 'Abstract data types' },
        algorithms: [],
        concept: true,
        conceptId: 'adt',
      },
      {
        id: 'algorithm-definition',
        title: { zh: '算法和算法分析：算法', en: 'Algorithms: definition and properties' },
        algorithms: [],
        concept: true,
        conceptId: 'algorithm-definition',
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
        title: { zh: '最好、平均与最坏情况', en: 'Best, average and worst cases' },
        algorithms: [],
        concept: true,
        conceptId: 'algorithm-cases',
      },
    ],
  },
  {
    id: 'ch2-linear',
    number: 2,
    title: { zh: '线性表', en: 'Linear lists' },
    shortTitle: { zh: '线性表', en: 'Linear lists' },
    topics: [
      {
        id: 'linear-basics',
        title: { zh: '线性表的类型定义', en: 'Definition of the linear-list type' },
        algorithms: [],
        concept: true,
        conceptId: 'linear-list',
      },
      {
        id: 'sequential-list',
        title: { zh: '线性表的顺序表示和实现', en: 'Sequential representation and implementation' },
        algorithms: [{ id: 'seqlist' }],
      },
      {
        id: 'sequential-capacity',
        title: { zh: '顺序表的容量与动态扩容', en: 'Sequential-list capacity and dynamic growth' },
        algorithms: [],
        concept: true,
        conceptId: 'sequential-list-capacity',
      },
      {
        id: 'linked-list',
        title: { zh: '线性链表', en: 'Linked list' },
        algorithms: [{ id: 'linked' }],
      },
      {
        id: 'static-linked-list',
        title: { zh: '静态链表', en: 'Static linked list' },
        algorithms: [],
        concept: true,
        conceptId: 'static-linked-list',
      },
      {
        id: 'static-linked-operations',
        title: { zh: '静态链表的操作', en: 'Static linked-list operations' },
        algorithms: [{ id: 'static-linked-list' }],
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
      {
        id: 'polynomial-add',
        title: { zh: '一元多项式的表示及相加', en: 'Polynomial representation and addition' },
        algorithms: [{ id: 'polynomial-add' }],
      },
    ],
  },
  {
    id: 'ch3-stack-queue',
    number: 3,
    title: { zh: '栈和队列', en: 'Stacks and queues' },
    shortTitle: { zh: '栈和队列', en: 'Stacks & queues' },
    topics: [
      {
        id: 'stack-basics',
        title: { zh: '栈的表示和实现', en: 'Stack representation and implementation' },
        algorithms: [{ id: 'stack' }],
      },
      {
        id: 'stack-applications',
        title: { zh: '栈的应用举例', en: 'Stack applications' },
        algorithms: [
          { id: 'infix-to-postfix' },
          { id: 'postfix-eval' },
        ],
      },
      {
        id: 'stack-recursion',
        title: { zh: '栈与递归的实现', en: 'Stacks and recursive calls' },
        algorithms: [],
        concept: true,
        conceptId: 'stack-recursion',
      },
      {
        id: 'recursion-examples',
        title: { zh: '递归调用的执行过程', en: 'Execution of recursive calls' },
        algorithms: [
          { id: 'factorial', extension: true },
          { id: 'fib', extension: true },
        ],
      },
      {
        id: 'queue-basics',
        title: { zh: '队列的表示和实现', en: 'Queue representation and implementation' },
        algorithms: [{ id: 'queue' }],
      },
      {
        id: 'circular-queue',
        title: { zh: '循环队列', en: 'Circular queue' },
        algorithms: [],
        concept: true,
        conceptId: 'circular-queue',
      },
      {
        id: 'stack-queue-storage',
        title: { zh: '栈与队列的存储结构', en: 'Storage structures for stacks and queues' },
        algorithms: [],
        concept: true,
        conceptId: 'stack-queue-storage',
      },
    ],
  },
  {
    id: 'ch4-string',
    number: 4,
    title: { zh: '串', en: 'Strings' },
    shortTitle: { zh: '串', en: 'Strings' },
    topics: [
      {
        id: 'string-basics',
        title: { zh: '串类型的定义', en: 'Definition of the string type' },
        algorithms: [],
        concept: true,
        conceptId: 'string-basics',
      },
      {
        id: 'string-storage',
        title: { zh: '串的表示和实现', en: 'String representation and implementation' },
        algorithms: [],
        concept: true,
        conceptId: 'string-storage',
      },
      {
        id: 'naive-match',
        title: { zh: '朴素的模式匹配算法', en: 'Naive pattern matching' },
        algorithms: [],
        concept: true,
        conceptId: 'naive-matching',
      },
      {
        id: 'kmp',
        title: { zh: 'KMP 模式匹配算法', en: 'KMP pattern matching' },
        algorithms: [{ id: 'kmp' }],
      },
      {
        id: 'string-applications',
        title: { zh: '串操作应用举例', en: 'String applications' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch5-array',
    number: 5,
    title: { zh: '数组和广义表', en: 'Arrays and generalized lists' },
    shortTitle: { zh: '数组和广义表', en: 'Arrays & generalized lists' },
    topics: [
      {
        id: 'array-basics',
        title: { zh: '数组的定义与顺序表示', en: 'Array definition and sequential representation' },
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
        title: { zh: '稀疏矩阵', en: 'Sparse matrices' },
        algorithms: [],
        concept: true,
        conceptId: 'sparse-matrix',
      },
      {
        id: 'sparse-transpose',
        title: { zh: '稀疏矩阵的快速转置', en: 'Fast transpose of a sparse matrix' },
        algorithms: [{ id: 'sparse-transpose' }],
      },
      {
        id: 'generalized-list',
        title: { zh: '广义表的定义与存储结构', en: 'Generalized lists: definition and storage' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'm-variable-polynomial',
        title: { zh: 'm 元多项式的表示', en: 'Representing polynomials in m variables' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch6-tree',
    number: 6,
    title: { zh: '树和二叉树', en: 'Trees and binary trees' },
    shortTitle: { zh: '树和二叉树', en: 'Trees & binary trees' },
    topics: [
      {
        id: 'tree-basics',
        title: { zh: '树的定义、术语与存储结构', en: 'Tree terms and storage structures' },
        algorithms: [],
        concept: true,
        conceptId: 'tree-storage',
      },
      {
        id: 'binary-tree',
        title: { zh: '二叉树的定义、性质与存储结构', en: 'Binary trees: definition, properties and storage' },
        algorithms: [],
        concept: true,
        conceptId: 'tree-terms',
      },
      {
        id: 'binary-tree-traversal',
        title: { zh: '遍历二叉树', en: 'Binary-tree traversal' },
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
        title: { zh: '树、森林与二叉树的转换', en: 'Tree, forest and binary-tree conversion' },
        algorithms: [],
        concept: true,
        conceptId: 'forest-conversion',
      },
      {
        id: 'huffman',
        title: { zh: '赫夫曼树及其应用', en: 'Huffman trees and coding' },
        algorithms: [{ id: 'huffman' }],
      },
      {
        id: 'backtracking-tree',
        title: { zh: '回溯法与树的遍历', en: 'Backtracking and tree traversal' },
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
        title: { zh: '图的定义和术语', en: 'Graph definition and terminology' },
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
        id: 'graph-connectivity',
        title: { zh: '图的连通性问题', en: 'Graph connectivity' },
        algorithms: [{ id: 'components' }, { id: 'scc' }],
      },
      {
        id: 'mst',
        title: { zh: '最小生成树', en: 'Minimum spanning tree' },
        algorithms: [{ id: 'prim' }, { id: 'kruskal' }],
      },
      {
        id: 'topological',
        title: { zh: '有向无环图：拓扑排序', en: 'DAG: topological sort' },
        algorithms: [{ id: 'topological' }],
      },
      {
        id: 'critical-path',
        title: { zh: '有向无环图：关键路径', en: 'DAG: critical path' },
        algorithms: [{ id: 'critical-path' }],
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
    ],
  },
  {
    id: 'ch8-dynamic-storage',
    number: 8,
    title: { zh: '动态存储管理', en: 'Dynamic storage management' },
    shortTitle: { zh: '动态存储管理', en: 'Dynamic storage' },
    topics: [
      {
        id: 'dynamic-storage-overview',
        title: { zh: '概述', en: 'Overview' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'free-space-list',
        title: { zh: '可利用空间表及分配方法', en: 'Free-space lists and allocation' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'boundary-tag',
        title: { zh: '边界标识法', en: 'Boundary-tag method' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'buddy-system',
        title: { zh: '伙伴系统', en: 'Buddy system' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'garbage-collection',
        title: { zh: '无用单元收集', en: 'Garbage collection' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'storage-compaction',
        title: { zh: '存储紧缩', en: 'Storage compaction' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch9-search',
    number: 9,
    title: { zh: '查找', en: 'Searching' },
    shortTitle: { zh: '查找', en: 'Searching' },
    topics: [
      {
        id: 'sequential-search',
        title: { zh: '静态查找表：顺序表的查找', en: 'Static search: sequential search' },
        algorithms: [{ id: 'linear' }],
      },
      {
        id: 'ordered-search',
        title: { zh: '静态查找表：有序表的查找', en: 'Static search: ordered-table search' },
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
        title: { zh: '静态查找表：索引顺序表的查找', en: 'Static search: indexed sequential search' },
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
        title: { zh: 'B 树', en: 'B-tree' },
        algorithms: [],
        concept: true,
        conceptId: 'b-tree',
      },
      {
        id: 'bplus-tree',
        title: { zh: 'B+ 树', en: 'B+ tree' },
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
        title: { zh: '哈希表', en: 'Hash tables' },
        algorithms: [{ id: 'hash-chain' }, { id: 'hash-probe' }],
      },
    ],
  },
  {
    id: 'ch10-sort',
    number: 10,
    title: { zh: '内部排序', en: 'Internal sorting' },
    shortTitle: { zh: '内部排序', en: 'Internal sorting' },
    topics: [
      {
        id: 'sort-basics',
        title: { zh: '概述', en: 'Overview' },
        algorithms: [],
        concept: true,
        conceptId: 'sorting-basics',
      },
      {
        id: 'insertion-sort',
        title: { zh: '插入排序：直接插入排序', en: 'Insertion sort: direct insertion' },
        algorithms: [{ id: 'insertion' }],
      },
      {
        id: 'shell-sort',
        title: { zh: '插入排序：希尔排序', en: 'Insertion sort: Shell sort' },
        algorithms: [{ id: 'shell' }],
      },
      {
        id: 'bubble-sort',
        title: { zh: '冒泡排序（补充）', en: 'Bubble sort (supplement)' },
        algorithms: [{ id: 'bubble', extension: true }],
        extension: true,
      },
      {
        id: 'quick-sort',
        title: { zh: '快速排序', en: 'Quicksort' },
        algorithms: [{ id: 'quick' }],
      },
      {
        id: 'selection-sort',
        title: { zh: '选择排序：简单选择排序', en: 'Selection sort: simple selection' },
        algorithms: [{ id: 'selection' }],
      },
      {
        id: 'heap-sort',
        title: { zh: '选择排序：堆排序', en: 'Selection sort: heapsort' },
        algorithms: [{ id: 'heap' }],
      },
      {
        id: 'merge-sort',
        title: { zh: '归并排序', en: 'Merge sort' },
        algorithms: [{ id: 'merge' }],
      },
      {
        id: 'radix-sort',
        title: { zh: '基数排序', en: 'Radix sort' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'sort-comparison',
        title: { zh: '各种内部排序方法的比较讨论', en: 'Comparing internal sorting methods' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch11-external-sort',
    number: 11,
    title: { zh: '外部排序', en: 'External sorting' },
    shortTitle: { zh: '外部排序', en: 'External sorting' },
    topics: [
      {
        id: 'external-storage',
        title: { zh: '外存信息的存取', en: 'External-memory access' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'external-sort-method',
        title: { zh: '外部排序的方法', en: 'External sorting methods' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'multiway-merge',
        title: { zh: '多路平衡归并的实现', en: 'Multiway balanced merging' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'replacement-selection',
        title: { zh: '置换-选择排序', en: 'Replacement selection' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'optimal-merge-tree',
        title: { zh: '最佳归并树', en: 'Optimal merge tree' },
        algorithms: [],
        planned: true,
      },
    ],
  },
  {
    id: 'ch12-files',
    number: 12,
    title: { zh: '文件', en: 'Files' },
    shortTitle: { zh: '文件', en: 'Files' },
    topics: [
      {
        id: 'file-concepts',
        title: { zh: '有关文件的基本概念', en: 'File fundamentals' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'sequential-file',
        title: { zh: '顺序文件', en: 'Sequential files' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'index-file',
        title: { zh: '索引文件', en: 'Indexed files' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'isam-vsam',
        title: { zh: 'ISAM 文件和 VSAM 文件', en: 'ISAM and VSAM files' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'direct-file',
        title: { zh: '直接存取文件（散列文件）', en: 'Direct-access (hashed) files' },
        algorithms: [],
        planned: true,
      },
      {
        id: 'multi-key-file',
        title: { zh: '多关键字文件', en: 'Multi-key files' },
        algorithms: [],
        planned: true,
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

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

export interface TextbookSubtopic {
  id: string;
  title: TextbookTitle;
  algorithms: TextbookAlgorithmRef[];
  /** A static theory leaf inside a second-level group. */
  concept?: boolean;
  conceptId?: string;
  planned?: boolean;
  extension?: boolean;
}

export interface TextbookTopic {
  id: string;
  title: TextbookTitle;
  algorithms: TextbookAlgorithmRef[];
  /**
   * Optional third-level leaves. The group itself is only a disclosure heading;
   * every leaf must point at one shipped algorithm or one authored concept.
   * Groups are authored only when the relation is real, never for visual tidiness.
   */
  children?: TextbookSubtopic[];
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
        id: 'static-linked-group',
        title: { zh: '静态链表', en: 'Static linked lists' },
        algorithms: [],
        children: [
          {
            id: 'static-linked-list',
            title: { zh: '静态链表的存储结构', en: 'Static linked-list storage' },
            algorithms: [],
            concept: true,
            conceptId: 'static-linked-list',
          },
          {
            id: 'static-linked-operations',
            title: { zh: '静态链表的操作', en: 'Static linked-list operations' },
            algorithms: [{ id: 'static-linked-list' }],
          },
        ],
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
        title: { zh: '栈的应用', en: 'Stack applications' },
        algorithms: [],
        children: [
          {
            id: 'infix-to-postfix',
            title: { zh: '中缀表达式转后缀', en: 'Infix to postfix' },
            algorithms: [{ id: 'infix-to-postfix' }],
          },
          {
            id: 'postfix-eval',
            title: { zh: '后缀表达式求值', en: 'Postfix evaluation' },
            algorithms: [{ id: 'postfix-eval' }],
          },
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
        algorithms: [],
        children: [
          {
            id: 'factorial',
            title: { zh: '阶乘递归', en: 'Factorial recursion' },
            algorithms: [{ id: 'factorial', extension: true }],
          },
          {
            id: 'fib',
            title: { zh: '斐波那契递归', en: 'Fibonacci recursion' },
            algorithms: [{ id: 'fib', extension: true }],
          },
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
        title: { zh: '朴素模式匹配：逐起点比较', en: 'Naive pattern matching: every start' },
        algorithms: [],
        concept: true,
        conceptId: 'naive-matching',
      },
      {
        id: 'pattern-matching',
        title: { zh: '模式匹配算法', en: 'Pattern-matching algorithms' },
        algorithms: [],
        children: [
          {
            id: 'bf',
            title: { zh: '朴素匹配（BF）', en: 'Naive matching (BF)' },
            algorithms: [{ id: 'bf' }],
          },
          {
            id: 'kmp',
            title: { zh: 'KMP 模式匹配', en: 'KMP pattern matching' },
            algorithms: [{ id: 'kmp' }],
          },
        ],
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
        id: 'array-matrix',
        title: { zh: '数组与矩阵', en: 'Arrays and matrices' },
        algorithms: [],
        children: [
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
        ],
      },
      {
        id: 'sparse-transpose',
        title: { zh: '稀疏矩阵的快速转置', en: 'Fast transpose of a sparse matrix' },
        algorithms: [{ id: 'sparse-transpose' }],
      },
      {
        id: 'generalized-list-group',
        title: { zh: '广义表', en: 'Generalized lists' },
        algorithms: [],
        children: [
          {
            id: 'generalized-list',
            title: { zh: '定义、长度与深度', en: 'Definition, length and depth' },
            algorithms: [],
            concept: true,
            conceptId: 'generalized-list-definition',
          },
          {
            id: 'generalized-list-storage',
            title: { zh: '广义表的存储结构', en: 'Storage structure' },
            algorithms: [],
            concept: true,
            conceptId: 'generalized-list-storage',
          },
          {
            id: 'gl-depth',
            title: { zh: '递归求广义表深度', en: 'Recursive depth' },
            algorithms: [{ id: 'gl-depth' }],
          },
          {
            id: 'gl-copy',
            title: { zh: '递归复制广义表', en: 'Recursive copy' },
            algorithms: [{ id: 'gl-copy' }],
          },
          {
            id: 'm-variable-polynomial',
            title: { zh: 'm 元多项式的表示', en: 'Polynomials in m variables' },
            algorithms: [],
            concept: true,
            conceptId: 'multivariate-polynomial',
          },
        ],
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
        id: 'threaded-tree-group',
        title: { zh: '线索二叉树', en: 'Threaded binary trees' },
        algorithms: [],
        children: [
          {
            id: 'threaded-tree',
            title: { zh: '线索标志与空指针利用', en: 'Tags and reuse of null pointers' },
            algorithms: [],
            concept: true,
            conceptId: 'threaded-binary-tree',
          },
          {
            id: 'threaded-inorder',
            title: { zh: '中序线索化与遍历', en: 'In-order threading and traversal' },
            algorithms: [{ id: 'threaded-inorder' }],
          },
        ],
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
        title: { zh: '哈夫曼树及其应用', en: 'Huffman Tree and Its Applications' },
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
        title: { zh: '图的定义和术语', en: 'Graph definition and terminology' },
        algorithms: [],
        concept: true,
        conceptId: 'graph-basics',
      },
      {
        id: 'graph-storage',
        title: { zh: '图的存储结构', en: 'Graph storage structures' },
        algorithms: [],
        children: [
          {
            id: 'graph-adjacency-matrix',
            title: { zh: '邻接矩阵', en: 'Adjacency matrix' },
            algorithms: [],
            concept: true,
            conceptId: 'graph-storage',
          },
          {
            id: 'graph-adjacency-list',
            title: { zh: '邻接表', en: 'Adjacency list' },
            algorithms: [],
            concept: true,
            conceptId: 'graph-adjacency-list',
          },
          {
            id: 'graph-orthogonal-list',
            title: { zh: '十字链表', en: 'Orthogonal list' },
            algorithms: [],
            concept: true,
            conceptId: 'graph-orthogonal-list',
          },
          {
            id: 'graph-adjacency-multilist',
            title: { zh: '邻接多重表', en: 'Adjacency multilist' },
            algorithms: [],
            concept: true,
            conceptId: 'graph-adjacency-multilist',
          },
          {
            id: 'graph-storage-comparison',
            title: { zh: '四种存储结构对比', en: 'Comparing four layouts' },
            algorithms: [],
            concept: true,
            conceptId: 'graph-storage-comparison',
          },
        ],
      },
      {
        id: 'graph-traversal',
        title: { zh: '图的遍历', en: 'Graph traversal' },
        algorithms: [],
        children: [
          {
            id: 'bfs',
            title: { zh: '广度优先遍历（BFS）', en: 'Breadth-first traversal (BFS)' },
            algorithms: [{ id: 'bfs' }],
          },
          {
            id: 'dfs',
            title: { zh: '深度优先遍历（DFS）', en: 'Depth-first traversal (DFS)' },
            algorithms: [{ id: 'dfs' }],
          },
        ],
      },
      {
        id: 'graph-connectivity',
        title: { zh: '连通性', en: 'Connectivity' },
        algorithms: [],
        children: [
          {
            id: 'components',
            title: { zh: '连通分量', en: 'Connected components' },
            algorithms: [{ id: 'components' }],
          },
          {
            id: 'scc',
            title: { zh: '强连通分量（Kosaraju）', en: 'Strongly connected components (Kosaraju)' },
            algorithms: [{ id: 'scc' }],
          },
          {
            id: 'articulation-basics',
            title: { zh: '关节点与双连通性', en: 'Articulation points and biconnectivity' },
            algorithms: [],
            concept: true,
            conceptId: 'articulation-basics',
          },
          {
            id: 'articulation',
            title: { zh: '关节点检测（DFS low-link）', en: 'Articulation points (DFS low-link)' },
            algorithms: [{ id: 'articulation' }],
          },
        ],
      },
      {
        id: 'mst',
        title: { zh: '最小生成树', en: 'Minimum spanning tree' },
        algorithms: [],
        children: [
          {
            id: 'prim',
            title: { zh: 'Prim 算法', en: 'Prim algorithm' },
            algorithms: [{ id: 'prim' }],
          },
          {
            id: 'kruskal',
            title: { zh: 'Kruskal 算法', en: 'Kruskal algorithm' },
            algorithms: [{ id: 'kruskal' }],
          },
        ],
      },
      {
        id: 'dag',
        title: { zh: '有向无环图', en: 'Directed acyclic graphs' },
        algorithms: [],
        children: [
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
        ],
      },
      {
        id: 'shortest-path',
        title: { zh: '最短路径', en: 'Shortest paths' },
        algorithms: [],
        children: [
          {
            id: 'dijkstra',
            title: { zh: 'Dijkstra 算法', en: 'Dijkstra algorithm' },
            algorithms: [{ id: 'dijkstra' }],
          },
          {
            id: 'floyd-warshall',
            title: { zh: 'Floyd 算法', en: 'Floyd algorithm' },
            algorithms: [{ id: 'floyd-warshall' }],
          },
          {
            id: 'bellman-ford',
            title: { zh: 'Bellman-Ford（扩展）', en: 'Bellman-Ford (extension)' },
            algorithms: [{ id: 'bellman-ford', extension: true }],
          },
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
        title: { zh: '动态存储管理的基本概念', en: 'Fundamentals of dynamic storage management' },
        algorithms: [],
        concept: true,
        conceptId: 'dynamic-storage-overview',
      },
      {
        id: 'free-space-group',
        title: { zh: '可利用空间表与分配回收', en: 'Free-space lists, allocation and release' },
        algorithms: [],
        children: [
          {
            id: 'free-space-list',
            title: { zh: '空闲空间分配与回收（首次/最佳适应）', en: 'Free-space allocation and release (First/Best Fit)' },
            algorithms: [{ id: 'free-list' }],
          },
          {
            id: 'boundary-tag',
            title: { zh: '边界标识法与相邻块合并', en: 'Boundary tags and neighbour coalescing' },
            algorithms: [],
            concept: true,
            conceptId: 'boundary-tag-method',
          },
        ],
      },
      {
        id: 'buddy-system',
        title: { zh: '伙伴系统', en: 'Buddy system' },
        algorithms: [{ id: 'buddy-system' }],
      },
      {
        id: 'garbage-collection-group',
        title: { zh: '无用单元收集与存储紧缩', en: 'Garbage collection and storage compaction' },
        algorithms: [],
        children: [
          {
            id: 'garbage-collection',
            title: { zh: '标记—清除与紧缩动态演示', en: 'Mark-Sweep and compaction demonstration' },
            algorithms: [{ id: 'garbage-collection' }],
          },
          {
            id: 'storage-compaction',
            title: { zh: '存储紧缩：地址与引用更新', en: 'Storage compaction: addresses and references' },
            algorithms: [],
            concept: true,
            conceptId: 'storage-compaction',
          },
        ],
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
        id: 'search-basics',
        title: { zh: '查找的基本概念', en: 'Search fundamentals' },
        algorithms: [],
        concept: true,
        conceptId: 'search-basics',
      },
      {
        id: 'static-search',
        title: { zh: '静态查找表', en: 'Static search tables' },
        algorithms: [],
        children: [
          {
            id: 'sequential-search',
            title: { zh: '顺序查找', en: 'Sequential search' },
            algorithms: [{ id: 'linear' }],
          },
          {
            id: 'ordered-search',
            title: { zh: '折半查找', en: 'Binary search' },
            algorithms: [{ id: 'binary' }],
          },
          {
            id: 'search-asl',
            title: { zh: '折半查找判定树与 ASL', en: 'Binary-search decision tree and ASL' },
            algorithms: [],
            concept: true,
            conceptId: 'asl-decision-tree',
          },
          {
            id: 'indexed-search',
            title: { zh: '索引顺序表（分块结构）', en: 'Indexed table (block structure)' },
            algorithms: [],
            concept: true,
            conceptId: 'indexed-search',
          },
          {
            id: 'block-search',
            title: { zh: '分块查找动态过程', en: 'Block search in action' },
            algorithms: [{ id: 'block-search' }],
          },
          {
            id: 'static-tree-table',
            title: { zh: '静态树表与次优查找树', en: 'Static tree tables' },
            algorithms: [],
            concept: true,
            conceptId: 'static-tree-table',
          },
        ],
      },
      {
        id: 'tree-search',
        title: { zh: '动态查找表', en: 'Dynamic search tables' },
        algorithms: [],
        children: [
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
            title: { zh: 'B 树：定义与结构', en: 'B-tree: definition and structure' },
            algorithms: [],
            concept: true,
            conceptId: 'b-tree',
          },
          {
            id: 'bplus-tree',
            title: { zh: 'B+ 树：定义与结构', en: 'B+ tree: definition and structure' },
            algorithms: [],
            concept: true,
            conceptId: 'b-plus-tree',
          },
          {
            id: 'btree-demo',
            title: { zh: 'B 树：查找、插入与删除', en: 'B-tree: search, insert and delete' },
            algorithms: [{ id: 'btree' }],
          },
          {
            id: 'bplus-demo',
            title: { zh: 'B+ 树：查找、插入与范围查询', en: 'B+ tree: search, insert and range' },
            algorithms: [{ id: 'bplus-tree' }],
          },
          {
            id: 'key-tree',
            title: { zh: '键树（Trie）：查找与插入', en: 'Key tree (trie): search and insert' },
            algorithms: [{ id: 'key-tree' }],
          },
        ],
      },
      {
        id: 'hash-search',
        title: { zh: '哈希表', en: 'Hash tables' },
        algorithms: [],
        children: [
          {
            id: 'hashing-basics',
            title: { zh: '哈希函数、冲突与装填因子', en: 'Hash functions, collisions and load factor' },
            algorithms: [],
            concept: true,
            conceptId: 'hashing-basics',
          },
          {
            id: 'hash-chain',
            title: { zh: '链地址法', en: 'Separate chaining' },
            algorithms: [{ id: 'hash-chain' }],
          },
          {
            id: 'hash-probe',
            title: { zh: '开放定址法', en: 'Open addressing' },
            algorithms: [{ id: 'hash-probe' }],
          },
        ],
      },
      {
        id: 'search-comparison',
        title: { zh: '查找方法比较', en: 'Search method comparison' },
        algorithms: [],
        concept: true,
        conceptId: 'search-comparison',
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
        title: { zh: '插入排序', en: 'Insertion sort' },
        algorithms: [],
        children: [
          {
            id: 'direct-insertion',
            title: { zh: '直接插入排序', en: 'Direct insertion sort' },
            algorithms: [{ id: 'insertion' }],
          },
          {
            id: 'shell-sort',
            title: { zh: '希尔排序', en: 'Shell sort' },
            algorithms: [{ id: 'shell' }],
          },
        ],
      },
      {
        id: 'exchange-sort',
        title: { zh: '交换排序', en: 'Exchange sort' },
        algorithms: [],
        children: [
          {
            id: 'bubble-sort',
            title: { zh: '冒泡排序', en: 'Bubble sort' },
            algorithms: [{ id: 'bubble' }],
          },
          {
            id: 'quick-sort',
            title: { zh: '快速排序', en: 'Quicksort' },
            algorithms: [{ id: 'quick' }],
          },
        ],
      },
      {
        id: 'selection-sort',
        title: { zh: '选择排序', en: 'Selection sort' },
        algorithms: [],
        children: [
          {
            id: 'simple-selection-sort',
            title: { zh: '简单选择排序', en: 'Simple selection sort' },
            algorithms: [{ id: 'selection' }],
          },
          {
            id: 'tree-selection-sort',
            title: { zh: '树形选择排序', en: 'Tournament selection sort' },
            algorithms: [{ id: 'tournament' }],
          },
          {
            id: 'heap-sort',
            title: { zh: '堆排序', en: 'Heapsort' },
            algorithms: [{ id: 'heap' }],
          },
        ],
      },
      {
        id: 'merge-sort',
        title: { zh: '归并排序', en: 'Merge sort' },
        algorithms: [{ id: 'merge' }],
      },
      {
        id: 'radix-sort',
        title: { zh: '基数排序', en: 'Radix sort' },
        algorithms: [{ id: 'radix' }],
      },
      {
        id: 'sort-comparison',
        title: { zh: '各种内部排序方法的比较讨论', en: 'Comparing internal sorting methods' },
        algorithms: [],
        concept: true,
        conceptId: 'sorting-comparison',
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
        id: 'external-sort-basics',
        title: { zh: '外部排序基本原理', en: 'External-sorting fundamentals' },
        algorithms: [],
        concept: true,
        conceptId: 'external-sort-basics',
      },
      {
        id: 'external-initial-merge',
        title: { zh: '初始归并段与归并过程', en: 'Initial runs and merging' },
        algorithms: [],
        children: [
          {
            id: 'initial-runs',
            title: { zh: '初始归并段的生成', en: 'Building initial runs' },
            algorithms: [],
            concept: true,
            conceptId: 'external-initial-runs',
          },
          {
            id: 'multiway-merge',
            title: { zh: '多路平衡归并', en: 'Multiway balanced merging' },
            algorithms: [{ id: 'multiway' }],
          },
        ],
      },
      {
        id: 'replacement-selection',
        title: { zh: '置换选择排序', en: 'Replacement selection' },
        algorithms: [{ id: 'replacement' }],
      },
      {
        id: 'optimal-merge-tree',
        title: { zh: '最佳归并树', en: 'Optimal merge tree' },
        algorithms: [{ id: 'optimal-merge' }],
      },
      {
        id: 'external-sort-comparison',
        title: { zh: '外部排序方法比较', en: 'Comparing external-sorting methods' },
        algorithms: [],
        concept: true,
        conceptId: 'external-sort-comparison',
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

export interface TextbookSubtopicView extends TextbookSubtopic {
  algorithms: TextbookAlgorithmNode[];
  kind: 'concept' | 'planned' | 'algorithm';
  category: TextbookTopicCategory;
}

export interface TextbookTopicView extends Omit<TextbookTopic, 'children'> {
  algorithms: TextbookAlgorithmNode[];
  children: TextbookSubtopicView[];
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
  if (topic.children && topic.children.length > 0) return 'group';
  if (topic.concept) return 'concept';
  if (topic.planned) return 'planned';
  if (algorithms.length === 1) return 'algorithm';
  if (algorithms.length > 1) return 'group';
  return 'planned';
}

function textbookSubtopicKind(subtopic: TextbookSubtopic): TextbookSubtopicView['kind'] {
  if (subtopic.concept) return 'concept';
  if (subtopic.planned) return 'planned';
  return 'algorithm';
}

function textbookSubtopicCategory(
  subtopic: TextbookSubtopic,
  kind: TextbookSubtopicView['kind'],
): TextbookTopicCategory {
  if (kind === 'concept') return subtopic.conceptId ? 'theory' : 'pending';
  if (kind === 'algorithm') return 'visual';
  return 'pending';
}

/**
 * Keep the two axes explicit: `kind` describes the row structure, while
 * `category` describes how the student should read it. A group inherits its
 * category from its leaves, so a group of theory pages is still theory.
 */
export function textbookTopicCategory(
  topic: TextbookTopic,
  kind: TextbookTopicKind,
  children: readonly TextbookSubtopicView[] = [],
): TextbookTopicCategory {
  if (kind === 'group') {
    if (children.some((child) => child.category === 'visual')) return 'visual';
    if (children.some((child) => child.category === 'theory')) return 'theory';
    return 'pending';
  }
  if (kind === 'concept') return topic.conceptId ? 'theory' : 'pending';
  if (kind === 'algorithm') return 'visual';
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

  const resolveAlgorithms = (refs: readonly TextbookAlgorithmRef[]): TextbookAlgorithmNode[] => {
    const algorithms: TextbookAlgorithmNode[] = [];
    for (const ref of refs) {
      if (!catalog[ref.id] || mapped.has(ref.id)) continue;
      mapped.add(ref.id);
      algorithms.push({ id: ref.id, extension: ref.extension === true });
    }
    return algorithms;
  };

  for (const chapter of TEXTBOOK_CHAPTERS) {
    const topics: TextbookTopicView[] = chapter.topics.map((topic) => {
      const algorithms = resolveAlgorithms(topic.algorithms);
      const children: TextbookSubtopicView[] = (topic.children ?? []).map((child) => {
        const childAlgorithms = resolveAlgorithms(child.algorithms);
        const kind = textbookSubtopicKind(child);
        return {
          ...child,
          algorithms: childAlgorithms,
          kind,
          category: textbookSubtopicCategory(child, kind),
        };
      });
      const kind = textbookTopicKind(topic, algorithms);
      return {
        ...topic,
        algorithms,
        children,
        kind,
        category: textbookTopicCategory(topic, kind, children),
      };
    });

    if (chapter.extension && topics.every((topic) => topic.algorithms.length === 0 && topic.children.length === 0)) {
      continue;
    }

    chapters.push({
      ...chapter,
      topics,
      algorithmCount: topics.reduce(
        (total, topic) =>
          total + topic.algorithms.length + topic.children.reduce((sum, child) => sum + child.algorithms.length, 0),
        0,
      ),
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
        children: [],
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
      if (topic.children.some((child) => child.algorithms.some((algorithm) => algorithm.id === algorithmId))) {
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
      if (topic.children.some((child) => child.conceptId === conceptId)) {
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
    chapter.topics.flatMap((topic) => [
      ...topic.algorithms.map((algorithm) => algorithm.id),
      ...topic.children.flatMap((child) => child.algorithms.map((algorithm) => algorithm.id)),
    ]),
  );
}

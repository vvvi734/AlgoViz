import type { Lang } from './types';

/**
 * I18N-TERMS-01: one reviewed Chinese terminology layer for the teaching UI.
 *
 * This is deliberately a lookup table, not a text-rewriting engine. The UI uses
 * it in two explicit ways:
 *   1. the algorithm title can ask for a reviewed Chinese display name;
 *   2. a lesson can declare which glossary entries belong to it.
 *
 * English mode never reads the Chinese labels. Formula variables, Python field
 * names and trace payloads are outside this table and stay untouched.
 */
export interface TerminologyEntry {
  id: string;
  abbreviation?: string;
  /** Full English name or the standard English algorithm name. */
  english: string;
  /** Standard Chinese name used in data-structure teaching. */
  chinese: string;
  /** Optional accepted transliteration for a person's name. */
  transliteration?: string;
  /** Reviewed, ready-to-render Chinese label. */
  labelZh: string;
  /** Short note shown only when it prevents a real misconception. */
  noteZh?: string;
}

export const TERMINOLOGY: readonly TerminologyEntry[] = [
  {
    id: 'adt',
    abbreviation: 'ADT',
    english: 'Abstract Data Type',
    chinese: '抽象数据类型',
    labelZh: 'ADT（Abstract Data Type，抽象数据类型）',
  },
  {
    id: 'data-structure',
    english: 'Data Structure',
    chinese: '数据结构',
    labelZh: '数据结构（Data Structure）',
  },
  {
    id: 'linear-list',
    english: 'Linear List',
    chinese: '线性表',
    labelZh: '线性表（Linear List，有限序列，元素之间有前后次序）',
  },
  {
    id: 'algorithm',
    english: 'Algorithm',
    chinese: '算法',
    labelZh: '算法（Algorithm）',
  },
  {
    id: 'big-o',
    english: 'Big O Notation',
    chinese: '大 O 记号',
    labelZh: '大 O 记号（Big O Notation）',
  },
  {
    id: 'algorithm-cases',
    english: 'Best / Average / Worst Case',
    chinese: '最好 / 平均 / 最坏情况',
    labelZh: '复杂度情况：Best Case（最好情况）、Average Case（平均情况）、Worst Case（最坏情况）',
    noteZh: '只说 O(...) 而没有标情况时，通常默认是最坏情况的上界。',
  },
  {
    id: 'lifo',
    abbreviation: 'LIFO',
    english: 'Last In, First Out',
    chinese: '后进先出',
    labelZh: 'LIFO（Last In First Out，后进先出）',
  },
  {
    id: 'fifo',
    abbreviation: 'FIFO',
    english: 'First In, First Out',
    chinese: '先进先出',
    labelZh: 'FIFO（First In First Out，先进先出）',
  },
  {
    id: 'stack-operations',
    english: 'push / pop / peek',
    chinese: '压栈 / 弹栈 / 查看栈顶',
    labelZh: '栈操作：push（压栈）、pop（弹栈）、peek / top（查看栈顶）、isEmpty（判空）',
  },
  {
    id: 'queue-operations',
    english: 'enqueue / dequeue / front',
    chinese: '入队 / 出队 / 查看队首',
    labelZh: '队列操作：enqueue（入队）、dequeue（出队）、front（查看队首）',
    noteZh: 'front 指向队首，rear 指向下一次入队的位置。',
  },
  {
    id: 'linked-pointers',
    english: 'next / prev / head / tail / null',
    chinese: '后继指针 / 前驱指针 / 头指针 / 尾指针 / 空指针',
    labelZh: '链表指针：next（后继指针）、prev（前驱指针）、HEAD（头指针）、TAIL（尾指针）、NULL（空指针）',
  },
  {
    id: 'bf',
    abbreviation: 'BF',
    english: 'Brute Force',
    chinese: '暴力匹配',
    labelZh: 'BF（Brute Force，暴力匹配）',
    noteZh: '朴素匹配在每个起点重新比较，最坏时间为 O(nm)。',
  },
  {
    id: 'kmp',
    abbreviation: 'KMP',
    english: 'Knuth–Morris–Pratt',
    chinese: '克努特—莫里斯—普拉特字符串匹配算法',
    transliteration: '克努特—莫里斯—普拉特',
    labelZh: 'KMP（Knuth–Morris–Pratt，克努特—莫里斯—普拉特）字符串匹配算法',
    noteZh: 'KMP 取自三位研究者的姓氏，不是算法功能的英文短语缩写。',
  },
  {
    id: 'prefix',
    english: 'Prefix',
    chinese: '前缀',
    labelZh: '前缀（Prefix）',
  },
  {
    id: 'suffix',
    english: 'Suffix',
    chinese: '后缀',
    labelZh: '后缀（Suffix）',
  },
  {
    id: 'lps',
    abbreviation: 'LPS',
    english: 'Longest Proper Prefix which is also a Suffix',
    chinese: '最长相等真前后缀',
    labelZh: 'LPS（Longest Proper Prefix which is also a Suffix，最长相等真前后缀）',
  },
  {
    id: 'next-array',
    english: 'Partial Match Table',
    chinese: '部分匹配表',
    labelZh: 'next 数组（Partial Match Table，部分匹配表）',
    noteZh: '不同教材对 next 数组的下标与初值约定不同，比较时先看定义。',
  },
  {
    id: 'bst',
    abbreviation: 'BST',
    english: 'Binary Search Tree',
    chinese: '二叉搜索树',
    labelZh: 'BST（Binary Search Tree，二叉搜索树）',
  },
  {
    id: 'avl',
    abbreviation: 'AVL',
    english: 'Adelson-Velsky and Landis',
    chinese: '平衡二叉树',
    transliteration: '阿德尔森—韦尔斯基与兰迪斯',
    labelZh: 'AVL（Adelson-Velsky–Landis，平衡二叉树）',
    noteZh: 'AVL 取自两位提出者的姓氏，不是“平衡”的英文缩写。',
  },
  {
    id: 'avl-rotations',
    english: 'LL / RR / LR / RL rotations',
    chinese: '左左 / 右右 / 左右 / 右左旋转',
    labelZh: 'AVL 旋转：LL（左左型）、RR（右右型）、LR（左右型）、RL（右左型）',
  },
  {
    id: 'b-tree',
    abbreviation: 'B-Tree',
    english: 'B-Tree',
    chinese: 'B 树',
    labelZh: 'B 树（B-Tree，多路平衡查找树）',
  },
  {
    id: 'b-plus-tree',
    abbreviation: 'B+ Tree',
    english: 'B+ Tree',
    chinese: 'B+ 树',
    labelZh: 'B+ 树（B+ Tree，多路平衡查找树的变体）',
    noteZh: 'B+ 树与 B 树不是同一结构：B+ 树只在叶子存放记录，内部结点只做索引。',
  },
  {
    id: 'huffman',
    english: 'Huffman Tree',
    chinese: '哈夫曼树',
    transliteration: '哈夫曼',
    labelZh: '哈夫曼树（Huffman Tree）',
  },
  {
    id: 'trie',
    english: 'Trie',
    chinese: '字典树',
    labelZh: '字典树（Trie，前缀树，又称键树）',
  },
  {
    id: 'binary-tree',
    english: 'Binary Tree',
    chinese: '二叉树',
    labelZh: '二叉树（Binary Tree）',
  },
  {
    id: 'full-binary-tree',
    english: 'Full Binary Tree',
    chinese: '满二叉树',
    labelZh: '满二叉树（Full Binary Tree）',
  },
  {
    id: 'complete-binary-tree',
    english: 'Complete Binary Tree',
    chinese: '完全二叉树',
    labelZh: '完全二叉树（Complete Binary Tree）',
  },
  {
    id: 'threaded-binary-tree',
    english: 'Threaded Binary Tree',
    chinese: '线索二叉树',
    labelZh: '线索二叉树（Threaded Binary Tree）',
  },
  {
    id: 'generalized-list',
    english: 'Generalized List',
    chinese: '广义表',
    labelZh: '广义表（Generalized List）',
  },
  {
    id: 'graph',
    english: 'Graph',
    chinese: '图',
    labelZh: '图（Graph）',
  },
  {
    id: 'adjacency-matrix',
    english: 'Adjacency Matrix',
    chinese: '邻接矩阵',
    labelZh: '邻接矩阵（Adjacency Matrix）',
  },
  {
    id: 'adjacency-list',
    english: 'Adjacency List',
    chinese: '邻接表',
    labelZh: '邻接表（Adjacency List）',
  },
  {
    id: 'orthogonal-list',
    english: 'Orthogonal List',
    chinese: '十字链表',
    labelZh: '十字链表（Orthogonal List）',
  },
  {
    id: 'adjacency-multilist',
    english: 'Adjacency Multilist',
    chinese: '邻接多重表',
    labelZh: '邻接多重表（Adjacency Multilist）',
  },
  {
    id: 'bfs',
    abbreviation: 'BFS',
    english: 'Breadth-First Search',
    chinese: '广度优先搜索',
    labelZh: 'BFS（Breadth-First Search，广度优先搜索）',
    noteZh: 'BFS 按层扩展，在无权图中首次到达即边数最少。',
  },
  {
    id: 'dfs',
    abbreviation: 'DFS',
    english: 'Depth-First Search',
    chinese: '深度优先搜索',
    labelZh: 'DFS（Depth-First Search，深度优先搜索）',
    noteZh: 'DFS 沿一条路径走到底再回退，不保证首次到达最短。',
  },
  {
    id: 'bfs-state',
    english: 'discovered / visited',
    chinese: '已发现 / 已访问',
    labelZh: 'BFS 状态：discovered（已发现，已入队）、visited（已访问，已处理）',
  },
  {
    id: 'dfs-state',
    english: 'discovered / visited',
    chinese: '已发现 / 已访问',
    labelZh: 'DFS 状态：discovered（已发现，已入栈）、visited（已访问，已处理）',
  },
  {
    id: 'frontier',
    english: 'Frontier',
    chinese: '待访问边界',
    labelZh: '边界集合（Frontier，待访问顶点集合）',
  },
  {
    id: 'dijkstra',
    english: "Dijkstra's Algorithm",
    chinese: '迪杰斯特拉最短路径算法',
    transliteration: '迪杰斯特拉',
    labelZh: 'Dijkstra（迪杰斯特拉）最短路径算法',
    noteZh: '要求边权非负；负权边会让“已确定”的距离再次变小。',
  },
  {
    id: 'dijkstra-state',
    english: 'discovered / settled / in-heap',
    chinese: '已发现 / 已确定 / 在堆中',
    labelZh: 'Dijkstra 状态：discovered（已发现，距离待定）、settled（已确定，最短距离已锁定）、in-heap（在堆中）',
    noteZh: 'settled 顶点的距离不会再变小；这正是 Dijkstra 不能处理负权边的原因。',
  },
  {
    id: 'previous',
    english: 'Previous / Predecessor',
    chinese: '前驱指针',
    labelZh: '前驱指针（previous / predecessor，记录最短路径树中的上一个顶点）',
  },
  {
    id: 'floyd',
    english: 'Floyd–Warshall Algorithm',
    chinese: '弗洛伊德—沃舍尔全源最短路径算法',
    transliteration: '弗洛伊德—沃舍尔',
    labelZh: 'Floyd-Warshall（弗洛伊德—沃舍尔）全源最短路径算法',
    noteZh: '又称 Floyd 算法；由 Robert Floyd 与 Stephen Warshall 提出。',
  },
  {
    id: 'bellman-ford',
    english: 'Bellman–Ford Algorithm',
    chinese: '贝尔曼—福特最短路径算法',
    transliteration: '贝尔曼—福特',
    labelZh: 'Bellman-Ford（贝尔曼—福特）最短路径算法',
  },
  {
    id: 'prim',
    english: "Prim's Algorithm",
    chinese: '普里姆最小生成树算法',
    transliteration: '普里姆',
    labelZh: 'Prim（普里姆）最小生成树算法',
  },
  {
    id: 'kruskal',
    english: "Kruskal's Algorithm",
    chinese: '克鲁斯卡尔最小生成树算法',
    transliteration: '克鲁斯卡尔',
    labelZh: 'Kruskal（克鲁斯卡尔）最小生成树算法',
  },
  {
    id: 'mst',
    abbreviation: 'MST',
    english: 'Minimum Spanning Tree',
    chinese: '最小生成树',
    labelZh: 'MST（Minimum Spanning Tree，最小生成树）',
  },
  {
    id: 'union-find',
    abbreviation: 'DSU',
    english: 'Disjoint Set Union',
    chinese: '并查集',
    labelZh: '并查集（Disjoint Set Union，DSU；parent 指向集合代表，rank 控制合并方向）',
  },
  {
    id: 'dag',
    abbreviation: 'DAG',
    english: 'Directed Acyclic Graph',
    chinese: '有向无环图',
    labelZh: 'DAG（Directed Acyclic Graph，有向无环图）',
  },
  {
    id: 'aov',
    abbreviation: 'AOV',
    english: 'Activity On Vertex Network',
    chinese: '顶点表示活动的网',
    labelZh: 'AOV 网（Activity On Vertex，顶点表示活动的网）',
  },
  {
    id: 'aoe',
    abbreviation: 'AOE',
    english: 'Activity On Edge Network',
    chinese: '边表示活动的网',
    labelZh: 'AOE 网（Activity On Edge，边表示活动的网）',
  },
  {
    id: 'topological-sort',
    english: 'Topological Sort',
    chinese: '拓扑排序',
    labelZh: '拓扑排序（Topological Sort）',
  },
  {
    id: 'kahn',
    english: "Kahn's Algorithm",
    chinese: '卡恩拓扑排序算法',
    transliteration: '卡恩',
    labelZh: 'Kahn（卡恩）拓扑排序算法',
  },
  {
    id: 'critical-path',
    english: 'Critical Path',
    chinese: '关键路径',
    labelZh: '关键路径（Critical Path）',
  },
  {
    id: 'scc',
    abbreviation: 'SCC',
    english: 'Strongly Connected Component',
    chinese: '强连通分量',
    labelZh: 'SCC（Strongly Connected Component，强连通分量）',
  },
  {
    id: 'kosaraju',
    english: "Kosaraju's Algorithm",
    chinese: '科萨拉朱强连通分量算法',
    transliteration: '科萨拉朱',
    labelZh: 'Kosaraju（科萨拉朱）强连通分量算法',
  },
  {
    id: 'low-link',
    english: 'Low-Link Value',
    chinese: '低链接值',
    labelZh: 'low-link（Low-Link Value，低链接值）',
  },
  {
    id: 'articulation-point',
    english: 'Articulation Point',
    chinese: '关节点',
    labelZh: '关节点（Articulation Point，割点）',
  },
  {
    id: 'bridge',
    english: 'Bridge',
    chinese: '桥',
    labelZh: '桥（Bridge）',
  },
  {
    id: 'hash-table',
    abbreviation: 'Hash Table',
    english: 'Hash Table',
    chinese: '哈希表',
    labelZh: '哈希表（Hash Table，散列表）',
  },
  {
    id: 'hash-function',
    english: 'Hash Function',
    chinese: '哈希函数',
    labelZh: '哈希函数（Hash Function，散列函数）',
  },
  {
    id: 'collision',
    english: 'Collision',
    chinese: '冲突',
    labelZh: '冲突（Collision）',
  },
  {
    id: 'load-factor',
    english: 'Load Factor',
    chinese: '装填因子',
    labelZh: '装填因子（Load Factor，α = 记录数 / 表长）',
  },
  {
    id: 'open-addressing',
    english: 'Open Addressing',
    chinese: '开放定址法',
    labelZh: '开放定址法（Open Addressing）',
  },
  {
    id: 'chaining',
    english: 'Chaining',
    chinese: '链地址法',
    labelZh: '链地址法（Chaining，拉链法）',
  },
  {
    id: 'hash-slot',
    english: 'EMPTY / OCCUPIED / DELETED',
    chinese: '空槽 / 占用 / 已删除',
    labelZh: '槽位状态：EMPTY（空槽）、OCCUPIED（占用）、DELETED（已删除）',
  },
  {
    id: 'quick-sort',
    english: 'Quicksort',
    chinese: '快速排序',
    labelZh: '快速排序（Quicksort）',
  },
  {
    id: 'lomuto',
    english: 'Lomuto Partition',
    chinese: '洛穆托划分',
    transliteration: '洛穆托',
    labelZh: 'Lomuto（洛穆托）划分',
    noteZh: '本课程以末尾元素为枢轴，把不大于枢轴的值换到左侧。',
  },
  {
    id: 'pivot',
    english: 'Pivot',
    chinese: '枢轴',
    labelZh: '枢轴（Pivot）',
  },
  {
    id: 'merge-sort',
    english: 'Merge Sort',
    chinese: '归并排序',
    labelZh: '归并排序（Merge Sort）',
  },
  {
    id: 'heap-sort',
    english: 'Heap Sort',
    chinese: '堆排序',
    labelZh: '堆排序（Heap Sort）',
  },
  {
    id: 'shell-sort',
    english: 'Shell Sort',
    chinese: '希尔排序',
    transliteration: '希尔',
    labelZh: '希尔排序（Shell Sort）',
  },
  {
    id: 'gap',
    english: 'Gap',
    chinese: '间隔',
    labelZh: '间隔（Gap，增量）',
  },
  {
    id: 'radix-sort',
    english: 'Radix Sort',
    chinese: '基数排序',
    labelZh: '基数排序（Radix Sort）',
  },
  {
    id: 'lsd',
    abbreviation: 'LSD',
    english: 'Least Significant Digit first',
    chinese: '最低位优先',
    labelZh: 'LSD（Least Significant Digit first，最低位优先）',
    noteZh: 'LSD 先从最低位分配，再逐位向高位处理。',
  },
  {
    id: 'msd',
    abbreviation: 'MSD',
    english: 'Most Significant Digit first',
    chinese: '最高位优先',
    labelZh: 'MSD（Most Significant Digit first，最高位优先）',
    noteZh: 'MSD 先从最高位分组，再递归处理各组低位。',
  },
  {
    id: 'stable-sort',
    english: 'Stable Sort',
    chinese: '稳定排序',
    labelZh: '稳定排序（Stable Sort）',
  },
  {
    id: 'in-place',
    english: 'In-place Algorithm',
    chinese: '原地算法',
    labelZh: '原地算法（In-place Algorithm）',
  },
  {
    id: 'divide-conquer',
    english: 'Divide and Conquer',
    chinese: '分治法',
    labelZh: '分治法（Divide and Conquer）',
  },
  {
    id: 'greedy',
    english: 'Greedy Strategy',
    chinese: '贪心策略',
    labelZh: '贪心策略（Greedy Strategy）',
  },
  {
    id: 'dynamic-programming',
    english: 'Dynamic Programming',
    chinese: '动态规划',
    labelZh: '动态规划（Dynamic Programming）',
  },
  {
    id: 'relaxation',
    english: 'Relaxation',
    chinese: '松弛操作',
    labelZh: '松弛操作（Relaxation）',
  },
  {
    id: 'distance',
    english: 'Distance',
    chinese: '距离估计',
    labelZh: 'dist（Distance，当前最短距离估计）',
  },
  {
    id: 'asl',
    abbreviation: 'ASL',
    english: 'Average Search Length',
    chinese: '平均查找长度',
    labelZh: 'ASL（Average Search Length，平均查找长度）',
  },
  {
    id: 'index',
    english: 'Index',
    chinese: '索引',
    labelZh: '索引（Index）',
  },
  {
    id: 'replacement-selection',
    english: 'Replacement Selection',
    chinese: '置换选择',
    labelZh: '置换选择（Replacement Selection）',
  },
  {
    id: 'merge',
    english: 'Merge',
    chinese: '归并',
    labelZh: '归并（Merge）',
  },
  {
    id: 'run',
    english: 'Run',
    chinese: '归并段',
    labelZh: '归并段（Run）',
  },
  {
    id: 'buffer',
    english: 'Buffer',
    chinese: '缓冲区',
    labelZh: '缓冲区（Buffer）',
  },
  {
    id: 'external-sort',
    english: 'External Sort',
    chinese: '外部排序',
    labelZh: '外部排序（External Sort）',
  },
  {
    id: 'isam',
    abbreviation: 'ISAM',
    english: 'Indexed Sequential Access Method',
    chinese: '索引顺序存取方法',
    labelZh: 'ISAM（Indexed Sequential Access Method，索引顺序存取方法）',
  },
  {
    id: 'vsam',
    abbreviation: 'VSAM',
    english: 'Virtual Storage Access Method',
    chinese: '虚拟存储存取方法',
    labelZh: 'VSAM（Virtual Storage Access Method，虚拟存储存取方法）',
  },
  {
    id: 'wpl',
    abbreviation: 'WPL',
    english: 'Weighted Path Length',
    chinese: '带权路径长度',
    labelZh: 'WPL（Weighted Path Length，带权路径长度）',
  },
  {
    id: 'inverted-index',
    english: 'Inverted Index',
    chinese: '倒排索引',
    labelZh: '倒排索引（Inverted Index）',
  },
  {
    id: 'mark-sweep',
    english: 'Mark-Sweep',
    chinese: '标记—清除',
    labelZh: '标记—清除（Mark-Sweep）',
  },
  {
    id: 'compaction',
    english: 'Compaction',
    chinese: '存储紧缩',
    labelZh: '存储紧缩（Compaction）',
  },
  {
    id: 'buddy-system',
    english: 'Buddy System',
    chinese: '伙伴系统',
    labelZh: '伙伴系统（Buddy System）',
  },
  {
    id: 'triple-table',
    english: 'Triple Table',
    chinese: '三元组表',
    labelZh: '三元组表（Triple Table，只记录非零元素的 row / col / value）',
  },
  {
    id: 'csr',
    abbreviation: 'CSR',
    english: 'Compressed Sparse Row',
    chinese: '压缩稀疏行',
    labelZh: 'CSR（Compressed Sparse Row，压缩稀疏行）',
    noteZh: 'CSR 用一份行偏移表消除逐条重复的行号。',
  },
  {
    id: 'c-string',
    english: 'C String',
    chinese: 'C 语言字符串',
    labelZh: 'C 字符串（C String，以字符 0 即 \\0 结尾）',
    noteZh: 'C 字符串靠结尾 0 判长，教材串 ADT 靠 length 字段判长，两套约定不能混用。',
  },
  {
    id: 'block-linked-string',
    english: 'Block-Linked String',
    chinese: '块链串',
    labelZh: '块链串（Block-Linked String，多个字符块用 next 指针连接）',
  },
  {
    id: 'token',
    english: 'Token',
    chinese: '记号',
    labelZh: '记号（Token，表达式扫描时不可再分的最小单位）',
  },
  {
    id: 'and-or',
    abbreviation: 'AND / OR',
    english: 'Logical AND / Logical OR',
    chinese: '逻辑与 / 逻辑或',
    labelZh: 'AND（逻辑与，求交集）/ OR（逻辑或，求并集）',
  },
  {
    id: 'posting',
    english: 'Posting',
    chinese: '倒排项',
    labelZh: '倒排项（Posting，倒排表中“关键字 → 记录 ID”的一条记录）',
  },
  {
    id: 'free-block-state',
    english: 'Free Block Merge State',
    chinese: '空闲块合并状态',
    labelZh: '空闲块合并状态：isolated（独立）、left-free（左邻空闲）、right-free（右邻空闲）、both-free（左右都空闲）',
  },
  {
    id: 'threaded-tags',
    abbreviation: 'ltag / rtag',
    english: 'Left / Right Thread Tag',
    chinese: '左 / 右线索标志',
    labelZh: '线索标志：ltag / rtag（0 指向真实孩子，1 表示指向前驱或后继的线索）',
  },
];

const TERM_BY_ID = new Map(TERMINOLOGY.map((entry) => [entry.id, entry]));

/**
 * Algorithm titles that still contain an unexplained English name in Chinese
 * mode. English mode always keeps the authored English pair.
 */
const ALGORITHM_NAME_ZH: Readonly<Record<string, string>> = {
  stack: '栈（LIFO，后进先出）',
  queue: '队列（FIFO，先进先出）',
  linked: '单向链表（Singly Linked List）',
  doubly: '双向链表（Doubly Linked List）',
  circular: '循环单链表（Circular Linked List）',
  bst: '二叉搜索树（BST）· 查找 / 插入 / 删除',
  avl: '平衡二叉树（AVL）· 插入 / 删除 / 旋转',
  btree: 'B 树（B-Tree，多路平衡查找树）· 查找 / 插入 / 分裂',
  bfs: '广度优先搜索（BFS，Breadth-First Search）',
  dfs: '深度优先搜索（DFS，Depth-First Search）',
  huffman: '哈夫曼树（Huffman Tree）与哈夫曼编码',
  dijkstra: 'Dijkstra（迪杰斯特拉）最短路径算法',
  'floyd-warshall': 'Floyd（弗洛伊德）全源最短路径算法',
  'bellman-ford': 'Bellman-Ford（贝尔曼—福特）最短路径算法',
  prim: 'Prim（普里姆）最小生成树算法',
  kruskal: 'Kruskal（克鲁斯卡尔）最小生成树算法',
  topological: '拓扑排序（Kahn，卡恩算法）',
  'critical-path': 'AOE（边表示活动）关键路径',
  scc: '强连通分量（Kosaraju，科萨拉朱算法）',
  bf: '朴素模式匹配（BF，Brute Force，暴力匹配）',
  kmp: 'KMP（Knuth–Morris–Pratt）模式匹配',
  articulation: '关节点检测（DFS 低链接值）',
  'hash-chain': '链地址法哈希表（Chaining）',
  'hash-probe': '线性探测哈希表（Open Addressing）',
  'bplus-tree': 'B+ 树（B+ Tree）：查找、插入与范围扫描',
  'key-tree': '键树（Trie，字典树）',
  radix: '基数排序（LSD，最低位优先）',
  isam: 'ISAM（索引顺序存取方法）文件与溢出链',
};

/**
 * Compact forms for navigation, selects, panel headers and guide kickers.
 * The detail-page h1 keeps the full form from ALGORITHM_NAME_ZH; repeating that
 * everywhere would make the directory rows wrap or clip on narrow screens.
 */
const ALGORITHM_SHORT_ZH: Readonly<Record<string, string>> = {
  stack: '栈',
  queue: '队列',
  linked: '单向链表',
  doubly: '双向链表',
  circular: '循环单链表',
  bst: '二叉搜索树（BST）',
  avl: '平衡二叉树（AVL）',
  btree: 'B 树（B-Tree）',
  bfs: '广度优先搜索（BFS）',
  dfs: '深度优先搜索（DFS）',
  huffman: '哈夫曼树',
  dijkstra: 'Dijkstra 最短路径',
  'floyd-warshall': 'Floyd 全源最短路径',
  'bellman-ford': 'Bellman-Ford 最短路径',
  prim: 'Prim 最小生成树',
  kruskal: 'Kruskal 最小生成树',
  topological: '拓扑排序',
  'critical-path': 'AOE 关键路径',
  scc: '强连通分量',
  bf: '朴素模式匹配（BF）',
  kmp: 'KMP 模式匹配',
  articulation: '关节点检测',
  'hash-chain': '链地址法散列',
  'hash-probe': '线性探测散列',
  'bplus-tree': 'B+ 树',
  'key-tree': '键树（Trie）',
  radix: '基数排序',
  isam: 'ISAM 文件',
};

export function algorithmNameZh(id: string, fallback: string, lang: Lang): string {
  if (lang !== 'zh') return fallback;
  return ALGORITHM_NAME_ZH[id] ?? fallback;
}

export function algorithmShortNameZh(id: string, fallback: string, lang: Lang): string {
  if (lang !== 'zh') return fallback;
  return ALGORITHM_SHORT_ZH[id] ?? ALGORITHM_NAME_ZH[id] ?? fallback;
}

/**
 * Directory rows authored before I18N-TERMS-01 keep their stable IDs and
 * English pairs. Only these Chinese titles need the visible gloss; English
 * titles are returned untouched.
 */
const TEXTBOOK_TITLE_ZH: Readonly<Record<string, string>> = {
  '朴素匹配（BF）': '朴素匹配（BF，暴力匹配）',
  'KMP 模式匹配': 'KMP（Knuth–Morris–Pratt）模式匹配',
  '广度优先遍历（BFS）': '广度优先遍历（BFS，Breadth-First Search）',
  '深度优先遍历（DFS）': '深度优先遍历（DFS，Depth-First Search）',
  '强连通分量（Kosaraju）': '强连通分量（Kosaraju，科萨拉朱算法）',
  '关节点检测（DFS low-link）': '关节点检测（DFS，深度优先搜索 · 低链接值）',
  'Prim 算法': 'Prim（普里姆）算法',
  'Kruskal 算法': 'Kruskal（克鲁斯卡尔）算法',
  'Dijkstra 算法': 'Dijkstra（迪杰斯特拉）算法',
  'Floyd 算法': 'Floyd（弗洛伊德）算法',
  'Bellman-Ford（扩展）': 'Bellman-Ford（贝尔曼—福特）算法',
  '折半查找判定树与 ASL': '折半查找判定树与平均查找长度（ASL）',
  '键树（Trie）：查找与插入': '键树（Trie，字典树）：查找与插入',
  'ISAM 查找与溢出链': 'ISAM（索引顺序存取方法）查找与溢出链',
  'ISAM 与 VSAM 的组织': 'ISAM 与 VSAM（索引顺序/虚拟存储存取方法）的组织',
};

export function textbookTitleZh(original: string): string {
  return TEXTBOOK_TITLE_ZH[original] ?? original;
}

const TERM_IDS_BY_ALGORITHM: Readonly<Record<string, readonly string[]>> = {
  stack: ['lifo', 'stack-operations'],
  queue: ['fifo', 'queue-operations'],
  linked: ['linked-pointers'],
  doubly: ['linked-pointers'],
  circular: ['linked-pointers'],
  bst: ['bst'],
  avl: ['avl', 'bst', 'avl-rotations'],
  btree: ['b-tree', 'bst'],
  bfs: ['fifo', 'frontier', 'bfs-state'],
  dfs: ['lifo', 'frontier', 'dfs-state'],
  dijkstra: ['relaxation', 'distance', 'dijkstra-state', 'previous'],
  'floyd-warshall': ['floyd', 'dynamic-programming', 'distance'],
  'bellman-ford': ['relaxation', 'distance'],
  prim: ['mst', 'greedy'],
  kruskal: ['mst', 'greedy', 'union-find'],
  topological: ['dag', 'aov', 'topological-sort'],
  'critical-path': ['aoe', 'aov', 'critical-path'],
  scc: ['scc', 'dfs'],
  bf: ['prefix'],
  kmp: ['kmp', 'lps', 'next-array', 'prefix', 'suffix'],
  articulation: ['articulation-point', 'bridge', 'dfs', 'low-link'],
  'hash-chain': ['hash-table', 'hash-function', 'collision', 'chaining', 'linked-pointers'],
  'hash-probe': ['hash-table', 'hash-function', 'collision', 'open-addressing', 'load-factor', 'hash-slot'],
  huffman: ['huffman', 'wpl'],
  inorder: ['bst', 'fifo'],
  components: ['dfs', 'bfs'],
  'threaded-inorder': ['threaded-binary-tree', 'threaded-tags'],
  'infix-to-postfix': ['stack-operations', 'token'],
  'postfix-eval': ['stack-operations', 'token'],
  'free-list': ['free-block-state'],
  'inverted-index': ['posting', 'and-or'],
  'file-index': ['b-plus-tree'],
  'bplus-tree': ['b-plus-tree', 'b-tree', 'index'],
  'key-tree': ['trie', 'prefix'],
  quick: ['quick-sort', 'lomuto', 'pivot', 'in-place', 'divide-conquer'],
  merge: ['merge-sort', 'stable-sort', 'divide-conquer'],
  heap: ['heap-sort', 'in-place'],
  shell: ['shell-sort', 'gap', 'in-place'],
  radix: ['radix-sort', 'lsd', 'stable-sort'],
  'block-search': ['index', 'asl'],
  replacement: ['replacement-selection', 'run', 'buffer', 'external-sort'],
  multiway: ['merge', 'run', 'buffer', 'external-sort'],
  'optimal-merge': ['merge', 'run', 'buffer', 'external-sort'],
  isam: ['isam', 'index'],
  'buddy-system': ['buddy-system'],
  'garbage-collection': ['mark-sweep', 'compaction'],
};

const TERM_IDS_BY_CONCEPT: Readonly<Record<string, readonly string[]>> = {
  'data-structure-basics': ['data-structure'],
  'algorithm-definition': ['algorithm', 'big-o'],
  'algorithm-cases': ['algorithm-cases', 'big-o'],
  complexity: ['big-o'],
  'storage-structures': ['data-structure'],
  'linear-list': ['linear-list', 'adt'],
  'sparse-matrix': ['triple-table', 'csr'],
  'tree-terms': ['binary-tree', 'full-binary-tree', 'complete-binary-tree'],
  'graph-basics': ['graph', 'dag', 'bfs', 'dfs'],
  adt: ['adt', 'stack-operations'],
  'sorting-basics': ['stable-sort', 'in-place'],
  'sorting-comparison': ['lsd', 'msd', 'stable-sort', 'radix-sort'],
  'string-basics': ['bf', 'prefix', 'suffix'],
  'string-storage': ['adt', 'c-string', 'block-linked-string'],
  'naive-matching': ['bf', 'prefix', 'suffix'],
  'b-tree': ['b-tree'],
  'b-plus-tree': ['b-plus-tree'],
  'asl-decision-tree': ['asl'],
  'indexed-search': ['index', 'asl'],
  'stack-queue-storage': ['lifo', 'fifo'],
  'threaded-binary-tree': ['threaded-binary-tree'],
  'generalized-list-definition': ['generalized-list'],
  'generalized-list-storage': ['generalized-list'],
  'multivariate-polynomial': ['generalized-list'],
  'graph-storage': ['adjacency-matrix'],  'graph-adjacency-list': ['adjacency-list'],
  'graph-orthogonal-list': ['orthogonal-list'],
  'graph-adjacency-multilist': ['adjacency-multilist'],
  'graph-storage-comparison': ['adjacency-matrix', 'adjacency-list', 'orthogonal-list', 'adjacency-multilist'],
  'articulation-basics': ['articulation-point', 'bridge', 'low-link'],
  'storage-compaction': ['compaction'],
  'search-basics': ['asl'],
  'static-tree-table': ['asl', 'wpl', 'bst', 'avl'],
  'hashing-basics': ['hash-table', 'hash-function', 'collision', 'load-factor', 'open-addressing', 'chaining'],
  'search-comparison': ['bst', 'asl', 'hash-table'],
  'external-sort-basics': ['external-sort', 'run', 'buffer', 'merge'],
  'external-initial-runs': ['replacement-selection', 'run', 'buffer'],
  'external-sort-comparison': ['merge', 'run', 'buffer'],
  'index-file': ['index'],
  'isam-vsam': ['isam', 'vsam'],
  'hashed-file': ['hash-table', 'collision'],
  'inverted-file': ['inverted-index'],
  'file-comparison': ['index', 'isam', 'vsam', 'hash-table'],
};

function uniqueEntries(ids: readonly string[]): TerminologyEntry[] {
  const seen = new Set<string>();
  const result: TerminologyEntry[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const entry = TERM_BY_ID.get(id);
    if (!entry) continue;
    seen.add(id);
    result.push(entry);
  }
  return result;
}

export function glossaryForAlgorithm(id: string | undefined | null): TerminologyEntry[] {
  if (!id) return [];
  return uniqueEntries(TERM_IDS_BY_ALGORITHM[id] ?? []);
}

export function glossaryForConcept(id: string | undefined | null): TerminologyEntry[] {
  if (!id) return [];
  return uniqueEntries(TERM_IDS_BY_CONCEPT[id] ?? []);
}

export function terminologyEntry(id: string): TerminologyEntry | undefined {
  return TERM_BY_ID.get(id);
}

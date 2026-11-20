import type { ConceptPage } from './types';

/**
 * Authored concept lessons.
 *
 * These pages are intentionally static: no trace, no player and no editor. They
 * sit beside the runnable courses so the textbook directory can explain
 * definitions before a learner opens an animation.
 *
 * The original batch covered five representative topics. CONTENT-02 adds the
 * ADT, case analysis, linear-list, graph-storage and sorting foundations. Other
 * `concept: true` topics keep their pending row until a page is authored; no
 * placeholder page is generated.
 */
export const CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'data-structure-basics',
    topicId: 'intro-concepts',
    title: ['数据结构的基本概念', 'Basic concepts of data structures'],
    chapter: ['第 1 章 · 数据结构绪论', 'Chapter 1 · Introduction'],
    summary: [
      '数据结构研究数据元素之间的关系，以及这些关系如何存放在计算机中、可以做哪些运算。',
      'A data structure describes relationships between data elements, how those relationships are stored, and which operations they support.',
    ],
    diagram: 'classification',
    definitions: [
      {
        term: ['数据', 'Data'],
        text: ['描述客观事物的符号集合，是计算机处理的对象。', 'Symbols that describe objects or events and are processed by a computer.'],
      },
      {
        term: ['数据元素', 'Data element'],
        text: ['数据的基本单位，通常作为一个整体被处理。', 'The basic unit of data, usually handled as a whole.'],
      },
      {
        term: ['数据项', 'Data item'],
        text: ['数据元素中不可分割的最小单位，例如学生的学号。', 'An indivisible unit inside a data element, such as a student ID.'],
      },
      {
        term: ['数据结构', 'Data structure'],
        text: ['相互之间存在一种或多种特定关系的数据元素的集合。', 'A collection of data elements that have one or more specific relationships.'],
      },
    ],
    sections: [
      {
        title: ['先看逻辑结构', 'Start with the logical structure'],
        body: [
          '逻辑结构只描述元素之间“是什么关系”，不关心它们在内存里怎样摆放。',
          'The logical structure describes how elements relate, independent of their memory layout.',
        ],
        points: [
          ['集合结构：元素同属一个集合，彼此没有其他关系。', 'Set: elements belong to one set with no further relationship.'],
          ['线性结构：元素排成一条有序序列，除首尾外每个元素只有一个前驱和一个后继。', 'Linear: one ordered sequence; each element has at most one predecessor and successor.'],
          ['树结构：元素之间存在一对多的层次关系。', 'Tree: one-to-many hierarchical relationships.'],
          ['图结构：元素之间存在多对多的任意关系。', 'Graph: many-to-many relationships.'],
        ],
      },
      {
        title: ['再看存储结构', 'Then the storage structure'],
        body: [
          '存储结构是逻辑结构在计算机中的实现。常见方式有顺序存储、链式存储、索引存储和散列存储。',
          'The storage structure implements the logical structure in memory: sequential, linked, indexed or hashed.',
        ],
        points: [
          ['顺序存储：用连续存储单元依次存放元素。', 'Sequential: elements occupy consecutive memory cells.'],
          ['链式存储：元素分布在任意位置，用指针或引用表示关系。', 'Linked: elements live anywhere and pointers express relationships.'],
          ['索引存储：额外建立索引表，用关键字定位元素。', 'Indexed: an index table maps keys to elements.'],
          ['散列存储：用哈希函数把关键字映射到存储位置。', 'Hashed: a hash function maps keys to locations.'],
        ],
      },
      {
        title: ['最后看运算', 'Finally, the operations'],
        body: [
          '同一种逻辑结构可以采用不同存储结构，因此同一组运算的代价也会不同。讨论数据结构时，要同时说明逻辑结构、存储结构和运算。',
          'The same logical structure can use different storage structures, so operation costs differ. Always name the logical structure, storage structure and operations together.',
        ],
        formula: '数据结构 = 逻辑结构 + 存储结构 + 运算',
      },
    ],
    comparison: {
      title: ['逻辑结构与存储结构', 'Logical vs physical structure'],
      columns: [
        ['比较项', 'Aspect'],
        ['逻辑结构', 'Logical structure'],
        ['存储结构', 'Storage structure'],
      ],
      rows: [
        [
          ['研究对象', 'What it describes'],
          ['元素之间的关系', 'Relationships between elements'],
          ['关系在内存中的实现', 'How relationships are stored'],
        ],
        [
          ['是否依赖机器', 'Machine dependent?'],
          ['不依赖', 'No'],
          ['依赖具体实现', 'Yes'],
        ],
        [
          ['常见类型', 'Common kinds'],
          ['集合、线性、树、图', 'Set, linear, tree, graph'],
          ['顺序、链式、索引、散列', 'Sequential, linked, indexed, hashed'],
        ],
      ],
    },
    takeaway: ['先看关系，再看存储，最后看运算。', 'Relationships first, storage second, operations third.'],
  },
  {
    id: 'complexity',
    topicId: 'algorithm-efficiency',
    title: ['时间复杂度与空间复杂度', 'Time and space complexity'],
    chapter: ['第 2 章 · 算法', 'Chapter 2 · Algorithms'],
    summary: [
      '复杂度不计算精确秒数，而是描述运行时间或额外空间随输入规模增长的趋势。',
      'Complexity does not measure exact seconds; it describes how time or extra space grows with input size.',
    ],
    diagram: 'complexity',
    definitions: [
      {
        term: ['时间复杂度', 'Time complexity'],
        text: ['基本操作执行次数 T(n) 随问题规模 n 增长的数量级。', 'The growth order of basic-operation count T(n) as input size n grows.'],
      },
      {
        term: ['空间复杂度', 'Space complexity'],
        text: ['算法额外占用的辅助空间随 n 增长的数量级，不含输入本身。', 'The growth order of extra working memory, excluding the input itself.'],
      },
      {
        term: ['基本操作', 'Basic operation'],
        text: ['与问题规模无关、一次完成的操作，例如比较或赋值。', 'A constant-time step such as a comparison or assignment.'],
      },
      {
        term: ['渐进上界', 'Asymptotic upper bound'],
        text: ['当 n 足够大时，T(n) 不超过某个常数乘以 f(n)，记作 O(f(n))。', 'For large enough n, T(n) is bounded above by a constant times f(n), written O(f(n)).'],
      },
    ],
    sections: [
      {
        title: ['怎样数出 O(f(n))', 'How to derive O(f(n))'],
        body: [
          '先找出执行次数最多的基本操作，写出 T(n)，再忽略常数系数和低阶项，只保留增长最快的一项。',
          'Find the most frequent basic operation, write T(n), then drop constant factors and lower-order terms; keep the fastest-growing term.',
        ],
        points: [
          ['顺序执行的两段代码：取较大的复杂度。', 'Sequential blocks: keep the larger complexity.'],
          ['嵌套循环：通常把各层规模相乘。', 'Nested loops: multiply the iteration counts.'],
          ['循环次数固定且循环体为 O(1)：整体仍是 O(1)。', 'Fixed iteration count with an O(1) body: still O(1).'],
          ['二分查找每轮把区间减半，因此是 O(log n)。', 'Binary search halves the range each round, hence O(log n).'],
        ],
        formula: 'T(n) = O(f(n))：常数因子忽略，低阶项忽略',
      },
      {
        title: ['常见增长量级', 'Common growth orders'],
        body: [
          '从慢到快通常记为：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)。n 较小时曲线可能交叉，但 n 增大后高阶项占主导。',
          'From slow to fast: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ). Curves may cross for small n, but the higher order dominates as n grows.',
        ],
        formula: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)',
      },
      {
        title: ['空间复杂度看“额外”', 'Space counts extra memory'],
        body: [
          '如果算法只用了几个临时变量，额外空间是 O(1)；如果新建了长度为 n 的数组或递归深度达到 n，额外空间是 O(n)。输入数组本身不计入辅助空间。',
          'A few temporary variables are O(1); a new n-length array or recursion depth n is O(n). The input itself is not auxiliary space.',
        ],
        points: [
          ['原地排序：额外空间 O(1)，但可能改变输入顺序。', 'In-place sort: O(1) extra space, possibly reordering the input.'],
          ['归并排序通常需要 O(n) 的辅助数组。', 'Merge sort usually needs an O(n) auxiliary array.'],
          ['递归调用栈也要计入空间复杂度。', 'Recursion stack frames count toward space complexity.'],
        ],
      },
    ],
    comparison: {
      title: ['时间与空间', 'Time vs space'],
      columns: [
        ['比较项', 'Aspect'],
        ['时间复杂度', 'Time'],
        ['空间复杂度', 'Space'],
      ],
      rows: [
        [
          ['衡量对象', 'What is measured'],
          ['基本操作次数', 'Basic-operation count'],
          ['额外辅助空间', 'Extra working memory'],
        ],
        [
          ['常见 O(1)', 'Typical O(1)'],
          ['一次赋值、一次比较', 'One assignment or comparison'],
          ['几个临时变量', 'A few temporary variables'],
        ],
        [
          ['常见 O(n)', 'Typical O(n)'],
          ['一次线性扫描', 'One linear scan'],
          ['长度为 n 的辅助数组', 'An n-length auxiliary array'],
        ],
      ],
    },
    takeaway: ['看增长趋势，不看精确秒数；看主导项，不看常数。', 'Track growth, not seconds; keep the dominant term, not constants.'],
  },
  {
    id: 'storage-structures',
    topicId: 'intro-logical-physical',
    title: ['顺序存储与链式存储', 'Sequential and linked storage'],
    chapter: ['第 1 章 · 数据结构绪论', 'Chapter 1 · Introduction'],
    summary: [
      '同一种逻辑结构可以用不同物理方式实现。顺序存储和链式存储是最基本、也最常考的两种策略。',
      'The same logical structure can be implemented in different physical ways. Sequential and linked storage are the two basic strategies.',
    ],
    diagram: 'storage',
    definitions: [
      {
        term: ['物理结构', 'Physical structure'],
        text: ['数据元素在计算机存储器中的实际表示和关系实现。', 'How elements and their relationships are actually represented in memory.'],
      },
      {
        term: ['顺序存储', 'Sequential storage'],
        text: ['把逻辑相邻的元素存放在物理相邻的存储单元中。', 'Logically adjacent elements occupy physically adjacent memory cells.'],
      },
      {
        term: ['链式存储', 'Linked storage'],
        text: ['元素存放在任意位置，用指针或引用记录下一个元素的位置。', 'Elements live anywhere; pointers or references record the next location.'],
      },
      {
        term: ['随机访问', 'Random access'],
        text: ['通过下标或地址直接定位元素，不需要从头逐个经过。', 'Locate an element directly by index or address, without walking from the start.'],
      },
    ],
    sections: [
      {
        title: ['顺序存储：连续与下标', 'Sequential: contiguous and indexed'],
        body: [
          '顺序表用一段连续空间存放元素，第 i 个元素的地址可以由首地址加偏移量直接算出，因此按下标访问是 O(1)。',
          'A sequential list stores elements in one contiguous block. Address(i) = base + i × size, so indexed access is O(1).',
        ],
        points: [
          ['插入或删除中间元素通常要搬移后续元素，代价 O(n)。', 'Inserting or deleting in the middle usually shifts elements, costing O(n).'],
          ['容量通常固定，扩容需要申请新空间并复制。', 'Capacity is usually fixed; growing requires new space and copying.'],
          ['连续存放对缓存友好，遍历速度快。', 'Contiguous layout is cache-friendly and fast to scan.'],
        ],
        formula: '地址(a[i]) = 首地址 + i × 每个元素的大小',
      },
      {
        title: ['链式存储：节点与指针', 'Linked: nodes and pointers'],
        body: [
          '链表把每个元素放进一个节点，节点里除了数据还保存后继（以及可选的先驱）地址。逻辑顺序由指针表达，而不是由物理位置表达。',
          'A linked list puts each element in a node that stores data plus the next (and optionally previous) address. Pointers, not physical order, express the sequence.',
        ],
        points: [
          ['按下标访问必须从头走，代价 O(n)。', 'Indexed access must walk from the head, costing O(n).'],
          ['已知插入位置时，改指针即可插入或删除，代价 O(1)。', 'Given the position, pointer updates insert or delete in O(1).'],
          ['每个节点额外保存指针，空间开销更大。', 'Each node stores extra pointers, increasing space overhead.'],
        ],
      },
      {
        title: ['怎样选', 'How to choose'],
        body: [
          '频繁按下标读取、元素数量稳定，优先顺序存储；频繁在中间插入删除、容量变化大，优先链式存储。实际工程中还要考虑缓存局部性、内存分配器和实现复杂度。',
          'Prefer sequential storage for frequent indexed reads and stable size; prefer linked storage for frequent middle insertions/deletions and flexible capacity. Also consider cache locality, allocator behavior and implementation cost.',
        ],
      },
    ],
    comparison: {
      title: ['顺序存储与链式存储', 'Sequential vs linked'],
      columns: [
        ['比较项', 'Aspect'],
        ['顺序存储', 'Sequential'],
        ['链式存储', 'Linked'],
      ],
      rows: [
        [
          ['存储单元', 'Memory cells'],
          ['连续', 'Contiguous'],
          ['任意位置', 'Anywhere'],
        ],
        [
          ['按下标访问', 'Indexed access'],
          ['O(1)', 'O(1)'],
          ['O(n)', 'O(n)'],
        ],
        [
          ['中间插入/删除', 'Middle insert/delete'],
          ['O(n)，需要搬移', 'O(n), shifting'],
          ['O(1)，已知位置时', 'O(1) given the position'],
        ],
        [
          ['额外空间', 'Extra space'],
          ['较少，可能预留容量', 'Little, may reserve capacity'],
          ['每个节点存指针', 'A pointer per node'],
        ],
      ],
    },
    takeaway: ['随机访问选顺序，频繁插删选链式。', 'Random access favors sequential; frequent insert/delete favors linked.'],
  },
  {
    id: 'tree-terms',
    topicId: 'binary-tree',
    title: ['树与二叉树的基本术语', 'Tree and binary tree terms'],
    chapter: ['第 6 章 · 树', 'Chapter 6 · Trees'],
    summary: [
      '树用一对多的层次关系组织数据；二叉树是每个节点最多有两个孩子的有序树，也是考试中性质最多的一类结构。',
      'A tree organizes data hierarchically; a binary tree is an ordered tree where each node has at most two children and carries most of the examinable properties.',
    ],
    diagram: 'tree',
    definitions: [
      {
        term: ['根节点', 'Root'],
        text: ['树中没有父节点的唯一节点。', 'The only node without a parent.'],
      },
      {
        term: ['父节点 / 子节点', 'Parent / child'],
        text: ['若 A 指向 B，则 A 是 B 的父节点，B 是 A 的子节点。', 'If A points to B, A is B’s parent and B is A’s child.'],
      },
      {
        term: ['兄弟节点', 'Sibling'],
        text: ['拥有同一个父节点的节点。', 'Nodes that share the same parent.'],
      },
      {
        term: ['度', 'Degree'],
        text: ['一个节点拥有的子树个数；树的度是所有节点度的最大值。', 'The number of subtrees of a node; the tree’s degree is the maximum node degree.'],
      },
      {
        term: ['叶子节点', 'Leaf'],
        text: ['度为 0、没有子节点的节点。', 'A node with degree 0 and no children.'],
      },
      {
        term: ['层次、深度、高度', 'Level, depth, height'],
        text: ['根为第 1 层；节点的深度是从根到它的层数，树的高度是最大层数。', 'The root is level 1; a node’s depth is its level, and tree height is the maximum level.'],
      },
      {
        term: ['二叉树', 'Binary tree'],
        text: ['每个节点至多有两个子节点，且左右子树有顺序之分。', 'Each node has at most two children, and left/right subtrees are ordered.'],
      },
    ],
    sections: [
      {
        title: ['树的术语看“关系”', 'Tree terms describe relationships'],
        body: [
          '树中任意两个节点之间只有一条简单路径；除根外每个节点恰有一个父节点。术语描述的是位置和层次，不是存储地址。',
          'There is exactly one simple path between any two nodes; every non-root node has exactly one parent. Terms describe position and level, not memory addresses.',
        ],
        points: [
          ['节点的子树数量就是度；二叉树中度为 0、1、2。', 'The number of subtrees is the degree; in a binary tree it is 0, 1 or 2.'],
          ['从根到某节点的边数等于该节点的深度减一。', 'Edges from root to a node equal its depth minus one.'],
          ['树的高度决定遍历、平衡和查找分析的规模。', 'Tree height drives traversal, balance and search analysis.'],
        ],
      },
      {
        title: ['二叉树的三条常用性质', 'Three useful binary-tree properties'],
        body: [
          '这三条性质是选择题和复杂度分析的高频考点，前提都是“二叉树”。',
          'These three properties are frequent exam points; all assume a binary tree.',
        ],
        points: [
          ['第 i 层最多有 2^(i−1) 个节点（根为第 1 层）。', 'Level i has at most 2^(i−1) nodes (root is level 1).'],
          ['深度为 k 的二叉树最多有 2^k − 1 个节点。', 'A binary tree of depth k has at most 2^k − 1 nodes.'],
          ['叶子数 n0 与度为 2 的节点数 n2 满足 n0 = n2 + 1。', 'Leaf count n0 and degree-2 node count n2 satisfy n0 = n2 + 1.'],
        ],
        formula: 'n0 = n2 + 1；深度 k 最多 2^k − 1 个节点',
      },
      {
        title: ['满二叉树与完全二叉树', 'Full and complete binary trees'],
        body: [
          '满二叉树每一层都填满；完全二叉树只允许最后一层右侧缺若干节点，其余层必须填满。完全二叉树适合用数组顺序存储，父子下标关系可以直接计算。',
          'A full binary tree fills every level; a complete binary tree fills all levels except possibly the last, which is filled left to right. A complete tree maps naturally to an array.',
        ],
        formula: '数组下标从 0 开始：左孩子 2i+1，右孩子 2i+2，父节点 ⌊(i−1)/2⌋',
      },
    ],
    comparison: {
      title: ['满二叉树与完全二叉树', 'Full vs complete'],
      columns: [
        ['比较项', 'Aspect'],
        ['满二叉树', 'Full'],
        ['完全二叉树', 'Complete'],
      ],
      rows: [
        [
          ['每层状态', 'Every level'],
          ['全部填满', 'All filled'],
          ['除最后一层外填满', 'All but the last filled'],
        ],
        [
          ['最后一层', 'Last level'],
          ['满', 'Full'],
          ['从左到右连续填充', 'Filled left to right'],
        ],
        [
          ['数组存储', 'Array storage'],
          ['可以', 'Possible'],
          ['最适合，下标关系直接', 'Ideal; direct index relations'],
        ],
      ],
    },
    takeaway: ['树看层次，二叉树记三条性质：2^(i−1)、2^k−1、n0 = n2 + 1。', 'Trees are hierarchical; remember 2^(i−1), 2^k−1 and n0 = n2 + 1.'],
  },
  {
    id: 'graph-basics',
    topicId: 'graph-basics',
    title: ['图的基本概念', 'Graph fundamentals'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '图由顶点和边组成，用来表示多对多关系。与树不同，图中可以有回路，也不要求连通。',
      'A graph consists of vertices and edges and represents many-to-many relationships. Unlike a tree, it may contain cycles and need not be connected.',
    ],
    diagram: 'graph',
    definitions: [
      {
        term: ['顶点与边', 'Vertex and edge'],
        text: ['顶点表示对象，边表示对象之间的联系。', 'Vertices represent objects; edges represent connections.'],
      },
      {
        term: ['有向图 / 无向图', 'Directed / undirected graph'],
        text: ['边有方向为有向图，边无方向为无向图。', 'Edges with direction form a directed graph; otherwise it is undirected.'],
      },
      {
        term: ['度', 'Degree'],
        text: ['无向图中与顶点相连的边数；有向图分为入度和出度。', 'In an undirected graph, the number of incident edges; directed graphs have in-degree and out-degree.'],
      },
      {
        term: ['路径与回路', 'Path and cycle'],
        text: ['路径是顶点和边的交替序列；起点与终点相同的路径是回路。', 'A path alternates vertices and edges; a path whose endpoints coincide is a cycle.'],
      },
      {
        term: ['连通图与连通分量', 'Connected graph and component'],
        text: ['任意两顶点间都有路径为连通图；无向图的极大连通子图是连通分量。', 'A graph is connected if every pair has a path; a maximal connected subgraph is a component.'],
      },
      {
        term: ['生成树', 'Spanning tree'],
        text: ['连通无向图的一个极小连通子图，含全部 n 个顶点和 n−1 条边。', 'A minimal connected subgraph of a connected undirected graph: all n vertices and n−1 edges.'],
      },
    ],
    sections: [
      {
        title: ['图的分类', 'Kinds of graphs'],
        body: [
          '先判断边有没有方向，再判断边上有没有权值，最后看是否允许重复边和自环。简单图通常不允许自环和重边。',
          'First ask whether edges are directed, then whether they carry weights, then whether loops and parallel edges are allowed. A simple graph usually forbids both.',
        ],
        points: [
          ['无向图：边 (u, v) 与 (v, u) 是同一条边。', 'Undirected: (u, v) and (v, u) are the same edge.'],
          ['有向图：边 <u, v> 表示只能从 u 到 v。', 'Directed: <u, v> goes from u to v only.'],
          ['带权图：每条边附带一个权值，常用于最短路径和最小生成树。', 'Weighted: each edge has a weight, common in shortest paths and MSTs.'],
        ],
      },
      {
        title: ['度与边数的关系', 'Degree and edge counts'],
        body: [
          '每条无向边会给两个端点的度各加一，因此所有顶点度数之和等于边数的两倍。这个关系常用来判断度数序列是否可能。',
          'Every undirected edge adds one to each endpoint’s degree, so the degree sum is twice the edge count. This helps test whether a degree sequence is possible.',
        ],
        formula: 'Σ deg(v) = 2|E|（无向图）；简单无向图 |E| ≤ n(n−1)/2',
      },
      {
        title: ['连通性与生成树', 'Connectivity and spanning trees'],
        body: [
          '无向图可以用 BFS/DFS 找出所有连通分量。连通图的生成树不唯一，但任何生成树都恰好有 n−1 条边；最小生成树再要求边权总和最小。',
          'BFS/DFS finds all components of an undirected graph. A connected graph can have many spanning trees, but each has exactly n−1 edges; a minimum spanning tree additionally minimizes total weight.',
        ],
        points: [
          ['有 n 个顶点、少于 n−1 条边的无向图一定不连通。', 'An undirected graph with n vertices and fewer than n−1 edges cannot be connected.'],
          ['树是无环连通图；加一条边必产生回路，删一条边必断开。', 'A tree is a connected acyclic graph; adding an edge creates a cycle, removing one disconnects it.'],
        ],
      },
    ],
    comparison: {
      title: ['有向图与无向图', 'Directed vs undirected'],
      columns: [
        ['比较项', 'Aspect'],
        ['无向图', 'Undirected'],
        ['有向图', 'Directed'],
      ],
      rows: [
        [
          ['边的记法', 'Edge notation'],
          ['(u, v) = (v, u)', '(u, v) = (v, u)'],
          ['<u, v> 有方向', '<u, v> is directed'],
        ],
        [
          ['度的定义', 'Degree'],
          ['相邻边数', 'Incident edges'],
          ['入度 + 出度', 'In-degree + out-degree'],
        ],
        [
          ['度数总和', 'Degree sum'],
          ['2|E|', '2|E|'],
          ['每条边贡献一出、一入', 'One out and one in per edge'],
        ],
        [
          ['连通性', 'Connectivity'],
          ['连通、连通分量', 'Connected, component'],
          ['强连通、强连通分量', 'Strongly connected, SCC'],
        ],
      ],
    },
    takeaway: ['图看顶点和边，先分方向，再算度，最后谈连通。', 'Vertices and edges first; direction, degree, then connectivity.'],
  },
  {
    id: 'adt',
    topicId: 'intro-adt',
    title: ['抽象数据类型（ADT）', 'Abstract data types (ADT)'],
    chapter: ['第 1 章 · 数据结构绪论', 'Chapter 1 · Introduction'],
    summary: [
      '抽象数据类型先把“数据是什么、能做什么操作”定义清楚，再决定底层怎样存储。它让你在使用一个结构时，不必依赖它的内部实现。',
      'An abstract data type specifies what data is stored and which operations it supports before deciding how it is represented. Its users need not depend on the internal implementation.',
    ],
    diagram: 'adt',
    definitions: [
      {
        term: ['抽象数据类型', 'Abstract data type'],
        text: ['由数据对象、数据关系和一组合法操作组成的数学模型，不规定具体存储方式。', 'A mathematical model consisting of a data object, its relationships and a set of legal operations, without prescribing a representation.'],
      },
      {
        term: ['数据对象', 'Data object'],
        text: ['同一类数据元素的集合，例如所有整数或所有学生记录。', 'A set of data elements of one kind, such as all integers or all student records.'],
      },
      {
        term: ['操作契约', 'Operation contract'],
        text: ['操作的名字、参数、前提条件和结果语义；调用者只需遵守契约。', 'An operation’s name, parameters, preconditions and result semantics; callers only need to honour the contract.'],
      },
      {
        term: ['封装', 'Encapsulation'],
        text: ['对外暴露操作，隐藏内部表示，使实现可以替换而接口保持稳定。', 'Expose operations while hiding the representation, so implementations can change without changing the interface.'],
      },
    ],
    sections: [
      {
        title: ['ADT 不等于某种存储结构', 'An ADT is not a storage layout'],
        body: [
          '“栈”是 ADT：它规定后进先出以及 push、pop 等操作；用数组或链表都能实现。存储结构是实现层，ADT 是抽象层。',
          'A stack is an ADT: it specifies last-in-first-out behaviour and operations such as push and pop. An array or a linked list can implement it. Storage belongs to the implementation layer.',
        ],
        points: [
          ['同一 ADT 可以有多种实现，操作代价可能不同。', 'One ADT can have several implementations with different operation costs.'],
          ['抽象层不暴露数组下标、指针或哈希桶。', 'The abstract layer exposes no array indices, pointers or hash buckets.'],
          ['更换实现时，只要操作语义不变，调用者无需改写。', 'If the operation semantics stay the same, callers need not change when the implementation changes.'],
        ],
        formula: 'ADT = (数据对象, 数据关系, 操作集合)',
      },
      {
        title: ['用栈看清“抽象”', 'See abstraction through a stack'],
        body: [
          '栈的操作契约可以写成：push(x) 把 x 放到栈顶；pop() 删除并返回栈顶；top() 只读栈顶；isEmpty() 判断是否为空。契约没有规定栈顶在数组的哪一端。',
          'A stack contract might say: push(x) places x on top; pop() removes and returns the top; top() reads it; isEmpty() tests emptiness. The contract never says which array end holds the top.',
        ],
        points: [
          ['顺序栈用一段连续空间加一个栈顶指针。', 'An array stack uses contiguous space and a top index.'],
          ['链栈用节点和头指针，push/pop 都在表头完成。', 'A linked stack uses nodes and a head pointer; push and pop happen at the head.'],
          ['两种实现的 push、pop 都可以是 O(1)。', 'Both implementations can perform push and pop in O(1).'],
        ],
      },
      {
        title: ['为什么工程和考试都先讲 ADT', 'Why ADT comes first'],
        body: [
          '先定义操作，才能独立分析正确性和复杂度；先封装表示，才能安全地替换实现。考试中看到“设计一个结构并支持某组操作”，第一步就是写清数据对象和操作契约。',
          'Defining operations first makes correctness and complexity analysis independent of representation. Encapsulation then allows safe replacement. When an exam asks you to design a structure supporting a set of operations, start by stating the data object and operation contracts.',
        ],
      },
    ],
    comparison: {
      title: ['抽象层与实现层', 'Abstract layer vs implementation layer'],
      columns: [
        ['比较项', 'Aspect'],
        ['抽象层（ADT）', 'Abstract layer (ADT)'],
        ['实现层', 'Implementation layer'],
      ],
      rows: [
        [
          ['关心什么', 'Focus'],
          ['数据对象、关系和操作语义', 'Data object, relationships and operation semantics'],
          ['内存布局、指针和具体算法', 'Memory layout, pointers and concrete algorithms'],
        ],
        [
          ['典型描述', 'Typical description'],
          ['栈、队列、集合', 'Stack, queue, set'],
          ['数组栈、链栈、循环队列', 'Array stack, linked stack, circular queue'],
        ],
        [
          ['能否直接访问内部', 'Direct internal access'],
          ['不能，只能通过操作', 'No; operations only'],
          ['可以，由实现者控制', 'Yes, controlled by the implementer'],
        ],
      ],
    },
    takeaway: ['先约定能做什么，再决定怎么存。', 'Agree on what it does before deciding how it is stored.'],
  },
  {
    id: 'algorithm-cases',
    topicId: 'algorithm-cases',
    title: ['最好、平均与最坏情况', 'Best, average and worst cases'],
    chapter: ['第 2 章 · 算法', 'Chapter 2 · Algorithms'],
    summary: [
      '同一个算法、同样的输入规模，不同输入仍可能让执行次数相差很大。最好、平均和最坏情况分别描述这三种可能，而不是三个不同算法。',
      'The same algorithm and input size can still take very different numbers of steps on different inputs. Best, average and worst cases describe these possibilities, not three different algorithms.',
    ],
    diagram: 'cases',
    definitions: [
      {
        term: ['输入规模', 'Input size'],
        text: ['决定问题规模的非负整数 n，例如数组长度或图中顶点数。', 'A non-negative integer n describing problem size, such as array length or vertex count.'],
      },
      {
        term: ['最好情况', 'Best case'],
        text: ['在所有规模为 n 的合法输入中，执行基本操作次数最少的情况。', 'Among all legal inputs of size n, the one requiring the fewest basic operations.'],
      },
      {
        term: ['最坏情况', 'Worst case'],
        text: ['在所有规模为 n 的合法输入中，执行基本操作次数最多的情况。', 'Among all legal inputs of size n, the one requiring the most basic operations.'],
      },
      {
        term: ['平均情况', 'Average case'],
        text: ['在给定输入分布下，执行次数的期望值；必须先说明分布假设。', 'The expected operation count under a stated input distribution; the distribution must be specified.'],
      },
    ],
    sections: [
      {
        title: ['同一规模，输入不同', 'Same size, different inputs'],
        body: [
          '以顺序查找为例：在长度为 n 的数组中找目标，目标在第一个位置只需 1 次比较；在最后一个位置或不存在时需要 n 次比较。输入规模都是 n，代价却从 1 变到 n。',
          'Consider linear search in an array of length n. If the target is first, one comparison suffices; if it is last or absent, n comparisons are needed. The input size is n in both cases, but the cost ranges from 1 to n.',
        ],
        points: [
          ['最好情况给出下界：至少要做多少工作。', 'Best case gives a lower bound: the least work required.'],
          ['最坏情况给出上界：最多要做多少工作。', 'Worst case gives an upper bound: the most work required.'],
          ['只写 O(n) 而不说明是哪种情况，信息是不完整的。', 'Writing O(n) without naming the case leaves the statement incomplete.'],
        ],
        formula: '顺序查找：最好 1 次，最坏 n 次（目标不存在也算最坏）',
      },
      {
        title: ['平均情况不是两头的平均数', 'Average is not the midpoint of best and worst'],
        body: [
          '平均复杂度依赖输入分布。若目标等概率出现在 n 个位置，平均比较次数是 (n+1)/2；若目标经常排在前面，平均值会更小；若大多数查询根本不存在，平均值会接近 n。',
          'Average complexity depends on the input distribution. If the target is equally likely at any of n positions, the average is (n+1)/2 comparisons. If targets tend to be early, the average is lower; if most searches fail, it approaches n.',
        ],
        points: [
          ['先声明分布，再计算期望。', 'State the distribution before computing an expectation.'],
          ['不能把 (最好 + 最坏)/2 直接当作平均情况。', 'Do not treat (best + worst)/2 as the average case.'],
          ['实际数据分布未知时，最坏情况通常是更稳妥的保证。', 'When the real distribution is unknown, the worst case is usually the safer guarantee.'],
        ],
      },
      {
        title: ['写复杂度时怎样标注', 'How to state the case'],
        body: [
          '没有特别说明时，教材和面试常把 O(f(n)) 视为最坏情况的上界；但涉及快速排序、顺序查找等输入敏感的算法，必须明确写“最坏 O(n²)、平均 O(n log n)”。',
          'Unless stated otherwise, textbooks and interviews often treat O(f(n)) as a worst-case upper bound. For input-sensitive algorithms such as quicksort or linear search, state both cases explicitly, for example “worst O(n²), average O(n log n)”.',
        ],
        points: [
          ['最好情况常用于判断算法是否存在更优路径，不代表日常性能。', 'Best case shows a favourable path, not everyday performance.'],
          ['最坏情况用于可靠性保证和实时系统预算。', 'Worst case supports reliability guarantees and real-time budgets.'],
          ['平均情况用于长期吞吐量估算，但必须有数据分布依据。', 'Average case estimates long-run throughput, but only with evidence about the distribution.'],
        ],
      },
    ],
    comparison: {
      title: ['三种情况的分工', 'What each case answers'],
      columns: [
        ['情况', 'Case'],
        ['回答的问题', 'Question answered'],
        ['典型用途', 'Typical use'],
      ],
      rows: [
        [
          ['最好情况', 'Best'],
          ['最少需要多少操作？', 'What is the minimum work?'],
          ['下界、乐观路径', 'Lower bound, optimistic path'],
        ],
        [
          ['最坏情况', 'Worst'],
          ['最多需要多少操作？', 'What is the maximum work?'],
          ['上界、可靠性保证', 'Upper bound, reliability'],
        ],
        [
          ['平均情况', 'Average'],
          ['按某种分布平均要多少操作？', 'Expected work under a distribution?'],
          ['长期性能、吞吐量估算', 'Long-run performance'],
        ],
      ],
    },
    takeaway: ['先问“哪种输入”，再谈复杂度；平均情况必须带分布假设。', 'Name the input case first; average always needs a distribution.'],
  },
  {
    id: 'linear-list',
    topicId: 'linear-basics',
    title: ['线性表的定义与基本操作', 'Linear lists: definition and operations'],
    chapter: ['第 3 章 · 线性表', 'Chapter 3 · Linear lists'],
    summary: [
      '线性表是由有限个同类型元素组成的有序序列。它描述的是元素之间的前驱、后继关系，具体用数组还是链表存放则是另一层问题。',
      'A linear list is a finite ordered sequence of elements of the same type. It describes predecessor and successor relationships; whether an array or a linked list stores it is a separate question.',
    ],
    diagram: 'storage',
    definitions: [
      {
        term: ['线性表', 'Linear list'],
        text: ['n 个同类型数据元素的有限序列，记作 (a1, a2, …, an)，n 可以等于 0。', 'A finite sequence of n elements of the same type, written (a1, a2, …, an); n may be zero.'],
      },
      {
        term: ['表长', 'Length'],
        text: ['线性表中元素的个数 n；n = 0 时称为空表。', 'The number of elements n; n = 0 gives an empty list.'],
      },
      {
        term: ['前驱与后继', 'Predecessor and successor'],
        text: ['除首元素外，每个元素恰有一个直接前驱；除尾元素外，每个元素恰有一个直接后继。', 'Every element except the first has one immediate predecessor; every element except the last has one immediate successor.'],
      },
      {
        term: ['基本操作', 'Basic operations'],
        text: ['初始化、求长度、按位置读取、按值查找、插入、删除和遍历。', 'Initialise, get length, read by position, locate by value, insert, delete and traverse.'],
      },
    ],
    sections: [
      {
        title: ['逻辑特征：一条有序链', 'Logical shape: one ordered chain'],
        body: [
          '线性表的元素有先后次序：a1 是首元素，an 是尾元素；对 1 < i < n，ai 的前驱是 a(i−1)，后继是 a(i+1)。这里的“线性”指逻辑关系，不指内存地址连续。',
          'The elements are ordered: a1 is first and an is last. For 1 < i < n, ai has predecessor a(i−1) and successor a(i+1). “Linear” describes logical order, not contiguous memory.',
        ],
        points: [
          ['同一元素可以在不同线性表中出现，但同一表内位置唯一。', 'An element may appear in different lists, but has one position within a given list.'],
          ['除首尾外，每个元素的前驱和后继都唯一。', 'Except at the ends, every element has a unique predecessor and successor.'],
          ['线性表不要求元素按值有序，只要求位置有先后。', 'The values need not be sorted; only positions are ordered.'],
        ],
        formula: 'a(i−1) → ai → a(i+1)，其中 1 < i < n',
      },
      {
        title: ['操作要写清位置是否合法', 'Operations have position preconditions'],
        body: [
          '按教材习惯，位置从 1 开始。插入时合法位置是 1 到 n+1，因为可以插在表尾之后；删除和读取的合法位置是 1 到 n。代码若用 0 开始的下标，要相应换算。',
          'Following the textbook convention, positions start at 1. Insertion is legal at positions 1 through n+1 because appending is allowed; deletion and reading require 1 through n. Code using zero-based indices must translate accordingly.',
        ],
        points: [
          ['GetElem(L, i) 返回第 i 个元素，前提是 1 ≤ i ≤ n。', 'GetElem(L, i) returns element i when 1 ≤ i ≤ n.'],
          ['Insert(L, i, x) 把 x 放进位置 i，原第 i 个及之后的元素后移。', 'Insert(L, i, x) places x at i and shifts the old element i and later ones right.'],
          ['Delete(L, i) 删除位置 i 的元素，并返回被删元素。', 'Delete(L, i) removes and returns the element at i.'],
          ['LocateElem(L, x) 通常返回第一个等于 x 的位置，找不到返回 0 或空。', 'LocateElem(L, x) usually returns the first position equal to x, or 0/null if absent.'],
        ],
      },
      {
        title: ['存储方式决定操作代价', 'Storage decides operation costs'],
        body: [
          '顺序表把元素放在连续空间里，按下标读取 O(1)，但在中间插入删除要搬移元素；链表用指针连接节点，若已经持有前驱节点，插入和删除只需改指针，O(1)，但按下标访问仍要逐个走。选择时要看访问与修改的比例。',
          'A sequential list stores elements contiguously: indexed access is O(1), but middle insertion/deletion shifts elements. A linked list connects nodes with pointers: given the predecessor node, insertion and deletion relink in O(1), but indexed access still walks the list. Choose by the read/write mix.',
        ],
        points: [
          ['读多写少、规模稳定：优先顺序表。', 'Many reads, few writes, stable size: prefer a sequential list.'],
          ['频繁在中间插删且已定位前驱、规模变化大：优先链表。', 'Frequent middle insert/delete with the predecessor at hand, changing size: prefer a linked list.'],
          ['链表每个节点还要付出指针空间和分配开销。', 'Linked nodes pay extra pointer space and allocation overhead.'],
        ],
      },
    ],
    comparison: {
      title: ['顺序表与链表', 'Sequential vs linked list'],
      columns: [
        ['操作', 'Operation'],
        ['顺序表', 'Sequential list'],
        ['链表', 'Linked list'],
      ],
      rows: [
        [
          ['按位置读取', 'Read by position'],
          ['O(1)', 'O(1)'],
          ['O(n)', 'O(n)'],
        ],
        [
          ['已知前驱的插入/删除', 'Insert/delete with predecessor known'],
          ['O(n)，需要搬移', 'O(n), shifting'],
          ['O(1)，修改指针', 'O(1), relink'],
        ],
        [
          ['查找值为 x 的元素', 'Locate value x'],
          ['O(n)', 'O(n)'],
          ['O(n)', 'O(n)'],
        ],
        [
          ['额外空间', 'Extra space'],
          ['可能预留容量', 'May reserve capacity'],
          ['每个节点存指针', 'A pointer per node'],
        ],
      ],
    },
    takeaway: ['线性表先看逻辑顺序，再看存储代价；位置合法性是操作的第一道检查。', 'Start with logical order, then storage cost; validate positions before every operation.'],
  },
  {
    id: 'graph-storage',
    topicId: 'graph-storage',
    title: ['图的存储：邻接矩阵与邻接表', 'Graph storage: matrix and adjacency list'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '同一个图可以用邻接矩阵或邻接表存储。矩阵用空间换 O(1) 的边查询，邻接表按实际边数分配空间，更适合稀疏图。',
      'A graph can be stored as an adjacency matrix or an adjacency list. The matrix trades space for O(1) edge lookup; the list allocates by actual edges and suits sparse graphs.',
    ],
    diagram: 'graph-storage',
    definitions: [
      {
        term: ['邻接矩阵', 'Adjacency matrix'],
        text: ['用 n×n 矩阵 A 表示顶点之间的边；A[i][j] 记录 i 到 j 是否有边或边权。', 'An n×n matrix A records whether there is an edge from i to j, or its weight.'],
      },
      {
        term: ['邻接表', 'Adjacency list'],
        text: ['为每个顶点维护一个边表，表中每个结点记录一个相邻顶点及其边权。', 'Each vertex owns an edge list; every entry records an adjacent vertex and its weight.'],
      },
      {
        term: ['边结点', 'Edge node'],
        text: ['邻接表中的一个表项，通常保存邻接点编号、权值和下一个边结点的指针。', 'An entry in an adjacency list, usually storing the neighbour id, weight and a pointer to the next entry.'],
      },
      {
        term: ['稀疏图与稠密图', 'Sparse and dense graphs'],
        text: ['边数远小于 n² 为稀疏图；边数接近 n² 为稠密图。', 'A graph with far fewer than n² edges is sparse; one close to n² is dense.'],
      },
    ],
    sections: [
      {
        title: ['邻接矩阵：二维表格', 'Adjacency matrix: a two-dimensional table'],
        body: [
          '无向图的邻接矩阵关于主对角线对称，因为 (u, v) 和 (v, u) 是同一条边；有向图通常不对称。带权图把 1 换成权值，并用 0 或 ∞ 表示没有边（具体取值取决于算法）。',
          'An undirected graph has a symmetric adjacency matrix because (u, v) and (v, u) are the same edge; a directed graph need not be symmetric. A weighted graph stores weights instead of 1 and uses 0 or ∞ for “no edge”, depending on the algorithm.',
        ],
        points: [
          ['空间固定为 O(n²)，与边数无关。', 'Space is O(n²), independent of the edge count.'],
          ['判断 (i, j) 是否有边只需一次矩阵访问，O(1)。', 'Testing edge (i, j) takes one matrix access, O(1).'],
          ['枚举 i 的所有邻接点要扫描整行，O(n)。', 'Listing all neighbours of i scans a full row, O(n).'],
          ['适合稠密图和需要频繁判断两点是否相邻的场景。', 'Suits dense graphs and frequent adjacency tests.'],
        ],
        formula: 'A[i][j] = 1（或权值）表示 <i, j> ∈ E；否则为 0 或 ∞',
      },
      {
        title: ['邻接表：按边分配', 'Adjacency list: allocate by edges'],
        body: [
          '邻接表有 n 个顶点表项，每个表项指向一条边链表。有向图通常只存出边；无向图的一条边会在两个端点的链表中各出现一次，所以边结点数是 2|E|。',
          'An adjacency list has n vertex entries, each pointing to an edge list. A directed graph usually stores outgoing arcs only; an undirected edge appears in both endpoint lists, so there are 2|E| edge nodes.',
        ],
        points: [
          ['空间为 O(n + e)，e 是边或弧的数目；无向图常写作 O(n + 2e)。', 'Space is O(n + e), where e counts edges or arcs; for undirected graphs it is often written O(n + 2e).'],
          ['判断 (u, v) 是否有边要遍历 u 的边表，最坏 O(deg(u))。', 'Testing edge (u, v) scans u’s list, worst case O(deg(u)).'],
          ['枚举 u 的邻接点只需走它的边表，代价与度数成正比。', 'Listing u’s neighbours walks its edge list, proportional to its degree.'],
          ['适合稀疏图以及 BFS、DFS 等需要反复枚举邻接点的算法。', 'Suits sparse graphs and BFS/DFS, which repeatedly enumerate neighbours.'],
        ],
      },
      {
        title: ['怎样选择', 'How to choose'],
        body: [
          '先估计 n 和 e 的量级：若 e 接近 n²，矩阵的固定空间可以接受，且边查询更快；若 e 远小于 n²，邻接表避免大量空单元。实际还要看是否需要频繁判断任意两点相邻，以及是否要按顶点编号稳定输出。',
          'Estimate n and e first. If e is close to n², the matrix’s fixed space is acceptable and edge lookup is faster. If e is far below n², an adjacency list avoids many empty cells. Also consider whether arbitrary adjacency tests dominate and whether stable vertex-order output matters.',
        ],
        points: [
          ['稠密图、频繁查边：邻接矩阵。', 'Dense graph, frequent edge tests: adjacency matrix.'],
          ['稀疏图、频繁遍历邻接点：邻接表。', 'Sparse graph, frequent neighbour scans: adjacency list.'],
          ['两种表示都能支持 BFS/DFS，但枚举邻接点的代价不同。', 'Both support BFS/DFS, but neighbour enumeration costs differ.'],
        ],
      },
    ],
    comparison: {
      title: ['邻接矩阵与邻接表', 'Adjacency matrix vs adjacency list'],
      columns: [
        ['比较项', 'Aspect'],
        ['邻接矩阵', 'Adjacency matrix'],
        ['邻接表', 'Adjacency list'],
      ],
      rows: [
        [
          ['空间', 'Space'],
          ['O(n²)', 'O(n²)'],
          ['O(n + e)', 'O(n + e)'],
        ],
        [
          ['判断边 (u, v)', 'Test edge (u, v)'],
          ['O(1)', 'O(1)'],
          ['O(deg(u))', 'O(deg(u))'],
        ],
        [
          ['枚举 u 的邻接点', 'List neighbours of u'],
          ['O(n)', 'O(n)'],
          ['O(deg(u))', 'O(deg(u))'],
        ],
        [
          ['适用场景', 'Best for'],
          ['稠密图、频繁查边', 'Dense graphs, frequent edge tests'],
          ['稀疏图、频繁遍历', 'Sparse graphs, frequent scans'],
        ],
      ],
    },
    takeaway: ['矩阵看两点，邻接表看邻居；稠密选矩阵，稀疏选表。', 'A matrix asks “are these two adjacent?”; a list asks “who are the neighbours?”.'],
  },
  {
    id: 'sorting-basics',
    topicId: 'sort-basics',
    title: ['排序基础：稳定性、原地与复杂度', 'Sorting basics: stability, in-place and complexity'],
    chapter: ['第 9 章 · 排序', 'Chapter 9 · Sorting'],
    summary: [
      '评价排序算法不只看平均时间复杂度，还要看最坏情况、额外空间、稳定性和数据特点。稳定性在按多个关键字排序时尤其重要。',
      'Evaluating a sorting algorithm is not only about average time. Worst case, extra space, stability and input characteristics all matter; stability is especially important for multi-key sorting.',
    ],
    diagram: 'sorting',
    definitions: [
      {
        term: ['稳定排序', 'Stable sort'],
        text: ['排序后，关键字相等的元素仍保持原来的相对次序。', 'After sorting, elements with equal keys keep their original relative order.'],
      },
      {
        term: ['原地排序', 'In-place sort'],
        text: ['除输入数据外只使用常数级辅助空间；递归调用栈要单独计入。', 'Uses only constant extra space beyond the input; recursion stack must be counted separately.'],
      },
      {
        term: ['比较排序', 'Comparison sort'],
        text: ['只通过比较元素关键字的大小决定次序的排序。', 'A sort that decides order only by comparing keys.'],
      },
      {
        term: ['稳定性意义', 'Why stability matters'],
        text: ['先按次要关键字排，再按主要关键字排时，稳定排序能保留前一次的次序。', 'When sorting by a secondary key and then a primary key, a stable sort preserves the earlier order.'],
      },
    ],
    sections: [
      {
        title: ['稳定性：相等元素也有先后', 'Stability: equal keys still have an order'],
        body: [
          '设两条记录 (90, “小林”) 和 (90, “小周”) 原本小林在前。按分数排序后，稳定算法仍让小林在前；不稳定算法可能交换两者。关键字相等不代表记录完全相同。',
          'Suppose records (90, “Lin”) and (90, “Zhou”) have Lin first originally. After sorting by score, a stable algorithm keeps Lin first; an unstable one may swap them. Equal keys do not make the records identical.',
        ],
        points: [
          ['稳定排序适合“先按 A 排，再按 B 排”的多关键字流程。', 'Stable sorts support “sort by A, then by B” multi-key workflows.'],
          ['冒泡、插入、归并通常稳定；选择、快速、堆排序通常不稳定。', 'Bubble, insertion and merge sorts are usually stable; selection, quicksort and heap sort usually are not.'],
          ['稳定性是算法性质，不是比较函数本身决定的。', 'Stability is a property of the algorithm, not of the comparator alone.'],
        ],
      },
      {
        title: ['原地不等于不占空间', 'In-place does not mean zero space'],
        body: [
          '原地排序通常指额外空间为 O(1)，例如冒泡、插入、选择、堆排序。快速排序只额外使用递归栈，平均 O(log n)，一般不称作严格 O(1) 原地；归并排序需要 O(n) 的辅助数组。',
          'In-place usually means O(1) extra space, as in bubble, insertion, selection and heap sort. Quicksort uses a recursion stack, O(log n) on average, so it is not strictly O(1) in-place; merge sort needs an O(n) auxiliary array.',
        ],
        points: [
          ['辅助数组、递归栈和临时缓冲区都要计入空间复杂度。', 'Auxiliary arrays, recursion stacks and temporary buffers all count.'],
          ['空间紧张时优先考虑 O(1) 或 O(log n) 的算法。', 'When memory is tight, prefer O(1) or O(log n) extra space.'],
          ['原地算法可能破坏稳定性，例如原地选择排序。', 'An in-place algorithm may sacrifice stability, as in in-place selection sort.'],
        ],
      },
      {
        title: ['比较排序的下界与选择', 'Comparison lower bound and choosing'],
        body: [
          '只靠比较关键字的排序，其最坏情况至少需要 Ω(n log n) 次比较，这是由决策树模型得到的下界。归并和堆排序达到这个量级；快速排序平均很快，但最坏会退化到 O(n²)。若数据范围有限，计数排序、基数排序等非比较方法可以绕过这个下界。',
          'A comparison sort needs at least Ω(n log n) comparisons in the worst case, a lower bound from the decision-tree model. Merge and heap sort reach this order; quicksort is fast on average but degrades to O(n²) in the worst case. When key ranges are limited, non-comparison methods such as counting or radix sort can avoid the bound.',
        ],
        points: [
          ['先看 n 的量级和数据分布，再选算法。', 'Consider n and the data distribution before choosing.'],
          ['几乎有序的小数组常用插入排序，常数小。', 'Insertion sort is often good for small or nearly sorted arrays.'],
          ['需要稳定且能接受额外空间时，归并排序是稳妥选择。', 'Merge sort is a safe choice when stability is required and extra space is acceptable.'],
          ['快速排序要关注最坏划分和递归深度。', 'For quicksort, watch worst-case partitions and recursion depth.'],
        ],
        formula: '比较排序最坏情况下界：Ω(n log n)',
      },
    ],
    comparison: {
      title: ['常见排序算法对比', 'Common sorting algorithms'],
      columns: [
        ['算法', 'Algorithm'],
        ['平均时间', 'Average'],
        ['最坏时间', 'Worst'],
        ['额外空间', 'Extra space'],
        ['稳定', 'Stable'],
      ],
      rows: [
        [
          ['冒泡排序', 'Bubble'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['是', 'Yes'],
        ],
        [
          ['简单选择排序', 'Selection'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['否', 'No'],
        ],
        [
          ['直接插入排序', 'Insertion'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['是', 'Yes'],
        ],
        [
          ['归并排序', 'Merge'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n)', 'O(n)'],
          ['是', 'Yes'],
        ],
        [
          ['快速排序', 'Quicksort'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n²)', 'O(n²)'],
          ['O(log n) 平均 / O(n) 最坏', 'O(log n) avg / O(n) worst'],
          ['否', 'No'],
        ],
        [
          ['堆排序', 'Heap'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(1)', 'O(1)'],
          ['否', 'No'],
        ],
      ],
    },
    takeaway: ['排序没有全能冠军：先定稳定性、空间和最坏情况，再看平均速度。', 'No sorting algorithm wins on every axis: fix stability, space and worst case first, then compare average speed.'],
  },
  {
    id: 'string-basics',
    topicId: 'string-basics',
    title: ['串的定义与模式匹配基础', 'Strings and the foundations of pattern matching'],
    chapter: ['第 5 章 · 串与模式匹配', 'Chapter 5 · Strings and pattern matching'],
    summary: [
      '串是由字符组成的有限序列；模式匹配要在一段主串中找出模式串的全部出现位置。朴素方法在失配后反复回到起点，KMP 则用前缀表复用已经比较过的信息。',
      'A string is a finite sequence of characters; pattern matching finds every occurrence of a pattern inside a text. Naive matching restarts after each mismatch, while KMP reuses already-compared information through a prefix table.',
    ],
    diagram: 'string',
    definitions: [
      {
        term: ['串（字符串）', 'String'],
        text: ['由零个或多个字符组成的有限序列，通常记作 S = "a₁a₂…aₙ"。', 'A finite sequence of zero or more characters, usually written S = "a₁a₂…aₙ".'],
      },
      {
        term: ['空串', 'Empty string'],
        text: ['长度为 0 的串，记作 "" 或 ∅。空串不是空格串：空格也是一个字符。', 'The string of length 0, written "" or ∅. It is not a blank string: a space is a character.'],
      },
      {
        term: ['子串', 'Substring'],
        text: ['主串中连续一段字符构成的串；空串也是任何串的子串，不等于原串的子串称为真子串。', 'A contiguous segment of a text; the empty string is a substring of every string, and a substring different from the whole string is a proper substring.'],
      },
      {
        term: ['长度', 'Length'],
        text: ['串中字符的个数。比较的是字符个数，不是字节数，也不是肉眼看到的显示宽度。', 'The number of characters in the string, not the number of bytes and not the rendered width.'],
      },
      {
        term: ['位置', 'Position'],
        text: ['字符或子串在串中的序号。教材常从 1 开始计数；本课程代码与动画从 0 开始，报告结果时会明确说明基准。', 'The ordinal of a character or substring. Textbooks often count from 1; this course’s code and animation count from 0 and always state the base explicitly.'],
      },
    ],
    sections: [
      {
        title: ['串的基本操作', 'Basic string operations'],
        body: [
          '串是线性结构，但它的元素只能是字符，运算围绕整段序列展开。讨论复杂度时，要区分“读一个字符”和“复制一整段串”。',
          'A string is linear, but its elements are characters and its operations act on whole sequences. When discussing cost, distinguish reading one character from copying an entire string.',
        ],
        points: [
          ['赋值 StrAssign：用一段字符序列构造串。', 'Assign: build a string from a character sequence.'],
          ['求长 StrLength：返回字符个数；空串长度为 0。', 'Length: return the character count; the empty string has length 0.'],
          ['连接 Concat：把两个串首尾相接，结果长度是两个长度之和。', 'Concat: join two strings end to end; the result length is the sum.'],
          ['求子串 SubString：按下标与长度取出连续一段。', 'SubString: extract a contiguous segment by position and length.'],
          ['比较 StrCompare：按字典序逐字符比较，第一个不同字符决定大小。', 'Compare: compare lexicographically character by character; the first difference decides the order.'],
          ['定位 Index：在主串中查找模式串，返回首个匹配位置或全部位置。', 'Index: search a pattern in a text and return the first or all match positions.'],
        ],
        formula: '串的操作对象是整段字符序列，不是单个孤立字符',
      },
      {
        title: ['主串、模式串与匹配位置', 'Text, pattern and match positions'],
        body: [
          '被搜索的长串叫主串（文本）T，要查找的短串叫模式串 P。模式匹配要回答：P 在 T 中出现了哪些位置？这些位置能否重叠？',
          'The longer string being searched is the text T; the shorter string to find is the pattern P. Pattern matching asks: where does P occur in T, and may those occurrences overlap?',
        ],
        points: [
          ['一次对齐：把 P 的第 0 个字符放在 T 的某个起点 s 上，再逐字符比较。', 'One alignment places P[0] at some text start s and compares character by character.'],
          ['匹配条件：P[j] = T[s+j] 对所有 j 都成立，起点就是 s。', 'A match requires P[j] = T[s+j] for every j, and then s is a match start.'],
          ['多个匹配：同一模式串可能在主串中多次出现，结果是一个起点列表。', 'Multiple matches: the same pattern may occur many times, so the result is a list of starts.'],
          ['重叠匹配：匹配完成后不把模式串直接清零，而是继续沿前缀表对齐，才能找出相邻或重叠的起点。', 'Overlapping matches: after a match the pattern is not reset to zero; realigning through the prefix table reveals adjacent or overlapping starts.'],
        ],
        formula: 'T = "ABABABCABABABC"，P = "ABABC" → 0 基匹配起点 2、9',
      },
      {
        title: ['朴素匹配：失配后为什么会重复比较', 'Naive matching: why work is repeated after a mismatch'],
        body: [
          '朴素算法枚举每个起点 s，令 j 从 0 开始逐个比较；一旦 T[s+j] 与 P[j] 不同，就把 s 加一、j 归零，从新模式串首字符重新开始。',
          'Naive matching enumerates each start s and compares with j from 0. As soon as T[s+j] differs from P[j], it increments s, resets j to 0 and restarts from the pattern’s first character.',
        ],
        points: [
          ['以 T = "ABABABC"、P = "ABABC" 为例：起点 0 先匹配 A、B、A、B，到第 5 个字符时 T[4] = A 与 P[4] = C 失配。', 'With T = "ABABABC" and P = "ABABC", start 0 matches A, B, A, B, then T[4] = A differs from P[4] = C.'],
          ['朴素算法接着试起点 1，T[1] = B 与 P[0] = A 立刻失配；再试起点 2，又要从 P[0] 重新比较 T[2]、T[3]、T[4]。', 'Naive matching then tries start 1, where T[1] = B immediately differs from P[0] = A; start 2 then compares T[2], T[3] and T[4] again from P[0].'],
          ['这些字符在上一次对齐中已经被确认过，重复比较正是最坏 O(nm) 的来源。', 'Those characters were already confirmed in the previous alignment; this repeated work is the source of the O(nm) worst case.'],
        ],
        formula: '失配 → s = s + 1，j = 0：主串起点回退，已匹配信息被丢弃',
      },
      {
        title: ['KMP 要解决的核心问题', 'The core problem KMP solves'],
        body: [
          'KMP 把模式串自身的结构预先算出来：已经匹配的那段前缀，如果它的某个后缀同时也是模式串的前缀，那么失配时就可以把模式串滑到那个更短的前缀上，而不必回到起点。',
          'KMP precomputes the pattern’s own structure: if a suffix of the matched prefix is also a prefix of the pattern, a mismatch can slide the pattern to that shorter prefix instead of returning to the start.',
        ],
        points: [
          ['前缀表 lps[k]：P[0..k] 的最长相等真前后缀长度，采用 0 基下标。', 'The lps table: lps[k] is the longest proper prefix of P[0..k] that is also a suffix, using 0-based indices.'],
          ['"ABABC" 的 lps = [0, 0, 1, 2, 0]；在 j = 4 失配时回退到 lps[3] = 2。', '"ABABC" has lps = [0, 0, 1, 2, 0]; a mismatch at j = 4 falls back to lps[3] = 2.'],
          ['回退后主串指针 i 停在原处，模式串前缀 "AB" 直接对齐已经确认的主串后缀，不再重扫。', 'After the fallback text pointer i stays put, the pattern prefix "AB" aligns with the confirmed text suffix, and no rescanning occurs.'],
          ['构造 lps 为 O(m)，匹配为 O(n)，总时间 O(n+m)，额外空间 O(m)。', 'Building lps is O(m), matching is O(n), total O(n+m), with O(m) extra space.'],
        ],
        formula: '失配：j ← lps[j − 1]，i 不变',
      },
      {
        title: ['使用同一种下标约定', 'Use one indexing convention'],
        body: [
          '不同教材可能使用 next、nextval 或整体移位的前缀表，数组含义与回退公式并不完全相同。本课程统一采用上文的 0 基 lps；阅读其他资料时，先确认它的首项含义，再对照回退公式。',
          'Textbooks may use next, nextval or a shifted prefix table whose entries and fallback formula differ. This course consistently uses the 0-based lps above; when reading other sources, confirm what the first entry means before comparing fallback formulas.',
        ],
        points: [
          ['本课程：lps[0] = 0，lps[k] 对应长度 k+1 的前缀，失配回退到 lps[j−1]。', 'Here: lps[0] = 0, lps[k] covers a prefix of length k+1, and a mismatch falls back to lps[j−1].'],
          ['若某教材的 next[1] 对应模式串第 1 个字符，它的下标整体比本课程大 1，不能直接把数值混用。', 'If a source’s next[1] refers to the pattern’s first character, its indices are shifted by one and its values must not be mixed with this table.'],
          ['只比较算法思想时，抓住“最长相等真前后缀”即可；落地实现时必须固定一种约定。', 'When comparing ideas, the longest equal proper prefix/suffix is enough; an implementation must fix one convention.'],
        ],
        formula: '先确认下标基准，再写回退公式',
      },
    ],
    comparison: {
      title: ['朴素匹配与 KMP', 'Naive matching versus KMP'],
      columns: [
        ['维度', 'Aspect'],
        ['朴素匹配', 'Naive'],
        ['KMP', 'KMP'],
      ],
      rows: [
        [
          ['预处理', 'Preprocessing'],
          ['无', 'None'],
          ['构造 lps，O(m)', 'Build lps, O(m)'],
        ],
        [
          ['失配后的主串指针', 'Text pointer after mismatch'],
          ['起点右移，已匹配段可能重扫', 'Start shifts; matched text may be rescanned'],
          ['i 不回退', 'i never rewinds'],
        ],
        [
          ['失配后的模式串指针', 'Pattern pointer after mismatch'],
          ['j 归零', 'j resets to 0'],
          ['j = lps[j−1]', 'j = lps[j−1]'],
        ],
        [
          ['最坏时间', 'Worst-case time'],
          ['O(nm)', 'O(nm)'],
          ['O(n+m)', 'O(n+m)'],
        ],
        [
          ['额外空间', 'Extra space'],
          ['O(1)', 'O(1)'],
          ['O(m)', 'O(m)'],
        ],
        [
          ['多个/重叠匹配', 'Multiple/overlapping matches'],
          ['逐起点枚举', 'Enumerate each start'],
          ['匹配后 j = lps[m−1] 继续', 'After a match, j = lps[m−1]'],
        ],
      ],
    },
    takeaway: ['朴素匹配丢弃已匹配信息；KMP 用 lps 把这段信息变成下一次对齐的起点，因此主串指针不必回头。', 'Naive matching discards confirmed information; KMP turns it into the next alignment through lps, so the text pointer never has to go back.'],
  },
  {
    id: 'array-basics',
    topicId: 'array-basics',
    title: ['数组与多维数组', 'Arrays and multidimensional arrays'],
    chapter: ['补充章节 · 数组与矩阵', 'Supplementary chapter · Arrays and matrices'],
    summary: [
      '数组把相同类型的元素排成一条序列，并用连续存储单元实现按下标随机访问。二维数组可以看成“元素是一维数组的一维数组”，行优先与列优先决定它怎样压进一维内存。',
      'An array stores elements of the same type in a sequence and uses contiguous cells to support random access by index. A 2D array is an array of 1D arrays; row-major or column-major order decides how it is flattened into one-dimensional memory.',
    ],
    diagram: 'array',
    definitions: [
      {
        term: ['数组', 'Array'],
        text: ['由 n 个相同类型数据元素组成的有限序列，元素由连续下标标识。数组通常只支持取值和赋值，插入、删除要由上层结构完成。', 'A finite sequence of n elements of the same type, identified by consecutive indices. Arrays normally support get and set only; insertion and deletion belong to a higher-level structure.'],
      },
      {
        term: ['一维数组', 'One-dimensional array'],
        text: ['逻辑上是线性序列 a[0], a[1], …, a[n−1]，物理上通常放在一段连续存储单元中。', 'Logically a linear sequence a[0], a[1], …, a[n−1]; physically it usually occupies one contiguous block.'],
      },
      {
        term: ['二维数组', 'Two-dimensional array'],
        text: ['逻辑上按行、列两个方向组织，元素记作 A[i][j]；可以看成每个元素都是一维数组的一维数组。', 'Organized along rows and columns, with elements written A[i][j]; it can be viewed as a 1D array whose elements are 1D arrays.'],
      },
      {
        term: ['下标与地址', 'Index and address'],
        text: ['下标是逻辑位置，地址是存储单元编号。顺序存储让二者建立线性关系，因此可由下标直接算出地址。', 'An index is a logical position; an address is a memory-cell number. Sequential storage makes their relation linear, so an address can be computed from indices.'],
      },
    ],
    sections: [
      {
        title: ['逻辑结构：一维是序列，二维是表格', 'Logical view: a sequence, then a table'],
        body: [
          '一维数组的元素只有“前一个、后一个”的线性关系。二维数组增加行、列两个方向：A[i][j] 的第 0 个下标选行，第 1 个下标选列。',
          'A 1D array has only previous/next linear relations. A 2D array adds rows and columns: the first index of A[i][j] selects the row and the second selects the column.',
        ],
        points: [
          ['本课程统一使用 0 基下标：A 的合法行列是 0..R−1 与 0..C−1。', 'This course uses 0-based indices: valid rows are 0..R−1 and columns 0..C−1.'],
          ['二维数组的行 i 本身是一维数组，A[i] 取出整行；A[i][j] 再取该行第 j 个元素。', 'Row i is itself a 1D array: A[i] selects the whole row and A[i][j] selects its j-th element.'],
          ['逻辑相邻不等于地址相邻：A[i][j] 与 A[i][j+1] 在行优先存储中才紧挨着。', 'Logical neighbours are not always physical neighbours: A[i][j] and A[i][j+1] are adjacent only under row-major storage.'],
        ],
        formula: 'A[i][j]：0 ≤ i < R，0 ≤ j < C（本课程 0 基）',
      },
      {
        title: ['顺序存储：把二维压成一维', 'Sequential storage: flatten the second dimension'],
        body: [
          '计算机内存是一维的，所以二维数组必须约定一个展开顺序。行优先先存完第 0 行，再存第 1 行；列优先先存完第 0 列，再存第 1 列。',
          'Memory is one-dimensional, so a 2D array needs a flattening order. Row-major stores row 0 completely, then row 1; column-major stores column 0 completely, then column 1.',
        ],
        points: [
          ['行优先顺序：A[0][0], A[0][1], …, A[0][C−1], A[1][0], …。', 'Row-major order: A[0][0], A[0][1], …, A[0][C−1], A[1][0], … .'],
          ['列优先顺序：A[0][0], A[1][0], …, A[R−1][0], A[0][1], …。', 'Column-major order: A[0][0], A[1][0], …, A[R−1][0], A[0][1], … .'],
          ['同一个矩阵换一种存储顺序，元素值不变，但一维位置和地址公式全部改变。', 'Changing the storage order keeps the values but changes every flattened position and address formula.'],
          ['C/C++ 的二维数组通常按行优先；Fortran、MATLAB 等常按列优先，读题时先看题目约定。', 'C/C++ 2D arrays are usually row-major; Fortran and MATLAB often use column-major. Check the stated convention first.'],
        ],
        formula: '行优先位置 = i*C + j；列优先位置 = j*R + i（0 基）',
      },
      {
        title: ['地址计算：基准、宽度、顺序三件事', 'Address calculation: base, width and order'],
        body: [
          '设首元素地址为 base，每个元素占 w 个存储单元。先算出一维位置，再乘 w 加到 base 上，就得到元素地址。',
          'Let base be the address of the first element and w the number of cells per element. Compute the flattened position, multiply by w and add it to base.',
        ],
        points: [
          ['行优先：Loc(i,j) = base + (i*C + j)*w。', 'Row-major: Loc(i,j) = base + (i*C + j)*w.'],
          ['列优先：Loc(i,j) = base + (j*R + i)*w。', 'Column-major: Loc(i,j) = base + (j*R + i)*w.'],
          ['例：R=2、C=4、base=1000、w=4。A[1][2] 的行优先地址是 1000+(1*4+2)*4 = 1024；列优先地址是 1000+(2*2+1)*4 = 1020。', 'Example: R=2, C=4, base=1000, w=4. A[1][2] is at 1000+(1*4+2)*4 = 1024 in row-major and 1000+(2*2+1)*4 = 1020 in column-major.'],
          ['若题目下标从 1 开始，先把 i、j 各减 1，再代入上面的 0 基公式；不要直接把 1 基下标塞进公式。', 'If the problem uses 1-based indices, subtract 1 from i and j before using the 0-based formulas; never substitute 1-based indices directly.'],
        ],
        formula: '行优先 Loc(i,j) = base + (i*C + j)*w',
      },
    ],
    comparison: {
      title: ['行优先与列优先', 'Row-major versus column-major'],
      columns: [
        ['维度', 'Aspect'],
        ['行优先', 'Row-major'],
        ['列优先', 'Column-major'],
      ],
      rows: [
        [
          ['展开顺序', 'Flatten order'],
          ['逐行从左到右', 'Left to right, row by row'],
          ['逐列从上到下', 'Top to bottom, column by column'],
        ],
        [
          ['一维位置', 'Flattened position'],
          ['i*C + j', 'i*C + j'],
          ['j*R + i', 'j*R + i'],
        ],
        [
          ['连续扫描', 'Contiguous scan'],
          ['同一行相邻元素连续', 'Neighbours in a row are contiguous'],
          ['同一列相邻元素连续', 'Neighbours in a column are contiguous'],
        ],
        [
          ['常见环境', 'Typical setting'],
          ['C / C++ 的二维数组', 'C / C++ 2D arrays'],
          ['Fortran / MATLAB 等', 'Fortran / MATLAB and others'],
        ],
      ],
    },
    takeaway: ['先确认下标基准，再确认行优先还是列优先，最后才代地址公式；三者任一错，地址就会整体偏移。', 'Confirm the index base, then the storage order, and only then substitute the address formula; an error in any one shifts every address.'],
  },
  {
    id: 'special-matrices',
    topicId: 'special-matrices',
    title: ['特殊矩阵的压缩存储', 'Compressed storage of special matrices'],
    chapter: ['补充章节 · 数组与矩阵', 'Supplementary chapter · Arrays and matrices'],
    summary: [
      '对称矩阵、三角矩阵和带状矩阵都有大量重复或恒定元素。只要结构已知，就可以只存一部分元素，再用一个下标映射把 A[i][j] 定位到一维压缩数组。',
      'Symmetric, triangular and band matrices contain many repeated or constant entries. When the structure is known, store only part of it and map A[i][j] to a 1D compressed array by an index formula.',
    ],
    diagram: 'matrix-compression',
    definitions: [
      {
        term: ['对称矩阵', 'Symmetric matrix'],
        text: ['满足 A[i][j] = A[j][i] 的方阵；关于主对角线对称，因此只需存下三角或上三角的一半。', 'A square matrix with A[i][j] = A[j][i]; it is symmetric about the main diagonal, so one triangle suffices.'],
      },
      {
        term: ['上三角 / 下三角矩阵', 'Upper / lower triangular matrix'],
        text: ['主对角线一侧的元素全为常量（通常为 0），另一侧才需要逐个存储。', 'One side of the main diagonal is a constant (usually 0); only the other side needs individual storage.'],
      },
      {
        term: ['对角矩阵', 'Diagonal matrix'],
        text: ['非零元素只出现在主对角线上；更一般地，非零元素集中在主对角线附近的若干条对角线上。', 'Non-zeros occur only on the main diagonal; more generally they lie on a few diagonals around the main diagonal.'],
      },
      {
        term: ['带状矩阵', 'Banded matrix'],
        text: ['满足 |i − j| ≤ b 的元素才可能非零，带宽为 2b+1；三对角矩阵是最常见的 b=1 情形。', 'Only entries with |i − j| ≤ b can be non-zero; the bandwidth is 2b+1. A tridiagonal matrix is the common b=1 case.'],
      },
      {
        term: ['压缩存储', 'Compressed storage'],
        text: ['不为重复值或常量单独分配位置，只存有用元素，并保存足以还原二维下标的映射规则。', 'Do not allocate separate slots for repeated or constant values; store useful entries plus a rule that recovers their 2D indices.'],
      },
    ],
    sections: [
      {
        title: ['为什么可以少存', 'Why fewer slots are enough'],
        body: [
          '普通二维数组为每个位置都分配存储单元，不管它是否与另一个位置相同。特殊矩阵的重复关系由定义保证，所以重复部分不必真的存两份。',
          'A dense 2D array allocates a slot for every position whether or not it duplicates another. A special matrix guarantees the duplication by definition, so the repeated part need not be stored twice.',
        ],
        points: [
          ['对称矩阵只存一半：n×n 个位置压缩为 n(n+1)/2 个元素。', 'A symmetric matrix stores one triangle: n×n positions become n(n+1)/2 entries.'],
          ['三角矩阵的常量侧不逐个存；若常量不是 0，可额外留一个单元保存它。', 'The constant side of a triangular matrix is not stored entry by entry; if the constant is not 0, keep one extra slot for it.'],
          ['压缩后仍要能从 (i,j) 算出唯一的一维下标，否则无法随机访问。', 'After compression, (i,j) must still map to a unique 1D index; otherwise random access is impossible.'],
        ],
        formula: '对称矩阵元素数：n(n+1)/2（含主对角线）',
      },
      {
        title: ['下三角映射：考试最常考的公式', 'Lower-triangle mapping: the exam formula'],
        body: [
          '把下三角按行优先排进一维数组：第 0 行 1 个，第 1 行 2 个，……，第 i 行前面共有 1+2+…+i = i(i+1)/2 个元素，行内偏移是 j。',
          'Store the lower triangle row by row: row 0 has 1 entry, row 1 has 2, …, so before row i there are 1+2+…+i = i(i+1)/2 entries, and the within-row offset is j.',
        ],
        points: [
          ['0 基且 i ≥ j：k = i(i+1)/2 + j。', '0-based with i ≥ j: k = i(i+1)/2 + j.'],
          ['若 i < j，元素在上三角；先用对称性交换 i、j，再代入同一条公式。', 'If i < j the entry is in the upper triangle; swap i and j by symmetry and use the same formula.'],
          ['1 基教材的常见写法是 k = i(i−1)/2 + j（i ≥ j，i、j 从 1 起）。两种写法只是基准不同，不能混用。', 'A common 1-based form is k = i(i−1)/2 + j (i ≥ j, indices from 1). The two differ only in the base and must not be mixed.'],
          ['上三角若单独按行存储，可用 k = i*n − i(i+1)/2 + j（0 基，i ≤ j）；更稳妥的做法仍是转成下三角。', 'If the upper triangle is stored directly by rows, k = i*n − i(i+1)/2 + j (0-based, i ≤ j); converting to the lower triangle is usually safer.'],
        ],
        formula: '0 基下三角：k = i(i+1)/2 + j（i ≥ j）',
      },
      {
        title: ['对角与带状：只存一条带子', 'Diagonal and banded: keep only a strip'],
        body: [
          '对角矩阵只存主对角线，k = i。三对角矩阵只存 |i−j| ≤ 1 的三条对角线；更宽的带状矩阵同理，只是带子更宽。',
          'A diagonal matrix stores only its main diagonal with k = i. A tridiagonal matrix stores the three diagonals |i−j| ≤ 1; wider bands work the same way with a wider strip.',
        ],
        points: [
          ['对角矩阵：n×n 压缩为 n 个元素，A[i][i] 存在 sa[i]。', 'Diagonal: n×n becomes n entries; A[i][i] lives in sa[i].'],
          ['三对角按行优先紧凑存储，0 基映射为 k = 2i + j，要求 |i−j| ≤ 1。', 'For a compact row-major tridiagonal layout, the 0-based map is k = 2i + j with |i−j| ≤ 1.'],
          ['带状矩阵的压缩量取决于带宽；带宽接近 n 时，压缩带来的收益迅速消失。', 'The saving depends on the bandwidth; as it approaches n, compression stops paying off.'],
        ],
        formula: '三对角（0 基）：k = 2i + j，|i−j| ≤ 1',
      },
      {
        title: ['公式之外的两个检查', 'Two checks beyond the formula'],
        body: [
          '压缩公式不是背下来就能用：先确认题目存的是上三角还是下三角、下标从 0 还是 1 开始、常量是否额外占一个单元。',
          'A compression formula is not enough by itself: confirm which triangle is stored, whether indices start at 0 or 1, and whether a constant occupies an extra slot.',
        ],
        points: [
          ['检查边界：k=0 应对应第一个被存元素，k=最大下标应对应最后一个。', 'Check the boundary: k=0 must be the first stored entry and the largest k the last.'],
          ['检查对称位置：A[i][j] 与 A[j][i] 必须得到同一个 k（或按约定分别落在两个等价位置）。', 'Check symmetric positions: A[i][j] and A[j][i] must yield the same k under the stated convention.'],
          ['压缩数组长度要与元素个数一致；多留常量槽时要在答案里说明。', 'The compressed length must match the entry count; if a constant slot is added, state it explicitly.'],
        ],
        formula: '先定三角、再定基准、最后代公式',
      },
    ],
    comparison: {
      title: ['三种特殊矩阵的压缩', 'Compression of three special matrices'],
      columns: [
        ['类型', 'Type'],
        ['可压缩部分', 'Compressible part'],
        ['元素数（0 基公式）', 'Entry count (0-based formula)'],
      ],
      rows: [
        [
          ['对称矩阵', 'Symmetric'],
          ['下三角（含对角线）', 'Lower triangle incl. diagonal'],
          ['n(n+1)/2；k = i(i+1)/2 + j', 'n(n+1)/2; k = i(i+1)/2 + j'],
        ],
        [
          ['三角矩阵', 'Triangular'],
          ['非常量的一侧', 'The non-constant side'],
          ['n(n+1)/2（常量另存 1 个）', 'n(n+1)/2 (plus one constant slot)'],
        ],
        [
          ['对角矩阵', 'Diagonal'],
          ['主对角线', 'Main diagonal'],
          ['n；k = i', 'n; k = i'],
        ],
        [
          ['三对角矩阵', 'Tridiagonal'],
          ['三条对角线', 'Three diagonals'],
          ['约 3n−2；k = 2i + j', 'About 3n−2; k = 2i + j'],
        ],
      ],
    },
    takeaway: ['压缩存储的关键不是“少存”，而是“少存之后还能 O(1) 算回位置”；公式必须和三角、下标基准同时成立。', 'Compression is not just storing less: the position must still be computable in O(1). The formula must agree with the triangle and index base.'],
  },
  {
    id: 'sparse-matrix',
    topicId: 'sparse-matrix',
    title: ['稀疏矩阵与三元组表示', 'Sparse matrices and triplet representation'],
    chapter: ['补充章节 · 数组与矩阵', 'Supplementary chapter · Arrays and matrices'],
    summary: [
      '稀疏矩阵的非零元素远少于总位置。普通二维数组仍为每个零分配空间；三元组表只记录 (row, col, value)，CSR 则进一步把行号压进 row_ptr。',
      'A sparse matrix has far fewer non-zeros than total positions. A dense 2D array still allocates a slot for every zero; a triplet list stores only (row, col, value), while CSR folds row numbers into row_ptr.',
    ],
    diagram: 'sparse-matrix',
    definitions: [
      {
        term: ['稀疏矩阵', 'Sparse matrix'],
        text: ['非零元素个数 t 远小于矩阵元素总数 m×n 的矩阵；稀疏是相对概念，没有统一的绝对阈值。', 'A matrix whose non-zero count t is far below the total m×n; sparsity is relative and has no universal hard threshold.'],
      },
      {
        term: ['稀疏因子', 'Sparsity factor'],
        text: ['δ = t / (m×n)，表示非零元素占全部位置的比例；δ 越小，压缩存储越有收益。', 'δ = t / (m×n), the fraction of non-zero positions; smaller δ means more benefit from compression.'],
      },
      {
        term: ['三元组', 'Triplet'],
        text: ['一条记录 (row, col, value)，表示 A[row][col] = value；只记录非零元素，零不进入三元组表。', 'A record (row, col, value) meaning A[row][col] = value; only non-zeros enter the triplet list.'],
      },
      {
        term: ['三元组表', 'Triplet list'],
        text: ['按行优先（或列优先）排列的三元组序列，常额外保存行数、列数和非零元素个数。', 'A sequence of triplets in row-major (or column-major) order, usually with row count, column count and non-zero count.'],
      },
      {
        term: ['CSR', 'Compressed sparse row'],
        text: ['用 row_ptr、col_idx、values 三个数组按行压缩：第 r 行的非零元素位于 col_idx[row_ptr[r] .. row_ptr[r+1])。', 'Three arrays — row_ptr, col_idx and values — compress by row: row r owns col_idx[row_ptr[r] .. row_ptr[r+1]).'],
      },
    ],
    sections: [
      {
        title: ['普通二维数组浪费在哪里', 'Where the dense array wastes space'],
        body: [
          '二维数组为每个位置留一个单元，零也照常占位。4×5 的矩阵若有 6 个非零元素，仍有 20 个元素槽，其中 14 个存的是零。',
          'A dense array reserves one slot per position, zeros included. A 4×5 matrix with 6 non-zeros still has 20 element slots, 14 of which hold zero.',
        ],
        points: [
          ['空间与 m×n 成正比，而不与非零个数 t 成正比。', 'Space grows with m×n rather than with the non-zero count t.'],
          ['大量零参与扫描、转置和加法，时间也会被浪费。', 'Zeros still take part in scans, transposes and additions, wasting time too.'],
          ['稀疏程度不高时，三元组的额外字段反而可能更占空间。', 'When the matrix is not very sparse, the extra triplet fields can cost more space.'],
        ],
        formula: '非零比例 δ = t / (m×n)',
      },
      {
        title: ['三元组表：只记录非零元素', 'Triplet list: record only non-zeros'],
        body: [
          '三元组表把每个非零元素写成 (row, col, value)，并按行优先排序。恢复时逐条读取，把 value 写回 B[row][col]，其余位置保持 0。',
          'A triplet list writes each non-zero as (row, col, value) in row-major order. To restore, read each record and write value back to B[row][col], leaving all other positions zero.',
        ],
        points: [
          ['三元组表长度等于 t，每条 3 个字段，数值总量为 3t。', 'The list length is t; each record has three fields, so 3t numbers are stored.'],
          ['行优先排列让同一行的三元组连续，按行恢复和按行转置都更方便。', 'Row-major order keeps one row’s triplets contiguous, which helps row-wise restore and transpose.'],
          ['恢复算法需要先建立 m×n 的全零矩阵；稀疏存储并没有消除输出矩阵本身的空间。', 'Restore first creates an m×n zero matrix; the sparse format does not remove the output matrix’s own space.'],
        ],
        formula: '(row, col, value) 表；t 条记录占 3t 个数值',
      },
      {
        title: ['CSR：把行号压进 row_ptr', 'CSR: fold row numbers into row_ptr'],
        body: [
          '三元组表每条都重复存行号。CSR 按行分组：row_ptr[r] 指向第 r 行在 col_idx/values 中的起点，row_ptr[r+1] 指向终点，行号不再逐条出现。',
          'Every triplet repeats its row number. CSR groups by row: row_ptr[r] points to the start of row r in col_idx/values, row_ptr[r+1] to its end, so row numbers are no longer repeated per entry.',
        ],
        points: [
          ['row_ptr 长度为 m+1；col_idx 与 values 长度都是 t。', 'row_ptr has length m+1; col_idx and values both have length t.'],
          ['第 r 行的第 k 个非零元素：列号 col_idx[row_ptr[r]+k]，值 values[row_ptr[r]+k]。', 'The k-th non-zero in row r: column col_idx[row_ptr[r]+k], value values[row_ptr[r]+k].'],
          ['CSR 很适合按行扫描、矩阵向量乘法；按列访问和随机 A[i][j] 仍需额外查找。', 'CSR suits row scans and sparse matrix–vector products; column access and random A[i][j] still need a lookup.'],
        ],
        formula: 'CSR 数值量：row_ptr(m+1) + col_idx(t) + values(t)',
      },
      {
        title: ['三元组转置为什么要用 cpot', 'Why triplet transpose needs cpot'],
        body: [
          '直接逐条交换 row 与 col 会打乱结果的行优先顺序。快速转置先统计每一列的非零个数 num，再由 num 递推出每一列在结果表中的起始槽 cpot，最后把每个元素一次放到正确位置。',
          'Swapping row and col entry by entry breaks the result’s row-major order. Fast transpose first counts each column’s non-zeros in num, derives each column’s starting slot cpot, then places every entry directly in its final slot.',
        ],
        points: [
          ['num[c] 等于原矩阵第 c 列的非零个数，也就是转置矩阵第 c 行的长度。', 'num[c] is the non-zero count of column c, i.e. the length of row c in the transpose.'],
          ['cpot[0] = 0；cpot[c] = cpot[c−1] + num[c−1]，它是第 c 列的第一个空槽。', 'cpot[0] = 0; cpot[c] = cpot[c−1] + num[c−1], the first free slot for column c.'],
          ['每写入一个元素就把 cpot[col] 加一，保证同一列的下一个元素落到下一个槽。', 'After writing an entry, increment cpot[col] so the next entry of that column lands in the next slot.'],
          ['时间 O(t + c)，额外辅助空间 O(c)，结果表本身占 O(t)；不是 O(t²)。', 'Time O(t + c), extra working space O(c), and the result table itself is O(t); not O(t²).'],
        ],
        formula: 'cpot[c] = cpot[c−1] + num[c−1]（0 基）',
      },
    ],
    comparison: {
      title: ['三种稀疏存储方式', 'Three sparse layouts'],
      columns: [
        ['维度', 'Aspect'],
        ['普通二维数组', 'Dense 2D'],
        ['三元组表', 'Triplet list'],
        ['CSR', 'CSR'],
      ],
      rows: [
        [
          ['空间量', 'Space'],
          ['m×n 个元素', 'm×n entries'],
          ['3t 个数值', '3t numbers'],
          ['m+1+2t 个数值', 'm+1+2t numbers'],
        ],
        [
          ['随机 A[i][j]', 'Random A[i][j]'],
          ['O(1)', 'O(1)'],
          ['通常需查找 O(t)', 'Usually a search, O(t)'],
          ['行内查找', 'Search within a row'],
        ],
        [
          ['按行扫描', 'Row scan'],
          ['含大量零', 'Many zeros'],
          ['方便', 'Convenient'],
          ['最方便', 'Most convenient'],
        ],
        [
          ['适用场景', 'Best for'],
          ['稠密矩阵', 'Dense matrices'],
          ['通用稀疏记录、转置教学', 'General sparse records and transpose teaching'],
          ['按行计算、矩阵向量乘法', 'Row-wise kernels and SpMV'],
        ],
      ],
    },
    takeaway: ['稀疏存储用“额外索引”换掉“大量零”：t 远小于 m×n 时才划算；三元组胜在直观，CSR 胜在按行计算。', 'Sparse storage trades extra indexing for the omitted zeros: it pays only when t is far below m×n. Triplets are simple; CSR is stronger for row-wise computation.'],
  },
];

const BY_ID = new Map(CONCEPT_PAGES.map((page) => [page.id, page]));
const BY_TOPIC = new Map(CONCEPT_PAGES.map((page) => [page.topicId, page]));

export function conceptById(id: string | null | undefined): ConceptPage | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function conceptForTopic(topicId: string): ConceptPage | undefined {
  return BY_TOPIC.get(topicId);
}

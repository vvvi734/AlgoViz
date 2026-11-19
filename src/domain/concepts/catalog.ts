import type { ConceptPage } from './types';

/**
 * Authored concept lessons.
 *
 * These pages are intentionally static: no trace, no player and no editor. They
 * sit beside the runnable courses so the textbook directory can explain
 * definitions before a learner opens an animation.
 *
 * The first batch covers the five representative topics requested for
 * CORE-REFINE-01. Other `concept: true` topics keep their pending row until a
 * page is authored; no placeholder page is generated.
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
];

const BY_ID = new Map(CONCEPT_PAGES.map((page) => [page.id, page]));
const BY_TOPIC = new Map(CONCEPT_PAGES.map((page) => [page.topicId, page]));

export function conceptById(id: string | null | undefined): ConceptPage | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function conceptForTopic(topicId: string): ConceptPage | undefined {
  return BY_TOPIC.get(topicId);
}

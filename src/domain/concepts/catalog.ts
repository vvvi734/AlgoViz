import type { ConceptPage } from './types';
import { STORAGE_CONCEPT_PAGES } from './storageConcepts';
import { GENERALIZED_LIST_CONCEPT_PAGES } from './generalizedListConcepts';
import { GRAPH_STORAGE_CONCEPT_PAGES } from './graphStorageConcepts';
import { GRAPH_CONNECTIVITY_CONCEPT_PAGES } from './graphConnectivityConcepts';
import { DYNAMIC_STORAGE_CONCEPT_PAGES } from './dynamicStorageConcepts';
import { SEARCH_CONCEPT_PAGES } from './searchConcepts';
import { EXTERNAL_SORT_CONCEPT_PAGES } from './externalSortConcepts';
import { FILE_STRUCTURE_CONCEPT_PAGES } from './fileStructureConcepts';

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
const BASE_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'data-structure-basics',
    topicId: 'intro-concepts',
    title: ['数据结构的基本概念', 'Basic concepts of data structures'],
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
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
        formulaEn: 'data structure = logical structure + storage structure + operations',
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
    id: 'algorithm-definition',
    topicId: 'algorithm-definition',
    title: ['算法的定义与特性', 'Algorithm definition and properties'],
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
    summary: [
      '算法描述“怎样从一个合法输入得到答案”，它必须是一个有限、确定、可执行的步骤序列。理解五大特性，才能区分算法、程序与单纯的设想。',
      'An algorithm describes how to obtain an answer from a valid input. It must be a finite, deterministic and executable sequence of steps; the five properties distinguish an algorithm from a program or a mere idea.',
    ],
    diagram: 'algorithm-properties',
    definitions: [
      {
        term: ['算法', 'Algorithm'],
        text: [
          '算法是对特定问题求解步骤的描述，是由有限条指令组成的序列；每条指令表示一个或多个操作，对合法输入能在有限时间内产生确定结果。',
          'An algorithm describes the steps that solve a specific problem: a finite sequence of instructions, each denoting one or more operations, which produces a definite result for valid input in finite time.',
        ],
      },
      {
        term: ['算法与程序', 'Algorithm versus program'],
        text: [
          '算法是求解方法与步骤，程序是算法在某种语言中的具体实现。同一算法可以写成不同语言的程序，也可以有不同效率的实现。',
          'An algorithm is the method and its steps; a program is a concrete implementation in some language. One algorithm may become programs in different languages or implementations with different costs.',
        ],
      },
    ],
    sections: [
      {
        title: ['定义中的三个关键词', 'Three words in the definition'],
        body: [
          '“特定问题”限定算法不能含糊地什么都能做；“有限指令”要求步骤个数有限，而不是靠一个永远运行的循环碰运气；“合法输入”说明算法只对满足前置条件的数据负责。',
          '“Specific problem” rules out a vague do-everything recipe; “finite instructions” requires a finite number of steps rather than a loop that might eventually work; “valid input” states the precondition the algorithm may assume.',
        ],
        points: [
          ['算法不是程序：程序可以长期运行、等待输入或处理交互，算法本身必须能在有限步骤后结束。', 'An algorithm is not a program: a program may run indefinitely or wait for input, while the algorithm itself must finish in finite steps.'],
          ['算法不是代码片段：没有说明输入、输出和终止条件的代码，不能单独构成一个完整算法。', 'An algorithm is not a code fragment: code without stated input, output and termination does not by itself define one.'],
          ['同一个问题可以有多个正确算法，它们的正确性相同，但时间、空间和实现难度可能不同。', 'One problem may have several correct algorithms; they agree on the answer but may differ in time, space and implementation difficulty.'],
        ],
      },
      {
        title: ['五大特性：判断步骤序列是否合格', 'Five properties of a valid algorithm'],
        body: [
          '有穷性、确定性、可行性、输入和输出共同约束一个步骤序列。前三条保证“能算完、算得唯一、算得动”，后两条保证问题与答案说清楚。',
          'Finiteness, determinism, feasibility, input and output constrain a step sequence together. The first three guarantee that it finishes, is unambiguous and can actually be carried out; the last two make the problem and answer explicit.',
        ],
        points: [
          ['有穷性：算法在执行有限条指令后结束，而且每条指令都能在有限时间内完成。', 'Finiteness: the algorithm stops after finitely many instructions, and each instruction finishes in finite time.'],
          ['确定性：对相同的合法输入和执行状态，算法只有一条执行路径，产生相同结果；不能有“可做可不做”的歧义步骤。', 'Determinism: for the same valid input and state there is one execution path and one result; no step may be optional or ambiguous.'],
          ['可行性：每一步都能由已经具备的基本运算执行有限次来实现，不能假设一步完成无法实现的操作。', 'Feasibility: every step can be carried out by a finite number of available basic operations; it cannot assume an impossible primitive.'],
          ['输入：有零个或多个输入，取自明确的合法范围；零输入表示算法使用内置数据或常量。', 'Input: zero or more inputs from a stated valid domain; zero input means the algorithm uses built-in data or constants.'],
          ['输出：至少有一个输出，通常与输入存在确定关系；没有输出的步骤序列无法判断它解决了什么问题。', 'Output: at least one result, usually determined by the input; a sequence with no output cannot be judged as solving a problem.'],
        ],
        formula: '算法 = 有限步骤 + 确定规则 + 可执行操作 + 合法输入 + 明确输出',
        formulaEn: 'algorithm = finite steps + deterministic rules + executable operations + valid input + definite output',
      },
    ],
    takeaway: [
      '先写清输入、输出和终止条件，再检查有穷性、确定性与可行性；这三条不过关，代码再漂亮也不是算法。',
      'State input, output and termination first, then check finiteness, determinism and feasibility; without them, polished code is not yet an algorithm.',
    ],
  },
  {
    id: 'complexity',
    topicId: 'algorithm-efficiency',
    title: ['时间复杂度与空间复杂度', 'Time and space complexity'],
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
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
        formulaEn: 'T(n) = O(f(n)): ignore constant factors and lower-order terms',
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
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
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
        formulaEn: 'address(a[i]) = base address + i × element size',
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
    chapter: ['第 6 章 · 树和二叉树', 'Chapter 6 · Trees and binary trees'],
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
      {
        term: ['二叉链表节点', 'Binary linked-list node'],
        text: ['节点含数据域 data、左孩子指针 left、右孩子指针 right；孩子不存在时对应指针为空。', 'A node holds a data field and left/right child pointers; a missing child is represented by a null pointer.'],
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
        formulaEn: 'n0 = n2 + 1; depth k holds at most 2^k − 1 nodes',
      },
      {
        title: ['二叉链表：数据域与两个指针域', 'Binary linked list: data plus two pointers'],
        body: [
          '二叉链表是最常用的二叉树存储方式：每个节点保存 data、left 和 right。left 指向左孩子，right 指向右孩子；没有对应孩子时指针为空。n 个节点共有 2n 个指针域，其中 n−1 个指向真实孩子，另 n+1 个为空。',
          'The binary linked list is the usual binary-tree storage: each node stores data, left and right. left points to the left child and right to the right child; a missing child is null. n nodes have 2n pointer fields: n−1 point to real children and n+1 are null.',
        ],
        points: [
          ['数据域保存元素；左右指针域保存“有没有孩子、孩子是谁”。', 'The data field stores the element; the two pointer fields record whether a child exists and which node it is.'],
          ['空指针表示无对应孩子，不能把它解释为某个值为 null 的节点。', 'A null pointer means no such child; it is not a node whose value is null.'],
          ['普通树的孩子兄弟表示法也用两个指针，但存的是 firstChild 与 nextSibling，语义不是 left/right 孩子。', 'The child-sibling layout for ordinary trees also uses two pointers, but they mean firstChild and nextSibling, not left/right children.'],
        ],
        formula: '2n 个指针域 = (n−1) 条孩子链 + (n+1) 个空指针',
        formulaEn: '2n pointer fields = (n−1) child links + (n+1) null pointers',
      },
      {
        title: ['满二叉树与完全二叉树', 'Full and complete binary trees'],
        body: [
          '满二叉树每一层都填满；完全二叉树只允许最后一层右侧缺若干节点，其余层必须填满。完全二叉树适合用数组顺序存储，父子下标关系可以直接计算。',
          'A full binary tree fills every level; a complete binary tree fills all levels except possibly the last, which is filled left to right. A complete tree maps naturally to an array.',
        ],
        formula: '数组下标从 0 开始：左孩子 2i+1，右孩子 2i+2，父节点 ⌊(i−1)/2⌋',
        formulaEn: '0-based array indices: left child 2i+1, right child 2i+2, parent ⌊(i−1)/2⌋',
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
        term: ['度、入度与出度', 'Degree, in-degree and out-degree'],
        text: [
          '无向图中与顶点相连的边数称为度；有向图把度拆成入度（以该顶点为终点的弧数）和出度（以该顶点为起点的弧数）。',
          'In an undirected graph, degree is the number of incident edges. A directed graph splits it into in-degree (arcs ending at the vertex) and out-degree (arcs starting there).',
        ],
      },
      {
        term: ['路径、简单路径与回路', 'Path, simple path and cycle'],
        text: [
          '路径是顶点和边的交替序列；顶点不重复的路径是简单路径；起点与终点相同的路径是回路。',
          'A path alternates vertices and edges; a simple path repeats no vertex; a path whose endpoints coincide is a cycle.',
        ],
      },
      {
        term: ['连通图与连通分量', 'Connected graph and component'],
        text: [
          '任意两顶点间都有路径为连通图；无向图的极大连通子图是连通分量。有向图则区分强连通与强连通分量。',
          'A graph is connected if every pair has a path; a maximal connected subgraph is a component. Directed graphs instead distinguish strong connectivity and strongly connected components.',
        ],
      },
      {
        term: ['生成树与生成森林', 'Spanning tree and forest'],
        text: [
          '连通无向图的一个极小连通子图，含全部 n 个顶点和 n−1 条边，称为生成树；非连通图的每个连通分量各取一棵生成树，合起来是生成森林。',
          'A minimal connected subgraph of a connected undirected graph, with all n vertices and n−1 edges, is a spanning tree. Taking one tree per component of a disconnected graph yields a spanning forest.',
        ],
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
        formulaEn: 'Σ deg(v) = 2|E| (undirected graph); simple undirected graph |E| ≤ n(n−1)/2',
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
      {
        title: ['容易混淆的几组概念', 'Terms that are easy to confuse'],
        body: [
          '图论术语之间不是同义替换：完全图说的是边数达到上限，稠密图只是相对说法；强连通只对有向图有意义；生成森林也不是“很多棵彼此相连的树”。下面的对照帮助先把概念边界划清。',
          'Graph terminology is not interchangeable: a complete graph hits the maximum edge count, while “dense” is only relative; strong connectivity applies to directed graphs; a spanning forest is not a set of connected trees. The contrasts below delimit the ideas.',
        ],
        points: [
          ['完全图：简单无向图任意两顶点间都有边，边数为 n(n−1)/2；简单有向图若任意有序对都有弧，边数为 n(n−1)。', 'Complete graph: a simple undirected graph with an edge between every pair has n(n−1)/2 edges; a simple directed graph with every ordered pair has n(n−1) arcs.'],
          ['稀疏图与稠密图：按 e 相对 n² 的大小粗略划分，没有绝对阈值。', 'Sparse and dense: a rough comparison of e with n², with no absolute threshold.'],
          ['强连通：有向图中任意两顶点双向可达；其极大强连通子图是强连通分量。', 'Strongly connected: every pair is mutually reachable in a directed graph; its maximal strongly connected subgraph is an SCC.'],
          ['网：带权图；权值可以表示距离、代价、时间等，但算法必须先明确“无边”和“零权边”的区分。', 'Network: a weighted graph. Weights may represent distance, cost or time, but the algorithm must distinguish “no edge” from “zero-weight edge”.'],
          ['DAG：有向无环图；它一定有拓扑序列，但不一定强连通。', 'DAG: a directed acyclic graph. It always has a topological order but need not be strongly connected.'],
          ['生成森林：非连通无向图中，每个连通分量各有一棵生成树，合起来覆盖全部顶点。', 'Spanning forest: in a disconnected undirected graph, each component contributes one spanning tree, together covering every vertex.'],
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
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
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
        formulaEn: 'ADT = (data objects, data relationships, operation set)',
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
    chapter: ['第 1 章 · 绪论', 'Chapter 1 · Introduction'],
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
        formulaEn: 'Sequential search: best 1 comparison, worst n comparisons (target absent also counts as worst case)',
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
    chapter: ['第 2 章 · 线性表', 'Chapter 2 · Linear lists'],
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
        term: ['抽象数据类型（ADT）', 'Abstract data type (ADT)'],
        text: ['由数据对象、数据关系与一组基本操作组成，只规定“能做什么”，不规定用数组还是链表“怎么做”。', 'A data object, its relationships and a set of operations: it specifies what can be done, not whether an array or a linked list implements it.'],
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
        formulaEn: 'a(i−1) → ai → a(i+1), where 1 < i < n',
      },
      {
        title: ['抽象数据类型：先定接口，再选存储', 'ADT first, storage second'],
        body: [
          '线性表的 ADT 把数据对象 (a1, …, an)、前驱后继关系和基本操作打包在一起。它不承诺底层用连续空间还是指针；顺序表和链表只是两种满足同一组操作的实现。接口相同，代价可以不同。',
          'The linear-list ADT packages the data object (a1, …, an), the predecessor/successor relation and the basic operations. It does not promise contiguous storage or pointers; arrays and linked lists are two implementations of the same interface, with different costs.',
        ],
        points: [
          ['同一 ADT 可以由不同存储结构实现，操作语义必须一致。', 'One ADT may have several storage implementations; operation semantics must agree.'],
          ['复杂度属于实现，不属于 ADT 定义本身。', 'Complexity belongs to the implementation, not to the ADT definition.'],
          ['前置条件（如 1 ≤ i ≤ n）属于操作契约，换实现也不能省略。', 'Preconditions such as 1 ≤ i ≤ n are part of the operation contract in every implementation.'],
        ],
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
    id: 'sorting-basics',
    topicId: 'sort-basics',
    title: ['排序基础：稳定性、原地与复杂度', 'Sorting basics: stability, in-place and complexity'],
    chapter: ['第 10 章 · 内部排序', 'Chapter 10 · Internal sorting'],
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
      {
        term: ['升序与降序', 'Ascending and descending'],
        text: ['升序要求关键字非递减，降序要求非递增。排序前必须先确定比较规则；相等关键字在升序中允许相邻，降序同理。', 'Ascending means non-decreasing keys and descending means non-increasing keys. The comparison rule must be fixed first; equal keys may be adjacent in either direction.'],
      },
      {
        term: ['内部排序与外部排序', 'Internal and external sorting'],
        text: ['内部排序在内存中完成，所有记录可随机访问；外部排序处理的数据量超过内存，必须分批读写外存。本章只讨论内部排序。', 'Internal sorting completes in memory with random access to every record; external sorting handles data larger than memory and must batch reads/writes to external storage. This chapter covers internal sorting only.'],
      },
      {
        term: ['比较排序与非比较排序', 'Comparison and non-comparison sorts'],
        text: ['比较排序只根据两个关键字的大小决定次序；基数排序按数位分配和收集，不直接比较完整关键字，属于非比较排序。', 'A comparison sort decides order only from the relative order of two keys; radix sort distributes and collects by digits without comparing full keys, so it is a non-comparison sort.'],
      },
      {
        term: ['最好、平均与最坏情况', 'Best, average and worst cases'],
        text: ['最好情况是最有利的合法输入，平均情况按输入分布取期望，最坏情况是代价最大的合法输入。只写一个 O(n log n) 而不说明是哪种情况，容易掩盖快速排序最坏 O(n²) 的事实。', 'The best case uses the most favourable legal input, the average case is an expectation over input distributions, and the worst case is the most expensive legal input. Quoting only O(n log n) without naming the case can hide quicksort’s O(n²) worst case.'],
      },
      {
        term: ['输入前提', 'Input preconditions'],
        text: ['不同算法对输入有不同要求：直接插入和冒泡只要求可比较；归并通常需要额外缓冲区；基数排序要求关键字能按固定基数拆成有限位，本课程只接受 0–9999 的非负整数。', 'Algorithms differ in their preconditions: insertion and bubble only need comparable keys; merge usually needs a buffer; radix sort needs keys decomposable into finitely many digits at a fixed radix, and this course accepts only non-negative integers 0–9999.'],
      },
    ],
    sections: [
      {
        title: ['稳定性：相等元素也有先后', 'Stability: equal keys still have an order'],
        body: [
          '设三条记录 (3,A)、(1,B)、(3,C) 原本按 A、B、C 次序输入。按关键字升序后，稳定结果必须是 (1,B)、(3,A)、(3,C)：两个关键字为 3 的记录仍保持 A 在 C 前。只用 (3,3) 这样的纯数字示例无法证明稳定性，因为两条记录已经无法区分。',
          'Suppose records (3,A), (1,B), (3,C) arrive in A, B, C order. After ascending by key, a stable result must be (1,B), (3,A), (3,C): the two records with key 3 keep A before C. A bare-number example such as (3,3) cannot demonstrate stability because the two records are no longer distinguishable.',
        ],
        points: [
          ['稳定排序适合“先按 A 排，再按 B 排”的多关键字流程。', 'Stable sorts support “sort by A, then by B” multi-key workflows.'],
          ['稳定性必须结合具体实现判断：冒泡、直接插入和本课程的归并在相等时保留左侧，通常稳定；原地选择、希尔、快速和堆排序在交换或下沉时可能跨过相等记录，因此不稳定。', 'Stability depends on the implementation: bubble, direct insertion and this course’s merge keep the left side on equality and are stable; in-place selection, Shell, quicksort and heap sort may move a record across an equal key during swaps or sift-down, so they are unstable.'],
          ['树形选择排序按 (关键字, 原始下标) 比较，当前实现稳定；如果只比较关键字并在相等时任意选取孩子，就会失去稳定性。', 'Tournament selection sort compares (key, originalIndex) and is stable in this implementation; comparing only keys and choosing a child arbitrarily on ties would lose stability.'],
          ['稳定性是算法性质，不是比较函数本身决定的；同一个算法的不同实现可能给出不同结论。', 'Stability is a property of the algorithm, not of the comparator alone; different implementations of the same algorithm can reach different conclusions.'],
          ['链式基数排序每一趟都必须稳定分配和收集，桶内顺序一旦改变，低位已经建立的次序就会被破坏。', 'Chained radix sort must distribute and collect stably every pass; changing bucket order destroys the order established by lower digits.'],
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
          ['小规模或几乎有序、又要求稳定时，直接插入排序常数小且额外空间 O(1)。', 'For small or nearly sorted data that must remain stable, insertion sort has a low constant and O(1) extra space.'],
          ['希尔排序的复杂度取决于增量序列；表中的 O(n^1.3) 是常见平均估计，最坏仍可能到 O(n²)。', 'Shell sort depends on its gap sequence; the table’s O(n^1.3) is a common average estimate, and the worst case can still reach O(n²).'],
          ['必须稳定且能接受 O(n) 辅助空间时，归并排序是稳妥选择，并能保证最坏 O(n log n)。', 'When stability is required and O(n) auxiliary space is acceptable, merge sort is a safe choice with a guaranteed O(n log n) worst case.'],
          ['快速排序平均 O(n log n)，但最坏会退化为 O(n²)，还要关注递归栈与枢轴选择。', 'Quicksort is O(n log n) on average but degrades to O(n²) in the worst case; watch the recursion stack and pivot choice.'],
          ['堆排序最坏也是 O(n log n)，额外空间 O(1)，但通常不稳定、缓存局部性较差，适合内存紧且需要最坏保证的场景。', 'Heap sort also guarantees O(n log n) worst case with O(1) extra space, but it is usually unstable and has weaker cache locality; it suits tight-memory, worst-case-guarantee situations.'],
        ],
        formula: '比较排序最坏情况下界：Ω(n log n)',
        formulaEn: 'Worst-case lower bound for comparison sorting: Ω(n log n)',
      },
    ],
    comparison: {
      title: ['九种内部排序方法对比', 'Nine internal sorting methods'],
      columns: [
        ['算法', 'Algorithm'],
        ['最好时间', 'Best'],
        ['平均时间', 'Average'],
        ['最坏时间', 'Worst'],
        ['额外空间', 'Extra space'],
        ['稳定', 'Stable'],
        ['比较排序', 'Comparison'],
        ['典型适用条件', 'Typical use'],
      ],
      rows: [
        [
          ['直接插入排序', 'Insertion'],
          ['O(n)', 'O(n)'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['是', 'Yes'],
          ['是', 'Yes'],
          ['n 小或基本有序，要求稳定', 'Small or nearly sorted input, stability required'],
        ],
        [
          ['希尔排序', 'Shell'],
          ['依赖增量', 'Gap-dependent'],
          ['约 O(n^1.3)，依赖增量', 'About O(n^1.3), gap-dependent'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['否', 'No'],
          ['是', 'Yes'],
          ['中等规模、可接受不稳定，增量序列决定性能', 'Medium input, instability acceptable; performance depends on the gap sequence'],
        ],
        [
          ['冒泡排序', 'Bubble'],
          ['O(n)（提前结束）', 'O(n) with early stop'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['是', 'Yes'],
          ['是', 'Yes'],
          ['n 小或基本有序；本课程实现无提前结束优化', 'Small or nearly sorted input; this course has no early-stop optimisation'],
        ],
        [
          ['快速排序', 'Quicksort'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n²)', 'O(n²)'],
          ['O(log n) 平均 / O(n) 最坏', 'O(log n) avg / O(n) worst'],
          ['否', 'No'],
          ['是', 'Yes'],
          ['大规模、平均性能优先，需处理极端枢轴', 'Large input prioritising average speed; guard against extreme pivots'],
        ],
        [
          ['简单选择排序', 'Selection'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(n²)', 'O(n²)'],
          ['O(1)', 'O(1)'],
          ['否', 'No'],
          ['是', 'Yes'],
          ['n 很小、交换代价高但不要求稳定', 'Very small input where swaps are expensive and stability is not required'],
        ],
        [
          ['树形选择排序', 'Tournament'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n) 选择树', 'O(n) winner tree'],
          ['是（按原始下标决胜）', 'Yes (originalIndex tie-break)'],
          ['是', 'Yes'],
          ['需要反复取最小值并希望减少重复比较', 'Repeated minimum extraction with fewer repeated comparisons'],
        ],
        [
          ['堆排序', 'Heap'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(1)', 'O(1)'],
          ['否', 'No'],
          ['是', 'Yes'],
          ['内存紧、需要最坏 O(n log n) 保证', 'Tight memory with a worst-case O(n log n) guarantee'],
        ],
        [
          ['归并排序', 'Merge'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n log n)', 'O(n log n)'],
          ['O(n)', 'O(n)'],
          ['是', 'Yes'],
          ['是', 'Yes'],
          ['要求稳定且能接受 O(n) 缓冲区', 'Stability required and an O(n) buffer is acceptable'],
        ],
        [
          ['基数排序（LSD）', 'Radix (LSD)'],
          ['O(d(n+k))', 'O(d(n+k))'],
          ['O(d(n+k))', 'O(d(n+k))'],
          ['O(d(n+k))', 'O(d(n+k))'],
          ['O(n+k)', 'O(n+k)'],
          ['是（稳定分配收集）', 'Yes (stable passes)'],
          ['否', 'No'],
          ['关键字位数有限，例如 0–9999 的十进制整数', 'Finite digit domains, e.g. decimal integers 0–9999'],
        ],
      ],
    },
    takeaway: ['排序没有全能冠军：先定稳定性、空间和最坏情况，再看平均速度；基数排序不是比较排序，不能套用 Ω(n log n) 的下界。', 'No sorting algorithm wins on every axis: fix stability, space and worst case first, then compare average speed. Radix sort is not a comparison sort and does not inherit the Ω(n log n) bound.'],
  },
  {
    id: 'sorting-comparison',
    topicId: 'sort-comparison',
    title: ['排序方法选择：多关键字、LSD/MSD 与链式桶', 'Choosing a sort: multi-key order, LSD/MSD and chained buckets'],
    chapter: ['第 10 章 · 内部排序', 'Chapter 10 · Internal sorting'],
    summary: [
      '排序方法的选择不是背一张“最快算法”排行榜，而是先确定数据规模、初始有序程度、稳定性要求、额外空间限制和关键字结构，再排除不满足硬条件的候选。多关键字排序依赖稳定分配；链式基数排序用桶头/桶尾指针避免搬动整条记录。',
      'Choosing a sort is not memorising a “fastest algorithm” ranking. Fix the input size, initial order, stability requirement, extra-space limit and key structure first, then eliminate candidates that fail a hard constraint. Multi-key sorting relies on stable passes; chained radix sort uses bucket head/tail links to avoid moving whole records.',
    ],
    diagram: 'sorting-comparison',
    definitions: [
      {
        term: ['主关键字与次关键字', 'Primary and secondary keys'],
        text: ['决定最终次序的关键字叫主关键字；仅在主关键字相等时发挥作用的关键字叫次关键字。例如先按总分、再按学号排序，总分是主关键字，学号是次关键字。', 'The key that decides final order is the primary key; a key used only when primary keys tie is the secondary key. For example, sort by total score then student id: score is primary and id secondary.'],
      },
      {
        term: ['LSD 与 MSD', 'LSD versus MSD'],
        text: ['LSD（最低位优先）从最低位开始，每一趟稳定分配和收集，最后处理最高位；MSD（最高位优先）从最高位开始，通常需要按高位分组后递归处理每组。LSD 的实现更直接，MSD 更接近字典序分治。', 'LSD (least significant digit first) starts at the lowest digit, performs a stable distribution/collection each pass, and finishes at the highest digit. MSD starts at the highest digit and usually recurses into groups. LSD is simpler to implement; MSD is closer to lexicographic divide-and-conquer.'],
      },
      {
        term: ['链式基数排序', 'Chained radix sort'],
        text: ['记录本身不移动，每个桶保存一条链表的头指针和尾指针；分配时把记录节点追加到桶尾，收集时按桶号把整条链接到结果链尾。这样避免每趟搬动完整记录，只改链接。', 'Records themselves do not move; each bucket keeps head and tail pointers of a linked list. Distribution appends a record node to the bucket tail, and collection links the whole chain to the result tail. This avoids moving full records each pass and changes only links.'],
      },
      {
        term: ['稳定分配与收集', 'Stable distribution and collection'],
        text: ['同一趟中，先进入桶的记录必须先被收集；多个桶按编号升序收集。只有这样，低位趟已经建立的次序才能在处理高位时保留下来。', 'Within a pass, records that entered a bucket earlier must be collected earlier, and buckets are collected in ascending digit order. Only then does the order established by lower passes survive when higher digits are processed.'],
      },
    ],
    sections: [
      {
        title: ['按场景选方法：先排除硬约束', 'Choose by scenario: eliminate hard constraints first'],
        body: [
          '数据规模很小（例如几十条）时，O(n²) 与 O(n log n) 的实际差距很小，直接插入排序常数低、稳定且额外空间 O(1)，通常比引入复杂结构更划算。数据基本有序时，直接插入排序的比较和移动接近线性；冒泡排序在本课程实现中没有“整趟无交换即结束”的优化，不能把最好情况直接当成 O(n)。',
          'For very small inputs (say dozens of records), the practical gap between O(n²) and O(n log n) is tiny. Direct insertion sort has a low constant, is stable and uses O(1) extra space, so it is often better than introducing a complex structure. On nearly ordered input, insertion sort’s comparisons and moves approach linear; this course’s bubble sort has no “stop after a clean pass” optimisation, so its best case must not be quoted as O(n).',
        ],
        points: [
          ['数据规模较大且平均性能优先：快速排序通常是首选之一，但必须说明最坏 O(n²)，并通过枢轴策略、递归深度控制来避免极端划分。', 'Large input prioritising average speed: quicksort is often a leading choice, but its O(n²) worst case must be stated and guarded with pivot strategy and recursion-depth control.'],
          ['必须稳定且能接受 O(n) 缓冲：归并排序提供最坏 O(n log n) 保证；若内存极紧，可考虑原地归并的变体，但实现代价高。', 'Stability required and an O(n) buffer acceptable: merge sort guarantees O(n log n); if memory is extremely tight, in-place merge variants exist but are costly to implement.'],
          ['额外内存受限但需要最坏 O(n log n)：堆排序是 O(1) 额外空间的代表，但它不稳定，且缓存局部性通常弱于快速排序。', 'Tight extra memory but a worst-case O(n log n) guarantee: heap sort is the O(1)-space representative, though it is unstable and usually has weaker cache locality than quicksort.'],
          ['关键字位数有限且可拆成十进制位：基数排序不比较完整关键字，d 很小时可达到线性量级；若位数很大，d 因子会抵消优势。', 'Finite digit domain decomposable into decimal digits: radix sort avoids full-key comparisons and is linear when d is small; a large d cancels the advantage.'],
          ['需要反复取当前最小值且不想每轮全表扫描：树形选择排序把比较结果缓存在选择树中，每轮只更新叶到根路径；代价是 O(n) 的树空间。', 'Repeatedly extracting the minimum without rescanning every round: tournament selection caches comparisons in a winner tree and updates only the leaf-to-root path, at the cost of O(n) tree space.'],
        ],
      },
      {
        title: ['多关键字排序：稳定是流程的一部分', 'Multi-key sorting: stability is part of the workflow'],
        body: [
          '假设学生记录为 (总分, 学号, 姓名)。要求“总分降序，总分相同按学号升序”。一种正确流程是先按学号升序稳定排序，再按总分降序稳定排序；第二趟不会打乱第一趟在相等总分内部建立的学号次序。若第二趟不稳定，先前结果可能在相等总分之间被重排，最终次序就错了。',
          'Suppose student records are (score, id, name). The requirement is “score descending, ties by id ascending”. One correct workflow sorts stably by id ascending first, then stably by score descending; the second pass does not disturb the id order established inside equal scores. If the second pass were unstable, it could reorder equal-score records and break the result.',
        ],
        points: [
          ['先排次关键字，再排主关键字；两次都必须稳定，或者使用一次稳定排序配合复合比较器。', 'Sort by the secondary key first and the primary key second; both passes must be stable, or use one stable sort with a composite comparator.'],
          ['“稳定”指相等关键字记录保持进入本次排序前的相对次序，不是保持最初输入次序。多趟排序时每一趟都重新定义“原次序”。', 'Stable means equal-key records keep the relative order they had entering this sort, not necessarily the original input order. Each pass redefines “previous order”.'],
          ['链式基数排序天然适合多关键字：每个十进制位就是一趟，桶的 FIFO 保证该趟稳定。', 'Chained radix sort naturally handles multiple keys: each decimal digit is one pass, and FIFO buckets make that pass stable.'],
        ],
        formula: '多关键字流程：先按次关键字稳定排序 → 再按主关键字稳定排序',
        formulaEn: 'Multi-key workflow: stable sort by secondary key → stable sort by primary key',
      },
      {
        title: ['LSD 与 MSD：方向不同，责任不同', 'LSD and MSD: different directions, different duties'],
        body: [
          'LSD 从个位开始，每一趟只保证“当前位及更低各位”有序；处理到最高位后，全部关键字有序。它不需要递归分组，但要求每一趟稳定。MSD 从最高位开始，先按最高位把记录分成若干组，再对每组递归处理下一位；分组后组间次序已经确定，组内才继续细分。MSD 更接近字典的编排方式，但实现和边界处理更复杂。',
          'LSD starts at the units digit; each pass guarantees order only for the active digit and all lower digits. After the highest digit, the full key is ordered. It needs no recursive grouping but requires every pass to be stable. MSD starts at the highest digit, partitions records into groups, then recurses within each group. Group order is fixed before inner digits are processed. MSD resembles dictionary ordering but has more complex implementation and boundary handling.',
        ],
        points: [
          ['LSD 适合位数固定、需要迭代实现的关键字；MSD 适合变长字符串或需要前缀分组的场景。', 'LSD suits fixed-length keys and iterative implementations; MSD suits variable-length strings or prefix grouping.'],
          ['LSD 的趟数等于最大位数；不足位补 0，不能因为某条记录位数短就少跑一趟。', 'LSD needs one pass per maximum digit; missing places are zeros, and a shorter record never reduces the pass count.'],
          ['MSD 分组后若组内为空或只有一个记录，可以提前结束该组；LSD 没有这种“提前完成”的分组结构。', 'After MSD partitions, an empty or singleton group can stop early; LSD has no such grouping structure.'],
        ],
      },
      {
        title: ['链式桶：不搬记录，只改链接', 'Chained buckets: move links, not records'],
        body: [
          '顺序存储的桶若用数组保存整条记录，每趟分配和收集都要复制记录，代价与记录体积成正比。链式基数排序让记录节点留在原地，每个桶只维护 head 和 tail：分配时把节点接到桶尾，`tail->next = node`；收集时把桶链整体接到结果链尾，并更新结果链尾。这样每趟只改 O(n) 个指针，不移动记录内容。',
          'If a bucket stores full records in an array, every pass copies records and the cost scales with record size. Chained radix sort leaves record nodes in place; each bucket keeps only head and tail. Distribution appends a node with `tail->next = node`; collection links the whole bucket chain to the result tail and updates it. Each pass changes O(n) links and moves no record payload.',
        ],
        points: [
          ['桶内链表必须按到达顺序追加，不能在中间插入；这是稳定分配的具体实现。', 'The bucket chain must append in arrival order, never insert in the middle; this is stable distribution in practice.'],
          ['收集时按 0–9 号桶依次把整条链接到结果链尾；桶空则跳过，不能改变桶号顺序。', 'Collection links each whole chain to the result tail in bucket order 0–9; empty buckets are skipped without changing bucket order.'],
          ['链式结构避免搬动记录，但仍需要 O(n+k) 的节点/指针空间；它不改变基数排序的时间量级。', 'Chaining avoids moving records but still needs O(n+k) node/pointer space; it does not change the asymptotic time.'],
        ],
        formula: '链式分配：bucket[digit].tail->next = node；bucket[digit].tail = node',
        formulaEn: 'Chained distribution: bucket[digit].tail->next = node; bucket[digit].tail = node',
      },
    ],
    comparison: {
      title: ['场景速查（不是绝对排名）', 'Scenario checklist (not an absolute ranking)'],
      columns: [
        ['场景', 'Scenario'],
        ['优先考虑', 'Prefer'],
        ['主要理由', 'Main reason'],
      ],
      rows: [
        [
          ['数据规模很小', 'Very small input'],
          ['直接插入排序', 'Direct insertion'],
          ['常数低、稳定、O(1) 额外空间', 'Low constant, stable, O(1) extra space'],
        ],
        [
          ['数据基本有序', 'Nearly ordered input'],
          ['直接插入排序', 'Direct insertion'],
          ['比较与移动接近线性；本课程冒泡无提前结束优化', 'Comparisons and moves approach linear; this course’s bubble has no early stop'],
        ],
        [
          ['数据规模较大、平均性能优先', 'Large input, average speed first'],
          ['快速排序（配合稳健枢轴）', 'Quicksort with a robust pivot'],
          ['平均 O(n log n)、常数较小；必须说明最坏 O(n²)', 'Average O(n log n) with small constants; the O(n²) worst case must be stated'],
        ],
        [
          ['必须稳定', 'Stability required'],
          ['归并排序（可接受 O(n) 缓冲）', 'Merge sort if an O(n) buffer is acceptable'],
          ['最坏 O(n log n)，相等时取左保持稳定', 'Worst-case O(n log n); taking left on ties preserves stability'],
        ],
        [
          ['额外内存受限', 'Tight extra memory'],
          ['堆排序', 'Heap sort'],
          ['O(1) 额外空间且最坏 O(n log n)，但不稳定', 'O(1) extra space and O(n log n) worst case, but unstable'],
        ],
        [
          ['关键字位数有限', 'Finite digit domain'],
          ['LSD 基数排序', 'LSD radix sort'],
          ['O(d(n+k))，桶内稳定；位数大时优势减弱', 'O(d(n+k)) with stable buckets; the advantage shrinks as d grows'],
        ],
        [
          ['反复取最小值、想复用比较结果', 'Repeated minimum extraction with comparison reuse'],
          ['树形选择排序', 'Tournament selection'],
          ['每轮只更新叶到根，O(n log n)，需要 O(n) 树空间', 'Only the leaf-to-root path changes each round; O(n log n) with O(n) tree space'],
        ],
      ],
    },
    takeaway: ['选择的顺序是：先排除不满足稳定性、空间或关键字前提的方法，再在剩余候选里比较最坏情况与常数；不要用“最快”替代适用条件。', 'Choose by first eliminating methods that fail stability, space or key-domain preconditions, then comparing worst case and constants among the survivors. Never substitute “fastest” for applicability.'],
  },
  {
    id: 'string-basics',
    topicId: 'string-basics',
    title: ['串的定义与模式匹配基础', 'Strings and the foundations of pattern matching'],
    chapter: ['第 4 章 · 串', 'Chapter 4 · Strings'],
    summary: [
      '串是由字符组成的有限有序序列，逻辑上属于线性结构，但每个元素只能是字符，操作也主要围绕整段字符序列展开。模式匹配先明确主串、模式串、子串位置和匹配是否允许重叠，再比较朴素方法与 KMP。',
      'A string is a finite ordered sequence of characters. It is logically linear, but every element is a character and its operations act on whole sequences. Pattern matching first fixes the text, pattern, substring position and overlap convention, then compares naive matching with KMP.',
    ],
    diagram: 'string-index',
    definitions: [
      {
        term: ['串（字符串）', 'String'],
        text: ['由零个或多个字符组成的有限序列，通常记作 S = "a₁a₂…aₙ"。n 是串长；n = 0 时是空串。', 'A finite sequence of zero or more characters, usually written S = "a₁a₂…aₙ". n is the length; n = 0 gives the empty string.'],
      },
      {
        term: ['空串', 'Empty string'],
        text: ['长度为 0 的串，记作 ""。它不含任何字符，因此不是空格串。', 'The string of length 0, written "". It contains no character, so it is not a blank string.'],
      },
      {
        term: ['空格串', 'Blank string'],
        text: ['由一个或多个空格字符组成的串。一个空格的长度是 1，两个空格的长度是 2；空格是真实字符。', 'A string made of one or more space characters. One space has length 1 and two spaces have length 2; a space is a real character.'],
      },
      {
        term: ['主串与子串', 'Text and substring'],
        text: ['被搜索的串称为主串 T；T 中连续一段字符构成的串称为 T 的子串。子串必须连续，不能跳着取字符。', 'The searched string is the text T. A substring is a contiguous segment of T; characters cannot be skipped.'],
      },
      {
        term: ['子串位置', 'Substring position'],
        text: ['子串首字符在主串中的序号。教材常从 1 开始计数，代码通常从 0 开始；本课程动画统一报告 0 基起点，并在界面标注。', 'The ordinal of the substring’s first character in the text. Textbooks often count from 1 and code from 0; this course reports 0-based starts and labels the convention in the UI.'],
      },
      {
        term: ['串相等', 'String equality'],
        text: ['两个串长度相同，且对应位置上的每个字符都相同，才称为相等。"AB" 与 "A B" 长度不同，"" 与 " " 也不相等。', 'Two strings are equal only when they have the same length and identical characters at every position. "AB" and "A B" differ in length, and "" is not equal to " ".'],
      },
      {
        term: ['长度', 'Length'],
        text: ['串中字符的个数。比较的是字符个数，不是字节数，也不是肉眼看到的显示宽度。', 'The number of characters in the string, not the number of bytes and not the rendered width.'],
      },
    ],
    sections: [
      {
        title: ['串与普通线性表：结构相同，操作不同', 'Strings versus ordinary linear lists'],
        body: [
          '串首先是一个线性结构：字符之间存在唯一的前驱和后继关系，可以按位置逐个访问，也可以顺序存储或链式存储。它与“元素类型任意的普通线性表”共享这套骨架，但元素类型固定为字符，操作通常以整段序列为单位，而不是只处理某个孤立元素。',
          'A string is first a linear structure: characters have unique predecessor/successor relations, can be visited by position, and may be stored sequentially or by links. It shares that skeleton with a general linear list, but its element type is fixed to characters and its operations usually act on whole sequences rather than one isolated element.',
        ],
        points: [
          ['相同点：都有长度、空结构、前驱/后继、按位置访问和顺序/链式两种存储思路。', 'Shared: length, empty state, predecessor/successor, access by position, and sequential or linked storage.'],
          ['不同点：串的元素只能是字符；普通线性表的元素可以是任意类型。', 'Difference: a string stores only characters; a general list may store arbitrary element types.'],
          ['不同点：串的赋值、比较、连接、取子串、定位往往一次处理一整段字符，代价取决于复制或移动了多少字符。', 'Difference: assignment, comparison, concatenation, substring and search process whole runs of characters, so cost depends on how many characters are copied or moved.'],
          ['下标要说明基准：教材位置从 1 开始，代码数组下标从 0 开始；同一个字符可能写成“第 3 个”或 T[2]。', 'Always state the index base: textbook positions start at 1 and code indices at 0, so the same character may be “position 3” or T[2].'],
        ],
        formula: '串 = 元素类型固定为字符的线性结构；操作对象常常是一段连续字符',
        formulaEn: 'String = a linear structure whose element type is fixed to characters; operations often target a contiguous run',
      },
      {
        title: ['串的抽象数据类型与基本操作', 'The string ADT and its basic operations'],
        body: [
          '串 ADT 把“数据对象是字符集合、元素之间是线性关系”和“允许哪些操作”分开描述。实现可以采用定长数组、堆分配数组或块链，但对外语义必须一致：长度、位置、比较规则和越界条件都要先约定清楚。',
          'The string ADT separates “the data objects are characters with linear relations” from “which operations are allowed”. A fixed array, heap array or block chain may implement it, but the observable semantics must agree: length, positions, comparison order and out-of-range rules all need a convention.',
        ],
        points: [
          ['赋值 StrAssign：用一段字符序列构造串；结果长度等于源序列长度。', 'Assign: build a string from a character sequence; its length equals the source length.'],
          ['求长 StrLength：返回字符个数；空串返回 0。', 'Length: return the character count; the empty string returns 0.'],
          ['比较 StrCompare：按字典序逐字符比较，第一个不同字符决定大小；全部相同且长度相同才相等。', 'Compare: compare lexicographically; the first difference decides order, and equality requires identical length and characters.'],
          ['连接 Concat：把两个串首尾相接；结果长度为两串长度之和，通常需要复制字符。', 'Concat: join two strings end to end; the result length is the sum, normally requiring a copy.'],
          ['取子串 SubString：给出起点和长度，复制连续一段；起点与长度必须落在合法区间。', 'SubString: copy a contiguous segment from a start and length; both must lie in the valid range.'],
          ['定位 Index：在主串中查找模式串；可以返回首个位置，也可以返回全部位置，但必须在课程中明确。', 'Index: search a pattern in the text; it may return the first position or every position, but the course must state which.'],
          ['插入 StrInsert 与删除 StrDelete：在指定位置插入或删除一段字符，后续字符要整体后移或前移。', 'Insert and delete: insert or remove a run at a given position, shifting later characters as a block.'],
          ['销毁、清空等管理操作不属于“求值”本身，但会影响容量与后续操作的前置条件。', 'Destroy and clear are management operations rather than value computation, but they affect capacity and preconditions for later operations.'],
        ],
        formula: '常见 ADT：StrAssign、StrCompare、StrLength、Concat、SubString、Index、StrInsert、StrDelete',
        formulaEn: 'Common ADT operations: StrAssign, StrCompare, StrLength, Concat, SubString, Index, StrInsert, StrDelete',
      },
      {
        title: ['空串、空格串与相等：不要被“看起来一样”骗了', 'Empty, blank and equal: do not trust appearance'],
        body: [
          '空串 "" 的长度是 0，一个字符也没有；空格串 " " 的长度是 1，字符是一个空格。两者长度不同，所以不相等，空串也不是空格串。判断串相等必须同时检查长度和每个位置的字符，不能只看“屏幕上都很空”。',
          'The empty string "" has length 0 and no characters; the blank string " " has length 1 and its only character is a space. Different lengths make them unequal, and the empty string is not a blank string. Equality checks both length and every character, not just a blank-looking screen.',
        ],
        points: [
          ['"" 是任何串的子串，长度 0；" " 只在主串含空格时出现。', '"" is a substring of every string with length 0; " " occurs only when the text contains a space.'],
          ['"AB" 与 "A B" 长度分别为 2 和 3，不相等；"AB" 与 "ab" 大小写不同，也不相等。', '"AB" and "A B" have lengths 2 and 3, so they differ; "AB" and "ab" differ in case and are also unequal.'],
          ['子串位置从 0 或 1 开始都可以，但同一份结果不能混用两套基准。', 'Substring positions may start at 0 or 1, but one result must not mix both bases.'],
        ],
        formula: '"" ≠ " "；长度不同或任一位置字符不同，就不相等',
        formulaEn: '"" ≠ " "; different lengths or any differing character means unequal',
      },
      {
        title: ['主串、模式串与匹配位置', 'Text, pattern and match positions'],
        body: [
          '被搜索的长串叫主串（文本）T，要查找的短串叫模式串 P。模式匹配要回答：P 在 T 中出现了哪些位置？这些位置能否重叠？空主串和空模式串分别如何处理？',
          'The longer string being searched is the text T; the shorter string to find is the pattern P. Pattern matching asks: where does P occur in T, may occurrences overlap, and how are an empty text or an empty pattern handled?',
        ],
        points: [
          ['一次对齐：把 P[0] 放在 T 的某个起点 s 上，再逐字符比较 T[s+j] 与 P[j]。', 'One alignment places P[0] at some text start s and compares T[s+j] with P[j].'],
          ['匹配条件：P[j] = T[s+j] 对所有 j 都成立，起点就是 s；合法起点满足 0 ≤ s ≤ n−m。', 'A match requires P[j] = T[s+j] for every j, and s is the start; valid starts satisfy 0 ≤ s ≤ n−m.'],
          ['多个匹配：同一模式串可能多次出现，结果是一个严格递增的起点列表。', 'Multiple matches: the same pattern may occur many times, so the result is a strictly increasing list of starts.'],
          ['重叠匹配：找到一次后仍继续检查后面的起点；BF 与 KMP 都按这一语义返回全部重叠起点。', 'Overlapping matches: keep checking later starts after a hit; both BF and KMP return every overlapping start under this convention.'],
          ['空主串：长度 n = 0，合法起点不存在，结果为空列表，但算法仍正常结束。', 'Empty text: n = 0 leaves no valid start, so the result is an empty list and the algorithm still terminates normally.'],
          ['空模式串：项目统一视为无效输入并在执行前拒绝；空模式串本身会匹配每个位置，容易产生无意义结果。', 'Empty pattern: the project treats it as invalid input and rejects it before execution; an empty pattern would match every position and produce meaningless results.'],
        ],
        formula: 'T = "ABABABCABABABC"，P = "ABABC" → 0 基匹配起点 2、9',
        formulaEn: 'T = "ABABABCABABABC", P = "ABABC" → 0-based match starts 2 and 9',
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
        formulaEn: 'On mismatch: j ← lps[j − 1], i unchanged',
      },
      {
        title: ['使用同一种下标约定', 'Use one indexing convention'],
        body: [
          '不同教材可能使用 next、nextval 或整体移位的前缀表。它们与 lps 描述同一段“最长相等真前后缀”，但数组项可能是长度、也可能是下一次比较的位置；先统一下标基准，再比较数值。本课程统一采用 0 基 lps。',
          'Textbooks may use next, nextval or a shifted prefix table. They describe the same longest equal proper prefix/suffix, but an entry may be a length or a next comparison position. Fix the indexing convention before comparing values; this course uses 0-based lps.',
        ],
        points: [
          ['本课程 lps（0 基）：lps[k] 是 P[0..k] 的最长相等真前后缀长度；失配时 j ← lps[j−1]，i 不动。', 'Here, lps is 0-based: lps[k] is the longest equal proper prefix/suffix length of P[0..k]; on a mismatch j ← lps[j−1] while i stays fixed.'],
          ['P = "ABABC" 的 lps = [0, 0, 1, 2, 0]；lps[3] = 2 表示 "AB" 这段长度，不是下一次比较的下标。', 'For P = "ABABC", lps = [0, 0, 1, 2, 0]; lps[3] = 2 is a length, not the next comparison index.'],
          ['经典教材的 1 基 next 常令 next[1] = 0；同一模式串 next = [0, 1, 1, 2, 3]，next[j] 是失配后下一次比较的模式位置。', 'Many textbooks use a 1-based next with next[1] = 0; the same pattern gives next = [0, 1, 1, 2, 3], where next[j] is the next pattern position to compare.'],
          ['nextval 在此基础上跳过“回退后仍会失配”的位置：若 P[j] = P[next[j]]，则 nextval[j] = nextval[next[j]]；ABABC 得到 [0, 1, 0, 1, 3]。', 'nextval skips a fallback that would immediately mismatch again: if P[j] = P[next[j]], then nextval[j] = nextval[next[j]]; ABABC gives [0, 1, 0, 1, 3].'],
          ['不要把 lps[3] = 2 与 next[3] = 1 直接比较：前者是 0 基长度，后者是 1 基位置，含义和基准都不同。', 'Do not compare lps[3] = 2 with next[3] = 1 directly: the first is a 0-based length, the second a 1-based position.'],
        ],
        formula: 'P = "ABABC"\nlps（0 基） = [0, 0, 1, 2, 0]\nnext（1 基，next[1]=0） = [0, 1, 1, 2, 3]\nnextval（1 基） = [0, 1, 0, 1, 3]\nnext[j] = lps[j−2] + 1（j ≥ 2）',
        formulaEn: 'P = "ABABC"\nlps (0-based) = [0, 0, 1, 2, 0]\nnext (1-based, next[1]=0) = [0, 1, 1, 2, 3]\nnextval (1-based) = [0, 1, 0, 1, 3]\nnext[j] = lps[j−2] + 1 (j ≥ 2)',
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
          ['是否复用已匹配信息', 'Reuse matched information'],
          ['不复用，换起点后从头比较', 'No; restart at every new start'],
          ['复用最长相等前后缀', 'Reuse the longest equal border'],
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
        [
          ['实际选择', 'Practical choice'],
          ['短文本、一次性查找、不想预处理时更直接', 'Direct for short or one-off searches without preprocessing'],
          ['长文本或大量重复查找时通常更稳，但有小模式串的常数开销', 'Usually steadier for long texts or repeated searches, with constant overhead on tiny patterns'],
        ],
      ],
    },
    takeaway: ['朴素匹配丢弃已匹配信息；KMP 用 lps 把这段信息变成下一次对齐的起点，因此主串指针不必回头。但 KMP 有预处理成本，不能断言它在所有实际输入上都更快。', 'Naive matching discards confirmed information; KMP turns it into the next alignment through lps, so the text pointer never goes back. KMP still pays preprocessing cost, so it is not automatically faster on every practical input.'],
  },
  {
    id: 'naive-matching',
    topicId: 'naive-match',
    title: ['朴素模式匹配：逐起点比较', 'Naive pattern matching: compare every start'],
    chapter: ['第 4 章 · 串', 'Chapter 4 · Strings'],
    summary: [
      '朴素匹配把模式串依次对齐到主串的每个可能起点，失配就换下一个起点。它不需要预处理，最坏却会反复比较已经确认过的字符。',
      'Naive matching aligns the pattern with every possible text start and moves to the next start after a mismatch. It needs no preprocessing, but in the worst case it rechecks characters already confirmed.',
    ],
    diagram: 'string',
    definitions: [
      {
        term: ['一次对齐', 'One alignment'],
        text: [
          '把模式串 P 的首字符放在主串 T 的起点 s 上，再令 j 从 0 开始逐字符比较 T[s+j] 与 P[j]。',
          'Place P[0] at text position s, then compare T[s+j] with P[j] for j = 0, 1, …',
        ],
      },
      {
        term: ['失配', 'Mismatch'],
        text: [
          '某个 j 上 T[s+j] 与 P[j] 不相等，当前起点 s 不可能匹配；朴素算法令 s 加一、j 归零。',
          'At some j, T[s+j] differs from P[j], so start s cannot match; naive matching increments s and resets j to 0.',
        ],
      },
      {
        term: ['合法起点', 'Valid start'],
        text: [
          '起点 s 必须满足 0 ≤ s ≤ n−m，否则剩余主串长度不足 m，不可能放下整个模式串。',
          'A start s must satisfy 0 ≤ s ≤ n−m; otherwise fewer than m characters remain for the whole pattern.',
        ],
      },
    ],
    sections: [
      {
        title: ['算法步骤：外层枚举起点，内层逐字符比较', 'Algorithm: enumerate starts outside, compare characters inside'],
        body: [
          '设主串长度为 n、模式串长度为 m。外层 s 枚举所有合法起点；内层 j 从 0 开始，只要字符相等就继续。若 j 走到 m，说明整段模式串匹配，记录起点 s；否则当前起点失败，进入下一个 s。',
          'Let the text length be n and the pattern length be m. The outer loop enumerates valid starts s; the inner loop advances j while characters agree. If j reaches m, the whole pattern matched and s is recorded; otherwise the current start failed and the outer loop advances.',
        ],
        points: [
          ['每个起点都从模式串第 0 个字符重新开始，不复用上一次对齐已经比较过的信息。', 'Every start restarts at pattern index 0 and does not reuse information from the previous alignment.'],
          ['匹配可以重叠：找到一个起点后，朴素算法仍会继续枚举后面的起点。', 'Matches may overlap: after finding one start, naive matching still enumerates later starts.'],
          ['主串指针不是独立前进的；它由 s+j 计算，s 变化时相当于回到更早的主串位置重扫。', 'There is no independent text pointer: it is s+j, so changing s can rescan earlier text positions.'],
        ],
        formula: 'for s = 0 … n−m:  j = 0; while j < m and T[s+j] = P[j]: j++;  if j = m: record s',
      },
      {
        title: ['一个具体失配：为什么最坏是 O(nm)', 'A concrete mismatch: why the worst case is O(nm)'],
        body: [
          '取 T = "ABABABC"、P = "ABABC"。起点 0 先匹配 A、B、A、B，到 j=4 时 T[4]=A 与 P[4]=C 失配；起点 1 的第一个字符 B 就失败；起点 2 又要从 P[0] 重新比较 T[2]、T[3]、T[4]。这些字符在上一次对齐中已经被确认过。',
          'Take T = "ABABABC" and P = "ABABC". Start 0 matches A, B, A, B, then T[4]=A differs from P[4]=C. Start 1 fails on its first B; start 2 compares T[2], T[3], T[4] again from P[0]. Those characters were already confirmed in the previous alignment.',
        ],
        points: [
          ['最坏情况下，长度为 m 的模式串几乎在每个起点都比对到末尾，时间达到 O(nm)。', 'In the worst case, a length-m pattern is compared almost to its end at every start, giving O(nm) time.'],
          ['最好情况下，每个起点第一个字符就失配，只需 O(n) 次字符比较。', 'In the best case, every start fails on its first character, requiring only O(n) comparisons.'],
          ['除 s、j 等常数个变量外不需要额外空间，辅助空间为 O(1)。', 'Apart from constant variables such as s and j, no extra space is needed, so auxiliary space is O(1).'],
        ],
        formula: '最坏 O(nm)，最好 O(n)，额外空间 O(1)',
        formulaEn: 'worst O(nm), best O(n), extra space O(1)',
      },
      {
        title: ['它为什么仍然值得学', 'Why it is still worth learning'],
        body: [
          '朴素匹配是模式匹配的基线：实现短、无需预处理，适合短文本或一次性查找。只有当我们看清它“失配后丢弃已匹配信息”的代价，才能理解 KMP 为什么要构造前缀表，以及 O(n+m) 的优势来自哪里。',
          'Naive matching is the baseline: short to implement, no preprocessing, and reasonable for short or one-off searches. Seeing the cost of discarding matched information after a mismatch is what makes KMP’s prefix table and O(n+m) advantage meaningful.',
        ],
        points: [
          ['不要把“朴素”理解为错误；它在合法输入上仍然返回正确结果，只是最坏效率较低。', '“Naive” does not mean wrong: it still returns correct results on valid input, only with a weaker worst-case bound.'],
          ['KMP 不改变匹配目标，只改变失配后的对齐方式；两者都可用于查找全部出现位置。', 'KMP changes only how the pattern realigns after a mismatch; both methods can report every occurrence.'],
        ],
      },
    ],
    takeaway: [
      '朴素匹配用“换起点、归零、重扫”换来实现简单；理解这份重复，是进入 KMP 的起点。',
      'Naive matching trades repeated rescans for a simple implementation; understanding that repetition is the doorway to KMP.',
    ],
  },
  {
    id: 'array-basics',
    topicId: 'array-basics',
    title: ['数组与多维数组', 'Arrays and multidimensional arrays'],
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
    summary: [
      '数组把相同类型的元素排成一条序列，并用连续存储单元实现按下标随机访问。二维数组可以看成“元素是一维数组的一维数组”，行优先与列优先决定它怎样压进一维内存。下方 3×4 图可点击元素，并切换两种存储顺序。',
      'An array stores elements of the same type in a sequence and uses contiguous cells to support random access by index. A 2D array is an array of 1D arrays; row-major or column-major order decides how it is flattened into one-dimensional memory. The 3×4 diagram below is clickable and switches between the two orders.',
    ],
    diagram: 'array-memory',
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
        formulaEn: 'A[i][j]: 0 ≤ i < R, 0 ≤ j < C (0-based in this course)',
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
        formulaEn: 'row-major position = i*C + j; column-major position = j*R + i (0-based)',
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
          ['例：R=3、C=4、base=1000、w=4。A[1][2] 的行优先地址是 1000+(1*4+2)*4 = 1024；列优先地址是 1000+(2*3+1)*4 = 1028。', 'Example: R=3, C=4, base=1000, w=4. A[1][2] is at 1000+(1*4+2)*4 = 1024 in row-major and 1000+(2*3+1)*4 = 1028 in column-major.'],
          ['若题目下标从 1 开始，先把 i、j 各减 1，再代入上面的 0 基公式；不要直接把 1 基下标塞进公式。', 'If the problem uses 1-based indices, subtract 1 from i and j before using the 0-based formulas; never substitute 1-based indices directly.'],
        ],
        formula: '行优先 Loc(i,j) = base + (i*C + j)*w',
        formulaEn: 'row-major Loc(i,j) = base + (i*C + j)*w',
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
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
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
        formulaEn: 'number of elements in a symmetric matrix: n(n+1)/2 (including the main diagonal)',
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
        formulaEn: '0-based lower triangle: k = i(i+1)/2 + j (i ≥ j)',
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
        formulaEn: 'tridiagonal (0-based): k = 2i + j, |i−j| ≤ 1',
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
        formulaEn: 'first identify the triangle, then the base index, then substitute into the formula',
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
    chapter: ['第 5 章 · 数组和广义表', 'Chapter 5 · Arrays and generalized lists'],
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
        formulaEn: 'nonzero fraction δ = t / (m×n)',
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
        formulaEn: '(row, col, value) table; t records occupy 3t numeric values',
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
        formulaEn: 'CSR storage: row_ptr(m+1) + col_idx(t) + values(t)',
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
        formulaEn: 'cpot[c] = cpot[c−1] + num[c−1] (0-based)',
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
  {
    id: 'b-tree',
    topicId: 'multiway-tree',
    title: ['B 树（B-Tree）', 'B-tree'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      'B 树是一棵所有叶子等深的多路平衡查找树。一个节点存放多个有序关键字，并用 k 个关键字把关键字空间划分成 k+1 个区间，分别交给 k+1 棵子树。节点容量变大后，树高显著降低，磁盘上一次节点访问可以取回更多关键字。',
      'A B-tree is a multiway balanced search tree whose leaves all lie at the same depth. One node stores several ordered keys and partitions the key space into k+1 intervals, one per child. Larger nodes reduce height, so one disk page read can bring back more keys.',
    ],
    diagram: 'b-tree',
    definitions: [
      {
        term: ['阶（order m）', 'Order m'],
        text: ['本课程固定采用 m = 4：每个节点最多 4 个孩子、最多 3 个关键字。阶描述的是孩子数上限，不是关键字数上限。', 'This course fixes m = 4: at most four children and three keys per node. Order bounds the number of children, not the number of keys.'],
      },
      {
        term: ['关键字与孩子', 'Keys and children'],
        text: ['含 k 个关键字的内节点恰有 k+1 个孩子；关键字严格递增，第 i 棵子树的关键字都落在第 i-1 与第 i 个关键字之间。', 'An internal node with k keys has exactly k+1 children; keys strictly increase, and the i-th subtree lies between keys i-1 and i.'],
      },
      {
        term: ['非根节点的下限', 'Minimum for a non-root node'],
        text: ['m = 4 时，非根节点至少 ceil(m/2)-1 = 1 个关键字，也就是至少 2 个孩子；根节点除外。', 'For m = 4, every non-root node has at least ceil(m/2)-1 = 1 key, hence at least two children; the root is exempt.'],
      },
      {
        term: ['根节点的特殊规则', 'Special rule for the root'],
        text: ['根可以是叶子，此时允许 1 到 3 个关键字；根不是叶子时至少要有 2 个孩子。空树是合法的初始状态。', 'The root may be a leaf with one to three keys; if it is internal it must have at least two children. An empty tree is a legal initial state.'],
      },
      {
        term: ['平衡性质', 'Balance property'],
        text: ['从根到每一片叶子的路径长度相同，所以“叶子在同一深度”不是额外修饰，而是 B 树定义的一部分。', 'Every root-to-leaf path has the same length, so “all leaves at one depth” is part of the definition, not a decoration.'],
      },
    ],
    sections: [
      {
        title: ['为什么二叉搜索树不够', 'Why a binary search tree is not always enough'],
        body: [
          '二叉搜索树每个节点只存一个关键字，树高约为 log₂ n；节点数一多，查找路径就变长。数据库和文件系统按“页”读取数据，一次 I/O 的成本远高于一次内存比较，真正昂贵的是访问节点次数，而不是节点内部的比较次数。',
          'A binary search tree stores one key per node and has height about log₂ n; the path grows with n. Databases and file systems read whole pages, and one I/O costs far more than an in-memory comparison. Node visits, not comparisons inside a node, dominate.',
        ],
        points: [
          ['把多个关键字塞进一个节点，可以一次 I/O 读入一批关键字。', 'Packing several keys into one node brings a batch of keys in one I/O.'],
          ['分支因子从 2 提高到 m，树高从 log₂ n 降到约 log_m n。', 'Raising the branching factor from 2 to m lowers height from about log₂ n to log_m n.'],
          ['B 树仍然保持有序性，因此节点内部可以用二分或顺序比较。', 'Order is preserved, so keys inside a node can be compared sequentially or by binary search.'],
        ],
      },
      {
        title: ['一个节点怎样划分关键字空间', 'How one node partitions the key space'],
        body: [
          '若节点关键字为 k₁ < k₂ < … < kₜ，则孩子指针 c₀, c₁, …, cₜ 对应 t+1 个互不重叠的区间：c₀ 全部小于 k₁，cᵢ 位于 kᵢ 与 kᵢ₊₁ 之间，cₜ 全部大于 kₜ。这个“区间归属”是查找时选择孩子的唯一依据，也是插入后必须恢复的约束。',
          'If a node has keys k₁ < k₂ < … < kₜ, its child pointers c₀, c₁, …, cₜ cover t+1 disjoint intervals: c₀ is below k₁, cᵢ lies between kᵢ and kᵢ₊₁, and cₜ is above kₜ. This interval ownership is the only rule for choosing a child during search, and it must be restored after insertion.',
        ],
        formula: 'k₁ < k₂ < … < kₜ；cᵢ 中的关键字 ∈ (kᵢ, kᵢ₊₁)，两端为 -∞ / +∞',
        formulaEn: 'k₁ < k₂ < … < kₜ; keys in cᵢ lie in (kᵢ, kᵢ₊₁), with -∞ / +∞ at the ends',
      },
      {
        title: ['查找：节点内比较，再选一个孩子', 'Search: compare inside, then choose one child'],
        body: [
          '从根开始，在当前节点内依次比较关键字。若命中，查找成功；若目标小于某个关键字，就进入它左边的孩子；若大于最后一个关键字，就进入最右孩子。到达叶子仍未命中，说明关键字不存在。',
          'Start at the root and compare keys inside the current node. A hit succeeds. If the target is smaller than a key, descend to its left child; if it is larger than the last key, descend to the rightmost child. Reaching a leaf without a hit means the key is absent.',
        ],
        points: [
          ['每层只访问一个节点，层内最多比较 m-1 个关键字。', 'One node is visited per level, with at most m-1 key comparisons inside it.'],
          ['树高为 h 时，最多访问 h+1 个节点。', 'For height h, at most h+1 nodes are visited.'],
          ['节点内关键字有序，可用二分查找把比较次数降到 O(log m)。', 'Keys are ordered, so binary search inside a node costs O(log m) comparisons.'],
        ],
      },
      {
        title: ['插入：下降前分裂满节点', 'Insertion: split full nodes on the way down'],
        body: [
          '本课程统一采用“下降前分裂”策略：从根开始，凡是将要进入的满孩子（已有 3 个关键字）先分裂，再决定走哪一个孩子；根满时先分裂根并产生新根。这样真正插入时，目标叶子一定有空格，不需要在回溯阶段补分裂。',
          'This course consistently splits full children before descending: whenever the next child is full (three keys), split it first, then choose the branch; if the root is full, split it and create a new root. The target leaf is therefore guaranteed to have room, so no backtracking split is needed.',
        ],
        points: [
          ['满节点有 3 个关键字、4 个孩子；取中间关键字（下标 1）上升。', 'A full node has three keys and four children; the middle key (index 1) is promoted.'],
          ['上升关键字插入父节点，原节点保留左半部分，新节点接收右半部分。', 'The promoted key enters the parent; the old node keeps the left half and a new node receives the right half.'],
          ['根分裂时中间关键字成为新根，树高增加 1，这是 B 树长高的唯一方式。', 'When the root splits, the middle key becomes a new root and height grows by one — the only way a B-tree grows.'],
          ['重复关键字在插入前先定位；一旦命中就拒绝插入，树保持不变。', 'A duplicate is located before insertion; on a hit the insertion is rejected and the tree is unchanged.'],
        ],
        formula: 'm = 4：满节点 3 键 → 左 1 键 + 上升 1 键 + 右 1 键',
        formulaEn: 'm = 4: a full node with 3 keys → left 1 key + promoted 1 key + right 1 key',
      },
      {
        title: ['树高与代价', 'Height and cost'],
        body: [
          '设关键字总数为 n、阶为 m、树高为 h。每个节点最多 m 个孩子，因此 h 层最多容纳约 mʰ 个叶子；反过来 h = O(log_m n)。节点容量越大，树越矮，但单节点内比较和页内数据也越多，实际容量要由页大小与关键字大小共同决定。',
          'With n keys, order m and height h, each node has at most m children, so h levels hold about mʰ leaves; conversely h = O(log_m n). Larger nodes reduce height but increase in-node comparisons and page payload, so real capacity follows page and key sizes.',
        ],
        points: [
          ['查找、插入的节点访问次数都是 O(log_m n)，层内比较另计。', 'Search and insertion visit O(log_m n) nodes; in-node comparisons are additional.'],
          ['m 增大时树高下降；这正是磁盘索引偏好高扇出的原因。', 'A larger m lowers height; this is why disk indexes prefer high fanout.'],
          ['B 树不保证每个节点都装满，只保证不超过上限、不低于下限。', 'A B-tree does not keep every node full; it only enforces upper and lower bounds.'],
        ],
      },
    ],
    comparison: {
      title: ['阶 m 与最小度数 t 不要混用', 'Order m vs minimum degree t'],
      columns: [
        ['记法', 'Notation'],
        ['含义', 'Meaning'],
        ['m = 4 时的值', 'At m = 4'],
      ],
      rows: [
        [
          ['阶 m', 'Order m'],
          ['孩子数上限', 'Maximum children'],
          ['4', '4'],
        ],
        [
          ['关键字上限', 'Maximum keys'],
          ['m - 1', 'm - 1'],
          ['3', '3'],
        ],
        [
          ['最小度数 t', 'Minimum degree t'],
          ['另一种教材记法，t 常取 ⌈m/2⌉', 'Alternative notation, often t = ⌈m/2⌉'],
          ['t = 2：最多 2t 个孩子、2t-1 个关键字', 't = 2: at most 2t children and 2t-1 keys'],
        ],
        [
          ['非根关键字下限', 'Minimum keys (non-root)'],
          ['ceil(m/2) - 1', 'ceil(m/2) - 1'],
          ['1', '1'],
        ],
      ],
    },
    takeaway: ['B 树用“节点内多关键字 + 所有叶子等深”换取更低树高；m = 4 时记住 4 个孩子、3 个关键字、非根至少 1 个关键字。', 'A B-tree trades multiple keys per node and equal leaf depth for a lower height. For m = 4: four children, three keys, at least one key in every non-root node.'],
  },
  {
    id: 'b-plus-tree',
    topicId: 'bplus-tree',
    title: ['B+ 树（B+ Tree）', 'B+ tree'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      'B+ 树把内部节点和叶子节点分工：内部节点只保存用于路由的索引关键字，记录（或指向记录的指针）全部放在叶子层；叶子按关键字顺序串成链表。查找必须走到叶子，范围查询则可以先定位左端，再沿叶子链顺序扫描。',
      'A B+ tree separates routing from storage: internal nodes hold only separator keys, while all records (or record pointers) live in the leaf level; leaves are linked in key order. A search always reaches a leaf, and a range query locates its left endpoint then scans the leaf chain.',
    ],
    diagram: 'b-plus-tree',
    definitions: [
      {
        term: ['内部节点', 'Internal node'],
        text: ['只承担索引作用，保存分隔关键字和孩子指针；同一个关键字可能在内部节点和叶子中各出现一次。', 'Internal nodes only route: they store separator keys and child pointers. A key may appear both internally and in a leaf.'],
      },
      {
        term: ['叶子层', 'Leaf level'],
        text: ['所有记录或记录指针都在叶子中，叶子之间用 next 指针按关键字顺序连接。', 'All records or record pointers sit in leaves, linked by next pointers in key order.'],
      },
      {
        term: ['卫星记录', 'Satellite record'],
        text: ['真正随关键字存放的数据行或指向数据行的指针；B+ 树把它集中在叶子层。', 'The actual row or pointer stored with a key; a B+ tree concentrates it at the leaf level.'],
      },
      {
        term: ['范围查询', 'Range query'],
        text: ['先找到区间左端所在叶子，再沿叶子链向右扫描，直到超过右端。', 'Locate the leaf containing the left endpoint, then follow the leaf chain rightward until the right endpoint is exceeded.'],
      },
    ],
    sections: [
      {
        title: ['内部只做索引，记录都在叶子', 'Internal nodes route; leaves store'],
        body: [
          '在 B+ 树中，内部节点的关键字只是“路标”：它告诉查找应该往哪个孩子走，并不携带记录。真正的记录集中在叶子层，因此一次成功查找总是走到叶子，路径长度稳定。',
          'In a B+ tree an internal key is only a signpost: it tells the search which child to follow and carries no record. Records live at the leaf level, so every successful search reaches a leaf and has a stable path length.',
        ],
        points: [
          ['内部节点可以更矮更宽，扇出通常高于同阶 B 树。', 'Internal nodes can be shorter and wider, usually giving a higher fanout than a B-tree of the same order.'],
          ['同一个关键字在内部与叶子重复出现是正常现象，不是错误。', 'A key appearing in both an internal node and a leaf is normal, not an error.'],
          ['命中内部关键字也不能提前结束，必须继续到叶子取记录。', 'Even a hit on an internal key cannot stop early; the search must reach a leaf for the record.'],
        ],
      },
      {
        title: ['叶子链让范围查询变成顺序扫描', 'The leaf chain turns ranges into a scan'],
        body: [
          '叶子按关键字升序连接。查询 [L, R] 时，先按 L 定位到某片叶子，然后顺着 next 指针向右读；一旦当前叶子的最大关键字超过 R，扫描结束。这比在 B 树中反复回到上层再下降要自然得多。',
          'Leaves are linked in ascending key order. For a range [L, R], locate the leaf for L and follow next pointers rightward; stop once the leaf’s largest key exceeds R. This is far more natural than repeatedly returning to upper levels as in a B-tree.',
        ],
        points: [
          ['点查找仍然是从根到叶，代价 O(log_m n)。', 'A point lookup still runs root to leaf in O(log_m n).'],
          ['范围查询的代价是“定位 + 输出 k 条记录”，即 O(log_m n + k)。', 'A range query costs “locate + output k records”, O(log_m n + k).'],
          ['叶子链使顺序输出不需要中序遍历整棵树。', 'The leaf chain supports ordered output without an in-order traversal of the whole tree.'],
        ],
      },
      {
        title: ['数据库索引为什么常见 B+ 树', 'Why database indexes commonly use B+ trees'],
        body: [
          '数据库页容量固定，B+ 树把记录压在叶子层，内部节点只放分隔键，单页能容纳更多孩子，树高更低；叶子链又直接支持范围扫描、排序输出和前缀查询。代价是点查找必须走到叶子，且内部关键字有重复存储。',
          'Database pages are fixed-size. A B+ tree concentrates records at the leaf level and keeps only separators internally, so a page holds more children and the tree is shorter; the leaf chain directly supports range scans, ordered output and prefix queries. The cost is that point lookups must reach a leaf and separators are duplicated.',
        ],
        points: [
          ['聚簇索引的叶子可以直接存行；二级索引的叶子通常存主键或行指针。', 'A clustered index can store rows in its leaves; a secondary index usually stores primary keys or row pointers.'],
          ['高扇出让大多数索引只有 3 到 4 层，根和上层常驻内存。', 'High fanout keeps most indexes three to four levels deep, with the root and upper levels cached in memory.'],
          ['B 树也能做索引，但在范围扫描和叶子顺序访问上通常不如 B+ 树直接。', 'A B-tree can also serve as an index, but range scans and ordered leaf access are usually less direct than in a B+ tree.'],
          ['选择取决于读写比例、范围查询比例和记录存放方式，不存在绝对“更好”。', 'The choice depends on read/write mix, range-query share and record placement; neither is universally better.'],
        ],
      },
    ],
    comparison: {
      title: ['B 树与 B+ 树', 'B-tree vs B+ tree'],
      columns: [
        ['比较项', 'Aspect'],
        ['B 树', 'B-tree'],
        ['B+ 树', 'B+ tree'],
      ],
      rows: [
        [
          ['记录位置', 'Where records live'],
          ['每个节点都可能带记录', 'Records may sit in any node'],
          ['只在叶子层', 'Leaf level only'],
        ],
        [
          ['内部关键字', 'Internal keys'],
          ['就是记录关键字，命中即可返回', 'Record keys; a hit can return'],
          ['只是路由分隔键，命中仍要到叶子', 'Routing separators only; a hit still descends'],
        ],
        [
          ['叶子链接', 'Leaf links'],
          ['通常没有叶子链', 'Usually no leaf chain'],
          ['有 next 链，支持顺序扫描', 'next chain for ordered scans'],
        ],
        [
          ['点查找', 'Point search'],
          ['可能在内部节点提前命中', 'May stop at an internal node'],
          ['固定走到叶子', 'Always reaches a leaf'],
        ],
        [
          ['范围查询', 'Range query'],
          ['需要树内回溯或中序遍历', 'Needs backtracking or in-order traversal'],
          ['定位左端后沿叶子链扫描', 'Locate left end, then scan leaves'],
        ],
        [
          ['典型用途', 'Typical use'],
          ['内存索引、文件系统、部分数据库', 'In-memory indexes, file systems, some databases'],
          ['数据库 B+ 树索引、范围扫描', 'Database B+ tree indexes, range scans'],
        ],
      ],
    },
    takeaway: ['B 树把记录分散在所有节点；B+ 树把记录集中到叶子，并用叶子链服务范围查询。数据库索引常用 B+ 树，是因为高扇出、稳定到叶和顺序扫描三件事同时成立。', 'A B-tree scatters records across nodes; a B+ tree concentrates them in leaves and uses the leaf chain for ranges. Database indexes favour B+ trees because high fanout, stable leaf paths and ordered scans hold at once.'],
  },
  {
    id: 'asl-decision-tree',
    topicId: 'search-asl',
    title: ['平均查找长度（ASL）与判定树', 'Average search length (ASL) and decision trees'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '平均查找长度（ASL）是在给定查找概率下，一次查找所进行比较次数的加权平均值。它必须把查找成功与查找失败分开统计；在等概率假设下，二分查找的 ASL 可以直接从其判定树的内部节点和外部区间读出。时间复杂度描述增长趋势，ASL 描述具体数据与概率下的实际比较成本，两者回答的不是同一个问题。',
      'Average search length (ASL) is the probability-weighted mean number of key comparisons in one search. Successful and unsuccessful searches must be counted separately; under an equal-probability assumption, a binary-search ASL can be read directly from the internal nodes and external gaps of its decision tree. Time complexity describes growth, while ASL describes comparison cost under concrete data and probabilities.',
    ],
    diagram: 'asl-decision-tree',
    definitions: [
      {
        term: ['平均查找长度 ASL', 'Average search length (ASL)'],
        text: ['按每条查找路径的概率对其关键字比较次数加权求和所得的期望值。它不是某一次查找的次数，也不是算法的最坏情况。', 'The expected number of key comparisons, weighting each search path by its probability. It is neither one particular search nor the worst case.'],
      },
      {
        term: ['查找成功的 ASL', 'Successful ASL'],
        text: ['查询关键字存在于表中时的条件期望。p_i 是在“查找成功”条件下命中第 i 个关键字的概率，c_i 是命中它所需的比较次数。', 'The conditional expectation when the key exists. p_i is the probability of hitting key i given success, and c_i is its comparison count.'],
      },
      {
        term: ['查找失败的 ASL', 'Unsuccessful ASL'],
        text: ['查询关键字不存在时的条件期望。q_j 是在“查找失败”条件下落入第 j 个失败区间的概率，c_j 是该路径的比较次数。', 'The conditional expectation when the key is absent. q_j is the probability of falling into failure gap j, and c_j is that path’s comparison count.'],
      },
      {
        term: ['比较次数 c', 'Comparison count c'],
        text: ['一次查找实际执行的关键字比较次数。指针移动、数组下标计算、哈希函数计算和缓存缺失都不自动折算成一次关键字比较。', 'The number of key comparisons actually performed. Pointer moves, index arithmetic, hashing and cache misses are not automatically converted into one key comparison.'],
      },
      {
        term: ['二分判定树', 'Binary-search decision tree'],
        text: ['把每次比较所在的关键字作为内部节点，把空指针所对应的失败区间作为外部节点；从根到节点的路径就是一次查找的比较路径。', 'Internal nodes are the keys compared; external nodes are the failure gaps represented by null pointers. A root-to-node path is one search comparison path.'],
      },
    ],
    sections: [
      {
        title: ['为什么时间复杂度不能代替 ASL', 'Why big-O cannot replace ASL'],
        body: [
          'O(n) 只描述 n 增大时的增长上界，不区分一次查找到底比了 1 次还是 n 次，也不区分成功与失败。例如无序表查首项和末项都属于 O(n)，实际比较次数却分别是 1 和 n；哈希表常被写成期望 O(1)，但装载因子升高、冲突聚集时实际比较会明显增加。ASL 用概率把这种差异量化。',
          'O(n) only bounds growth as n increases; it does not distinguish one comparison from n, nor success from failure. Searching the first or last item of an unordered list is O(n) either way, but costs 1 versus n comparisons. A hash table is often called expected O(1), yet its real comparison count grows with load factor and clustering. ASL quantifies that difference with probabilities.',
        ],
        points: [
          ['ASL 是给定数据、概率和计数口径下的平均值，不是算法的最坏情况。', 'ASL is an average under stated data, probabilities and counting conventions, not a worst case.'],
          ['比较次数必须说明是否包含最后一次失配比较，以及是否使用哨兵。', 'State whether the final mismatch comparison is counted and whether a sentinel is used.'],
          ['ASL 不会自动把指针访问、缓存缺失或哈希计算折算成关键字比较。', 'ASL does not automatically charge pointer access, cache misses or hashing as key comparisons.'],
        ],
      },
      {
        title: ['严谨定义：成功与失败分开', 'The formal definition: keep success and failure apart'],
        body: [
          '设成功查找时命中第 i 个关键字的概率为 p_i，所需比较次数为 c_i；失败查找落入第 j 个失败区间的概率为 q_j，所需比较次数为 c_j。两个条件分布各自归一，不能把两组概率混在一起直接相加。若还知道一次查询“存在”的先验概率 P_s，才把两部分合成总期望。',
          'Let p_i be the probability of hitting key i given success, with c_i comparisons; let q_j be the probability of falling into failure gap j, with c_j comparisons. Each conditional distribution sums to one, so the two sets cannot be added blindly. Only when the prior probability P_s that a query exists is known do we combine them into total expected cost.',
        ],
        formula: 'ASL_succ = Σ p_i c_i,  Σ p_i = 1;\nASL_fail = Σ q_j c_j,  Σ q_j = 1;\nE[C] = P_s·ASL_succ + (1 − P_s)·ASL_fail',
        points: [
          ['等概率成功：p_i = 1/n，ASL_succ = (1/n) Σ c_i。', 'Equal success probabilities: p_i = 1/n, so ASL_succ = (1/n) Σ c_i.'],
          ['n 个关键字的有序表有 n+1 个失败区间；若各区间等概率，常取 q_j = 1/(n+1)。', 'An ordered table with n keys has n+1 failure gaps; if they are equally likely, q_j = 1/(n+1).'],
          ['有的教材只把成功部分称为 ASL；题目另问“失败 ASL”时必须单独计算。', 'Some textbooks call only the successful part ASL; when a question asks for unsuccessful ASL, compute it separately.'],
        ],
      },
      {
        title: ['等概率只是基准，不是现实规律', 'Equal probability is a baseline, not a law'],
        body: [
          '等概率假设是为了让不同算法可比较而设置的基准。真实查询往往偏斜：热词、常用账号、近期记录会反复出现。此时应该用查询频率估计 p_i，而不是直接套 1/n。概率一变，同一个查找结构的 ASL 就会变。',
          'Equal probability is a benchmark that makes algorithms comparable. Real queries are often skewed: popular terms, active accounts and recent records recur. Estimate p_i from query frequencies instead of substituting 1/n. Change the probabilities and the same structure has a different ASL.',
        ],
        points: [
          ['提高高频关键字的权重通常会降低成功 ASL；把高频元素前移或上移往往有效。', 'Giving frequent keys more weight usually lowers successful ASL; moving them earlier or higher often helps.'],
          ['失败概率也可能偏斜：目标更常落入某个区间时，该区间的比较次数权重大。', 'Failure probabilities can be skewed too: a frequently visited gap carries more weight.'],
          ['同一个算法换一组概率就可能得到不同的 ASL；变的是期望成本，不是代码。', 'The same algorithm can have a different ASL under another probability set; the expected cost changes, not the code.'],
          ['报告 ASL 时应同时写明 n、概率假设、成功/失败条件和比较计数口径。', 'When reporting ASL, state n, probability assumptions, success/failure condition and comparison conventions.'],
        ],
      },
      {
        title: ['怎样读二分查找的判定树', 'How to read a binary-search decision tree'],
        body: [
          '对有序表做二分查找，把第一次比较的元素放在根，左、右子区间递归建树，就得到判定树。内部节点对应真实关键字，外部节点对应空指针，也就是失败区间。成功路径停在内部节点，失败路径停在外节点。',
          'For binary search on a sorted table, put the first compared key at the root and recursively build the left and right subintervals. Internal nodes are real keys; external nodes are null pointers, i.e. failure gaps. A successful path ends internally; a failing path ends externally.',
        ],
        points: [
          ['成功：比较次数等于内部节点的层号，根为第 1 层。', 'Success: comparisons equal the internal node’s level, with the root at level 1.'],
          ['失败：比较次数等于外部节点父节点的层号；外部节点画在第 d+1 层时，实际只做了 d 次比较。', 'Failure: comparisons equal the level of the external node’s parent; if the external node is drawn at level d+1, only d comparisons were made.'],
          ['不要把 0 基深度直接当比较次数：根深度为 0，但比较次数是 1，所以 c = d + 1。', 'Do not treat 0-based depth as comparisons: the root has depth 0 but costs 1, so c = d + 1.'],
          ['判定树不唯一：mid 取上取整或下取整可能改变树形与 ASL，但仍保持 O(log n)。', 'The tree is not unique: choosing upper or lower mid may change its shape and ASL while preserving O(log n).'],
        ],
      },
      {
        title: ['7 个关键字的完整例题', 'A complete seven-key example'],
        body: [
          '对 a = [10, 20, 30, 40, 50, 60, 70] 使用 mid = floor((low + high) / 2)。根是 a[3] = 40；左、右子树分别以 20 和 60 为根，四个叶子是 10、30、50、70。这是一棵三层满判定树，所有失败路径都经过三个内部节点。',
          'For a = [10, 20, 30, 40, 50, 60, 70], use mid = floor((low + high) / 2). The root is a[3] = 40; the left and right subtrees start at 20 and 60, with leaves 10, 30, 50 and 70. It is a full three-level decision tree, so every failure path passes through three internal nodes.',
        ],
        points: [
          ['成功比较次数分布：1 次 1 个、2 次 2 个、3 次 4 个，故 ASL_succ = 17/7 ≈ 2.43。', 'Successful counts: one key at 1 comparison, two at 2 and four at 3, so ASL_succ = 17/7 ≈ 2.43.'],
          ['8 个空指针形成 8 个失败区间；每个失败区间都比较 3 次，故 ASL_fail = 3。', 'Eight null pointers form eight failure gaps; each costs three comparisons, so ASL_fail = 3.'],
          ['查找 35 走 40 → 20 → 30 → 空，恰好 3 次失败比较；查找 40 一次成功。', 'Searching 35 follows 40 → 20 → 30 → null for exactly three comparisons; searching 40 succeeds in one.'],
          ['若表长或 mid 约定改变，树形可能改变；17/7 只对应本例的 floor 约定。', 'If the table length or mid convention changes, the shape may change; 17/7 applies only to this example’s floor convention.'],
        ],
        formula: 'ASL_succ = (1×1 + 2×2 + 4×3)/7 = 17/7 ≈ 2.43;\nASL_fail = (8×3)/8 = 3',
      },
      {
        title: ['不同查找方法不能共用一个 ASL', 'Different searches cannot share one ASL'],
        body: [
          '顺序、二分、BST 和哈希的前置条件不同，ASL 的自变量也不同。顺序查找取决于元素位置和概率；二分取决于判定树与区间概率；BST 取决于插入形成的树形；哈希取决于装载因子、哈希均匀性和冲突处理。把它们都写成一个固定数字会丢失关键假设。',
          'Sequential search, binary search, a BST and hashing have different preconditions and different ASL variables. Sequential cost depends on positions and probabilities; binary cost on the decision tree and gap probabilities; BST cost on the insertion shape; hashing on load factor, uniformity and collision handling. One fixed number would erase those assumptions.',
        ],
        points: [
          ['顺序查找等概率成功通常为 (n+1)/2；失败还要看能否提前停止以及哨兵约定。', 'Equal-probability sequential success is usually (n+1)/2; failure depends on early stopping and sentinel conventions.'],
          ['BST 的成功 ASL 是节点层号按概率加权；随机树平均 O(log n)，退化链最坏 O(n)。', 'A BST’s successful ASL weights node levels by probability; a random tree averages O(log n), while a degenerate chain is O(n).'],
          ['哈希没有脱离装载因子和冲突策略的通用固定 ASL；链地址与开放定址的聚集行为不同。', 'Hashing has no universal fixed ASL independent of load factor and collision policy; chaining and open addressing cluster differently.'],
          ['比较两个 ASL 前必须先固定 n、概率和比较口径，否则数字不可比。', 'Before comparing two ASLs, fix n, probabilities and comparison conventions; otherwise the numbers are not comparable.'],
        ],
      },
    ],
    comparison: {
      title: ['四种查找方法：成功与失败分开看', 'Four search methods: success and failure separately'],
      columns: [
        ['方法', 'Method'],
        ['成功 ASL（等概率基准）', 'Successful ASL (equal-probability baseline)'],
        ['失败 ASL', 'Unsuccessful ASL'],
        ['关键影响因素', 'Main factors'],
      ],
      rows: [
        [
          ['顺序查找', 'Sequential search'],
          ['(n+1)/2（从首项逐项扫描）', '(n+1)/2 when scanning from the first item'],
          ['无序且无哨兵通常为 n 次；有序可提前停止时随区间变化', 'Usually n without a sentinel in an unordered table; varies by gap when an ordered scan stops early'],
          ['元素位置、查找概率、能否提前停止', 'Positions, query probabilities, early stopping'],
        ],
        [
          ['二分查找', 'Binary search'],
          ['由判定树内部节点决定；本例 17/7 ≈ 2.43', 'Fixed by internal decision-tree nodes; 17/7 ≈ 2.43 here'],
          ['由外部节点决定；本例 3', 'Fixed by external nodes; 3 here'],
          ['判定树形状、mid 约定、区间概率', 'Decision-tree shape, mid convention, gap probabilities'],
        ],
        [
          ['二叉搜索树', 'Binary search tree'],
          ['节点层号按概率加权；平均 O(log n)，最坏 O(n)', 'Probability-weighted node levels; O(log n) average, O(n) worst'],
          ['外部节点加权；随树形显著变化', 'Weighted external nodes; varies strongly with shape'],
          ['插入顺序、树高、查找概率', 'Insertion order, height, query probabilities'],
        ],
        [
          ['哈希查找', 'Hashing'],
          ['期望接近常数；随 α 与冲突策略变化', 'Expected near constant; varies with α and collision policy'],
          ['同样随 α、冲突策略变化', 'Also varies with α and collision policy'],
          ['α = n/m、哈希均匀性、链地址/开放定址', 'α = n/m, hash uniformity, chaining/open addressing'],
        ],
      ],
    },
    takeaway: ['ASL 是把比较次数按概率加权的期望；二分判定树的内部节点层号给出成功比较次数，外部区间给出失败比较次数。不要用“O(n)”或一个固定数字概括所有查找方法。', 'ASL is a probability-weighted expectation of comparison counts. In a binary decision tree, internal-node levels give successful comparison counts and external gaps give failing ones. Do not replace every method with O(n) or one fixed number.'],
  },
  {
    id: 'indexed-search',
    topicId: 'indexed-search',
    title: ['分块查找（索引顺序查找）', 'Block search (indexed sequential search)'],
    chapter: ['第 9 章 · 查找', 'Chapter 9 · Searching'],
    summary: [
      '分块查找把记录分成若干块，并为每块建立索引：块间按最大关键字有序，块内元素不要求有序。查找时先查索引确定目标可能所在的块，再在块内顺序扫描。它用少量索引换掉“全表有序”的维护成本，在顺序查找与二分查找之间取得折中。',
      'Block search divides records into blocks and indexes each block: blocks are ordered by their maximum key, while keys inside a block need not be ordered. A search first consults the index to choose a block, then scans that block sequentially. It trades a small index for avoiding globally sorted data, sitting between sequential and binary search.',
    ],
    diagram: 'block-search',
    definitions: [
      {
        term: ['分块查找（索引顺序查找）', 'Block search (indexed sequential search)'],
        text: ['先通过索引表把目标限制在一个块内，再在块内顺序查找的两阶段查找方法。', 'A two-stage method: use an index to restrict the target to one block, then search that block sequentially.'],
      },
      {
        term: ['索引表', 'Index table'],
        text: ['每个索引项描述一个块。至少需要该块的最大关键字、起始位置和块长；只存最大关键字无法直接进入数据块。', 'Each index entry describes one block, minimally its maximum key, start position and length; a maximum key alone cannot locate the block.'],
      },
      {
        term: ['块间有序', 'Blocks are ordered'],
        text: ['索引表中的最大关键字递增；在后一块关键字都大于前一块最大值的无重复设定下，可由 max 排除整块。', 'Maximum keys increase in the index. With distinct keys, every key in a later block exceeds the previous maximum, so one max can exclude a whole block.'],
      },
      {
        term: ['块内无序', 'Blocks need not be ordered'],
        text: ['同一块内的关键字可以任意排列。因此块内通常只能顺序查找；若要二分，必须另有块内有序这一前提。', 'Keys inside a block may appear in any order, so the block is normally scanned sequentially; binary search would require the extra precondition that the block itself is sorted.'],
      },
      {
        term: ['块大小 s 与块数 b', 'Block size s and block count b'],
        text: ['若共有 n 个记录、分成 b 块、每块约 s 个，则 n = bs。块大小决定索引长度与块内扫描长度的平衡。', 'For n records in b blocks of about s records, n = bs. Block size balances index length against in-block scan length.'],
      },
    ],
    sections: [
      {
        title: ['解决什么问题', 'What problem it solves'],
        body: [
          '顺序查找实现简单、更新便宜，但平均要扫半张表；二分查找只需 O(log n) 次比较，却要求全局有序，插入和删除往往要搬移大量记录。分块查找把“全局有序”降为“块间有序”：索引负责缩小范围，块内保留插入删除的局部灵活性。',
          'Sequential search is simple and cheap to update but scans about half the table on average. Binary search needs only O(log n) comparisons but requires global order, so insertions and deletions can move many records. Block search relaxes global order to block-level order: the index narrows the range while each block keeps local update flexibility.',
        ],
        points: [
          ['适合查询多、更新局部化，且愿意维护一张小索引的场景。', 'Useful when queries dominate, updates are local and a small index can be maintained.'],
          ['它不要求整张表有序，只要求能依据索引边界排除整块。', 'It does not require a globally sorted table, only index bounds that can exclude whole blocks.'],
          ['本质是“索引定位 + 块内顺序查找”的组合，不是平衡树或哈希表。', 'It combines index lookup with a sequential block scan; it is not a balanced tree or hash table.'],
        ],
      },
      {
        title: ['核心结构：块间有序，块内可乱序', 'Core structure: ordered blocks, unordered contents'],
        body: [
          '把 n 个记录分成 b 块，每块约 s 个；索引表保存每块的 max、start 和 length。块间约束是：索引中的 max 递增，后一块的所有关键字大于前一块的 max，当前块的所有关键字不超过本块的 max。块内不排序，所以同一块里可以出现 48、31、27、45、39 这样的顺序。',
          'Split n records into b blocks of about s records; the index stores each block’s max, start and length. Between blocks, max values increase, every key in a later block exceeds the previous max, and every key in the current block is at most its own max. Inside a block no order is required, so a block may read 48, 31, 27, 45, 39.',
        ],
        points: [
          ['块间必须能按 max 排除整块；块内不要求有序。', 'Block maxima must exclude whole blocks; block contents need not be ordered.'],
          ['索引项至少要能回答“这个块在哪里、有多长”，不能只存一个 max。', 'An index entry must say where the block starts and how long it is, not merely its max.'],
          ['块大小可以不等，但索引边界必须一致；分析时通常假设各块大小相近。', 'Blocks may be uneven, but bounds must stay consistent; analysis usually assumes similar sizes.'],
          ['若允许重复关键字，要额外约定等值记录归前块还是后块，否则 ≤ max 的边界有歧义。', 'If duplicates are allowed, define whether equal keys belong to the earlier or later block; otherwise the ≤ max boundary is ambiguous.'],
        ],
      },
      {
        title: ['查找过程：先用索引，再扫块内', 'Search: index first, then scan the block'],
        body: [
          '以 15 个记录、b = 3、s = 5 为例，三个索引 max 为 22、48、78。查找 45：索引顺序比较 45 > 22，跳过块 1；再比较 45 ≤ 48，锁定块 2。随后在块 2 中顺序比较 48、31、27、45，第 4 次命中。总比较次数为 2 + 4 = 6。',
          'Take 15 records with b = 3 and s = 5; index maxima are 22, 48 and 78. To find 45, compare the index sequentially: 45 > 22 skips block 1, then 45 ≤ 48 selects block 2. Scan block 2 through 48, 31, 27 and 45, hitting on the fourth comparison. The total is 2 + 4 = 6 comparisons.',
        ],
        points: [
          ['先索引、后块内，两步都不能省；索引只负责选块，不负责确认命中。', 'Index first, block second; neither stage confirms the key alone.'],
          ['索引表本身若用顺序查找，选块成本随块号增加；若用二分，则按索引的判定树计算。', 'With a sequential index, block-selection cost grows with block number; with binary search, use the index decision tree.'],
          ['块内通常必须顺序查找；块内无序时不能直接二分。', 'The block is normally scanned sequentially; binary search is invalid when its contents are unordered.'],
          ['查找 46 时同样锁定块 2，但扫完 5 个仍未命中，成本为 2 + 5 = 7。', 'Searching 46 also selects block 2, scans all five without a hit and costs 2 + 5 = 7.'],
        ],
      },
      {
        title: ['效率与块大小', 'Cost and block size'],
        body: [
          '在“索引顺序查找、块内顺序查找、各块和各位置等概率”的假设下，索引平均比较 (b+1)/2 次，块内成功平均 (s+1)/2 次，总成功 ASL ≈ (b+s)/2 + 1。由 n = bs，当 b ≈ s ≈ √n 时该式最小，约为 √n + 1 次。',
          'Assume a sequential index, a sequential block scan, and equal probabilities for blocks and positions. The index averages (b+1)/2 comparisons and a successful block scan averages (s+1)/2, giving successful ASL ≈ (b+s)/2 + 1. With n = bs, this is minimized near b ≈ s ≈ √n, about √n + 1 comparisons.',
        ],
        formula: 'ASL_succ ≈ (b+1)/2 + (s+1)/2 = (b+s)/2 + 1;\nb ≈ s ≈ √n ⇒ ASL_succ ≈ √n + 1',
        points: [
          ['这是特定假设下的平均成功成本，不是最坏情况；失败还要加边界判断，并取决于目标落在哪一块。', 'This is average successful cost under stated assumptions, not a worst case; failure adds boundary checks and depends on the selected block.'],
          ['索引改用二分：选块降为 O(log b)，总成本约为 O(log b + s)，最优块大小不再简单等于 √n。', 'With a binary index, block selection is O(log b) and total cost is about O(log b + s); the optimal block size is no longer simply √n.'],
          ['块太大，块内扫描长；块太小，索引长且维护项更多。块大小是两边成本的平衡点。', 'Large blocks lengthen scans; small blocks lengthen and complicate the index. Block size balances the two.'],
          ['若把块内也排序并二分，前提和成本已经变成另一种结构，不能继续套用分块查找公式。', 'If blocks are also sorted and binary-searched, the preconditions and costs describe another structure; do not reuse the block-search formula.'],
        ],
      },
      {
        title: ['适用场景与易错点', 'Use cases and pitfalls'],
        body: [
          '分块查找适合“块间能排序、块内可乱序”的折中。它的优势是更新通常只影响一个数据块和一条索引项；代价是插入、删除后要维护 max、start 和 length，块溢出时要分裂，块过空时要合并或重建索引。它不是“免维护的二分查找”。',
          'Block search fits the compromise “blocks ordered, contents unordered”. An update usually touches one block and one index entry; the price is maintaining max, start and length, splitting an overfull block, and merging or rebuilding when a block becomes too empty. It is not maintenance-free binary search.',
        ],
        points: [
          ['块间有序不等于块内有序：前者用于选块，后者才决定块内能否二分。', 'Ordered blocks do not imply ordered contents: the former selects a block, the latter enables binary search inside it.'],
          ['顺序索引要找到第一个 max ≥ target 的块，不能只看第一个索引项就下结论。', 'A sequential index must find the first max ≥ target; never decide from the first entry alone.'],
          ['索引 max 必须随块内最大关键字更新，否则会选错块。', 'The index max must follow the block’s actual maximum; otherwise the wrong block is selected.'],
          ['高频更新场景要评估索引维护成本；分块查找用维护换查询，不是无条件优于二分。', 'Under frequent updates, account for index maintenance; block search trades maintenance for queries and is not unconditionally better than binary search.'],
        ],
      },
    ],
    comparison: {
      title: ['分块查找与顺序、二分的关系', 'Block search beside sequential and binary search'],
      columns: [
        ['方法', 'Method'],
        ['前置条件', 'Precondition'],
        ['典型成功代价', 'Typical successful cost'],
        ['更新代价', 'Update cost'],
      ],
      rows: [
        [
          ['顺序查找', 'Sequential search'],
          ['无', 'None'],
          ['O(n)；等概率约 (n+1)/2', 'O(n); about (n+1)/2 with equal probabilities'],
          ['尾部插入/删除简单', 'Cheap append/delete at the end'],
        ],
        [
          ['二分查找', 'Binary search'],
          ['全局有序', 'Globally sorted'],
          ['O(log n)', 'O(log n)'],
          ['维持全局有序，常需搬移或重构', 'Maintain global order, often shifting or rebuilding'],
        ],
        [
          ['分块查找', 'Block search'],
          ['块间按 max 有序，块内可无序', 'Block maxima ordered; contents may be unordered'],
          ['顺序索引约 O(√n)；二分索引 O(log b + s)', 'About O(√n) with a sequential index; O(log b + s) with a binary index'],
          ['只改目标块与索引，可能分裂/合并', 'Touch the target block and index; may split or merge'],
        ],
      ],
    },
    takeaway: ['分块查找的关键不是“分成块”，而是“块间能排除、块内能顺序扫”。顺序索引下块大小接近 √n 时平均成本约 √n；索引或块内改用二分后，假设与公式都必须重算。', 'The point of block search is not merely splitting data, but excluding blocks by bounds and scanning within one. With a sequential index, blocks near √n give about √n comparisons; changing either stage to binary search changes both assumptions and formulas.'],
  },
  {
    id: 'circular-queue',
    topicId: 'circular-queue',
    title: ['循环队列', 'Circular queue'],
    chapter: ['第 3 章 · 栈和队列', 'Chapter 3 · Stacks and queues'],
    summary: [
      '循环队列把顺序队列的数组看成首尾相接的环：front 和 rear 到达数组末端后回到 0。它复用出队留下的空位，解决普通顺序队列“前面空着、后面却进不来”的假溢出。',
      'A circular queue treats the array as a ring: front and rear wrap from the last index back to 0. It reuses slots freed by dequeues and removes the false overflow of an ordinary array queue.',
    ],
    diagram: 'circular-queue',
    definitions: [
      {
        term: ['循环队列', 'Circular queue'],
        text: ['用连续数组存储队列，并让 front、rear 按 capacity 取模回绕的顺序队列。逻辑上是环，物理上仍是一段下标为 0..capacity-1 的数组。', 'An array queue whose front and rear wrap modulo capacity. It is logically a ring but physically a contiguous array indexed 0..capacity-1.'],
      },
      {
        term: ['队首指针 front', 'Front pointer'],
        text: ['指向当前队首元素的下标。出队时先取走该元素，再执行 front = (front + 1) % capacity。', 'The index of the current head element. Dequeue removes it and then performs front = (front + 1) % capacity.'],
      },
      {
        term: ['队尾指针 rear', 'Rear pointer'],
        text: ['指向下一次入队位置的下标，不是当前最后一个元素。入队时先写入 rear 所指位置，再让 rear 后移取模。', 'The index of the next insertion slot, not the current last element. Enqueue writes at rear and then advances it modulo capacity.'],
      },
      {
        term: ['假溢出', 'False overflow'],
        text: ['rear 已到达数组末端，前面虽然还有出队留下的空位，普通顺序队列却无法继续入队。它不是数组真的没有空间，而是 rear 不能回头。', 'Rear has reached the array end while earlier dequeues left free slots; an ordinary array queue still cannot enqueue. The array is not truly full; rear simply cannot rewind.'],
      },
      {
        term: ['牺牲一个存储单元', 'Sacrifice one slot'],
        text: ['本页统一采用的实现约定：保留一个空位来区分队空与队满，因此 capacity 个数组格最多存放 capacity-1 个元素。', 'The convention used throughout this page: reserve one empty slot to distinguish empty from full, so capacity cells hold at most capacity-1 elements.'],
      },
    ],
    sections: [
      {
        title: ['普通顺序队列为什么会出现假溢出', 'Why an ordinary array queue has false overflow'],
        body: [
          '普通顺序队列用一段连续数组和 front、rear 两个下标维护有效区间。入队把元素写到 rear，再让 rear 后移；出队只把 front 后移，通常不搬移剩余元素。于是数组前部会逐渐积累出队留下的空位。',
          'An ordinary array queue keeps a live interval with two indices. Enqueue writes at rear and advances it; dequeue advances front and usually does not shift the remaining elements. Free slots therefore accumulate at the front of the array.',
        ],
        points: [
          ['连续入队：rear 不断向右移动，直到数组末端。', 'Repeated enqueues move rear right until it reaches the end.'],
          ['连续出队：front 向右移动，前面的格子空出来，但 rear 不会回头。', 'Repeated dequeues move front right; earlier cells become free, but rear never rewinds.'],
          ['rear 到达末端后，即使 front > 0，普通队列也会拒绝入队，这就是假溢出。', 'Once rear reaches the end, an ordinary queue rejects enqueue even when front > 0: false overflow.'],
          ['只靠搬移全部元素可以腾出尾部空间，但每次出队都可能要 O(n) 搬移，代价高。', 'Shifting all elements can free tail space, but every dequeue could cost O(n) moves.'],
          ['如果还没看过普通顺序队列的 front/rear 分工，先读「栈与队列的存储结构」的顺序队列部分；本页在此基础上解决回绕、判空判满与计数。', 'If front/rear in an ordinary array queue is unfamiliar, read the array-queue part of “Storage structures for stacks and queues” first; this page then covers wrapping, empty/full tests and counts.'],
        ],
      },
      {
        title: ['循环队列：让下标从末尾回到开头', 'Circular queue: wrap the indices'],
        body: [
          '循环队列不搬元素，而是把数组下标按 capacity 取模。rear 在最后一个位置再后移时回到 0；front 出队到最后一个位置再后移时也回到 0。逻辑上 0 号格接在 capacity-1 后面，形成一个环。',
          'A circular queue moves no elements; it reduces indices modulo capacity. Advancing rear past the last slot returns to 0, and advancing front past the last slot also returns to 0. Logically, slot 0 follows slot capacity-1, forming a ring.',
        ],
        points: [
          ['入队：先写 Q[rear] = x，再执行 rear = (rear + 1) % capacity。', 'Enqueue: write Q[rear] = x, then rear = (rear + 1) % capacity.'],
          ['出队：先取 x = Q[front]，再执行 front = (front + 1) % capacity。', 'Dequeue: read x = Q[front], then front = (front + 1) % capacity.'],
          ['取模把“越界”变成“回到 0”，所以数组空间可以反复复用。', 'Modulo turns “past the end” into “back to 0”, so the array is reused indefinitely.'],
          ['front 和 rear 都只增不减（在模意义下），移动方向相同。', 'Both front and rear only advance, in the modular sense, and move in the same direction.'],
        ],
        formula: 'rear = (rear + 1) % capacity\nfront = (front + 1) % capacity',
      },
      {
        title: ['队空、队满与元素个数', 'Empty, full and element count'],
        body: [
          '如果只用 front 和 rear，循环队列会遇到“front == rear 既可能是空，也可能是满”的歧义。本页统一采用牺牲一个存储单元的约定：rear 所指位置永远空着，用来区分这两种状态。',
          'With only front and rear, front == rear could mean empty or full. This page consistently sacrifices one slot: the slot at rear stays empty, which disambiguates the two states.',
        ],
        points: [
          ['队空：front == rear，此时有效元素个数为 0。', 'Empty: front == rear, with zero live elements.'],
          ['队满：(rear + 1) % capacity == front，此时还有一个格子空着。', 'Full: (rear + 1) % capacity == front; one cell remains unused.'],
          ['元素个数：count = (rear - front + capacity) % capacity。', 'Element count: count = (rear - front + capacity) % capacity.'],
          ['这里的 count 是由 front、rear 算出的元素个数，不是额外保存的计数器字段；额外 count 字段的实现见下一节。', 'Here count is derived from front and rear; it is not an extra counter field. The separate count-field implementation is described in the next section.'],
          ['实际可存元素上限是 capacity - 1，不是 capacity。', 'The usable capacity is capacity - 1, not capacity.'],
          ['出队后 front 后移，空位出现在 front 原来所在的位置，而不是 rear 的位置。', 'After dequeue, front advances and the freed slot is where front used to be, not where rear is.'],
        ],
        formula: 'front == rear\n(rear + 1) % capacity == front\ncount = (rear - front + capacity) % capacity',
      },
      {
        title: ['容量 6 的连续状态推演', 'A capacity-6 walkthrough'],
        body: [
          '取 capacity = 6，数组下标 0..5，最多存 5 个元素。下面的四张状态图与右侧公式一一对应；每一步都同时检查 front、rear、有效元素和空位，避免“指针位置与数量公式打架”。',
          'Take capacity = 6 with indices 0..5 and at most five elements. The four state cards match the formulas exactly; every step checks front, rear, live elements and free slots together.',
        ],
        points: [
          ['① 初始化：front = rear = 0，count = 0，队列为空。', '1. Initialise: front = rear = 0, count = 0, empty.'],
          ['② 入队 A、B、C、D、E：占用 0..4，rear = 5，count = 5，队满。', '2. Enqueue A–E: slots 0..4 used, rear = 5, count = 5, full.'],
          ['③ 出队 A：front = 1，0 号格空出，rear 仍为 5，count = 4。', '3. Dequeue A: front = 1, slot 0 becomes free, rear stays 5, count = 4.'],
          ['④ 入队 F：写到 5 号格，rear = (5 + 1) % 6 = 0，队列再次满；再出队 B：front = 2，count = 4。', '4. Enqueue F into slot 5, rear = (5 + 1) % 6 = 0, full again; dequeue B sets front = 2 and count = 4.'],
          ['④ 的最终状态：C、D、E、F 在 2..5，0、1 空闲，rear 指向下一次可写的 0 号格。', 'Final state of 4: C, D, E and F occupy 2..5; 0 and 1 are free; rear points at the next writable slot 0.'],
        ],
        formula: 'capacity = 6\nusable = capacity - 1 = 5\n② count = (5 - 0 + 6) % 6 = 5\n③ count = (5 - 1 + 6) % 6 = 4\n④ count = (0 - 2 + 6) % 6 = 4',
      },
      {
        title: ['另一种实现：用 count 计数器', 'Another implementation: a count field'],
        body: [
          '另一种常见实现不牺牲空位，而是额外保存元素个数 count。此时 count == 0 表示空，count == capacity 表示满；入队和出队都要同步维护 count。它可以使用全部 capacity 个格子，但每个状态多一个计数器字段。',
          'Another common implementation sacrifices no slot and stores count instead. Then count == 0 means empty and count == capacity means full; enqueue and dequeue update count. It uses all capacity cells but carries one extra counter.',
        ],
        points: [
          ['两种约定都能正确工作，但不能把“牺牲一个单元”的判满公式套到 count 实现上。', 'Both conventions work, but never apply the sacrifice-one-slot full test to a count-based queue.'],
          ['本页所有图示、公式和示例都使用“牺牲一个单元”的约定。', 'Every diagram, formula and example on this page uses the sacrifice-one-slot convention.'],
          ['若题目给出 count，先看它是否还同时用 rear 空位判满；两套规则混用最容易出现差一错误。', 'If count is given, check whether a reserved rear slot is also used; mixing both rules is the usual source of off-by-one errors.'],
        ],
      },
    ],
    comparison: {
      title: ['普通顺序队列与循环队列', 'Ordinary array queue vs circular queue'],
      columns: [
        ['比较项', 'Aspect'],
        ['普通顺序队列', 'Ordinary array queue'],
        ['循环队列（牺牲 1 格）', 'Circular queue (one slot reserved)'],
      ],
      rows: [
        [
          ['rear 的移动', 'Rear movement'],
          ['rear = rear + 1，到数组末端停止', 'rear = rear + 1; stops at the array end'],
          ['rear = (rear + 1) % capacity', 'rear = (rear + 1) % capacity'],
        ],
        [
          ['空间复用', 'Space reuse'],
          ['前面空位不能直接再用', 'Earlier free slots cannot be reused directly'],
          ['整个数组循环复用', 'The whole array is reused cyclically'],
        ],
        [
          ['队空', 'Empty'],
          ['front == rear', 'front == rear'],
          ['front == rear', 'front == rear'],
        ],
        [
          ['队满/不可入队', 'Full / cannot enqueue'],
          ['rear 到达末端（或额外 count）', 'rear reaches the end (or an extra count is used)'],
          ['(rear + 1) % capacity == front', '(rear + 1) % capacity == front'],
        ],
        [
          ['元素个数', 'Element count'],
          ['rear - front（未回绕时）', 'rear - front (before any wrap)'],
          ['(rear - front + capacity) % capacity', '(rear - front + capacity) % capacity'],
        ],
        [
          ['容量上限', 'Capacity limit'],
          ['capacity', 'capacity'],
          ['capacity - 1', 'capacity - 1'],
        ],
      ],
    },
    takeaway: ['循环队列用取模让 rear 和 front 回绕，用“牺牲一个空位”区分队空与队满。先确认 front 指队首、rear 指下一次入队，再使用同一套公式；不要把 count 实现和牺牲单元实现混在一起。', 'A circular queue wraps front and rear modulo capacity and reserves one slot to distinguish empty from full. Confirm that front is the head and rear is the next insertion slot, then use one consistent formula set; never mix count-based and reserved-slot conventions.'],
  },
  {
    id: 'stack-queue-storage',
    topicId: 'stack-queue-storage',
    title: ['栈与队列的存储结构', 'Storage structures for stacks and queues'],
    chapter: ['第 3 章 · 栈和队列', 'Chapter 3 · Stacks and queues'],
    summary: [
      '栈和队列的逻辑结构分别是后进先出与先进先出；物理上都可以用连续数组或链表实现。顺序栈靠 top 标记栈顶，链栈在表头插入删除；顺序队列靠 front、rear 标记有效区间，链式队列靠头尾指针维护链表。',
      'Stacks are LIFO and queues are FIFO at the logical level; either can be stored in a contiguous array or a linked list. An array stack uses top, a linked stack inserts and removes at the head; an array queue uses front and rear, while a linked queue maintains head and tail pointers.',
    ],
    diagram: 'stack-queue-storage',
    definitions: [
      {
        term: ['顺序栈', 'Array stack'],
        text: ['用连续数组存放栈元素，并用一个整数 top 记录栈顶下标的栈。top = -1 表示空栈。', 'A stack stored in a contiguous array with an integer top. top = -1 means empty.'],
      },
      {
        term: ['栈顶指针 top', 'Top index'],
        text: ['在顺序栈中指向当前栈顶元素；入栈先 ++top 再写入，出栈先读取再 top--。它不指向“下一个空位”。', 'In an array stack, top indexes the current top element. Push increments top before writing; pop reads before decrementing. It does not point at the next free slot.'],
      },
      {
        term: ['链栈', 'Linked stack'],
        text: ['用节点和 next 指针存储栈元素，top 指向首节点；入栈在表头插入，出栈删除首节点。', 'A stack of nodes linked by next. top points at the first node; push inserts at the head and pop removes the head.'],
      },
      {
        term: ['顺序队列', 'Array queue'],
        text: ['用连续数组存放队列，front 指向队首元素，rear 指向下一次入队位置。普通数组队列的 rear 不回绕，因此会出现假溢出。', 'A queue stored in a contiguous array, with front at the head and rear at the next insertion slot. In an ordinary array queue rear never wraps, so false overflow can occur.'],
      },
      {
        term: ['链式队列', 'Linked queue'],
        text: ['用节点和 next 指针存储队列。本页统一采用带头结点的约定：front 指向头结点，rear 指向最后一个数据结点。', 'A queue stored as linked nodes. This page consistently uses a headed queue: front points at the head node and rear at the last data node.'],
      },
      {
        term: ['头结点', 'Head node'],
        text: ['链式队列中不保存有效数据的哨兵节点。它让空队列与非空队列的入队、出队代码更统一。', 'A sentinel node in a linked queue that stores no payload. It keeps enqueue and dequeue code uniform for empty and non-empty queues.'],
      },
    ],
    sections: [
      {
        title: ['先分清逻辑结构与存储结构', 'Separate the logical structure from the layout'],
        body: [
          '栈和队列首先是操作受限的线性表：栈只允许在栈顶插入和删除，队列只允许在队尾插入、队首删除。这个 LIFO / FIFO 契约不依赖数组或链表。数组和链表只是两种物理实现，决定容量、指针和空满判断怎么写。',
          'Stacks and queues are linear lists with restricted operations: a stack inserts and removes only at its top, while a queue inserts at the rear and removes at the front. This LIFO/FIFO contract does not depend on arrays or links. Arrays and linked nodes are physical implementations that determine capacity, pointers and empty/full tests.',
        ],
        points: [
          ['先看「栈的定义与实现」「队列的定义与实现」中的 push/pop、入队/出队，再看本页的物理存储与指针。', 'Start with push/pop and enqueue/dequeue in “Stack definition and implementation” and “Queue definition and implementation”, then return to this page for physical storage and pointers.'],
          ['顺序存储：元素在连续内存中，靠下标访问；容量通常固定。', 'Sequential storage: contiguous memory and index access; capacity is usually fixed.'],
          ['链式存储：节点可以分散，靠 next 指针连接；容量受内存限制。', 'Linked storage: nodes may be scattered and connected by next; capacity is memory-bound.'],
          ['同一组栈操作可以有顺序栈和链栈两种实现，复杂度都可以是 O(1)。', 'The same stack operations can be implemented by an array or a linked list, both O(1).'],
          ['同一组队列操作可以用普通数组、循环数组或链表实现，差别在回绕与指针维护。', 'Queue operations can use an ordinary array, a circular array or a linked list; they differ in wrapping and pointer maintenance.'],
        ],
      },
      {
        title: ['顺序栈：top 指向栈顶元素', 'Array stack: top indexes the top element'],
        body: [
          '顺序栈用一段连续数组 S[0..MAXSIZE-1] 和一个整数 top。约定 top = -1 表示空栈；每入栈一个元素，先执行 ++top，再把新元素写入 S[top]；出栈先取 S[top]，再执行 top--。因此 top 永远指向当前栈顶元素，而不是下一个空位。',
          'An array stack uses S[0..MAXSIZE-1] and an integer top. top = -1 means empty. Push increments top and then writes S[top]; pop reads S[top] and then decrements top. Therefore top always indexes the current top element, not the next free slot.',
        ],
        points: [
          ['空栈：top == -1；此时不能出栈。', 'Empty: top == -1; pop is invalid.'],
          ['满栈：top == MAXSIZE - 1；此时不能入栈，除非扩容或拒绝。', 'Full: top == MAXSIZE - 1; push is invalid unless the array grows or the operation is rejected.'],
          ['入栈：if (top < MAXSIZE - 1) S[++top] = x;', 'Push: if (top < MAXSIZE - 1) S[++top] = x;'],
          ['出栈：if (top >= 0) x = S[top--];', 'Pop: if (top >= 0) x = S[top--];'],
          ['只维护一个整数，空间开销小；但容量固定，扩容要重新分配并搬移元素。', 'Only one integer is maintained, so overhead is small; capacity is fixed, and growth requires reallocation and copying.'],
        ],
        formula: 'top == -1（空）\ntop == MAXSIZE - 1（满）\n入栈 ++top; 出栈 top--',
        formulaEn: 'top == -1 (empty)\ntop == MAXSIZE - 1 (full)\npush ++top; pop top--',
      },
      {
        title: ['链栈：在表头完成 push 与 pop', 'Linked stack: push and pop at the head'],
        body: [
          '链栈把栈元素放在节点里，每个节点保存 data 和 next，top 指向首节点。入栈新建节点，让新节点的 next 指向原 top，再让 top 指向新节点；出栈保存首节点，让 top 指向 next，再释放原首节点。所有操作只改表头附近的常数个指针。',
          'A linked stack stores each element in a node with data and next; top points at the first node. Push creates a node, links its next to the old top, and makes top point at it. Pop saves the first node, moves top to next, and frees the old head. Only a constant number of head pointers change.',
        ],
        points: [
          ['空栈：top == NULL。', 'Empty: top == NULL.'],
          ['入栈：new→next = top; top = new。', 'Push: new→next = top; top = new.'],
          ['出栈：p = top; top = top→next; free(p)。', 'Pop: p = top; top = top→next; free(p).'],
          ['节点不要求连续存储，容量不受预先分配限制；每个节点多一个 next 指针。', 'Nodes need not be contiguous, and capacity is not fixed in advance; each node carries one extra next pointer.'],
          ['push/pop 都是 O(1)，但频繁 malloc/free 的常数成本通常高于顺序栈。', 'Push and pop are O(1), but frequent malloc/free usually has a higher constant cost than an array stack.'],
        ],
      },
      {
        title: ['顺序队列与假溢出', 'Array queue and false overflow'],
        body: [
          '顺序队列用 front 指向队首元素、rear 指向下一次入队位置。入队写 Q[rear] 后让 rear 后移，出队取 Q[front] 后让 front 后移。普通数组队列的 rear 不会回到 0，所以出队留下的前部空位无法直接复用。',
          'An array queue uses front at the head and rear at the next insertion slot. Enqueue writes Q[rear] and advances rear; dequeue reads Q[front] and advances front. In an ordinary array queue rear never returns to 0, so earlier slots freed by dequeues cannot be reused directly.',
        ],
        points: [
          ['空队列：front == rear（在未回绕的普通队列中）。', 'Empty: front == rear in an ordinary, non-wrapping queue.'],
          ['入队：Q[rear] = x; rear++；出队：x = Q[front]; front++。', 'Enqueue: Q[rear] = x; rear++. Dequeue: x = Q[front]; front++.'],
          ['rear 到达数组末端后，即使 front > 0，也不能再入队：假溢出。', 'Once rear reaches the end, enqueue is rejected even when front > 0: false overflow.'],
          ['把数组首尾相接、让 front 和 rear 取模回绕，就是循环队列；判空判满与元素个数见「循环队列」专题。', 'Connecting the ends and wrapping front and rear modulo capacity gives a circular queue; see the circular-queue page for empty/full tests and counts.'],
        ],
      },
      {
        title: ['链式队列：带头结点，front 与 rear 分工', 'Linked queue: headed, with front and rear roles'],
        body: [
          '链式队列用节点保存元素。本页统一采用带头结点的约定：front 指向不保存数据的头结点，rear 指向最后一个数据结点。空队列时 front == rear == 头结点，且头结点的 next == NULL。入队在 rear 之后接新节点并让 rear 指向它；出队删除头结点的下一个节点；如果删除的是最后一个数据结点，还要让 rear 回到头结点。',
          'A linked queue stores elements in nodes. This page consistently uses a headed queue: front points at a head node that stores no payload, and rear points at the last data node. When empty, front == rear == head and head.next == NULL. Enqueue links a new node after rear and advances rear; dequeue removes head.next; if that was the last data node, rear must return to the head.',
        ],
        points: [
          ['空队列：front == rear == 头结点，头结点 next == NULL。', 'Empty: front == rear == head, and head.next == NULL.'],
          ['入队：rear→next = new; rear = new; new→next = NULL。', 'Enqueue: rear→next = new; rear = new; new→next = NULL.'],
          ['出队：p = front→next; front→next = p→next; 若 p == rear，则 rear = front。', 'Dequeue: p = front→next; front→next = p→next; if p == rear, set rear = front.'],
          ['删除最后一个数据结点后，队列为空，rear 必须指回头结点，不能悬空。', 'After removing the last data node, the queue is empty and rear must point back at the head rather than dangle.'],
          ['若采用不带头结点的约定，空队列和删除唯一元素要单独处理 front 与 rear；本页不混用两套约定。', 'Without a head node, empty queues and deleting the only element need separate front/rear handling; this page does not mix conventions.'],
        ],
      },
      {
        title: ['四种结构怎么选', 'Choosing among the four'],
        body: [
          '选择存储结构时看三件事：容量是否固定、是否频繁扩容、是否需要随机访问。顺序栈和循环队列的常数成本低、缓存友好，适合容量可预估的场景；链栈和链式队列按需分配节点，适合容量变化大或需要稳定地址的场景，但每个节点多一个指针，且分配释放有额外开销。',
          'Choose by three questions: is capacity fixed, will it grow often, and is random access needed? Array stacks and circular queues have low constant costs and good locality, fitting predictable capacities. Linked stacks and queues allocate on demand, fitting highly variable sizes or stable node addresses, at the cost of one pointer per node and allocation overhead.',
        ],
        points: [
          ['栈：容量固定、追求常数成本选顺序栈；容量变化大选链栈。', 'Stack: choose an array stack for fixed capacity and low constants; choose a linked stack for large capacity variation.'],
          ['队列：需要复用数组空间选循环队列；需要动态增长选链式队列。', 'Queue: choose a circular queue to reuse array space; choose a linked queue for dynamic growth.'],
          ['链式结构删除节点要防止悬空指针；顺序结构入栈/入队要防止越界。', 'Linked structures must avoid dangling pointers on deletion; array structures must avoid out-of-bounds writes.'],
          ['复杂度都是 O(1) 不等于实际速度相同：缓存、分配器和指针跳转都会影响常数。', 'O(1) complexity does not imply equal speed: cache behaviour, allocators and pointer chasing affect constants.'],
        ],
      },
    ],
    comparison: {
      title: ['四种物理存储结构', 'Four physical storage layouts'],
      columns: [
        ['比较项', 'Aspect'],
        ['顺序栈', 'Array stack'],
        ['链栈', 'Linked stack'],
        ['顺序队列', 'Array queue'],
        ['链式队列', 'Linked queue'],
      ],
      rows: [
        [
          ['存储', 'Storage'],
          ['连续数组', 'Contiguous array'],
          ['离散节点 + next', 'Scattered nodes + next'],
          ['连续数组', 'Contiguous array'],
          ['离散节点 + next', 'Scattered nodes + next'],
        ],
        [
          ['关键指针', 'Key pointers'],
          ['top 指栈顶元素', 'top at the top element'],
          ['top 指首节点', 'top at the first node'],
          ['front 队首，rear 下一次入队', 'front at head, rear next slot'],
          ['front 头结点，rear 最后数据结点', 'front at head, rear at last data node'],
        ],
        [
          ['入操作', 'Insert'],
          ['++top 后写入', 'increment top, then write'],
          ['表头插入', 'insert at the head'],
          ['写 rear 后取模前进', 'write at rear, advance modulo'],
          ['rear 后接新节点', 'link a new node after rear'],
        ],
        [
          ['出操作', 'Remove'],
          ['读取后 top--', 'read, then decrement top'],
          ['删除首节点', 'remove the first node'],
          ['取 front 后取模前进', 'read front, advance modulo'],
          ['删除头结点的下一个节点', 'remove head.next'],
        ],
        [
          ['空条件', 'Empty test'],
          ['top == -1', 'top == -1'],
          ['top == NULL', 'top == NULL'],
          ['front == rear', 'front == rear'],
          ['front == rear == 头结点', 'front == rear == head'],
        ],
        [
          ['满/容量', 'Full / capacity'],
          ['top == MAXSIZE - 1', 'top == MAXSIZE - 1'],
          ['无固定上限，受内存限制', 'no fixed limit; memory-bound'],
          ['牺牲 1 格：(rear+1)%capacity == front', 'one slot reserved: (rear+1)%capacity == front'],
          ['无固定上限，受内存限制', 'no fixed limit; memory-bound'],
        ],
      ],
    },
    takeaway: ['先记逻辑契约，再记物理指针：顺序栈 top 指栈顶元素且空为 -1；链栈 top 指首节点；顺序队列 front 指队首、rear 指下一次入队；带头结点链式队列空时 front == rear == 头结点，删掉最后一个数据结点后 rear 要回到头结点。', 'Learn the contract first, then the physical pointers: an array stack has top at the top element and -1 for empty; a linked stack has top at the first node; an array queue has front at the head and rear at the next slot; a headed linked queue is empty when front == rear == head, and rear must return to the head after the last data node is removed.'],
  },
  {
    id: 'tree-storage',
    topicId: 'tree-basics',
    title: ['树的存储结构', 'Tree storage structures'],
    chapter: ['第 6 章 · 树和二叉树', 'Chapter 6 · Trees and binary trees'],
    summary: [
      '树是一种一对多的层次结构，存储时要同时记录“数据”和“关系”。双亲表示法存父下标，孩子表示法挂孩子链表，孩子兄弟表示法用 firstChild 与 nextSibling 两个指针把普通树写成二叉链表。',
      'A tree is a one-to-many hierarchy, so storage must record both data and relationships. Parent representation stores a parent index, child representation links each node’s children, and child-sibling representation uses firstChild and nextSibling to encode an ordinary tree as a binary linked structure.',
    ],
    diagram: 'tree-storage',
    definitions: [
      {
        term: ['双亲表示法', 'Parent representation'],
        text: ['用连续数组保存每个节点，并在每个元素中记录其双亲在数组中的下标；根的双亲记为 −1。', 'Store every node in a contiguous array and record its parent’s array index; the root’s parent is −1.'],
      },
      {
        term: ['孩子表示法', 'Child representation'],
        text: ['数组保存每个节点，另为每个节点建立一条孩子链表，按从左到右的顺序串起它的孩子。', 'An array stores the nodes, and each node owns a linked list of its children in left-to-right order.'],
      },
      {
        term: ['孩子兄弟表示法', 'Child-sibling representation'],
        text: ['每个节点只保留两个指针：firstChild 指向第一个孩子，nextSibling 指向下一个兄弟。', 'Each node keeps two pointers: firstChild to its first child and nextSibling to its next sibling.'],
      },
      {
        term: ['firstChild 与 nextSibling', 'firstChild and nextSibling'],
        text: ['firstChild 描述“向下”的第一个孩子；nextSibling 描述“向右”的同层兄弟。两者含义不同，不能混为父子关系。', 'firstChild goes down to the first child; nextSibling goes right to a same-level sibling. They encode different relations and must not be confused with parent-child links.'],
      },
      {
        term: ['二叉链表形式', 'Binary linked form'],
        text: ['节点含 data、左指针、右指针，正好对应二叉树的存储形状；把 firstChild 当左指针、nextSibling 当右指针，普通树就写成二叉树。', 'A node with data plus left and right pointers has exactly the shape of a binary tree. Treating firstChild as left and nextSibling as right turns an ordinary tree into a binary tree.'],
      },
    ],
    sections: [
      {
        title: ['先固定一棵示例树', 'Fix one example tree first'],
        body: [
          '本页三种表示法都使用同一棵树：A(B(E,F), C, D(G))。A 是根，B、C、D 是 A 的三个孩子，E、F 是 B 的孩子，G 是 D 的孩子，共 7 个节点。统一示例才能看出三种结构只是在记录同一组关系。',
          'All three layouts on this page use the same tree: A(B(E,F), C, D(G)). A is the root; B, C and D are A’s three children; E and F are B’s children; G is D’s child; there are 7 nodes. One shared example makes clear that the layouts only record the same relationships differently.',
        ],
        points: [
          ['节点数固定为 7，转换的是“关系怎么存”，不是树本身。', 'The node count stays 7; only the way relationships are stored changes.'],
          ['三种表示都不改变 A 是根、E/F 是 B 的孩子、G 是 D 的孩子这些事实。', 'All three preserve the facts that A is the root, E/F are B’s children and G is D’s child.'],
          ['若节点编号不统一，后面的数组下标和指针示例就无法互相对照。', 'Without one shared numbering, the array indices and pointer examples cannot be cross-checked.'],
        ],
      },
      {
        title: ['双亲表示法：一个 parent 整数', 'Parent representation: one parent integer'],
        body: [
          '把 A–G 依次放进下标 0–6 的数组。每个元素只额外保存 parent：A 的 parent 为 −1，B/C/D 的 parent 为 0，E/F 的 parent 为 1，G 的 parent 为 3。找某个节点的双亲只需一次下标访问。',
          'Place A-G at indices 0-6. Each slot stores only an extra parent value: A is −1, B/C/D are 0, E/F are 1 and G is 3. Finding a node’s parent is one array access.',
        ],
        points: [
          ['查找双亲：parent[i] 直接给出下标，O(1)。', 'Find parent: parent[i] directly returns the index, O(1).'],
          ['查找孩子：必须扫描整张表，找出所有 parent 等于 i 的节点，O(n)。', 'Find children: scan the whole table for every node whose parent equals i, O(n).'],
          ['结构简单，适合并查集、父指针树或“经常向上找、很少向下找”的场景。', 'Simple and suitable for union-find, parent-pointer trees, or workloads that walk upward far more often than downward.'],
          ['只有 parent 字段时，兄弟关系也要借助双亲再扫描孩子，不能直接得到。', 'With only parent fields, sibling relations also require going through the parent and scanning its children.'],
        ],
        formula: 'parent[0] = −1；parent[1..3] = 0；parent[4..5] = 1；parent[6] = 3',
      },
      {
        title: ['孩子表示法：数组 + 孩子链表', 'Child representation: array plus child lists'],
        body: [
          '仍用 A–G 的数组，但每个元素改存 firstChild。A 的孩子链是 B → C → D，B 的孩子链是 E → F，D 的孩子链是 G；C、E、F、G 没有孩子，链表为空。找某个节点的全部孩子时，直接从它的 firstChild 顺着 next 走完即可。',
          'Keep the A-G array but store firstChild instead. A’s child list is B → C → D, B’s is E → F and D’s is G; C, E, F and G have empty lists. To enumerate a node’s children, start at its firstChild and follow next.',
        ],
        points: [
          ['查找孩子：从 firstChild 出发走完整条链，O(1 + 孩子数)。', 'Find children: walk from firstChild through the list, O(1 + degree).'],
          ['查找双亲：孩子链只向下指，必须额外保存 parent，或扫描所有链表，O(n)。', 'Find parent: child links point downward only; store an extra parent or scan all lists in O(n).'],
          ['适合需要频繁枚举某个节点的孩子、且孩子数量差异较大的树。', 'Fits trees where enumerating one node’s children is frequent and degrees vary widely.'],
          ['每个孩子链表都要处理空链；实现时通常区分“无孩子”和“链表结束”。', 'Every child list needs an empty case; implementations distinguish “no children” from “end of list”.'],
        ],
        formula: 'A → B → C → D；B → E → F；D → G；其余 firstChild = NULL',
        formulaEn: 'A → B → C → D; B → E → F; D → G; all other firstChild = NULL',
      },
      {
        title: ['孩子兄弟表示法：两个指针写成二叉链表', 'Child-sibling representation: two pointers, binary shape'],
        body: [
          '每个节点只保留 firstChild 和 nextSibling。A 的 firstChild 是 B，B 的 nextSibling 是 C，C 的 nextSibling 是 D；B 的 firstChild 是 E，E 的 nextSibling 是 F；D 的 firstChild 是 G。这样每个节点恰好两个指针，和二叉树节点完全同形。',
          'Each node keeps only firstChild and nextSibling. A’s firstChild is B; B’s nextSibling is C; C’s nextSibling is D. B’s firstChild is E and E’s nextSibling is F; D’s firstChild is G. Every node then has exactly two pointers, the same shape as a binary-tree node.',
        ],
        points: [
          ['firstChild 指向第一个孩子；nextSibling 指向同层的下一个兄弟。', 'firstChild points to the first child; nextSibling points to the next same-level sibling.'],
          ['找第一个孩子和下一个兄弟都是 O(1)，但找双亲不直接，通常要额外保存 parent 或从根重新搜索。', 'The first child and next sibling are O(1), but a parent is not directly reachable; store an extra parent or search from the root.'],
          ['普通树因此可以套用二叉树的存储、遍历和转换方法。', 'An ordinary tree can therefore reuse binary-tree storage, traversal and conversion methods.'],
          ['关键不是“树变成了二叉树”，而是“用二叉链表解释树的孩子与兄弟关系”。', 'The point is not that the tree becomes a binary tree, but that a binary linked layout interprets child and sibling relations.'],
        ],
        formula: 'firstChild(A)=B；nextSibling(B)=C；nextSibling(C)=D；firstChild(B)=E；nextSibling(E)=F；firstChild(D)=G',
      },
      {
        title: ['三种表示怎么选', 'Choosing a representation'],
        body: [
          '选择依据是访问方向，而不是“哪种更高级”。经常找双亲，选双亲表示法；经常枚举孩子，选孩子表示法；既要孩子关系又要兄弟关系，或准备转换成二叉树，选孩子兄弟表示法。三种结构都能表示同一棵树，差别在查询代价和指针数量。',
          'Choose by access direction, not by which sounds more advanced. Frequent parent queries favor parent representation; frequent child enumeration favors child representation; needing both child and sibling relations, or preparing for binary-tree conversion, favors child-sibling representation. All three represent the same tree; they differ in query cost and pointer count.',
        ],
        points: [
          ['双亲表示法最省指针，但向下访问最弱。', 'Parent representation uses the fewest pointers but is weakest downward.'],
          ['孩子表示法的孩子链长度等于该节点的度；高度数节点会拉长链表。', 'In child representation a list length equals the node’s degree; high-degree nodes create long lists.'],
          ['孩子兄弟表示法把“第一个孩子”和“下一个兄弟”固定成两个指针，结构最规整。', 'Child-sibling representation fixes the first child and next sibling into two pointers, giving the most regular shape.'],
        ],
      },
    ],
    comparison: {
      title: ['三种树存储结构', 'Three tree storage layouts'],
      columns: [
        ['比较项', 'Aspect'],
        ['双亲表示法', 'Parent'],
        ['孩子表示法', 'Child'],
        ['孩子兄弟表示法', 'Child-sibling'],
      ],
      rows: [
        [
          ['每个节点存什么', 'Per-node fields'],
          ['data + parent 下标', 'data + parent index'],
          ['data + firstChild 链表', 'data + firstChild list'],
          ['data + firstChild + nextSibling', 'data + firstChild + nextSibling'],
        ],
        [
          ['查找双亲', 'Find parent'],
          ['O(1)', 'O(1)'],
          ['需额外 parent 或扫描 O(n)', 'extra parent or O(n) scan'],
          ['不直接，需额外结构', 'not direct; extra structure needed'],
        ],
        [
          ['查找孩子', 'Find children'],
          ['扫描全表 O(n)', 'scan table O(n)'],
          ['沿链表 O(1 + 度)', 'follow list O(1 + degree)'],
          ['第一个 O(1)，其余沿 nextSibling', 'first O(1), rest via nextSibling'],
        ],
        [
          ['查找下一个兄弟', 'Find next sibling'],
          ['经双亲再扫描', 'via parent, then scan'],
          ['经双亲再扫描', 'via parent, then scan'],
          ['nextSibling O(1)', 'nextSibling O(1)'],
        ],
        [
          ['典型用途', 'Typical use'],
          ['并查集、父指针树', 'union-find, parent-pointer trees'],
          ['一般树的孩子表', 'child table for a general tree'],
          ['树转二叉树、森林转换', 'tree-to-binary and forest conversion'],
        ],
      ],
    },
    takeaway: ['双亲表示法向上快、向下慢；孩子表示法向下快、向上慢；孩子兄弟表示法用 firstChild/nextSibling 两个指针把树写成二叉链表，是树与森林转换的基础。', 'Parent representation is fast upward and slow downward; child representation is fast downward and slow upward; child-sibling representation uses firstChild/nextSibling to encode a tree as a binary linked structure and underpins tree/forest conversion.'],
  },
  {
    id: 'forest-conversion',
    topicId: 'forest-conversion',
    title: ['树与森林的转换', 'Tree and forest conversion'],
    chapter: ['第 6 章 · 树和二叉树', 'Chapter 6 · Trees and binary trees'],
    summary: [
      '树、森林与二叉树可以相互转换，靠的是孩子兄弟表示法：第一个孩子变左孩子，下一个兄弟变右孩子。森林只是把多棵树的根也看成兄弟，沿右链串起来；逆向转换时，沿根层右链把二叉树拆回多棵树。',
      'Trees, forests and binary trees convert into one another through child-sibling links: the first child becomes the left child and the next sibling becomes the right child. A forest treats the roots of its trees as siblings along a right chain; reversing the conversion splits that root-level right chain back into separate trees.',
    ],
    diagram: 'forest-conversion',
    definitions: [
      {
        term: ['树转换为二叉树', 'Tree-to-binary conversion'],
        text: ['对每个节点，把第一个孩子放为左孩子，把下一个兄弟放为右孩子；得到的二叉树与原树节点数相同。', 'For every node, put its first child as the left child and its next sibling as the right child; the resulting binary tree has the same node count.'],
      },
      {
        term: ['森林转换为二叉树', 'Forest-to-binary conversion'],
        text: ['先按树转二叉树处理每一棵树，再把后一棵树的根作为前一棵树根的右孩子，形成根层右链。', 'Convert each tree first, then make the next tree’s root the right child of the previous tree’s root, forming a root-level right chain.'],
      },
      {
        term: ['二叉树还原为树或森林', 'Binary-to-tree/forest conversion'],
        text: ['若节点有左孩子，左孩子是它的第一个孩子；右孩子是它的下一个兄弟。根层右链上的每个节点分别是一棵新树的根。', 'If a node has a left child, that child is its first child; a right child is its next sibling. Every node on the root-level right chain is the root of a separate tree.'],
      },
      {
        term: ['根层右链', 'Root-level right chain'],
        text: ['从第一棵树的根出发，沿右指针依次串起各棵树的根。它表示“树根互为兄弟”，不是原树中的父子关系。', 'Starting at the first tree’s root, right pointers link the roots of the forest. It means the roots are siblings, not parent-child relations in the original tree.'],
      },
      {
        term: ['左孩子 / 右兄弟', 'Left child / right sibling'],
        text: ['转换后的左指针承载“第一个孩子”，右指针承载“下一个兄弟”。链接含义变了，节点本身和节点数没有变。', 'After conversion the left pointer carries “first child” and the right pointer carries “next sibling”. Link meanings change; nodes and node count do not.'],
      },
    ],
    sections: [
      {
        title: ['树 → 二叉树：左孩子、右兄弟', 'Tree → binary tree: left child, right sibling'],
        body: [
          '对 A(B(E,F), C, D(G)) 逐点套规则：A 的第一个孩子 B 成为 A 的左孩子；B 的下一个兄弟 C 成为 B 的右孩子；C 的下一个兄弟 D 成为 C 的右孩子。B 的第一个孩子 E 成为 B 的左孩子，E 的下一个兄弟 F 成为 E 的右孩子；D 的第一个孩子 G 成为 D 的左孩子。',
          'Apply the rule to A(B(E,F), C, D(G)): A’s first child B becomes A’s left child; B’s next sibling C becomes B’s right child; C’s next sibling D becomes C’s right child. B’s first child E becomes B’s left child and E’s next sibling F becomes E’s right child; D’s first child G becomes D’s left child.',
        ],
        points: [
          ['左孩子 = 原树的第一个孩子；右孩子 = 原树的下一个兄弟。', 'Left child = the original first child; right child = the original next sibling.'],
          ['转换后 B 的右孩子是 C，但 C 是 B 的兄弟，不是 B 的孩子。这是最重要的易错点。', 'After conversion C is B’s right child, but C is B’s sibling, not B’s child. This is the key trap.'],
          ['每个节点仍然只有一个左指针和一个右指针，所以节点数不变，树的高度可能改变。', 'Every node still has one left and one right pointer, so the node count is unchanged while the height may change.'],
          ['转换得到的二叉树没有“右孩子一定是孩子”的含义，必须回到孩子兄弟表示法解释。', 'The resulting binary tree does not mean every right child is a child; interpret it through child-sibling links.'],
        ],
        formula: 'left(v) = firstChild(v)；right(v) = nextSibling(v)',
      },
      {
        title: ['森林 → 二叉树：树根也当兄弟', 'Forest → binary tree: roots are siblings too'],
        body: [
          '以三棵树 A–G、H–I、J 为例。先分别转换每棵树：A–G 得到一棵二叉树，H–I 得到 H 左孩子 I，J 是单节点。再把 H 接到 A 的右指针上，把 J 接到 H 的右指针上，根层右链就是 A → H → J。整棵二叉树共 10 个节点。',
          'Take three trees A-G, H-I and J. Convert each first: A-G becomes one binary tree, H-I gives H with left child I, and J is a single node. Then attach H to A’s right pointer and J to H’s right pointer, producing the root-level right chain A → H → J. The whole binary tree has 10 nodes.',
        ],
        points: [
          ['森林的每一棵树先独立转换；树内兄弟仍走右指针。', 'Convert each tree independently; siblings inside a tree still use right pointers.'],
          ['不同树的根之间没有原树父子关系，只在转换结果里结成“根层兄弟链”。', 'Roots of different trees have no original parent-child relation; they become a root-level sibling chain only in the result.'],
          ['A 的右孩子 H 表示“下一棵树的根”，不是 A 的孩子。', 'A’s right child H means “the next tree’s root”, not A’s child.'],
          ['节点总数不变：7 + 2 + 1 = 10。', 'The total node count is unchanged: 7 + 2 + 1 = 10.'],
        ],
        formula: 'root(T1) → right → root(T2) → right → root(T3)',
      },
      {
        title: ['二叉树 → 森林：沿根层右链拆树', 'Binary tree → forest: split the root-level right chain'],
        body: [
          '逆向操作先看左指针：若节点有左孩子，左孩子就是它在原树中的第一个孩子；再沿左孩子的右链，依次得到同一父节点的其他孩子。接着看最外层：从二叉树根开始沿右指针走，根层右链上的每个节点都是一棵独立树的根，把它们断开即可。',
          'Reverse the process by reading left pointers first: a left child is the node’s first child in the original tree; following that child’s right chain yields the other children of the same parent. Then inspect the outermost chain: starting at the binary root, every node reached by right pointers is the root of a separate tree, so cut those links.',
        ],
        points: [
          ['左孩子：恢复为第一个孩子；左孩子的右链：恢复为同一父节点的其余孩子。', 'Left child: restore as the first child; its right chain: restore the remaining children of the same parent.'],
          ['根层右链：拆开，每个节点成为一棵新树的根；树内的右链不能乱拆。', 'Root-level right chain: split so each node becomes a new root; do not split right chains inside a tree.'],
          ['还原后 C、D 是 B 的兄弟，不是 B 的孩子；A、H、J 分别是三棵树的根。', 'After restoration C and D are B’s siblings, not B’s children; A, H and J are the roots of three trees.'],
          ['判断“根层”看当前节点是否还没有被分到任何一棵树；不要只看它有没有右孩子。', 'Decide “root level” by whether the node has not yet been assigned to a tree, not merely by whether it has a right child.'],
        ],
      },
      {
        title: ['遍历对应与易错点', 'Traversal correspondence and traps'],
        body: [
          '孩子兄弟转换保持节点数，却改变了链接含义，因此遍历名称也要对应到正确位置。树的先根遍历对应转换后二叉树的先序遍历；树的后根遍历对应这棵二叉树的中序遍历。森林的先序遍历、中序遍历也分别对应转换后二叉树的先序、中序。',
          'Child-sibling conversion preserves the node count but changes link meanings, so traversal names must map to the right positions. A tree’s preorder corresponds to the converted binary tree’s preorder, and a tree’s postorder corresponds to its inorder. A forest’s preorder and inorder likewise correspond to the converted binary tree’s preorder and inorder.',
        ],
        points: [
          ['转换只改链接解释，不改节点数；不要因为“变成二叉树”就新增或删除节点。', 'Conversion changes link interpretation, not the node count; do not add or remove nodes just because it “becomes a binary tree”.'],
          ['右孩子在本树内是兄弟，在根层是下一棵树的根，不能一律当作孩子。', 'A right child is a sibling inside a tree and the next tree’s root at root level; it is never automatically a child.'],
          ['二叉树还原时，根层右链要断开；树内右链保留为兄弟链。', 'When restoring, cut the root-level right chain but keep right chains inside a tree as sibling links.'],
          ['树的后根不是二叉树的“后序”；对应的是二叉树的中序。', 'A tree’s postorder is not the binary tree’s postorder; it corresponds to the binary tree’s inorder.'],
        ],
        formula: '树的先根 = 二叉树先序；树的后根 = 二叉树中序；森林先序/中序 = 二叉树先序/中序',
        formulaEn: 'tree preorder = binary-tree preorder; tree postorder = binary-tree inorder; forest preorder/inorder = binary-tree preorder/inorder',
      },
    ],
    comparison: {
      title: ['转换中的链接含义', 'Link meanings during conversion'],
      columns: [
        ['关系', 'Relation'],
        ['转换后在二叉树中的位置', 'Position in the binary tree'],
        ['还原时的处理', 'Reverse handling'],
      ],
      rows: [
        [
          ['第一个孩子', 'First child'],
          ['左孩子', 'Left child'],
          ['恢复为第一个孩子', 'restore as first child'],
        ],
        [
          ['下一个兄弟', 'Next sibling'],
          ['右孩子', 'Right child'],
          ['恢复为同层兄弟', 'restore as a same-level sibling'],
        ],
        [
          ['下一棵树的根', 'Next tree root'],
          ['根层右孩子', 'root-level right child'],
          ['断开，成为新树根', 'cut and make a new root'],
        ],
        [
          ['节点数', 'Node count'],
          ['不变', 'unchanged'],
          ['不增删节点', 'add or remove none'],
        ],
        [
          ['树的先根 / 后根', 'Tree preorder / postorder'],
          ['二叉树先序 / 中序', 'binary preorder / inorder'],
          ['按遍历序列还原结构', 'reconstruct from the traversal order'],
        ],
      ],
    },
    takeaway: ['记牢“左孩子是第一个孩子，右孩子是下一个兄弟”；森林只是把各棵树的根也串成右链。还原时先还原孩子链，再断开根层右链，节点数始终不变。', 'Remember “left child = first child, right child = next sibling”; a forest simply strings the tree roots into a right chain. When restoring, rebuild child chains first and then cut the root-level right chain; the node count never changes.'],
  },
  {
    id: 'threaded-binary-tree',
    topicId: 'threaded-tree',
    title: ['线索二叉树：把空指针变成遍历线索', 'Threaded binary tree: turning null pointers into traversal threads'],
    chapter: ['第 6 章 · 树和二叉树', 'Chapter 6 · Trees and binary trees'],
    summary: [
      '普通二叉链表有大量空指针。中序线索化把空的左、右指针分别改为指向中序前驱和中序后继，并用 ltag/rtag 区分“孩子”与“线索”。这样不靠递归或辅助栈也能沿中序次序走完整棵树。',
      'An ordinary binary linked list wastes many null pointers. Inorder threading replaces empty left/right pointers with inorder predecessors/successors and uses ltag/rtag to distinguish a child link from a thread. The tree can then be walked in inorder without recursion or an auxiliary stack.',
    ],
    diagram: 'threaded-binary-tree',
    definitions: [
      {
        term: ['线索', 'Thread'],
        text: ['指向某种遍历次序下的前驱或后继的指针；它不是孩子链接。', 'A pointer to a predecessor or successor in a chosen traversal order; it is not a child link.'],
      },
      {
        term: ['线索化', 'Threading'],
        text: ['按指定遍历次序，把节点原有的空左、右指针改为指向前驱、后继，并设置相应标志。', 'Following a chosen traversal order, replace a node’s originally null left/right pointers with predecessor/successor links and set the corresponding tags.'],
      },
      {
        term: ['线索二叉树', 'Threaded binary tree'],
        text: ['带 ltag/rtag 的二叉链表；标志为 0 时指针仍指孩子，为 1 时指针是线索。', 'A binary linked list with ltag/rtag: tag 0 keeps the pointer on a child, tag 1 makes it a thread.'],
      },
      {
        term: ['中序前驱 / 后继', 'Inorder predecessor / successor'],
        text: ['在中序遍历序列中紧挨在当前节点之前、之后的节点；首节点的前驱与末节点的后继为空。', 'The nodes immediately before and after the current node in the inorder sequence; the first node has no predecessor and the last has no successor.'],
      },
      {
        term: ['孩子指针', 'Child pointer'],
        text: ['ltag=0 时的左指针、rtag=0 时的右指针，指向真实的左、右孩子。', 'A left pointer with ltag=0 or a right pointer with rtag=0; it points to a real left or right child.'],
      },
    ],
    sections: [
      {
        title: ['为什么需要线索二叉树', 'Why threads are needed'],
        body: [
          'n 个节点的二叉链表有 2n 个指针域，真实孩子链接只有 n−1 条，所以有 n+1 个指针为空。普通中序遍历必须递归或借助栈保存“回来的路”；访问完一个节点后，想找它的中序后继，往往还要从根重新搜索。线索化把这些空指针利用起来，让“下一个是谁”直接写在节点里。',
          'A binary linked list with n nodes has 2n pointer fields. Only n−1 are real child links, so n+1 are null. Ordinary inorder traversal needs recursion or a stack to remember the way back, and finding a node’s inorder successor may require searching from the root again. Threading uses those null fields to store “who is next” directly in the node.',
        ],
        points: [
          ['空指针不是垃圾：它们正好能记录遍历次序中的前驱或后继。', 'Null pointers are not waste: they can record predecessors or successors in a traversal order.'],
          ['线索化只改原本为空的指针，真实孩子链接必须保留。', 'Threading changes only originally null pointers; real child links must be preserved.'],
          ['线索让指定次序下的下一步可以直接得到，不必每次从根重新查找。', 'Threads make the next step in the chosen order directly available instead of searching from the root every time.'],
        ],
        formula: 'n 个节点：2n 个指针域；n−1 条孩子链；n+1 个空指针',
        formulaEn: 'n nodes: 2n pointer fields; n−1 child links; n+1 null pointers',
      },
      {
        title: ['标志约定：先看 tag，再跟指针', 'Tag convention: read the tag before following a pointer'],
        body: [
          '同一个左指针字段可能指向左孩子，也可能指向前驱，单看指针值无法区分，所以每个节点增加 ltag 与 rtag。本页统一采用无头结点设计：第一个中序节点的前驱为空，最后一个中序节点的后继为空，不引入头结点，也不混用带头结点的约定。',
          'The same left field may point to a left child or to a predecessor; the pointer value alone cannot tell them apart, so every node carries ltag and rtag. This page consistently uses the no-header design: the first inorder node has a null predecessor and the last has a null successor. No header node is introduced or mixed in.',
        ],
        points: [
          ['ltag=0：left 指向左孩子；ltag=1：left 指向中序前驱。', 'ltag=0: left points to the left child; ltag=1: left points to the inorder predecessor.'],
          ['rtag=0：right 指向右孩子；rtag=1：right 指向中序后继。', 'rtag=0: right points to the right child; rtag=1: right points to the inorder successor.'],
          ['一个指针字段只有原本为空时才能改为线索；非空的孩子指针不能被线索覆盖。', 'A pointer field may become a thread only when it was originally null; a non-null child pointer must never be overwritten.'],
          ['tag 是判断指针含义的唯一依据；不能凭“看起来像孩子”猜。', 'The tag is the only reliable way to interpret the pointer; never guess from appearance.'],
        ],
        formula: 'ltag=0 → 左孩子；ltag=1 → 中序前驱\nrtag=0 → 右孩子；rtag=1 → 中序后继',
        formulaEn: 'ltag=0 → left child; ltag=1 → inorder predecessor\nrtag=0 → right child; rtag=1 → inorder successor',
      },
      {
        title: ['中序线索化：用 pre 指针串起前驱与后继', 'Inorder threading: link predecessor and successor with pre'],
        body: [
          '示例树以 4 为根：4 的左孩子是 2、右孩子是 6；2 的左孩子是 1、右孩子是 3。它的中序序列是 1 → 2 → 3 → 4 → 6。按中序递归处理每个节点，同时维护“上一个访问过的节点” pre。',
          'The example tree has root 4: 4’s left child is 2 and right child is 6; 2’s left child is 1 and right child is 3. Its inorder sequence is 1 → 2 → 3 → 4 → 6. Process each node in inorder recursion while keeping pre, the previously visited node.',
        ],
        points: [
          ['先递归线索化左子树；进入当前节点时，pre 正好是它的中序前驱。', 'Thread the left subtree first; when the current node is processed, pre is exactly its inorder predecessor.'],
          ['若当前节点的 left 为空：置 ltag=1，并令 left 指向 pre。', 'If the current node’s left is null, set ltag=1 and point left to pre.'],
          ['若 pre 的 right 为空：置 rtag=1，并令 pre.right 指向当前节点。这一步补上 pre 的后继。', 'If pre’s right is null, set rtag=1 and point pre.right to the current node; this fills in pre’s successor.'],
          ['处理完当前节点后令 pre=当前节点，再递归线索化右子树。', 'After processing the current node, set pre to it and thread the right subtree.'],
        ],
        formula: '中序：Thread(left) → 处理 node → Thread(right)；pre 始终保存上一访问节点',
        formulaEn: 'Inorder: Thread(left) → process node → Thread(right); pre always stores the previous visited node',
      },
      {
        title: ['沿线索中序遍历：不递归、不用栈', 'Walk inorder by threads: no recursion, no stack'],
        body: [
          '从根出发先走到最左节点，即中序第一个节点 1。访问 1 后，因 rtag=1，直接沿 right 到后继 2；2 的 rtag=0，说明右指针是真实孩子，于是进入 2 的右子树并走到该子树最左节点 3；访问 3 后沿线索到 4；4 的 rtag=0，进入右子树最左节点 6；访问 6 后 rtag=1 且其后继为空，遍历结束。得到 1 → 2 → 3 → 4 → 6。',
          'Start at the leftmost node, the first inorder node 1. After visiting 1, rtag=1 sends us along right to successor 2. Node 2 has rtag=0, so its right pointer is a real child: enter its right subtree and go to its leftmost node 3. After 3, the thread leads to 4. Node 4 has rtag=0, so enter its right subtree and reach leftmost 6. After 6, rtag=1 and its successor is null, so the walk ends. The result is 1 → 2 → 3 → 4 → 6.',
        ],
        points: [
          ['若 p.rtag=1：中序后继就是 p.right。', 'If p.rtag=1, the inorder successor is p.right.'],
          ['若 p.rtag=0：后继是 p.right 子树中的最左节点，沿 left 一直走到底。', 'If p.rtag=0, the successor is the leftmost node in p.right’s subtree; keep following left.'],
          ['整条遍历路径只访问每个节点一次，时间 O(n)，辅助空间 O(1)。', 'Each node is visited once: O(n) time and O(1) auxiliary space.'],
          ['前序、后序线索化只是把“前驱/后继”换成对应次序；本轮只展开中序，不混用不同次序的线索。', 'Preorder and postorder threading merely change which order defines predecessor/successor; this page stays with inorder and never mixes thread orders.'],
        ],
        formula: 'p.rtag=1 → p = p.right；p.rtag=0 → p = p.right 子树的最左节点',
        formulaEn: 'p.rtag=1 → p = p.right; p.rtag=0 → p = leftmost node in p.right subtree',
      },
    ],
    comparison: {
      title: ['示例树的中序线索表', 'Inorder threads in the example tree'],
      columns: [
        ['节点', 'Node'],
        ['ltag / 左指针', 'ltag / left'],
        ['rtag / 右指针', 'rtag / right'],
        ['中序前驱 → 后继', 'Inorder pred → succ'],
      ],
      rows: [
        [
          ['1', '1'],
          ['1 / 前驱为空', '1 / null predecessor'],
          ['1 → 后继 2', '1 → successor 2'],
          ['∅ → 2', '∅ → 2'],
        ],
        [
          ['2', '2'],
          ['0 → 左孩子 1', '0 → left child 1'],
          ['0 → 右孩子 3', '0 → right child 3'],
          ['1 → 3', '1 → 3'],
        ],
        [
          ['3', '3'],
          ['1 → 前驱 2', '1 → predecessor 2'],
          ['1 → 后继 4', '1 → successor 4'],
          ['2 → 4', '2 → 4'],
        ],
        [
          ['4', '4'],
          ['0 → 左孩子 2', '0 → left child 2'],
          ['0 → 右孩子 6', '0 → right child 6'],
          ['3 → 6', '3 → 6'],
        ],
        [
          ['6', '6'],
          ['1 → 前驱 4', '1 → predecessor 4'],
          ['1 / 后继为空', '1 / null successor'],
          ['4 → ∅', '4 → ∅'],
        ],
      ],
    },
    takeaway: ['记牢“空指针才线索化、tag 决定指针含义”。中序线索树中，rtag=1 直接取后继，rtag=0 进入右子树找最左节点；这样不用递归和栈也能完成中序遍历。', 'Remember: thread only null pointers, and let the tag decide what a pointer means. In an inorder threaded tree, rtag=1 gives the successor directly; rtag=0 means entering the right subtree and taking its leftmost node. That yields inorder without recursion or a stack.'],
  },
];

/**
 * TEXTBOOK-01 keeps the three newly authored storage/recursion pages in a
 * separate module. The visible catalogue remains a single ordered list, so
 * search, topic lookup and directory registration do not need to know how the
 * page source is split.
 */
export const CONCEPT_PAGES: readonly ConceptPage[] = [
  ...BASE_CONCEPT_PAGES,
  ...STORAGE_CONCEPT_PAGES,
  ...GENERALIZED_LIST_CONCEPT_PAGES,
  ...GRAPH_STORAGE_CONCEPT_PAGES,
  ...GRAPH_CONNECTIVITY_CONCEPT_PAGES,
  ...DYNAMIC_STORAGE_CONCEPT_PAGES,
  ...SEARCH_CONCEPT_PAGES,
  ...EXTERNAL_SORT_CONCEPT_PAGES,
  ...FILE_STRUCTURE_CONCEPT_PAGES,
];

const BY_ID = new Map(CONCEPT_PAGES.map((page) => [page.id, page]));
const BY_TOPIC = new Map(CONCEPT_PAGES.map((page) => [page.topicId, page]));

export function conceptById(id: string | null | undefined): ConceptPage | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function conceptForTopic(topicId: string): ConceptPage | undefined {
  return BY_TOPIC.get(topicId);
}

import type { Lang } from '../../i18n/types';
import type { LocalizedText } from '../lessons/types';
import { REFERENCE_ANNOTATIONS, type ReferenceAnnotation } from './annotations';
import {
  REFERENCE_CONVENIENCE_NOTES,
  type ReferenceImplementation,
  type ReferenceLanguage,
} from './registry';

/**
 * Concise, reviewed teaching annotations for each registered algorithm.
 * The raw source stays the single source of truth for the algorithm body;
 * this note supplies the same learning intent in the other UI language.
 */
const REFERENCE_LEARNING_NOTES: Record<string, LocalizedText> = {
  linked: {
    zh: '用 next 串起节点；遍历沿链前进，插入和删除先改前驱的 next，再接入或释放节点。按位置访问是 O(n)。',
    en: 'Nodes are linked by next; traversal follows the chain, and insertion or deletion rewires the predecessor before attaching or freeing a node. Access by position is O(n).',
  },
  binary: {
    zh: '数组必须非降序。维持闭区间 [low, high]，比较中点后丢弃不可能的一半，返回下标或 -1；O(log n)，额外 O(1)。',
    en: 'The array must be non-decreasing. Keep an inclusive [low, high] window, discard the impossible half after the middle comparison, and return an index or -1; O(log n) time, O(1) space.',
  },
  bubble: {
    zh: '反复比较相邻元素并交换逆序对；提前结束标记在一趟无交换时停止。稳定，最坏 O(n²)，额外 O(1)。',
    en: 'Compare adjacent elements and swap inversions; an early-stop flag ends the pass when nothing moved. Stable, worst O(n²) time, O(1) extra space.',
  },
  selection: {
    zh: '每一轮在未排序后缀中选最小元素，放到当前前缀末尾；交换可能跨越相等元素，因此通常不稳定，O(n²)、O(1)。',
    en: 'Each pass selects the minimum in the unsorted suffix and places it at the end of the sorted prefix; swaps may cross equal keys, so it is usually unstable, O(n²) time and O(1) space.',
  },
  insertion: {
    zh: '维护有序前缀；取出 key，把严格大于它的元素右移一格，再把 key 写入空位。相等元素不移动，稳定，O(n²)、O(1)。',
    en: 'Maintain a sorted prefix; lift key, shift strictly larger values right, and write key into the gap. Equal keys do not move, so it is stable, O(n²) time and O(1) space.',
  },
  shell: {
    zh: '按逐渐缩小的 gap 分成子序列，各自做插入排序；gap=1 时收尾。复杂度取决于增量序列，n/2 折半序列最坏 O(n²)，通常不稳定。',
    en: 'Sort each gap-spaced subsequence with insertion sort, then shrink the gap and finish with gap 1. Cost depends on the gap sequence; halving gaps is O(n²) worst case and usually unstable.',
  },
  quick: {
    zh: '围绕 pivot 分区，把不大于 pivot 的元素放到左侧，再递归两侧。平均 O(n log n)，最坏可因极端划分退化为 O(n²)，递归栈平均 O(log n)。',
    en: 'Partition around a pivot, place values not greater than the pivot on its left, then recurse. Average O(n log n), worst O(n²) with extreme partitions, and O(log n) average recursion stack.',
  },
  merge: {
    zh: '二分到单元素，再合并两个有序半区；相等时优先取左侧以保持稳定。任何输入 O(n log n)，但数组版需要 O(n) 辅助空间。',
    en: 'Split to single elements, then merge two sorted halves; take the left item on equality to stay stable. O(n log n) for every input, but the array version needs O(n) auxiliary space.',
  },
  tournament: {
    zh: '叶节点存放记录，内部节点保存两个子树中的较优赢家；根节点是当前最小值。取走赢家后只沿叶到根重算，按 (关键字, 原始下标) 比较，因此稳定；总 O(n log n)、树空间 O(n)。',
    en: 'Leaves hold records and each internal node stores the better subtree winner; the root is the current minimum. After a removal only the leaf-to-root path is recomputed. Comparison uses (key, originalIndex), so it is stable; O(n log n) time and O(n) tree space.',
  },
  radix: {
    zh: '按最低位到最高位逐位处理，把记录稳定放入 0–9 号桶，再按桶号收集。桶内 FIFO 是正确性的必要条件；O(d(n+10))，额外 O(n+10)。当前模型只接受 0–9999 的非负整数。',
    en: 'Process digits from least to most significant, stably distribute records into buckets 0–9, then collect in bucket order. FIFO order inside buckets is required for correctness; O(d(n+10)) time and O(n+10) extra space. The current model accepts only non-negative integers 0–9999.',
  },
  factorial: {
    zh: '递归把 n! 化为 n × (n−1)!，以 0! = 1! = 1 为终止条件；返回时逐层相乘。时间 O(n)，递归栈 O(n)。',
    en: 'Recursively reduce n! to n × (n−1)!, with 0! = 1! = 1 as the base cases, then multiply while unwinding. O(n) time and O(n) recursion space.',
  },
  fib: {
    zh: '朴素递归把 F(n) 化为 F(n−1)+F(n−2)，以 F(0)=0、F(1)=1 终止；两个分支互不共享结果，调用数指数增长，但活动栈深度只有 O(n)。',
    en: 'Naive recursion expands F(n) into F(n−1)+F(n−2), with F(0)=0 and F(1)=1 as base cases. Branches share no results, so calls grow exponentially while the live stack stays O(n) deep.',
  },
  stack: {
    zh: '栈遵循后进先出：顺序栈用 top 指向当前栈顶，top = −1 表示空；链栈用 top 指向首结点。push/pop 单次 O(1)，额外空间 O(n)。',
    en: 'A stack is LIFO: a sequential stack keeps top on the current top element with top = −1 meaning empty, while a linked stack points top at the first node. Push and pop cost O(1), with O(n) space.',
  },
  queue: {
    zh: '队列遵循先进先出：循环队列用 front 指向队首、rear 指向下一个空位并牺牲一个单元区分空满；链队列用 front 指头结点、rear 指尾结点。单次 O(1)。',
    en: 'A queue is FIFO: a circular queue keeps front on the head and rear on the next free slot, reserving one slot to distinguish full from empty; a linked queue points front at the head sentinel and rear at the tail. O(1) per operation.',
  },
  'infix-to-postfix': {
    zh: '扫描中缀 token：操作数直接输出，左括号入栈，右括号弹到左括号，运算符先弹掉优先级不低于自己的栈顶再入栈，最后清空运算符栈。时间 O(n)，栈空间 O(n)。',
    en: 'Scan infix tokens: operands emit directly, a left parenthesis is pushed, a right parenthesis pops back to it, an operator pops tops with greater-or-equal precedence before pushing, and the stack is flushed at the end. O(n) time and O(n) stack space.',
  },
  'postfix-eval': {
    zh: '从左到右扫描后缀：数字入操作数栈；运算符先弹右、再弹左，按 left op right 求值后压回。结束时栈中恰有一个结果。时间 O(n)，最坏栈空间 O(n)。',
    en: 'Scan postfix left to right: push numbers; an operator pops right then left, computes left op right and pushes the result back. Exactly one value remains at the end. O(n) time and O(n) worst-case stack space.',
  },
  seqlist: {
    zh: '用连续存储保存元素和长度 length；按下标访问 O(1)，插入或删除要移动后续元素，最坏 O(n)。',
    en: 'Contiguous storage holds the elements and a length; access by index is O(1), while insertion or deletion shifts later elements and costs O(n) worst case.',
  },
  doubly: {
    zh: '每个节点同时保存 prev 和 next；插入要接好四条链接，删除要同时修正前后节点的指针。按位置访问 O(n)。',
    en: 'Each node stores prev and next; insertion repairs four links, and deletion fixes both neighbouring pointers. Access by position is O(n).',
  },
  circular: {
    zh: '首尾相接的单链表，尾节点的 next 指回头节点；沿链遍历要记住起点，避免绕圈不停。插入删除仍是 O(1)（已定位时）。',
    en: 'A singly linked ring whose tail points back to the head; traversal must remember the start to avoid looping forever. Insertion or deletion is O(1) once located.',
  },
  inorder: {
    zh: '中序遍历按“左子树 → 根 → 右子树”访问；递归实现用调用栈保存返回位置，非递归版本则显式使用栈。时间 O(n)。',
    en: 'Inorder traversal visits left subtree, root, then right subtree; recursion stores return positions on the call stack, while an iterative version uses an explicit stack. O(n) time.',
  },
  bst: {
    zh: '左子树键小于根、右子树键大于根，中序遍历得到升序序列；查找沿一条根叶路径走，平均 O(log n)，退化时 O(n)。',
    en: 'Keys in the left subtree are smaller and those in the right are larger, so inorder is sorted; search follows one root-to-leaf path, O(log n) average and O(n) when unbalanced.',
  },
  avl: {
    zh: '在二叉搜索树上维护左右子树高度差不超过 1；插入或删除后沿路更新高度，必要时做单旋或双旋恢复平衡。高度 O(log n)。',
    en: 'An AVL tree keeps left and right subtree heights within one; after insertion or deletion it updates heights on the path and applies a single or double rotation when needed. Height O(log n).',
  },
  btree: {
    zh: '多路搜索树的每个节点保存多个有序关键字和多个孩子；插入溢出时分裂并把中间关键字上移，删除不足时先借后并，所有叶子保持同一深度。',
    en: 'A multiway search tree stores several ordered keys and children per node; an overflowing node splits and promotes its middle key, while an underfull node borrows or merges, keeping all leaves at the same depth.',
  },
  heap: {
    zh: '用数组表示完全二叉树，父节点不小于孩子；插入上浮，删除堆顶下沉。建堆 O(n)，单次插删 O(log n)，堆排序 O(n log n)。',
    en: 'A complete binary tree in an array keeps every parent at least as large as its children; insertion sifts up and removing the root sifts down. Build O(n), insert/extract O(log n), heap sort O(n log n).',
  },
  huffman: {
    zh: '反复从最小堆取两个最小权值合并，新权值放回堆，直到只剩一棵树；得到的叶编码满足前缀性质，总代价最小。',
    en: 'Repeatedly merge the two smallest weights from a min-heap and put the sum back until one tree remains; the leaf codes are prefix-free and minimise the weighted path length.',
  },
  'threaded-inorder': {
    zh: '按中序顺序线索化：空左指针写前驱、前驱的空右指针写后继，并用 ltag/rtag 区分真实孩子与线索；遍历从最左结点出发，沿右线索或右子树最左结点前进。',
    en: 'Thread in inorder order: a null left pointer stores the predecessor, a null right pointer of the predecessor stores the successor, and ltag/rtag separate real children from threads. Traversal starts at the left-most node and moves by right thread or left-most descent.',
  },
  bfs: {
    zh: '用 FIFO 队列从起点逐层扩展：出队访问，再把未访问邻居入队。邻接表时间 O(V+E)，额外空间 O(V)。',
    en: 'A FIFO queue expands from the source level by level: dequeue to visit, then enqueue unvisited neighbours. O(V+E) time for adjacency lists and O(V) extra space.',
  },
  dfs: {
    zh: '沿一条路径尽可能深入，访问邻居前先递归；无路可走时回溯。邻接表时间 O(V+E)，递归栈最坏 O(V)。',
    en: 'Go as deep as possible along one path, recursing before visiting the next neighbour, and backtrack at a dead end. O(V+E) time for adjacency lists and O(V) worst-case recursion space.',
  },
  dijkstra: {
    zh: '只适用于非负权；每次从优先队列取当前距离最小的未定顶点，松弛其出边。邻接表加堆为 O((V+E) log V)，空间 O(V)。',
    en: 'Requires non-negative weights; repeatedly extract the unsettled vertex with the smallest tentative distance and relax its outgoing edges. O((V+E) log V) with a heap and O(V) space.',
  },
  'floyd-warshall': {
    zh: '动态规划求所有点对最短路：依次允许前 k 个顶点作为中转，更新 dist[i][j] = min(dist[i][j], dist[i][k]+dist[k][j])。O(V³)。',
    en: 'All-pairs dynamic programming: allow the first k vertices as intermediates and update dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). O(V³) time.',
  },
  'bellman-ford': {
    zh: '对所有边做 V−1 轮松弛，可处理负权；若第 V 轮仍能松弛，说明存在从源点可达的负环。时间 O(VE)，空间 O(V)。',
    en: 'Relax every edge V−1 times, which tolerates negative weights; a further relaxation on pass V proves a negative cycle reachable from the source. O(VE) time and O(V) space.',
  },
  prim: {
    zh: '从一个顶点开始扩展生成树，每步选择连接已选集合与未选集合的最小权边；配合优先队列为 O(E log V)。',
    en: 'Grow a spanning tree from one vertex, adding the lightest edge that crosses from the chosen set to the unchosen set; O(E log V) with a priority queue.',
  },
  kruskal: {
    zh: '按权值从小到大扫描边，用并查集判断两端是否已连通；不连通就加入生成树。排序边为 O(E log E)，并查集近似 O(E)。',
    en: 'Scan edges by increasing weight and use disjoint-set union to test whether endpoints are already connected; add the edge when they are not. Sorting costs O(E log E), with near-O(E) union-find work.',
  },
  topological: {
    zh: '统计每个顶点入度，把入度为 0 的顶点入队；出队输出并删除其出边、降低邻居入度。若输出少于 V 个，图中存在环。O(V+E)。',
    en: 'Count each indegree, enqueue vertices with indegree zero, then output a vertex and remove its outgoing edges while decrementing neighbours. Fewer than V outputs means a cycle. O(V+E).',
  },
  'critical-path': {
    zh: '在 AOE 网上正推最早开始时间 ve，逆推最晚开始时间 vl；活动时间余量 d(i,j)=vl(j)−ve(i)−w，余量为 0 的活动组成关键路径。',
    en: 'On an AOE network, compute earliest event times ve forward and latest times vl backward; an activity is critical when vl(j) − ve(i) − w = 0, forming the critical path.',
  },
  components: {
    zh: '对每个未访问顶点启动一次 DFS/BFS，一次遍历能到达的所有顶点属于同一连通分量；统计启动次数即可。O(V+E)。',
    en: 'Start one DFS or BFS at every unvisited vertex; all vertices reached in that traversal form one connected component. Count the starts; O(V+E).',
  },
  scc: {
    zh: 'Kosaraju 两遍 DFS：第一遍记录完成顺序，第二遍按逆完成顺序在反向图上遍历，每棵 DFS 树就是一个强连通分量。O(V+E)。',
    en: 'Kosaraju uses two DFS passes: record finish order on the original graph, then traverse the reversed graph in reverse finish order; each DFS tree is one strongly connected component. O(V+E).',
  },
  linear: {
    zh: '从数组一端开始逐个比较，命中就返回下标，扫描结束仍未命中返回 -1。最坏 O(n)，不需要有序，额外 O(1)。',
    en: 'Compare from one end of the array and return the index on a hit, or -1 after the scan. O(n) worst case, no ordering requirement, O(1) extra space.',
  },
  'block-search': {
    zh: '块间最大值严格递增、后块最小值大于前块最大值，块内保持原顺序。先比较索引最大值锁定一个块，再在块内逐项扫描；时间 O(√n)（块长与块数约为 √n 时），空间 O(n+b)。',
    en: 'Block maxima strictly increase and each later block starts above the previous maximum, while in-block order stays untouched. Index maxima select one block, then records are scanned there; O(√n) with block count and length near √n, and O(n+b) space.',
  },
  'bplus-tree': {
    zh: '内部节点只存分隔键，记录全部在叶层；内部键等于右子树最小记录，叶链用 next 串联。点查找必须到叶子，范围查询先定位下界叶再沿 next 扫描；本轮实现查找、插入、分裂与范围查询，不实现删除。',
    en: 'Internal nodes hold separators only and every record lives in the leaf layer; an internal key equals the right subtree minimum and leaves are linked by next. Point search must reach a leaf, range search locates the lower-bound leaf then follows next; this round implements search, insertion, splits and ranges, not deletion.',
  },
  'key-tree': {
    zh: '根为哨兵，每条边一个字符，共享前缀只保存一份；路径末端必须 terminal=true 才是完整关键字。查找与插入只走长度为 L 的一条路径，时间 O(L)，空间按所有关键字的字符总数计。',
    en: 'The root is a sentinel, each edge carries one character, and a shared prefix is stored once; the path end must be terminal=true to be a complete key. Search and insertion follow one path of length L in O(L) time, with space counted over all characters of all keys.',
  },
  'hash-chain': {
    zh: '散列函数把关键字映射到桶，桶内用链表保存冲突项；查找先定位桶，再沿链比较。平均 O(1+α)，最坏 O(n)。',
    en: 'A hash function maps keys to buckets and each bucket stores collisions in a linked list; search locates the bucket, then scans the chain. O(1+α) average and O(n) worst case.',
  },
  'hash-probe': {
    zh: '开放定址的线性探测：冲突时向后找下一个空槽，查找遇到空槽即可判定不存在；本教学版没有删除墓碑。平均 O(1/(1−α))。',
    en: 'Linear probing uses open addressing: on a collision it scans forward for the next empty slot, and search stops at an empty slot. This teaching version has no deletion tombstones; expected O(1/(1−α)).',
  },
  bf: {
    zh: '逐个枚举模式串的合法起点，内层从 P[0] 开始逐字符比较；失配就右移起点并清零 j，命中后仍继续以保留重叠。最坏 O(nm)，额外 O(1)。',
    en: 'Enumerate every legal pattern start and compare from P[0] character by character; a mismatch shifts the start and resets j, while a hit still continues to keep overlaps. O(nm) worst case and O(1) extra space.',
  },
  kmp: {
    zh: '先构造模式串的 lps 前缀表，失配时只回退模式指针 j=lps[j−1]，主串指针不回退；构造 O(m)，匹配 O(n)，总 O(n+m)。',
    en: 'Build the pattern lps table first; on a mismatch only the pattern pointer falls back to lps[j−1], while the text pointer never rewinds. Build O(m), match O(n), total O(n+m).',
  },
  'sparse-transpose': {
    zh: '快速转置先统计原矩阵每列的非零个数 num，再求各列在结果中的起始槽 cpot；按行扫描三元组并写入 cpot 指向的位置。O(t+c)。',
    en: 'Fast transpose counts nonzeros per original column, computes each column starting slot cpot, then scans triplets in row order and writes them at cpot positions. O(t+c).',
  },
  'gl-depth': {
    zh: '按 tag 区分原子与子表：原子返回 0，空表(head 为 NULL)返回 1，非空表递归每个孩子并取最大深度加 1。时间 O(n)，递归栈 O(h)。',
    en: 'Use tag to distinguish atoms from sublists: an atom returns 0, an empty list (head NULL) returns 1, and a non-empty list recurses each child, takes the maximum and adds 1. O(n) time, O(h) stack.',
  },
  'gl-copy': {
    zh: '先按源节点 tag 分配新节点；原子复制值，子表沿源 head 递归并把新孩子接到新 next。copy_one 不复制源 next，调用方负责接同层后继。O(n)。',
    en: 'Allocate a new node from the source tag first; an atom copies its value, while a sublist recurses along source head and links new children through next. copy_one does not copy source next; the caller links siblings. O(n).',
  },
  'static-linked-list': {
    zh: '结点存放在固定数组，data 保存元素、cur 保存后继下标；插入先从空闲链借单元并保住后继，删除先摘链再把单元还给空闲链。按位置定位 O(n)，改游标 O(1)。',
    en: 'Nodes live in a fixed array: data stores the element and cur the successor index. Insertion borrows a free cell and preserves the successor; deletion unlinks first, then recycles the cell. Locating by position is O(n), while rewiring cursors is O(1).',
  },
  'polynomial-add': {
    zh: '两条按指数降序的链表用双指针合并：指数相等时系数相加，和为 0 不建结点；否则取指数较大项并只移动对应指针；一方耗尽后直接追加剩余段。O(m+n)。',
    en: 'Merge two exponent-descending chains with two cursors: equal exponents add coefficients and a zero sum creates no node; otherwise take the larger exponent and advance only that cursor; append the remaining segment once one side is exhausted. O(m+n).',
  },
  'free-list': {
    zh: '空闲块与已分配块按地址铺满整条内存。首次适应取地址顺序中第一个足够大的块；最佳适应取满足请求后剩余最小的块，平局保留较早地址。释放先检查左右邻，再按实际邻接合并。O(M·F)。',
    en: 'Free and allocated blocks tile the whole address range. First Fit takes the first adequate block in address order; Best Fit takes the least remainder, keeping the earlier address on ties. Release inspects both neighbours before coalescing. O(M·F).',
  },
  'buddy-system': {
    zh: '容量是 2 的幂。请求向上取整到块等级，从该等级向上找最小可用块，再逐层平分到目标等级。释放时用 start XOR size 求伙伴，只有同大小、同等级且空闲的真伙伴才能逐级合并。O(M·L)。',
    en: 'Capacity is a power of two. Round the request up to a level, find the smallest adequate block at or above it, then halve repeatedly to the target level. Release computes the buddy with start XOR size; only a free true buddy of the same level may merge upward. O(M·L).',
  },
  'garbage-collection': {
    zh: '从根集合迭代标记可达对象，并用已标记/在栈集合阻止环无限重复。清除回收所有未标记对象；紧缩再把存活对象按地址前移，并重写每条引用的源/目标地址。标记 O(N+E)，清除 O(N)，紧缩另加存活字节。',
    en: 'Mark reachable objects iteratively from roots, using marked/queued sets to stop cycles. Sweep reclaims every unmarked object; compaction then packs live objects and rewrites every reference endpoint. Marking O(N+E), sweeping O(N), compaction plus live bytes.',
  },
  multiway: {
    zh: 'k 个已有序段各维护一个 FIFO 输入缓冲区，只有队首可作候选。反复选最小候选写入共享输出缓冲区，满块时模拟写出；某段缓冲空且仍有记录时补读一块。线性扫描 k 个候选为 O(nk)，败者树可降至 O(n log k)。所有读写计数只是教学模型事件。',
    en: 'Each of k sorted runs keeps a FIFO input buffer exposing only its head as a candidate. Repeatedly emit the minimum into a shared output buffer, flushing a full block; refill a run when its buffer empties but records remain. Linear candidate scans cost O(nk), while a loser tree reduces selection to O(n log k). All counters are teaching-model events.',
  },
  replacement: {
    zh: '工作区固定 M 槽，先装入前 M 条记录。每次输出最小 eligible 记录并补读一条；不小于 lastOutput 的记录继续 eligible，小于则冻结。无可输出记录时封段、解冻全部 frozen、清空阈值。因此段长可以超过 M，随机输入平均约 2M。',
    en: 'A fixed M-slot workspace starts with the first M records. Repeatedly emit the smallest eligible record and read one replacement: keys at least lastOutput stay eligible, smaller keys freeze. When nothing is eligible, close the run, unfreeze all frozen records, and clear the threshold. Runs may therefore exceed M; random input averages about 2M.',
  },
  'optimal-merge': {
    zh: '以初始段长度为权重，每次取 k 个最轻的根构造父节点，父权重为孩子和，累计代价加上父权重。真实段数不满足满 k 叉树时补 d 个零权重虚拟叶；总代价是所有内部权重之和，不是根权重。贪心思想与哈夫曼树相通，但目标是最小化归并代价。',
    en: 'Weight leaves by initial-run length, combine the k lightest roots into a parent whose weight is the child sum, and add that weight to the running cost. Add d zero-weight virtual leaves when the real count cannot fill a full k-ary tree. Total cost is the sum of every internal weight, not the root alone. The greedy idea resembles Huffman construction, but the objective is merge cost.',
  },
  'file-index': {
    zh: '记录按主键排序分块。稠密索引每记录一项；稀疏索引每块只保留上界。查找线性检查索引，选“不大于目标的最后一项”，读一个数据块并在块内确认；成功与失败都计一次数据块读取。索引表按一块计。',
    en: 'Records are sorted and blocked by primary key. A dense index has one entry per record; a sparse index keeps one upper bound per block. A lookup probes entries linearly, chooses the last entry not above the target, reads one data block and confirms inside; both hit and miss count one block read. The index table counts as one block.',
  },
  isam: {
    zh: '主区按关键字有序分块，索引保存每块含溢出链的最大键。查找按上界选块、扫描主块，再沿该块专属溢出链继续。块满时插入溢出区，必须维护链接并刷新可能变化的上界；插入后真实重查。索引相对静态，不是 B+ 树。',
    en: 'Main blocks are ordered by key and the index stores each block’s maximum including its overflow chain. Lookup selects a block by bound, scans it, then follows that block’s private chain. When full, insertion enters overflow and must maintain links and refresh a changed bound; the inserted record is genuinely looked up again. The index is relatively static, not a B+ tree.',
  },
  'inverted-index': {
    zh: '为每个关键字维护记录 ID 倒排表。构建逐记录追加 ID；查询读取多张表，AND 求交、OR 求并，按原记录顺序过滤并去重。缺失词是空表；一个词可对应多条记录。课程不做分词、排名或全文搜索。',
    en: 'Each term has a posting list of record ids. Building appends ids record by record; querying reads lists, intersects for AND or unions for OR, filters in original record order and deduplicates. A missing term is an empty list; one term may match many records. The course implements no tokenizer, ranking or full-text search.',
  },
};

const LANGUAGE_NAME: Record<ReferenceLanguage, { zh: string; en: string }> = {
  c: { zh: 'C11', en: 'C11' },
  cpp: { zh: 'C++17', en: 'C++17' },
  python: { zh: 'Python 3', en: 'Python 3' },
};

const IMPLEMENTATION_NAME: Record<ReferenceImplementation, { zh: string; en: string }> = {
  principle: { zh: '原理实现', en: 'Principle implementation' },
  convenience: { zh: '简洁实现', en: 'Convenience implementation' },
};

const CONVENIENCE_CAVEAT: LocalizedText = {
  zh: '标准库快捷方法不一定采用本课演示的底层算法，不能与原理实现混为一谈。',
  en: 'The standard-library shortcut may not use the algorithm demonstrated in the lesson; do not confuse it with the principle implementation.',
};

function noteFor(algorithmId: string, lang: Lang): string {
  return REFERENCE_LEARNING_NOTES[algorithmId]?.[lang] ?? '';
}

function headerLines(
  algorithmId: string,
  algorithmName: string,
  language: ReferenceLanguage,
  implementation: ReferenceImplementation,
  lang: Lang,
): string[] {
  const languageName = LANGUAGE_NAME[language][lang];
  const implementationName = IMPLEMENTATION_NAME[implementation][lang];
  const idea =
    implementation === 'convenience'
      ? `${CONVENIENCE_CAVEAT[lang]} ${REFERENCE_CONVENIENCE_NOTES[language][lang]}`
      : noteFor(algorithmId, lang);
  const title =
    lang === 'zh'
      ? `AlgoViz 参考代码 · ${algorithmName} · ${languageName}`
      : `AlgoViz reference code · ${algorithmName} · ${languageName}`;
  const label = lang === 'zh' ? '思路' : 'Idea';
  const separator = lang === 'zh' ? '：' : ': ';

  return [
    title,
    implementationName,
    ...(idea ? [`${label}${separator}${idea}`] : []),
  ];
}

function wrapHeader(lines: string[], language: ReferenceLanguage): string {
  if (language === 'python') {
    return lines.map((line) => `# ${line}`).join('\n');
  }
  return ['/*', ...lines.map((line) => ` * ${line}`), ' */'].join('\n');
}

/**
 * Remove C/C++ comments while preserving strings and line structure. This is a
 * small lexical scan, not a translation pass: the code body is never rewritten.
 */
export function stripCComments(source: string): string {
  const output = source.split('');
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (current === '"' || current === "'") {
      const quote = current;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') index += 1;
        index += 1;
      }
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      output[index] = ' ';
      output[index + 1] = ' ';
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        output[index] = ' ';
        index += 1;
      }
      continue;
    }

    if (current === '/' && next === '*') {
      output[index] = ' ';
      output[index + 1] = ' ';
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] !== '\n') output[index] = ' ';
        index += 1;
      }
      if (index < source.length) {
        output[index] = ' ';
        output[index + 1] = ' ';
        index += 2;
      }
      continue;
    }

    index += 1;
  }

  return output.join('');
}

/**
 * Remove Python comments and documentation strings, preserving string literals
 * used by the program and all newlines. The algorithm body remains untouched.
 */
export function stripPythonCommentsAndDocstrings(source: string): string {
  const output = source.split('');
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    if (current === '#') {
      while (index < source.length && source[index] !== '\n') {
        output[index] = ' ';
        index += 1;
      }
      continue;
    }

    if (current === '"' || current === "'") {
      const triple = source[index + 1] === current && source[index + 2] === current;
      const quote = current;
      if (triple) {
        output[index] = ' ';
        output[index + 1] = ' ';
        output[index + 2] = ' ';
        index += 3;
        while (index < source.length) {
          if (source[index] === quote && source[index + 1] === quote && source[index + 2] === quote) {
            output[index] = ' ';
            output[index + 1] = ' ';
            output[index + 2] = ' ';
            index += 3;
            break;
          }
          if (source[index] !== '\n') output[index] = ' ';
          index += 1;
        }
        continue;
      }

      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') index += 1;
        index += 1;
      }
      index += 1;
      continue;
    }

    index += 1;
  }

  return output.join('');
}

export function stripReferenceComments(source: string, language: ReferenceLanguage): string {
  return language === 'python'
    ? stripPythonCommentsAndDocstrings(source)
    : stripCComments(source);
}

/**
 * Return the body of a standalone line comment, or null for code, inline
 * comments and block-comment lines. Only standalone line comments are used by
 * the reviewed annotation map, which keeps injection from touching code.
 */
function annotationText(line: string, language: ReferenceLanguage): string | null {
  const trimmed = line.trim();
  const marker = language === 'python' ? '#' : '//';
  if (!trimmed.startsWith(marker)) return null;
  return trimmed.slice(marker.length).trim();
}

function hasCjk(text: string): boolean {
  return /[\u3400-\u9fff]/.test(text);
}

interface CommentSpan {
  start: number;
  end: number;
  text: string;
}

function scanCCommentSpans(source: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  let index = 0;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (current === '"' || current === "'") {
      const quote = current;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') index += 1;
        index += 1;
      }
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') index += 1;
      spans.push({ start, end: index, text: source.slice(start, index) });
      continue;
    }

    if (current === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      if (index < source.length) index += 2;
      spans.push({ start, end: index, text: source.slice(start, index) });
      continue;
    }

    index += 1;
  }

  return spans;
}

function scanPythonCommentSpans(source: string): CommentSpan[] {
  const spans: CommentSpan[] = [];
  let index = 0;

  while (index < source.length) {
    const current = source[index];

    if (current === '#') {
      const start = index;
      while (index < source.length && source[index] !== '\n') index += 1;
      spans.push({ start, end: index, text: source.slice(start, index) });
      continue;
    }

    if (current === '"' || current === "'") {
      const quote = current;
      const triple = source[index + 1] === quote && source[index + 2] === quote;
      const lineStart = source.lastIndexOf('\n', index - 1) + 1;
      const statementPrefix = source.slice(lineStart, index);
      const isDocstring = triple && statementPrefix.trim().length === 0;

      if (triple) {
        const start = index;
        index += 3;
        while (index < source.length) {
          if (
            source[index] === quote &&
            source[index + 1] === quote &&
            source[index + 2] === quote
          ) {
            index += 3;
            break;
          }
          if (source[index] === '\\') index += 1;
          index += 1;
        }
        if (isDocstring) {
          spans.push({ start, end: index, text: source.slice(start, index) });
        }
        continue;
      }

      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') index += 1;
        index += 1;
      }
      index += 1;
      continue;
    }

    index += 1;
  }

  return spans;
}

function commentSpans(source: string, language: ReferenceLanguage): CommentSpan[] {
  return language === 'python'
    ? scanPythonCommentSpans(source)
    : scanCCommentSpans(source);
}

function commentBody(line: string, language: ReferenceLanguage): string {
  let body = line.trim();
  if (language === 'python') {
    body = body.replace(/^("{3}|'{3})/, '').replace(/(("{3})|('{3}))$/, '').trim();
    return body;
  }
  body = body.replace(/^\/\*+/, '').replace(/\*+\/$/, '').replace(/^\*+/, '').trim();
  return body;
}

function hasTeachingText(line: string, language: ReferenceLanguage): boolean {
  return /[A-Za-z]{3,}/.test(commentBody(line, language));
}

function mixedCommentReplacement(
  text: string,
  language: ReferenceLanguage,
  target: Lang,
): string | null {
  const lines = text.split('\n');
  const bodies = lines.map((line) => commentBody(line, language));
  const cjkCount = bodies.filter((body) => hasCjk(body)).length;
  const englishCount = bodies.filter(
    (body) => body.length > 0 && !hasCjk(body) && hasTeachingText(body, language),
  ).length;

  if (cjkCount === 0 || englishCount === 0) return null;

  const indent = lines[0].slice(0, lines[0].length - lines[0].trimStart().length);
  const content = bodies.filter((body) => body.length > 0);
  const keptContent = content.filter((body) => (target === 'zh' ? hasCjk(body) : !hasCjk(body)));

  if (language === 'python') {
    const delimiter = text.trimStart().startsWith("'''") ? "'''" : '"""';
    return [
      `${indent}${delimiter}`,
      ...keptContent.map((body) => `${indent}${body}`),
      `${indent}${delimiter}`,
    ].join('\n');
  }

  return [
    `${indent}/*`,
    ...keptContent.map((body) => `${indent} * ${body}`),
    `${indent} */`,
  ].join('\n');
}

function insertText(text: string, edits: Array<{ start: number; end: number; replacement: string }>): string {
  let cursor = 0;
  let output = '';
  for (const edit of edits.sort((a, b) => a.start - b.start)) {
    output += text.slice(cursor, edit.start) + edit.replacement;
    cursor = edit.end;
  }
  return output + text.slice(cursor);
}

/**
 * Remove comments that do not belong to `target`. The scan is lexical, so URL
 * slashes, string literals and indentation inside code survive unchanged.
 * Standalone comments disappear together with their line; inline comments only
 * lose the comment token. A mixed block (for example a Python module docstring
 * with both languages) is reduced to the target-language lines while its
 * delimiters and line structure stay intact.
 */
export function selectReferenceComments(
  source: string,
  language: ReferenceLanguage,
  target: Lang,
): string {
  const edits: Array<{ start: number; end: number; replacement: string }> = [];

  for (const span of commentSpans(source, language)) {
    const mixed = mixedCommentReplacement(span.text, language, target);
    if (mixed !== null) {
      edits.push({ start: span.start, end: span.end, replacement: mixed });
      continue;
    }

    const keep = target === 'zh' ? hasCjk(span.text) : !hasCjk(span.text);
    if (keep) continue;

    const lineStart = source.lastIndexOf('\n', span.start - 1) + 1;
    const nextNewline = source.indexOf('\n', span.end);
    const lineEnd = nextNewline < 0 ? source.length : nextNewline;
    const before = source.slice(lineStart, span.start);
    const after = source.slice(span.end, lineEnd);

    if (before.trim().length === 0 && after.trim().length === 0) {
      edits.push({
        start: lineStart,
        end: nextNewline < 0 ? source.length : nextNewline + 1,
        replacement: '',
      });
    } else {
      edits.push({ start: span.start, end: span.end, replacement: '' });
    }
  }

  return insertText(source, edits);
}

/**
 * Replace reviewed English line-comment anchors with their Chinese rendering
 * before the language filter runs. The replacement keeps indentation and the
 * comment marker, so the selected output remains a normal source file.
 */
function applyChineseAnnotations(
  source: string,
  language: ReferenceLanguage,
  annotations: readonly ReferenceAnnotation[],
): string {
  if (annotations.length === 0) return source;

  const lines = source.split('\n');
  const removedLines = new Set<number>();
  const marker = language === 'python' ? '#' : '//';

  for (const annotation of annotations) {
    const sourceIndex = lines.findIndex(
      (line) => annotationText(line, language) === annotation.en,
    );
    if (sourceIndex < 0) continue;
    const line = lines[sourceIndex];
    const indent = line.slice(0, line.length - line.trimStart().length);
    lines[sourceIndex] = `${indent}${marker} ${annotation.zh}`;

    // Sources may already carry the same Chinese line next to the English
    // anchor. Replacing the anchor must not leave two identical teaching lines.
    for (const neighbour of [sourceIndex - 1, sourceIndex + 1]) {
      if (
        neighbour >= 0 &&
        neighbour < lines.length &&
        lines[neighbour].trim() === `${marker} ${annotation.zh}`
      ) {
        removedLines.add(neighbour);
      }
    }
  }

  return lines.filter((_, index) => !removedLines.has(index)).join('\n');
}

function hasLeadingHeader(source: string, language: ReferenceLanguage): boolean {
  const trimmed = source.replace(/^(?:[ \t]*\r?\n)+/, '');
  if (language === 'python') {
    return trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''");
  }
  return trimmed.startsWith('//') || trimmed.startsWith('/*');
}

/**
 * Keep one algorithm body and select only comments in the current UI language.
 * The source can carry reviewed comments in both languages for the same line;
 * `selectReferenceComments` removes the other language lexically, never by
 * rewriting code. Reviewed English anchors are first rendered into Chinese so
 * comments that only exist in English still have a teaching translation.
 *
 * A source without a header in the selected language receives the generated
 * compact header; sources that already have one keep their richer original
 * header instead of stacking two introductions.
 */
export function localizeReferenceSource(
  source: string,
  {
    algorithmId,
    algorithmName,
    language,
    implementation,
    fileName,
    lang,
  }: {
    algorithmId: string;
    algorithmName: string;
    language: ReferenceLanguage;
    implementation: ReferenceImplementation;
    fileName?: string;
    lang: Lang;
  },
): string {
  const annotated =
    lang === 'zh'
      ? applyChineseAnnotations(
          source,
          language,
          fileName ? REFERENCE_ANNOTATIONS[fileName] ?? [] : [],
        )
      : source;
  const selected = selectReferenceComments(annotated, language, lang).replace(
    /^(?:[ \t]*\r?\n)+/,
    '',
  );

  if (selected.trim().length === 0 || hasLeadingHeader(selected, language)) return selected;

  return `${wrapHeader(
    headerLines(algorithmId, algorithmName, language, implementation, lang),
    language,
  )}\n\n${selected}`;
}

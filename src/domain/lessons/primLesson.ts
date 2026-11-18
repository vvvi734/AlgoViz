import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: {
      zh: '① 最小生成树是什么：空树与空堆',
      en: '① What an MST is: empty tree, empty heap',
    },
    explanation: {
      zh: '生成树是原图的一棵连通无环子图，包含全部 V 个顶点，恰好有 V-1 条边。最小生成树（MST）是所有生成树中边权总和最小的那一棵。它回答的是“把所有点连通起来最少要花多少”，不是“从起点到各点的最短路”——后者是 Dijkstra/Floyd/Bellman-Ford 的问题，两者目标不同。Prim 从起点开始只维护一棵不断长大的树，初始时树为空、优先队列为空、总权重为 0；本轮默认图有 5 个顶点、6 条边，三条权重为 2 的边为后面的多解对照埋下伏笔。',
      en: 'A spanning tree is a connected, acyclic subgraph containing all V vertices and exactly V-1 edges. A minimum spanning tree (MST) is a spanning tree with the smallest possible total edge weight. It answers “what is the cheapest way to connect every vertex”, not “what is the shortest route from a source to each vertex” — the latter is Dijkstra/Floyd/Bellman-Ford. Prim grows one tree from a start vertex; initially the tree and heap are empty and the total is 0. The default graph has five vertices and six edges, including three weight-2 edges that set up the multiple-MST comparison later.',
    },
    tip: {
      zh: 'MST 优化的是“全图连通成本”；最短路径优化的是“从某个起点出发的路线成本”。',
      en: 'An MST minimises the cost of connecting the whole graph; shortest paths minimise route cost from a source.',
    },
  },
  {
    stepId: 'start',
    title: {
      zh: '② 起点加入树，形成第一条横切',
      en: '② The start joins the tree and creates the first cut',
    },
    explanation: {
      zh: 'Prim 先选一个起点 A，把它放进 tree。此时树内集合是 {A}，树外是 {B,C,D,E}；连接两边的边 A–B、A–C 就是“横切边”。只有横切边才可能安全地把树扩大：树内部边会成环，树外部边暂时不与树相连。程序随后把 A 的两条邻边按真实权重压入 heapq。默认图中 A–B 和 A–C 的权重都是 2，入堆顺序由固定邻接表决定。',
      en: 'Prim starts at A and puts it in the tree. The inside set is {A}, the outside set is {B,C,D,E}; A–B and A–C are the crossing edges. Only crossing edges can safely grow the tree: an internal edge closes a cycle, while an edge entirely outside is not connected to the tree yet. The program pushes A’s two weighted edges into heapq in fixed adjacency order. Both A–B and A–C weigh 2 in the default graph.',
    },
    tip: {
      zh: 'Prim 的“候选”不是所有边，而是当前树与树外之间的横切边。',
      en: 'Prim’s candidates are not all edges; they are exactly the edges crossing the current cut.',
    },
  },
  {
    stepId: 'push',
    title: {
      zh: '③ 每次扩展后，把新的横切边压入堆',
      en: '③ After each expansion, push the new crossing edges',
    },
    explanation: {
      zh: '当 B 加入树后，B–C 变成新的横切边，而 A–B、B–D 等要么已经在树内、要么不连接树外，不能成为候选。程序只把真正横切的边压入 heap，并保留 (weight, sequence, target, source, edgeId) 五元组；sequence 是入堆顺序，用来在同权时稳定地打破平局。画布右侧的“优先队列”就是这组真实堆条目的按权重展示，第一项是下一次 pop 的最小候选。',
      en: 'After B joins, B–C becomes a crossing edge; A–B is internal and B–D does not lead to the tree, so they are not candidates. The program pushes only genuine crossing edges, storing (weight, sequence, target, source, edgeId). The sequence is the push order and breaks equal-weight ties deterministically. The right-hand priority queue is a weight-ordered view of those real heap entries; its first item is the next pop.',
    },
    tip: {
      zh: '堆里存的是“从树内走到树外的边”，不是已经确定的生成树边。',
      en: 'The heap stores edges from inside to outside, not edges already chosen for the tree.',
    },
  },
  {
    stepId: 'pop',
    title: {
      zh: '④ 弹出最小候选：先验证，再决定',
      en: '④ Pop the lightest candidate: verify before choosing',
    },
    explanation: {
      zh: 'heappop 只保证弹出当前堆中权重最小的条目，并不保证它仍然有效。默认图中先弹出 A–B（权重 2），B 不在树内，因此它有效；后面堆里还会出现 B–C，当 C 已经通过 A–C 入树后，B–C 的两端都在树内，这个条目就必须跳过。这就是“候选边”和“已选边”不能混为一谈的原因：弹出只是检查开始，选中才是真正的加入。',
      en: 'heappop returns the lightest entry currently in the heap, but that does not make it valid. The default run pops A–B first; B is outside, so it is valid. Later B–C may still be in the heap after C has already joined through A–C; both endpoints are then inside, so that entry must be skipped. This is why candidate and selected are different states: popping starts an inspection, selecting actually adds the edge.',
    },
    tip: {
      zh: '“堆顶最小”只说明它最便宜，不说明它不会成环；必须检查另一端。',
      en: '“Heap top is lightest” does not mean it is cycle-free; always check the other endpoint.',
    },
  },
  {
    stepId: 'select',
    title: {
      zh: '⑤ 安全边：把最小横切边和顶点一起加入',
      en: '⑤ Safe edge: add the lightest crossing edge and its vertex',
    },
    explanation: {
      zh: '如果堆顶边的另一端仍在树外，这条边就是当前横切的最小边。把它加入生成树不会形成环，因为另一端此前不在树内；同时把该顶点加入 tree。默认运行的选择顺序是 A–B、A–C、C–D、D–E，总权重 2+2+1+1=6。每一步都只增加一条边和一个顶点，所以树始终连通无环，最终有 V-1=4 条边。',
      en: 'If the other endpoint is still outside, the popped edge is the lightest current crossing edge. Adding it cannot create a cycle because that endpoint was not inside; the vertex joins the tree too. The default selection order is A–B, A–C, C–D, D–E with total 2+2+1+1=6. Each step adds exactly one edge and one vertex, so the tree stays connected and acyclic and ends with V-1=4 edges.',
    },
    tip: {
      zh: '正确性来自割性质：横切的最小边一定属于某一棵 MST；这就是 Prim 的贪心选择。',
      en: 'Correctness comes from the cut property: the lightest crossing edge belongs to some MST. That is Prim’s greedy choice.',
    },
  },
  {
    stepId: 'skip',
    title: {
      zh: '⑥ 跳过成环边：为什么树内边不能再选',
      en: '⑥ Skip cycle edges: why an internal edge cannot join',
    },
    explanation: {
      zh: '当 B–C 被弹出时，B 和 C 都已经在树内。树内已经存在一条 B–A–C 的路径，再加入 B–C 就会形成环，生成树不再是一棵树。程序把这条边记入 skipped，而不是假装它从未出现；画布用灰色虚线明确区分“已跳过”和“尚未处理”。默认图最后还会跳过 C–E（权重 3），因为 E 已通过 D–E 入树。',
      en: 'When B–C is popped, both B and C are already inside. The tree already contains a B–A–C path, so adding B–C would close a cycle and stop it being a tree. The program records the edge as skipped instead of hiding it; the canvas uses a grey dashed line to distinguish skipped from unprocessed. The default run also skips C–E (weight 3) after E joins through D–E.',
    },
    tip: {
      zh: '判断成环不需要跑一遍 DFS；只要两端都已在同一棵生成树内，加入就一定成环。',
      en: 'No DFS is needed to detect the cycle: if both endpoints are already in the same tree, adding the edge necessarily closes one.',
    },
  },
  {
    stepId: 'component',
    title: {
      zh: '⑦ 不连通：最小生成森林，不是“一棵假树”',
      en: '⑦ Disconnected: a minimum spanning forest, not a fake tree',
    },
    explanation: {
      zh: '如果堆空但仍有顶点未加入，说明图不连通。Prim 会从下一个未访问顶点重新开始，分别长出每个连通分量的一棵最小生成树；所有分量合起来叫最小生成森林（MSF）。森林的边数是 V - 连通分量数，而不是 V-1；界面会显示“图不连通”并拒绝把森林标成一棵完整生成树。若只有一个顶点，它是合法的零权重生成树；空图则只产生 init/done 帧。MST 允许负权边，Prim 不会套用 Dijkstra 的非负权限制；有向图不属于本批次普通 MST 的支持范围，输入会被明确拒绝。',
      en: 'If the heap is empty but vertices remain, the graph is disconnected. Prim restarts at the next unvisited vertex and grows one MST per component; together they form a minimum spanning forest (MSF). The edge count is V minus the number of components, not V-1. The UI says “disconnected” and never labels the forest as one spanning tree. A single vertex is a valid zero-weight tree; an empty graph emits only init/done. MSTs allow negative weights, so Prim does not inherit Dijkstra’s non-negative restriction; directed graphs are outside this batch’s ordinary MST scope and are rejected explicitly.',
    },
    tip: {
      zh: '先数连通分量 c：MST 存在要求 c=1；否则正确结果是森林，边数为 V-c。',
      en: 'Count components c: an MST requires c=1; otherwise the correct result is a forest with V-c edges.',
    },
  },
  {
    stepId: 'done',
    title: {
      zh: '⑧ 完成、总权重与多解对照',
      en: '⑧ Completion, total weight and multiple MSTs',
    },
    explanation: {
      zh: '当所有顶点都被覆盖且堆被清空，Prim 结束。默认图得到 A–B、A–C、C–D、D–E，总权重 6；Kruskal 在同一图上得到 A–B、B–C、C–D、D–E，总权重同样是 6。两条权重为 2 的边可以互换，说明 MST 不唯一，但最小总权重唯一（在权重和为实数且图连通时）。复杂度：邻接表 + 二叉堆是 O((V+E) log V)，空间 O(V+E)；若每次线性扫描候选，时间退化为 O(V²)。',
      en: 'Prim finishes when every vertex is covered and the heap is empty. The default graph yields A–B, A–C, C–D, D–E with total 6; Kruskal yields A–B, B–C, C–D, D–E with the same total 6. The two weight-2 edges can be swapped: the MST is not unique, but the minimum total weight is. Complexity: adjacency list plus binary heap is O((V+E) log V) time and O(V+E) space; repeatedly scanning candidates degrades to O(V²).',
    },
    tip: {
      zh: '记法：Prim 是“长树”，每次选连接树内外的最小边；负权可以，负环不影响 MST。',
      en: 'Memory hook: Prim “grows a tree”, always taking the lightest edge across the cut; negative weights are fine and negative cycles do not invalidate an MST.',
    },
  },
];

const MISTAKES = {
  zh: [
    '把 MST 和最短路径混为一谈，误以为要最小化“起点到各点”的距离。',
    '把树内部的边也压入候选堆，或选中两端都已在树内的边。',
    '只检查堆顶权重，不检查另一端是否已经加入树。',
    '把候选边（在堆里）直接标成已选边，掩盖了“先验证再选中”的过程。',
    '不连通时仍然输出 V-1 条边，把最小生成森林伪装成一棵生成树。',
    '把 Dijkstra 的非负权限制直接套到 MST；MST 允许负权边。',
    '把有向图当无向图跑 Prim；普通 MST 只定义在无向图上。',
    '用 set 的迭代顺序决定邻居顺序，导致同权时帧不可复现。',
  ],
  en: [
    'Confusing an MST with shortest paths and minimising source-to-vertex distances instead.',
    'Pushing internal tree edges into the candidate heap, or selecting an edge whose endpoints are both inside.',
    'Checking only the heap-top weight without checking whether the other endpoint is already in the tree.',
    'Painting a candidate as selected and hiding the “verify before choosing” step.',
    'Emitting V-1 edges on a disconnected graph and pretending a forest is one spanning tree.',
    'Copying Dijkstra’s non-negative restriction onto MSTs; negative edge weights are legal.',
    'Running Prim on a directed graph; ordinary MSTs are defined for undirected graphs.',
    'Using set iteration order for neighbours, making equal-weight frames irreproducible.',
  ],
};

export const primLesson: Lesson = {
  lessonId: 'prim-minimum-spanning-tree',
  algorithmId: 'prim',
  contentVersion: '1.0.0',
  title: { zh: 'Prim 最小生成树', en: 'Prim minimum spanning tree' },
  oneLiner: {
    zh: '从起点长出一棵树，用最小堆反复选择连接树内外的最轻边。',
    en: 'Grow one tree from a start vertex, repeatedly taking the lightest edge across the cut with a min-heap.',
  },
  overview: {
    zh: 'Prim 解决的是无向带权图的 MST 问题：用最小的总边权把所有顶点连成一个连通无环的结构。它维护两个集合——已经在树内的顶点和仍在树外的顶点——以及所有横切边的最小堆。每轮弹出最小横切边，如果另一端在树外，就把边和顶点一起加入；如果两端都已在树内，就跳过以免成环。Prim 的正确性来自割性质：对任意把顶点分成两边的割，横切边中权重最小的一条一定属于某一棵最小生成树。',
    en: 'Prim solves the MST problem on a weighted undirected graph: connect every vertex with the smallest possible total edge weight while staying connected and acyclic. It maintains two sets — vertices already in the tree and vertices still outside — plus a min-heap of all crossing edges. Each round pops the lightest crossing edge; if its other endpoint is outside, the edge and vertex join the tree, otherwise the edge is skipped to avoid a cycle. Correctness follows from the cut property: for any partition of the vertices, a lightest edge crossing the cut belongs to some MST.',
  },
  intuition: {
    zh: '把生成树想成一座正在扩建的车站网络：已经通车的车站是“树内”，还没通车的是“树外”。每次只修一条从已通车车站通往未通车车站的最便宜线路，网络就会一块一块地长出去。最小堆是工程队手里的报价队列，永远先看最便宜的横切线路；如果线路的另一端已经通车，这条线就没有必要再修。因为每次只连一个新车站，网络始终连通且没有环。图不连通时，一个起点只能覆盖一个片区，于是需要从下一个未通车车站重新开工，最后得到多棵树组成的森林。',
    en: 'Think of the tree as a rail network under construction: opened stations are inside the tree, unopened ones are outside. Each step builds only the cheapest line from an opened station to an unopened one, so the network expands one piece at a time. The min-heap is the crew’s quote queue, always showing the cheapest crossing line first; if its far end is already open, there is no reason to build it. Since each step connects one new station, the network stays connected and acyclic. On a disconnected graph, one start only covers one region, so the crew restarts at the next unopened station and ends with a forest.',
  },
  prerequisites: {
    zh: ['知道无向图、顶点、边和邻接表', '理解连通、环和生成树的定义', '会读 Python 的 heapq、dict 与 list', '知道 Big-O 记号'],
    en: ['Knowing undirected graphs, vertices, edges and adjacency lists', 'Understanding connectivity, cycles and spanning trees', 'Reading Python heapq, dict and list', 'Knowing Big-O notation'],
  },
  complexity: {
    time: 'O((V + E) log V)',
    space: 'O(V + E)',
    note: {
      zh: '每个顶点最多加入一次，每条边最多被压入堆一次；堆操作是 O(log E)=O(log V)（简单图 E≤V²），所以总时间是 O((V+E) log V)。若用线性数组每次扫描最小横切边，时间退化为 O(V²)。空间上邻接表 O(V+E)、树/访问集合 O(V)、堆 O(E)。本批次把节点限制为 10、边限制为 20，以保证堆面板可读且帧数远低于 500。',
      en: 'Each vertex joins once and each edge is pushed at most once; heap operations cost O(log E)=O(log V) for a simple graph (E≤V²), so the total is O((V+E) log V). Scanning a linear array for the lightest crossing edge instead degrades to O(V²). Space is O(V+E) for the adjacency list, O(V) for tree/visited sets and O(E) for the heap. This batch caps nodes at 10 and edges at 20 so the heap panel stays readable and the frame count stays well below 500.',
    },
  },
  steps: STEPS,
  commonMistakes: MISTAKES,
};

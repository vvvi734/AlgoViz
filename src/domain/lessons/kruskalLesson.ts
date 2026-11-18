import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: {
      zh: '① 并查集：每个顶点先各自成一个集合',
      en: '① Union-Find: every vertex starts in its own set',
    },
    explanation: {
      zh: 'Kruskal 不维护“正在长的一棵树”，而是先把每个顶点看成独立集合：parent[v]=v、rank[v]=0，连通分量数为 V。并查集只支持两种操作：find(x) 沿 parent 找到集合的根；union(a,b) 把两个根合并成一个。Kruskal 的关键判断就是 find(u)==find(v)：相同说明两端已经连通，加入当前边会成环；不同则说明可以把两个集合合并，当前边可以安全接受。',
      en: 'Kruskal does not grow one tree; it starts with every vertex as its own set: parent[v]=v, rank[v]=0, component count V. Union-Find supports two operations: find(x) follows parent pointers to the set root, and union(a,b) merges two roots. Kruskal’s key test is find(u)==find(v): equal means the endpoints are already connected, so adding the edge would form a cycle; different means the two sets can be merged and the edge is safe to accept.',
    },
    tip: {
      zh: '判断成环看“根”是否相同，不要只比较 parent 指针。',
      en: 'Cycle detection compares roots, not raw parent pointers.',
    },
  },
  {
    stepId: 'sort',
    title: {
      zh: '② 边按权重升序排序，同权保持稳定',
      en: '② Sort edges by ascending weight, stably for ties',
    },
    explanation: {
      zh: 'Kruskal 的贪心策略是“全局最轻的边优先”。程序把每条无向边规范成 (from,to) 的固定方向，用 (weight, 输入顺序, from, to) 排序；权重相同时按输入顺序稳定排列，保证同一份输入每次产生相同的帧。默认图的排序结果是 C–D(1)、D–E(1)、B–C(2)、A–B(2)、A–C(2)、C–E(3)。排序只改变检查顺序，不改变图本身；右侧“排序边表”会一直显示当前指针和每条边的接受/拒绝状态。',
      en: 'Kruskal’s greedy rule is “globally lightest edge first”. The program normalises each undirected edge to a fixed (from,to) direction and sorts by (weight, input order, from, to). Equal weights keep input order, so the same input always produces identical frames. The default order is C–D(1), D–E(1), B–C(2), A–B(2), A–C(2), C–E(3). Sorting changes only the inspection order, not the graph; the sorted-edge panel keeps showing the pointer and every edge’s accepted/rejected state.',
    },
    tip: {
      zh: 'Kruskal 的复杂度由排序主导：O(E log E)，并查集操作近似 O(α(V))。',
      en: 'Sorting dominates Kruskal: O(E log E), while Union-Find operations are near O(α(V)).',
    },
  },
  {
    stepId: 'inspect-edge',
    title: {
      zh: '③ 检查当前边：分别 find 两个端点',
      en: '③ Inspect the current edge: find both endpoints',
    },
    explanation: {
      zh: '对当前边 (u,v)，程序分别执行 find(u) 和 find(v)。路径压缩会让沿路节点的 parent 直接指向根，所以“父指针表”里有些节点不是直接指向根，但 rootId 一列给出的是真实 find 的结果。默认运行检查 A–C 时，A 与 C 已经通过 A–B、B–C 连通，两个 find 都得到同一个根；画布上 A 与 C 的端点环会同时高亮，方便对照。检查本身不修改并查集，只有接受时才 union。',
      en: 'For the current edge (u,v), the program calls find(u) and find(v). Path compression points visited nodes directly at the root, so the parent table may contain non-root parents while the rootId column always shows the real find result. When the default run inspects A–C, A and C are already connected through A–B and B–C, so both finds return the same root; the endpoint rings on the canvas highlight A and C together. Inspection alone never mutates Union-Find; only acceptance performs a union.',
    },
    tip: {
      zh: '路径压缩改变的是 parent 的形状，不改变集合归属，所以根仍然相同。',
      en: 'Path compression changes parent shape, not membership; the root stays the same.',
    },
  },
  {
    stepId: 'reject-edge',
    title: {
      zh: '④ 拒绝成环边：同一集合内不能再连',
      en: '④ Reject a cycle edge: no second link inside one set',
    },
    explanation: {
      zh: '如果 find(u)==find(v)，说明 u 和 v 已经在同一棵生成树里，二者之间早有一条无环路径；再加入 (u,v) 就会闭合成环，违反生成树的定义。程序把这条边记入 rejected，并且完全不改动 parent/rank。默认运行会拒绝 A–C（权重 2）和 C–E（权重 3）；被拒绝的边在图上显示红色虚线，在排序表中显示“拒绝”，而不是从画面中消失。为什么不能成环？因为生成树必须连通且无环，V 个顶点只能有 V-1 条边；任何额外边都会制造环。',
      en: 'If find(u)==find(v), u and v already lie in the same tree and a unique acyclic path joins them; adding (u,v) would close a cycle and violate the spanning-tree definition. The program records the edge as rejected and leaves parent/rank untouched. The default run rejects A–C (weight 2) and C–E (weight 3); rejected edges appear as red dashed lines and as “reject” rows instead of disappearing. Why must a tree be acyclic? A spanning tree is connected and acyclic with V vertices, so it has exactly V-1 edges; any extra edge creates a cycle.',
    },
    tip: {
      zh: '拒绝不是错误：它正是并查集用来阻止环、保证 V-1 条边的机制。',
      en: 'Rejection is not an error: it is exactly how Union-Find prevents cycles and keeps V-1 edges.',
    },
  },
  {
    stepId: 'union',
    title: {
      zh: '⑤ 接受当前边，按 rank 合并两个集合',
      en: '⑤ Accept the edge and union the sets by rank',
    },
    explanation: {
      zh: '两端根不同，当前边就是把两个连通分量连起来的安全边。程序先把这条边加入选中集合，再执行 union：比较两个根的 rank，把 rank 小的根挂到 rank 大的根下；rank 相同时任选一个作为新根，并把它 rank 加一。默认运行的接受顺序是 C–D、D–E、B–C、A–B，四次 union 把 5 个单点集合合并成 1 个集合，边数正好是 V-1=4。右侧“并查集”面板会同步显示 parent、rank、find 根和每个集合的成员；union 详情显示合并前后的分量数。',
      en: 'With different roots, the current edge safely connects two components. The program adds it to the selected set, then unions the roots: the lower-rank root is attached to the higher-rank root; on equal rank one becomes the new root and its rank increases by one. The default acceptance order is C–D, D–E, B–C, A–B; four unions collapse five singleton sets into one, giving exactly V-1=4 edges. The Union-Find panel synchronises parent, rank, find roots and members, while the union strip shows the component count before and after.',
    },
    tip: {
      zh: '接受边与合并集合是同一件事的两面：边加入生成树，集合随之减少一个。',
      en: 'Accepting an edge and merging sets are two views of one action: the edge joins the tree and the component count drops by one.',
    },
  },
  {
    stepId: 'done',
    title: {
      zh: '⑥ 完成、森林边界，以及和 Prim 的对照',
      en: '⑥ Completion, forest boundary and comparison with Prim',
    },
    explanation: {
      zh: '所有边检查完后，若图连通，选中的 V-1 条边构成一棵最小生成树；若不连通，每个连通分量各得一棵树，整体是最小生成森林，边数为 V-c，界面会明确标注“图不连通”，不会把森林冒充成一棵树。默认图接受 C–D、D–E、B–C、A–B，总权重是 1+1+2+2=6，与 Prim 的 A–B、A–C、C–D、D–E 相同，但选中的边集合不同：Prim 选 A–C，Kruskal 选 B–C。两种贪心策略不同——Prim 围绕一棵树看横切边，Kruskal 全局按权重看边并查集合——但割性质和环性质保证它们都达到最小总权重。相同权重、多种合法 MST 是正常现象；验收时要比较总权重，而不是固定边列表。MST 允许负权边；有向图不是普通 MST 的范围，会被拒绝。',
      en: 'After every edge is checked, a connected graph yields a minimum spanning tree with V-1 edges; a disconnected graph yields one tree per component, a minimum spanning forest with V-c edges. The UI explicitly says “disconnected” and never passes the forest off as one tree. The default total is 1+1+2+2=6, the same as Prim, but the selected sets differ: Prim takes A–C while Kruskal takes B–C. The greedy strategies differ — Prim examines crossing edges around one tree, Kruskal sorts all edges and unions sets — yet the cut and cycle properties guarantee the same minimum total. Equal weights and multiple valid MSTs are normal; acceptance compares total weight, not a fixed edge list. MSTs allow negative weights, and directed graphs are outside ordinary MST scope and are rejected.',
    },
    tip: {
      zh: '记法：Kruskal = 排序 + 并查集；同根拒绝，异根合并。总权重相同，边集可以不同。',
      en: 'Memory hook: Kruskal = sort + Union-Find; same root rejects, different roots union. Same total, possibly different edges.',
    },
  },
];

const MISTAKES = {
  zh: [
    '每条边都跑一次 DFS/BFS 判断连通，导致 O(E(V+E)) 的慢实现。',
    '比较 parent[u] 与 parent[v] 而不是 find(u) 与 find(v)，把同集合误判为不同集合。',
    'union 时总把第二个根挂到第一个根下，不做按秩合并，树高可能退化。',
    '排序不稳定或依赖 set/dict 迭代顺序，同权边在多次运行中帧不一致。',
    '把被拒绝的边直接从图中删掉，学生看不到“为什么成环”的证据。',
    '不连通时仍要求 V-1 条边，或把森林标成一棵完整生成树。',
    '把 MST 当成最短路径，或错误地禁止负权边。',
    '忘记无向边只应存一次/规范一次，导致重复边被重复检查。',
  ],
  en: [
    'Running DFS/BFS per edge to test connectivity, producing an O(E(V+E)) implementation.',
    'Comparing parent[u] with parent[v] instead of find(u) with find(v), mistaking one set for two.',
    'Always attaching the second root under the first without union by rank, which can degenerate tree height.',
    'Unstable sorting or relying on set/dict iteration order, so equal-weight frames differ between runs.',
    'Deleting rejected edges from the graph and hiding the evidence of why a cycle formed.',
    'Forcing V-1 edges on a disconnected graph, or labelling a forest as one spanning tree.',
    'Treating an MST as a shortest-path problem, or wrongly forbidding negative weights.',
    'Storing an undirected edge twice or normalising it inconsistently, so it is inspected twice.',
  ],
};

export const kruskalLesson: Lesson = {
  lessonId: 'kruskal-minimum-spanning-tree',
  algorithmId: 'kruskal',
  contentVersion: '1.0.0',
  title: { zh: 'Kruskal 最小生成树', en: 'Kruskal minimum spanning tree' },
  oneLiner: {
    zh: '把所有边按权重排序，用并查集逐条接受不成环的最轻边。',
    en: 'Sort all edges by weight and accept the lightest acyclic edges with Union-Find.',
  },
  overview: {
    zh: 'Kruskal 从全局最轻的边开始，依次检查排序后的边：如果两个端点已经属于同一连通分量，这条边会成环，必须拒绝；如果属于不同分量，就接受它并合并两个集合。并查集负责高效维护“谁和谁已经连通”。当接受满 V-1 条边（连通图）或所有边都检查完（不连通图）时，算法结束。正确性来自环性质：一条连接同一分量内两个顶点的边一定不属于任何生成树；而连接不同分量的最轻边一定属于某一棵 MST。',
    en: 'Kruskal starts from the globally lightest edge and inspects edges in sorted order: if both endpoints already belong to one component, the edge would close a cycle and must be rejected; if they belong to different components, accept it and merge the sets. Union-Find maintains “who is already connected” efficiently. The algorithm ends after V-1 accepted edges on a connected graph, or after every edge has been inspected on a disconnected graph. Correctness follows from the cycle property: an edge joining two vertices already in one component belongs to no spanning tree, while a lightest edge joining different components belongs to some MST.',
  },
  intuition: {
    zh: '把每个连通分量想成一个已经互相通车的小网络，并查集就是“查这两个站是不是同一个网络”的登记处。Kruskal 拿着按价格从低到高排好的线路清单，逐条问登记处：两端已经在同一网络里吗？是，就拒绝，因为再修一条会形成环；不是，就修这条线，并在登记处把两个网络合并成一个。按秩合并让登记簿保持扁平，路径压缩让查询几乎一步到位。图不连通时，最后会留下多个网络，它们就是最小生成森林。',
    en: 'Think of each component as a small already-connected network, with Union-Find as the registry answering “are these two stations in the same network?”. Kruskal holds a list of lines sorted from cheapest to most expensive and asks the registry about each line: are both ends already in one network? If yes, reject it because another line would close a cycle; if no, build it and merge the two networks in the registry. Union by rank keeps the registry flat, and path compression makes queries almost constant time. A disconnected graph ends with several networks: a minimum spanning forest.',
  },
  prerequisites: {
    zh: ['知道无向图、连通分量、环和生成树', '理解排序与稳定排序', '会读 Python 的 list、dict 与函数', '知道并查集或愿意先学 find/union'],
    en: ['Knowing undirected graphs, components, cycles and spanning trees', 'Understanding sorting and stable sorting', 'Reading Python list, dict and functions', 'Knowing Union-Find or being ready to learn find/union'],
  },
  complexity: {
    time: 'O(E log E)',
    space: 'O(V + E)',
    note: {
      zh: '时间由排序主导：O(E log E)。并查集用按秩合并 + 路径压缩，单次操作近似 O(α(V))，其中 α 是反阿克曼函数，实际可视为常数；总并查集开销 O(E α(V))，被排序项吸收。空间上边列表 O(E)、parent/rank O(V)、选中/拒绝集合 O(E)。节点上限 10、边上限 20，保证每个 union 帧和父指针表都足够清晰。',
      en: 'Time is dominated by sorting: O(E log E). Union-Find with union by rank plus path compression costs O(α(V)) per operation, where α is the inverse Ackermann function and effectively constant; total Union-Find work is O(E α(V)), absorbed by sorting. Space is O(E) for the edge list, O(V) for parent/rank and O(E) for selected/rejected sets. The node cap of 10 and edge cap of 20 keep every union frame and parent table readable.',
    },
  },
  steps: STEPS,
  commonMistakes: MISTAKES,
};

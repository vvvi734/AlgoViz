import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: { zh: '① 无向图、连通与分量', en: '① Undirected graphs, connectivity and components' },
    explanation: {
      zh: '无向图的边没有方向，u–v 表示 u 能到 v、v 也能到 u。若两个顶点之间存在一条无向路径，它们属于同一个连通分量。孤立顶点没有边，也单独构成一个大小为 1 的分量。默认教学图有 8 个顶点和 5 条边：A–B–C 连成一片，D–E 连成一片，F–G 连成一片，H 是孤立点，因此共有 4 个分量。',
      en: 'An undirected edge has no direction: u–v means u reaches v and v reaches u. Two vertices are in the same connected component if an undirected path connects them. An isolated vertex has no edge and forms a singleton component. The default graph has eight vertices and five edges: A–B–C, D–E, F–G, plus isolated H, so there are four components.',
    },
    tip: { zh: '“连通”只要求存在路径，不要求路径唯一，也不要求图是树。', en: 'Connectivity only requires some path, not a unique path, and the graph need not be a tree.' },
  },
  {
    stepId: 'start',
    title: { zh: '② 选择未访问根，分量编号加一', en: '② Choose an unseen root and increment the component id' },
    explanation: {
      zh: '程序按节点输入顺序扫描。遇到第一个未发现节点时，把它作为当前分量的根，分配 C1，并压入 DFS 栈。一个分量完成后继续扫描；下一个未发现节点会得到 C2。这个“扫描节点数组 + 跳过已发现节点”的规则保证所有分量都会被处理，而且不会重复编号。',
      en: 'The program scans nodes in input order. The first unseen node becomes the root of the current component, receives C1 and is pushed onto the DFS stack. After one component finishes, scanning continues; the next unseen node receives C2. This “scan the node array and skip discovered nodes” rule guarantees every component is processed exactly once.',
    },
    tip: { zh: '根不是“编号最大的节点”，而是本轮第一个未发现节点。', en: 'A root is not the largest id; it is simply the first unseen node in this round.' },
  },
  {
    stepId: 'pop',
    title: { zh: '③ 从 DFS 栈弹出节点', en: '③ Pop a node from the DFS stack' },
    explanation: {
      zh: 'DFS 栈保存“已发现、但邻接表还没展开”的节点。弹栈表示开始正式处理这个节点的所有邻居。当前帧的栈内容、栈顶和弹出项都直接来自 Python 的 list；UI 不根据访问顺序反推栈。',
      en: 'The DFS stack holds nodes that have been discovered but whose adjacency lists are not fully expanded. A pop begins processing all neighbours of that node. The stack contents, top and removed entry come directly from the Python list; the UI never reconstructs the stack from the visit order.',
    },
    tip: { zh: '弹栈不等于访问完成；邻居检查完才算这个节点的 DFS 展开结束。', en: 'Popping is not finishing the node; its DFS expansion ends only after all neighbours are inspected.' },
  },
  {
    stepId: 'visit',
    title: { zh: '④ 访问节点，但它早已属于当前分量', en: '④ Visit the node; it already belongs to the current component' },
    explanation: {
      zh: '节点在第一次被发现时就已经加入当前分量的 nodeIds。弹栈后记录 visit，只是把它加入访问顺序，便于观察 DFS 的展开过程；它不会重新分配分量。默认运行的访问顺序是 A、C、B、E、D、G、F、H，但分量集合与访问顺序是两种不同的信息。',
      en: 'A node joins the current component nodeIds at discovery time. The visit record after popping only appends it to the visit order for observing DFS expansion; it never reassigns the component. The default visit order is A, C, B, E, D, G, F, H, but membership and visit order are different kinds of information.',
    },
    tip: { zh: '访问顺序可以变化；分量集合由无向路径决定，不能靠访问顺序推断。', en: 'Visit order may vary; component membership is determined by undirected paths, not by visit order.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '⑤ 检查一条无向边', en: '⑤ Inspect an undirected edge' },
    explanation: {
      zh: '无向边只存一次，但两个端点都能检查它。当前帧把边高亮，并同时记录 currentNode 与 neighbor。若邻居未发现，下一步会把它并入当前分量；若已发现，说明这条边不会扩展出新的节点。无向图没有“只能从 from 到 to”的限制，不能把边当成有向边处理。',
      en: 'An undirected edge is stored once but can be inspected from either endpoint. The frame highlights the edge and records both currentNode and neighbor. If the neighbour is unseen, the next step adds it to the current component; if it is already discovered, this edge expands nothing new. There is no “from-to only” restriction, so never treat it as directed.',
    },
    tip: { zh: '无向边检查两次是正常的：每个端点展开时都可能再看一次。', en: 'Inspecting an undirected edge from both endpoints is normal; each endpoint may see it during expansion.' },
  },
  {
    stepId: 'discover',
    title: { zh: '⑥ 第一次发现邻居，立即并入当前分量', en: '⑥ First discovery: join the current component immediately' },
    explanation: {
      zh: '第一次遇到 neighbor 时，程序立即把它加入 discovered、component.nodeIds 和 discovered_order。这个时刻就确定了它的分量归属，而不是等到 visit 才决定。若邻居来自另一个分量，它不可能通过当前节点的无向边被到达；否则两个分量本来就连在一起，应该早已合并。',
      en: 'On first encounter, the neighbour immediately joins discovered, component.nodeIds and discovered_order. Its component membership is fixed now, not at visit time. If the neighbour belonged to another component, it could not be reached through the current node’s undirected edge; otherwise the two components were already connected and should have been merged.',
    },
    tip: { zh: '“发现即归组”是无向分量的关键；等到访问再归组会漏掉节点。', en: '“Discover and assign” is the key to components; waiting until visit can miss nodes.' },
  },
  {
    stepId: 'push',
    title: { zh: '⑦ 新邻居压栈，继续向深处展开', en: '⑦ Push the new neighbour and go deeper' },
    explanation: {
      zh: '发现邻居后立刻压栈，下一轮会优先展开它，形成深度优先的路径。因为邻接表按输入边的顺序构建，压栈顺序是确定的，教学示例每次播放一致。栈空时，从当前根可达的所有节点都已经处理完，当前分量结束。',
      en: 'The neighbour is pushed immediately, so the next round expands it first and follows a depth-first path. Adjacency lists follow input edge order, making push order deterministic and every teaching playback identical. When the stack empties, every node reachable from the current root has been processed and the component is complete.',
    },
    tip: { zh: 'DFS 栈的 LIFO 顺序决定“下一条路径”，但不改变分量集合。', en: 'The LIFO stack decides the next path, not the component membership.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑧ 已发现的邻居不能重复归组', en: '⑧ A discovered neighbour must not be grouped twice' },
    explanation: {
      zh: '邻居已经在 discovered 集合中时，程序只记录 skip，不修改分量。它可能属于当前分量（例如 A–B–C 的环状边），也可能已经由更早的分量处理；两种情况都不能再次加入 nodeIds。若把已发现节点重新归组，最终会出现重复节点或错误合并。',
      en: 'When the neighbour is already in discovered, the program records a skip and changes no group. It may belong to the current component (for example an edge closing A–B–C) or to an earlier component; either way it must not be added to nodeIds again. Reassigning a discovered node would duplicate nodes or merge components incorrectly.',
    },
    tip: { zh: 'skip 是正确行为，不是“重复边”错误；它证明该节点已经可达。', en: 'A skip is correct behaviour, not a duplicate-edge bug; it proves the node was already reachable.' },
  },
  {
    stepId: 'complete',
    title: { zh: '⑨ 栈空，当前分量完成', en: '⑨ Empty stack: the current component is complete' },
    explanation: {
      zh: '当栈为空时，从当前根出发的所有无向路径都已展开，当前分量的 nodeIds 不再增长。程序把 complete 标为 true，然后回到节点数组继续找下一个未发现节点。这个过程会自动处理非连通图、孤立节点和单点图；空图则只发出 init 与 done。',
      en: 'When the stack is empty, every undirected path from the root has been expanded and the component nodeIds stop growing. The program marks complete and resumes scanning for the next unseen node. This automatically handles disconnected graphs, isolated vertices and singleton graphs; an empty graph emits only init and done.',
    },
    tip: { zh: '完成一个分量后不要清空 discovered；它还要阻止下一个分量重复处理旧节点。', en: 'Do not clear discovered after one component; it must prevent the next component from reprocessing old nodes.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑩ 全部分量、复杂度与记忆重点', en: '⑩ All components, complexity and memory hooks' },
    explanation: {
      zh: '默认运行得到 C1={A,B,C}、C2={D,E}、C3={F,G}、C4={H}，共 4 个分量；每个节点恰好出现一次。DFS 版本的时间复杂度是 O(V+E)：每个节点入栈/出栈一次，每条无向边从两个端点各检查一次（仍是 O(E)）；空间是 O(V) 的栈、discovered、visited 和分量列表，加上 O(V+E) 邻接表。常见错误包括把无向边当有向边、在 visit 时才归组、重复分配已发现节点、忘记孤立点、以及用颜色而不是集合判断分量。',
      en: 'The default run yields C1={A,B,C}, C2={D,E}, C3={F,G}, C4={H}: four components, with every node exactly once. DFS runs in O(V+E): each node is pushed and popped once, and each undirected edge is inspected from both endpoints (still O(E)). Space is O(V) for the stack, discovered, visited and component lists, plus O(V+E) for the adjacency list. Common mistakes include treating an undirected edge as directed, assigning only at visit time, reassigning discovered nodes, forgetting isolated vertices, and judging groups by colour instead of the node set.',
    },
    tip: { zh: '记法：分量 = 一次 DFS 的可达闭包；扫描所有未发现根，每个根一个 C 编号。', en: 'Memory hook: a component is the reachable closure of one DFS; scan every unseen root and give each root one C id.' },
  },
];

export const connectedComponentsLesson: Lesson = {
  lessonId: 'connected-components-dfs',
  algorithmId: 'components',
  contentVersion: '1.0.0',
  title: { zh: '无向图连通分量', en: 'Undirected connected components' },
  oneLiner: {
    zh: '从每个未访问节点出发做一次 DFS，一次可达闭包就是一个连通分量。',
    en: 'Run one DFS from every unseen node; each reachable closure is one connected component.',
  },
  overview: {
    zh: '连通分量把无向图划分成若干互不相交的节点集合：同一集合内任意两点之间都有无向路径，不同集合之间没有路径。算法扫描节点数组，遇到未发现节点就启动一次 DFS/BFS，把从它可达的所有节点标记为同一分量；然后继续扫描，直到所有节点都有归属。孤立节点会成为大小为 1 的分量，空图则有 0 个分量。',
    en: 'Connected components partition an undirected graph into disjoint node sets: every pair inside one set is connected by an undirected path, and no path crosses between sets. The algorithm scans the node array; on an unseen node it starts DFS/BFS and marks every reachable node as one component, then resumes scanning until every node is assigned. An isolated node becomes a singleton; an empty graph has zero components.',
  },
  intuition: {
    zh: '把无向边想成双向道路。从一个城市出发，沿所有能走的路走一遍，走到的城市就属于同一个“连通区域”。走完后回到尚未访问的城市列表，选下一个没去过的城市，开一个新的区域编号。已经去过的城市不会再被第二个区域收进去，所以区域之间不会重叠。',
    en: 'Think of undirected edges as two-way roads. Starting from one city, walk every reachable road; all visited cities form one connected region. Then return to the list of unseen cities, pick the next one and open a new region id. A visited city is never claimed by a second region, so the regions cannot overlap.',
  },
  prerequisites: {
    zh: ['知道无向图、邻接表与路径', '理解 DFS/BFS 的 visited 集合', '知道栈与递归/迭代的关系', '会读 Python 的 set、list 与 dict'],
    en: ['Knowing undirected graphs, adjacency lists and paths', 'Understanding the visited set in DFS/BFS', 'Knowing the relation between a stack and iterative/recursive DFS', 'Reading Python set, list and dict'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: {
      zh: '每个节点恰好被发现一次、弹栈一次；每条无向边在其两个端点展开时各检查一次，总检查次数是 2E，仍是 O(E)。空间上邻接表 O(V+E)，栈、discovered、visited 与分量列表各 O(V)。本批次限制 12 个节点、30 条原始边、20 条唯一边，保证面板可读且帧数受控。',
      en: 'Every node is discovered once and popped once; every undirected edge is inspected from both endpoints, so 2E inspections remain O(E). Space is O(V+E) for adjacency lists and O(V) each for the stack, discovered, visited and component lists. This batch caps 12 nodes, 30 raw edges and 20 unique edges so panels stay readable and frame counts bounded.',
    },
  },
  steps: STEPS,
  commonMistakes: {
    zh: [
      '把无向边当成有向边，只沿 from→to 一个方向检查。',
      '只在 visit 时才把节点加入分量，导致发现阶段的分量集合不完整。',
      '把已发现节点再次加入当前分量，造成重复节点或错误合并。',
      '忘记孤立节点；它没有边，但必须成为独立分量。',
      '完成一个分量后清空 discovered，导致后续分量重复处理旧节点。',
      '只用颜色区分分量而不显示 C 编号或节点集合，色觉差异下无法核对。',
    ],
    en: [
      'Treating an undirected edge as directed and inspecting only from→to.',
      'Adding nodes to the component only at visit time, leaving the discovery-time set incomplete.',
      'Adding an already discovered node to the current component and duplicating or merging groups.',
      'Forgetting isolated vertices: they have no edge but still form their own component.',
      'Clearing discovered after one component, which makes later components reprocess old nodes.',
      'Using colour alone without C ids or node sets, which cannot be verified under colour-vision differences.',
    ],
  },
};

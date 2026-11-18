import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: { zh: '① 有向图、可达与强连通', en: '① Directed graphs, reachability and strong connectivity' },
    explanation: {
      zh: '有向边 u→v 只允许沿 u 到 v 的方向走。两个顶点 u、v 强连通，要求 u 能到达 v 且 v 也能到达 u；强连通关系满足自反、对称、传递，因此会把顶点划分成若干强连通分量（SCC）。普通连通分量忽略边方向，SCC 绝不忽略方向：A→B→C 是 3 个 SCC，而 A→B→C→A 是 1 个 SCC。',
      en: 'A directed edge u→v only permits travel from u to v. Two vertices u and v are strongly connected when u reaches v and v reaches u. This relation is reflexive, symmetric and transitive, so it partitions vertices into strongly connected components (SCCs). Ordinary components ignore edge direction; SCCs never do: A→B→C has 3 SCCs, while A→B→C→A has 1.',
    },
    tip: { zh: '判断 SCC 必须同时检查“u 到 v”和“v 到 u”，单向可达不算。', en: 'An SCC requires both “u reaches v” and “v reaches u”; one-way reachability is not enough.' },
  },
  {
    stepId: 'start-first',
    title: { zh: '② 第一遍 DFS：在原图上记录完成顺序', en: '② First DFS pass: record finish order on the original graph' },
    explanation: {
      zh: 'Kosaraju 先从每个未发现的顶点出发，对原图做一次完整 DFS。这里沿原有方向 u→v 前进，记录每个顶点真正完成（所有后继都已展开）的顺序。默认原图包含 A→B→C→A、C→D、D→E→D、F→G 和孤立 H；第一遍完成顺序是 E、D、C、B、A、G、F、H。',
      en: 'Kosaraju first runs a complete DFS on the original graph from every unseen vertex. It follows the original direction u→v and records the order in which each vertex actually finishes (after all successors are expanded). The default graph contains A→B→C→A, C→D, D→E→D, F→G and isolated H; the first-pass finish order is E, D, C, B, A, G, F, H.',
    },
    tip: { zh: '完成顺序不是拓扑序；它记录的是 DFS 后序，不是线性依赖答案。', en: 'Finish order is not a topological order; it is the DFS postorder, not a linear dependency answer.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '③ 沿原有方向检查出边', en: '③ Inspect outgoing edges in the original direction' },
    explanation: {
      zh: '当前节点只在 adjacency[node] 中按原方向检查邻居。邻居已发现时，这条边可能回到祖先（形成有向环），也可能是交叉边；由于第一遍只关心完成顺序，已发现邻居不会再压栈。若邻居未发现，才继续深入。',
      en: 'The current node inspects neighbours only through adjacency[node], following the original direction. If a neighbour is already discovered, the edge may return to an ancestor (a directed cycle) or be a cross edge; because pass one only needs finish order, a discovered neighbour is not pushed again. Only an unseen neighbour is explored deeper.',
    },
    tip: { zh: '同一对端点若只有 u→v，反向并不存在；检查方向错误会直接改变 SCC。', en: 'If only u→v exists, the reverse edge does not; inspecting the wrong direction changes the SCCs.' },
  },
  {
    stepId: 'push',
    title: { zh: '④ 未发现邻居压入第一遍 DFS 栈', en: '④ Push an unseen neighbour onto the first-pass stack' },
    explanation: {
      zh: 'DFS 栈保存当前路径与每个节点尚未检查的邻接下标。新邻居入栈后，下一轮优先展开它，从而一直走到当前路径的尽头。栈中的条目 ID 与节点 ID 都直接来自真实 Python 状态。',
      en: 'The DFS stack holds the current path and the next adjacency index for each node. A new neighbour is pushed and expanded first on the next round, continuing to the end of the current path. Both entry ids and node ids come directly from real Python state.',
    },
    tip: { zh: '迭代 DFS 必须保存“下一条邻接边下标”，否则回溯后会重复扫描。', en: 'Iterative DFS must store the next adjacency index; otherwise backtracking rescans edges.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑤ 已发现邻居：环边或交叉边，跳过', en: '⑤ Discovered neighbour: cycle or cross edge, skip it' },
    explanation: {
      zh: '第一遍遇到已发现邻居时不再压栈。它可能指向仍在栈中的祖先（有向环），也可能指向已经完成的节点（交叉边）。跳过不会改变 SCC 分组，只是避免重复访问；真正的分组发生在第二遍。',
      en: 'Pass one does not push a discovered neighbour. It may point to an ancestor still on the stack (a directed cycle) or to an already finished node (a cross edge). Skipping does not change SCC membership; the actual grouping happens in pass two.',
    },
    tip: { zh: '“跳过”不等于“同一 SCC”；分组必须等第二遍反向可达性验证。', en: '“Skip” does not mean “same SCC”; grouping waits for the second-pass reverse-reachability check.' },
  },
  {
    stepId: 'finish',
    title: { zh: '⑥ 节点完成，写入完成顺序', en: '⑥ A node finishes and enters the finish order' },
    explanation: {
      zh: '当节点的所有出边都检查完，它从栈中弹出，并追加到 finish_order。默认顺序中 E 和 D 先完成，然后 C、B、A；F→G 分支中 G 先完成，F 后完成；孤立 H 最后完成。完成顺序的长度最终等于顶点数。',
      en: 'When all outgoing edges of a node are inspected, it is popped and appended to finish_order. In the default order E and D finish first, then C, B and A; on the F→G branch G finishes before F; isolated H finishes last. The finished order eventually has one entry per vertex.',
    },
    tip: { zh: '一个节点只有在所有可达后继都完成后才完成；这是后序，不是发现序。', en: 'A node finishes only after all reachable successors finish; this is postorder, not discovery order.' },
  },
  {
    stepId: 'reverse',
    title: { zh: '⑦ 反转所有边，保留完成顺序', en: '⑦ Reverse every edge and keep the finish order' },
    explanation: {
      zh: '第二遍前，程序把每条 u→v 改成 v→u，得到转置图；同时清空第二遍的 discovered/visited 与栈，但保留第一遍的 finish_order。反转边的目的是让“原图中能到达根”的节点，在转置图中变成“从根可达”，这样一次普通 DFS 就能收集整个 SCC。',
      en: 'Before pass two, every u→v is replaced by v→u, producing the transpose. The second-pass discovered/visited sets and stack are cleared, but finish_order is kept. Reversing edges turns nodes that could reach the root in the original graph into nodes reachable from the root in the transpose, so one ordinary DFS collects the whole SCC.',
    },
    tip: { zh: '反转只改变边的方向，不改变顶点集合；完成顺序必须原样保留。', en: 'Reversal changes edge direction, not the vertex set; the finish order must be preserved.' },
  },
  {
    stepId: 'start-second',
    title: { zh: '⑧ 按完成顺序的逆序选择新 SCC 根', en: '⑧ Choose a new SCC root in reverse finish order' },
    explanation: {
      zh: '第二遍按 finish_order 从后往前扫描：H、F、G、A、B、C、D、E。遇到尚未分配的节点就把它作为新 SCC 的根，分配 C1、C2…… 默认运行的根依次是 H、F、G、A、D，得到 5 个 SCC。完成顺序的逆序保证：当一个 SCC 的根被处理时，所有能到达它的后续 SCC 已经在更晚的完成位置被考虑过，不会被错误吞并。',
      en: 'Pass two scans finish_order backwards: H, F, G, A, B, C, D, E. The first unassigned node becomes the root of a new SCC with id C1, C2, ... The default roots are H, F, G, A and D, giving five SCCs. Reverse finish order ensures that when a root is processed, every later SCC that could reach it has already been considered at a later finish position and cannot be swallowed incorrectly.',
    },
    tip: { zh: '必须从完成顺序的末尾开始；按原完成顺序扫描会破坏 SCC 划分。', en: 'Start at the end of the finish order; scanning forward would break the SCC partition.' },
  },
  {
    stepId: 'assign',
    title: { zh: '⑨ 第二遍 DFS：节点归入当前 SCC', en: '⑨ Second DFS: assign nodes to the current SCC' },
    explanation: {
      zh: '在转置图上从根出发，沿反向边做 DFS。所有从根可达且尚未分配的节点都属于同一个 SCC；遇到已分配节点就跳过。默认运行中，从 H 只到达 H，从 F 只到达 F，从 G 只到达 G；从 A 可达 B、C，从 D 可达 E，因此得到 {A,B,C} 和 {D,E}。第二遍的 DFS 不会跨到别的 SCC，因为跨分量的反向边会把两个 SCC 合并成更大的强连通区域，与“最大强连通子图”矛盾。',
      en: 'On the transpose, DFS starts at the root and follows reversed edges. Every unassigned node reachable from the root belongs to the same SCC; assigned nodes are skipped. In the default run H reaches only H, F only F, G only G; A reaches B and C, D reaches E, producing {A,B,C} and {D,E}. The second DFS cannot cross into another SCC, because a reverse edge crossing components would merge them into a larger strongly connected region, contradicting maximality.',
    },
    tip: { zh: '第二遍的“可达”是沿反转边；不要拿原图邻接表继续跑。', en: 'Pass-two reachability follows reversed edges; do not keep using the original adjacency list.' },
  },
  {
    stepId: 'complete',
    title: { zh: '⑩ 当前 SCC 完成，继续逆序根', en: '⑩ The current SCC is complete; continue with the next reverse root' },
    explanation: {
      zh: '当第二遍 DFS 栈为空时，从当前根在转置图中可达的所有未分配节点都已归入同一 SCC，当前分量完成。程序回到逆序完成列表，跳过已分配节点，继续下一个根。分量行中的 complete 标记与节点集合来自同一帧，不能由 UI 猜出。',
      en: 'When the second DFS stack empties, every unassigned node reachable from the root in the transpose has joined the same SCC, so the component is complete. The program returns to the reverse finish list, skips assigned nodes and continues with the next root. The complete flag and node set come from the same frame; the UI never guesses them.',
    },
    tip: { zh: '一个 SCC 完成后不要清空已分配集合；它是防止跨 SCC 重复归组的关键。', en: 'Do not clear the assigned set after one SCC; it prevents cross-component reassignment.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑪ 全部 SCC、复杂度与记忆重点', en: '⑪ All SCCs, complexity and memory hooks' },
    explanation: {
      zh: '默认运行得到 C1={H}、C2={F}、C3={G}、C4={A,B,C}、C5={D,E}，共 5 个 SCC。两遍 DFS 各访问每个顶点一次、检查每条边一次，时间复杂度 O(V+E)；空间是 O(V+E) 的原图与反向图邻接表，加上 O(V) 的栈、完成顺序和分量列表。常见错误包括忽略边方向、按完成顺序正向扫描、忘记反转图、把第一遍的 discovered 带到第二遍、用单向链验证 SCC、以及把“已发现”当成“强连通”。',
      en: 'The default run yields C1={H}, C2={F}, C3={G}, C4={A,B,C}, C5={D,E}: five SCCs. Each pass visits every vertex once and inspects every edge once, so time is O(V+E); space is O(V+E) for the original and reversed adjacency lists plus O(V) for the stack, finish order and component lists. Common mistakes include ignoring edge direction, scanning the finish order forward, forgetting to reverse the graph, carrying pass-one discovered into pass two, validating SCC on a one-way chain, and confusing “discovered” with “strongly connected”.',
    },
    tip: { zh: '记法：Kosaraju = 原图完成后序 + 转置图逆序 DFS；两遍都沿各自图的出边，绝不忽略方向。', en: 'Memory hook: Kosaraju = original-graph postorder + transpose-graph DFS in reverse order; each pass follows its own outgoing edges and never ignores direction.' },
  },
];

export const stronglyConnectedComponentsLesson: Lesson = {
  lessonId: 'strongly-connected-components-kosaraju',
  algorithmId: 'scc',
  contentVersion: '1.0.0',
  title: { zh: '强连通分量（Kosaraju 双遍 DFS）', en: 'Strongly connected components (Kosaraju two-pass DFS)' },
  oneLiner: {
    zh: '先记录原图的 DFS 完成顺序，再反转边并按逆序完成第二遍 DFS，逐个得到 SCC。',
    en: 'Record the original DFS finish order, reverse every edge, then run a second DFS in reverse finish order to obtain each SCC.',
  },
  overview: {
    zh: '强连通分量回答“有向图中哪些顶点可以互相到达”。Kosaraju 用两次 DFS：第一遍在原图上记录每个顶点的完成顺序；第二遍把边反转，按完成顺序从后往前选尚未分配的根，在转置图上 DFS，收集到的节点就是一个 SCC。两次 DFS 都是线性工作，因此总时间 O(V+E)。它正确的原因与“压缩图是 DAG、完成顺序给出拓扑逆序”有关，而不是因为“忽略方向后连通”。',
    en: 'Strongly connected components answer “which vertices in a directed graph reach each other”. Kosaraju uses two DFS passes: pass one records each vertex’s finish order on the original graph; pass two reverses edges, scans the finish order backwards for an unassigned root and runs DFS on the transpose; the collected nodes form one SCC. Both passes are linear, so total time is O(V+E). Its correctness follows from the condensation being a DAG and the finish order giving a reverse topological order, not from ignoring edge direction.',
  },
  intuition: {
    zh: '把 SCC 压缩成一个“大节点”，所有跨 SCC 的边只能沿一个方向排列，否则两个 SCC 会互相到达并合并。第一遍 DFS 的后序让“汇端”的 SCC 更晚完成；把顺序反过来，就是从汇端向源端处理。转置图让“原图中能到达根”的节点变成“从根可达”，一次 DFS 正好收集整个 SCC。',
    en: 'Compress every SCC into one super-node; all edges between SCCs must point in one direction, otherwise the two SCCs would reach each other and merge. The first DFS postorder makes “sink-side” SCCs finish later; reversing the order processes them from sinks toward sources. The transpose turns nodes that could reach the root in the original graph into nodes reachable from the root, so one DFS collects the whole SCC.',
  },
  prerequisites: {
    zh: ['知道有向图、入度/出度与邻接表', '理解 DFS 的发现序与完成后序', '知道强连通关系的自反、对称、传递性', '会读 Python 的 dict、set、list 与双层邻接表'],
    en: ['Knowing directed graphs, indegree/outdegree and adjacency lists', 'Understanding DFS discovery order and postorder', 'Knowing that strong connectivity is reflexive, symmetric and transitive', 'Reading Python dict, set, list and nested adjacency lists'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: {
      zh: '第一遍每条有向边检查一次，每个顶点入栈/出栈一次；第二遍在转置图上同样各一次，因此总时间 O(V+E)。空间上原图与反向图邻接表各 O(V+E)，栈、discovered、visited、finish_order 和分量列表各 O(V)。本批次限制 12 个顶点、20 条唯一边，保证教学帧可读。',
      en: 'Pass one inspects each directed edge once and pushes/pops each vertex once; pass two does the same on the transpose, so total time is O(V+E). Space is O(V+E) for each of the original and reversed adjacency lists, and O(V) each for the stack, discovered, visited, finish_order and component lists. This batch caps 12 vertices and 20 unique edges so teaching frames stay readable.',
    },
  },
  steps: STEPS,
  commonMistakes: {
    zh: [
      '把有向图当成无向图，忽略边方向后用连通分量代替 SCC。',
      '第二遍按完成顺序正向扫描，而不是从末尾倒序扫描。',
      '忘记构建反向图，或第二遍仍使用原图邻接表。',
      '把第一遍的 discovered/visited 带到第二遍，导致新根无法启动 DFS。',
      '用单向链 A→B→C 验证，误以为三个节点属于同一 SCC；它应是 3 个 SCC。',
      '把“第一遍已发现”或“同一条环边”直接当成强连通，未做转置图可达性验证。',
    ],
    en: [
      'Treating the directed graph as undirected and using ordinary components instead of SCCs.',
      'Scanning the finish order forward in pass two instead of backwards from the end.',
      'Forgetting to build the transpose, or still using the original adjacency list in pass two.',
      'Carrying pass-one discovered/visited into pass two, so a new root cannot start DFS.',
      'Validating on a one-way chain A→B→C and treating all three as one SCC; it must be 3 SCCs.',
      'Treating “discovered in pass one” or “one cycle edge” as strong connectivity without the transpose reachability check.',
    ],
  },
};

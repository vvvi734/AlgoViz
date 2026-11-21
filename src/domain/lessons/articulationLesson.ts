import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: { zh: '① 初始化：两套时间与一条递归栈', en: '① Initialise: two timestamps and one recursion stack' },
    explanation: {
      zh: '无向图先建成邻接表。disc 记录每个顶点第一次被发现的时间，low 记录它和它的 DFS 子树通过返祖边最早能回到哪个祖先。parent 记录 DFS 父节点，tree_edges、back_edges、articulation、bridges 分别记录树边、返祖边、关节点的桥。四个集合一开始都是空的。',
      en: 'Build the undirected adjacency list first. disc records when a vertex is first discovered; low records the earliest ancestor reachable from that vertex and its DFS subtree through back edges. parent records the DFS parent. tree_edges, back_edges, articulation and bridges start empty and will collect tree edges, back edges, cut vertices and bridges.',
    },
    tip: {
      zh: 'disc 和 low 都是“时间”，但 disc 只看第一次发现，low 看子树能回到的最早祖先。',
      en: 'disc and low are both timestamps, but disc is fixed at discovery while low may fall through a back edge.',
    },
  },
  {
    stepId: 'start-root',
    title: { zh: '② 对每个未访问顶点启动 DFS', en: '② Start DFS at every unseen vertex' },
    explanation: {
      zh: '程序按输入顺序扫描顶点。遇到尚未访问的顶点就把它作为新 DFS 树的根，root_child_count 清零，然后进入递归。非连通图会因此启动多棵 DFS 树；孤立顶点也会成为只有自己的根。',
      en: 'Scan vertices in input order. An unseen vertex becomes the root of a new DFS tree, root_child_count resets and recursion begins. A disconnected graph therefore starts several DFS trees; an isolated vertex becomes a root of its own.',
    },
    tip: {
      zh: '根的条件按“每棵 DFS 树”分别统计，不能把不同根的树孩子数加在一起。',
      en: 'The root condition is counted per DFS tree; child counts from different roots must never be added together.',
    },
  },
  {
    stepId: 'discover',
    title: { zh: '③ 发现顶点：disc 递增，low 先等于 disc', en: '③ Discover: increment disc, initialise low to disc' },
    explanation: {
      zh: '进入顶点 u 时，全局 timer 加一，disc[u] = timer。此时还不知道子树能回到哪里，所以先把 low[u] 设为 disc[u]。顶点被压入 DFS 递归栈，栈中保存的是“已发现但尚未完成”的顶点。',
      en: 'On entering u, the global timer increments and disc[u] = timer. The subtree’s earliest reachable ancestor is not known yet, so low[u] starts equal to disc[u]. The vertex is pushed onto the DFS recursion stack, which holds discovered but unfinished vertices.',
    },
    tip: {
      zh: 'low 初值不是 0，也不是父节点的 disc；它必须先等于自己的 disc。',
      en: 'low does not start at 0 or at the parent’s disc; it must start equal to the vertex’s own disc.',
    },
  },
  {
    stepId: 'inspect',
    title: { zh: '④ 检查邻接边并分类', en: '④ Inspect and classify each incident edge' },
    explanation: {
      zh: '对 u 的每个邻接点 v 检查边 u–v。v 未发现时，这条边会成为 DFS 树边并递归进入 v；v 已发现、v 不是 parent[u] 且 disc[v] < disc[u] 时，它是返回祖先的返祖边；v 正好是父节点时，这条边只是父边，不参与 low 更新。无向边从两端各检查一次是正常的。',
      en: 'For every neighbour v of u, inspect u–v. If v is unseen, the edge becomes a DFS tree edge and recursion enters v. If v is discovered, not parent[u], and disc[v] < disc[u], it is a back edge to an ancestor. If v is exactly the parent, the edge is the parent edge and contributes nothing to low. Seeing an undirected edge from both ends is normal.',
    },
    tip: {
      zh: '父边不是返祖边；把 parent 边当成返祖边会让 low 错误地回退到父节点。',
      en: 'The parent edge is not a back edge; treating it as one would incorrectly lower low to the parent.',
    },
  },
  {
    stepId: 'tree-edge',
    title: { zh: '⑤ 树边：第一次遇到就递归', en: '⑤ Tree edge: first encounter, then recurse' },
    explanation: {
      zh: 'v 第一次被发现时，parent[v] = u，u–v 加入 tree_edges，然后递归 dfs(v)。树边构成 DFS 森林；一个无向图的所有树边数等于 n −（DFS 树棵数）。递归返回后，u 才能使用 v 的 low 值。',
      en: 'When v is first discovered, parent[v] = u, u–v joins tree_edges, and dfs(v) recurses. Tree edges form the DFS forest; for an undirected graph their count is n minus the number of DFS trees. Only after the child returns may u use low[v].',
    },
    tip: {
      zh: '树边先记录，再递归；不要在子节点返回后才补记父节点。',
      en: 'Record the tree edge before recursing; do not fill in the parent only after the child returns.',
    },
  },
  {
    stepId: 'back',
    title: { zh: '⑥ 返祖边：把 low 拉回祖先', en: '⑥ Back edge: pull low back to an ancestor' },
    explanation: {
      zh: '当 v 已发现、v ≠ parent[u] 且 disc[v] < disc[u] 时，边 u–v 是指向祖先的返祖边。它给 u 提供一条绕过父边、回到更早祖先的路径，所以 low[u] = min(low[u], disc[v])。若已发现的 v 是 u 的后代，这条边在子树中早已按返祖边处理过，不能重复记录。',
      en: 'When v is discovered, v ≠ parent[u] and disc[v] < disc[u], edge u–v is a back edge to an ancestor. It gives u a path that bypasses the parent edge and reaches an earlier ancestor, so low[u] = min(low[u], disc[v]). If the discovered v is a descendant of u, that edge was already handled as a back edge inside the subtree and must not be recorded twice.',
    },
    tip: {
      zh: '返祖边用 disc[v] 更新 low[u]，不是 low[v]；v 可能已经完成，low[v] 不再是“从 u 出发”的可达信息。',
      en: 'A back edge updates low[u] with disc[v], not low[v]; v may already be finished, so low[v] is not the reachability information from u.',
    },
  },
  {
    stepId: 'update-low',
    title: { zh: '⑦ 递归返回：把子树的 low 回传', en: '⑦ Return: propagate the subtree low' },
    explanation: {
      zh: 'dfs(v) 返回后，low[u] = min(low[u], low[v])。这条规则表示：u 可以通过树边进入 v，再走 v 子树中的返祖边到达某个祖先。low 值沿递归栈逐层回传，直到根。',
      en: 'After dfs(v) returns, low[u] = min(low[u], low[v]). This says u can enter v by a tree edge and then use a back edge inside v’s subtree to reach an ancestor. The low value propagates back up the recursion stack to the root.',
    },
    tip: {
      zh: 'low 的回传只沿树边；返祖边不产生新的递归返回。',
      en: 'Low propagates along tree edges only; a back edge does not create a new recursive return.',
    },
  },
  {
    stepId: 'cut',
    title: { zh: '⑧ 非根关节点：low[v] ≥ disc[u]', en: '⑧ Non-root cut vertex: low[v] ≥ disc[u]' },
    explanation: {
      zh: '对非根顶点 u，如果它的某个 DFS 树孩子 v 满足 low[v] ≥ disc[u]，那么删除 u 后，v 的子树无法通过返祖边绕过 u 到达 u 的祖先，子树会与图的其他部分断开。此时 u 是关节点。注意只对非根使用这个条件；根没有祖先，必须另用孩子数判断。',
      en: 'For a non-root u, if a DFS tree child v satisfies low[v] ≥ disc[u], then after deleting u, v’s subtree has no back edge bypassing u to an ancestor of u, so the subtree separates from the rest of the graph. Then u is a cut vertex. Use this test only for non-roots; the root has no ancestor and needs a separate child-count test.',
    },
    tip: {
      zh: '等号也算：low[v] = disc[u] 表示 v 的子树最多回到 u 本身，删掉 u 仍然会断开。',
      en: 'Equality counts: low[v] = disc[u] means the subtree can reach u itself but still cannot bypass a deleted u.',
    },
  },
  {
    stepId: 'bridge',
    title: { zh: '⑨ 桥：比关节点更严格的 low[v] > disc[u]', en: '⑨ Bridge: the stricter low[v] > disc[u]' },
    explanation: {
      zh: '同一条树边 u–v 上，若 low[v] > disc[u]，说明 v 的子树连 u 本身都回不到，更没有其他路径绕过这条边。删除 u–v 会使图分裂，因此它是桥。桥一定是 DFS 树边；返祖边和非树边不可能是桥。关节点与桥相关但不等价：关节点看删点，桥看删边。',
      en: 'On the same tree edge u–v, low[v] > disc[u] means v’s subtree cannot even return to u, let alone bypass the edge. Deleting u–v splits the graph, so it is a bridge. A bridge is always a DFS tree edge; back edges and non-tree edges cannot be bridges. Cut vertices and bridges are related but not equivalent: one deletes a vertex, the other an edge.',
    },
    tip: {
      zh: 'low[v] ≥ disc[u] 判点，low[v] > disc[u] 判边；不要把两个不等号混用。',
      en: 'low[v] ≥ disc[u] tests a vertex, low[v] > disc[u] tests an edge; never swap the two inequalities.',
    },
  },
  {
    stepId: 'root',
    title: { zh: '⑩ 根节点：至少两个 DFS 树孩子', en: '⑩ Root: at least two DFS tree children' },
    explanation: {
      zh: '根没有父节点，low[root] 的“回到祖先”语义没有意义，所以不能用 low[child] ≥ disc[root] 判根。正确条件是：根在 DFS 树中至少有 2 个孩子。只有一个孩子时，删除根只是让这个孩子成为新的根，分量数不增加；有两个孩子时，删除根会把不同子树分开。',
      en: 'The root has no parent, so “return to an ancestor” has no meaning for low[root], and low[child] ≥ disc[root] must not be used. The correct condition is at least two DFS tree children. With one child, deleting the root only promotes that child and does not increase the component count; with two children, deleting the root separates different subtrees.',
    },
    tip: {
      zh: '根条件只看树孩子数；即使根的所有 low 条件都成立，单孩子根也不是关节点。',
      en: 'The root test counts tree children only; even if every low comparison holds, a single-child root is not a cut vertex.',
    },
  },
  {
    stepId: 'finish',
    title: { zh: '⑪ 顶点完成，弹栈返回', en: '⑪ Finish the vertex and pop' },
    explanation: {
      zh: 'u 的所有邻接边检查完后，递归栈弹出 u。此时 disc[u] 与 low[u] 已经确定，父节点将用它们判断非根关节点和桥。顶点完成不等于它一定是关节点；只有满足判据的顶点才加入 articulation 集合。',
      en: 'After every incident edge of u has been inspected, u pops from the recursion stack. Its disc[u] and low[u] are now final, and the parent will use them for the non-root cut and bridge tests. Finishing does not imply u is a cut vertex; only vertices satisfying a test join the articulation set.',
    },
    tip: {
      zh: '完成顺序是自底向上的；关节点判定发生在子节点返回父节点时，而不是顶点自己完成时。',
      en: 'Finishing is bottom-up; the cut test happens when a child returns to its parent, not when the vertex itself finishes.',
    },
  },
  {
    stepId: 'done',
    title: { zh: '⑫ 全部 DFS 树结束：结果与复杂度', en: '⑫ All DFS trees done: result and complexity' },
    explanation: {
      zh: '所有顶点都被访问后，articulation 与 bridges 就是最终结果。默认图的两个三角形由桥 C–D 相连，C 与 D 是关节点，C–D 是桥；A、B、E、F 在各自三角形内不造成分裂，G–H 也不产生关节点。一次 DFS 的时间是 O(V+E)：每个顶点进入/完成一次，每条无向边从两个端点各检查一次；空间是 O(V+E) 的邻接表和 O(V) 的递归栈、disc/low/parent 表。',
      en: 'After every vertex is visited, articulation and bridges are final. In the default graph two triangles are joined by bridge C–D: C and D are cut vertices and C–D is a bridge, while A, B, E, F do not split their triangles and G–H adds no cut vertex. One DFS costs O(V+E): each vertex enters and finishes once, and each undirected edge is inspected from both endpoints. Space is O(V+E) for the adjacency list plus O(V) for the recursion stack and disc/low/parent tables.',
    },
    tip: {
      zh: '记忆钩子：非根看孩子 low，根数孩子个数；桥用严格大于，点用大于等于。',
      en: 'Memory hook: non-roots compare a child’s low, roots count children; bridges use strict greater-than, cut vertices use greater-or-equal.',
    },
  },
];

export const articulationLesson: Lesson = {
  lessonId: 'articulation-points-low-link',
  algorithmId: 'articulation',
  contentVersion: '1.0.0',
  title: { zh: '关节点与双连通性（DFS low-link）', en: 'Articulation points and biconnectivity (DFS low-link)' },
  oneLiner: {
    zh: '用一次 DFS 的 disc/low 判断删除哪个顶点会增加连通分量数，并同时找出桥。',
    en: 'Use disc/low from one DFS to find which vertices increase the component count when deleted, and to find bridges at the same time.',
  },
  overview: {
    zh: '关节点（割点）是这样一个顶点：删除它及其关联边后，无向图的连通分量数量增加。朴素做法是对每个顶点删除后重新数分量，代价 O(V(V+E))；DFS low-link 用一次 O(V+E) 的遍历同时算出 disc、low、DFS 树边和返祖边，再用两个判据得到全部关节点与桥。非连通图需要对每个未访问顶点重新启动 DFS，根节点还要使用单独的孩子数条件。',
    en: 'An articulation point (cut vertex) is a vertex whose deletion, together with its incident edges, increases the number of connected components. The naive method deletes each vertex and recounts components, costing O(V(V+E)). DFS low-link computes disc, low, tree edges and back edges in one O(V+E) pass, then applies two tests to obtain every cut vertex and bridge. A disconnected graph restarts DFS at every unseen vertex, and roots need a separate child-count condition.',
  },
  intuition: {
    zh: '把 DFS 树看成一棵家族树：disc 是出生时间，low 是这个家族能通过“返祖边”联系到的最早祖先。若一个孩子的 low 不早于父亲出生，说明这个孩子一离开父亲就再也联系不上更早的祖先；删掉父亲，这个孩子的家族就孤立了。根没有祖先，所以只能看它有几个独立的孩子：至少两个才会在删除根时分裂。桥则更严格：孩子的家族连父亲都回不去，父亲–孩子这条边一删就断。',
    en: 'View the DFS tree as a family tree: disc is birth time, and low is the earliest ancestor the family can reach through a back edge. If a child’s low is not earlier than the parent’s birth, the child cannot reach any earlier ancestor once the parent is gone; deleting the parent isolates that child’s family. A root has no ancestor, so only its number of independent children matters: at least two are needed to split on root deletion. A bridge is stricter: the child’s family cannot even return to the parent, so deleting the parent–child edge disconnects it.',
  },
  prerequisites: {
    zh: ['无向图、邻接表、路径与连通分量', 'DFS 的发现时间与递归栈', '树边、返祖边与父节点的区别', '会读 disc/low 这类逐顶点状态表'],
    en: ['Undirected graphs, adjacency lists, paths and connected components', 'DFS discovery time and recursion stack', 'Tree edges, back edges and parent edges', 'Reading per-vertex state tables such as disc/low'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: {
      zh: '每个顶点恰好被发现并完成一次，每条无向边从两个端点各检查一次，因此时间 O(V+E)。邻接表占 O(V+E)；disc、low、parent 各 O(V)，递归栈最坏 O(V)，树边/返祖边/关节点/桥集合合计 O(V+E)。本课程限制 10 个顶点、16 条唯一边，保证图上数字可读。',
      en: 'Every vertex is discovered and finished once, and every undirected edge is inspected from both endpoints, so time is O(V+E). The adjacency list uses O(V+E); disc, low and parent use O(V) each, the recursion stack is O(V) worst case, and the tree/back/cut/bridge sets total O(V+E). This lesson caps 10 vertices and 16 unique edges so labels stay legible.',
    },
  },
  steps: STEPS,
  commonMistakes: {
    zh: [
      '把根节点也套用 low[v] ≥ disc[u] 判据，导致只有一个孩子的根被误判。',
      '把父边当成返祖边，错误地把 low 降到父节点的 disc。',
      '返祖边用 low[v] 而不是 disc[v] 更新 low[u]，在 v 已完成时得到错误结果。',
      '把桥的条件写成 low[v] ≥ disc[u]，把关节点条件与桥条件混用。',
      '只从一个根启动 DFS，漏掉非连通图的其它分量。',
      '在顶点自己完成时就判定关节点，而不是在子节点返回父节点时检查。',
      '用颜色或图形位置代替 disc/low 数值，无法核对边界条件。',
    ],
    en: [
      'Applying low[v] ≥ disc[u] to the root, which falsely marks a single-child root.',
      'Treating the parent edge as a back edge and lowering low to the parent’s disc.',
      'Updating low[u] with low[v] instead of disc[v] on a back edge when v is already finished.',
      'Writing the bridge test as low[v] ≥ disc[u] and mixing the two inequalities.',
      'Starting DFS from only one root and missing other components of a disconnected graph.',
      'Testing a cut vertex when the vertex itself finishes instead of when a child returns to its parent.',
      'Relying on colour or layout instead of the disc/low numbers, which hides boundary errors.',
    ],
  },
};

import type { Lesson, LessonStep } from './types';

/**
 * Stage 7F Dijkstra course.
 *
 * Step ids are exactly the `lesson_step=` values emitted by the real Python
 * heapq program: init / push / pop / stale / settle / inspect / relax / skip / done.
 * The default run settles A, B, C, E, F, D, G and reconstructs A→B→E→F→G with
 * total weight 7; F is first reached at 6 and later relaxed to 4 by E, which
 * leaves one genuinely stale heap entry.
 */
const DIJKSTRA_STEPS: LessonStep[] = [
  {
    stepId: 'init',
    title: { zh: '① 带权图与距离表：先承认“还不知道”', en: '① Weighted graph and distance table: admit “unknown” first' },
    explanation: {
      zh: '初始化帧先展示带权图的节点、边和边权。每条边不仅有连接关系，还有一个非负权重：走 A–B 要付 2，走 A–C 也要付 2。距离表为每个节点记录“从起点出发目前知道的最近距离”，初始全部是 ∞；previous 全部为空，最小堆为空，没有任何节点已确定。默认图的边是 A–B 2、A–C 2、B–D 4、B–E 1、C–F 4、E–F 1、F–G 3，起点 A，目标 G。',
      en: 'The init frame shows the weighted graph: nodes, edges and edge weights. Each edge has a non-negative cost as well as a connection: A–B costs 2 and A–C costs 2. The distance table stores the best known distance from the start for every node; all values begin at ∞. previous is empty, the min-heap is empty, and no node is settled. The default edges are A–B 2, A–C 2, B–D 4, B–E 1, C–F 4, E–F 1, F–G 3, with start A and target G.',
    },
    tip: { zh: '∞ 在 Python 里是 float("inf")，写入 JSON 前会安全转换为 null；界面显示为 ∞。', en: 'In Python, ∞ is float("inf"); it is converted to JSON null at the snapshot boundary and displayed as ∞.' },
  },
  {
    stepId: 'start',
    title: { zh: '② 起点入堆：候选按距离排队', en: '② Push the start: candidates ordered by distance' },
    explanation: {
      zh: '起点的距离被写成 0，加入 discovered，然后 heapq.heappush 把 (0, 序号, A) 放进最小堆。堆不是按“谁先来”排序，而是按距离最小优先；距离相同时用稳定的序号打破平局。此时 A 只是候选，还没确定最短距离；距离表 A=0，其余仍是 ∞。',
      en: 'The start distance becomes 0, it joins discovered, and heapq.heappush inserts (0, sequence, A) into the min-heap. The heap orders by smallest distance, not arrival time; a stable sequence number breaks distance ties. A is only a candidate, not yet settled: A=0 in the table and every other node is still ∞.',
    },
    tip: { zh: '优先队列保存候选，不保存“最终答案”。', en: 'A priority queue stores candidates, not final answers.' },
  },
  {
    stepId: 'pop',
    title: { zh: '③ 弹出堆顶：最小候选进入检查', en: '③ Pop the heap top: the smallest candidate is inspected' },
    explanation: {
      zh: 'heapq.heappop 取出当前距离最小的条目。弹出后先不要急着宣布它最短：必须比较条目里的距离和距离表里的当前距离。如果两者一致且节点尚未确定，这个候选才是有效的。演示把 pop 与 settle 分成两帧，正是为了让你看见这个检查门槛。',
      en: 'heapq.heappop removes the entry with the smallest distance. Do not declare it shortest immediately: compare the entry distance with the current distance table value. The candidate is valid only if they agree and the node is not settled yet. The demo separates pop from settle so you can see that gate.',
    },
    tip: { zh: '“弹出”是数据结构的动作，“确定”是算法语义；两者不是同一帧。', en: 'Popping is a data-structure action; settling is algorithm semantics. They are not the same frame.' },
  },
  {
    stepId: 'stale',
    title: { zh: '④ 过期堆条目：同一节点的旧候选', en: '④ Stale heap entry: an older candidate for the same node' },
    explanation: {
      zh: 'Dijkstra 不做 decrease-key，而是直接压入新的更小距离。旧条目仍然留在堆里，于是同一个节点可能在堆中出现两次。弹出旧条目时，它的距离大于距离表当前值，或者节点已经 settled；这一帧记录 stale 并直接丢弃，绝不重复处理节点。默认图中 F 先从 C 得到距离 6，后来 E 把它松弛到 4，堆里因此同时有 (6,F) 和 (4,F)；弹出 (6,F) 时就是真实的过期条目。',
      en: 'Dijkstra does not decrease a key in place; it pushes a new smaller distance. The old entry stays in the heap, so a node can appear twice. When an old entry is popped, its distance is larger than the current table value or the node is already settled; the frame records stale and discards it without processing the node again. In the default graph, F first gets 6 through C and is later relaxed to 4 by E, so the heap contains both (6,F) and (4,F); popping (6,F) is a real stale entry.',
    },
    tip: { zh: '过期条目不是错误，而是“允许重复候选”的正常代价。', en: 'A stale entry is not a bug; it is the normal cost of allowing duplicate candidates.' },
  },
  {
    stepId: 'settle',
    title: { zh: '⑤ 确定最短距离：为什么可以不再变', en: '⑤ Settle the shortest distance: why it can no longer decrease' },
    explanation: {
      zh: '只有弹出的是有效最小候选时，节点才加入 settled，并追加到 visitOrder。为什么此时能确定？因为堆里剩下的候选距离都不小于它，而所有边权非负，任何绕路都不可能把距离变得更小。默认运行先确定 A(0)，再确定 B(2) 与 C(2)；距离相同时按稳定的堆条目序号处理，但两者都是正确的最短距离。',
      en: 'Only when the popped candidate is valid and minimal does the node join settled and visitOrder. Why is it safe now? Every remaining heap candidate is at least as large, and all edge weights are non-negative, so no detour can make the distance smaller. The default run settles A(0), then B(2) and C(2); equal distances are resolved by the stable heap sequence, and both values are still correct shortest distances.',
    },
    tip: { zh: '“已确定”来自真实弹出顺序，不是按距离表把节点从大到小排序。', en: '“Settled” comes from the real pop order, not from sorting the table.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '⑥ 检查带权出边：候选 = 当前距离 + 边权', en: '⑥ Inspect a weighted edge: candidate = current distance + weight' },
    explanation: {
      zh: '节点确定后，程序按邻接表顺序检查它的每条出边。当前边在画布上高亮，边上的数字就是权重；目标节点的候选距离 = 当前已确定距离 + 这条边的权重。无向图的边会从两端各检查一次，所以后面看到反向边是正常的；有向图只检查 from → to 方向。',
      en: 'After a node is settled, the program inspects each outgoing edge in adjacency order. The current edge is highlighted and its number is the weight; the candidate distance to the neighbour is current settled distance + this edge weight. Undirected edges are inspected from both ends, so a reverse inspection later is normal; a directed graph only inspects from → to.',
    },
    tip: { zh: '候选距离不是目标节点“已经走了这么远”，而是“如果经由当前节点走，会是多少”。', en: 'The candidate is not how far the neighbour has travelled; it is what the distance would be if approached through the current node.' },
  },
  {
    stepId: 'relax',
    title: { zh: '⑦ 松弛：把旧距离和前驱一起改掉', en: '⑦ Relax: replace both the distance and the previous pointer' },
    explanation: {
      zh: '如果候选距离严格小于目标节点当前距离，就执行松弛：距离变小，previous 改成当前节点，并把新候选压入堆。画布同时显示目标节点的旧距离 → 新距离，距离表与优先队列也在同一帧更新。默认图中 A 先让 B=2、C=2；B 再让 E=3；E 让 F=4，F 的旧值 6 被改成 4，previous 从 C 改成 E。松弛不是“把边画成最短路径”，而是改写一张距离表。',
      en: 'If the candidate is strictly smaller than the neighbour’s current distance, relax: decrease the distance, set previous to the current node, and push the new candidate. The canvas shows the old → new distance, and the distance table and heap update in the same frame. In the default graph A sets B=2 and C=2; B sets E=3; E sets F=4, replacing the old 6 and changing previous from C to E. Relaxing does not paint a shortest path; it rewrites a distance table.',
    },
    tip: { zh: '只有严格变小才更新；相等时保留原前驱，避免无意义抖动。', en: 'Update only on a strict decrease; on equality keep the old previous pointer to avoid noise.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑧ 不松弛：候选没有严格更小', en: '⑧ Skip: the candidate is not strictly smaller' },
    explanation: {
      zh: '如果候选距离大于或等于当前距离，就保留原距离和原前驱，并记录 skip。目标已经 settled 时也直接跳过，因为它的最短距离不会再变。默认图中 C 检查 C–F 时，候选是 2+4=6，而 F 已经被 E 松弛到 4，所以这一帧 skip；这不是失败，而是“这条边没有带来改进”的真实证据。',
      en: 'If the candidate is greater than or equal to the current distance, keep the old distance and previous pointer and record skip. A settled neighbour is skipped too, because its shortest distance cannot change. In the default graph C inspects C–F with candidate 2+4=6 while F is already 4 through E, so this frame skips; it is not a failure, just real evidence that this edge brings no improvement.',
    },
    tip: { zh: 'skip 和 relax 是同一判断的两个分支，都必须来自真实比较。', en: 'skip and relax are the two branches of one real comparison.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑨ 堆空、路径恢复与边界', en: '⑨ Empty heap, path restoration and boundaries' },
    explanation: {
      zh: '堆清空后，Dijkstra 结束。程序从目标 G 出发，沿 previous 反向走到 A，再反转得到 A → B → E → F → G，路径总权重 7；这不是预先写好的字符串，而是真实 previous 指针的恢复结果。默认运行确定顺序是 A、B、C、E、F、D、G。若目标不可达，路径为空、距离为 ∞（JSON 中为 null）；起点等于目标时路径只有起点，权重 0；空图只产生 init 与 done 两帧。复杂度：邻接表 + 堆为 O((V+E) log V)，空间 O(V)；朴素数组选最小值为 O(V²)。',
      en: 'When the heap empties, Dijkstra stops. The program walks backwards from target G through previous to A, reverses it to A → B → E → F → G, and reports total weight 7. That string is reconstructed from real previous pointers, not prewritten. The default settlement order is A, B, C, E, F, D, G. If the target is unreachable, the path is empty and the distance is ∞ (JSON null); if start equals target, the path is just the start with weight 0; an empty graph emits only init and done. Complexity: adjacency list + heap is O((V+E) log V) time and O(V) space; repeatedly scanning an array for the minimum is O(V²).',
    },
    tip: { zh: 'Dijkstra 不适用于负权边：settled 的“不会再变小”论证依赖边权非负。', en: 'Dijkstra does not work with negative weights: the “cannot decrease after settling” argument relies on non-negative edges.' },
  },
];

const MISTAKES = {
  zh: [
    '把 discovered、在堆中、settled 混为一谈；三者是不同状态。',
    '弹出堆顶后不检查是否过期，直接重复处理已经确定的节点。',
    '松弛时只改距离、不改 previous，最后无法恢复真实路径。',
    '候选距离相等时仍然改写 previous，造成没有必要的抖动。',
    '把 ∞ 直接写进 JSON；JSON 没有 Infinity，必须转换为 null 或明确的不可达表示。',
    '对负权图运行 Dijkstra，得到看似成功但错误的最短距离。',
    '把 Python set 的迭代顺序当作邻居顺序；教学顺序必须来自固定邻接表。',
    '把“搜索路径”当成唯一最短路径，或忽略不可达目标。',
  ],
  en: [
    'Mixing discovered, in-heap and settled; they are different states.',
    'Popping the heap top without a staleness check, then processing a settled node again.',
    'Changing the distance but not previous during relax, so the final path cannot be restored.',
    'Rewriting previous when the candidate distance is equal, causing needless churn.',
    'Writing ∞ straight into JSON; JSON has no Infinity, so use null or an explicit unreachable representation.',
    'Running Dijkstra on negative weights and accepting a plausible but wrong distance.',
    'Using Python set iteration order as neighbour order; teaching order must come from the fixed adjacency list.',
    'Treating one search path as the unique shortest path, or ignoring an unreachable target.',
  ],
};

export const dijkstraLesson: Lesson = {
  lessonId: 'dijkstra-weighted-shortest-path',
  algorithmId: 'dijkstra',
  contentVersion: '1.0.0',
  title: { zh: 'Dijkstra 最短路径', en: 'Dijkstra shortest paths' },
  oneLiner: {
    zh: '在非负边权图中，用距离表、松弛和最小堆求出起点到每个可达节点的最短距离。',
    en: 'Find shortest distances from one source in a non-negative weighted graph using a distance table, relaxation and a min-heap.',
  },
  overview: {
    zh: '最短路径问题问的是：从起点出发，沿真实存在的边走到目标，路径总权重最小是多少？带权图给每条边一个非负成本，例如距离、时间或费用；节点数相同，边权不同，答案就不同。Dijkstra 维护一张距离表，反复选择当前距离最小的候选节点并确定它，然后检查它的出边，尝试用更小的候选距离更新邻居。它不是把所有路径枚举一遍，而是用最小堆保证每次先处理最有希望的候选。',
    en: 'A shortest-path problem asks: starting at a source and following real edges to a target, what is the smallest total weight? A weighted graph gives each edge a non-negative cost such as distance, time or money; the same nodes with different weights have different answers. Dijkstra keeps a distance table, repeatedly settles the smallest candidate, inspects its outgoing edges, and tries to improve neighbours with a smaller candidate. It does not enumerate every path; the min-heap ensures the most promising candidate is handled first.',
  },
  intuition: {
    zh: '把距离表想成一张“目前已知的最省路线报价单”，松弛就是拿到一条新线路后重新报价：只有更便宜才改。最小堆是报价单的待办队列，永远先处理当前最便宜的候选。已经确定的节点像已经盖章的报价，非负边权保证后续绕路不会让报价更低。前驱指针则像每个站点记录的“上一站”，最后从目标一路倒着走回起点，就恢复出最短路径。',
    en: 'Think of the distance table as the best known quote for reaching each station; relaxing means re-quoting after discovering a new route, and only a cheaper quote replaces the old one. The min-heap is the quote to-do list, always handling the cheapest candidate first. A settled node is a stamped quote, and non-negative weights guarantee that a later detour cannot beat it. The previous pointer records the “previous station”; walking backwards from the target restores the shortest path.',
  },
  prerequisites: {
    zh: ['知道图、顶点、边与邻接表', '理解有向边与无向边的区别', '会读 Python 的 dict、list 与 heapq 基本操作', '理解 Big-O 记号'],
    en: ['Knowing graphs, vertices, edges and adjacency lists', 'Understanding directed versus undirected edges', 'Reading Python dict, list and basic heapq operations', 'Understanding Big-O notation'],
  },
  complexity: {
    time: 'O((V + E) log V)',
    space: 'O(V)',
    note: {
      zh: '用邻接表保存图，每个顶点最多确定一次，每条有向边最多检查一次；每次堆操作是 O(log V)，所以总时间是 O((V+E) log V)。若用朴素数组每次线性扫描最小候选，时间会退化为 O(V²)。空间上距离表、previous、settled、discovered 和堆最多各保存 O(V) 条（堆在最坏情况下会因为重复候选超过 V，但仍然受边数约束）。本阶段把节点限制为 20、边限制为 40，堆条目上限为 64。',
      en: 'With an adjacency list, each vertex is settled at most once and each directed edge is inspected at most once; each heap operation costs O(log V), so total time is O((V+E) log V). Scanning an array for the minimum instead degrades to O(V²). The distance table, previous pointers, settled set, discovered set and heap each use O(V) storage (the heap can exceed V because of duplicate candidates, but is bounded by edges). This stage caps nodes at 20, edges at 40 and heap entries at 64.',
    },
  },
  steps: DIJKSTRA_STEPS,
  commonMistakes: MISTAKES,
};

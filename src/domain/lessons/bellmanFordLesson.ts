import type { Lesson, LessonStep } from './types';

/**
 * G1 Bellman-Ford course.
 *
 * Step ids match the real Python `lesson_step=` values:
 * init / round / inspect / relax / skip / early-exit / negative-cycle / done.
 */
const BELLMAN_STEPS: LessonStep[] = [
  {
    stepId: 'init',
    title: { zh: '① 单源距离表：起点为 0，其余为 ∞', en: '① Single-source table: start 0, everything else ∞' },
    explanation: {
      zh: 'Bellman-Ford 只求一个起点的最短路径。初始化距离表：dist[start]=0，其余节点为 ∞；previous 全部为空。默认图是有向图：A→B 4、A→C 1、C→B −2、B→D 2、C→D 5、D→E 1、C→E 8。它含负权边，但不存在负权环。与 Dijkstra 不同，算法不选“当前最小节点”，而是每轮把所有边都检查一遍。',
      en: 'Bellman-Ford solves a single source. Initialise the table with dist[start]=0 and ∞ for every other node; all previous pointers are empty. The default graph is directed: A→B 4, A→C 1, C→B −2, B→D 2, C→D 5, D→E 1, C→E 8. It has negative edges but no negative cycle. Unlike Dijkstra, it does not repeatedly pick the smallest node; every round inspects every edge.',
    },
    tip: { zh: '距离表只有一行“起点到各节点”，不是 Floyd 的二维矩阵。', en: 'The table is one row “start to each node”, not Floyd’s 2-D matrix.' },
  },
  {
    stepId: 'round',
    title: { zh: '② 最多 V−1 轮：每一轮都扫全部边', en: '② At most V−1 rounds: every round scans every edge' },
    explanation: {
      zh: '一轮开始会清空“本轮是否更新”的标记，然后按固定边序检查。为什么最多 V−1 轮？一条没有重复节点的简单最短路径最多包含 V−1 条边；每轮至少能把它多确定一条边，所以 V−1 轮足够。默认 5 个节点，最多 4 轮；默认数据在第 2 轮就没有更新，因此会提前结束。',
      en: 'A round clears the “updated this round” flag, then inspects edges in a fixed order. Why at most V−1 rounds? A simple shortest path without repeated nodes has at most V−1 edges; each round can settle at least one more edge, so V−1 rounds suffice. The default 5 nodes allow 4 rounds; the default data stops improving in round 2, so it exits early.',
    },
    tip: { zh: '轮次是“松弛的批次”，不是节点访问顺序；不要和 Dijkstra 的 settle 混淆。', en: 'A round is a relaxation batch, not a node visit order; do not confuse it with Dijkstra’s settle.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '③ 检查当前边：候选 = dist[u] + w', en: '③ Inspect an edge: candidate = dist[u] + w' },
    explanation: {
      zh: '每条边按 from→to 检查。先看起点 u 是否可达：若 dist[u] 还是 ∞，就无法从源点走到 u，这条边本帧直接跳过，候选距离不存在。若 u 可达，候选就是 dist[u] + 边权。画布高亮当前边和它的两个端点，距离表同时显示每个节点的当前值。',
      en: 'Each edge is inspected from→to. First check whether u is reachable: if dist[u] is still ∞, the source cannot reach u, so this edge is skipped and no candidate exists. If u is reachable, candidate = dist[u] + edge weight. The view highlights the edge and its endpoints while the table shows each node’s current value.',
    },
    tip: { zh: '负权边完全可以参与候选计算；Bellman-Ford 正是为它设计的。', en: 'Negative weights are allowed in the candidate; Bellman-Ford is designed for them.' },
  },
  {
    stepId: 'relax',
    title: { zh: '④ 松弛成功：距离与前驱一起改', en: '④ Relax succeeds: update distance and predecessor' },
    explanation: {
      zh: '候选严格小于 dist[v] 时，写入新距离，previous[v]=u，并记录旧值 → 新值。默认第 1 轮：A 让 B=4、C=1；C 让 B=−1；B 让 D=1；D 让 E=2；C→E 的 8 被跳过。松弛后的值在同一轮后续边中立即生效，所以边的检查顺序会影响“本轮内能传播多远”，但不会影响最终正确性。',
      en: 'When the candidate is strictly smaller than dist[v], write the new distance, set previous[v]=u, and record old → new. Default round 1: A sets B=4 and C=1; C improves B to −1; B sets D=1; D sets E=2; C→E 8 is skipped. A relaxed value is visible to later edges in the same round, so edge order affects how far one round propagates, but not the final correctness.',
    },
    tip: { zh: '负权让 C→B 能把 B 从 4 改成 −1；这是 Dijkstra 不能安全做到的。', en: 'The negative C→B edge changes B from 4 to −1, which Dijkstra cannot safely do.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑤ 不更新：候选没有严格更小', en: '⑤ No update: the candidate is not strictly smaller' },
    explanation: {
      zh: '候选不小于当前距离时，保留原距离和前驱。与 Floyd 一样，这一帧仍然记录“检查过了”。注意：Bellman-Ford 的 skip 是本轮结论，不是永久结论；下一轮仍会重新检查同一条边，因为其他节点的距离可能已经变小。',
      en: 'When the candidate is not smaller, keep the distance and predecessor. As in Floyd, the frame still records that the edge was checked. A Bellman-Ford skip is a conclusion for this round, not forever: the next round checks the same edge again because other distances may have decreased.',
    },
    tip: { zh: '不要把“本轮没更新”误读成“这条边以后都没用”。', en: 'Do not read “no update this round” as “this edge will never matter”.' },
  },
  {
    stepId: 'early-exit',
    title: { zh: '⑥ 整轮无更新 → 提前结束', en: '⑥ A whole round with no update → early exit' },
    explanation: {
      zh: '如果一轮检查完所有边，updatedInRound 仍为 false，说明没有任何距离还能变小。此时剩余轮次不可能再改变结果，可以提前退出。默认运行第 1 轮有更新，第 2 轮没有更新，所以第 2 轮结束后立即提前结束；这不是“少跑了一轮导致错误”，而是正确的不动点判断。',
      en: 'If a whole round inspects every edge and updatedInRound remains false, no distance can decrease. Remaining rounds cannot change the answer, so the algorithm exits early. The default run updates in round 1 and not in round 2, so it exits right after round 2. This is a correct fixed-point test, not a missing round that breaks the answer.',
    },
    tip: { zh: '提前结束的条件是“整轮零更新”，不是“某一轮更新变少”。', en: 'Early exit requires zero updates in a whole round, not merely fewer updates.' },
  },
  {
    stepId: 'negative-cycle',
    title: { zh: '⑦ 第 V−1 轮后仍能松弛 = 可达负权环', en: '⑦ Still relaxable after V−1 rounds = reachable negative cycle' },
    explanation: {
      zh: '完成 V−1 轮后，再检查所有边：若 dist[u] 有限，且 dist[v] 仍大于 dist[u]+w，说明还能继续变小。沿这个改进关系可以回到某个已访问节点，形成负权环。关键细节：只从有限距离的 u 出发；从起点根本不可达的负权环不会被误报。默认图没有负权环；单独测试用 A→B→C→B 的环触发，另一个测试把负环放在与起点不连通的子图里，确认不会误报。',
      en: 'After V−1 rounds, inspect every edge again: if dist[u] is finite and dist[v] is still greater than dist[u]+w, the distance can decrease further. Following these improvements must eventually revisit a node, forming a negative cycle. Key detail: only finite-distance u are considered; a negative cycle unreachable from the start is not reported. The default graph has no cycle; one test triggers it with A→B→C→B, and another puts a negative cycle in a component disconnected from the start to prove no false positive.',
    },
    tip: { zh: '“有限距离”是防止不可达负环误报的关键守卫。', en: 'The finite-distance guard is what prevents false positives from unreachable cycles.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑧ 最终距离、路径恢复与复杂度', en: '⑧ Final distances, path recovery and complexity' },
    explanation: {
      zh: '没有负权环时，距离表就是最终答案；从目标沿 previous 反向走回起点即可恢复路径。默认 A→E 得到 A → C → B → D → E，最短距离 2。复杂度：最多 V−1 轮，每轮检查 E 条边，所以时间 O(VE)；距离表、前驱和少量辅助变量是 O(V) 空间。与 Dijkstra 的核心区别：Bellman-Ford 允许负权边、用多轮全边松弛、能检测负权环；Dijkstra 用最小堆和非负边权换取更快的 O((V+E) log V)。',
      en: 'Without a negative cycle, the distance table is final; walk previous backwards from the target to recover the path. Default A→E gives A → C → B → D → E with distance 2. Complexity: at most V−1 rounds over E edges, so O(VE) time; distance, predecessor and a few helpers use O(V) space. The key difference from Dijkstra: Bellman-Ford allows negative edges, relaxes all edges over multiple rounds and detects negative cycles; Dijkstra uses a min-heap and non-negative weights for a faster O((V+E) log V).',
    },
    tip: { zh: '记忆：Dijkstra 选最小候选，Bellman-Ford 扫全部边；一个快但不能负权，一个慢但能负权。', en: 'Remember: Dijkstra picks the smallest candidate; Bellman-Ford scans every edge. One is faster but needs non-negative weights; the other is slower but supports negatives.' },
  },
];

export const bellmanFordLesson: Lesson = {
  lessonId: 'bellman-ford-single-source',
  algorithmId: 'bellman-ford',
  contentVersion: '1.0.0',
  title: { zh: 'Bellman-Ford 最短路径', en: 'Bellman-Ford shortest paths' },
  oneLiner: {
    zh: '通过最多 V−1 轮全边松弛求单源最短路径，支持负权边并检测从起点可达的负权环。',
    en: 'Find single-source shortest paths with at most V−1 all-edge relaxation rounds, supporting negative weights and detecting reachable negative cycles.',
  },
  overview: {
    zh: 'Bellman-Ford 的核心不是“每次选最小节点”，而是“反复用所有边修正距离”。每一轮都尝试对每条边做松弛：如果从 u 绕到 v 能让 dist[v] 变小，就更新 dist[v] 和 previous[v]。一条不含重复节点的最短路径最多有 V−1 条边，因此 V−1 轮足以让所有可达最短距离传播到位。若第 V−1 轮后仍有边能继续松弛，就说明存在从起点可达的负权环。它的实现比 Dijkstra 简单、适用面更广，但 O(VE) 更慢。',
    en: 'Bellman-Ford is not “repeatedly pick the smallest node”; it repeatedly corrects distances using every edge. Each round tries to relax each edge: if going through u can make dist[v] smaller, update dist[v] and previous[v]. A shortest path without repeated nodes has at most V−1 edges, so V−1 rounds are enough for every reachable distance to propagate. If an edge can still relax after round V−1, a negative cycle is reachable from the start. It is simpler and more general than Dijkstra, but its O(VE) is slower.',
  },
  intuition: {
    zh: '把每一轮想成“把所有路线报价重新核对一遍”。第 1 轮只能发现最多经过 1 条边的改进，第 2 轮能发现最多经过 2 条边的改进，依此类推；V−1 轮后，任何简单最短路径的边数都用完了。提前结束相当于“这一轮没有任何报价变便宜”，说明已经到不动点。负权环则像一个能不断降价的循环，永远到不了不动点。',
    en: 'Think of each round as re-checking every route quote. Round 1 can discover improvements using at most one edge, round 2 at most two edges, and so on; after V−1 rounds, any simple shortest path has run out of edges. Early exit means “no quote got cheaper this round”, so the fixed point is reached. A negative cycle is a loop that keeps cutting the price and never reaches a fixed point.',
  },
  prerequisites: {
    zh: ['理解有向图与边权', '会读距离表与前驱指针', '理解“松弛”是候选距离比较', '知道负权边与负权环的区别'],
    en: ['Understanding directed graphs and edge weights', 'Reading a distance table and previous pointers', 'Understanding relaxation as a candidate comparison', 'Knowing the difference between a negative edge and a negative cycle'],
  },
  complexity: {
    time: 'O(VE)',
    space: 'O(V)',
    note: {
      zh: '最多 V−1 轮，每轮按固定顺序检查 E 条边，因此最坏时间是 O(VE)；若提前结束，实际轮数更少。距离表、previous、当前边和少量计数器是 O(V+E) 输入之外的 O(V) 辅助空间。与 Dijkstra 的 O((V+E) log V) 相比，Bellman-Ford 用更多时间换取负权边支持和负权环检测能力；在稀疏、非负权图上通常不如 Dijkstra。',
      en: 'At most V−1 rounds, each inspecting E edges in a fixed order, gives O(VE) worst-case time; early exit reduces the actual number of rounds. The distance table, previous pointers, current edge and a few counters use O(V) auxiliary space beyond the O(V+E) input. Compared with Dijkstra’s O((V+E) log V), Bellman-Ford spends more time to support negative edges and detect negative cycles; on sparse non-negative graphs it is usually slower.',
    },
  },
  steps: BELLMAN_STEPS,
  commonMistakes: {
    zh: [
      '把“最多 V−1 轮”理解成“必须跑满 V−1 轮”；整轮无更新时应提前结束。',
      '检测负权环时也检查 dist[u]=∞ 的边，从而把不可达负环误报为可达。',
      '松弛只改距离、不改 previous，最后无法恢复路径。',
      '候选相等时仍更新前驱，制造无意义抖动。',
      '认为同一轮内后面的边看不到前面的更新；真实实现会立即使用新距离。',
      '把负权边直接判成负权环，忽略“回到自身且总权重为负”的条件。',
      '把 Bellman-Ford 当作 Dijkstra 的等价替代；两者复杂度和适用条件不同。',
    ],
    en: [
      'Reading “at most V−1 rounds” as “must run all V−1 rounds”; exit early when a whole round has no update.',
      'Checking edges with dist[u]=∞ during cycle detection, which falsely reports an unreachable negative cycle.',
      'Changing the distance without updating previous, so the path cannot be reconstructed.',
      'Updating previous on an equal candidate, causing needless churn.',
      'Assuming later edges in the same round cannot see earlier updates; the real implementation uses the new distance immediately.',
      'Treating a negative edge as a negative cycle, ignoring the “returns to itself with negative total” condition.',
      'Treating Bellman-Ford as an interchangeable replacement for Dijkstra; their complexity and conditions differ.',
    ],
  },
};

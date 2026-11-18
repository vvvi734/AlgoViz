import type { Lesson, LessonStep } from './types';

/**
 * G1 Floyd-Warshall course.
 *
 * Step ids match the real Python `lesson_step=` values exactly:
 * init / k / update / skip / negative-cycle / done.
 */
const FLOYD_STEPS: LessonStep[] = [
  {
    stepId: 'init',
    title: { zh: '① 先建一张全点对距离矩阵', en: '① Start from an all-pairs distance matrix' },
    explanation: {
      zh: 'Floyd-Warshall 求的是任意两点之间的最短距离，因此初始化一张 V×V 矩阵。对角线 dist[i][i]=0；直连边 dist[i][j]=边权；其余全部为 ∞。previous[i][j] 记录“从 i 到 j 的最优路径上，j 的前一站”，直连边先记为 i。默认图是有向图：A→B 4、A→C 1、C→B −2、B→D 2、C→D 5、D→E 1、E→C 2。有负权边，但没有负权环。',
      en: 'Floyd-Warshall answers every pair at once, so it starts from a V×V matrix. The diagonal dist[i][i]=0, direct edges hold their weights, and every other cell is ∞. previous[i][j] stores the station before j on the best known i→j path; direct edges start with i. The default graph is directed: A→B 4, A→C 1, C→B −2, B→D 2, C→D 5, D→E 1, E→C 2. It has negative edges but no negative cycle.',
    },
    tip: { zh: '矩阵是算法的主体数据；图只是解释矩阵的来源，不是另一套状态。', en: 'The matrix is the algorithm’s main data; the graph only explains where the cells came from.' },
  },
  {
    stepId: 'k',
    title: { zh: '② 固定中间节点 k：允许绕行', en: '② Fix intermediate node k: allow a detour' },
    explanation: {
      zh: '外层循环选择 k，表示这一轮允许路径经过 k。k 不是起点也不是终点，而是“可以使用的中间站”。对每个 i、j，程序比较“原来直接/已知的 dist[i][j]”与“先到 k 再到 j 的 dist[i][k]+dist[k][j]”。三个循环的次序固定为 k → i → j，这是动态规划的子问题顺序，不是为了动画而拆出来的。',
      en: 'The outer loop chooses k, meaning paths may now use k as an intermediate station. k is neither the source nor the target; it is the newly allowed stop. For every i and j, the program compares the old dist[i][j] with dist[i][k]+dist[k][j]. The loop order is fixed as k → i → j, which is the dynamic-programming subproblem order, not an animation device.',
    },
    tip: { zh: '记忆：k 是“允许使用的新中转站”，不是当前起点。', en: 'Remember: k is the newly allowed transfer station, not the current source.' },
  },
  {
    stepId: 'update',
    title: { zh: '③ 严格更小才写入新值', en: '③ Write only on a strict improvement' },
    explanation: {
      zh: '若 dist[i][k]+dist[k][j] 严格小于 dist[i][j]，就把这个候选写入矩阵，并把 previous[i][j] 改成 previous[k][j]，因为新路径的最后一段来自 k→j 的最优路径。画布同时标出 i、j、k 和两条“经过 k”的边；矩阵格显示旧值 → 新值。默认图中 k=C 时，A→B 的 4 会被 A→C→B 的 −1 取代；k=B 时，A→D 会被改进到 1。',
      en: 'If dist[i][k]+dist[k][j] is strictly smaller than dist[i][j], write the candidate and set previous[i][j] to previous[k][j], because the last leg comes from the best k→j path. The view marks i, j, k and the two edges through k; the cell shows old → new. In the default graph, k=C replaces A→B 4 with A→C→B −1, and k=B later improves A→D to 1.',
    },
    tip: { zh: '前驱来自 k 那一行，不是直接把 previous[i][j] 改成 k。', en: 'The predecessor comes from the k row, not by blindly setting previous[i][j] to k.' },
  },
  {
    stepId: 'skip',
    title: { zh: '④ 不更小就保留原值', en: '④ Keep the cell when the candidate is not smaller' },
    explanation: {
      zh: '候选等于或大于当前值时，不更新矩阵，也不改 previous。矩阵中仍然高亮当前 i/j 格，让学习者看到“这一次比较被真实执行了，但结论是不改进”。未更新的比较同样重要：它们证明算法确实检查了所有组合，而不是只展示成功案例。',
      en: 'When the candidate is equal or larger, neither the matrix nor previous changes. The current i/j cell is still highlighted so the learner sees that the comparison really ran and concluded “no improvement”. Skipped comparisons matter too: they prove every combination was checked, not just the successes.',
    },
    tip: { zh: '相等时不更新，避免制造两套同样好但不同的前驱。', en: 'Do not update on equality; it avoids two equally good but different predecessor chains.' },
  },
  {
    stepId: 'negative-cycle',
    title: { zh: '⑤ 对角线为负 = 负权环', en: '⑤ A negative diagonal means a negative cycle' },
    explanation: {
      zh: '三重循环结束后，如果某个 dist[i][i] < 0，说明从 i 出发绕一圈回到 i 的总权重为负，最短路径可以无限绕圈变小，因此“最短距离”没有定义。默认图只有负权边、没有负权环，所以不会出现这一帧；测试会用 B→C→B 的负环单独触发。检测只看对角线，不能把普通负权边误判成负权环。',
      en: 'After the triple loop, dist[i][i] < 0 means a round trip from i back to i has negative total weight. The shortest walk could loop forever and keep decreasing, so no finite shortest distance exists. The default graph has negative edges but no negative cycle, so this frame does not appear; a separate test triggers it with B→C→B. Detection uses the diagonal, so a normal negative edge is not misreported.',
    },
    tip: { zh: '负权边 ≠ 负权环；只有“回到自己”且总权重为负才是环。', en: 'A negative edge is not a negative cycle; the cycle must return to itself with negative total weight.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑥ 全源矩阵与路径恢复', en: '⑥ All-pairs matrix and path recovery' },
    explanation: {
      zh: '所有 k 处理完后，矩阵的每个格子就是从 i 到 j 的最短距离（不可达为 ∞）。从 start 行沿 previous 反向恢复目标路径：默认 A→E 得到 A → C → B → D → E，总权重 2。复杂度：时间 O(V³)，因为三层循环各 O(V)；空间 O(V²)，因为要保存距离矩阵和前驱矩阵。若只有负权边、没有负权环，矩阵仍然正确；若有负权环，只报告环，不输出有限路径。',
      en: 'After every k, each cell is the shortest i→j distance (∞ if unreachable). Recover the target path by walking previous backwards from the start row: default A→E gives A → C → B → D → E with weight 2. Complexity: O(V³) time because there are three O(V) loops, and O(V²) space for the distance and predecessor matrices. Negative edges without a negative cycle are fine; with a negative cycle, report the cycle and no finite path.',
    },
    tip: { zh: '记忆：Floyd 不是“对每个起点跑一次 Dijkstra”，它直接维护全源矩阵。', en: 'Remember: Floyd does not run Dijkstra per source; it maintains the all-pairs matrix directly.' },
  },
];

export const floydWarshallLesson: Lesson = {
  lessonId: 'floyd-warshall-all-pairs',
  algorithmId: 'floyd-warshall',
  contentVersion: '1.0.0',
  title: { zh: 'Floyd-Warshall 全源最短路径', en: 'Floyd-Warshall all-pairs shortest paths' },
  oneLiner: {
    zh: '用三重循环和动态规划，一次求出所有点对之间的最短距离，并支持负权边。',
    en: 'Compute shortest distances for every pair at once with a triple loop and dynamic programming, including negative edges.',
  },
  overview: {
    zh: 'Floyd-Warshall 把“从 i 到 j 的最短距离”定义成一个可以逐层放宽的子问题。最初只允许直连边；随后依次允许经过 A、B、C……作为中间节点。每加入一个 k，就检查所有 i、j：能不能用 i→k→j 取代当前 i→j？因为每个子问题都只使用已经处理过的中间节点，所以当所有 k 都处理完，矩阵就是最终答案。它的优点是实现简单、一次得到全源结果、能处理负权边；代价是 O(V³) 时间和 O(V²) 空间。',
    en: 'Floyd-Warshall treats “the shortest i→j distance” as a subproblem that is gradually relaxed. At first only direct edges are allowed; then A, B, C… become allowed intermediate nodes one by one. Each k checks every i and j: can i→k→j replace the current i→j? Every subproblem uses only already processed intermediates, so after all k values the matrix is final. It is simple, produces all sources at once and handles negative edges; the cost is O(V³) time and O(V²) space.',
  },
  intuition: {
    zh: '把矩阵想成一张“任意两站之间的报价表”。每轮新开放一个中转站 k，就检查所有起点 i 和终点 j：如果“i 到 k 的报价 + k 到 j 的报价”比现有直报价更便宜，就换掉它。因为每一轮只增加一个中转站，报价只会越改越便宜，不会漏掉经过更多站的组合。previous 矩阵记录每个终点在最优路线上的前一站；最后沿着它倒推，就能恢复路线。',
    en: 'Think of the matrix as a quote table for every pair of stations. Each round opens one new transfer station k and checks every source i and target j: if “i to k” plus “k to j” is cheaper than the current quote, replace it. Each round adds exactly one transfer station, so quotes only improve and no route with more stops is missed. The previous matrix records the station before each target on the best route; walking it backwards recovers the route.',
  },
  prerequisites: {
    zh: ['理解邻接矩阵与有向/无向图', '知道 ∞ 在 Python 中如何表示', '理解动态规划的子问题逐步放宽', '会读三重循环与二维列表'],
    en: ['Understanding adjacency matrices and directed/undirected graphs', 'Knowing how ∞ is represented in Python', 'Understanding gradual subproblem relaxation in dynamic programming', 'Reading triple loops and 2-D lists'],
  },
  complexity: {
    time: 'O(V³)',
    space: 'O(V²)',
    note: {
      zh: '外层 k、内层 i、最内层 j 各遍历 V 个节点，所以比较次数约为 V³；默认 5 个节点只产生 60 次有意义的比较，远低于 500 帧上限。距离矩阵和前驱矩阵都保存 V² 个格子，因此空间是 O(V²)。它适合稠密图或需要全源答案的场景；稀疏图的单源问题通常用 Dijkstra 或 Bellman-Ford 更省。',
      en: 'The outer k, middle i and inner j each visit V nodes, so there are about V³ comparisons; the default 5 nodes produce only 60 meaningful comparisons, far below the 500-frame cap. Both distance and predecessor matrices store V² cells, so space is O(V²). It suits dense graphs or all-pairs answers; a single source on a sparse graph is usually cheaper with Dijkstra or Bellman-Ford.',
    },
  },
  steps: FLOYD_STEPS,
  commonMistakes: {
    zh: [
      '把 k 当成起点或终点；k 只是本轮允许使用的中间节点。',
      '更新 dist[i][j] 时忘记同步 previous[i][j]，最后路径恢复错误。',
      '把负权边直接当成负权环；必须检查 dist[i][i] < 0。',
      '在存在负权环时仍输出一个有限最短距离。',
      '用 float("inf") 直接序列化，导致 JSON 出现 Infinity；应转换为 null。',
      '只记录成功更新，不记录未更新的比较，导致误以为算法没有检查全部组合。',
      '节点或边数太大，V³ 帧数超过 Trace 上限；教学图应限制规模。',
    ],
    en: [
      'Treating k as a source or target; k is only the newly allowed intermediate.',
      'Updating dist[i][j] without updating previous[i][j], which breaks path recovery.',
      'Treating any negative edge as a negative cycle; check dist[i][i] < 0 instead.',
      'Reporting a finite shortest distance while a negative cycle exists.',
      'Serialising float("inf") directly, producing Infinity in JSON; convert it to null.',
      'Recording only successful updates and hiding skipped comparisons, which falsely suggests not every pair was checked.',
      'Letting V grow until V³ frames exceed the Trace cap; teaching graphs must stay small.',
    ],
  },
};

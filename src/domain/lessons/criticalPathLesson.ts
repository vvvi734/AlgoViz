import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: {
      zh: '① AOV 与 AOE：把活动放到边上',
      en: '① AOV vs AOE: activities on edges',
    },
    explanation: {
      zh: 'AOV 网络用顶点表示活动、边只表示先后依赖；AOE 网络用顶点表示事件、用带持续时间的边表示活动。关键路径问题问的是“整个工程至少多久完成，哪些活动一刻也不能拖”。默认 AOE 图有 6 个事件 A–F、7 项活动：A→B 3、A→C 2、B→D 2、B→E 6、C→D 4、D→E 3、E→F 2。所有持续时间都是非负的；负持续时间没有工程意义，程序会直接拒绝。',
      en: 'An AOV network puts activities on vertices and uses edges only for precedence; an AOE network puts events on vertices and activities on weighted, duration-labelled edges. The critical-path question is “how long must the whole project take, and which activities cannot slip at all”. The default AOE graph has six events A–F and seven activities: A→B 3, A→C 2, B→D 2, B→E 6, C→D 4, D→E 3, E→F 2. All durations are non-negative; a negative duration has no engineering meaning and is rejected.',
    },
    tip: {
      zh: 'AOE 的边是活动，顶点是事件；不要把活动持续时间误写到顶点上。',
      en: 'In AOE, edges are activities and vertices are events; durations belong on edges, not vertices.',
    },
  },
  {
    stepId: 'topo',
    title: {
      zh: '② 先做拓扑排序：事件必须按依赖顺序计算',
      en: '② Topological order first: events must follow dependencies',
    },
    explanation: {
      zh: 've 需要所有前驱的 ve 都已知，所以先对事件做拓扑排序。默认图的一个合法顺序是 A、B、C、D、E、F；A 是唯一源事件，F 是唯一汇事件。这里复用 Kahn 的依赖处理逻辑，但关键路径视图不会复制拓扑排序面板：它只把拓扑序列作为 ve/vl 的计算顺序。若图有环，程序立即进入 cycle 分支，不计算工期。',
      en: 've needs every predecessor’s ve, so events are sorted topologically first. One valid order for the default graph is A, B, C, D, E, F; A is the only source event and F the only sink. This reuses Kahn’s dependency logic, but the critical-path view does not duplicate the topological-sort panel: the order is only the computation sequence for ve/vl. If the graph has a cycle, the program enters the cycle branch and computes no duration.',
    },
    tip: {
      zh: '有向环不是“再排一次就好”；AOE 关键路径在环上根本没有定义。',
      en: 'A directed cycle is not “sort it again”; the AOE critical path is simply undefined on a cyclic network.',
    },
  },
  {
    stepId: 've',
    title: {
      zh: '③ 前推：最早事件时间 ve',
      en: '③ Forward pass: earliest event time ve',
    },
    explanation: {
      zh: '按拓扑顺序处理每个事件：ve[v] = max(ve[u] + duration(u→v))，所有源事件的 ve 为 0。默认图得到 ve[A]=0、ve[B]=3、ve[C]=2、ve[D]=max(3+2, 2+4)=6、ve[E]=max(3+6, 6+3)=9、ve[F]=9+2=11。ve 是“所有前置活动都完成后，这个事件最早能发生的时刻”。',
      en: 'Process each event in topological order: ve[v] = max(ve[u] + duration(u→v)), with every source at 0. The default graph gives ve[A]=0, ve[B]=3, ve[C]=2, ve[D]=max(3+2, 2+4)=6, ve[E]=max(3+6, 6+3)=9, ve[F]=9+2=11. ve is the earliest moment an event can occur after every preceding activity finishes.',
    },
    tip: {
      zh: 've 取最大值，不取最小值；工程要等最慢的前驱完成。',
      en: 've takes the maximum, not the minimum: the project must wait for the slowest predecessor.',
    },
  },
  {
    stepId: 'vl',
    title: {
      zh: '④ 后推：最迟事件时间 vl',
      en: '④ Backward pass: latest event time vl',
    },
    explanation: {
      zh: '先令所有汇事件的 vl 等于项目总工期（默认图只有 F，所以 vl[F]=11），再按逆拓扑顺序处理：vl[v] = min(vl[w] − duration(v→w))。默认图得到 vl[E]=11−2=9、vl[D]=9−3=6、vl[C]=6−4=2、vl[B]=min(6−2, 9−6)=3、vl[A]=min(3−3, 2−2)=0。vl 是在不影响总工期的前提下，事件可以推迟到的最晚时刻。有多个汇事件时，每个汇都先取总工期，再向前传播。',
      en: 'First set every sink’s vl to the project duration (the default graph has only F, so vl[F]=11), then run in reverse topological order: vl[v] = min(vl[w] − duration(v→w)). The default graph gives vl[E]=11−2=9, vl[D]=9−3=6, vl[C]=6−4=2, vl[B]=min(6−2, 9−6)=3, vl[A]=min(3−3, 2−2)=0. vl is the latest an event may occur without delaying the project. With multiple sinks, each sink takes the project duration first and then propagates backward.',
    },
    tip: {
      zh: '汇事件不一定是最后一个拓扑编号；所有出度为 0 的事件都要取总工期。',
      en: 'A sink is not necessarily the last topological index; every outdegree-0 event takes the project duration.',
    },
  },
  {
    stepId: 'activity',
    title: {
      zh: '⑤ 活动余量：e = ve[起点]，l = vl[终点] − 持续时间',
      en: '⑤ Activity slack: e = ve[source], l = vl[target] − duration',
    },
    explanation: {
      zh: '对每条活动边计算最早开始 e 和最迟开始 l：e = ve[from]，l = vl[to] − duration；时间余量 slack = l − e。默认图的活动余量是：A–B 0、A–C 0、B–D 1、B–E 0、C–D 0、D–E 0、E–F 0。余量为 0 的活动是关键活动，任何延误都会直接推迟工期；B–D 有 1 天余量，可以晚开始 1 天而不影响总工期。',
      en: 'For each activity edge compute earliest start e and latest start l: e = ve[from], l = vl[to] − duration; slack = l − e. The default slacks are A–B 0, A–C 0, B–D 1, B–E 0, C–D 0, D–E 0, E–F 0. Zero-slack activities are critical: any delay postpones the project. B–D has one unit of slack and may start one unit later without changing the duration.',
    },
    tip: {
      zh: 'l 用的是终点事件的 vl 减去持续时间，不是起点的 vl。',
      en: 'l uses the target event’s vl minus the duration, not the source’s vl.',
    },
  },
  {
    stepId: 'cycle',
    title: {
      zh: '⑥ 有向环：明确拒绝，而不是伪造工期',
      en: '⑥ Directed cycle: reject instead of inventing a duration',
    },
    explanation: {
      zh: 'AOE 的 ve/vl 依赖拓扑顺序；若存在有向环，事件之间互相等待，前推和后推都无法收敛。程序不会输出一个看似合理的总工期，而是标记 hasCycle、保留环中事件并拒绝生成关键路径。负持续时间同样被拒绝：它不是“更快的活动”，而是没有定义的输入。',
      en: 'AOE ve/vl depend on a topological order; with a directed cycle, events wait on one another and neither pass converges. The program does not output a plausible-looking duration: it sets hasCycle, keeps the cycle events and refuses to produce a critical path. Negative durations are likewise rejected: they are not “faster activities”, they are undefined input.',
    },
    tip: {
      zh: '环检测失败要保留证据；不要用默认 0 填充 ve/vl 把错误藏起来。',
      en: 'A cycle failure should keep evidence; never hide it by filling ve/vl with default zeros.',
    },
  },
  {
    stepId: 'done',
    title: {
      zh: '⑦ 总工期、多条关键路径与记忆重点',
      en: '⑦ Duration, multiple critical paths and memory hooks',
    },
    explanation: {
      zh: '项目总工期是所有汇事件 ve 的最大值；默认图是 11。关键活动组成关键路径：默认图同时存在 A→B→E→F 和 A→C→D→E→F 两条，长度都为 11。关键路径是“最长路径”，因为它决定工程最短完成时间；它不是 Dijkstra 的“最短路径”，两者优化目标相反。复杂度：拓扑排序与两次事件扫描都是 O(V+E)，逐活动计算也是 O(E)，总时间 O(V+E)，空间 O(V+E)。多源时所有源 ve=0；多汇时所有汇 vl=总工期；关键路径必须从源走到汇，且总时长等于总工期。',
      en: 'The project duration is the maximum ve over every sink; the default graph gives 11. Critical activities form the critical paths: the default graph has both A→B→E→F and A→C→D→E→F, each of length 11. A critical path is a longest path because it sets the shortest possible project duration; it is not Dijkstra’s shortest path, whose objective is the opposite. Complexity: topological sorting and both event passes are O(V+E), activity scanning is O(E), so total O(V+E) time and O(V+E) space. With multiple sources every source has ve=0; with multiple sinks every sink has vl=duration; a critical path must run source to sink and its total must equal the duration.',
    },
    tip: {
      zh: '记法：AOE 关键路径 = “最长路径决定最短工期”；ve 前推取 max，vl 后推取 min，slack=l−e，余量 0 即关键。',
      en: 'Memory hook: AOE critical path = “the longest path sets the shortest duration”; ve forward takes max, vl backward takes min, slack=l−e, zero slack is critical.',
    },
  },
];

export const criticalPathLesson: Lesson = {
  lessonId: 'aoe-critical-path',
  algorithmId: 'critical-path',
  contentVersion: '1.0.0',
  title: { zh: 'AOE 网络关键路径', en: 'AOE critical path' },
  oneLiner: {
    zh: '在活动带持续时间的有向无环图上，找决定项目总工期的最长路径。',
    en: 'Find the longest path that determines the project duration in a duration-labelled activity-on-edge DAG.',
  },
  overview: {
    zh: 'AOE 网络把活动放在边上、事件放在顶点上。关键路径算法先用拓扑排序保证事件依赖可计算，再前推每个事件的最早发生时间 ve，后推最迟发生时间 vl，最后对每条活动计算最早开始 e、最迟开始 l 和余量 l−e。余量为 0 的活动是关键活动；由关键活动组成、从源事件到汇事件且总时长等于项目总工期的路径就是关键路径。项目总工期等于所有汇事件 ve 的最大值，也等于任意一条关键路径的长度。',
    en: 'An AOE network puts activities on edges and events on vertices. The critical-path algorithm first topologically sorts events, then computes earliest event times ve forward and latest event times vl backward, and finally each activity’s earliest start e, latest start l and slack l−e. Zero-slack activities are critical; a source-to-sink route made of critical activities whose total duration equals the project duration is a critical path. The project duration is the maximum ve over all sinks and also the length of every critical path.',
  },
  intuition: {
    zh: '把工程想成一张并行施工的网络：事件是“所有前置活动都完成”的检查点，活动是需要持续时间的边。ve 回答“这个检查点最早什么时候到”；vl 回答“最晚什么时候到还不拖工期”。两者相减就是这段活动可以拖延的余量。余量为 0 的活动没有任何缓冲，牵一发动全身，所以它们串起来的最长路线决定了整个工程的最短完成时间。',
    en: 'Think of the project as a network of parallel work: events are checkpoints where all preceding activities are done, and activities are duration-labelled edges. ve answers “when can this checkpoint happen at the earliest”; vl answers “how late can it happen without delaying the project”. Their difference is the activity’s available slack. Zero-slack activities have no buffer and are on the tightest chain, so the longest route they form sets the shortest possible project duration.',
  },
  prerequisites: {
    zh: ['知道有向无环图、拓扑排序与入度/出度', '理解事件与活动的区别', '会做最大值/最小值的前推与后推', '知道 Dijkstra 最短路径的目标'],
    en: ['Knowing DAGs, topological sorting and indegree/outdegree', 'Understanding the difference between events and activities', 'Comfortable with forward max and backward min passes', 'Knowing what Dijkstra shortest paths optimise'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: {
      zh: '拓扑排序 O(V+E)，ve 与 vl 各扫描所有事件和活动一次，逐活动计算再 O(E)，因此总时间是 O(V+E)。空间上邻接表/前驱表 O(V+E)，ve、vl、活动表和关键路径枚举都是 O(V+E)。关键路径枚举只沿零余量边 DFS；教学上限为 12 条，超过会显式报错而不是静默截断。',
      en: 'Topological sorting is O(V+E); the ve and vl passes each scan events and edges once, and activity computation is another O(E), so total time is O(V+E). Space is O(V+E) for adjacency/predecessor lists, ve/vl, activity rows and path enumeration. Path enumeration DFS follows only zero-slack edges; the teaching cap is 12 paths and exceeding it raises an explicit error instead of silently truncating.',
    },
  },
  steps: STEPS,
  commonMistakes: {
    zh: [
      '把 AOE 的关键路径当成 Dijkstra 最短路径；关键路径优化的是最长路径/最短工期。',
      '把活动持续时间写到顶点上，或把事件时间和活动开始时间混为一谈。',
      've 前推时取最小值，或 vl 后推时取最大值，导致时间表整体错误。',
      '只给一个汇事件设置总工期，忽略其他出度为 0 的汇事件。',
      '只标记一条关键路径，漏掉同长的其他合法关键路径。',
      '遇到有向环仍输出一个总工期，或接受负持续时间。',
    ],
    en: [
      'Treating the AOE critical path as Dijkstra’s shortest path; the critical path optimises the longest route/shortest duration.',
      'Putting durations on vertices, or confusing event times with activity start times.',
      'Taking the minimum in the ve forward pass or the maximum in the vl backward pass.',
      'Assigning the project duration to only one sink and ignoring other outdegree-0 sinks.',
      'Marking only one critical path and missing other equally long valid paths.',
      'Publishing a duration for a cyclic network, or accepting negative durations.',
    ],
  },
};

import type { Lesson } from './types';

const STEPS: Lesson['steps'] = [
  {
    stepId: 'init',
    title: {
      zh: '① DAG、入度与零入度起点',
      en: '① DAGs, indegree and zero-indegree sources',
    },
    explanation: {
      zh: '拓扑排序只适用于有向无环图（DAG）。AOV 网络用顶点表示活动、用有向边表示“先做 u 才能做 v”的依赖。一个顶点的入度是指向它的边数，也就是还没完成的前驱数量。Kahn 算法先统计所有入度，再把入度为 0 的源点放进候选队列。默认图有 7 个顶点、8 条依赖边；A 和 B 的入度为 0，C 的入度为 2，F 和 G 的入度也为 2。',
      en: 'Topological sorting applies only to a directed acyclic graph (DAG). An AOV network puts activities on vertices and dependencies on directed edges: u must happen before v. A vertex’s indegree is the number of incoming edges, i.e. unfinished predecessors. Kahn first counts every indegree, then places all zero-indegree sources in a candidate queue. The default graph has seven vertices and eight dependencies; A and B have indegree 0, C has 2, and F and G also have 2.',
    },
    tip: {
      zh: '入度不是“已经访问过”，而是“还有多少前驱没有处理”。',
      en: 'Indegree is not “visited”; it is “how many predecessors remain unprocessed”.',
    },
  },
  {
    stepId: 'seed',
    title: {
      zh: '② 多个零入度源点按确定性顺序入队',
      en: '② Multiple zero-indegree sources enter in a deterministic order',
    },
    explanation: {
      zh: 'A 和 B 都没有前驱，可以同时作为序列开头。Kahn 允许它们以任意顺序出队，因此同一个 DAG 可能有多种合法拓扑序列。为了保证教学播放每次一致，程序按顶点输入顺序扫描，把 A、B 依次放入 FIFO 队列。队列里的顺序只决定“这一轮先处理谁”，不改变依赖约束，也不代表唯一正确答案。',
      en: 'A and B have no predecessors, so either can open the sequence. Kahn may dequeue them in either order, which is why one DAG can have several valid topological orders. To keep every teaching playback identical, the program scans vertices in input order and enqueues A then B into a FIFO queue. The queue order only decides who is processed first in this round; it does not change dependencies and is not the unique answer.',
    },
    tip: {
      zh: '测试拓扑序时不要比较固定数组，而要逐边验证“起点一定排在终点之前”。',
      en: 'Never test a topological order by one fixed array; verify edge by edge that every source precedes its targets.',
    },
  },
  {
    stepId: 'dequeue',
    title: {
      zh: '③ 出队一个零入度顶点，追加到拓扑序列',
      en: '③ Dequeue one zero-indegree vertex into the order',
    },
    explanation: {
      zh: '从队首取出 A，把它追加到 topological_order。出队意味着 A 的所有前驱都已经处理完，因此 A 可以安全地出现在当前序列位置。随后程序检查 A 的每一条出边，把 A 提供的依赖从邻接顶点的入度中移除。默认运行的前几步是 A、B、D、C、E、F、G；这只是 FIFO 的一种合法结果。',
      en: 'Pop A from the front and append it to topological_order. Dequeuing means every predecessor of A has already been processed, so A is safe at this position. The program then inspects every outgoing edge and removes the dependency A contributes from its neighbours’ indegrees. The default run starts A, B, D, C, E, F, G; this is one valid FIFO result, not the only one.',
    },
    tip: {
      zh: '只有真正 dequeue 的顶点才能进入序列；候选队列里的顶点还没有确定位置。',
      en: 'Only a real dequeue appends a vertex; being in the candidate queue does not fix its position yet.',
    },
  },
  {
    stepId: 'inspect',
    title: {
      zh: '④ 检查当前出边：它仍是一条未移除的依赖',
      en: '④ Inspect an outgoing edge: still an unremoved dependency',
    },
    explanation: {
      zh: '当前边 A→C 的起点 A 已经出队，终点 C 的入度仍包含这条依赖。画布把这条边标为“当前检查”，而不是“已移除”；此时还没有执行减一。入度表显示 C 仍为 2，提示它还要等另一条前驱 B→C 被处理。',
      en: 'For the current edge A→C, source A has left the queue while target C still counts this dependency. The canvas marks the edge as “current”, not “removed”; the decrement has not happened yet. The indegree table still shows C at 2, meaning it must also wait for B→C.',
    },
    tip: {
      zh: '“检查边”和“移除依赖”是两个真实帧，不能把减一提前画出来。',
      en: '“Inspect edge” and “remove dependency” are two real frames; do not paint the decrement early.',
    },
  },
  {
    stepId: 'decrement',
    title: {
      zh: '⑤ 入度减一：从 2 变成 1',
      en: '⑤ Decrement indegree: 2 becomes 1',
    },
    explanation: {
      zh: '处理完 A→C 后，C 的入度从 2 减到 1；这条边进入 removed_edges，画布用灰色虚线表示它不再是待处理依赖。入度减到 0 才是“所有前驱都完成”的信号，减到 1 只说明还差一条。对 C 来说，还要等 B 出队并处理 B→C。',
      en: 'After A→C, C’s indegree drops from 2 to 1; the edge enters removed_edges and the canvas draws it as a removed dependency. Only reaching 0 means every predecessor is done; 1 still leaves one dependency. C must wait for B to leave the queue and process B→C.',
    },
    tip: {
      zh: '入度表、当前边和 removed 集合必须来自同一帧；回退时三者一起恢复。',
      en: 'The indegree table, current edge and removed set must come from the same frame and rewind together.',
    },
  },
  {
    stepId: 'enqueue',
    title: {
      zh: '⑥ 新零入度顶点入队',
      en: '⑥ A new zero-indegree vertex enters the queue',
    },
    explanation: {
      zh: '当最后一条前驱边被移除、入度变成 0 时，该顶点立即进入候选队列。例如 C 同时依赖 A 和 B，只有 A→C 与 B→C 都被移除后，C 才能入队。入队顺序仍由确定性的扫描顺序决定；后续出队时它才真正加入拓扑序列。',
      en: 'When the last incoming dependency is removed and the indegree becomes 0, the vertex immediately enters the candidate queue. C depends on both A and B, so it can enter only after A→C and B→C are both removed. The enqueue order remains deterministic; the vertex joins the topological order only when it is later dequeued.',
    },
    tip: {
      zh: '一个顶点可能多次“看起来快好了”，但只有入度真正为 0 才能入队。',
      en: 'A vertex may look nearly ready several times, but only a real indegree of 0 admits it to the queue.',
    },
  },
  {
    stepId: 'cycle',
    title: {
      zh: '⑦ 队列空了但还有顶点：有向环',
      en: '⑦ Queue empty but vertices remain: a directed cycle',
    },
    explanation: {
      zh: '如果队列为空而拓扑序列还没有覆盖全部顶点，剩下的顶点入度都大于 0：它们互相等待，形成有向环。此时不存在完整拓扑序，程序明确报告 hasCycle 并保留未解析顶点，而不是把它们随便塞进序列。默认教学图无环；测试会额外跑 A→B→C→A 的环图来验证这一分支。',
      en: 'If the queue is empty while some vertices are not in the order, every remaining vertex has positive indegree: they wait on one another, forming a directed cycle. No complete topological order exists, so the program reports hasCycle and keeps the unresolved vertices instead of forcing them into the order. The default teaching graph is acyclic; tests also run A→B→C→A to exercise this branch.',
    },
    tip: {
      zh: '拓扑排序失败不等于程序错误；有向环是算法必须明确报告的合法输入结论。',
      en: 'A failed topological sort is not a bug; a directed cycle is a valid input outcome the algorithm must report.',
    },
  },
  {
    stepId: 'done',
    title: {
      zh: '⑧ 完成、复杂度与记忆重点',
      en: '⑧ Completion, complexity and memory hooks',
    },
    explanation: {
      zh: '默认运行得到完整序列 A、B、D、C、E、F、G；无环时拓扑序覆盖全部 V 个顶点，所有 E 条依赖边都被移除一次。Kahn 的时间复杂度是 O(V+E)：每个顶点入队/出队一次，每条边检查一次；额外空间是 O(V) 的入度表、队列和序列，加上 O(V+E) 的邻接表。常见错误包括把某一个拓扑序当成唯一答案、忘记处理多个零入度源点、把环误当成“还没访问”、以及用不确定的集合顺序破坏可复现性。非连通 DAG 仍然有拓扑序，只是每个连通分量各自排序；有向环才使排序失败。',
      en: 'Without a cycle, the order covers all V vertices and every one of the E dependencies is removed once. Kahn runs in O(V+E): each vertex enters and leaves the queue once, each edge is inspected once. Extra space is O(V) for indegrees, queue and order, plus O(V+E) for the adjacency list. Common mistakes include treating one order as unique, forgetting multiple zero-indegree sources, treating a cycle as “not visited yet”, and using nondeterministic set order. A disconnected DAG still has a topological order, one per component; only a directed cycle makes sorting fail.',
    },
    tip: {
      zh: '记法：Kahn = 入度表 + 零入度队列；出队入序列，删边减入度，减到零再入队；队列空仍有剩余就是环。',
      en: 'Memory hook: Kahn = indegree table + zero-indegree queue; dequeue into the order, remove edges and decrement, enqueue at zero; an empty queue with leftovers means a cycle.',
    },
  },
];

export const topologicalSortLesson: Lesson = {
  lessonId: 'topological-sort-kahn',
  algorithmId: 'topological',
  contentVersion: '1.0.0',
  title: { zh: '拓扑排序（Kahn 入度法）', en: 'Topological sort (Kahn indegree)' },
  oneLiner: {
    zh: '反复取出零入度顶点、删除它的出边，得到满足所有依赖的线性顺序。',
    en: 'Repeatedly take a zero-indegree vertex and delete its outgoing edges to obtain a linear order satisfying every dependency.',
  },
  overview: {
    zh: '拓扑排序解决“有依赖的任务按什么顺序执行”的问题：若存在边 u→v，则 u 必须出现在 v 之前。它只定义在有向无环图上。Kahn 算法维护每个顶点的入度，把所有入度为 0 的顶点放入候选队列；每次出队一个顶点加入序列，再把它指向的每个邻接顶点入度减一，减到 0 就入队。若最终仍有顶点未输出，剩余顶点构成有向环，完整拓扑序不存在。',
    en: 'Topological sorting answers “in what order can dependent tasks run”: for every edge u→v, u must appear before v. It is defined only on directed acyclic graphs. Kahn maintains each vertex indegree and puts every zero-indegree vertex into a candidate queue. Each dequeue appends a vertex to the order, then decrements every neighbour it points to and enqueues any that reach 0. If vertices remain at the end, the remainder contains a directed cycle and no complete topological order exists.',
  },
  intuition: {
    zh: '把每个顶点想成一项任务，入度是“还有多少前置任务没做完”。入度为 0 的任务现在就能开工；做完一个任务，就把它的所有后继的“未完成前置数”减一。减到 0 的后继立刻获得开工资格。候选队列里可以同时有多项任务，所以合法顺序通常不止一个；只要不违反任何一条依赖，都是正确答案。',
    en: 'Think of vertices as tasks and indegree as “how many prerequisites are still unfinished”. A zero-indegree task can start now; finishing one task decrements the unfinished-prerequisite count of every successor. A successor that reaches 0 becomes available immediately. Several tasks may be eligible at once, so there is usually more than one valid order; any order that violates no dependency is correct.',
  },
  prerequisites: {
    zh: ['知道有向图、顶点、边与邻接表', '理解入度和出度的定义', '知道 DAG 与有向环的区别', '会读 Python 的 dict、list 和 collections.deque'],
    en: ['Knowing directed graphs, vertices, edges and adjacency lists', 'Understanding indegree and outdegree', 'Knowing the difference between a DAG and a directed cycle', 'Reading Python dict, list and collections.deque'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V + E)',
    note: {
      zh: '每个顶点恰好入队一次、出队一次，每条边在其起点出队时检查一次，因此时间是 O(V+E)。空间上邻接表 O(V+E)，入度表、队列和拓扑序列各 O(V)。本批次限制 12 个顶点、30 条原始边、20 条唯一边，保证面板可读且帧数受控。',
      en: 'Each vertex enters and leaves the queue once, and each edge is inspected once when its source leaves, so time is O(V+E). Space is O(V+E) for the adjacency list and O(V) each for indegrees, queue and order. This batch caps 12 vertices, 30 raw edges and 20 unique edges so panels stay readable and frame counts bounded.',
    },
  },
  steps: STEPS,
  commonMistakes: {
    zh: [
      '把某一个拓扑序当成唯一正确答案；同一 DAG 常有多个合法顺序。',
      '只处理一个零入度源点，忘记把本轮所有零入度顶点加入候选。',
      '把“已访问”当成“入度为 0”，跳过入度递减的真实过程。',
      '队列空了却仍有顶点时，继续硬凑序列，而不是报告有向环。',
      '用无序 set 遍历邻接点，导致相同输入产生不稳定帧。',
      '认为非连通 DAG 不能拓扑排序；它其实可以对每个分量分别排序。',
    ],
    en: [
      'Treating one topological order as the unique answer; one DAG often has several valid orders.',
      'Processing only one zero-indegree source and forgetting the other candidates in the same round.',
      'Confusing “visited” with “indegree 0” and skipping the real decrement process.',
      'Forcing the remaining vertices into the order when the queue is empty instead of reporting a cycle.',
      'Iterating neighbours through an unordered set, producing unstable frames for identical input.',
      'Believing a disconnected DAG cannot be sorted; each component can be sorted independently.',
    ],
  },
};

import type { Lesson, LessonStep } from './types';

/**
 * Stage 7E graph courses.
 *
 * Each algorithm gets its own course (the registry allows one course per
 * algorithm), but the conceptual material is shared. Step ids are exactly the
 * `lesson_step=` values emitted by graphTraversalExamples.ts:
 * BFS  init/start/dequeue/visit/inspect/discover/enqueue/skip/done
 * DFS  init/start/pop/visit/inspect/discover/push/skip/done
 * The UI resolves each step by scanning real Trace frames, never by message.
 */

const GRAPH_OVERVIEW = {
  zh: '图由顶点（节点）和边组成，用来表示“谁与谁相连”。本阶段的图是无向简单图：边没有方向，A–B 与 B–A 是同一条边；同一对顶点最多一条边，不允许自环。屏幕上的默认图有 7 个顶点：A、B、C、D、E、F、G；边是 A–B、A–C、B–D、B–E、C–F、E–F、F–G。A、B、E、F、C、A 构成一个环，所以 BFS 与 DFS 都必须记录 discovered，避免绕环无限重复。程序用邻接表保存邻居：A:[B,C]、B:[A,D,E]、C:[A,F]、D:[B]、E:[B,F]、F:[C,E,G]、G:[F]。邻接表里每个节点的邻居顺序是固定的，访问顺序因此可以复现；但“正确顺序”并不唯一，换一个邻居顺序就可能得到另一种合法遍历。',
  en: 'A graph is made of vertices (nodes) and edges that describe who is connected to whom. The graph in this stage is a simple undirected graph: edges have no direction, A–B and B–A are the same edge, at most one edge connects a pair, and self-loops are rejected. The default graph has seven vertices: A, B, C, D, E, F, G; its edges are A–B, A–C, B–D, B–E, C–F, E–F, F–G. A–B–E–F–C–A forms a cycle, so both BFS and DFS must track discovered nodes to avoid looping forever. The program stores neighbours in an adjacency list: A:[B,C], B:[A,D,E], C:[A,F], D:[B], E:[B,F], F:[C,E,G], G:[F]. Neighbour order is fixed, so the run is reproducible; it is not the only valid order — another neighbour order can produce another legal traversal.',
};

const GRAPH_INTUITION = {
  zh: '把图想成一张地铁线路图：节点是车站，边是相邻车站之间的轨道。discovered 表示“已经知道这个站存在，并把它写进了待办清单”；frontier 是真正的待办清单；visited 表示“已经正式到站处理过”。排进待办不等于已经到站，所以 discovered 与 visited 必须分开。BFS 像水波从起点一圈圈扩散：队列先来先处理，先把所有一步能到的站处理完，再处理两步、三步的站。DFS 像走迷宫时总先钻进最新发现的那条通道：栈后进先出，能深入就深入，走到头再回退到上一个还有岔路的地方。',
  en: 'Think of a graph as a metro map: vertices are stations and edges are tracks between adjacent stations. discovered means “this station is known and has been written onto the to-do list”; the frontier is the actual to-do list; visited means “we have formally arrived and processed it”. Being queued is not the same as being visited, so discovered and visited must stay separate. BFS spreads like a ripple from the start: the FIFO queue processes everything one edge away before anything two edges away, then three. DFS is like walking a maze and always taking the newest passage: the LIFO stack goes deeper whenever it can, then backtracks to the previous junction when a branch dead-ends.',
};

const GRAPH_COMMON = {
  prerequisites: {
    zh: ['知道集合与列表的区别', '理解队列的先进先出与栈的后进先出', '会读 Python 的 list、set 与 deque'],
    en: ['Knowing the difference between a set and a list', 'Understanding FIFO queues and LIFO stacks', 'Reading Python list, set and deque'],
  },
  complexity: {
    time: 'O(V + E)',
    space: 'O(V)',
    note: {
      zh: '用邻接表表示时，每个顶点最多进入和离开 frontier 一次，每条无向边在两端各被检查一次，所以时间复杂度是 O(V + E)，V 是顶点数，E 是边数；不是 O(V²)，也不需要遍历整张邻接矩阵。frontier、discovered 集合和 visited 集合最多各保存 V 个顶点，额外空间是 O(V)。本阶段把节点限制为 20、去重后的边限制为 40，避免一次 Trace 过大。',
      en: 'With an adjacency list, each vertex enters and leaves the frontier at most once, and each undirected edge is inspected once from each endpoint, so time is O(V + E), where V is vertices and E is edges; it is not O(V²) and does not require scanning an adjacency matrix. The frontier, discovered set and visited set each hold at most V vertices, so extra space is O(V). This stage caps the input at 20 vertices and 40 de-duplicated edges so one trace stays bounded.',
    },
  },
  commonMistakes: {
    zh: [
      '忘记检查 discovered，环中的节点被反复入队或压栈，遍历永远结束不了。',
      '把 BFS 的队列和 DFS 的栈混用；画面上的 FRONT/REAR 与 TOP 会直接暴露这种错误。',
      '在入队或压栈时就标记 visited，导致“已访问顺序”与真实出队/弹栈处理不一致。',
      '依赖 Python set 的迭代次序来决定邻居顺序；set 的顺序不可依赖，教学顺序必须来自固定邻接表。',
      '认为 BFS 或 DFS 只有唯一正确访问序列；邻居顺序改变时，合法序列也会改变。',
      '把一条搜索路径当成唯一最短路径，或把非连通图的不可达节点当成程序漏访问。',
    ],
    en: [
      'Forgetting the discovered check, so cycle vertices are queued or pushed repeatedly and the traversal never ends.',
      'Mixing the BFS queue with the DFS stack; the FRONT/REAR and TOP visuals expose this immediately.',
      'Marking visited at enqueue/push time, so the visit order no longer matches real dequeue/pop processing.',
      'Relying on Python set iteration order for neighbours; set order is not dependable, so the teaching order must come from the fixed adjacency list.',
      'Assuming BFS or DFS has one unique correct visit sequence; changing neighbour order changes a legal sequence.',
      'Treating one search path as the unique shortest path, or treating unreachable vertices in a disconnected graph as a bug.',
    ],
  },
};

const BFS_STEPS: LessonStep[] = [
  {
    stepId: 'init',
    title: { zh: '① 建图：顶点、边与邻接表', en: '① Build the graph: vertices, edges and adjacency' },
    explanation: {
      zh: '初始化帧先展示整张图，但还没有任何顶点被发现或访问，frontier 是空队列。Python 从输入读取 nodes 与 edges，为每条边生成稳定 ID（e1…e7），并把无向边同时写进两端的邻接表。A 的邻居是 [B, C]，B 是 [A, D, E]；D 只有邻居 B，G 只有邻居 F。画布上的每条线都以真实 edge 的 fromId/toId 为端点，不靠节点排列位置猜测连接。',
      en: 'The init frame shows the whole graph before any vertex is discovered or visited; the queue is empty. Python reads nodes and edges from the input, assigns stable edge ids (e1…e7), and writes each undirected edge into both adjacency lists. A has neighbours [B, C], B has [A, D, E], D has only B, and G has only F. Every drawn line uses the real edge fromId/toId, never an inferred array position.',
    },
    tip: { zh: '无向边只保存为一条逻辑边，但两端都能查到邻居。', en: 'An undirected edge is one logical edge, visible from both endpoints.' },
  },
  {
    stepId: 'start',
    title: { zh: '② 起点 A 入队：发现不等于访问', en: '② Start A enters the queue: discovered is not visited' },
    explanation: {
      zh: '起点 A 先加入 discovered，再从队尾进入空队列。此时 A 的状态是 pending，画布用虚线边框与 Q 角标表示“已发现、在队列里、还没正式访问”；访问序号仍为空。队列摘要显示 A，代码变量 queue 也能看到同一个 A，两者来自同一条 Trace Event。',
      en: 'Start A first joins discovered, then enters the empty queue at the REAR. A is pending: the canvas uses a dashed border and a Q badge for “discovered, in the queue, not formally visited”, and its visit number is still empty. The queue summary shows A and the Python variable queue shows the same A, both from one Trace Event.',
    },
    tip: { zh: 'discovered 集合只表示“已知”，不表示“已处理”。', en: 'The discovered set means “known”, not “processed”.' },
  },
  {
    stepId: 'dequeue',
    title: { zh: '③ 从队首出队：BFS 的处理入口', en: '③ Dequeue from the FRONT: the BFS processing gate' },
    explanation: {
      zh: 'queue.popleft() 从队首取出 A，队列变空；A 被记录为 frontierRemoved，但还没有 visited。演示把“出队”和“访问”拆成两帧，是为了让你看清：元素离开队列之后，才进入正式访问。若把两件事合成一帧，就看不出 FIFO 的等待关系。',
      en: 'queue.popleft() removes A from the FRONT and the queue becomes empty. A is recorded as frontierRemoved but is not visited yet. The demo separates dequeue and visit into two frames so you can see that a vertex leaves the queue before it is formally processed. Merging them would hide the FIFO waiting relationship.',
    },
    tip: { zh: '出队帧只改变队列与 removed，不提前修改 visited。', en: 'The dequeue frame changes the queue and removed entry, not visited.' },
  },
  {
    stepId: 'visit',
    title: { zh: '④ 正式访问：记录真实访问序号', en: '④ Formally visit and record the real order' },
    explanation: {
      zh: 'A 被加入 visited 与 visitOrder，画布从 pending 变成 visited，并出现序号 1。这个序号来自真实列表长度，不是预先写死的动画序号。BFS 的访问发生在出队之后、检查邻居之前，所以 A 的邻居还没被处理。',
      en: 'A joins visited and visitOrder; the node changes from pending to visited and shows badge 1. The number comes from the real list length, not a hard-coded animation index. BFS visits after dequeue and before inspecting neighbours, so A’s neighbours are still untouched.',
    },
    tip: { zh: '当前节点可以同时已访问；但当前边框和访问序号表达两件事。', en: 'A current node can also be visited; the current ring and the order badge express different facts.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '⑤ 检查邻接边：真正看向邻居', en: '⑤ Inspect a real edge: look at a neighbour' },
    explanation: {
      zh: 'BFS 按邻接表顺序检查 A 的邻居。先检查 A–B：当前边高亮为虚线，邻接节点 B 获得额外边框，但 B 还没有 discovered。每一帧只检查一条真实边，edge id 与端点直接来自 GraphSnapshot。',
      en: 'BFS scans A’s neighbours in adjacency order. It first inspects A–B: the edge is highlighted with an animated dash, neighbour B gets an extra ring, and B is not discovered yet. Each frame inspects exactly one real edge, with edge id and endpoints copied from the GraphSnapshot.',
    },
    tip: { zh: '当前边不是“已经走过的路径”，而是这一帧正在检查的边。', en: 'The active edge is not a completed path; it is the edge being inspected in this frame.' },
  },
  {
    stepId: 'discover',
    title: { zh: '⑥ 第一次发现节点：进入待办集合', en: '⑥ First discovery: enter the to-do set' },
    explanation: {
      zh: 'B 不在 discovered 中，于是加入 discovered 并以 pending 状态出现。注意这一帧 B 还没有进入队列：discover 与 enqueue 是两个连续但不同的真实操作。画布上的 B 既没有访问序号，也暂时没有 Q 角标。',
      en: 'B is absent from discovered, so it joins the set and appears as pending. In this frame B is not in the queue yet: discover and enqueue are two consecutive but distinct real operations. B has no visit number and no Q badge yet.',
    },
    tip: { zh: '发现节点与把它排进队列不是同一时刻。', en: 'Discovering a node and queueing it are not the same moment.' },
  },
  {
    stepId: 'enqueue',
    title: { zh: '⑦ 从队尾入队：FIFO 排队', en: '⑦ Enter at the REAR: FIFO queuing' },
    explanation: {
      zh: 'B 追加到队尾，frontier 变成 [B]，B 获得 Q 角标。继续检查 A–C 后，C 也会经历 discover 与 enqueue，队列变成 [B, C]。先进入的 B 始终排在 C 前面，这就是 BFS 按层扩展的队列基础。',
      en: 'B is appended at the REAR, the frontier becomes [B], and B gets a Q badge. After A–C is inspected, C also goes through discover and enqueue, making the queue [B, C]. B entered first and stays ahead of C: this is the queue basis of BFS level-by-level expansion.',
    },
    tip: { zh: '队列顺序就是待处理顺序；不要按节点字母顺序自行排序。', en: 'Queue order is processing order; never re-sort it by vertex name.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑧ 跳过已发现节点：环不会无限重复', en: '⑧ Skip an already discovered vertex: cycles terminate' },
    explanation: {
      zh: '处理 B 时会检查 B–A：A 已经在 discovered 中，所以记录 skip，不再入队。后面 E 检查 E–F 时，F 已由 C 提前发现，也会 skip。图中有环是正常输入；靠 discovered 集合，BFS 不会把同一个顶点反复排进队列。',
      en: 'While processing B, edge B–A is inspected: A is already discovered, so the frame records skip and does not enqueue it again. Later E inspects E–F while F was already discovered from C, so it also skips. Cycles are valid input; the discovered set prevents BFS from queueing the same vertex repeatedly.',
    },
    tip: { zh: 'skip 不是错误；它正是有环图能终止的原因。', en: 'skip is not an error; it is why cyclic graphs terminate.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑨ 队列为空：顺序、复杂度与边界', en: '⑨ Empty queue: order, complexity and boundaries' },
    explanation: {
      zh: '队列最终变空，真实访问顺序是 A → B → C → D → E → F → G。这个顺序来自 visitOrder，不是预先写好的答案；邻接表换成 [C, B] 就可能得到另一种合法 BFS 顺序。时间 O(V+E)，额外空间 O(V)。若图不连通，从 A 出发只会访问 A 所在的可达分量，D、G 等不可达节点不会凭空出现；空图会直接产生 init 与 done 两帧。',
      en: 'The queue ends empty and the real visit order is A → B → C → D → E → F → G. It comes from visitOrder, not a precomputed answer; swapping the adjacency list to [C, B] could produce another legal BFS order. Time is O(V+E), extra space O(V). If the graph is disconnected, starting at A reaches only A’s component; unreachable vertices such as D or G do not appear. An empty graph produces just init and done frames.',
    },
    tip: { zh: 'BFS 的“逐层”来自 FIFO，不来自把节点按深度手动排序。', en: 'BFS level order comes from FIFO, not from manually sorting vertices by depth.' },
  },
];

const DFS_STEPS: LessonStep[] = [
  {
    stepId: 'init',
    title: { zh: '① 建图：同一张无向图，换一种 frontier', en: '① Build the same undirected graph with a different frontier' },
    explanation: {
      zh: 'DFS 与 BFS 使用完全相同的 nodes、edges 与邻接表，唯一改变的是待处理集合：DFS 用 Python list 作为显式栈，而不是 deque 队列。初始化时栈为空，没有任何节点 discovered 或 visited。默认图仍有环 A–B–E–F–C–A，稍后会看到 discovered 如何阻止重复压栈。',
      en: 'DFS uses exactly the same nodes, edges and adjacency list as BFS; the only change is the waiting collection: a Python list as an explicit stack instead of a deque queue. At init the stack is empty and no vertex is discovered or visited. The default graph still has the cycle A–B–E–F–C–A, and you will see discovered prevent duplicate pushes.',
    },
    tip: { zh: '两种搜索共享图数据，不应该复制第二套图或第二个播放器。', en: 'Both searches share graph data; there is no second graph or second player.' },
  },
  {
    stepId: 'start',
    title: { zh: '② 起点 A 压栈：栈顶就是下一条路', en: '② Push start A: the TOP is the next path' },
    explanation: {
      zh: 'A 加入 discovered 后压入空栈，栈为 [A]，A 是栈顶。A 处于 pending：已发现、在栈里、未访问。栈的 TOP 标记指向 A；下一次 while 循环会直接 pop 它。',
      en: 'A joins discovered and is pushed onto the empty stack, so the stack is [A] and A is TOP. A is pending: discovered, on the stack, not visited. The TOP marker points at A; the next loop iteration will pop it immediately.',
    },
    tip: { zh: 'DFS 使用同一个 discovered 语义：入栈即发现，弹出后才访问。', en: 'DFS uses the same discovered rule: pushed means discovered, popped means ready to visit.' },
  },
  {
    stepId: 'pop',
    title: { zh: '③ 弹出栈顶：LIFO 的处理入口', en: '③ Pop the TOP: the LIFO processing gate' },
    explanation: {
      zh: 'stack.pop() 从栈顶取出 A，栈变空，A 被记录为 frontierRemoved，但还没有 visited。和 BFS 一样，弹出与访问分成两帧；区别在于 frontier 的取出端是 TOP，而不是 FRONT。',
      en: 'stack.pop() removes A from the TOP, the stack becomes empty, and A is recorded as frontierRemoved without being visited yet. As in BFS, pop and visit are separate frames; the difference is that removal happens at the TOP, not the FRONT.',
    },
    tip: { zh: '看到 TOP 与 pop 才能确认这是 DFS，不是 BFS 队列。', en: 'TOP plus pop is the visual proof that this is DFS, not a BFS queue.' },
  },
  {
    stepId: 'visit',
    title: { zh: '④ 正式访问：记录真实访问序号', en: '④ Formally visit: record the real order' },
    explanation: {
      zh: 'A 加入 visited 与 visitOrder，节点出现序号 1。DFS 的访问落在 pop 之后、压入邻居之前。当前节点 A 同时是 visited；当前环与序号回答不同问题。',
      en: 'A joins visited and visitOrder and receives badge 1. DFS visits after pop and before pushing neighbours. A is both current and visited; the current ring and the order badge answer different questions.',
    },
    tip: { zh: '不要用“当前节点”代替“已访问节点”的集合判断。', en: 'Do not use “current node” as a substitute for the visited set.' },
  },
  {
    stepId: 'inspect',
    title: { zh: '⑤ 逆序检查邻居：决定栈顶顺序', en: '⑤ Inspect neighbours in reverse: decide the TOP order' },
    explanation: {
      zh: '代码写的是 for neighbor in reversed(adjacency[current])。A 的邻接表是 [B, C]，逆序先检查 A–C，再检查 A–B。逆序不是装饰：它让邻接表的第一个邻居 B 最终位于栈顶，从而复现递归 DFS 的“优先走 B”顺序。当前边与邻接节点边框都来自本帧结构。',
      en: 'The code runs for neighbor in reversed(adjacency[current]). A’s adjacency is [B, C], so it inspects A–C first and A–B second. The reversal is not decoration: it leaves the first adjacency neighbour B on TOP, reproducing recursive DFS’s “go to B first” order. The active edge and neighbour ring come from this frame.',
    },
    tip: { zh: '邻居检查次序与最终访问次序可以不同；栈的 LIFO 会把顺序再翻转一次。', en: 'Neighbour inspection order and final visit order can differ; LIFO flips the order again.' },
  },
  {
    stepId: 'discover',
    title: { zh: '⑥ 第一次发现节点：先记下，稍后再走', en: '⑥ First discovery: remember it, walk it later' },
    explanation: {
      zh: 'C 不在 discovered 中，于是加入集合并显示为 pending；但这一帧它还没有压栈。随后检查 A–B，B 也被发现。C 虽然比 B 先被发现，却会留在栈底，等 B 的整条分支处理完才轮到它。',
      en: 'C is absent from discovered, so it joins the set and appears pending; it is not on the stack yet in this frame. Then A–B is inspected and B is discovered too. Although C was discovered before B, it stays at the bottom of the stack until B’s whole branch is finished.',
    },
    tip: { zh: '先发现不等于先访问；DFS 的顺序由栈顶决定。', en: 'Discovered first does not mean visited first; DFS order is decided by the TOP.' },
  },
  {
    stepId: 'push',
    title: { zh: '⑦ 压栈：后进先出', en: '⑦ Push: last in, first out' },
    explanation: {
      zh: 'C 先压栈，栈为 [C]；B 后压栈，栈变成 [C, B]，B 成为栈顶。下一轮 pop 取走 B，而不是更早发现的 C。这样 DFS 会沿着 A → B → D… 的路径深入，C 分支被暂存。',
      en: 'C is pushed first, making the stack [C]; B is pushed after, making it [C, B] with B on TOP. The next pop takes B, not the earlier-discovered C. DFS therefore goes deep along A → B → D… while C’s branch is saved.',
    },
    tip: { zh: '栈底不是“被遗忘”，只是等当前分支回退后再处理。', en: 'The bottom is not forgotten; it waits until the current branch backtracks.' },
  },
  {
    stepId: 'skip',
    title: { zh: '⑧ 跳过已发现邻居：回退时不会倒着走', en: '⑧ Skip discovered neighbours: no walking backwards' },
    explanation: {
      zh: '处理 B 时会检查 B–A：A 已在 discovered/visited 中，记录 skip，不再压栈。处理 D 时检查 D–B，同样 skip。正是这些 skip 让 DFS 在无边可深入时自然结束当前分支，回到栈中保存的 E、C 等岔路。',
      en: 'Processing B inspects B–A: A is already discovered/visited, so the frame records skip and pushes nothing. Processing D inspects D–B and skips too. These skips let DFS end the current branch when no edge goes deeper, then return to saved junctions such as E and C.',
    },
    tip: { zh: '返回上一层在迭代 DFS 中表现为下一次 pop 栈中保存的旧节点。', en: 'Backtracking in iterative DFS appears as the next pop of an older saved node.' },
  },
  {
    stepId: 'done',
    title: { zh: '⑨ 栈空：深入、回退、顺序与边界', en: '⑨ Empty stack: depth, backtracking, order and boundaries' },
    explanation: {
      zh: '栈最终为空，真实访问顺序是 A → B → D → E → F → G → C。中途 C 一直在栈底等待，直到 B 分支经 D、E、F、G 全部结束才被弹出，这就是“沿路径深入再回退”。时间 O(V+E)，额外空间 O(V)。若图不连通，只访问起点可达分量；空图只有 init 与 done。访问序列受邻接顺序影响，不是唯一答案。',
      en: 'The stack ends empty and the real visit order is A → B → D → E → F → G → C. C waited at the bottom until B’s branch finished through D, E, F and G; that is “go deep, then backtrack”. Time is O(V+E), extra space O(V). A disconnected graph reaches only the start’s component, and an empty graph emits only init and done. Neighbour order affects the sequence, so it is not unique.',
    },
    tip: { zh: '迭代 DFS 与递归 DFS 都优先深入；这里用显式栈把回退过程显示出来。', en: 'Iterative and recursive DFS both go deep first; the explicit stack makes the backtracking visible.' },
  },
];

const BASE = {
  contentVersion: '1.0.0',
  prerequisites: GRAPH_COMMON.prerequisites,
  complexity: GRAPH_COMMON.complexity,
  commonMistakes: GRAPH_COMMON.commonMistakes,
};

export const bfsLesson: Lesson = {
  ...BASE,
  lessonId: 'graph-bfs-queue-basics',
  algorithmId: 'bfs',
  title: { zh: 'BFS：用队列逐层展开一张图', en: 'BFS: expand a graph level by level with a queue' },
  oneLiner: {
    zh: '广度优先搜索从起点一圈圈向外扩展；队列的先进先出决定谁先被处理，discovered 集合保证环不会无限重复。',
    en: 'Breadth-first search expands outward from the start in rings; the FIFO queue decides who is processed first, and the discovered set keeps cycles finite.',
  },
  overview: GRAPH_OVERVIEW,
  intuition: GRAPH_INTUITION,
  steps: BFS_STEPS,
};

export const dfsLesson: Lesson = {
  ...BASE,
  lessonId: 'graph-dfs-stack-basics',
  algorithmId: 'dfs',
  title: { zh: 'DFS：用显式栈沿路径深入再回退', en: 'DFS: go deep along a path, then backtrack with an explicit stack' },
  oneLiner: {
    zh: '深度优先搜索总优先处理最新发现的节点；显式栈的后进先出让它沿一条路径深入，走不通时再弹出旧岔路回退。',
    en: 'Depth-first search always prioritises the most recently discovered vertex; the LIFO explicit stack goes deep along one path, then pops an older junction to backtrack.',
  },
  overview: GRAPH_OVERVIEW,
  intuition: GRAPH_INTUITION,
  steps: DFS_STEPS,
};

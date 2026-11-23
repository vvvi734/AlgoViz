// CODE-DOC-04-BATCH-04 reviewed bilingual teaching annotations.
// Entries are merged after the base map so earlier reviewed anchors stay active.
export const BATCH_04_ANNOTATIONS: Record<
  string,
  readonly { en: string; zh: string }[]
> = {
  "components.c": [
    {
      "en": "Mark before recursing: an undirected edge leads back to the caller, and marking early prevents that cycle from recursing forever.",
      "zh": "递归前先标记：无向边会指回调用者，提前标记才能避免沿这个环无限递归。"
    },
    {
      "en": "The matrix scan checks every column, including the edge back to the parent; the visited test is what stops that walk.",
      "zh": "矩阵扫描会检查所有列，包括指回父结点的边；真正阻止沿这条边绕回去的是 visited 判断。"
    },
    {
      "en": "A component is counted only when the outer scan finds a vertex that no earlier DFS reached; one count therefore means one component.",
      "zh": "只有外层扫描遇到此前任何 DFS 都没到达的顶点时才增加分量数；因此一次计数恰好对应一个连通分量。"
    },
    {
      "en": "The printed order is DFS discovery order, not a sorted component label; membership, not the print sequence, defines the component.",
      "zh": "打印顺序是 DFS 发现顺序，不是排序后的分量编号；定义分量的是顶点归属，而不是打印次序。"
    },
    {
      "en": "The reverse cell is not optional: an undirected edge must be visible from both endpoints.",
      "zh": "反向单元不能省略：无向边必须能从两个端点分别看到。"
    },
    {
      "en": "The return value counts DFS starts, not the sum of vertex degrees or the number of edges.",
      "zh": "返回值统计的是 DFS 启动次数，不是顶点度数之和，也不是边数。"
    },
  ],
  "components.cpp": [
    {
      "en": "Mark before walking neighbours; otherwise the parent edge leads straight back and the recursion would not terminate.",
      "zh": "遍历邻居前先标记；否则父边会直接指回来，递归无法终止。"
    },
    {
      "en": "The range loop touches only stored adjacency entries, so total work over all calls is O(V+E), unlike the matrix version's O(V²).",
      "zh": "range-for 只访问实际存储的邻接项，因此所有调用合计是 O(V+E)，不同于矩阵版的 O(V²)。"
    },
    {
      "en": "Only an unvisited start opens a new component; a visited vertex already belongs to an earlier DFS tree.",
      "zh": "只有未访问的起点才开启新分量；已访问顶点已经属于更早的 DFS 树。"
    },
    {
      "en": "The visited array is sized from graph.size(), so the scan cannot silently skip a vertex or read past the graph.",
      "zh": "visited 按 graph.size() 分配，扫描既不会漏掉顶点，也不会读越界。"
    },
    {
      "en": "Both adjacency entries encode undirectedness; pushing only one direction would change the component structure.",
      "zh": "两条邻接记录共同表达无向性；只压入一个方向会改变连通分量结构。"
    },
  ],
  "components.py": [
    {
      "en": "Mark before the loop; an undirected neighbour may point back to the caller, and a late mark would recurse forever.",
      "zh": "进入循环前先标记；无向邻居可能指回调用者，标记太晚就会无限递归。"
    },
    {
      "en": "The list holds only real neighbours; each undirected edge is seen once from each endpoint, so total work is O(V+E).",
      "zh": "列表中只有真实邻居；每条无向边会从两个端点各看到一次，所以总工作量是 O(V+E)。"
    },
    {
      "en": "component is the per-start result list; append order is DFS discovery order, not a sorted or canonical component order.",
      "zh": "component 是每次启动独立的结果表；追加顺序是 DFS 发现顺序，不是排序或规范化的分量顺序。"
    },
    {
      "en": "A fresh list is built from the current graph size; no mark from a previous call can leak into this one.",
      "zh": "按当前图规模新建列表；上一次调用留下的标记不会泄漏到这一次。"
    },
    {
      "en": "Appending both directions is the only place this undirected graph records symmetry.",
      "zh": "双向追加是这个无向图唯一记录对称性的地方。"
    },
  ],
  "scc.c": [
    {
      "en": "Mark on entry before exploring; a directed cycle would otherwise recurse back into the same vertex.",
      "zh": "进入时立即标记再探索；否则有向环会递归回同一个顶点。"
    },
    {
      "en": "Append after the neighbour loop: this is finish order, not discovery order, and Kosaraju reads it backwards.",
      "zh": "邻居循环结束后才追加：这里记录的是完成顺序而不是发现顺序，Kosaraju 会倒着读它。"
    },
    {
      "en": "The first pass leaves every vertex visited; the second pass needs a clean marking array or it would collect nothing.",
      "zh": "第一遍结束后所有顶点都已标记；第二遍必须清空标记，否则一个分量也收集不到。"
    },
    {
      "en": "Flipping the endpoints builds the transpose; using the original graph in the second pass would follow forward edges instead.",
      "zh": "交换端点得到反向图；第二遍若仍用原图，就会沿正向边搜索。"
    },
    {
      "en": "Kosaraju reads finish order backwards; starting at index 0 would begin from a sink-side vertex and can split an SCC.",
      "zh": "Kosaraju 按完成顺序的逆序处理；从下标 0 开始会从汇侧顶点出发，可能把一个强连通分量拆开。"
    },
    {
      "en": "Each unvisited second-pass start is a new SCC; collect walks only the reversed graph and cannot leave that component.",
      "zh": "第二遍每个未访问起点都开启一个新 SCC；collect 只在反向图上走，不会越出该分量。"
    },
  ],
  "scc.cpp": [
    {
      "en": "Mark before iterating outgoing neighbours; a cycle would otherwise return to this vertex before it is recorded.",
      "zh": "遍历出边前先标记；否则环会在该顶点被记录前再次回到它。"
    },
    {
      "en": "push_back after the recursive calls records finish order; vector reallocation does not change the logical order.",
      "zh": "递归调用结束后 push_back，记录的是完成顺序；vector 扩容不会改变逻辑顺序。"
    },
    {
      "en": "Reset the whole marking array between passes; the first pass marked every reachable vertex.",
      "zh": "两遍之间要重置整个标记数组；第一遍已经标记了所有可达顶点。"
    },
    {
      "en": "The transpose is built while edges are read; storing the same direction again would not reverse the graph.",
      "zh": "读边时同步构建反向图；若仍存相同方向，就没有完成转置。"
    },
    {
      "en": "Reverse iterators read finish order backwards; the second pass must not use order.begin().",
      "zh": "反向迭代器从完成顺序末尾读起；第二遍不能用 order.begin()。"
    },
    {
      "en": "A second-pass DFS tree is exactly one SCC; the transposed graph keeps the search inside that source component.",
      "zh": "第二遍的一棵 DFS 树恰好是一个 SCC；转置图把搜索限制在该源分量内。"
    },
  ],
  "scc.py": [
    {
      "en": "Mark on entry; a directed cycle would otherwise recurse through the same vertex indefinitely.",
      "zh": "进入时先标记；否则有向环会反复经过同一顶点。"
    },
    {
      "en": "append after the neighbour loop stores finish order; this is the order that must be reversed for the second pass.",
      "zh": "邻居循环结束后 append，保存的是完成顺序；第二遍必须把它反过来用。"
    },
    {
      "en": "Rebinding a fresh list clears the first pass's marks; the second pass must not reuse the old visited list.",
      "zh": "重新绑定一个新列表来清除第一遍标记；第二遍不能复用旧的 visited。"
    },
    {
      "en": "Reversing each edge while building the graph is what makes the second pass a transpose search.",
      "zh": "建图时同时反转每条边，第二遍才是在转置图上搜索。"
    },
    {
      "en": "reversed(order) yields finish order backwards; using order directly violates Kosaraju's source-component order.",
      "zh": "reversed(order) 从完成顺序末尾读起；直接使用 order 会违反 Kosaraju 的源分量顺序。"
    },
    {
      "en": "collect starts only at an unvisited vertex; every tree it builds is one strongly connected component.",
      "zh": "collect 只从未访问顶点启动；它构建的每棵树就是一个强连通分量。"
    },
  ],
  "prim.c": [
    {
      "en": "Scanning every vertex to find the minimum key is why the matrix implementation is O(V^2).",
      "zh": "每轮扫描所有顶点寻找最小 key，正是矩阵实现为 O(V²) 的原因。"
    },
    {
      "en": "Only an unselected vertex can still cross the cut; strict < keeps the first lightest edge.",
      "zh": "只有未选顶点还能横跨切割；严格的 < 会保留最早出现的那条最轻边。"
    },
    {
      "en": "Only the source begins at zero; initializing every key to zero would make all vertices look already attached.",
      "zh": "只有源点从 0 开始；若把所有 key 都初始化为 0，每个顶点都会像已经接进树一样。"
    },
    {
      "en": "INF is the cut's no-edge marker; this break means the graph is disconnected, and the caller receives only the partial total.",
      "zh": "INF 表示切割上没有边；这里 break 说明图不连通，调用者只能拿到部分总权值。"
    },
    {
      "en": "Settle before relaxing; the selected flag prevents this vertex from being chosen again, so its final key cannot be overwritten.",
      "zh": "先确定再松弛；selected 标记防止该顶点被再次选中，因此它的最终 key 不会被覆盖。"
    },
    {
      "en": "The source has no parent; printing it would invent an edge with no endpoint.",
      "zh": "源点没有父结点；打印它会凭空造出一条没有另一端的边。"
    },
    {
      "en": "Once best is settled, only unselected neighbours can cross the cut; selected neighbours are already inside the tree.",
      "zh": "best 确定后，只有未选邻居还能横跨切割；已选邻居已经在树内。"
    },
    {
      "en": "This matrix uses zero for 'no edge'; a genuine zero-weight edge would be indistinguishable from absence.",
      "zh": "这个矩阵用 0 表示“没有边”；真正的零权边会与“无边”无法区分。"
    },
  ],
  "prim.cpp": [
    {
      "en": "The initial (0,0) is a cut seed, not a tree edge; its zero weight is deliberately excluded from the output.",
      "zh": "初始的 (0,0) 是切割种子，不是生成树边；它的零权值被刻意排除在输出之外。"
    },
    {
      "en": "A vertex can be pushed once per incident edge; the first pop settles it and every later entry is stale.",
      "zh": "一个顶点可能因每条关联边各入堆一次；第一次弹出就确定它，之后所有条目都已过期。"
    },
    {
      "en": "The root seed contributes zero; every nonzero accepted weight is one edge of the spanning tree.",
      "zh": "根种子贡献 0；之后每个非零的被接受权值才是一条生成树边。"
    },
    {
      "en": "This condition suppresses the root's zero weight, but it would also suppress a genuine zero-weight edge; the demo graph has none.",
      "zh": "这个条件屏蔽了根的零权，但也会屏蔽真正的零权边；演示图中没有这种边。"
    },
    {
      "en": "Pushing every unselected endpoint is a lazy decrease-key: the heap may hold O(E) candidates instead of one per vertex.",
      "zh": "把所有未选端点都入堆，是一种惰性 decrease-key：堆里可能有 O(E) 个候选，而不是每顶点一个。"
    },
    {
      "en": "An empty heap with vertices still unselected means the graph is disconnected; this demo prints the partial total without a failure flag.",
      "zh": "堆空但仍有未选顶点说明图不连通；这个演示只打印部分总权值，没有失败标记。"
    },
  ],
  "prim.py": [
    {
      "en": "A vertex may be pushed once per incident edge; the selected check discards stale, heavier entries.",
      "zh": "一个顶点可能因每条关联边各入堆一次；selected 检查会丢弃更旧、更重的过期条目。"
    },
    {
      "en": "The heap starts with a zero-weight seed for vertex 0; that entry is not an actual tree edge.",
      "zh": "堆用一个指向顶点 0 的零权种子启动；这个条目不是真正的树边。"
    },
    {
      "en": "A vertex may have several heap entries; the first pop settles it, and later entries are discarded as stale.",
      "zh": "一个顶点可能在堆里有多个条目；第一次弹出就确定它，后续条目都作为过期项丢弃。"
    },
    {
      "en": "The seed adds zero; only later accepted weights correspond to edges of the spanning tree.",
      "zh": "种子加的是 0；之后被接受的权值才对应生成树边。"
    },
    {
      "en": "This skips the zero-weight seed, but a real zero-weight edge would also be hidden; the demo has none.",
      "zh": "这里跳过零权种子，但真正的零权边也会被隐藏；演示图中没有这种边。"
    },
    {
      "en": "Pushing every unselected endpoint is a lazy decrease-key; the heap can grow to O(E) entries.",
      "zh": "把所有未选端点都入堆是惰性 decrease-key；堆的条目数可能达到 O(E)。"
    },
    {
      "en": "If the heap empties before every vertex is selected, the graph is disconnected and the printed total is only partial.",
      "zh": "若堆在所有顶点选中前就空了，图不连通，打印的总权值只是部分结果。"
    },
  ],
  "kruskal.c": [
    {
      "en": "Each vertex starts as its own representative; an uninitialized parent would make find() follow an arbitrary index.",
      "zh": "每个顶点先做自己的代表；父数组未初始化会让 find() 沿任意下标走。"
    },
    {
      "en": "Sorting first is the greedy precondition; scanning an arbitrary edge order can accept a heavy edge before a cheap one.",
      "zh": "先排序是贪心的前提；按任意边序扫描可能先接受重边、后接受轻边。"
    },
    {
      "en": "UnionRoots returns false exactly when both endpoints already share a root; that edge would close a cycle.",
      "zh": "两端已经同根时 UnionRoots 返回 false；这条边会形成环，必须跳过。"
    },
    {
      "en": "Union by rank attaches the shorter tree under the taller one; only equal ranks increase a rank.",
      "zh": "按秩合并把较矮的树挂到较高的树下；只有秩相等时才增加秩。"
    },
    {
      "en": "The accepted < V-1 stop is valid only when a spanning tree exists; a disconnected graph ends with fewer edges and no error.",
      "zh": "accepted < V−1 的提前停止只在生成树存在时成立；不连通图会少选边却仍正常返回。"
    },
    {
      "en": "accepted counts only edges that merged two different sets; rejected cycle edges never advance it.",
      "zh": "accepted 只统计真正合并了两个不同集合的边；被拒绝的成环边不会推进它。"
    },
  ],
  "kruskal.cpp": [
    {
      "en": "Every vertex starts in a singleton set; rank zero means all sets begin the same height.",
      "zh": "每个顶点先处在单元素集合中；秩为 0 表示所有集合初始高度相同。"
    },
    {
      "en": "std::sort is not stable, but equal-weight edges may be accepted in any order; every resulting MST is valid.",
      "zh": "std::sort 不稳定，但等权边可以按任意顺序被接受；得到的每棵最小生成树都有效。"
    },
    {
      "en": "Different roots mean the edge joins two components; equal roots mean accepting it would close a cycle.",
      "zh": "根不同说明这条边连接两个分量；根相同说明接受它会成环。"
    },
    {
      "en": "Path halving rewrites every other parent link as it climbs; the loop stops at the representative.",
      "zh": "路径减半在向上走时改写隔代父链接；循环停在代表元上。"
    },
    {
      "en": "4 is V-1 for this five-vertex demo; a generic implementation must derive the bound from the vertex count.",
      "zh": "这个五顶点演示里 4 就是 V−1；通用实现必须从顶点数推导这个上界。"
    },
  ],
  "kruskal.py": [
    {
      "en": "Each index is its own parent initially; a missing entry would make find fail before any edge is considered.",
      "zh": "每个下标初始都是自己的父结点；缺少一项会在考虑任何边之前就让 find 失败。"
    },
    {
      "en": "Path halving rewrites grandparent links while climbing; the returned vertex is the set representative.",
      "zh": "路径减半在爬升时改写祖父链接；最后返回的顶点就是集合代表。"
    },
    {
      "en": "Equal roots mean a and b are already connected; accepting this edge would close a cycle.",
      "zh": "根相同表示 a、b 已经连通；接受这条边会成环。"
    },
    {
      "en": "sorted is stable, but correctness does not depend on input order among equal weights; any valid MST is acceptable.",
      "zh": "sorted 是稳定的，但正确性不依赖等权边的输入次序；任何有效最小生成树都可以。"
    },
    {
      "en": "4 is V-1 for this five-vertex demo; a general implementation must use the actual vertex count.",
      "zh": "这个五顶点演示里 4 是 V−1；通用实现必须使用实际顶点数。"
    },
    {
      "en": "Only a successful union adds an edge; a rejected edge already had both endpoints in one set.",
      "zh": "只有合并成功才加入一条边；被拒绝的边两端本来就在同一集合。"
    },
  ],
  "topological_sort.c": [
    {
      "en": "The double loop scans every matrix cell; each 1 contributes one incoming edge, so the degree table costs O(V²).",
      "zh": "双重循环扫描整个矩阵；每个 1 贡献一条入边，因此入度表本身就要 O(V²)。"
    },
    {
      "en": "All zero-indegree vertices are ready at time zero; FIFO order is a valid tie-break, not a required order.",
      "zh": "所有入度为 0 的顶点在时刻 0 都已就绪；FIFO 只是合法的平局策略，不是唯一顺序。"
    },
    {
      "en": "head is the next unread slot, not the queue length; head == tail means the queue is empty.",
      "zh": "head 是下一个未读槽位，不是队列长度；head == tail 才表示队空。"
    },
    {
      "en": "A vertex is committed only after it leaves the queue; emitted is both the output length and the next write index.",
      "zh": "顶点出队后才写入结果；emitted 同时是输出长度和下一个写入下标。"
    },
    {
      "en": "Removing this vertex deletes one incoming edge from each neighbour; indegree reaches zero only once, so no duplicate enqueue.",
      "zh": "删除该顶点会让每个邻居失去一条入边；入度只会归零一次，所以不会重复入队。"
    },
    {
      "en": "A count below V is not a partial answer; it is the cycle certificate the caller must check.",
      "zh": "少于 V 的计数不是部分答案，而是调用者必须检查的“存在环”证据。"
    },
  ],
  "topological_sort.cpp": [
    {
      "en": "Every stored edge adds exactly one incoming count; parallel edges correctly raise it more than once.",
      "zh": "每条存储的边恰好增加一个入度；平行边会正确地把入度增加多次。"
    },
    {
      "en": "All zero-indegree vertices are ready initially; queue order chooses among valid topological orders.",
      "zh": "初始所有入度为 0 的顶点都已就绪；队列顺序只是在合法拓扑序之间做选择。"
    },
    {
      "en": "The vertex is appended after it leaves the ready queue; order is the accepted prefix, not a set of candidates.",
      "zh": "顶点离开就绪队列后才追加；order 是已接受的前缀，不是候选集合。"
    },
    {
      "en": "This is the moment the neighbour loses its last incoming edge; only then may it enter the queue.",
      "zh": "这一刻邻居失去最后一条入边；只有此时它才能入队。"
    },
    {
      "en": "A shorter order means some vertices never reached indegree zero; the graph has a directed cycle.",
      "zh": "order 更短说明有顶点从未达到入度 0；图中存在有向环。"
    },
  ],
  "topological_sort.py": [
    {
      "en": "Every edge adds exactly one incoming count; parallel edges correctly raise it more than once.",
      "zh": "每条边恰好增加一个入度；平行边会正确地增加多次。"
    },
    {
      "en": "The generator feeds only zero-indegree vertices; deque popleft makes this Kahn's FIFO variant.",
      "zh": "生成器只把入度为 0 的顶点送入队列；deque popleft 使这是 Kahn 的 FIFO 版本。"
    },
    {
      "en": "Append after popleft; order is the accepted prefix, not a set of ready vertices.",
      "zh": "popleft 之后才追加；order 是已接受的前缀，不是就绪顶点集合。"
    },
    {
      "en": "Removing one out-edge lowers one neighbour; equality with zero is the only enqueue trigger.",
      "zh": "删除一条出边就降低一个邻居的入度；只有等于 0 才是入队触发条件。"
    },
    {
      "en": "6 is the demo's vertex count; a generic caller must compare with len(graph), which this demo does not.",
      "zh": "6 是演示图的顶点数；通用调用者必须与 len(graph) 比较，而这个演示没有这样做。"
    },
  ],
  "critical_path.c": [
    {
      "en": "This C version assumes ACTIVITIES is already in topological order; a random edge order would use unfinished predecessors.",
      "zh": "这个 C 版假定 ACTIVITIES 已按拓扑序排列；任意边序会用到尚未完成的前驱。"
    },
    {
      "en": "Earliest time is the latest possible finish over all incoming activities; taking max prevents a later predecessor from being ignored.",
      "zh": "最早时间要取所有入边完成时刻的最大值；取 max 才能不忽略较晚的前驱。"
    },
    {
      "en": "Every latest time starts at the project duration because the demo has one sink at event 5; multiple sinks need their own deadlines.",
      "zh": "所有最迟时间先设为总工期，因为演示只有一个汇点（事件 5）；多汇点需要各自的截止时间。"
    },
    {
      "en": "The reverse scan walks the edge array backwards; this is a reverse topological order only if the array was topologically sorted.",
      "zh": "逆推沿边表倒着走；只有边表本身按拓扑序排列时，这才是逆拓扑序。"
    },
    {
      "en": "Latest time is the minimum of successor latest minus duration; a smaller candidate forces this predecessor to start earlier.",
      "zh": "最迟时间取“后继最迟时间减持续时间”的最小值；候选更小就迫使该前驱更早开始。"
    },
    {
      "en": "Zero slack is the activity-level certificate: earliest start equals latest start, so any delay moves the project.",
      "zh": "零余量是活动级的证书：最早开始等于最迟开始，任何延迟都会推迟整个工程。"
    },
  ],
  "critical_path.cpp": [
    {
      "en": "Each activity adds one incoming edge to its target; Kahn can then process events only after all predecessors finish.",
      "zh": "每条活动给目标事件增加一条入边；Kahn 因此只会在所有前驱完成后处理该事件。"
    },
    {
      "en": "Earliest time is the maximum over incoming activities, not a sum; every predecessor must be able to finish first.",
      "zh": "最早时间取入边上的最大值而不是求和；每个前驱都必须先完成。"
    },
    {
      "en": "All latest times start at the project duration because event 5 is the demo's unique sink.",
      "zh": "所有最迟时间先设为总工期，因为事件 5 是演示中唯一的汇点。"
    },
    {
      "en": "order.rbegin() is the reverse topological order produced by the forward pass; an arbitrary order leaves latest times incomplete.",
      "zh": "order.rbegin() 是正推得到的逆拓扑序；任意顺序都会让最迟时间计算不完整。"
    },
    {
      "en": "The endpoint zero-slack checks and the duration equality together identify a critical activity; the equality is the actual zero-slack test.",
      "zh": "端点零余量检查与持续时间等式一起识别关键活动；其中等式才是真正的零余量判据。"
    },
    {
      "en": "The project duration is the earliest time of the unique sink, not the sum of all activity weights.",
      "zh": "总工期是唯一汇点的最早时间，不是所有活动权值之和。"
    },
  ],
  "critical_path.py": [
    {
      "en": "Each activity adds one incoming edge to its target; Kahn delays that event until every predecessor is done.",
      "zh": "每条活动给目标事件增加一条入边；Kahn 会等到所有前驱完成再处理它。"
    },
    {
      "en": "Earliest time is the maximum over incoming activities; max is required because all predecessors must finish.",
      "zh": "最早时间取入边上的最大值；因为所有前驱都必须完成，所以必须取 max。"
    },
    {
      "en": "All latest times start at the final event's earliest time because this demo has one sink.",
      "zh": "所有最迟时间先设为最终事件的最早时间，因为这个演示只有一个汇点。"
    },
    {
      "en": "reversed(order) is the reverse topological order from Kahn; using the forward order would read successors too early.",
      "zh": "reversed(order) 是 Kahn 产生的逆拓扑序；用正序会过早读取后继。"
    },
    {
      "en": "The two endpoint checks plus the weight equality identify zero-slack activities; the equality is the decisive test.",
      "zh": "两个端点检查加权值等式共同识别零余量活动；其中等式是决定性的判据。"
    },
    {
      "en": "This assertion documents the demo's project duration; it is not an input-validation check.",
      "zh": "这个断言只记录演示工程的总工期，不是输入校验。"
    },
  ],
  "dijkstra.c": [
    {
      "en": "This linear scan is why the matrix implementation costs O(V^2); a heap would avoid rescanning all vertices.",
      "zh": "这次线性扫描正是矩阵实现为 O(V²) 的原因；堆可以避免反复扫描所有顶点。"
    },
    {
      "en": "Every other distance stays INF; a finite initial value would pretend an unknown route is already known.",
      "zh": "其他距离都保持 INF；若先给有限值，就会把未知路线当成已知。"
    },
    {
      "en": "If the smallest unsettled tentative distance is still INF, every remaining vertex is unreachable.",
      "zh": "若未确定顶点中的最小暂定距离仍是 INF，剩下的顶点全都不可达。"
    },
    {
      "en": "The predecessor chain is followed backwards from the target; -1 is the source sentinel, so this assumes a reachable target.",
      "zh": "前驱链从目标反向走；−1 是源点哨兵，因此这里假定目标可达。"
    },
    {
      "en": "Only a strict improvement rewrites distance and predecessor; an equal alternative keeps the earlier path.",
      "zh": "只有严格变短才改写距离和前驱；等长的另一条路会保留先前路径。"
    },
    {
      "en": "The collected path is reversed only for printing; the predecessor chain itself stays target-to-source.",
      "zh": "收集到的路径只在打印时反转；前驱链本身仍是目标到源点。"
    },
  ],
  "dijkstra.cpp": [
    {
      "en": "The source is the only zero-distance entry; every other vertex begins at infinity.",
      "zh": "源点是唯一距离为 0 的条目；其他顶点都从无穷开始。"
    },
    {
      "en": "Dijkstra's proof needs non-negative weights; rejecting a negative edge is safer than silently returning a wrong path.",
      "zh": "Dijkstra 的正确性依赖非负权；拒绝负边比悄悄返回错误路径更安全。"
    },
    {
      "en": "An equal candidate is not an improvement; keeping the old predecessor avoids needless heap entries.",
      "zh": "等长候选不算改进；保留旧前驱可以避免无谓的堆条目。"
    },
    {
      "en": "path_to assumes target is reachable; an unreachable target has previous -1 and would produce only the target name.",
      "zh": "path_to 假定目标可达；不可达目标的 previous 是 −1，只会返回目标名。"
    },
    {
      "en": "The heap can hold stale entries for settled vertices, so the loop is not bounded by V.",
      "zh": "堆里可能保留已确定顶点的过期条目，因此循环次数不受 V 限制。"
    },
  ],
  "dijkstra.py": [
    {
      "en": "The source is the only finite initial distance; all other vertices start unknown at infinity.",
      "zh": "源点是唯一有有限初值的距离；其他顶点都以无穷表示未知。"
    },
    {
      "en": "A negative weight invalidates Dijkstra's finality argument, so the implementation rejects it explicitly.",
      "zh": "负权会破坏 Dijkstra 的“已确定即最终”论证，因此实现显式拒绝。"
    },
    {
      "en": "Only a strictly smaller candidate updates distance and predecessor; ties keep the earlier path.",
      "zh": "只有严格更小的候选才更新距离和前驱；等长时保留较早路径。"
    },
    {
      "en": "previous is None only at the source; a missing map entry would fail rather than invent a path.",
      "zh": "previous 只在源点为 None；缺少映射项会直接失败，而不是凭空造一条路径。"
    },
    {
      "en": "A vertex may be pushed several times; comparing the popped distance with the table discards older entries.",
      "zh": "同一顶点可能多次入堆；把弹出距离与表中距离比较，可以丢弃旧条目。"
    },
  ],
  "floyd_warshall.c": [
    {
      "en": "Both halves must be finite; adding INF would overflow the sentinel and create a fake route.",
      "zh": "两段都必须有限；把 INF 相加会溢出哨兵值并造出假路线。"
    },
    {
      "en": "Only a strict improvement replaces the current route; equality deliberately keeps the existing path.",
      "zh": "只有严格更短的路线才替换当前路线；相等时有意保留现有路径。"
    },
    {
      "en": "The update is in place; because middle is fixed for this round, no copy of the old matrix is needed.",
      "zh": "更新是原地的；本轮 middle 固定，因此不需要复制旧矩阵。"
    },
    {
      "en": "The input matrix is mutated; callers must not expect the original direct-edge matrix afterwards.",
      "zh": "输入矩阵会被原地修改；调用者之后不能再指望它还是原来的直接边矩阵。"
    },
    {
      "en": "Diagonal zero is the empty path; missing edges are INF rather than zero-weight edges.",
      "zh": "对角线 0 表示空路径；缺失边是 INF，而不是零权边。"
    },
    {
      "en": "Negative diagonal entries would signal a negative cycle, but this teaching version never checks the diagonal.",
      "zh": "负的对角线元素会提示负环，但这个教学版本从不检查对角线。"
    },
  ],
  "floyd_warshall.cpp": [
    {
      "en": "A row whose route to middle is missing cannot be extended through middle; skip before adding.",
      "zh": "若 from 到 middle 没有路线，就不能经 middle 扩展；相加前先跳过。"
    },
    {
      "en": "The second half is also a sentinel, not a finite weight; adding it would fabricate a path.",
      "zh": "第二段同样是哨兵而不是有限权值；相加会造出假路径。"
    },
    {
      "en": "With both halves finite, the candidate is a real route length that can be compared safely.",
      "zh": "两段都有限后，候选才是真实路线长度，可以安全比较。"
    },
    {
      "en": "Only a strict improvement rewrites the matrix entry; an equal route keeps the current distance unchanged.",
      "zh": "只有严格更短才改写矩阵项；等长路线保持当前距离不变。"
    },
    {
      "en": "The matrix is passed by non-const reference and updated in place; the original direct edges are lost after the call.",
      "zh": "矩阵以非 const 引用传入并原地更新；调用后原始直接边信息不再保留。"
    },
    {
      "en": "This implementation does not scan the diagonal for negative cycles; it only computes distances that may use negative edges.",
      "zh": "这个实现不扫描对角线检测负环；它只计算可能含负权边的距离。"
    },
    {
      "en": "4. The matrix is updated in place; this teaching version does not run negative-cycle detection.",
      "zh": "4. 矩阵原地更新；这个教学版本不运行负环检测。"
    },
  ],
  "floyd_warshall.py": [
    {
      "en": "A missing source-to-middle route cannot be extended; skip it before adding INF.",
      "zh": "source 到 middle 没有路线时不能扩展；在相加 INF 前跳过。"
    },
    {
      "en": "The second half is a sentinel too; checking both halves prevents a fake finite distance.",
      "zh": "第二段也是哨兵；同时检查两段才能避免假有限距离。"
    },
    {
      "en": "With both halves finite, the candidate is a real path length and can replace the direct route.",
      "zh": "两段都有限后，候选才是真实路径长度，可以与直接路线比较。"
    },
    {
      "en": "Only a strict improvement updates the matrix; equality keeps the existing route.",
      "zh": "只有严格更短才更新矩阵；相等时保留现有路线。"
    },
    {
      "en": "The function mutates dist in place and returns None; callers must keep the matrix if they need the original weights.",
      "zh": "函数原地修改 dist 并返回 None；调用者若需要原始权值必须自己保留矩阵。"
    },
    {
      "en": "This version does not detect negative cycles; a negative diagonal would be reported as an ordinary distance.",
      "zh": "这个版本不检测负环；负的对角线会被当作普通距离打印。"
    },
  ],
  "bellman_ford.c": [
    {
      "en": "V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.",
      "zh": "V−1 轮足够，因为一条最短简单路径最多使用 V−1 条边。"
    },
    {
      "en": "Every distance begins unknown; only the source is made finite.",
      "zh": "所有距离先设为未知；只有源点改为有限。"
    },
    {
      "en": "The source is the zero-length path to itself; this is the seed for every relaxation.",
      "zh": "源点到自身是长度为 0 的路径；它是所有松弛的起点。"
    },
    {
      "en": "An unreachable tail cannot relax; adding a negative weight to INF would create a fake finite distance.",
      "zh": "不可达的起点不能松弛；把负权加到 INF 上会造出假的有限距离。"
    },
    {
      "en": "A full pass with no change proves a fixed point; later passes would repeat the same comparisons.",
      "zh": "整轮没有任何改变就证明到达不动点；后续轮只会重复相同比较。"
    },
    {
      "en": "The extra pass runs after V-1 rounds; only a reachable edge can still improve and expose a negative cycle.",
      "zh": "额外一轮在 V−1 轮之后运行；只有可达边还能变短，才暴露负环。"
    },
    {
      "en": "A clean extra pass certifies that every reachable distance is final.",
      "zh": "额外一轮没有改进，证明所有可达距离都已最终确定。"
    },
  ],
  "bellman_ford.cpp": [
    {
      "en": "All vertices start unknown at the maximum int; assigning a fresh vector also discards old results.",
      "zh": "所有顶点先以 int 最大值表示未知；重新赋值整个 vector 也会丢弃旧结果。"
    },
    {
      "en": "The source is the only zero-distance seed; every other distance must be earned by relaxation.",
      "zh": "源点是唯一零距离种子；其他距离都必须通过松弛得到。"
    },
    {
      "en": "An unreachable tail is not relaxed; INF plus a negative weight would overflow or fake a finite route.",
      "zh": "不可达起点不松弛；INF 加负权会溢出或造出假有限路线。"
    },
    {
      "en": "No change in a whole pass means every edge already satisfies the triangle inequality for reachable vertices.",
      "zh": "整轮无改变说明所有可达顶点上的边都已满足三角不等式。"
    },
    {
      "en": "The detection pass only considers reachable tails; an unreachable negative cycle must not fail the result.",
      "zh": "检测轮只考虑可达起点；不可达的负环不应让结果失败。"
    },
    {
      "en": "Complexity: O(V * E); extra space O(V) for distances.",
      "zh": "复杂度：O(V·E)；额外空间为距离数组 O(V)。"
    },
  ],
  "bellman_ford.py": [
    {
      "en": "V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.",
      "zh": "V−1 轮足够，因为一条最短简单路径最多使用 V−1 条边。"
    },
    {
      "en": "All distances start unknown at infinity; only the source is made finite.",
      "zh": "所有距离先以无穷表示未知；只有源点改为有限。"
    },
    {
      "en": "The zero-length source path is the seed; every other value must be produced by relaxation.",
      "zh": "源点的零长度路径是种子；其他值都必须由松弛产生。"
    },
    {
      "en": "An unreachable tail cannot relax; adding a negative weight to infinity would fabricate a finite value.",
      "zh": "不可达起点不能松弛；把负权加到无穷会造出有限值。"
    },
    {
      "en": "A pass without change is a fixed point; further passes cannot improve any reachable distance.",
      "zh": "整轮无改变就是不动点；后续轮不会让任何可达距离更短。"
    },
    {
      "en": "Only a reachable tail can expose a negative cycle; unreachable cycles must not invalidate the answer.",
      "zh": "只有可达起点才能暴露负环；不可达的环不应让答案失效。"
    },
    {
      "en": "None is the explicit failure value for a reachable negative cycle; it is not an empty distance list.",
      "zh": "None 是“存在可达负环”的显式失败值，不是空距离表。"
    },
  ],
  "buddy_system.c": [
    {
      "en": "Find the smallest free block at or above the rounded target level.",
      "zh": "从向上取整的目标级开始，寻找最小可用的空闲块。"
    },
    {
      "en": "Halve the chosen block repeatedly; the left half stays the working block.",
      "zh": "反复平分选中的块；左半块保留为工作块。"
    },
    {
      "en": "A 32-byte request cannot fit once the root has been split and used.",
      "zh": "根块被分裂并占用后，32 字节请求已经放不下。"
    },
    {
      "en": "Only exact powers of two keep every split aligned; zero and non-power capacities are rejected before splitting begins.",
      "zh": "只有精确的 2 的幂才能保证每次分裂仍对齐；0 和非 2 的幂容量在分裂开始前就被拒绝。"
    },
    {
      "en": "level is ceil(log2(size)); request 3 therefore needs a level-2 block of size 4.",
      "zh": "level 是 ceil(log2(size))；因此请求 3 需要大小为 4 的 2 级块。"
    },
    {
      "en": "The heap starts as one free root covering [0, capacity); for the required power-of-two capacity, max_level is log2(capacity).",
      "zh": "堆从一个覆盖 [0, capacity) 的空闲根块开始；在容量为 2 的幂这一前提下，max_level 是 log2(capacity)。"
    },
    {
      "en": "Search upward from the rounded target level and stop at the first free level; taking a larger block would split more than necessary.",
      "zh": "从向上取整的目标级开始逐级查找，遇到第一个空闲级就停；取更大的块会造成不必要的分裂。"
    },
    {
      "en": "Each split keeps the left half in place and inserts the right half immediately after it; address order and the chosen index stay valid.",
      "zh": "每次分裂保留左半块在原位，并把右半块插到它后面；地址顺序和当前下标都保持有效。"
    },
    {
      "en": "The block is marked used only after all splits, so it stays free until every split has completed.",
      "zh": "所有分裂完成后才标记为已用，因此在全部分裂结束前它一直保持空闲。"
    },
    {
      "en": "XOR works because size is a power of two and the block is aligned; it gives the sibling address, not an arbitrary block.",
      "zh": "XOR 成立是因为大小是 2 的幂且块已对齐；它给出兄弟块地址，而不是任意块。"
    },
    {
      "en": "Merge only with a free buddy of exactly the same size; an allocated or differently sized neighbour blocks coalescing.",
      "zh": "只有大小完全相同且空闲的伙伴才能合并；已分配或大小不同的邻居都会阻止合并。"
    },
    {
      "en": "The merged interval starts at the smaller address; otherwise level and address no longer describe the same block.",
      "zh": "合并区间必须从较小地址开始；否则级别和地址就不再描述同一个块。"
    },
  ],
  "buddy_system.cpp": [
    {
      "en": "Find the smallest free block at or above the rounded target level.",
      "zh": "从向上取整的目标级开始，寻找最小可用的空闲块。"
    },
    {
      "en": "Halve the chosen block repeatedly; the left half stays the working block.",
      "zh": "反复平分选中的块；左半块保留为工作块。"
    },
    {
      "en": "A 32-byte request cannot fit once the root has been split and used.",
      "zh": "根块被分裂并占用后，32 字节请求已经放不下。"
    },
    {
      "en": "The constructor records the root level as log2(capacity) and puts the whole range in one free block.",
      "zh": "构造函数把根级别记为 log2(capacity)，并把整个区间放进一个空闲块。"
    },
    {
      "en": "The request is rounded up to a level; request 3 uses a size-4 block rather than a size-2 block.",
      "zh": "请求会向上取整到某个级别；请求 3 使用大小 4 的块，而不是大小 2 的块。"
    },
    {
      "en": "The first free level at or above target avoids splitting a larger block than the request requires.",
      "zh": "从目标级向上遇到的第一个空闲级，可以避免分裂出比请求更大的块。"
    },
    {
      "en": "Splitting keeps the left half and inserts the right half after it; vector insertion preserves address order.",
      "zh": "分裂保留左半块并把右半块插到后面；vector 插入维持地址顺序。"
    },
    {
      "en": "Mark the block used only after the split loop; a half-built split must not be published as allocated.",
      "zh": "分裂循环结束后才标记已用；拆分未完成时不能把块发布为已分配。"
    },
    {
      "en": "The XOR sibling formula assumes an aligned power-of-two block; a non-aligned interval would produce a meaningless address.",
      "zh": "XOR 兄弟公式假定块是已对齐的 2 的幂；未对齐区间会得到无意义的地址。"
    },
    {
      "en": "Only a free same-size buddy can merge; a used or differently sized neighbour stops the cascade.",
      "zh": "只有同大小且空闲的伙伴才能合并；已用或不同大小的邻居会终止级联合并。"
    },
    {
      "en": "The unified block must begin at the smaller address; otherwise address and level describe different intervals.",
      "zh": "统一块必须从较小地址开始；否则地址和级别描述的是不同区间。"
    },
  ],
  "buddy_system.py": [
    {
      "en": "Find the smallest free block at or above the rounded target level.",
      "zh": "从向上取整的目标级开始，寻找最小可用的空闲块。"
    },
    {
      "en": "Halve the chosen block repeatedly; the left half stays the working block.",
      "zh": "反复平分选中的块；左半块保留为工作块。"
    },
    {
      "en": "A 32-byte request cannot fit once the root has been split and used.",
      "zh": "根块被分裂并占用后，32 字节请求已经放不下。"
    },
    {
      "en": "For a power-of-two block size, bit_length()-1 is exactly log2(size).",
      "zh": "对 2 的幂大小的块，bit_length()−1 正好是 log2(size)。"
    },
    {
      "en": "Capacity is rejected at construction; later XOR buddy math would be invalid for a non-power-of-two range.",
      "zh": "容量在构造时就被拒绝；非 2 的幂区间会让后续 XOR 伙伴计算失效。"
    },
    {
      "en": "This expression rounds request up to its level; request 3 becomes level 2 (size 4).",
      "zh": "这个表达式把请求向上取整到级别；请求 3 变成 2 级（大小 4）。"
    },
    {
      "en": "Scan from the rounded level upward; the first free level avoids needless extra splitting.",
      "zh": "从取整后的级别向上扫描；第一个空闲级可以避免多余分裂。"
    },
    {
      "en": "The split loop keeps the left half and inserts the right half after it, preserving address order.",
      "zh": "分裂循环保留左半块并把右半块插到后面，维持地址顺序。"
    },
    {
      "en": "Only after all splits is the chosen block marked used; a half-split block must remain free.",
      "zh": "所有分裂完成后才标记选中块已用；只拆一半的块必须保持空闲。"
    },
    {
      "en": "XOR is the sibling address because size is a power of two and the block is aligned.",
      "zh": "XOR 能给出兄弟地址，是因为大小是 2 的幂且块已对齐。"
    },
    {
      "en": "A missing, used or differently sized buddy prevents merging at this level.",
      "zh": "伙伴不存在、已用或大小不同，都会阻止这一级合并。"
    },
    {
      "en": "The merged block starts at the smaller address; otherwise its address and level no longer match.",
      "zh": "合并块从较小地址开始；否则地址和级别不再匹配。"
    },
  ],
  "garbage_collection.c": [
    {
      "en": "Follow every outgoing edge; the marked test prevents cycles from looping.",
      "zh": "沿每条出边扩散；marked 判断阻止环无限循环。"
    },
    {
      "en": "References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.",
      "zh": "引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。"
    },
    {
      "en": "Clear marks before every collection; a stale mark from an earlier cycle would make an unreachable object look live.",
      "zh": "每轮收集前先清空标记；上一轮遗留的标记会把不可达对象误当成存活。"
    },
    {
      "en": "This demo has exactly one root, A at index 0; a real collector iterates an explicit root set.",
      "zh": "这个演示只有一个根 A（下标 0）；真正的收集器要遍历显式根集合。"
    },
    {
      "en": "DFS starts from the root set; the stack holds pending objects, not the object table itself.",
      "zh": "DFS 从根集合出发；栈保存待处理对象，不是对象表本身。"
    },
    {
      "en": "Pop order is LIFO; the exact order is irrelevant to reachability as long as every pending object is processed.",
      "zh": "弹出顺序是后进先出；只要每个待处理对象都被处理，具体顺序不影响可达性。"
    },
    {
      "en": "Mark when popping, not when pushing; duplicate pushes are possible before the first pop marks the object.",
      "zh": "弹出时才标记，而不是入栈时；对象第一次被弹出前可能已经重复入栈。"
    },
    {
      "en": "Scanning every reference for each object costs O(N*E); an adjacency list would make marking O(N+E).",
      "zh": "每个对象扫描全部引用是 O(N*E)；用邻接表可以把标记降到 O(N+E)。"
    },
    {
      "en": "Sweep frees every unmarked object; free is sticky until reset_graph rebuilds the object table.",
      "zh": "清除会释放所有未标记对象；free 状态会一直保留，直到 reset_graph 重建对象表。"
    },
    {
      "en": "Free spans are the gaps between consecutive live intervals; after compaction only one tail gap remains.",
      "zh": "空闲区间是相邻存活区间之间的空隙；紧缩后只剩尾部一个空隙。"
    },
    {
      "en": "Compaction moves live objects in object-array order; it preserves relative order but does not sort by original address.",
      "zh": "紧缩按对象数组顺序移动存活对象；它保持相对顺序，但不按原始地址排序。"
    },
    {
      "en": "compact() calls reset_graph(), so it is an independent demonstration rather than a continuation of mark_and_sweep().",
      "zh": "compact() 会调用 reset_graph()，因此它是独立演示，而不是接着 mark_and_sweep() 的结果继续。"
    },
  ],
  "garbage_collection.cpp": [
    {
      "en": "Follow every outgoing edge; the marked test prevents cycles from looping.",
      "zh": "沿每条出边扩散；marked 判断阻止环无限循环。"
    },
    {
      "en": "References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.",
      "zh": "引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。"
    },
    {
      "en": "Clear marks before each collection; a mark left from the previous cycle would keep garbage alive.",
      "zh": "每轮收集前清空标记；上一轮残留的标记会让垃圾继续存活。"
    },
    {
      "en": "The demo has one root, A at index 0; a general collector must iterate a real root set.",
      "zh": "演示只有一个根 A（下标 0）；通用收集器必须遍历真正的根集合。"
    },
    {
      "en": "The vector is a LIFO pending stack; reachability is independent of the traversal order.",
      "zh": "vector 是后进先出的待处理栈；可达性与遍历顺序无关。"
    },
    {
      "en": "Mark at pop time; an object can be pushed by several parents before its first pop marks it.",
      "zh": "弹出时才标记；对象第一次弹出前可能被多个父对象压栈。"
    },
    {
      "en": "Scanning all references for every popped object is O(N*E); an adjacency list would reduce marking to O(N+E).",
      "zh": "每弹出一个对象都扫描所有引用是 O(N*E)；邻接表可以把标记降到 O(N+E)。"
    },
    {
      "en": "Sweep frees every unmarked object; free is not cleared until reset_graph builds a fresh table.",
      "zh": "清除会释放所有未标记对象；free 直到 reset_graph 重建对象表才清除。"
    },
    {
      "en": "Free spans are gaps between live intervals; compaction leaves one contiguous tail span.",
      "zh": "空闲区间是存活区间之间的空隙；紧缩后只剩一段连续的尾部空隙。"
    },
    {
      "en": "Compaction moves objects in object-array order; the relative order is preserved, but it is not sorted by original address.",
      "zh": "紧缩按对象数组顺序移动对象；相对顺序保持，但不是按原始地址排序。"
    },
    {
      "en": "compact() resets the graph first, so it demonstrates compaction independently of the preceding mark-sweep output.",
      "zh": "compact() 先重置图，因此它独立演示紧缩，不依赖前一次标记清除的输出。"
    },
  ],
  "garbage_collection.py": [
    {
      "en": "Follow every outgoing edge; the marked test prevents cycles from looping.",
      "zh": "沿每条出边扩散；marked 判断阻止环无限循环。"
    },
    {
      "en": "References store object indices, not raw addresses; moving start changes the address derived from the object, not the stored index.",
      "zh": "引用保存对象下标而不是原始地址；移动 start 改变的是由对象派生的地址，不是存储的下标。"
    },
    {
      "en": "Clear marks before each collection; a stale True would make unreachable objects survive the sweep.",
      "zh": "每轮收集前清空标记；残留的 True 会让不可达对象逃过清除。"
    },
    {
      "en": "The demo has one root, A at index 0; a real collector must enumerate a root set.",
      "zh": "演示只有一个根 A（下标 0）；真正的收集器必须枚举根集合。"
    },
    {
      "en": "The list is a LIFO pending stack; the order does not affect which objects are reachable.",
      "zh": "列表是后进先出的待处理栈；顺序不影响哪些对象可达。"
    },
    {
      "en": "Mark at pop time; different parents may append the same object before it is first marked.",
      "zh": "弹出时才标记；不同父对象可能在同一对象首次标记前重复追加它。"
    },
    {
      "en": "Scanning every reference for each popped object is O(N*E); an adjacency list would make marking O(N+E).",
      "zh": "每个弹出对象都扫描全部引用是 O(N*E)；邻接表可以把标记降到 O(N+E)。"
    },
    {
      "en": "Sweep frees every unmarked object; the free flag persists until reset_graph creates a fresh table.",
      "zh": "清除释放所有未标记对象；free 标记会一直保留，直到 reset_graph 创建新表。"
    },
    {
      "en": "Free spans are the gaps between live intervals; after compaction there is one tail span.",
      "zh": "空闲区间是存活区间之间的空隙；紧缩后只剩尾部一段。"
    },
    {
      "en": "Compaction walks the object array, not the address-sorted list; relative order is preserved but not re-sorted by start.",
      "zh": "紧缩按对象数组遍历，而不是按地址排序；它保持相对顺序，但不按 start 重排。"
    },
    {
      "en": "compact() resets the graph, so it is an independent compaction demo rather than a continuation of mark_and_sweep().",
      "zh": "compact() 会重置图，因此它是独立的紧缩演示，而不是接着 mark_and_sweep()。"
    },
  ],
};

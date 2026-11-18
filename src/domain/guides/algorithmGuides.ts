import type { CuratedGuide } from './types';

/**
 * The three UX-01 reference guides. They intentionally cover three different
 * graph-algorithm families (weighted shortest path, DAG ordering, directed
 * reachability) so the shared template is tested against genuinely different
 * reasoning, not three variants of one outline.
 *
 * All wording below is original project copy. Complexity and course facts are
 * kept consistent with the registered lessons rather than re-derived here.
 */
export const CURATED_GUIDES: Record<string, CuratedGuide> = {
  dijkstra: {
    diagram: 'dijkstra',
    problem: {
      zh: '在一张带权图里，每条边都有一个成本，例如距离、时间或费用。Dijkstra 要回答：从指定起点出发，到其他节点（或某个目标）的最低总成本是多少，并且具体走哪条路。',
      en: 'In a weighted graph every edge has a cost such as distance, time or price. Dijkstra answers two questions from one source: what is the cheapest total cost to each other vertex, and which route achieves it?',
    },
    coreIdea: {
      zh: '把尚未确定的节点看成候选，把“目前已知的最便宜报价”记在距离表里。每一轮只从最小堆取出当前最便宜的候选并确定它，再用它检查出边，把更便宜的报价传给邻居。边权非负时，一个节点一旦以最小候选被确定，后面再绕路也不可能更便宜。',
      en: 'Treat unfinished vertices as candidates and store the cheapest known quote in a distance table. Each round pops the cheapest candidate from a min-heap, finalises it, then relaxes its outgoing edges. With non-negative weights, once a vertex is finalised at the smallest quote, no later detour can beat it.',
    },
    steps: [
      {
        title: { zh: '初始化距离表和候选堆', en: 'Initialise the distance table and candidate heap' },
        body: {
          zh: '给每个节点一个距离值，起点为 0，其余先记为 ∞；前驱表留空。把起点连同距离 0 放进最小堆，表示“目前只有起点有确定报价”。',
          en: 'Give every vertex a distance: 0 for the source and ∞ for the rest. Leave the predecessor table empty, then push the source with key 0 into the min-heap: it is the only quote known so far.',
        },
      },
      {
        title: { zh: '弹出当前最便宜的候选', en: 'Pop the cheapest candidate' },
        body: {
          zh: '从最小堆取出距离最小的条目。这个条目只是“候选报价”，不保证仍然新鲜；先比较它记录的距离和当前距离表，如果更大就跳过。',
          en: 'Remove the heap entry with the smallest distance. It is only a candidate quote, not a guarantee: compare its stored key with the current distance table and discard it if it is stale.',
        },
      },
      {
        title: { zh: '确定节点并记录前驱', en: 'Finalise the vertex and record its predecessor' },
        body: {
          zh: '若候选没有过期，这个节点就获得最终最短距离。把它标记为已确定，并在前驱表里记住“是从哪个节点走到这里的”，供之后还原路径。',
          en: 'If the candidate is not stale, this vertex now has its final shortest distance. Mark it finalised and record which vertex offered that quote in the predecessor table, so the route can be rebuilt later.',
        },
      },
      {
        title: { zh: '检查每一条出边', en: 'Inspect every outgoing edge' },
        body: {
          zh: '对当前节点指向的每个邻居，计算候选距离：当前节点的确定距离 + 这条边的权重。只检查出边，不重复走已经确定的节点。',
          en: 'For each neighbour of the finalised vertex, compute a candidate distance: the vertex’s final distance plus this edge’s weight. Follow outgoing edges only; do not expand finalised vertices again.',
        },
      },
      {
        title: { zh: '能变小才松弛', en: 'Relax only when the quote improves' },
        body: {
          zh: '如果候选距离比邻居当前记录更小，就更新距离表、把前驱改成当前节点，并把新候选压入最小堆。否则保留原报价，什么也不改。这一步叫松弛。',
          en: 'If the candidate is smaller than the neighbour’s current distance, update the table, point its predecessor at the current vertex and push the improved quote into the heap. Otherwise keep the old quote unchanged. This is relaxation.',
        },
      },
      {
        title: { zh: '重复直到没有候选', en: 'Repeat until the heap is empty' },
        body: {
          zh: '继续弹出、确定、松弛。已经确定的节点不再扩展；堆空时，所有从起点可达的节点都拿到了最短距离。若只关心一个目标，也可以在目标被确定时提前停止。',
          en: 'Keep popping, finalising and relaxing. Finalised vertices are never expanded again. When the heap empties, every vertex reachable from the source has its shortest distance; if only one target matters, stop as soon as it is finalised.',
        },
      },
      {
        title: { zh: '从目标回退出路径', en: 'Walk the predecessors back to the source' },
        body: {
          zh: '从目标节点开始，沿着前驱表一路回到起点，再把顺序翻转，就得到一条最短路径。若目标距离仍是 ∞，说明它不可达，不存在这样的路径。',
          en: 'Start at the target and follow predecessor links back to the source, then reverse the list to obtain a shortest path. If the target still has distance ∞, it is unreachable and no such path exists.',
        },
      },
    ],
    conditions: {
      zh: [
        '边权必须非负；出现负权边时，“已确定后不会再变小”的论证失效，应改用 Bellman-Ford。',
        '它解决单源最短路；要求所有点对之间的距离时，可以重复运行，或改用 Floyd-Warshall。',
        '有向图只检查出边；无向图要把每条边看成两个方向，权重相同。',
        '不可达节点的距离保持 ∞，不要误当成 0；起点到自己的距离是 0，路径只含起点。',
      ],
      en: [
        'All edge weights must be non-negative. A negative edge breaks the “finalised cannot improve” argument; use Bellman-Ford instead.',
        'It solves the single-source problem. For all-pairs distances, run it from every source or use Floyd-Warshall.',
        'On a directed graph, follow outgoing edges only. For an undirected graph, model each edge as two directions with the same weight.',
        'An unreachable vertex keeps distance ∞, not 0. The source-to-itself distance is 0 and its path contains only the source.',
      ],
    },
    memoryHook: {
      zh: '记忆：距离表 + 最小堆 + 松弛。每轮先弹最小候选，验过过期再确定；能变小才改距离和前驱。非负权是前提，负权请换 Bellman-Ford。',
      en: 'Remember: distance table + min-heap + relaxation. Pop the smallest candidate, reject stale entries, finalise, then update only improved quotes. Non-negative weights are the precondition; use Bellman-Ford for negative edges.',
    },
  },

  topological: {
    diagram: 'kahn',
    problem: {
      zh: '有一组有依赖关系的任务，例如“先修 A 才能做 B”。拓扑排序要把它们排成一个线性顺序，使每条有向边都从左指向右：所有前置任务都排在它的后继之前。',
      en: 'A set of tasks has dependencies such as “A must finish before B”. Topological sorting arranges them in a line so every directed edge points left-to-right: each prerequisite appears before everything that depends on it.',
    },
    coreIdea: {
      zh: '把入度看成“还没完成的前置数量”。入度为 0 的节点没有未完成依赖，可以立刻开工；把它放进队列，出队后删掉它的出边，邻居的入度就减一。不断有人减到 0，就不断有新的可开工任务。',
      en: 'Treat in-degree as the number of unfinished prerequisites. A vertex with in-degree 0 has no pending dependency and can start immediately. Queue it, remove its outgoing edges when it leaves, and each neighbour loses one prerequisite. Whenever a neighbour reaches 0, it becomes ready too.',
    },
    steps: [
      {
        title: { zh: '确认是有向图并统计入度', en: 'Confirm a directed graph and compute in-degrees' },
        body: {
          zh: '为每个节点建立入度计数，扫描所有有向边 from → to，每遇到一条就给 to 的入度加一，表示它多了一个前置。',
          en: 'Create an in-degree counter per vertex. Scan every directed edge from → to and increment the counter of to, recording one more prerequisite for it.',
        },
      },
      {
        title: { zh: '把零入度节点入队', en: 'Enqueue every zero-in-degree vertex' },
        body: {
          zh: '所有入度为 0 的节点都没有前置，先放进队列。它们可能来自互不相连的几个部分，这很正常。',
          en: 'Every vertex with in-degree 0 has no prerequisite, so place it in the queue. There may be several disconnected starting points; that is normal.',
        },
      },
      {
        title: { zh: '出队并加入拓扑序列', en: 'Dequeue and append to the order' },
        body: {
          zh: '从队列取出一个节点，追加到结果序列。它此刻的所有前置都已经被处理，因此放在当前位置是合法的。',
          en: 'Remove one vertex from the queue and append it to the result. All of its prerequisites have already been processed, so this position is valid.',
        },
      },
      {
        title: { zh: '删除出边，邻居入度减一', en: 'Remove outgoing edges and decrement neighbours' },
        body: {
          zh: '对它的每个邻居执行“删除这条边”：邻居的入度减一，表示刚完成的前置少了一个。不要修改原图时，可以只维护计数。',
          en: 'For each neighbour, simulate removing this edge: decrement its in-degree, meaning one prerequisite just finished. If the original graph must stay intact, maintain the counter only.',
        },
      },
      {
        title: { zh: '减到零的邻居入队', en: 'Enqueue neighbours that reach zero' },
        body: {
          zh: '如果某个邻居的入度刚好变成 0，它已经没有未完成前置，立即入队。注意：只有“刚减到 0”时才入队，避免重复入队。',
          en: 'If a neighbour’s counter just became 0, it has no pending prerequisite and is queued immediately. Enqueue only on the transition to 0 to avoid duplicates.',
        },
      },
      {
        title: { zh: '重复直到队列为空', en: 'Repeat until the queue is empty' },
        body: {
          zh: '继续出队、追加、删边、减入度。队列为空时，若结果覆盖了全部节点，就得到一个合法拓扑序。队列的先进先出顺序只影响同层节点的先后，不影响合法性。',
          en: 'Keep dequeuing, appending, removing edges and decrementing counters. When the queue empties, a result covering every vertex is a valid topological order. FIFO order only changes ties at the same level, not validity.',
        },
      },
      {
        title: { zh: '检查是否还剩节点', en: 'Check for leftover vertices' },
        body: {
          zh: '如果队列已空，但结果序列没有包含全部节点，剩下的节点彼此被环卡住，入度永远减不到 0。这说明图不是 DAG，不存在完整的拓扑序。',
          en: 'If the queue is empty but the result does not contain every vertex, the leftovers are stuck behind a directed cycle and their counters can never reach 0. The graph is not a DAG, so no complete topological order exists.',
        },
      },
    ],
    conditions: {
      zh: [
        '只适用于有向无环图（DAG）；只要存在有向环，就不可能给出覆盖全部节点的拓扑序。',
        '拓扑序通常不唯一：同一层里谁先谁后都可以，验证时应检查每条边的方向，而不是死记一个固定数组。',
        '图可以不连通；多个零入度起点会依次进入队列，仍然能得到合法结果。',
        '教学演示使用固定队列顺序让画面稳定，但不代表现实中的唯一答案。',
      ],
      en: [
        'It applies only to a directed acyclic graph (DAG). Any directed cycle makes a complete topological order impossible.',
        'The order is usually not unique: vertices at the same level may swap. Validate every edge direction instead of memorising one fixed array.',
        'The graph need not be connected. Multiple zero-in-degree sources simply enter the queue in turn and still produce a valid result.',
        'The teaching demo uses a fixed queue order for stable frames; that is not the only valid real-world answer.',
      ],
    },
    memoryHook: {
      zh: '记忆：入度表 + 零入度队列。出队就进答案，删边就减入度，减到零再入队；队列空了还有剩余，就说明有环。',
      en: 'Remember: in-degree table + zero-in-degree queue. Dequeue into the answer, remove edges to decrement counters, enqueue at zero; leftovers after an empty queue mean a cycle.',
    },
  },

  scc: {
    diagram: 'kosaraju',
    problem: {
      zh: '在有向图里，两个节点如果互相都能到达，就属于同一个强连通分量（SCC）。Kosaraju 要把整张图划分成若干个这样的最大互相可达小组。',
      en: 'In a directed graph, two vertices belong to the same strongly connected component (SCC) when each can reach the other. Kosaraju partitions the graph into these maximal mutually reachable groups.',
    },
    coreIdea: {
      zh: '先把每个 SCC 压缩成一个点，整张图就变成一张有向无环图。第一遍 DFS 记录“谁最后完成”，得到从汇点指向源点的顺序；在转置图里按完成顺序的逆序出发，就能一次只抓住一个 SCC，而不会顺着单向边跑到别的分量。',
      en: 'Contract each SCC to one node and the graph becomes a DAG. The first DFS records who finishes last, producing an order from sinks toward sources. Starting from that order in reverse on the transpose graph isolates one SCC at a time instead of following one-way edges into another component.',
    },
    steps: [
      {
        title: { zh: '明确有向图与 SCC 定义', en: 'Fix the directed graph and the SCC definition' },
        body: {
          zh: '只考虑有向边。单看“A 能到 B”不够，必须同时存在 B 回到 A 的路径；单个节点本身也自成一个 SCC，带自环时仍然只有一个节点。',
          en: 'Consider directed edges only. “A reaches B” alone is not enough: a path from B back to A must also exist. A single vertex is also an SCC by itself; a self-loop still leaves that one-vertex component intact.',
        },
      },
      {
        title: { zh: '第一遍 DFS：遍历原图', en: 'First pass: DFS on the original graph' },
        body: {
          zh: '从每个尚未访问的节点出发做 DFS，沿出边深入。访问状态只用于这一遍，目的是为每个节点得到一个完成时刻。',
          en: 'Start a DFS from every unvisited vertex and follow outgoing edges. The visited state belongs to this pass only; its purpose is to assign a finish time to every vertex.',
        },
      },
      {
        title: { zh: '记录完成顺序（后序）', en: 'Record finishing order (postorder)' },
        body: {
          zh: '一个节点的所有后代都处理完，才把它追加到完成列表。这个列表就是后序；最后完成的节点在最末尾。它与普通的“先序访问顺序”不是一回事。',
          en: 'Append a vertex only after all of its descendants have been processed. This list is the postorder; the last finished vertex sits at the end. It is not the same as the preorder discovery order.',
        },
      },
      {
        title: { zh: '构建转置图并保留完成顺序', en: 'Build the transpose and keep the finish order' },
        body: {
          zh: '把每条边 from → to 反转成 to → from，得到转置图。第一遍的完成列表必须保留；第二遍的访问标记要清空，不能沿用第一遍的状态。',
          en: 'Reverse every edge from → to into to → from to obtain the transpose. Preserve the first-pass finish list, but clear the visited marks before the second pass instead of reusing them.',
        },
      },
      {
        title: { zh: '按完成顺序的逆序选根', en: 'Pick roots in reverse finish order' },
        body: {
          zh: '从完成列表末尾向前扫描。遇到第二遍尚未分配的节点，就以它为根开一棵新的 DFS 树；这个根代表一个尚未提取的 SCC。',
          en: 'Scan the finish list from the end toward the beginning. The next vertex not yet assigned in the second pass becomes the root of a new DFS tree, representing one SCC not yet extracted.',
        },
      },
      {
        title: { zh: '在转置图上 DFS 收集分量', en: 'DFS on the transpose to collect the component' },
        body: {
          zh: '从根出发，只沿转置图的出边走，收集所有能到达的未分配节点。由于方向反转，这些节点正好是原图里能回到根、也能被根到达的节点，因此与根强连通。',
          en: 'From the root, follow only transpose outgoing edges and collect reachable unassigned vertices. Because directions are reversed, these are exactly the vertices that can reach the root in the original graph and be reached by it, so they are strongly connected with the root.',
        },
      },
      {
        title: { zh: '标记该 SCC 并继续', en: 'Mark the SCC and continue' },
        body: {
          zh: '把这一轮收集到的节点标为同一个 SCC，然后继续向前扫描完成列表。每个节点只会被分配一次；所有节点分配完毕时，所有 SCC 也就找齐了。',
          en: 'Mark the vertices collected in this round as one SCC, then continue scanning the finish list backwards. Every vertex is assigned once; when none remain, every SCC has been found.',
        },
      },
    ],
    conditions: {
      zh: [
        '只适用于有向图；无向图的连通分量与“强连通”不是同一个概念。',
        '需要额外保存一份转置图，空间为 O(V+E)；教学规模可以接受，超大图要注意内存。',
        '第一遍的完成顺序必须保留，第二遍的访问标记必须清空；两者混用会得到错误分组。',
        '单向链 A→B→C 是 3 个 SCC，不是 1 个；只有 C→A 也存在的环，才把三者合成一个。',
      ],
      en: [
        'It applies to directed graphs only. Undirected connected components are not the same notion as strong connectivity.',
        'It stores an extra transpose graph, costing O(V+E) space. Fine at teaching scale, but large graphs need memory care.',
        'Preserve the first-pass finish order and clear the visited marks for the second pass. Mixing the two states produces wrong groups.',
        'A one-way chain A→B→C is three SCCs, not one. Only when C→A also exists does the cycle merge all three.',
      ],
    },
    memoryHook: {
      zh: '记忆：原图跑完后序，转置图按后序逆序再跑。第一遍决定“从哪个汇点开始”，第二遍在反向边上只收集同一个分量。',
      en: 'Remember: postorder on the original, then reverse postorder on the transpose. Pass one decides which sink to start from; pass two collects one component along reversed edges.',
    },
  },
};

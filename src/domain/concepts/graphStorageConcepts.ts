import type { ConceptPage } from './types';

/**
 * TEXTBOOK-07 — chapter 7 storage structures.
 *
 * Four pages explain the same small graph through four different physical
 * layouts. The comparison page is deliberately separate: learners first read
 * one structure on its own terms, then compare the trade-offs in one table.
 */
export const GRAPH_STORAGE_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'graph-storage',
    topicId: 'graph-adjacency-matrix',
    title: ['邻接矩阵', 'Adjacency matrix'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '邻接矩阵用 n×n 个单元记录任意两个顶点之间是否有边；无向图的矩阵沿主对角线对称，有向图则不必对称。',
      'An adjacency matrix uses n×n cells to record whether an edge joins any two vertices. An undirected matrix is symmetric about the main diagonal; a directed one need not be.',
    ],
    diagram: 'graph-adjacency-matrix',
    definitions: [
      {
        term: ['行与列', 'Row and column'],
        text: [
          'A[i][j] 的 i 是边的起点（或第一个端点），j 是终点（或第二个端点）；无向图中 (i, j) 与 (j, i) 指同一条边。',
          'In A[i][j], i is the edge origin (or first endpoint) and j is the destination (or second endpoint). In an undirected graph, (i, j) and (j, i) name the same edge.',
        ],
      },
      {
        term: ['矩阵元素', 'Matrix entry'],
        text: [
          '无权图用 1/0 表示有边/无边；带权图保存权值，并用一个不会与合法权值混淆的标记表示无边。',
          'An unweighted graph stores 1/0 for edge/no edge. A weighted graph stores the weight and uses a marker that cannot be mistaken for a legal weight to mean “no edge”.',
        ],
      },
      {
        term: ['自环', 'Self-loop'],
        text: [
          '顶点 i 到自身的边落在 A[i][i]；简单图不允许自环时，主对角线全为 0。',
          'An edge from vertex i to itself lands in A[i][i]. If the graph is simple and forbids self-loops, the main diagonal is all zero.',
        ],
      },
    ],
    sections: [
      {
        title: ['一条边怎样落到单元格', 'How one edge lands in a cell'],
        body: [
          '下图把无向边 B–D 高亮出来：行 B、列 D 的单元与行 D、列 B 的单元必须同时为 1。行号回答“从哪个顶点出发”，列号回答“到达哪个顶点”，两个下标合起来才定位一条边。',
          'The diagram highlights undirected edge B–D: the cell at row B, column D and the cell at row D, column B must both be 1. The row answers “from which vertex”, the column answers “to which vertex”, and only the pair locates an edge.',
        ],
        points: [
          ['无向图：A[i][j] = A[j][i]，因为两个方向描述同一条边。', 'Undirected: A[i][j] = A[j][i], because both directions describe the same edge.'],
          ['有向图：A[i][j] = 1 只表示 i→j，不能推出 j→i。', 'Directed: A[i][j] = 1 means i→j only; it does not imply j→i.'],
        ],
        formula: 'undirected: A[i][j] = A[j][i]    directed: A[i][j] ≠ A[j][i] in general',
      },
      {
        title: ['带权图、零权边与无边', 'Weighted graphs, zero weights and absent edges'],
        body: [
          '带权图不能再用 0 同时表示“没有边”和“权值为 0”，否则两种含义无法区分。常见做法是用 ∞（或大于所有合法权值的哨兵）表示无边，让 0 继续表示一条真实的零权边；Dijkstra 的“无边”与“权值 0”必须严格分开。',
          'A weighted graph cannot use 0 for both “no edge” and “weight zero”, or the two meanings become indistinguishable. A common convention uses ∞ (or a sentinel larger than every legal weight) for no edge and keeps 0 for a genuine zero-weight edge; Dijkstra must keep “absent” and “weight 0” strictly separate.',
        ],
        points: [
          ['无权图可用 0/1；带权图应明确“无边”的哨兵。', 'An unweighted graph may use 0/1; a weighted graph must define its “absent” sentinel.'],
          ['自环写在 A[i][i]；无向图的自环只占一个对角单元。', 'A self-loop sits at A[i][i]; in an undirected graph it occupies one diagonal cell.'],
          ['平行边无法用单个单元表达；需要多重图时矩阵元素要保存边的集合或计数。', 'Parallel edges cannot be represented by one cell; a multigraph needs a set or count per cell.'],
        ],
      },
      {
        title: ['空间与操作代价', 'Space and operation costs'],
        body: [
          '矩阵的单元数与边数无关，始终是 n²。判断任意两点是否相邻只需一次下标访问，但列出顶点 i 的全部邻居要扫描整行，共 n 个单元。',
          'The number of cells is n² regardless of the edge count. Testing whether two vertices are adjacent takes one indexed access, but listing all neighbours of vertex i scans a full row of n cells.',
        ],
        points: [
          ['空间 O(n²)，适合稠密图。', 'Space O(n²), suitable for dense graphs.'],
          ['查边 O(1)；枚举邻居 O(n)。', 'Edge test O(1); neighbour enumeration O(n).'],
          ['插入或删除一条边只改一个或两个单元，O(1)。', 'Inserting or deleting an edge changes one or two cells, O(1).'],
        ],
        formula: 'space = n² cells',
      },
    ],
    takeaway: [
      '矩阵把“两点是否相邻”压成一次下标访问；代价是无论图多稀疏都要准备 n² 个单元。',
      'The matrix reduces “are these two adjacent?” to one indexed access; the price is n² cells even when the graph is sparse.',
    ],
  },
  {
    id: 'graph-adjacency-list',
    topicId: 'graph-adjacency-list',
    title: ['邻接表', 'Adjacency list'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '邻接表为每个顶点保存一条边链表，只记录真实存在的邻接关系；无向图的一条边会在两个端点的链中各出现一次。',
      'An adjacency list gives every vertex a linked list of incident edges and stores only real adjacencies. An undirected edge appears once in each endpoint’s chain.',
    ],
    diagram: 'graph-adjacency-list',
    definitions: [
      {
        term: ['顶点表', 'Vertex table'],
        text: [
          '每个顶点表项保存顶点信息和一个指向首条边结点的头指针；顶点表本身可以用数组顺序存储。',
          'Each vertex entry stores the vertex data and a head pointer to its first edge node; the vertex table itself may be an array.',
        ],
      },
      {
        term: ['边结点', 'Edge node'],
        text: [
          '边结点至少保存邻接点下标 adjvex 和指向下一条边结点的 next；带权图再加一个权值域。',
          'An edge node stores at least the neighbour index adjvex and a next pointer to the following edge node; a weighted graph adds a weight field.',
        ],
      },
      {
        term: ['出边表与逆邻接表', 'Out-edge and reverse lists'],
        text: [
          '有向图的邻接表通常只挂出边，入度不容易直接枚举；逆邻接表按入边组织，二者互补。',
          'A directed adjacency list usually stores outgoing arcs, so in-edges are awkward to enumerate; a reverse adjacency list organises incoming arcs, and the two are complementary.',
        ],
      },
    ],
    sections: [
      {
        title: ['一条无向边变成两条边结点', 'One undirected edge becomes two nodes'],
        body: [
          '无向边 (u, v) 同时属于 u 和 v 的邻接关系：u 的链中要有“邻接点 v”，v 的链中也要有“邻接点 u”。因此 n 个顶点、e 条边的无向图需要 2e 个边结点。有向图的一条弧只登记在起点链中，通常只需 e 个边结点。',
          'Undirected edge (u, v) belongs to both endpoints: u’s chain needs “neighbour v” and v’s chain needs “neighbour u”. Thus an undirected graph with n vertices and e edges needs 2e edge nodes. A directed arc is registered only in its origin’s chain, so it usually needs e edge nodes.',
        ],
        points: [
          ['邻接表的边结点数取决于方向语义，不能把无向图按 e 个结点估算。', 'The edge-node count depends on direction semantics; do not estimate an undirected graph as e nodes.'],
          ['链表中邻接点的先后次序不影响“是否相邻”，但会影响遍历输出的顺序。', 'The order inside a chain does not change adjacency, but it does change the order printed by a traversal.'],
          ['带权图把权值放在边结点中；同一对顶点之间若允许平行边，可出现多个结点。', 'A weighted graph stores the weight in the edge node; parallel edges become multiple nodes if the model allows them.'],
        ],
      },
      {
        title: ['空间与操作代价', 'Space and operation costs'],
        body: [
          '邻接表的空间由顶点表和边结点共同决定，为 O(n + e)；无向图按 2e 个边结点计数。判断 (u, v) 是否有边要沿 u 的链扫描，最坏 O(deg(u))；枚举 u 的邻居则正好走完这条链，代价 O(deg(u))。',
          'Adjacency-list space combines the vertex table and edge nodes, O(n + e); an undirected graph counts 2e edge nodes. Testing (u, v) scans u’s chain, worst case O(deg(u)); enumerating u’s neighbours walks exactly that chain, also O(deg(u)).',
        ],
        points: [
          ['稀疏图只分配真实边，避免矩阵的大量空单元。', 'A sparse graph allocates only real edges and avoids the matrix’s empty cells.'],
          ['插入一条边只需在两端（无向图）或起点（有向图）的表头插入，O(1)。', 'Inserting an edge is O(1) at the head of the required chains.'],
          ['删除一条边要先找到它，通常需要扫描对应链。', 'Deleting an edge first requires finding it, usually by scanning the relevant chain.'],
        ],
        formula: 'space = n vertex entries + e edge nodes (2e for undirected graphs)',
      },
      {
        title: ['有向图：出边与入边', 'Directed graphs: outgoing and incoming'],
        body: [
          '若要同时回答“u 能到谁”和“谁能到 u”，只存出边表不够。可以同时维护邻接表和逆邻接表，或者改用十字链表，让同一条弧同时进入起点出链和终点入链。',
          'If the algorithm must answer both “where can u go?” and “who can reach u?”, outgoing lists alone are insufficient. Maintain both an adjacency list and a reverse list, or use an orthogonal list so one arc joins its origin’s out-chain and its destination’s in-chain.',
        ],
        points: [
          ['出度：数 u 的出边链长度。', 'Out-degree: count the length of u’s outgoing chain.'],
          ['入度：普通邻接表要扫描所有链；逆邻接表可直接数 u 的入边链。', 'In-degree: a normal adjacency list must scan every chain; a reverse list counts u’s incoming chain directly.'],
          ['BFS/DFS 只需要出边或邻接点，普通邻接表已经足够。', 'BFS/DFS only needs outgoing arcs or neighbours, so an ordinary adjacency list suffices.'],
        ],
      },
    ],
    comparison: {
      title: ['邻接表与逆邻接表', 'Adjacency list vs reverse list'],
      columns: [
        ['比较项', 'Aspect'],
        ['邻接表', 'Adjacency list'],
        ['逆邻接表', 'Reverse adjacency list'],
      ],
      rows: [
        [
          ['保存的弧', 'Stored arcs'],
          ['以 u 为起点的出弧', 'Arcs leaving u'],
          ['以 u 为终点的入弧', 'Arcs entering u'],
        ],
        [
          ['直接得到的量', 'Directly available'],
          ['u 的出度与可达邻居', 'u’s out-degree and reachable neighbours'],
          ['u 的入度与前驱邻居', 'u’s in-degree and predecessor neighbours'],
        ],
        [
          ['典型用途', 'Typical use'],
          ['BFS、DFS、拓扑排序的入度初始化需另算', 'BFS, DFS; topological in-degree needs extra work'],
          ['反向搜索、Kosaraju 第二遍', 'Reverse search, Kosaraju’s second pass'],
        ],
      ],
    },
    takeaway: [
      '邻接表按真实边分配空间；无向边记两次，有向弧只记起点。',
      'An adjacency list allocates by real edges: undirected edges appear twice, directed arcs only at their origin.',
    ],
  },
  {
    id: 'graph-orthogonal-list',
    topicId: 'graph-orthogonal-list',
    title: ['十字链表', 'Orthogonal list'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '十字链表把每条有向弧只存一次，同时挂进起点的出边链和终点的入边链，因此能快速得到出度和入度。',
      'An orthogonal list stores each directed arc once and links it into both its origin’s out-chain and its destination’s in-chain, giving fast access to out-degree and in-degree.',
    ],
    diagram: 'graph-orthogonal-list',
    definitions: [
      {
        term: ['顶点节点', 'Vertex node'],
        text: [
          '保存顶点数据、firstin（第一条入弧）和 firstout（第一条出弧）；两个头指针分别进入两条链。',
          'Stores the vertex data, firstin (first incoming arc) and firstout (first outgoing arc); the two head pointers open two independent chains.',
        ],
      },
      {
        term: ['弧节点', 'Arc node'],
        text: [
          'tailvex 是弧尾（起点），headvex 是弧头（终点）；hlink 指向下一条同弧头的弧，tlink 指向下一条同弧尾的弧。',
          'tailvex is the arc tail (origin) and headvex the arc head (destination); hlink leads to the next arc with the same head, tlink to the next arc with the same tail.',
        ],
      },
      {
        term: ['入链与出链', 'In-chain and out-chain'],
        text: [
          '沿 firstout 再走 tlink 得到全部出弧；沿 firstin 再走 hlink 得到全部入弧。两条链共享同一个弧节点。',
          'Following firstout and then tlink visits all outgoing arcs; following firstin and then hlink visits all incoming arcs. Both chains share the same arc node.',
        ],
      },
    ],
    sections: [
      {
        title: ['同一条弧为什么出现在两条链中', 'Why one arc appears in two chains'],
        body: [
          '以 A→C 为例：从 A 看，它是 A 的出弧，应进入 A 的 firstout 链；从 C 看，它是 C 的入弧，应进入 C 的 firstin 链。十字链表不复制弧节点，而是让同一个节点的 tlink 服务起点链、hlink 服务终点链。',
          'Take A→C. From A it is an outgoing arc and belongs to A’s firstout chain; from C it is an incoming arc and belongs to C’s firstin chain. The orthogonal list does not duplicate the arc node: the same node serves the origin chain through tlink and the destination chain through hlink.',
        ],
        points: [
          ['tlink 只在“同弧尾”的弧之间跳转。', 'tlink jumps only between arcs with the same tail.'],
          ['hlink 只在“同弧头”的弧之间跳转。', 'hlink jumps only between arcs with the same head.'],
          ['firstout/firstin 为空的顶点，其对应出度或入度为 0。', 'A vertex with an empty firstout or firstin has out-degree or in-degree zero.'],
        ],
      },
      {
        title: ['字段固定，链方向不混淆', 'Fixed fields, unambiguous chains'],
        body: [
          '弧节点中的 tailvex/headvex 一旦写入就不再随链变化；链指针只负责“下一条是谁”。因此从任意弧节点都能立即读出起点和终点，不需要依赖它在哪条链里。',
          'Once tailvex/headvex are written they do not change as links are rearranged; link fields only say “which node is next”. Any arc node therefore reveals its origin and destination directly, independent of which chain currently reaches it.',
        ],
        points: [
          ['出度可在 O(1) 内读取吗？不能；要沿 tlink 计数，代价 O(出度)。', 'Can out-degree be read in O(1)? No; count along tlink in O(out-degree).'],
          ['插入一条弧要在起点出链和终点入链各接一次，指针顺序必须谨慎。', 'Inserting an arc touches both the origin out-chain and destination in-chain; pointer order matters.'],
          ['十字链表适合有向稀疏图，尤其是同时需要出边和入边查询的场景。', 'The orthogonal list suits sparse directed graphs that need both outgoing and incoming queries.'],
        ],
      },
      {
        title: ['空间与适用性', 'Space and applicability'],
        body: [
          '每条弧只有一个弧节点，空间为 O(n + e)。与同时维护邻接表和逆邻接表相比，它省掉了第二份弧节点，但每个节点多了一个链指针，字段和指针维护更复杂。',
          'Each arc has one node, so space is O(n + e). Compared with maintaining both an adjacency list and a reverse list, it avoids a second copy of every arc node, but each node carries an extra link and the pointer maintenance is more intricate.',
        ],
        points: [
          ['适合有向图；无向图通常使用邻接多重表。', 'Designed for directed graphs; undirected graphs usually use an adjacency multilist.'],
          ['删除弧时要同时从两条链中摘除同一个节点。', 'Deleting an arc removes the same node from two chains.'],
          ['若算法只枚举出边，普通邻接表更简单。', 'If an algorithm only enumerates outgoing arcs, a plain adjacency list is simpler.'],
        ],
        formula: 'space = n vertex nodes + e arc nodes',
      },
    ],
    takeaway: [
      '十字链表的核心不是两个指针，而是“一条弧、两条链”：tlink 管同尾，hlink 管同头。',
      'The key is not two pointers but “one arc, two chains”: tlink groups equal tails, hlink groups equal heads.',
    ],
  },
  {
    id: 'graph-adjacency-multilist',
    topicId: 'graph-adjacency-multilist',
    title: ['邻接多重表', 'Adjacency multilist'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '邻接多重表用一条边节点表示一条无向边，并让这个节点同时属于两个端点的关联边链，避免邻接表中的两份边记录。',
      'An adjacency multilist represents one undirected edge with one edge node that belongs to both endpoint chains, avoiding the two records used by an ordinary adjacency list.',
    ],
    diagram: 'graph-adjacency-multilist',
    definitions: [
      {
        term: ['ivex 与 jvex', 'ivex and jvex'],
        text: [
          '一条无向边的两个端点下标；哪个端点写在 ivex、哪个写在 jvex 只是本节点的约定，必须与实际连接一致。',
          'The two endpoint indices of one undirected edge. Which endpoint is stored in ivex and which in jvex is a local convention that must match the actual links.',
        ],
      },
      {
        term: ['ilink 与 jlink', 'ilink and jlink'],
        text: [
          'ilink 指向“下一条关联到 ivex 的边”，jlink 指向“下一条关联到 jvex 的边”；两个指针各自延续一个端点的边链。',
          'ilink points to the next edge incident to ivex, and jlink to the next edge incident to jvex; each pointer continues one endpoint’s incidence chain.',
        ],
      },
      {
        term: ['顶点 firstedge', 'Vertex firstedge'],
        text: [
          '每个顶点节点保存一个 firstedge，指向它的第一条关联边；沿该边的 ilink 或 jlink（取决于该顶点是本边的哪个端点）继续走。',
          'Each vertex node stores firstedge, pointing to its first incident edge. Continue through that edge’s ilink or jlink depending on which endpoint this vertex is for that edge.',
        ],
      },
    ],
    sections: [
      {
        title: ['一条边，一个节点', 'One edge, one node'],
        body: [
          '普通邻接表把无向边 (u, v) 存成 u 链中的 v 和 v 链中的 u 两个结点。邻接多重表只建一个边节点，ivex=u、jvex=v；u 通过 ilink 继续，v 通过 jlink 继续。边节点的数量从 2e 降为 e。',
          'An ordinary adjacency list stores undirected edge (u, v) as one node for v in u’s chain and another node for u in v’s chain. The multilist creates one edge node with ivex=u and jvex=v; u continues through ilink and v through jlink. The edge-node count drops from 2e to e.',
        ],
        points: [
          ['边节点同时服务两个端点，不能被画成两份。', 'The edge node serves both endpoints and must not be drawn twice.'],
          ['同一个边节点在不同端点的链中可能通过不同字段被访问。', 'The same edge node may be reached through different link fields from different endpoint chains.'],
          ['无向图才使用这种结构；有向弧有明确起终点，应使用十字链表。', 'This structure is for undirected graphs; directed arcs have a definite origin and destination and belong in an orthogonal list.'],
        ],
      },
      {
        title: ['删除一条边时发生了什么', 'What deleting an edge involves'],
        body: [
          '删除边 (u, v) 要先在 u 的关联链和 v 的关联链中找到同一个边节点，再分别修改前驱的 ilink 或 jlink。因为只有一份边记录，删除后不会出现“删了一份、另一份还在”的不一致。',
          'Deleting edge (u, v) means locating the same edge node in both u’s and v’s incidence chains, then updating the predecessor’s ilink or jlink. Because there is only one record, no “one copy deleted, the other left behind” inconsistency can arise.',
        ],
        points: [
          ['查找一条边仍需沿端点的关联链扫描，最坏 O(deg(u))。', 'Finding an edge still scans an endpoint’s incidence chain, worst case O(deg(u)).'],
          ['插入边要在两个端点的链中各接一次，但复用同一个节点。', 'Inserting an edge links it into two endpoint chains while reusing one node.'],
          ['字段较多，指针顺序比普通邻接表更容易写错。', 'More fields make pointer order easier to get wrong than in a plain adjacency list.'],
        ],
      },
      {
        title: ['空间与适用性', 'Space and applicability'],
        body: [
          '顶点节点 n 个、边节点 e 个，空间 O(n + e)；与无向邻接表的 2e 个边结点相比更省空间。它适合需要频繁按边处理、又不想维护两份边记录的无向稀疏图。',
          'There are n vertex nodes and e edge nodes, so space is O(n + e), smaller than an undirected adjacency list’s 2e edge nodes. It suits sparse undirected graphs that process edges frequently and do not want two records per edge.',
        ],
        points: [
          ['枚举顶点 u 的全部关联边：沿 firstedge 出发的链走完。', 'Enumerating all edges incident to u walks the chain starting at firstedge.'],
          ['适合边删除、边标记等以边为中心的操作。', 'Suits edge-centric operations such as edge deletion or edge marking.'],
          ['若只需枚举邻居，普通邻接表更直观。', 'If only neighbours are needed, a plain adjacency list is more direct.'],
        ],
        formula: 'space = n vertex nodes + e edge nodes',
      },
    ],
    takeaway: [
      '邻接多重表不是“邻接表画两遍”，而是让一个边节点同时被两个端点链引用。',
      'An adjacency multilist is not an adjacency list drawn twice: one edge node is referenced by both endpoint chains.',
    ],
  },
  {
    id: 'graph-storage-comparison',
    topicId: 'graph-storage-comparison',
    title: ['四种存储结构对比', 'Comparing four graph layouts'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '四种结构保存的是同一张图的同一组顶点和边，差别在空间、边查询、邻居枚举以及是否同时需要入边和出边信息。',
      'All four layouts store the same vertices and edges; they differ in space, edge lookup, neighbour enumeration, and whether both incoming and outgoing information is needed.',
    ],
    diagram: 'graph-storage-comparison',
    definitions: [
      {
        term: ['结构选择', 'Choosing a layout'],
        text: [
          '选择由图的稠密程度和主要操作决定，不存在对所有图都最优的存储结构。',
          'The choice follows graph density and the dominant operations; no layout is best for every graph.',
        ],
      },
      {
        term: ['边记录数', 'Edge-record count'],
        text: [
          '无向邻接表有 2e 条边结点；十字链表与邻接多重表各只有 e 个边节点；矩阵固定有 n² 个单元。',
          'An undirected adjacency list has 2e edge nodes; orthogonal and multilist layouts each have e edge nodes; a matrix always has n² cells.',
        ],
      },
    ],
    sections: [
      {
        title: ['先看规模，再看操作', 'Density first, operations second'],
        body: [
          '边数接近 n² 时，矩阵的空单元不再浪费，且 O(1) 查边很有价值；边数远小于 n² 时，按边分配的链式结构更省空间。随后再问：算法主要枚举邻居、查任意两点是否相邻，还是需要同时取出边和入边？',
          'When the edge count is close to n², the matrix wastes few cells and its O(1) edge test is valuable. When the edge count is far below n², edge-allocated linked structures save space. Then ask what the algorithm does most: enumerate neighbours, test arbitrary adjacencies, or need both outgoing and incoming arcs?',
        ],
        points: [
          ['稠密 + 频繁查边：邻接矩阵。', 'Dense + frequent edge tests: adjacency matrix.'],
          ['稀疏 + 只需邻居：邻接表。', 'Sparse + neighbours only: adjacency list.'],
          ['有向稀疏 + 同时要出入边：十字链表。', 'Sparse directed + both directions: orthogonal list.'],
          ['无向稀疏 + 以边为中心：邻接多重表。', 'Sparse undirected + edge-centric: adjacency multilist.'],
        ],
      },
      {
        title: ['不要为了“高级”而增加字段', 'Do not add fields for sophistication alone'],
        body: [
          '十字链表和多重表字段多、指针维护复杂。如果课程算法只需要按邻接点遍历，普通邻接表已经足够；额外维护入链或共享边节点会增加出错面，却不会改善该算法的复杂度。',
          'Orthogonal and multilist layouts have more fields and trickier pointer maintenance. If a lesson only enumerates neighbours, a plain adjacency list is enough; extra in-chains or shared edge nodes add failure modes without improving that algorithm’s complexity.',
        ],
        points: [
          ['存储结构应服务于算法实际查询，而不是追求结构名字更复杂。', 'A layout should serve the algorithm’s real queries, not look more advanced by name.'],
          ['无论采用哪种结构，算法语义必须与图的方向、权和边界约定一致。', 'Whichever layout is used, algorithm semantics must match the graph’s direction, weights and boundary conventions.'],
          ['空图、孤立顶点、自环和重边需要事先约定；不同结构对重边的表达能力不同。', 'Empty graphs, isolated vertices, self-loops and parallel edges need explicit conventions; layouts differ in what they can represent.'],
        ],
      },
    ],
    comparison: {
      title: ['邻接矩阵、邻接表、十字链表、邻接多重表', 'Matrix, adjacency list, orthogonal list and multilist'],
      columns: [
        ['比较项', 'Aspect'],
        ['邻接矩阵', 'Matrix'],
        ['邻接表', 'Adjacency list'],
        ['十字链表', 'Orthogonal list'],
        ['邻接多重表', 'Adjacency multilist'],
      ],
      rows: [
        [
          ['适用图型', 'Graph type'],
          ['有向/无向，稠密优先', 'Directed/undirected, dense first'],
          ['有向/无向，稀疏优先', 'Directed/undirected, sparse first'],
          ['有向图', 'Directed graphs'],
          ['无向图', 'Undirected graphs'],
        ],
        [
          ['空间', 'Space'],
          ['O(n²)', 'O(n²)'],
          ['O(n+e)，无向为 O(n+2e)', 'O(n+e), O(n+2e) undirected'],
          ['O(n+e)', 'O(n+e)'],
          ['O(n+e)', 'O(n+e)'],
        ],
        [
          ['边记录数', 'Edge records'],
          ['n² 个单元', 'n² cells'],
          ['e 个弧或 2e 个无向边结点', 'e arcs or 2e undirected nodes'],
          ['e 个弧节点', 'e arc nodes'],
          ['e 个边节点', 'e edge nodes'],
        ],
        [
          ['查边 (u,v)', 'Test edge (u,v)'],
          ['O(1)', 'O(1)'],
          ['O(deg(u))', 'O(deg(u))'],
          ['O(出度) 或 O(入度)', 'O(out-degree) or O(in-degree)'],
          ['O(deg(u))', 'O(deg(u))'],
        ],
        [
          ['枚举邻居', 'Enumerate neighbours'],
          ['O(n)', 'O(n)'],
          ['O(deg(u))', 'O(deg(u))'],
          ['沿 tlink 或 hlink', 'Along tlink or hlink'],
          ['沿关联边链', 'Along the incidence chain'],
        ],
        [
          ['最适合', 'Best for'],
          ['稠密图、频繁查边', 'Dense graphs, frequent edge tests'],
          ['一般稀疏图、BFS/DFS', 'General sparse graphs, BFS/DFS'],
          ['有向稀疏图、出入度都要', 'Sparse directed graphs needing both degrees'],
          ['无向稀疏图、按边操作', 'Sparse undirected graphs with edge operations'],
        ],
      ],
    },
    takeaway: [
      '矩阵用固定 n² 换 O(1) 查边；链式结构按边分配；十字链表服务有向出入边，多重表服务无向共享边。',
      'The matrix trades fixed n² space for O(1) edge tests; linked layouts allocate by edges, with orthogonal lists for directed in/out arcs and multilists for shared undirected edges.',
    ],
  },
];

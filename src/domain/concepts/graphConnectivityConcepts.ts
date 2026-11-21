import type { ConceptPage } from './types';

/**
 * TEXTBOOK-07 — static foundation for the articulation-point lesson.
 *
 * The dynamic course owns the low-link trace. This page only establishes the
 * vocabulary: cut vertex, bridge, vertex-biconnected component and
 * edge-biconnected component. It deliberately keeps the sample graph small
 * enough that every block is visible at once.
 */
export const GRAPH_CONNECTIVITY_CONCEPT_PAGES: readonly ConceptPage[] = [
  {
    id: 'articulation-basics',
    topicId: 'articulation-basics',
    title: ['关节点、桥与双连通性', 'Articulation points, bridges and biconnectivity'],
    chapter: ['第 7 章 · 图', 'Chapter 7 · Graphs'],
    summary: [
      '删去一个顶点及其关联边后，若连通分量数增加，这个顶点就是关节点；删去一条边后连通分量数增加，这条边就是桥。',
      'If deleting a vertex and its incident edges increases the number of connected components, the vertex is an articulation point. If deleting an edge does so, the edge is a bridge.',
    ],
    diagram: 'articulation-basics',
    definitions: [
      {
        term: ['关节点（割点）', 'Articulation point (cut vertex)'],
        text: [
          '无向连通图中，删除该顶点及其关联边会让图不再连通（或使所在连通分量分裂）的顶点。',
          'In an undirected connected graph, a vertex whose removal together with its incident edges disconnects the graph, or splits its component.',
        ],
      },
      {
        term: ['桥（割边）', 'Bridge (cut edge)'],
        text: [
          '删除后会使所在连通分量分裂的一条边。桥本身就是一个含两个顶点的点双连通块；若桥两侧还接有更大的块，这两个端点才会成为被相邻块共享的关节点。',
          'An edge whose removal splits its connected component. A bridge is itself a two-vertex vertex-biconnected block; its endpoints become articulation points only when larger blocks lie on both sides.',
        ],
      },
      {
        term: ['点双连通分量', 'Vertex-biconnected component'],
        text: [
          '不含自身关节点的极大连通子图；三个及以上顶点的块内，任意两个顶点都落在同一条简单回路中，两个顶点的块是退化特例。块之间可以共享关节点。',
          'A maximal connected subgraph with no articulation vertex of its own; in a block of three or more vertices, any two vertices lie on a common simple cycle, with a two-vertex block as the degenerate case. Blocks may share articulation points.',
        ],
      },
      {
        term: ['边双连通分量', 'Edge-biconnected component'],
        text: [
          '不含桥的极大连通子图；块内任意两点之间都有两条边不相交的路径。边双分量之间不共享顶点，桥是它们的分界。',
          'A maximal connected subgraph containing no bridge; any two vertices have two edge-disjoint paths. Edge-biconnected components share no vertices, and bridges separate them.',
        ],
      },
    ],
    sections: [
      {
        title: ['先看“删掉以后会怎样”', 'Start with “what happens after deletion”'],
        body: [
          '下图由两个三角形通过一条边 C–D 相连。删去 C 后，左侧三角形 A、B 与右侧 D、E、F 分开；删去 D 也一样，所以 C、D 都是关节点。删去边 C–D 同样把图分成两块，因此 C–D 是桥。A、B、E、F 都不是关节点。',
          'The diagram joins two triangles by edge C–D. Removing C separates the left triangle A, B from the right side D, E, F; removing D does the same, so C and D are articulation points. Removing edge C–D also splits the graph, so C–D is a bridge. A, B, E and F are not articulation points.',
        ],
        points: [
          ['关节点是顶点，桥是边，两者不能互相替代。', 'An articulation point is a vertex; a bridge is an edge. They are not interchangeable.'],
          ['桥的两个端点未必都是关节点：单个三角形的一条边是桥吗？不是，因为删去后三角形仍连通。', 'A bridge’s endpoints need not both be articulation points: an edge inside a triangle is not a bridge, because the triangle stays connected.'],
          ['孤立顶点删去后分量数不变，因此不是关节点。', 'An isolated vertex does not change the component count when removed, so it is not an articulation point.'],
        ],
      },
      {
        title: ['DFS low-link 的两个判据', 'The two DFS low-link tests'],
        body: [
          '从根开始 DFS，记录发现时间 disc[u] 和 low[u]：low[u] 是从 u 的 DFS 子树出发，经一条返祖边最多能回到的最早发现时间。对非根顶点 u，只要存在 DFS 树孩子 v 使 low[v] ≥ disc[u]，删去 u 就会把 v 的子树与 u 的祖先分开，因此 u 是关节点。',
          'Run DFS from a root and record discovery time disc[u] and low[u]: low[u] is the earliest discovery time reachable from u’s DFS subtree by using at most one back edge. For a non-root u, if some DFS-tree child v has low[v] ≥ disc[u], deleting u separates v’s subtree from u’s ancestors, so u is an articulation point.',
        ],
        points: [
          ['low[v] < disc[u] 表示 v 的子树有返祖边绕过 u，删去 u 不会隔离它。', 'low[v] < disc[u] means v’s subtree has a back edge bypassing u, so deleting u does not isolate it.'],
          ['根没有祖先，low 判据对根失效；根只有在至少两个 DFS 树孩子时才是关节点。', 'The root has no ancestor, so the low test does not apply; the root is an articulation point only when it has at least two DFS-tree children.'],
          ['无向图的非树边总是连向祖先或后代；只有连向仍在递归栈中的祖先才构成返祖边。', 'A non-tree edge in an undirected graph joins an ancestor and a descendant; only an edge to an ancestor still on the recursion stack is a back edge.'],
        ],
        formula: 'non-root u: low[v] ≥ disc[u] for some tree child v    root: tree-child count ≥ 2',
      },
      {
        title: ['点双与边双不是同一个划分', 'Vertex and edge biconnectivity are different partitions'],
        body: [
          '点双连通分量按“删点”定义，边双连通分量按“删边”定义。两个三角形共享一个关节点时，点双把它们分成两个块，但整张图没有桥，所以仍是一个边双分量；若两个三角形通过桥相连，桥才把边双分量分开。由此可见：顶点数不少于 3 时，点双连通能推出边双连通，反过来不成立。',
          'Vertex-biconnected components are defined by vertex deletion, edge-biconnected components by edge deletion. When two triangles share one articulation point, the vertex partition separates them, yet the whole graph has no bridge and remains one edge-biconnected component. When the triangles are joined by a bridge, that bridge separates the edge components. Thus, for three or more vertices, vertex-biconnectivity implies edge-biconnectivity, but not conversely.',
        ],
        points: [
          ['点双分量之间可以共享关节点；边双分量之间不共享顶点。', 'Vertex-biconnected components may share an articulation point; edge-biconnected components do not share vertices.'],
          ['一条边属于且仅属于一个点双分量；一个顶点可以属于多个点双分量。', 'An edge belongs to exactly one vertex-biconnected component; a vertex may belong to several.'],
          ['桥是边双分量的分界；关节点是点双分量的分界。桥自身也是一个含两个顶点的点双块。', 'Bridges separate edge-biconnected components; articulation points separate vertex blocks. A bridge is also a two-vertex vertex block of its own.'],
        ],
      },
    ],
    comparison: {
      title: ['关节点、桥、点双与边双', 'Cut vertices, bridges, vertex and edge blocks'],
      columns: [
        ['比较项', 'Aspect'],
        ['关节点', 'Articulation point'],
        ['桥', 'Bridge'],
        ['点双分量', 'Vertex block'],
        ['边双分量', 'Edge block'],
      ],
      rows: [
        [
          ['删除对象', 'Deleted object'],
          ['一个顶点及其关联边', 'One vertex and its edges'],
          ['一条边', 'One edge'],
          ['块内没有自己的关节点', 'No articulation vertex within the block'],
          ['不含桥', 'Contains no bridge'],
        ],
        [
          ['分裂判据', 'Split test'],
          ['连通分量数增加', 'Component count increases'],
          ['连通分量数增加', 'Component count increases'],
          ['块内任意两点共处一条简单回路', 'Any two vertices share a simple cycle'],
          ['块内任意两点有两条边不相交路径', 'Any two vertices have two edge-disjoint paths'],
        ],
        [
          ['共享关系', 'Sharing'],
          ['可属于多个点双块', 'May belong to several vertex blocks'],
          ['本身是一个 2 顶点点双块', 'Itself a two-vertex vertex block'],
          ['块之间可共享关节点', 'Blocks may share a cut vertex'],
          ['块之间不共享顶点', 'Blocks share no vertex'],
        ],
      ],
    },
    takeaway: [
      '先问“删掉谁”，再问“分成几块”：删点找关节点，删边找桥；点双和边双是两套不同的块划分。',
      'Ask “delete what?” before “how many pieces?”: vertex deletion finds articulation points, edge deletion finds bridges; vertex and edge blocks are different partitions.',
    ],
  },
];

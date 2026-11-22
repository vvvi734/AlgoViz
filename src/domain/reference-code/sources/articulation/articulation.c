/*
 * 中文导读：一次 DFS 同时计算 disc、low、关节点与桥；非根看孩子 low，根只看 DFS 孩子数。
 * 阅读顺序：先看 disc/low/parent 三个数组；再看 dfs 对树边、返祖边和父边的分支；最后看外层扫描所有根。
 * 关键不变量：low[v] 表示 v 子树能回到的最早祖先；low[v] >= disc[u] 时 u 删除会切断 v 子树。
 * 易错点：根也套用 low 判据；父边当返祖边；桥误用 >=；只从一个根开始。
 * 复杂度：本实现用邻接矩阵，逐行扫描为 O(V²) 时间；矩阵占 O(V²)，递归栈与状态数组占 O(V)。
 * 输入/输出：输入无向图的邻接矩阵；输出关节点编号和桥的端点对。
 */

/*
 * AlgoViz reference implementation: articulation points and bridges.
 * Uses one DFS pass with discovery time disc and low-link time low.
 *
 * Reading guide:
 * 1. A tree edge recurses into an undiscovered neighbour.
 * 2. After the child returns, low[parent] = min(low[parent], low[child]).
 * 3. A non-root parent is a cut vertex when low[child] >= disc[parent].
 * 4. A bridge is the stricter tree edge with low[child] > disc[parent].
 * 5. A root is a cut vertex only with at least two DFS tree children.
 *
 * Complexity: O(V²) time with this dense matrix, O(V) recursion and state space.
 * Convention: The graph is undirected; parent[root] is -1.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 8

int disc[VERTEX_COUNT];
int low[VERTEX_COUNT];
int parent[VERTEX_COUNT];
int timer = 0;
bool articulation[VERTEX_COUNT];
bool bridge[VERTEX_COUNT][VERTEX_COUNT];

// Purpose: Write both directions of an undirected edge so either endpoint can inspect it.
// 作用：写入无向边的两个方向，使任一端点都能检查这条边。
int add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b)
{
    // VERTEX_COUNT is a fixed matrix bound; reject an absent matrix or an endpoint outside 0..VERTEX_COUNT-1 before indexing.
    if (graph == NULL || a < 0 || a >= VERTEX_COUNT || b < 0 || b >= VERTEX_COUNT)
    {
        return 0;
    }
    graph[a][b] = 1;
    graph[b][a] = 1;
    return 1;
}

// The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].
// 关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。
// Purpose: DFS from u, propagate low back to the parent, and mark cut vertices and bridges.
// 作用：从 u 开始 DFS，把 low 回传给父节点，并标记关节点与桥。
void dfs(int graph[VERTEX_COUNT][VERTEX_COUNT], int u, int root)
{
    // disc is the DFS discovery order; low starts at disc[u], then becomes the earliest discovery time reachable from u's subtree.
    disc[u] = low[u] = ++timer;
    // children counts DFS tree children, not all neighbours; the root's cut test uses this count.
    int children = 0;

    for (int v = 0; v < VERTEX_COUNT; ++v)
    {
        if (!graph[u][v])
        {
            continue;
        }
        // disc==0 means v is unvisited: this edge becomes a DFS tree edge, and v's subtree result will return through low[v].
        if (!disc[v])
        {
            parent[v] = u;
            ++children;
            dfs(graph, v, root);
            // The child subtree may reach an ancestor of u; propagate its earliest reachable time upward.
            if (low[v] < low[u])
            {
                low[u] = low[v];
            }
            // For a non-root u, low[v] >= disc[u] means no back edge from v's subtree can bypass u, so removing u separates that subtree.
            if (u != root && low[v] >= disc[u])
            {
                articulation[u] = true;
            }
            // The strict > identifies a bridge: even v's subtree cannot reach u's discovery time, so edge u-v is the only connection.
            if (low[v] > disc[u])
            {
                bridge[u][v] = bridge[v][u] = true;
            }
        }
        // Skip the parent edge explicitly: it is the tree edge that discovered u, not a cycle back to an ancestor.
        else if (v != parent[u] && disc[v] < disc[u])
        {
            // Use disc[v], not low[v]: the edge u-v directly touches ancestor v; low[v] may describe a larger subtree and mix in another reachability set.
            if (disc[v] < low[u])
            {
                low[u] = disc[v];
            }
        }
    }

    // The root has no parent to bypass it, so it is a cut vertex only when two DFS children would become disconnected.
    if (u == root && children >= 2)
    {
        articulation[root] = true;
    }
}

// Purpose: Scan every unseen vertex as a new DFS root, covering disconnected graphs.
// 作用：扫描每个未访问顶点作为新 DFS 根，覆盖非连通图。
int find_articulation_points(int graph[VERTEX_COUNT][VERTEX_COUNT])
{
    // A null matrix cannot be scanned; fail before resetting or entering DFS.
    if (graph == NULL)
    {
        return 0;
    }
    // Every call is a fresh DFS forest: stale disc/low/answers or a nonzero timer would make a second call skip all roots.
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        disc[vertex] = 0;
        low[vertex] = 0;
        parent[vertex] = -1;
        articulation[vertex] = false;
        for (int other = 0; other < VERTEX_COUNT; ++other)
        {
            bridge[vertex][other] = false;
        }
    }
    timer = 0;
    for (int start = 0; start < VERTEX_COUNT; ++start)
    {
        // A disconnected graph has several DFS roots; each unvisited start opens a new tree while timer continues globally.
        if (!disc[start])
        {
            dfs(graph, start, start);
        }
    }
    return 1;
}

// Purpose: Build the demo undirected graph, run one DFS forest, then print cut vertices and bridges.
// 作用：构造演示无向图，跑一次 DFS 森林，再打印关节点与桥。
int main(void)
{
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    if (!add_edge(graph, 0, 1)) return 1;
    if (!add_edge(graph, 1, 2)) return 1;
    if (!add_edge(graph, 2, 0)) return 1;
    if (!add_edge(graph, 2, 3)) return 1;
    if (!add_edge(graph, 3, 4)) return 1;
    if (!add_edge(graph, 3, 5)) return 1;
    if (!add_edge(graph, 4, 5)) return 1;
    if (!add_edge(graph, 6, 7)) return 1;

    if (!find_articulation_points(graph)) return 1;

    printf("articulation:");
    for (int v = 0; v < VERTEX_COUNT; ++v)
    {
        if (articulation[v])
        {
            printf(" %d", v);
        }
    }
    printf("\nbridges:");
    for (int u = 0; u < VERTEX_COUNT; ++u)
    {
        for (int v = u + 1; v < VERTEX_COUNT; ++v)
        {
            if (bridge[u][v])
            {
                printf(" %d-%d", u, v);
            }
        }
    }
    printf("\n");
    return 0;
}

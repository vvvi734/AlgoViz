/*
 * 中文导读：一次 DFS 同时计算 disc、low、关节点与桥；非根看孩子 low，根只看 DFS 孩子数。
 * 阅读顺序：先看 disc/low/parent 三个数组；再看 dfs 对树边、返祖边和父边的分支；最后看外层扫描所有根。
 * 关键不变量：low[v] 表示 v 子树能回到的最早祖先；low[v] >= disc[u] 时 u 删除会切断 v 子树。
 * 易错点：根也套用 low 判据；父边当返祖边；桥误用 >=；只从一个根开始。
 * 复杂度：本实现用邻接矩阵，逐行扫描为 O(V²) 时间；矩阵占 O(V²)，递归栈与状态数组占 O(V)。
 * 输入/输出：输入无向图的邻接矩阵；输出关节点编号和桥的端点对。
 * 函数地图：先读 main 的建图与根扫描，再读 dfs 的进入、边分类、返回判定。
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
void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b)
{
    graph[a][b] = 1;
    graph[b][a] = 1;
}

// The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].
// 关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。
// Purpose: DFS from u, propagate low back to the parent, and mark cut vertices and bridges.
// 作用：从 u 开始 DFS，把 low 回传给父节点，并标记关节点与桥。
void dfs(int graph[VERTEX_COUNT][VERTEX_COUNT], int u, int root)
{
    disc[u] = low[u] = ++timer;
    int children = 0;

    for (int v = 0; v < VERTEX_COUNT; ++v)
    {
        if (!graph[u][v])
        {
            continue;
        }
        if (!disc[v])
        {
            parent[v] = u;
            ++children;
            dfs(graph, v, root);
            if (low[v] < low[u])
            {
                low[u] = low[v];
            }
            if (u != root && low[v] >= disc[u])
            {
                articulation[u] = true;
            }
            if (low[v] > disc[u])
            {
                bridge[u][v] = bridge[v][u] = true;
            }
        }
        else if (v != parent[u] && disc[v] < disc[u])
        {
            // A back edge reaches an ancestor; use its disc, not low[v].
            // 返祖边指向祖先，应使用 disc[v]，而不是 low[v]。
            if (disc[v] < low[u])
            {
                low[u] = disc[v];
            }
        }
    }

    if (u == root && children >= 2)
    {
        articulation[root] = true;
    }
}

// Purpose: Scan every unseen vertex as a new DFS root, covering disconnected graphs.
// 作用：扫描每个未访问顶点作为新 DFS 根，覆盖非连通图。
void find_articulation_points(int graph[VERTEX_COUNT][VERTEX_COUNT])
{
    for (int start = 0; start < VERTEX_COUNT; ++start)
    {
        parent[start] = -1;
        if (!disc[start])
        {
            dfs(graph, start, start);
        }
    }
}

// Purpose: Run the core operations and print the final cut vertices and bridges.
// 作用：按顺序执行核心操作，打印最终关节点与桥。
int main(void)
{
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1);
    add_edge(graph, 1, 2);
    add_edge(graph, 2, 0);
    add_edge(graph, 2, 3);
    add_edge(graph, 3, 4);
    add_edge(graph, 3, 5);
    add_edge(graph, 4, 5);
    add_edge(graph, 6, 7);

    find_articulation_points(graph);

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

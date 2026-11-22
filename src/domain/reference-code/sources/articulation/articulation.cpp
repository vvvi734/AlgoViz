/*
 * 中文导读：用 C++ 实现同一套 DFS low-link，一次遍历得到关节点和桥。
 * 阅读顺序：先看 vector<vector<int>> 邻接矩阵；再看 dfs 的 disc/low/父亲与树孩子；最后看根的双孩子条件。
 * 关键不变量：low[v] 是 v 子树通过返祖边能回到的最早 disc；根不能使用 low 判据。
 * 易错点：把父边当返祖边；用 low[v] 而不是 disc[v] 更新返祖边；桥条件漏掉严格大于。
 * 复杂度：本实现用邻接矩阵，逐行扫描为 O(V²) 时间；矩阵占 O(V²)，递归栈占 O(V)。
 * 输入/输出：输入无向图；输出关节点与桥。
 */

/*
 * AlgoViz reference implementation: articulation points in C++.
 * One DFS pass records disc, low, DFS parents, cut vertices and bridges.
 *
 * Reading guide:
 * 1. `disc` is the discovery time; `low` is the earliest reachable ancestor.
 * 2. A non-root u is a cut vertex when a child has low[child] >= disc[u].
 * 3. A bridge is a tree edge with low[child] > disc[u].
 * 4. The root is a cut vertex only with at least two DFS children.
 *
 * Complexity: O(V²) time with this dense matrix, O(V²) storage, O(V) recursion.
 */

#include <algorithm>
#include <iostream>
#include <vector>

constexpr int VERTEX_COUNT = 8;

std::vector<int> disc(VERTEX_COUNT, 0);
std::vector<int> low(VERTEX_COUNT, 0);
std::vector<int> parent(VERTEX_COUNT, -1);
int timer = 0;
std::vector<bool> articulation(VERTEX_COUNT, false);
bool bridges[VERTEX_COUNT][VERTEX_COUNT] = {};

// Purpose: Store both directions of an undirected edge in the adjacency matrix.
// 作用：在邻接矩阵中保存无向边的两个方向。
void addEdge(std::vector<std::vector<int>>& graph, int a, int b)
{
    graph[a][b] = 1;
    graph[b][a] = 1;
}

// The cut test is low[child] >= disc[parent]; the bridge test is strict low[child] > disc[parent].
// 关节点判据是 low[child] >= disc[parent]；桥判据是严格的 low[child] > disc[parent]。
// Purpose: Recurse from u, propagate low, and mark non-root cut vertices and bridges.
// 作用：从 u 递归，回传 low，并标记非根关节点与桥。
void dfs(const std::vector<std::vector<int>>& graph, int u, int root)
{
    // disc records DFS discovery order; low begins at disc[u] and later stores the earliest time reachable from this subtree.
    disc[u] = low[u] = ++timer;
    // children is the number of DFS tree children; only the root uses this count, while non-root vertices use low[child] >= disc[u].
    int children = 0;

    for (int v = 0; v < VERTEX_COUNT; ++v)
    {
        if (!graph[u][v])
        {
            continue;
        }
        // disc[v]==0 means the edge is a tree edge to an unvisited vertex; the recursive result will be carried back by low[v].
        if (!disc[v])
        {
            parent[v] = u;
            ++children;
            dfs(graph, v, root);
            // After the child returns, propagate the earliest ancestor its subtree can reach; this is the only update from a tree edge.
            low[u] = std::min(low[u], low[v]);
            // For non-root u, low[v] >= disc[u] means v's subtree has no bypass around u, so u becomes a cut vertex.
            if (u != root && low[v] >= disc[u])
            {
                articulation[u] = true;
            }
            // The strict > detects a bridge: v's subtree cannot even reach u, so the tree edge u-v is its only exit.
            if (low[v] > disc[u])
            {
                bridges[u][v] = bridges[v][u] = true;
            }
        }
        // The parent edge is the tree edge that discovered u; treating it as a back edge would give every non-root a false bypass.
        else if (v != parent[u] && disc[v] < disc[u])
        {
            // A back edge reaches an ancestor directly, so its contribution is disc[v], not low[v]; low[v] belongs to a different subtree scope.
            low[u] = std::min(low[u], disc[v]);
        }
    }

    // The root has no parent bypass; two DFS children mean removing the root separates those branches.
    if (u == root && children >= 2)
    {
        articulation[root] = true;
    }
}

// Purpose: Start DFS from every unseen vertex so disconnected graphs are fully covered.
// 作用：从每个未访问顶点启动 DFS，完整覆盖非连通图。
void findArticulationPoints(const std::vector<std::vector<int>>& graph)
{
    for (int start = 0; start < VERTEX_COUNT; ++start)
    {
        // Scan every unvisited start separately: disconnected components cannot be reached from one DFS root, while timer stays global.
        if (!disc[start])
        {
            dfs(graph, start, start);
        }
    }
}

// Purpose: Build the teaching graph, run the algorithm and print the final sets.
// 作用：建立教学图，运行算法并打印最终集合。
int main()
{
    std::vector<std::vector<int>> graph(VERTEX_COUNT, std::vector<int>(VERTEX_COUNT, 0));
    addEdge(graph, 0, 1);
    addEdge(graph, 1, 2);
    addEdge(graph, 2, 0);
    addEdge(graph, 2, 3);
    addEdge(graph, 3, 4);
    addEdge(graph, 3, 5);
    addEdge(graph, 4, 5);
    addEdge(graph, 6, 7);

    findArticulationPoints(graph);

    std::cout << "articulation:";
    for (int v = 0; v < VERTEX_COUNT; ++v)
    {
        if (articulation[v])
        {
            std::cout << ' ' << v;
        }
    }
    std::cout << "\nbridges:";
    for (int u = 0; u < VERTEX_COUNT; ++u)
    {
        for (int v = u + 1; v < VERTEX_COUNT; ++v)
        {
            if (bridges[u][v])
            {
                std::cout << ' ' << u << '-' << v;
            }
        }
    }
    std::cout << '\n';
    return 0;
}

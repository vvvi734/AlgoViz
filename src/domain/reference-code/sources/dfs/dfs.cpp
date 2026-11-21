/*
 * 中文导读：沿一条路径尽可能深入，走不通再回溯；递归和显式栈是两种等价写法。
 * 阅读顺序：先看 visited 标记发生在进入还是出边时；再看递归/栈的推进与回退；最后看时间戳或 parent。
 * 关键不变量：递归栈中保存的是当前根到当前结点的路径；已标记结点不会被再次展开。
 * 易错点：递归深度超过系统栈；无向图把父边当回边；只遍历一个分量；显式栈弹出顺序写反。
 * 复杂度：O(V+E) 时间，O(V) 额外空间（递归深度可达 V）。
 * 输入/输出：输入邻接表与起点；返回/打印 DFS 访问顺序；递归实现不修改图。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: depth-first search (C++17).
// Recursively follows one branch as far as possible before backtracking.
//
// Reading guide:
// 1. Mark the current vertex on entry so cycles cannot revisit it.
// 2. Scan every possible neighbour (matrix row or adjacency list) and recurse into
//    unvisited ones.
// 3. Emit the vertex in preorder when it is first visited.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra
//   space O(V) marks plus O(h) recursion.
// Convention: Vertices are 0-based; recursion depth can reach V on a path graph.

#include <iostream>
#include <vector>

// Mark on entry, then recurse into every unvisited neighbour before backtracking.
// Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.
// 作用：递归访问 vertex 的未访问邻居；进入时立即标记 visited，避免回边重复展开。
void dfs_visit(const std::vector<std::vector<int>> &graph, int vertex, std::vector<bool> &visited)
{
    visited[vertex] = true;
    std::cout << ' ' << vertex;
    for (int next : graph[vertex])
    {
        if (!visited[next])
        {
            dfs_visit(graph, next, visited);
        }
    }
}

// 作用：从 start 开始深度优先遍历；递归栈保存当前路径。
void dfs(const std::vector<std::vector<int>> &graph, int start)
{
    std::vector<bool> visited(graph.size(), false);
    std::cout << "order:";
    dfs_visit(graph, start, visited);
    std::cout << '\n';
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::vector<std::vector<int>> graph(6);
    auto add_edge = [&graph](int a, int b)
    {
        graph[a].push_back(b);
        graph[b].push_back(a);
    };
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 4);
    add_edge(4, 5);

    dfs(graph, 0);
    dfs(graph, 3);
    return 0;
}

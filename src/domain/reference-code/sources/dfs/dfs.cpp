/*
 * 中文导读：沿一条路径尽可能深入，走不通再回溯；本文件用递归调用栈实现。
 * 阅读顺序：先看 visited 标记发生在进入顶点时；再看邻接表枚举与递归返回；最后看单分量限制。
 * 关键不变量：递归栈中保存的是当前根到当前结点的路径；已标记结点不会被再次展开。
 * 易错点：递归深度超过系统栈；无向图把父边当回边；只遍历一个分量。
 * 复杂度：O(V+E) 时间，O(V) 额外空间（递归深度可达 V）。
 * 输入/输出：输入邻接表与起点；函数只打印 DFS 访问顺序，不返回数组；递归实现不修改图。
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

// visited is passed by reference so all recursive frames share one set of marks.
void dfs_visit(const std::vector<std::vector<int>> &graph, int vertex, std::vector<bool> &visited)
{
    // Mark before iterating neighbors; an unmarked vertex on a cycle would be re-entered.
    visited[vertex] = true;
    // Preorder output: the vertex is reported before any of its descendants.
    std::cout << ' ' << vertex;
    // The range loop visits real neighbors only; recursion explores one neighbor's entire branch before the next.
    for (int next : graph[vertex])
    {
        // The guard is evaluated at the parent level; an already visited neighbor is skipped without a call.
        if (!visited[next])
        {
            // Depth is bounded by the number of vertices; on a path graph the stack reaches V frames.
            dfs_visit(graph, next, visited);
        }
    }
}

// One call covers exactly the connected component containing start.
void dfs(const std::vector<std::vector<int>> &graph, int start)
{
    // The vector is sized to the graph and zero-filled; all frames index the same storage.
    std::vector<bool> visited(graph.size(), false);
    std::cout << "order:";
    // Only vertices reachable from start are marked; other components keep their false flags.
    dfs_visit(graph, start, visited);
    std::cout << '\n';
}

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

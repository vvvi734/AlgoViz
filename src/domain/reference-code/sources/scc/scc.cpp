/*
 * 中文导读：在有向图中找出互相可达的极大结点集合；本文件用两遍 DFS/Kosaraju 或等价方法。
 * 阅读顺序：先看第一遍 DFS 的完成顺序；再看反向图；最后看第二遍按逆完成顺序收集分量。
 * 关键不变量：第一遍完成时间最晚的结点属于源分量；在反向图上从它出发只能到达同一强连通分量。
 * 易错点：忘记反向图；完成顺序存成进入顺序；递归深度溢出；把弱连通分量当强连通。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 * 输入/输出：输入有向图邻接表；按 Kosaraju 顺序打印每个强连通分量；main 打印 SCC 与总数。
*/

// AlgoViz reference implementation: strongly connected components (Kosaraju).
// First pass records finish order on the original graph; second pass walks
// the reversed graph in reverse finish order. Each tree is one SCC.
//
// Reading guide:
// 1. First DFS on the original graph records vertices in finish order.
// 2. Build the reverse graph by flipping every directed edge.
// 3. Process vertices in reverse finish order; each DFS tree in the reverse graph is
//    one SCC.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) for adjacency matrices; extra
//   space O(V + E) for lists, O(V^2) for a matrix, plus O(V) recursion.
// Convention: Directed graph with 0-based vertices; components are emitted in
//   Kosaraju order.

#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

// First pass appends a vertex only after all its outgoing neighbours are finished; the second pass reads this order backwards.
// Purpose: First DFS pass: append each vertex after its DFS subtree finishes, producing increasing finish order.
// 作用：第一遍 DFS：记录每个结点的完成时间；position 递增，得到递增的完成顺序，第二遍再从尾部倒着读。
void first_pass(const std::vector<std::vector<int>> &graph, int vertex, std::vector<bool> &visited,
                std::vector<int> &order)
{
    visited[vertex] = true;
    for (int next : graph[vertex])
    {
        if (!visited[next])
        {
            first_pass(graph, next, visited, order);
        }
    }
    order.push_back(vertex);
}

// Purpose: Collect one SCC from vertex on the reversed graph, expanding only through unvisited vertices.
// 作用：在反向图上从 vertex 出发收集同一强连通分量；只沿未访问结点扩散。
void collect(const std::vector<std::vector<int>> &reverse_graph, int vertex,
             std::vector<bool> &visited, std::vector<int> &component)
{
    visited[vertex] = true;
    component.push_back(vertex);
    for (int next : reverse_graph[vertex])
    {
        if (!visited[next])
        {
            collect(reverse_graph, next, visited, component);
        }
    }
}

int main()
{
    std::vector<std::pair<int, int>> edges{{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}, {4, 5}, {5, 3}};
    std::vector<std::vector<int>> graph(6);
    std::vector<std::vector<int>> reverse_graph(6);
    for (auto [from, to] : edges)
    {
        graph[from].push_back(to);
        reverse_graph[to].push_back(from);
    }

    std::vector<bool> visited(6, false);
    std::vector<int> order;
    for (int vertex = 0; vertex < 6; ++vertex)
    {
        if (!visited[vertex])
        {
            first_pass(graph, vertex, visited, order);
        }
    }

    std::fill(visited.begin(), visited.end(), false);
    int components = 0;
    for (auto it = order.rbegin(); it != order.rend(); ++it)
    {
        if (!visited[*it])
        {
            std::vector<int> component;
            collect(reverse_graph, *it, visited, component);
            ++components;
            std::cout << "scc " << components << ":";
            for (int vertex : component)
            {
                std::cout << ' ' << vertex;
            }
            std::cout << '\n';
        }
    }
    std::cout << "total: " << components << '\n';
    return 0;
}

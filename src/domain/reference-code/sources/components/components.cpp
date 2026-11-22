/*
 * 中文导读：对每个未访问结点启动一次遍历，给同一连通块的所有结点相同编号。
 * 阅读顺序：先看 visited/component 数组；再看外层为什么遍历所有结点；最后看内层 DFS/BFS 如何扩散。
 * 关键不变量：一次内层遍历访问到的结点恰好属于同一个连通分量；外层保证不遗漏任何分量。
 * 易错点：只从 0 号点开始；把有向图弱连通当成强连通；visited 标记时机不一致。
 * 复杂度：O(V+E) 时间，O(V) 额外空间。
 * 输入/输出：输入无向图邻接表；返回连通分量数量，并打印每个分量的顶点；main 打印总数。
*/

// AlgoViz reference implementation: connected components (C++17).
// Runs DFS from every unvisited vertex; one DFS tree is one component.
//
// Reading guide:
// 1. Scan every vertex from 0 to V - 1.
// 2. Each unvisited vertex starts a new component and receives a fresh component id.
// 3. DFS marks all vertices reachable from that start; disconnected vertices form
//    further components.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra
//   space O(V).
// Convention: Components are numbered in ascending order of their smallest vertex.

#include <iostream>
#include <vector>

// Purpose: DFS from vertex, marking every vertex in the same connected component as visited.
// 作用：从 vertex 出发 DFS，把同一连通分量中的所有结点标记为已访问。
void visit(const std::vector<std::vector<int>> &graph, int vertex, std::vector<bool> &visited)
{
    visited[vertex] = true;
    std::cout << ' ' << vertex;
    for (int next : graph[vertex])
    {
        if (!visited[next])
        {
            visit(graph, next, visited);
        }
    }
}

// The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.
// Purpose: Scan all unvisited vertices; each new DFS start yields one connected component.
// 作用：扫描所有未访问结点，每启动一次 DFS 就得到一个连通分量。
int count_components(const std::vector<std::vector<int>> &graph)
{
    std::vector<bool> visited(graph.size(), false);
    int components = 0;
    for (std::size_t start = 0; start < graph.size(); ++start)
    {
        if (!visited[start])
        {
            ++components;
            std::cout << "component " << components << ":";
            visit(graph, static_cast<int>(start), visited);
            std::cout << '\n';
        }
    }
    return components;
}

int main()
{
    std::vector<std::vector<int>> graph(7);
    auto add_edge = [&graph](int a, int b)
    {
        graph[a].push_back(b);
        graph[b].push_back(a);
    };
    add_edge(0, 1);
    add_edge(1, 2);
    add_edge(3, 4);
    add_edge(5, 6);

    int total = count_components(graph);
    std::cout << "total: " << total << '\n';
    return 0;
}

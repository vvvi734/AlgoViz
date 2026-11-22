/*
 * 中文导读：在有向无环图中反复取出入度为 0 的结点，得到满足所有前驱关系的顺序。
 * 阅读顺序：先看入度数组和队列/栈；再看取出结点后如何减少邻居入度；最后看输出数量少于 V 说明有环。
 * 关键不变量：队列中的结点当前入度都是 0；已输出结点不会再影响后续。
 * 易错点：入度更新方向写反；有环仍输出部分序列并当成功；重复入队；邻接表漏边。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 * 输入/输出：输入有向无环图；返回拓扑序；输出顶点数不足 V 时说明有环；main 打印序列。
*/

// AlgoViz reference implementation: topological sort (Kahn, C++17).
// Repeatedly removes a vertex with in-degree zero; a remaining vertex means a cycle.
//
// Reading guide:
// 1. Compute indegree for every vertex.
// 2. Enqueue all vertices with indegree zero.
// 3. Pop one vertex, append it to the order, and decrement each neighbour's
//    indegree.
// 4. If fewer than V vertices are emitted, the graph contains a directed cycle.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra
//   space O(V).
// Convention: Kahn's algorithm; 0-based vertices; zero-indegree ties follow queue
//   order.

#include <iostream>
#include <queue>
#include <vector>

// A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.
int main()
{
    std::vector<std::pair<int, int>> edges{{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}};
    std::vector<std::vector<int>> graph(6);
    std::vector<int> indegree(6, 0);
    for (auto [from, to] : edges)
    {
        graph[from].push_back(to);
        ++indegree[to];
    }

    std::queue<int> ready;
    for (int vertex = 0; vertex < 6; ++vertex)
    {
        if (indegree[vertex] == 0)
        {
            ready.push(vertex);
        }
    }

    std::vector<int> order;
    // Pop a zero-indegree vertex, append it, then decrement each neighbour's indegree.
    while (!ready.empty())
    {
        int vertex = ready.front();
        ready.pop();
        order.push_back(vertex);
        for (int next : graph[vertex])
        {
            if (--indegree[next] == 0)
            {
                ready.push(next);
            }
        }
    }

    if (order.size() != graph.size())
    {
        std::cout << "cycle detected\n";
        return 0;
    }
    std::cout << "order:";
    for (int vertex : order)
    {
        std::cout << ' ' << vertex;
    }
    std::cout << '\n';
    return 0;
}

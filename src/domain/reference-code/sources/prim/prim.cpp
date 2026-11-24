/*
 * 中文导读：从一个结点开始，每次选择连接“已选集合”和“未选集合”的最小边。
 * 阅读顺序：先看 key[]/in_mst[]；再看每次选最小 key 的顶点；最后看用它更新邻居的 key。
 * 关键不变量：已选顶点集合始终连成一棵树；key[v] 是 v 到该树的最小边权。
 * 易错点：没有跳过已选点；非连通图仍报成功；key 初始化成 0 而非 INF；更新条件写成小于等于。
 * 复杂度：邻接矩阵 O(V²)，堆 O(E log V)，空间 O(V+E)。
 * 输入/输出：输入无向带权图；输出选中的 MST 边与总权值；main 打印结果。
*/

// AlgoViz reference implementation: Prim's minimum spanning tree (C++17).
// Grows one tree from vertex 0 using a min-heap of candidate edges.
//
// Reading guide:
// 1. Start from one vertex and keep a visited/cut set.
// 2. Repeatedly choose the cheapest edge with exactly one endpoint inside the cut.
// 3. Add the outside endpoint, then update the candidate edges from the new vertex.
// 4. After V - 1 accepted edges a spanning tree is complete; fewer means the graph
//    is disconnected.
//
// Complexity: O(V^2) with dense scanning, O(E log V) with a heap; extra space O(V^2)
//   for a matrix or O(V + E) for lists.
// Convention: Undirected weighted graph; 0-based vertices; equal weights may produce
//   different but valid MSTs.

#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <utility>
#include <vector>

// This implementation grows the tree by popping the lightest cut edge from `candidates`; selected vertices are skipped as stale.
int main()
{
    std::vector<std::vector<std::pair<int, int>>> graph(5);
    auto add_edge = [&graph](int a, int b, int weight)
    {
        graph[a].push_back({weight, b});
        graph[b].push_back({weight, a});
    };
    add_edge(0, 1, 2);
    add_edge(0, 3, 6);
    add_edge(1, 2, 3);
    add_edge(1, 3, 8);
    add_edge(1, 4, 5);
    add_edge(2, 4, 7);
    add_edge(3, 4, 9);

    std::vector<bool> selected(5, false);
    // A candidate records the edge's two endpoints, so the root can be distinguished from a real zero-weight edge.
    using Candidate = std::tuple<int, int, int>;
    std::priority_queue<Candidate, std::vector<Candidate>, std::greater<Candidate>> candidates;
    // The initial (0,0,-1) is a cut seed, not a tree edge; parent -1 is what excludes it from the output.
    candidates.push({0, 0, -1});

    int total = 0;
    std::cout << "mst edges:\n";
    // An empty heap with vertices still unselected means the graph is disconnected; this demo prints the partial total without a failure flag.
    while (!candidates.empty())
    {
        auto [weight, vertex, parent] = candidates.top();
        candidates.pop();
        // A vertex can be pushed once per incident edge; the first pop settles it and every later entry is stale.
        if (selected[vertex])
        {
            continue;
        }
        selected[vertex] = true;
        // The root seed contributes zero; every accepted candidate with a parent is one edge of the spanning tree.
        total += weight;
        // Parent presence, not weight != 0, decides whether this candidate is a real tree edge; a zero-weight edge must still be printed.
        if (parent != -1)
        {
            std::cout << "edge " << parent << " - " << vertex << " : " << weight << '\n';
        }
        // Pushing every unselected endpoint is a lazy decrease-key: the heap may hold O(E) candidates instead of one per vertex.
        for (auto [next_weight, next] : graph[vertex])
        {
            if (!selected[next])
            {
                candidates.push({next_weight, next, vertex});
            }
        }
    }
    std::cout << "total: " << total << '\n';
    return 0;
}

// AlgoViz reference implementation: Prim's minimum spanning tree (C++17).
// Original code written for this repository under the MIT License.
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
#include <utility>
#include <vector>

int main() {
    std::vector<std::vector<std::pair<int, int>>> graph(5);
    auto add_edge = [&graph](int a, int b, int weight) {
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
    using Candidate = std::pair<int, int>;
    std::priority_queue<Candidate, std::vector<Candidate>, std::greater<Candidate>> candidates;
    candidates.push({0, 0});

    int total = 0;
    std::cout << "mst edges:\n";
    while (!candidates.empty()) {
        auto [weight, vertex] = candidates.top();
        candidates.pop();
        if (selected[vertex]) {
            continue;
        }
        selected[vertex] = true;
        total += weight;
        if (weight != 0) {
            std::cout << "edge to " << vertex << " : " << weight << '\n';
        }
        for (auto [next_weight, next] : graph[vertex]) {
            if (!selected[next]) {
                candidates.push({next_weight, next});
            }
        }
    }
    std::cout << "total: " << total << '\n';
    return 0;
}

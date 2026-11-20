// AlgoViz reference implementation: topological sort (Kahn, C++17).
// Original code written for this repository under the MIT License.
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

int main() {
    std::vector<std::pair<int, int>> edges{{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}};
    std::vector<std::vector<int>> graph(6);
    std::vector<int> indegree(6, 0);
    for (auto [from, to] : edges) {
        graph[from].push_back(to);
        ++indegree[to];
    }

    std::queue<int> ready;
    for (int vertex = 0; vertex < 6; ++vertex) {
        if (indegree[vertex] == 0) {
            ready.push(vertex);
        }
    }

    std::vector<int> order;
    // Pop a zero-indegree vertex, append it, then decrement each neighbour's indegree.
    while (!ready.empty()) {
        int vertex = ready.front();
        ready.pop();
        order.push_back(vertex);
        for (int next : graph[vertex]) {
            if (--indegree[next] == 0) {
                ready.push(next);
            }
        }
    }

    if (order.size() != graph.size()) {
        std::cout << "cycle detected\n";
        return 0;
    }
    std::cout << "order:";
    for (int vertex : order) {
        std::cout << ' ' << vertex;
    }
    std::cout << '\n';
    return 0;
}

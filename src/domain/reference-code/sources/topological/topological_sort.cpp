// AlgoViz reference implementation: topological sort (Kahn, C++17).
// Original code written for this repository under the MIT License.
// Repeatedly removes a vertex with in-degree zero; a remaining vertex means a cycle.

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

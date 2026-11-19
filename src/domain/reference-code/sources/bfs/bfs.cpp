// AlgoViz reference implementation: breadth-first search (C++17).
// Original code written for this repository under the MIT License.
// Uses an adjacency list and std::queue; visits vertices level by level.

#include <iostream>
#include <queue>
#include <vector>

void bfs(const std::vector<std::vector<int>>& graph, int start) {
    std::vector<bool> visited(graph.size(), false);
    std::queue<int> pending;

    visited[start] = true;
    pending.push(start);
    std::cout << "order:";

    while (!pending.empty()) {
        int vertex = pending.front();
        pending.pop();
        std::cout << ' ' << vertex;
        for (int next : graph[vertex]) {
            if (!visited[next]) {
                visited[next] = true;
                pending.push(next);
            }
        }
    }
    std::cout << '\n';
}

int main() {
    std::vector<std::vector<int>> graph(6);
    auto add_edge = [&graph](int a, int b) {
        graph[a].push_back(b);
        graph[b].push_back(a);
    };
    add_edge(0, 1);
    add_edge(0, 2);
    add_edge(1, 3);
    add_edge(2, 4);
    add_edge(4, 5);

    bfs(graph, 0);
    bfs(graph, 3);
    return 0;
}

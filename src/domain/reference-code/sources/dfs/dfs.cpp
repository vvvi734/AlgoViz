// AlgoViz reference implementation: depth-first search (C++17).
// Original code written for this repository under the MIT License.
// Recursively follows one branch as far as possible before backtracking.

#include <iostream>
#include <vector>

void dfs_visit(const std::vector<std::vector<int>>& graph, int vertex, std::vector<bool>& visited) {
    visited[vertex] = true;
    std::cout << ' ' << vertex;
    for (int next : graph[vertex]) {
        if (!visited[next]) {
            dfs_visit(graph, next, visited);
        }
    }
}

void dfs(const std::vector<std::vector<int>>& graph, int start) {
    std::vector<bool> visited(graph.size(), false);
    std::cout << "order:";
    dfs_visit(graph, start, visited);
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

    dfs(graph, 0);
    dfs(graph, 3);
    return 0;
}

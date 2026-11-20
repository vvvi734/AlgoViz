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

void first_pass(const std::vector<std::vector<int>>& graph, int vertex,
                std::vector<bool>& visited, std::vector<int>& order) {
    visited[vertex] = true;
    for (int next : graph[vertex]) {
        if (!visited[next]) {
            first_pass(graph, next, visited, order);
        }
    }
    order.push_back(vertex);
}

void collect(const std::vector<std::vector<int>>& reverse_graph, int vertex,
             std::vector<bool>& visited, std::vector<int>& component) {
    visited[vertex] = true;
    component.push_back(vertex);
    for (int next : reverse_graph[vertex]) {
        if (!visited[next]) {
            collect(reverse_graph, next, visited, component);
        }
    }
}

int main() {
    std::vector<std::pair<int, int>> edges{{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}, {4, 5}, {5, 3}};
    std::vector<std::vector<int>> graph(6);
    std::vector<std::vector<int>> reverse_graph(6);
    for (auto [from, to] : edges) {
        graph[from].push_back(to);
        reverse_graph[to].push_back(from);
    }

    std::vector<bool> visited(6, false);
    std::vector<int> order;
    for (int vertex = 0; vertex < 6; ++vertex) {
        if (!visited[vertex]) {
            first_pass(graph, vertex, visited, order);
        }
    }

    std::fill(visited.begin(), visited.end(), false);
    int components = 0;
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        if (!visited[*it]) {
            std::vector<int> component;
            collect(reverse_graph, *it, visited, component);
            ++components;
            std::cout << "scc " << components << ":";
            for (int vertex : component) {
                std::cout << ' ' << vertex;
            }
            std::cout << '\n';
        }
    }
    std::cout << "total: " << components << '\n';
    return 0;
}

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

void visit(const std::vector<std::vector<int>>& graph, int vertex, std::vector<bool>& visited) {
    visited[vertex] = true;
    std::cout << ' ' << vertex;
    for (int next : graph[vertex]) {
        if (!visited[next]) {
            visit(graph, next, visited);
        }
    }
}

// Every unvisited start opens a new component; one DFS marks all vertices reachable from it.
int count_components(const std::vector<std::vector<int>>& graph) {
    std::vector<bool> visited(graph.size(), false);
    int components = 0;
    for (std::size_t start = 0; start < graph.size(); ++start) {
        if (!visited[start]) {
            ++components;
            std::cout << "component " << components << ":";
            visit(graph, static_cast<int>(start), visited);
            std::cout << '\n';
        }
    }
    return components;
}

int main() {
    std::vector<std::vector<int>> graph(7);
    auto add_edge = [&graph](int a, int b) {
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

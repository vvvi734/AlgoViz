// AlgoViz reference implementation: depth-first search (C++17).
// Original code written for this repository under the MIT License.
// Recursively follows one branch as far as possible before backtracking.
//
// Reading guide:
// 1. Mark the current vertex on entry so cycles cannot revisit it.
// 2. Scan every possible neighbour (matrix row or adjacency list) and recurse into
//    unvisited ones.
// 3. Emit the vertex in preorder when it is first visited.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra
//   space O(V) marks plus O(h) recursion.
// Convention: Vertices are 0-based; recursion depth can reach V on a path graph.


#include <iostream>
#include <vector>

// Mark on entry, then recurse into every unvisited neighbour before backtracking.
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

// AlgoViz reference implementation: breadth-first search (C++17).
// Uses an adjacency list and std::queue; visits vertices level by level.
//
// Reading guide:
// 1. Mark the start vertex when it is enqueued, not when it is dequeued.
// 2. Pop the FIFO front and inspect every possible neighbour (matrix row or
//    adjacency list).
// 3. Enqueue only unvisited neighbours; BFS order is nondecreasing in edge count.
//
// Complexity: O(V + E) for adjacency lists, O(V^2) when scanning an adjacency
//   matrix; extra space O(V).
// Convention: Vertices are 0-based; each undirected edge is stored in both
//   directions.


#include <iostream>
#include <queue>
#include <vector>

// Mark a neighbour before enqueueing it; the FIFO frontier then visits level by level.
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

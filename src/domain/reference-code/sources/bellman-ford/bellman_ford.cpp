// AlgoViz reference implementation: Bellman-Ford (C++17).
// Original code written for this repository under the MIT License.
// Relaxes every edge V - 1 times; an extra successful relaxation means a
// reachable negative cycle. Supports negative edges.
//
// Reading guide:
// 1. Initialise all distances to infinity and the source to 0.
// 2. Relax every directed edge V - 1 times; each pass extends paths by at most one
//    edge.
// 3. Stop early when a full pass makes no change.
// 4. One extra pass that still relaxes an edge proves a reachable negative cycle.
//
// Complexity: O(V * E); extra space O(V) for distances and predecessors.
// Convention: Edges are (u, v, weight) with 0-based endpoints; returns None/null on
//   a negative cycle.

#include <iostream>
#include <limits>
#include <vector>

struct Edge {
    int from;
    int to;
    int weight;
};

bool bellman_ford(int vertex_count, const std::vector<Edge>& edges, int source,
                  std::vector<int>& dist) {
    const int kInfinity = std::numeric_limits<int>::max();
    dist.assign(vertex_count, kInfinity);
    dist[source] = 0;

    for (int round = 0; round < vertex_count - 1; ++round) {
        bool changed = false;
        for (const Edge& edge : edges) {
            if (dist[edge.from] == kInfinity) {
                continue;
            }
            int candidate = dist[edge.from] + edge.weight;
            if (candidate < dist[edge.to]) {
                dist[edge.to] = candidate;
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }

    for (const Edge& edge : edges) {
        if (dist[edge.from] != kInfinity && dist[edge.from] + edge.weight < dist[edge.to]) {
            return false;
        }
    }
    return true;
}

int main() {
    std::vector<Edge> edges{
        {0, 1, 6}, {0, 2, 7}, {1, 2, 8}, {1, 3, 5}, {1, 4, -4},
        {2, 3, -3}, {2, 4, 9}, {3, 1, -2}, {4, 0, 2}, {4, 3, 7},
    };
    std::vector<int> dist;
    if (!bellman_ford(5, edges, 0, dist)) {
        std::cout << "negative cycle\n";
        return 0;
    }

    std::cout << "distances:";
    for (int value : dist) {
        if (value == std::numeric_limits<int>::max()) {
            std::cout << " INF";
        } else {
            std::cout << ' ' << value;
        }
    }
    std::cout << '\n';
    return 0;
}

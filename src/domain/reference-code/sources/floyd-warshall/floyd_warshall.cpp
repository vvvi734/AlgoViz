// AlgoViz reference implementation: Floyd-Warshall (C++17).
// Dynamic programming over allowed intermediate vertices; handles negative
// edges but not negative cycles. dist[i][j] is the shortest i -> j distance.
//
// Reading guide:
// 1. Start from the direct-edge distance matrix; diagonal is 0 and missing edges are
//    infinity.
// 2. Use k as the only allowed intermediate vertex, in the outer loop.
// 3. Relax dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).
// 4. The matrix is updated in place; negative cycles can be detected on the
//    diagonal.
//
// Complexity: O(V^3); extra space O(V^2) for the distance matrix.
// Convention: 0-based vertices; INF means no edge/path; the diagonal starts at 0.

#include <iostream>
#include <vector>

constexpr int kInfinity = 1000000;

// Outer loop fixes the only allowed intermediate vertex k; relax i -> j through k.
// The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.
void floyd_warshall(std::vector<std::vector<int>>& dist) {
    for (std::size_t middle = 0; middle < dist.size(); ++middle) {
        for (std::size_t from = 0; from < dist.size(); ++from) {
            if (dist[from][middle] == kInfinity) {
                continue;
            }
            for (std::size_t to = 0; to < dist.size(); ++to) {
                if (dist[middle][to] == kInfinity) {
                    continue;
                }
                int candidate = dist[from][middle] + dist[middle][to];
                if (candidate < dist[from][to]) {
                    dist[from][to] = candidate;
                }
            }
        }
    }
}

int main() {
    std::vector<std::vector<int>> dist{
        {0, 3, kInfinity, 7},
        {8, 0, 2, kInfinity},
        {5, kInfinity, 0, 1},
        {2, kInfinity, kInfinity, 0},
    };

    floyd_warshall(dist);

    std::cout << "distances:\n";
    for (const auto& row : dist) {
        for (int value : row) {
            if (value == kInfinity) {
                std::cout << "INF ";
            } else {
                std::cout << value << ' ';
            }
        }
        std::cout << '\n';
    }
    return 0;
}

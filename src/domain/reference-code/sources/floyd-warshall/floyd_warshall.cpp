// AlgoViz reference implementation: Floyd-Warshall (C++17).
// Original code written for this repository under the MIT License.
// Dynamic programming over allowed intermediate vertices; handles negative
// edges but not negative cycles. dist[i][j] is the shortest i -> j distance.

#include <iostream>
#include <vector>

constexpr int kInfinity = 1000000;

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

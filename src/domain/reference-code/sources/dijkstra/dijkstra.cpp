// AlgoViz reference implementation: Dijkstra (adjacency list + min-heap).
// The shortest-path algorithm is explicit; no graph library is used.
//
// Reading guide:
// 1. Initialise distances to infinity and the source to 0.
// 2. Repeatedly settle the unsettled vertex with the smallest tentative distance.
// 3. Relax its outgoing edges; a smaller candidate updates distance and predecessor.
// 4. Stop when the frontier is empty; previous pointers reconstruct the path.
//
// Complexity: O(V^2) with a matrix, O((V + E) log V) with a binary heap; extra space
//   O(V^2) for a matrix or O(V + E) for lists.
// Convention: Non-negative weights only; 0-based vertices; unreachable distances
//   stay infinity.


#include <functional>
#include <iostream>
#include <limits>
#include <queue>
#include <stdexcept>
#include <string>
#include <vector>

struct Edge {
    int to;
    int weight;
};

struct QueueEntry {
    long long distance;
    int vertex;

    bool operator>(const QueueEntry& other) const {
        return distance > other.distance;
    }
};

std::vector<long long> dijkstra(const std::vector<std::vector<Edge>>& graph,
                                int source,
                                std::vector<int>& previous) {
    const long long infinity = std::numeric_limits<long long>::max();
    const int n = static_cast<int>(graph.size());
    std::vector<long long> distance(static_cast<std::size_t>(n), infinity);
    std::vector<char> settled(static_cast<std::size_t>(n), 0);
    previous.assign(static_cast<std::size_t>(n), -1);

    using Queue = std::priority_queue<QueueEntry, std::vector<QueueEntry>, std::greater<QueueEntry>>;
    Queue queue;
    distance[static_cast<std::size_t>(source)] = 0;
    queue.push({0, source});

    while (!queue.empty()) {
        QueueEntry current = queue.top();
        queue.pop();
        int u = current.vertex;
        if (current.distance != distance[static_cast<std::size_t>(u)] || settled[static_cast<std::size_t>(u)]) {
            continue;  // stale heap entry
        }
        settled[static_cast<std::size_t>(u)] = 1;

        for (const Edge& edge : graph[static_cast<std::size_t>(u)]) {
            if (edge.weight < 0) {
                throw std::invalid_argument("Dijkstra requires non-negative edge weights");
            }
            long long candidate = distance[static_cast<std::size_t>(u)] + edge.weight;
            if (candidate < distance[static_cast<std::size_t>(edge.to)]) {
                distance[static_cast<std::size_t>(edge.to)] = candidate;
                previous[static_cast<std::size_t>(edge.to)] = u;
                queue.push({candidate, edge.to});
            }
        }
    }
    return distance;
}

std::string path_to(const std::vector<int>& previous, int target, const std::vector<std::string>& names) {
    std::vector<int> path;
    for (int current = target; current != -1; current = previous[static_cast<std::size_t>(current)]) {
        path.push_back(current);
    }
    std::string result = "path:";
    for (auto it = path.rbegin(); it != path.rend(); ++it) {
        result += " " + names[static_cast<std::size_t>(*it)];
    }
    return result;
}

int main() {
    const std::vector<std::string> names{"A", "B", "C", "D", "E", "F"};
    std::vector<std::vector<Edge>> graph(names.size());
    graph[0].push_back({1, 4});
    graph[0].push_back({2, 1});
    graph[2].push_back({1, 2});
    graph[2].push_back({3, 5});
    graph[1].push_back({3, 1});
    graph[3].push_back({4, 3});
    graph[4].push_back({5, 1});

    std::vector<int> previous;
    const auto distance = dijkstra(graph, 0, previous);

    for (std::size_t i = 0; i < names.size(); ++i) {
        std::cout << names[i] << " distance=" << distance[i] << '\n';
    }
    std::cout << path_to(previous, 5, names) << '\n';
    return 0;
}

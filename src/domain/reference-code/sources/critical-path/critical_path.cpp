// AlgoViz reference implementation: critical path on an AOE network (C++17).
// A forward topological pass computes earliest start times; a reverse pass
// computes latest times. An activity is critical when its slack is zero.
//
// Reading guide:
// 1. Treat the AOE network as a DAG of events and weighted activities.
// 2. Compute earliest event times in topological order.
// 3. Compute latest event times in reverse topological order.
// 4. An activity is critical when latest(head) - earliest(tail) - weight == 0.
//
// Complexity: O(V + E) for adjacency-list processing, O(V^2) when scanning a matrix;
//   extra space O(V + E) for times, degrees and the queue.
// Convention: Vertices are 0-based events; the project starts at event 0 and ends at
//   the last event.

#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

struct Activity {
    int from;
    int to;
    int weight;
};

// Forward pass takes the maximum predecessor finish; backward pass the minimum successor start; activity slack is latest(head) - earliest(tail) - weight.
int main() {
    std::vector<Activity> activities{
        {0, 1, 3}, {0, 2, 2}, {1, 2, 1}, {1, 3, 2},
        {2, 3, 1}, {2, 4, 3}, {3, 5, 2}, {4, 5, 1},
    };
    std::vector<std::vector<int>> graph(6);
    std::vector<int> indegree(6, 0);
    for (std::size_t i = 0; i < activities.size(); ++i) {
        graph[activities[i].from].push_back(static_cast<int>(i));
        ++indegree[activities[i].to];
    }

    std::vector<int> earliest(6, 0);
    std::queue<int> ready;
    for (int vertex = 0; vertex < 6; ++vertex) {
        if (indegree[vertex] == 0) {
            ready.push(vertex);
        }
    }

    std::vector<int> order;
    while (!ready.empty()) {
        int vertex = ready.front();
        ready.pop();
        order.push_back(vertex);
        for (int index : graph[vertex]) {
            const Activity& activity = activities[index];
            earliest[activity.to] = std::max(earliest[activity.to],
                                             earliest[vertex] + activity.weight);
            if (--indegree[activity.to] == 0) {
                ready.push(activity.to);
            }
        }
    }

    std::vector<int> latest(6, earliest[5]);
    // Reverse pass: latest[v] = min(latest[next] - weight).
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        int vertex = *it;
        for (int index : graph[vertex]) {
            const Activity& activity = activities[index];
            latest[vertex] = std::min(latest[vertex],
                                      latest[activity.to] - activity.weight);
        }
    }

    std::cout << "earliest:";
    for (int value : earliest) {
        std::cout << ' ' << value;
    }
    std::cout << "\nlatest:";
    for (int value : latest) {
        std::cout << ' ' << value;
    }
    std::cout << "\nduration: " << earliest[5] << '\n';

    std::cout << "critical edges:\n";
    for (const Activity& activity : activities) {
        if (earliest[activity.from] == latest[activity.from] &&
            earliest[activity.to] == latest[activity.to] &&
            latest[activity.to] - earliest[activity.from] == activity.weight) {
            std::cout << activity.from << " -> " << activity.to << " : "
                      << activity.weight << '\n';
        }
    }
    return 0;
}

/*
 * 中文导读：每次从未确定集合中取当前距离最小的结点，并用它松弛出边。
 * 阅读顺序：先看 dist/visited 初始化；再看待确定集合的最小值；最后看为什么一旦确定就不再改。
 * 关键不变量：已确定结点的 dist 是最终最短路；候选 dist 是经过已确定结点的一条路径长度。
 * 易错点：负权边下使用 Dijkstra；忘记跳过已确定点；多重边没有取最小；INF 溢出。
 * 复杂度：邻接矩阵 O(V²)，二叉堆 O((V+E)log V)，空间 O(V+E)。
 * 输入/输出：输入非负权邻接表与源点；返回最短距离和前驱；main 打印距离与一条路径。
*/

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

struct Edge
{
    int to;
    int weight;
};

struct QueueEntry
{
    long long distance;
    int vertex;

    bool operator>(const QueueEntry &other) const
    {
        return distance > other.distance;
    }
};

// Purpose: Compute single-source shortest paths from source; return distances and write predecessors into previous for path_to.
// 作用：求 source 的单源最短路；返回距离数组，并把前驱写入 previous 供 path_to 还原路径。
std::vector<long long> dijkstra(const std::vector<std::vector<Edge>> &graph, int source,
                                std::vector<int> &previous)
{
    const long long infinity = std::numeric_limits<long long>::max();
    const int n = static_cast<int>(graph.size());
    // Validate the source and every edge target before indexing: an out-of-range vertex would corrupt distance/previous before any path check runs.
    if (source < 0 || source >= n)
    {
        throw std::invalid_argument("source vertex is outside the graph");
    }
    for (const auto &neighbours : graph)
    {
        for (const Edge &edge : neighbours)
        {
            if (edge.to < 0 || edge.to >= n)
            {
                throw std::invalid_argument("edge target is outside the graph");
            }
        }
    }
    std::vector<long long> distance(static_cast<std::size_t>(n), infinity);
    std::vector<char> settled(static_cast<std::size_t>(n), 0);
    previous.assign(static_cast<std::size_t>(n), -1);

    using Queue =
        std::priority_queue<QueueEntry, std::vector<QueueEntry>, std::greater<QueueEntry>>;
    Queue queue;
    // The source is the only zero-distance entry; every other vertex begins at infinity.
    distance[static_cast<std::size_t>(source)] = 0;
    queue.push({0, source});

    // The heap can hold stale entries for settled vertices, so the loop is not bounded by V.
    while (!queue.empty())
    {
        QueueEntry current = queue.top();
        queue.pop();
        int u = current.vertex;
        // Ignore stale heap entries: a shorter distance for this vertex was pushed later.
        if (current.distance != distance[static_cast<std::size_t>(u)] ||
            settled[static_cast<std::size_t>(u)])
        {
            continue; // stale heap entry
        }
        // Once settled, the vertex distance cannot improve when all edge weights are non-negative.
        settled[static_cast<std::size_t>(u)] = 1;

        for (const Edge &edge : graph[static_cast<std::size_t>(u)])
        {
            // Dijkstra's proof needs non-negative weights; rejecting a negative edge is safer than silently returning a wrong path.
            if (edge.weight < 0)
            {
                throw std::invalid_argument("Dijkstra requires non-negative edge weights");
            }
            long long candidate = distance[static_cast<std::size_t>(u)] + edge.weight;
            // An equal candidate is not an improvement; keeping the old predecessor avoids needless heap entries.
            if (candidate < distance[static_cast<std::size_t>(edge.to)])
            {
                distance[static_cast<std::size_t>(edge.to)] = candidate;
                previous[static_cast<std::size_t>(edge.to)] = u;
                queue.push({candidate, edge.to});
            }
        }
    }
    return distance;
}

// Purpose: Walk previous[] from target back to the source, reverse it, and return a readable path string.
// 作用：沿 previous[] 从 target 回溯到源点并反转，返回可读路径字符串。
std::string path_to(const std::vector<int> &previous, int target,
                    const std::vector<std::string> &names, int source)
{
    // An unreachable target has previous == -1, which would otherwise look like a one-vertex path ending at target.
    if (target < 0 || target >= static_cast<int>(previous.size()))
    {
        return "path: unreachable";
    }
    if (target != source && previous[static_cast<std::size_t>(target)] == -1)
    {
        return "path: unreachable";
    }
    std::vector<int> path;
    // path_to assumes a reachable target; the source is the only valid vertex whose previous is -1.
    for (int current = target; current != -1; current = previous[static_cast<std::size_t>(current)])
    {
        path.push_back(current);
    }
    std::string result = "path:";
    for (auto it = path.rbegin(); it != path.rend(); ++it)
    {
        result += " " + names[static_cast<std::size_t>(*it)];
    }
    return result;
}

int main()
{
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

    for (std::size_t i = 0; i < names.size(); ++i)
    {
        std::cout << names[i] << " distance=" << distance[i] << '\n';
    }
    std::cout << path_to(previous, 5, names, 0) << '\n';
    return 0;
}

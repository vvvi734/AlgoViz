/*
 * 中文导读：按距离分层访问图，先访问所有距离为 d 的结点，再访问距离为 d+1 的结点。
 * 阅读顺序：先看 visited[] 与队列；再看入队时为什么立刻标记；最后看邻接表如何枚举邻居。
 * 关键不变量：队列中的结点按距离非降排列；每个结点最多入队一次。
 * 易错点：出队才标记导致重复入队；把队列写成栈；忽略不连通分量。
 * 复杂度：邻接表 O(V+E) 时间，O(V) 额外空间。
 * 输入/输出：输入 main 内置的邻接表与起点；函数只打印从起点可达顶点的 BFS 顺序，不返回数组。
*/

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

// The queue holds only discovered vertices; visited is set at enqueue time, so each vertex enters at most once.
void bfs(const std::vector<std::vector<int>> &graph, int start)
{
    // One boolean mark per vertex, sized from the adjacency list; false means undiscovered.
    std::vector<bool> visited(graph.size(), false);
    // The FIFO discipline of std::queue is what makes BFS level ordered; the container order defines the traversal order.
    std::queue<int> pending;

    // The start is discovered before the loop, so the invariant already includes it.
    visited[start] = true;
    // Mark before push; marking at pop time would let several predecessors enqueue the same vertex.
    pending.push(start);
    std::cout << "order:";

    // Each iteration consumes exactly one frontier vertex, so the queue eventually drains.
    while (!pending.empty())
    {
        // front() observes the oldest vertex; the queue itself decides the breadth-first order.
        int vertex = pending.front();
        // Remove only after copying vertex; pop alone would discard the value before the neighbor scan.
        pending.pop();
        std::cout << ' ' << vertex;
        // Adjacency lists visit only real neighbors, so this loop is O(deg(vertex)) instead of O(V).
        for (int next : graph[vertex])
        {
            // The visited guard is checked before push; an already discovered neighbor is skipped even if another edge reaches it.
            if (!visited[next])
            {
                // Mark before push so a later neighbor scan cannot enqueue the same vertex again.
                visited[next] = true;
                // Push at the back; all vertices already in the queue are processed first.
                pending.push(next);
            }
        }
    }
    std::cout << '\n';
}

int main()
{
    std::vector<std::vector<int>> graph(6);
    auto add_edge = [&graph](int a, int b)
    {
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

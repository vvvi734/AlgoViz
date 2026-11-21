/*
 * 中文导读：按距离分层访问图，先访问所有距离为 d 的结点，再访问距离为 d+1 的结点。
 * 阅读顺序：先看 visited[] 与队列；再看入队时为什么立刻标记；最后看 BFS 树如何由 parent[] 还原路径。
 * 关键不变量：队列中的结点按距离非降排列；每个结点最多入队一次。
 * 易错点：出队才标记导致重复入队；把队列写成栈；忽略不连通分量。
 * 复杂度：邻接表 O(V+E) 时间，O(V) 额外空间。
 * 输入/输出：输入 main 内置的邻接表与起点；返回/打印从起点可达顶点的 BFS 顺序。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// Mark a neighbour before enqueueing it; the FIFO frontier then visits level by level.
// Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.
// 作用：从 start 开始按距离分层遍历图；用队列保存待访问结点，入队时立即标记 visited。
void bfs(const std::vector<std::vector<int>> &graph, int start)
{
    std::vector<bool> visited(graph.size(), false);
    std::queue<int> pending;

    visited[start] = true;
    pending.push(start);
    std::cout << "order:";

    while (!pending.empty())
    {
        int vertex = pending.front();
        pending.pop();
        std::cout << ' ' << vertex;
        for (int next : graph[vertex])
        {
            if (!visited[next])
            {
                visited[next] = true;
                pending.push(next);
            }
        }
    }
    std::cout << '\n';
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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

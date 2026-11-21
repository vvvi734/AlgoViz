"""AlgoViz reference implementation: breadth-first search.

Uses an adjacency list and collections.deque; visits vertices level by level.

Reading guide:
1. Mark the start vertex when it is enqueued, not when it is dequeued.
2. Pop the FIFO front and inspect every possible neighbour (matrix row or adjacency
   list).
3. Enqueue only unvisited neighbours; BFS order is nondecreasing in edge count.

Complexity: O(V + E) for adjacency lists, O(V^2) when scanning an adjacency matrix;
  extra space O(V).
Convention: Vertices are 0-based; each undirected edge is stored in both directions.
"""
# 中文导读：用队列按层访问图，顶点入队时立即标记，保证每个顶点只入队一次。
# 阅读顺序：先看 visited 的置位时机，再看邻居入队顺序。
# 输入/输出：输入邻接表与起点；返回从起点可达顶点的访问顺序；起点越界由调用方保证合法。
# 不变量：队列中的顶点都已经标记；出队顺序按层非降。
# 易错点：出队后才标记导致重复入队；忘记处理不连通图。
# 复杂度：O(V+E)，额外空间 O(V)。

from __future__ import annotations

from collections import deque


# Mark a neighbour before enqueueing it; the FIFO frontier then visits level by level.
# Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.
# 作用：返回从 start 可达顶点的 BFS 顺序；不修改 graph。
def bfs(graph: list[list[int]], start: int) -> list[int]:
    visited = [False] * len(graph)
    visited[start] = True
    pending: deque[int] = deque([start])
    order: list[int] = []

    while pending:
        vertex = pending.popleft()
        order.append(vertex)
        for neighbor in graph[vertex]:
            if not visited[neighbor]:
                visited[neighbor] = True
                pending.append(neighbor)
    return order


# 作用：构造演示图并打印 BFS 序列。
def main() -> None:
    graph: list[list[int]] = [[] for _ in range(6)]

    def add_edge(a: int, b: int) -> None:
        graph[a].append(b)
        graph[b].append(a)

    add_edge(0, 1)
    add_edge(0, 2)
    add_edge(1, 3)
    add_edge(2, 4)
    add_edge(4, 5)

    print("order:", bfs(graph, 0))
    print("order:", bfs(graph, 3))
    assert bfs(graph, 0) == [0, 1, 2, 3, 4, 5]


if __name__ == "__main__":
    main()

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


# Visited is set on enqueue, not on dequeue, so a vertex with several predecessors enters the queue once.
def bfs(graph: list[list[int]], start: int) -> list[int]:
    # One boolean per vertex; the list length also fixes the valid index range.
    visited = [False] * len(graph)
    # Mark the start before the loop; the invariant is 'queued implies visited'.
    visited[start] = True
    # deque gives O(1) popleft; a list pop(0) would shift the remaining frontier.
    pending: deque[int] = deque([start])
    # Order records dequeue order, which is also nondecreasing distance order for an unweighted graph.
    order: list[int] = []

    # The loop ends when the frontier is empty, meaning the start component has been exhausted.
    while pending:
        # popleft removes the oldest discovery; this FIFO step is what distinguishes BFS from DFS.
        vertex = pending.popleft()
        # Record on removal, not on discovery, so the output matches the processing order.
        order.append(vertex)
        # Only stored neighbors are scanned; absent entries mean no edge.
        for neighbor in graph[vertex]:
            # The guard prevents a second enqueue; without it the queue can grow without bound on cycles.
            if not visited[neighbor]:
                # Mark before append; the mark must be visible to any later neighbor scan.
                visited[neighbor] = True
                # Append at the right end; the vertex waits behind everything discovered earlier.
                pending.append(neighbor)
    return order


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

"""AlgoViz reference implementation: Bellman-Ford.

Relaxes every edge V - 1 times; an extra successful relaxation means a
reachable negative cycle. Supports negative edges.

Reading guide:
1. Initialise all distances to infinity and the source to 0.
2. Relax every directed edge V - 1 times; each pass extends paths by at most one edge.
3. Stop early when a full pass makes no change.
4. One extra pass that still relaxes an edge proves a reachable negative cycle.

Complexity: O(V * E); extra space O(V) for distances and predecessors.
Convention: Edges are (u, v, weight) with 0-based endpoints; returns None/null on a
  negative cycle.
"""
# 中文导读：对每条边做 V-1 轮松弛，求出单源最短路径，再用第 V 轮检测可达负环。
# 阅读顺序：先看 dist 初始化，再看两重循环的松弛条件，最后看负环检测。
# 输入/输出：输入顶点数、边 (u, v, weight) 与源点；返回距离数组；存在可达负环时返回 None。
# 不变量：第 k 轮结束后，dist[v] 不超过“最多经过 k 条边”的最短距离。
# 易错点：把 INF 当普通数相加；负环检测只看源点；边方向写反。
# 复杂度：O(VE)，额外空间 O(V)。

from __future__ import annotations

INF = float("inf")


# V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.
# V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.
# Purpose: Return shortest distances from source; return None for a reachable negative cycle and do not modify edges.
# 作用：返回从 source 出发的最短距离；可达负环返回 None，不修改 edges。
def bellman_ford(vertex_count: int, edges: list[tuple[int, int, int]], source: int) -> list[float] | None:
    dist: list[float] = [INF] * vertex_count
    dist[source] = 0

    for _ in range(vertex_count - 1):
        changed = False
        for start, end, weight in edges:
            if dist[start] == INF:
                continue
            candidate = dist[start] + weight
            if candidate < dist[end]:
                dist[end] = candidate
                changed = True
        if not changed:
            break

    for start, end, weight in edges:
        if dist[start] != INF and dist[start] + weight < dist[end]:
            return None
    return dist


# Purpose: Build a demo graph with negative edges and print shortest distances.
# 作用：构造含负权边的演示图并打印最短距离。
def main() -> None:
    edges = [
        (0, 1, 6), (0, 2, 7), (1, 2, 8), (1, 3, 5), (1, 4, -4),
        (2, 3, -3), (2, 4, 9), (3, 1, -2), (4, 0, 2), (4, 3, 7),
    ]
    dist = bellman_ford(5, edges, 0)
    print("distances:", dist)
    assert dist == [0, 2, 7, 4, -2]


if __name__ == "__main__":
    main()

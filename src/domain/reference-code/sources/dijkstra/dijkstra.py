"""AlgoViz reference implementation: Dijkstra.

Algorithm semantics and boundary behaviour are preserved.

Reading guide:
1. Initialise distances to infinity and the source to 0.
2. Repeatedly settle the unsettled vertex with the smallest tentative distance.
3. Relax its outgoing edges; a smaller candidate updates distance and predecessor.
4. Stop when the frontier is empty; previous pointers reconstruct the path.

Complexity: O(V^2) with a matrix, O((V + E) log V) with a binary heap; extra space
  O(V^2) for a matrix or O(V + E) for lists.
Convention: Non-negative weights only; 0-based vertices; unreachable distances stay
  infinity.
"""
# 中文导读：每次从未确定顶点中取出距离最小者，松弛它的非负权出边。
# 阅读顺序：先看优先队列的 (distance, vertex) 元组，再看已确定顶点的跳过，最后看 path_to 的回溯。
# 输入/输出：输入带非负权的邻接表与源点；返回最短距离表和前驱表。
# 不变量：已确定顶点的距离不再改变；堆中可能留有旧距离的过期条目。
# 易错点：负权边；把过期堆条目当成新候选；前驱表未在松弛时更新。
# 复杂度：O((V+E) log V)，额外空间 O(V+E)。

from __future__ import annotations

import heapq


# Settle the nearest unsettled vertex, then relax its outgoing non-negative edges.
# Purpose: Return (distances, previous); edge weights must be non-negative and graph is not modified.
# 作用：返回 (distances, previous)；要求边权非负，不修改 graph。
def dijkstra(
    graph: dict[str, list[tuple[str, int]]],
    source: str,
) -> tuple[dict[str, int | float], dict[str, str | None]]:
    distance: dict[str, int | float] = {vertex: float("inf") for vertex in graph}
    previous: dict[str, str | None] = {vertex: None for vertex in graph}
    settled: set[str] = set()
    # Both the source and every edge target must be registered vertices; otherwise distance[v] would raise KeyError mid-run.
    if source not in graph:
        raise ValueError("source vertex is not in the graph")
    for u, neighbours in graph.items():
        for v, weight in neighbours:
            if v not in graph:
                raise ValueError(f"edge target {v!r} is not a graph vertex")
            if weight < 0:
                raise ValueError("Dijkstra requires non-negative edge weights")
    # The source is the only finite initial distance; all other vertices start unknown at infinity.
    distance[source] = 0
    queue: list[tuple[int, str]] = [(0, source)]

    while queue:
        current_distance, u = heapq.heappop(queue)
        # Ignore stale heap entries: the same vertex may appear with an older, larger distance.
        # A vertex may be pushed several times; comparing the popped distance with the table discards older entries.
        if u in settled or current_distance != distance[u]:
            continue  # stale heap entry
        # Settling is final because every remaining candidate distance is at least this value.
        settled.add(u)

        for v, weight in graph.get(u, []):
            # A negative weight invalidates Dijkstra's finality argument, so the implementation rejects it explicitly.
            if weight < 0:
                raise ValueError("Dijkstra requires non-negative edge weights")
            candidate = current_distance + weight
            # Only a strictly smaller candidate updates distance and predecessor; ties keep the earlier path.
            if candidate < distance[v]:
                distance[v] = candidate
                previous[v] = u
                heapq.heappush(queue, (candidate, v))

    return distance, previous


# Purpose: Walk previous from target back to the source and return the path vertices.
# 作用：沿 previous 从 target 回溯到源点，返回路径顶点列表。
def path_to(previous: dict[str, str | None], target: str) -> list[str]:
    path: list[str] = []
    # An unknown target has no predecessor entry; fail explicitly rather than inventing a one-vertex path.
    if target not in previous:
        raise ValueError(f"target {target!r} is not a graph vertex")
    current: str | None = target
    # previous is None only at the source; a missing map entry would fail rather than invent a path.
    while current is not None:
        path.append(current)
        current = previous[current]
    return list(reversed(path))


# Purpose: Build a demo graph and print shortest distances and one path.
# 作用：构造演示图并打印最短距离与一条路径。
def main() -> None:
    graph = {
        "A": [("B", 4), ("C", 1)],
        "B": [("D", 1)],
        "C": [("B", 2), ("D", 5)],
        "D": [("E", 3)],
        "E": [("F", 1)],
        "F": [],
    }
    distance, previous = dijkstra(graph, "A")
    for vertex in sorted(graph):
        print(f"{vertex} distance={distance[vertex]}")
    print("path:", " ".join(path_to(previous, "F")))


if __name__ == "__main__":
    main()

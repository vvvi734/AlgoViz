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

from __future__ import annotations

INF = float("inf")


# V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.
# V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.
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

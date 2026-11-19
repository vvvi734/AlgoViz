"""AlgoViz reference implementation: Bellman-Ford.

Original code written for this repository under the MIT License.
Relaxes every edge V - 1 times; an extra successful relaxation means a
reachable negative cycle. Supports negative edges.
"""

from __future__ import annotations

INF = float("inf")


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

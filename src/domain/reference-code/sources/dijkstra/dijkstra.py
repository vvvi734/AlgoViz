"""AlgoViz reference implementation: Dijkstra.

Based on this project's tested Python teaching implementation, with
teaching-only tracing calls removed. Released under the MIT License.
Algorithm semantics and boundary behaviour are preserved.
"""

from __future__ import annotations

import heapq


def dijkstra(
    graph: dict[str, list[tuple[str, int]]],
    source: str,
) -> tuple[dict[str, int | float], dict[str, str | None]]:
    distance: dict[str, int | float] = {vertex: float("inf") for vertex in graph}
    previous: dict[str, str | None] = {vertex: None for vertex in graph}
    settled: set[str] = set()
    distance[source] = 0
    queue: list[tuple[int, str]] = [(0, source)]

    while queue:
        current_distance, u = heapq.heappop(queue)
        if u in settled or current_distance != distance[u]:
            continue  # stale heap entry
        settled.add(u)

        for v, weight in graph.get(u, []):
            if weight < 0:
                raise ValueError("Dijkstra requires non-negative edge weights")
            candidate = current_distance + weight
            if candidate < distance[v]:
                distance[v] = candidate
                previous[v] = u
                heapq.heappush(queue, (candidate, v))

    return distance, previous


def path_to(previous: dict[str, str | None], target: str) -> list[str]:
    path: list[str] = []
    current: str | None = target
    while current is not None:
        path.append(current)
        current = previous[current]
    return list(reversed(path))


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

"""AlgoViz reference implementation: breadth-first search.

Original code written for this repository under the MIT License.
Uses an adjacency list and collections.deque; visits vertices level by level.
"""

from __future__ import annotations

from collections import deque


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

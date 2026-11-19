"""AlgoViz reference implementation: topological sort (Kahn).

Original code written for this repository under the MIT License.
Repeatedly removes a vertex with in-degree zero; a remaining vertex means a cycle.
"""

from __future__ import annotations

from collections import deque


def main() -> None:
    edges = [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)]
    graph: list[list[int]] = [[] for _ in range(6)]
    indegree = [0] * 6
    for source, target in edges:
        graph[source].append(target)
        indegree[target] += 1

    ready = deque(vertex for vertex in range(6) if indegree[vertex] == 0)
    order: list[int] = []
    while ready:
        vertex = ready.popleft()
        order.append(vertex)
        for next_vertex in graph[vertex]:
            indegree[next_vertex] -= 1
            if indegree[next_vertex] == 0:
                ready.append(next_vertex)

    if len(order) != 6:
        print("cycle detected")
        return
    print("order:", order)
    assert order.index(5) < order.index(2) < order.index(3) < order.index(1)


if __name__ == "__main__":
    main()

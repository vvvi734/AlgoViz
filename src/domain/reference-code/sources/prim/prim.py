"""AlgoViz reference implementation: Prim's minimum spanning tree.

Original code written for this repository under the MIT License.
Grows one tree from vertex 0 using a heap of candidate edges.

Reading guide:
1. Start from one vertex and keep a visited/cut set.
2. Repeatedly choose the cheapest edge with exactly one endpoint inside the cut.
3. Add the outside endpoint, then update the candidate edges from the new vertex.
4. After V - 1 accepted edges a spanning tree is complete; fewer means the graph is
   disconnected.

Complexity: O(V^2) with dense scanning, O(E log V) with a heap; extra space O(V^2) for a
  matrix or O(V + E) for lists.
Convention: Undirected weighted graph; 0-based vertices; equal weights may produce
  different but valid MSTs.
"""

from __future__ import annotations

import heapq


def main() -> None:
    graph: list[list[tuple[int, int]]] = [[] for _ in range(5)]

    def add_edge(a: int, b: int, weight: int) -> None:
        graph[a].append((weight, b))
        graph[b].append((weight, a))

    add_edge(0, 1, 2)
    add_edge(0, 3, 6)
    add_edge(1, 2, 3)
    add_edge(1, 3, 8)
    add_edge(1, 4, 5)
    add_edge(2, 4, 7)
    add_edge(3, 4, 9)

    selected = [False] * 5
    candidates: list[tuple[int, int]] = [(0, 0)]
    total = 0
    edges: list[tuple[int, int]] = []

    print("mst edges:")
    while candidates:
        weight, vertex = heapq.heappop(candidates)
        if selected[vertex]:
            continue
        selected[vertex] = True
        total += weight
        if weight:
            edges.append((vertex, weight))
            print("edge to", vertex, ":", weight)
        for next_weight, next_vertex in graph[vertex]:
            if not selected[next_vertex]:
                heapq.heappush(candidates, (next_weight, next_vertex))

    print("total:", total)
    assert total == 16


if __name__ == "__main__":
    main()

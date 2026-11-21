"""AlgoViz reference implementation: topological sort (Kahn).

Repeatedly removes a vertex with in-degree zero; a remaining vertex means a cycle.

Reading guide:
1. Compute indegree for every vertex.
2. Enqueue all vertices with indegree zero.
3. Pop one vertex, append it to the order, and decrement each neighbour's indegree.
4. If fewer than V vertices are emitted, the graph contains a directed cycle.

Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra space
  O(V).
Convention: Kahn's algorithm; 0-based vertices; zero-indegree ties follow queue order.
"""

from __future__ import annotations

from collections import deque


# A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.
def main() -> None:
    edges = [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)]
    graph: list[list[int]] = [[] for _ in range(6)]
    indegree = [0] * 6
    for source, target in edges:
        graph[source].append(target)
        indegree[target] += 1

    ready = deque(vertex for vertex in range(6) if indegree[vertex] == 0)
    order: list[int] = []
    # Pop a zero-indegree vertex, append it, then decrement each neighbour's indegree.
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

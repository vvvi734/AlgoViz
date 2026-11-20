"""AlgoViz reference implementation: depth-first search.

Recursively follows one branch as far as possible before backtracking.

Reading guide:
1. Mark the current vertex on entry so cycles cannot revisit it.
2. Scan every possible neighbour (matrix row or adjacency list) and recurse into
   unvisited ones.
3. Emit the vertex in preorder when it is first visited.

Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra space
  O(V) marks plus O(h) recursion.
Convention: Vertices are 0-based; recursion depth can reach V on a path graph.
"""

from __future__ import annotations


# Mark on entry, then recurse into every unvisited neighbour before backtracking.
def dfs_visit(graph: list[list[int]], vertex: int, visited: list[bool], order: list[int]) -> None:
    visited[vertex] = True
    order.append(vertex)
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            dfs_visit(graph, neighbor, visited, order)


def dfs(graph: list[list[int]], start: int) -> list[int]:
    visited = [False] * len(graph)
    order: list[int] = []
    dfs_visit(graph, start, visited, order)
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

    print("order:", dfs(graph, 0))
    print("order:", dfs(graph, 3))
    assert dfs(graph, 0) == [0, 1, 3, 2, 4, 5]


if __name__ == "__main__":
    main()

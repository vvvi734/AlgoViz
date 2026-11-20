"""AlgoViz reference implementation: connected components.

Runs DFS from every unvisited vertex; one DFS tree is one component.

Reading guide:
1. Scan every vertex from 0 to V - 1.
2. Each unvisited vertex starts a new component and receives a fresh component id.
3. DFS marks all vertices reachable from that start; disconnected vertices form further
   components.

Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra space
  O(V).
Convention: Components are numbered in ascending order of their smallest vertex.
"""

from __future__ import annotations


def visit(graph: list[list[int]], vertex: int, visited: list[bool], component: list[int]) -> None:
    visited[vertex] = True
    component.append(vertex)
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            visit(graph, neighbor, visited, component)


# Every unvisited start opens a new component; one DFS marks all vertices reachable from it.
def count_components(graph: list[list[int]]) -> list[list[int]]:
    visited = [False] * len(graph)
    components: list[list[int]] = []
    for start in range(len(graph)):
        if not visited[start]:
            component: list[int] = []
            visit(graph, start, visited, component)
            components.append(component)
    return components


def main() -> None:
    graph: list[list[int]] = [[] for _ in range(7)]

    def add_edge(a: int, b: int) -> None:
        graph[a].append(b)
        graph[b].append(a)

    add_edge(0, 1)
    add_edge(1, 2)
    add_edge(3, 4)
    add_edge(5, 6)

    components = count_components(graph)
    for index, component in enumerate(components, start=1):
        print(f"component {index}:", component)
    print("total:", len(components))
    assert components == [[0, 1, 2], [3, 4], [5, 6]]


if __name__ == "__main__":
    main()

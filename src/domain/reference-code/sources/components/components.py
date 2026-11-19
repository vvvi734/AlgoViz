"""AlgoViz reference implementation: connected components.

Original code written for this repository under the MIT License.
Runs DFS from every unvisited vertex; one DFS tree is one component.
"""

from __future__ import annotations


def visit(graph: list[list[int]], vertex: int, visited: list[bool], component: list[int]) -> None:
    visited[vertex] = True
    component.append(vertex)
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            visit(graph, neighbor, visited, component)


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

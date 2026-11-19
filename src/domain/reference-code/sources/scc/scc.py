"""AlgoViz reference implementation: strongly connected components (Kosaraju).

Original code written for this repository under the MIT License.
First pass records finish order on the original graph; second pass walks
the reversed graph in reverse finish order. Each tree is one SCC.
"""

from __future__ import annotations


def first_pass(graph: list[list[int]], vertex: int, visited: list[bool], order: list[int]) -> None:
    visited[vertex] = True
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            first_pass(graph, neighbor, visited, order)
    order.append(vertex)


def collect(reverse_graph: list[list[int]], vertex: int, visited: list[bool], component: list[int]) -> None:
    visited[vertex] = True
    component.append(vertex)
    for neighbor in reverse_graph[vertex]:
        if not visited[neighbor]:
            collect(reverse_graph, neighbor, visited, component)


def main() -> None:
    edges = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 5), (5, 3)]
    graph: list[list[int]] = [[] for _ in range(6)]
    reverse_graph: list[list[int]] = [[] for _ in range(6)]
    for source, target in edges:
        graph[source].append(target)
        reverse_graph[target].append(source)

    visited = [False] * 6
    order: list[int] = []
    for vertex in range(6):
        if not visited[vertex]:
            first_pass(graph, vertex, visited, order)

    visited = [False] * 6
    components: list[list[int]] = []
    for vertex in reversed(order):
        if not visited[vertex]:
            component: list[int] = []
            collect(reverse_graph, vertex, visited, component)
            components.append(component)

    for index, component in enumerate(components, start=1):
        print(f"scc {index}:", component)
    print("total:", len(components))
    assert [sorted(component) for component in components] == [[0, 1, 2], [3, 4, 5]]


if __name__ == "__main__":
    main()

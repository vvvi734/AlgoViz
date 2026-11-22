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
# 中文导读：对每个未访问顶点启动一次 DFS，一次 DFS 标记出的顶点就是一个连通分量。
# 阅读顺序：先看外层扫描，再看 visit 的递归标记。
# 输入/输出：输入无向图邻接表；返回每个连通分量的顶点列表。
# 不变量：一次 visit 调用只进入同一连通分量；visited 一旦置位不再回退。
# 易错点：在外层重复访问已标记顶点；把有向图当无向图统计。
# 复杂度：O(V+E)，额外空间 O(V)。

from __future__ import annotations


# Purpose: Recursively mark vertex's whole connected component and append each vertex to component.
# 作用：从 vertex 递归标记整个连通分量，并追加到 component。
def visit(graph: list[list[int]], vertex: int, visited: list[bool], component: list[int]) -> None:
    visited[vertex] = True
    component.append(vertex)
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            visit(graph, neighbor, visited, component)


# The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.
# Purpose: Return the vertex lists of all connected components without modifying graph.
# 作用：返回所有连通分量的顶点列表；不修改 graph。
def count_components(graph: list[list[int]]) -> list[list[int]]:
    visited = [False] * len(graph)
    components: list[list[int]] = []
    for start in range(len(graph)):
        if not visited[start]:
            component: list[int] = []
            visit(graph, start, visited, component)
            components.append(component)
    return components


# Purpose: Build a demo graph with two components and print the result.
# 作用：构造含两个分量的演示图并打印结果。
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

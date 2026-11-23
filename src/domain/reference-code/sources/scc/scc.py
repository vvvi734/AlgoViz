"""AlgoViz reference implementation: strongly connected components (Kosaraju).

First pass records finish order on the original graph; second pass walks
the reversed graph in reverse finish order. Each tree is one SCC.

Reading guide:
1. First DFS on the original graph records vertices in finish order.
2. Build the reverse graph by flipping every directed edge.
3. Process vertices in reverse finish order; each DFS tree in the reverse graph is one
   SCC.

Complexity: O(V + E) for adjacency lists, O(V^2) for adjacency matrices; extra space
  O(V + E) for lists, O(V^2) for a matrix, plus O(V) recursion.
Convention: Directed graph with 0-based vertices; components are emitted in Kosaraju
  order.
"""
# 中文导读：Kosaraju 两遍 DFS：第一遍记录完成顺序，第二遍在反向图上按完成顺序逆序收集 SCC。
# 阅读顺序：先看 first_pass 的后序追加，再看 collect 在反向图上的标记。
# 输入/输出：输入有向图邻接表；返回每个强连通分量的顶点列表。
# 不变量：第一遍的 order 是完成顺序；第二遍从最后完成的顶点开始。
# 易错点：第二遍仍在原图上搜索；完成顺序未逆序使用。
# 复杂度：O(V+E)，额外空间 O(V+E)。

from __future__ import annotations


# First pass appends a vertex only after all its outgoing neighbours are finished.
# First pass appends a vertex only after all its outgoing neighbours are finished; the second pass reads this order backwards.
# Purpose: DFS on the original graph and append finished vertices to order.
# 作用：在原图上 DFS，把完成顶点追加到 order。
def first_pass(graph: list[list[int]], vertex: int, visited: list[bool], order: list[int]) -> None:
    # Mark on entry; a directed cycle would otherwise recurse through the same vertex indefinitely.
    visited[vertex] = True
    for neighbor in graph[vertex]:
        if not visited[neighbor]:
            first_pass(graph, neighbor, visited, order)
    # append after the neighbour loop stores finish order; this is the order that must be reversed for the second pass.
    order.append(vertex)


# Purpose: Collect one SCC from vertex on the reversed graph and append its vertices to component.
# 作用：在反向图上从 vertex 收集一个 SCC，并追加到 component。
def collect(reverse_graph: list[list[int]], vertex: int, visited: list[bool], component: list[int]) -> None:
    visited[vertex] = True
    component.append(vertex)
    for neighbor in reverse_graph[vertex]:
        if not visited[neighbor]:
            collect(reverse_graph, neighbor, visited, component)


# Purpose: Build a demo directed graph and print its SCCs.
# 作用：构造演示有向图并打印 SCC。
def main() -> None:
    edges = [(0, 1), (1, 2), (2, 0), (2, 3), (3, 4), (4, 5), (5, 3)]
    graph: list[list[int]] = [[] for _ in range(6)]
    reverse_graph: list[list[int]] = [[] for _ in range(6)]
    for source, target in edges:
        graph[source].append(target)
        # Reversing each edge while building the graph is what makes the second pass a transpose search.
        reverse_graph[target].append(source)

    # Rebinding a fresh list clears the first pass's marks; the second pass must not reuse the old visited list.
    visited = [False] * 6
    order: list[int] = []
    for vertex in range(6):
        if not visited[vertex]:
            first_pass(graph, vertex, visited, order)

    visited = [False] * 6
    components: list[list[int]] = []
    # reversed(order) yields finish order backwards; using order directly violates Kosaraju's source-component order.
    for vertex in reversed(order):
        if not visited[vertex]:
            component: list[int] = []
            # collect starts only at an unvisited vertex; every tree it builds is one strongly connected component.
            collect(reverse_graph, vertex, visited, component)
            components.append(component)

    for index, component in enumerate(components, start=1):
        print(f"scc {index}:", component)
    print("total:", len(components))
    assert [sorted(component) for component in components] == [[0, 1, 2], [3, 4, 5]]


if __name__ == "__main__":
    main()

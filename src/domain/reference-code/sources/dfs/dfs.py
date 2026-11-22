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
# 中文导读：递归实现深度优先搜索，进入顶点时标记，回溯后继续访问其他邻居。
# 阅读顺序：先看 dfs_visit 的进入标记，再看邻接表递归与回溯；本文件只从给定起点遍历一个分量。
# 输入/输出：输入邻接表与起点；返回 DFS 访问顺序。
# 不变量：递归栈中的顶点均已标记；每个顶点只被追加一次。
# 易错点：标记时机过晚；递归深度过大导致栈溢出。
# 复杂度：O(V+E)，额外空间 O(V)。

from __future__ import annotations


# visited and order are shared mutable objects, so recursive calls append to the same result.
def dfs_visit(graph: list[list[int]], vertex: int, visited: list[bool], order: list[int]) -> None:
    # Mark on entry; the mark must precede the neighbor loop so back edges see it.
    visited[vertex] = True
    # Append on entry gives preorder; the vertex precedes all descendants in the output.
    order.append(vertex)
    # Each neighbor is considered once, but recursion may run to the bottom before the next sibling.
    for neighbor in graph[vertex]:
        # Only unmarked neighbors recurse; marked ones are either ancestors or already finished branches.
        if not visited[neighbor]:
            # Recursive depth can reach V; Python's recursion limit is the practical constraint on long chains.
            dfs_visit(graph, neighbor, visited, order)


# The wrapper allocates marks and the result list; traversal itself stays in dfs_visit.
def dfs(graph: list[list[int]], start: int) -> list[int]:
    # One False per vertex; the list length is also the valid index boundary.
    visited = [False] * len(graph)
    # The result list is filled by recursion; the wrapper does not know the order in advance.
    order: list[int] = []
    # One call covers only the component containing start; other components are never touched.
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

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
# 中文导读：统计入度，把入度为 0 的顶点入队，逐个删边并降低后继入度。
# 阅读顺序：先看入度初始化，再看队列弹出和入度归零入队。
# 输入/输出：输入有向无环图；返回拓扑序；输出顶点数不足 V 说明有环。
# 不变量：队列中顶点入度均为 0；已输出顶点不再有未处理入边。
# 易错点：入度统计漏掉重边；有环时仍返回部分序列而不报错。
# 复杂度：O(V+E)，额外空间 O(V)。

from __future__ import annotations

from collections import deque


# A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.
# Purpose: Build a demo DAG and print its topological order.
# 作用：构造演示 DAG 并打印拓扑序。
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

"""AlgoViz reference implementation: Kruskal's minimum spanning tree.

Sorts all edges by weight and adds an edge only when its endpoints are
in different disjoint-set components.

Reading guide:
1. Sort all undirected edges by nondecreasing weight.
2. A disjoint-set structure tracks which vertices are already connected.
3. Accept an edge only when its endpoints are in different sets; union them afterwards.
4. Stop after V - 1 edges; a shorter result means the graph is disconnected.

Complexity: O(E log E) for sorting plus near-linear DSU work; extra space O(V +
  E).
Convention: Edges are (u, v, weight); 0-based vertices; equal weights may yield
  different valid MSTs.
"""
# 中文导读：按边权升序扫描，用并查集跳过会成环的边，选满 V-1 条边得到最小生成树。
# 阅读顺序：先看边的排序，再看 unite 如何判断两端是否已连通，最后看提前停止。
# 输入/输出：输入无向带权边 (u, v, weight)；输出选中的边和总权值。
# 不变量：已选边始终构成森林；加入一条边前两端必须属于不同集合。
# 易错点：忘记路径压缩/按秩合并；边数不足 V-1 仍当成功；有向边误用。
# 复杂度：O(E log E) 排序 + 近似 O(E α(V)) 并查集，空间 O(V+E)。

from __future__ import annotations


class DisjointSet:
    def __init__(self, size: int) -> None:
        # Each index is its own parent initially; a missing entry would make find fail before any edge is considered.
        self.parent = list(range(size))
        self.rank = [0] * size

    # Purpose: Return the root of vertex's set and apply path compression.
    # 作用：返回 vertex 所在集合的根，并做路径压缩。
    def find(self, vertex: int) -> int:
        # Path halving rewrites grandparent links while climbing; the returned vertex is the set representative.
        while self.parent[vertex] != vertex:
            self.parent[vertex] = self.parent[self.parent[vertex]]
            vertex = self.parent[vertex]
        return vertex

    # Union by rank keeps DSU trees shallow; a rejected edge would close a cycle.
    # Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.
    # Purpose: Union the sets containing a and b by rank; return False when they already match, otherwise merge and return True.
    # 作用：按秩合并 a、b 所在集合；已在同一集合返回 False，否则合并并返回 True。
    def unite(self, a: int, b: int) -> bool:
        root_a = self.find(a)
        root_b = self.find(b)
        # Equal roots mean a and b are already connected; accepting this edge would close a cycle.
        if root_a == root_b:
            return False
        if self.rank[root_a] < self.rank[root_b]:
            self.parent[root_a] = root_b
        elif self.rank[root_a] > self.rank[root_b]:
            self.parent[root_b] = root_a
        else:
            self.parent[root_b] = root_a
            self.rank[root_a] += 1
        return True


# Purpose: Build a demo graph, select edges with Kruskal, and print the total weight.
# 作用：构造演示图，按 Kruskal 选边并打印总权值。
def main() -> None:
    edges = [
        (0, 1, 2), (0, 3, 6), (1, 2, 3), (1, 3, 8),
        (1, 4, 5), (2, 4, 7), (3, 4, 9),
    ]
    sets = DisjointSet(5)
    total = 0
    used = 0

    print("mst edges:")
    # sorted is stable, but correctness does not depend on input order among equal weights; any valid MST is acceptable.
    for start, end, weight in sorted(edges, key=lambda edge: edge[2]):
        # Only a successful union adds an edge; a rejected edge already had both endpoints in one set.
        if sets.unite(start, end):
            print(f"{start} - {end} : {weight}")
            total += weight
            used += 1
            # 4 is V-1 for this five-vertex demo; a general implementation must use the actual vertex count.
            if used == 4:
                break

    print("total:", total)
    assert total == 16


if __name__ == "__main__":
    main()

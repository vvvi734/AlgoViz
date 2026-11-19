"""AlgoViz reference implementation: Kruskal's minimum spanning tree.

Original code written for this repository under the MIT License.
Sorts all edges by weight and adds an edge only when its endpoints are
in different disjoint-set components.
"""

from __future__ import annotations


class DisjointSet:
    def __init__(self, size: int) -> None:
        self.parent = list(range(size))
        self.rank = [0] * size

    def find(self, vertex: int) -> int:
        while self.parent[vertex] != vertex:
            self.parent[vertex] = self.parent[self.parent[vertex]]
            vertex = self.parent[vertex]
        return vertex

    def unite(self, a: int, b: int) -> bool:
        root_a = self.find(a)
        root_b = self.find(b)
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


def main() -> None:
    edges = [
        (0, 1, 2), (0, 3, 6), (1, 2, 3), (1, 3, 8),
        (1, 4, 5), (2, 4, 7), (3, 4, 9),
    ]
    sets = DisjointSet(5)
    total = 0
    used = 0

    print("mst edges:")
    for start, end, weight in sorted(edges, key=lambda edge: edge[2]):
        if sets.unite(start, end):
            print(f"{start} - {end} : {weight}")
            total += weight
            used += 1
            if used == 4:
                break

    print("total:", total)
    assert total == 16


if __name__ == "__main__":
    main()

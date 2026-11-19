// AlgoViz reference implementation: Kruskal's minimum spanning tree (C++17).
// Original code written for this repository under the MIT License.
// Sorts all edges by weight and adds an edge only when its endpoints are
// in different disjoint-set components.

#include <algorithm>
#include <iostream>
#include <vector>

struct Edge {
    int from;
    int to;
    int weight;
};

class DisjointSet {
 public:
    explicit DisjointSet(int size) : parent_(size), rank_(size, 0) {
        for (int i = 0; i < size; ++i) {
            parent_[i] = i;
        }
    }

    bool unite(int a, int b) {
        int root_a = find(a);
        int root_b = find(b);
        if (root_a == root_b) {
            return false;
        }
        if (rank_[root_a] < rank_[root_b]) {
            parent_[root_a] = root_b;
        } else if (rank_[root_a] > rank_[root_b]) {
            parent_[root_b] = root_a;
        } else {
            parent_[root_b] = root_a;
            ++rank_[root_a];
        }
        return true;
    }

 private:
    int find(int vertex) {
        while (parent_[vertex] != vertex) {
            parent_[vertex] = parent_[parent_[vertex]];
            vertex = parent_[vertex];
        }
        return vertex;
    }

    std::vector<int> parent_;
    std::vector<int> rank_;
};

int main() {
    std::vector<Edge> edges{
        {0, 1, 2}, {0, 3, 6}, {1, 2, 3}, {1, 3, 8},
        {1, 4, 5}, {2, 4, 7}, {3, 4, 9},
    };
    std::sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
        return a.weight < b.weight;
    });

    DisjointSet sets(5);
    int total = 0;
    int used = 0;
    std::cout << "mst edges:\n";
    for (const Edge& edge : edges) {
        if (sets.unite(edge.from, edge.to)) {
            std::cout << edge.from << " - " << edge.to << " : " << edge.weight << '\n';
            total += edge.weight;
            if (++used == 4) {
                break;
            }
        }
    }
    std::cout << "total: " << total << '\n';
    return 0;
}

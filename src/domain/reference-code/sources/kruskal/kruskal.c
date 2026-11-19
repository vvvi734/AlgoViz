/*
 * AlgoViz reference implementation: Kruskal's minimum spanning tree.
 * Original code written for this repository under the MIT License.
 * Sorts all edges by weight and adds an edge only when its endpoints are
 * in different disjoint-set components.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define VERTEX_COUNT 5
#define EDGE_COUNT 7

typedef struct {
    int from;
    int to;
    int weight;
} Edge;

int compare_edges(const void *left, const void *right) {
    const Edge *a = (const Edge *)left;
    const Edge *b = (const Edge *)right;
    return a->weight - b->weight;
}

int find_root(int parent[], int vertex) {
    while (parent[vertex] != vertex) {
        parent[vertex] = parent[parent[vertex]];
        vertex = parent[vertex];
    }
    return vertex;
}

bool unite(int parent[], int rank[], int a, int b) {
    int root_a = find_root(parent, a);
    int root_b = find_root(parent, b);
    if (root_a == root_b) {
        return false;
    }
    if (rank[root_a] < rank[root_b]) {
        parent[root_a] = root_b;
    } else if (rank[root_a] > rank[root_b]) {
        parent[root_b] = root_a;
    } else {
        parent[root_b] = root_a;
        ++rank[root_a];
    }
    return true;
}

int main(void) {
    Edge edges[EDGE_COUNT] = {
        {0, 1, 2}, {0, 3, 6}, {1, 2, 3}, {1, 3, 8},
        {1, 4, 5}, {2, 4, 7}, {3, 4, 9},
    };
    qsort(edges, EDGE_COUNT, sizeof(Edge), compare_edges);

    int parent[VERTEX_COUNT];
    int rank[VERTEX_COUNT] = {0};
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        parent[i] = i;
    }

    int total = 0;
    int used = 0;
    printf("mst edges:\n");
    for (int i = 0; i < EDGE_COUNT && used < VERTEX_COUNT - 1; ++i) {
        if (unite(parent, rank, edges[i].from, edges[i].to)) {
            printf("%d - %d : %d\n", edges[i].from, edges[i].to, edges[i].weight);
            total += edges[i].weight;
            ++used;
        }
    }
    printf("total: %d\n", total);
    return 0;
}

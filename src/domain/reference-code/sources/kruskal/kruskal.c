/*
 * Kruskal minimum spanning tree in C11.
 *
 * Sort all edges by weight, then scan them in ascending order. An edge joins the
 * tree only when its endpoints are in different components, tracked by a
 * union-find structure with path compression and union by rank. Stop after
 * V - 1 accepted edges. Sorting dominates: O(E log E).
 */

#include <stdio.h>
#include <stdlib.h>

#define VERTEX_COUNT 5
#define EDGE_COUNT 7

typedef struct {
    int from;
    int to;
    int weight;
} Edge;

static int CompareEdges(const void *left, const void *right)
{
    const Edge *a = (const Edge *)left;
    const Edge *b = (const Edge *)right;
    return a->weight - b->weight;
}

static int FindRoot(int parent[], int vertex)
{
    if (parent[vertex] != vertex) {
        parent[vertex] = FindRoot(parent, parent[vertex]);
    }
    return parent[vertex];
}

static int UnionRoots(int parent[], int rank[], int left, int right)
{
    int left_root = FindRoot(parent, left);
    int right_root = FindRoot(parent, right);
    if (left_root == right_root) {
        return 0;
    }
    if (rank[left_root] < rank[right_root]) {
        parent[left_root] = right_root;
    } else if (rank[left_root] > rank[right_root]) {
        parent[right_root] = left_root;
    } else {
        parent[right_root] = left_root;
        ++rank[left_root];
    }
    return 1;
}

// Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.
void Kruskal(Edge edges[], int edge_count)
{
    int parent[VERTEX_COUNT];
    int rank[VERTEX_COUNT] = {0};
    int total = 0;
    int accepted = 0;

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        parent[vertex] = vertex;
    }
    qsort(edges, (size_t)edge_count, sizeof(Edge), CompareEdges);

    printf("mst edges:\n");
    for (int index = 0; index < edge_count && accepted < VERTEX_COUNT - 1; ++index) {
        if (UnionRoots(parent, rank, edges[index].from, edges[index].to)) {
            printf("%d - %d: %d\n", edges[index].from, edges[index].to, edges[index].weight);
            total += edges[index].weight;
            ++accepted;
        }
    }
    printf("total: %d\n", total);
}

int main(void)
{
    Edge edges[EDGE_COUNT] = {
        {0, 1, 2},
        {0, 3, 6},
        {1, 2, 3},
        {1, 3, 8},
        {1, 4, 5},
        {2, 4, 7},
        {3, 4, 9},
    };

    Kruskal(edges, EDGE_COUNT);
    return 0;
}

/*
 * Prim minimum spanning tree in C11.
 *
 * Grow one tree from vertex 0. Key[v] is the lightest edge that would attach v
 * to the current tree; each round adds the unsettled vertex with the smallest
 * key, then relaxes its incident edges. Works on a connected undirected graph
 * with non-negative weights. O(V^2) with this adjacency matrix.
 */

#include <stdio.h>

#define VERTEX_COUNT 5
#define INF 1000000

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 2, 0, 6, 0},
    {2, 0, 3, 8, 5},
    {0, 3, 0, 0, 7},
    {6, 8, 0, 0, 9},
    {0, 5, 7, 9, 0},
};

// `key[v]` is the lightest edge from v to the current tree; `parent[v]` records the endpoint that supplied it.
void Prim(void)
{
    int key[VERTEX_COUNT];
    int parent[VERTEX_COUNT];
    int selected[VERTEX_COUNT] = {0};
    int total = 0;

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        key[vertex] = INF;
        parent[vertex] = -1;
    }
    key[0] = 0;

    printf("mst edges:\n");
    for (int round = 0; round < VERTEX_COUNT; ++round) {
        int best = -1;
        for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
            if (!selected[vertex] && (best == -1 || key[vertex] < key[best])) {
                best = vertex;
            }
        }
        if (best == -1 || key[best] == INF) {
            break;
        }
        selected[best] = 1;
        if (parent[best] != -1) {
            printf("%d - %d: %d\n", parent[best], best, key[best]);
            total += key[best];
        }
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (GRAPH[best][next] != 0 && !selected[next] && GRAPH[best][next] < key[next]) {
                key[next] = GRAPH[best][next];
                parent[next] = best;
            }
        }
    }
    printf("total: %d\n", total);
}

int main(void)
{
    Prim();
    return 0;
}

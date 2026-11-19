/*
 * AlgoViz reference implementation: Prim's minimum spanning tree.
 * Original code written for this repository under the MIT License.
 * Grows one tree from vertex 0 by repeatedly taking the lightest edge that
 * connects a tree vertex to a non-tree vertex.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 5
#define INF 1000000

void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b, int weight) {
    graph[a][b] = weight;
    graph[b][a] = weight;
}

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1, 2);
    add_edge(graph, 0, 3, 6);
    add_edge(graph, 1, 2, 3);
    add_edge(graph, 1, 3, 8);
    add_edge(graph, 1, 4, 5);
    add_edge(graph, 2, 4, 7);
    add_edge(graph, 3, 4, 9);

    int key[VERTEX_COUNT];
    int parent[VERTEX_COUNT];
    bool selected[VERTEX_COUNT] = {false};
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        key[i] = INF;
        parent[i] = -1;
    }
    key[0] = 0;

    int total = 0;
    printf("mst edges:\n");
    for (int step = 0; step < VERTEX_COUNT; ++step) {
        int best = -1;
        for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
            if (!selected[vertex] && (best == -1 || key[vertex] < key[best])) {
                best = vertex;
            }
        }
        selected[best] = true;
        if (parent[best] != -1) {
            printf("%d - %d : %d\n", parent[best], best, key[best]);
            total += key[best];
        }
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (graph[best][next] > 0 && !selected[next] && graph[best][next] < key[next]) {
                key[next] = graph[best][next];
                parent[next] = best;
            }
        }
    }
    printf("total: %d\n", total);
    return 0;
}

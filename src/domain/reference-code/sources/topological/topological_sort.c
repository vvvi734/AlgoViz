/*
 * AlgoViz reference implementation: topological sort (Kahn).
 * Original code written for this repository under the MIT License.
 * Repeatedly removes a vertex with in-degree zero; a remaining vertex means a cycle.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int indegree[VERTEX_COUNT] = {0};
    int edges[][2] = {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}};
    int edge_count = (int)(sizeof(edges) / sizeof(edges[0]));

    for (int i = 0; i < edge_count; ++i) {
        int from = edges[i][0];
        int to = edges[i][1];
        graph[from][to] = 1;
        ++indegree[to];
    }

    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        if (indegree[vertex] == 0) {
            queue[tail++] = vertex;
        }
    }

    int order[VERTEX_COUNT];
    int visited_count = 0;
    while (head < tail) {
        int vertex = queue[head++];
        order[visited_count++] = vertex;
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (graph[vertex][next]) {
                --indegree[next];
                if (indegree[next] == 0) {
                    queue[tail++] = next;
                }
            }
        }
    }

    if (visited_count != VERTEX_COUNT) {
        printf("cycle detected\n");
        return 0;
    }
    printf("order:");
    for (int i = 0; i < visited_count; ++i) {
        printf(" %d", order[i]);
    }
    printf("\n");
    return 0;
}

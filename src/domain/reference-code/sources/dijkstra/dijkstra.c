/*
 * AlgoViz reference implementation: Dijkstra (adjacency matrix).
 * Original code written for this repository under the MIT License.
 * This dense-graph variant follows the classic textbook O(V^2) selection
 * method; the algorithm semantics match the heap-based course version.
 */

#include <stdio.h>

#define MAX_V 6
#define INF 1000000000

void dijkstra(int vertex_count,
              int graph[MAX_V][MAX_V],
              int source,
              int distance[MAX_V],
              int previous[MAX_V],
              int settled[MAX_V]) {
    for (int i = 0; i < vertex_count; ++i) {
        distance[i] = INF;
        previous[i] = -1;
        settled[i] = 0;
    }
    distance[source] = 0;

    for (int round = 0; round < vertex_count; ++round) {
        int best = -1;
        for (int v = 0; v < vertex_count; ++v) {
            if (!settled[v] && distance[v] < INF &&
                (best == -1 || distance[v] < distance[best])) {
                best = v;
            }
        }
        if (best == -1) {
            break;
        }

        settled[best] = 1;
        for (int to = 0; to < vertex_count; ++to) {
            if (graph[best][to] == INF) {
                continue;
            }
            int candidate = distance[best] + graph[best][to];
            if (candidate < distance[to]) {
                distance[to] = candidate;
                previous[to] = best;
            }
        }
    }
}

void print_path(const int previous[MAX_V], int target, const char *names[MAX_V]) {
    int path[MAX_V];
    int count = 0;
    int current = target;
    while (current != -1 && count < MAX_V) {
        path[count++] = current;
        current = previous[current];
    }
    printf("path:");
    for (int i = count - 1; i >= 0; --i) {
        printf(" %s", names[path[i]]);
    }
    printf("\n");
}

int main(void) {
    int graph[MAX_V][MAX_V];
    for (int i = 0; i < MAX_V; ++i) {
        for (int j = 0; j < MAX_V; ++j) {
            graph[i][j] = (i == j) ? 0 : INF;
        }
    }

    /* A=0, B=1, C=2, D=3, E=4, F=5 */
    graph[0][1] = 4;
    graph[0][2] = 1;
    graph[2][1] = 2;
    graph[2][3] = 5;
    graph[1][3] = 1;
    graph[3][4] = 3;
    graph[4][5] = 1;

    int distance[MAX_V];
    int previous[MAX_V];
    int settled[MAX_V];
    dijkstra(MAX_V, graph, 0, distance, previous, settled);

    const char *names[MAX_V] = {"A", "B", "C", "D", "E", "F"};
    for (int i = 0; i < MAX_V; ++i) {
        printf("%s distance=%d\n", names[i], distance[i]);
    }
    print_path(previous, 5, names);
    return 0;
}

/*
 * Dijkstra shortest paths in C11.
 *
 * For non-negative edge weights, grow a settled set from the source. Each round
 * selects the unsettled vertex with the smallest tentative distance, relaxes its
 * outgoing edges, and records the predecessor used. The result is one
 * shortest-path tree from the source. O(V^2) with this adjacency matrix.
 */

#include <stdio.h>

#define VERTEX_COUNT 6
#define INF 1000000

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 7, 9, 0, 0, 14},
    {7, 0, 10, 15, 0, 0},
    {9, 10, 0, 11, 0, 2},
    {0, 15, 11, 0, 6, 0},
    {0, 0, 0, 6, 0, 9},
    {14, 0, 2, 0, 9, 0},
};

static void PrintPath(const int previous[], int vertex)
{
    int path[VERTEX_COUNT];
    int length = 0;
    for (int current = vertex; current != -1; current = previous[current]) {
        path[length++] = current;
    }
    for (int index = length - 1; index >= 0; --index) {
        printf("%d%s", path[index], index == 0 ? "" : " -> ");
    }
}

void Dijkstra(int source)
{
    int distance[VERTEX_COUNT];
    int previous[VERTEX_COUNT];
    int settled[VERTEX_COUNT] = {0};

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        distance[vertex] = INF;
        previous[vertex] = -1;
    }
    distance[source] = 0;

    for (int round = 0; round < VERTEX_COUNT; ++round) {
        int best = -1;
        for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
            if (!settled[vertex] && (best == -1 || distance[vertex] < distance[best])) {
                best = vertex;
            }
        }
        if (best == -1 || distance[best] == INF) {
            break;
        }
        settled[best] = 1;
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (GRAPH[best][next] != 0 && distance[best] + GRAPH[best][next] < distance[next]) {
                distance[next] = distance[best] + GRAPH[best][next];
                previous[next] = best;
            }
        }
    }

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        printf("0 -> %d: ", vertex);
        if (distance[vertex] == INF) {
            printf("unreachable\n");
        } else {
            printf("%d (", distance[vertex]);
            PrintPath(previous, vertex);
            printf(")\n");
        }
    }
}

int main(void)
{
    Dijkstra(0);
    return 0;
}

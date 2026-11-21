/*
 * Floyd-Warshall all-pairs shortest paths in C11.
 *
 * Start from the weighted adjacency matrix, with INF where no edge exists and 0
 * on the diagonal. For every intermediate vertex k, relax dist[i][j] through k.
 * The k loop must stay outermost so each round uses paths whose intermediate
 * vertices are already allowed. Time O(V^3), space O(V^2).
 */

#include <stdio.h>

#define VERTEX_COUNT 4
#define INF 1000000

// The outer loop must be the intermediate vertex k; relaxing k before it is allowed would use incomplete paths.
void FloydWarshall(int distance[VERTEX_COUNT][VERTEX_COUNT])
{
    for (int middle = 0; middle < VERTEX_COUNT; ++middle) {
        for (int from = 0; from < VERTEX_COUNT; ++from) {
            for (int to = 0; to < VERTEX_COUNT; ++to) {
                if (distance[from][middle] != INF && distance[middle][to] != INF &&
                    distance[from][middle] + distance[middle][to] < distance[from][to]) {
                    distance[from][to] = distance[from][middle] + distance[middle][to];
                }
            }
        }
    }
}

int main(void)
{
    int distance[VERTEX_COUNT][VERTEX_COUNT] = {
        {0, 5, INF, 10},
        {INF, 0, 3, INF},
        {INF, INF, 0, 1},
        {INF, INF, INF, 0},
    };

    FloydWarshall(distance);
    printf("all-pairs shortest distances:\n");
    for (int from = 0; from < VERTEX_COUNT; ++from) {
        for (int to = 0; to < VERTEX_COUNT; ++to) {
            if (distance[from][to] == INF) {
                printf(" INF");
            } else {
                printf(" %3d", distance[from][to]);
            }
        }
        printf("\n");
    }
    return 0;
}

/*
 * AlgoViz reference implementation: Floyd-Warshall.
 * Original code written for this repository under the MIT License.
 * Dynamic programming over allowed intermediate vertices; handles negative
 * edges but not negative cycles. dist[i][j] is the shortest i -> j distance.
 */

#include <stdio.h>

#define VERTEX_COUNT 4
#define INF 1000000

void floyd_warshall(int dist[VERTEX_COUNT][VERTEX_COUNT]) {
    for (int middle = 0; middle < VERTEX_COUNT; ++middle) {
        for (int from = 0; from < VERTEX_COUNT; ++from) {
            if (dist[from][middle] == INF) {
                continue;
            }
            for (int to = 0; to < VERTEX_COUNT; ++to) {
                if (dist[middle][to] == INF) {
                    continue;
                }
                int candidate = dist[from][middle] + dist[middle][to];
                if (candidate < dist[from][to]) {
                    dist[from][to] = candidate;
                }
            }
        }
    }
}

int main(void) {
    int dist[VERTEX_COUNT][VERTEX_COUNT] = {
        {0, 3, INF, 7},
        {8, 0, 2, INF},
        {5, INF, 0, 1},
        {2, INF, INF, 0},
    };

    floyd_warshall(dist);

    printf("distances:\n");
    for (int from = 0; from < VERTEX_COUNT; ++from) {
        for (int to = 0; to < VERTEX_COUNT; ++to) {
            if (dist[from][to] == INF) {
                printf("INF ");
            } else {
                printf("%d ", dist[from][to]);
            }
        }
        printf("\n");
    }
    return 0;
}

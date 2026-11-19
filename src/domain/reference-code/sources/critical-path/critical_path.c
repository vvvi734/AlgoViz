/*
 * AlgoViz reference implementation: critical path on an AOE network.
 * Original code written for this repository under the MIT License.
 * A forward topological pass computes earliest start times; a reverse pass
 * computes latest times. An activity is critical when its slack is zero.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6
#define INF 1000000

int main(void) {
    int weight[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int edges[][2] = {{0, 1}, {0, 2}, {1, 2}, {1, 3}, {2, 3}, {2, 4}, {3, 5}, {4, 5}};
    int weights[] = {3, 2, 1, 2, 1, 3, 2, 1};
    int edge_count = (int)(sizeof(weights) / sizeof(weights[0]));
    int indegree[VERTEX_COUNT] = {0};

    for (int i = 0; i < edge_count; ++i) {
        int from = edges[i][0];
        int to = edges[i][1];
        weight[from][to] = weights[i];
        ++indegree[to];
    }

    int earliest[VERTEX_COUNT] = {0};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        if (indegree[vertex] == 0) {
            queue[tail++] = vertex;
        }
    }

    int order[VERTEX_COUNT];
    int order_count = 0;
    while (head < tail) {
        int vertex = queue[head++];
        order[order_count++] = vertex;
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (weight[vertex][next] > 0) {
                int candidate = earliest[vertex] + weight[vertex][next];
                if (candidate > earliest[next]) {
                    earliest[next] = candidate;
                }
                if (--indegree[next] == 0) {
                    queue[tail++] = next;
                }
            }
        }
    }

    int latest[VERTEX_COUNT];
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        latest[i] = earliest[VERTEX_COUNT - 1];
    }
    for (int i = order_count - 1; i >= 0; --i) {
        int vertex = order[i];
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (weight[vertex][next] > 0) {
                int candidate = latest[next] - weight[vertex][next];
                if (candidate < latest[vertex]) {
                    latest[vertex] = candidate;
                }
            }
        }
    }

    printf("earliest:");
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        printf(" %d", earliest[i]);
    }
    printf("\nlatest:");
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        printf(" %d", latest[i]);
    }
    printf("\nduration: %d\n", earliest[VERTEX_COUNT - 1]);

    printf("critical edges:\n");
    for (int i = 0; i < edge_count; ++i) {
        int from = edges[i][0];
        int to = edges[i][1];
        if (earliest[from] == latest[from] && earliest[to] == latest[to] &&
            latest[to] - earliest[from] == weights[i]) {
            printf("%d -> %d : %d\n", from, to, weights[i]);
        }
    }
    return 0;
}

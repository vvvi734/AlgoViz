/*
 * AlgoViz reference implementation: Bellman-Ford.
 * Relaxes every edge V - 1 times; an extra successful relaxation means a
 * reachable negative cycle. Supports negative edges.
 *
 * Reading guide:
 * 1. Initialise all distances to infinity and the source to 0.
 * 2. Relax every directed edge V - 1 times; each pass extends paths by at most one
 *    edge.
 * 3. Stop early when a full pass makes no change.
 * 4. One extra pass that still relaxes an edge proves a reachable negative cycle.
 *
 * Complexity: O(V * E); extra space O(V) for distances and predecessors.
 * Convention: Edges are (u, v, weight) with 0-based endpoints; returns None/null on
 *   a negative cycle.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 5
#define EDGE_COUNT 10
#define INF 1000000

typedef struct {
    int from;
    int to;
    int weight;
} Edge;

// V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.
bool bellman_ford(int vertex_count, const Edge edges[], int edge_count, int source, int dist[]) {
    for (int i = 0; i < vertex_count; ++i) {
        dist[i] = INF;
    }
    dist[source] = 0;

    for (int round = 0; round < vertex_count - 1; ++round) {
        bool changed = false;
        for (int i = 0; i < edge_count; ++i) {
            const Edge *edge = &edges[i];
            if (dist[edge->from] == INF) {
                continue;
            }
            int candidate = dist[edge->from] + edge->weight;
            if (candidate < dist[edge->to]) {
                dist[edge->to] = candidate;
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }

    for (int i = 0; i < edge_count; ++i) {
        const Edge *edge = &edges[i];
        if (dist[edge->from] != INF && dist[edge->from] + edge->weight < dist[edge->to]) {
            return false;
        }
    }
    return true;
}

int main(void) {
    Edge edges[EDGE_COUNT] = {
        {0, 1, 6}, {0, 2, 7}, {1, 2, 8}, {1, 3, 5}, {1, 4, -4},
        {2, 3, -3}, {2, 4, 9}, {3, 1, -2}, {4, 0, 2}, {4, 3, 7},
    };
    int dist[VERTEX_COUNT];

    if (!bellman_ford(VERTEX_COUNT, edges, EDGE_COUNT, 0, dist)) {
        printf("negative cycle\n");
        return 0;
    }
    printf("distances:");
    for (int i = 0; i < VERTEX_COUNT; ++i) {
        if (dist[i] == INF) {
            printf(" INF");
        } else {
            printf(" %d", dist[i]);
        }
    }
    printf("\n");
    return 0;
}

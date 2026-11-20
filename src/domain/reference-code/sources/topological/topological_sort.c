/*
 * Kahn topological sort in C11.
 *
 * Compute each vertex's indegree. Vertices with indegree 0 enter a FIFO queue;
 * removing a vertex appends its neighbours whose last incoming edge disappears.
 * If the queue drains before all vertices are emitted, the graph contains a
 * directed cycle. Time O(V + E) with the adjacency matrix used below (O(V^2)),
 * space O(V).
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0},
    {0, 0, 0, 1, 0, 0},
    {0, 0, 0, 1, 0, 0},
    {0, 0, 0, 0, 1, 1},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
};

int TopologicalSort(int order[])
{
    int indegree[VERTEX_COUNT] = {0};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;
    int emitted = 0;

    for (int from = 0; from < VERTEX_COUNT; ++from) {
        for (int to = 0; to < VERTEX_COUNT; ++to) {
            if (GRAPH[from][to] != 0) {
                ++indegree[to];
            }
        }
    }
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        if (indegree[vertex] == 0) {
            queue[tail++] = vertex;
        }
    }

    while (head < tail) {
        int vertex = queue[head++];
        order[emitted++] = vertex;
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (GRAPH[vertex][next] != 0) {
                --indegree[next];
                if (indegree[next] == 0) {
                    queue[tail++] = next;
                }
            }
        }
    }

    return emitted;
}

int main(void)
{
    int order[VERTEX_COUNT];
    int count = TopologicalSort(order);

    if (count < VERTEX_COUNT) {
        printf("cycle detected\n");
        return 0;
    }
    printf("topological order:");
    for (int index = 0; index < count; ++index) {
        printf(" %d", order[index]);
    }
    printf("\n");
    return 0;
}

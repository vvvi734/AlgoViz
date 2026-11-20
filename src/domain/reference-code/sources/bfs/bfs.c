/*
 * Breadth-first search in C11.
 *
 * Visit the start vertex, then every unvisited neighbour in increasing vertex
 * order, using a FIFO queue. A vertex is marked when it enters the queue, so it
 * is never enqueued twice. Time O(V + E) for an adjacency matrix, O(V^2) here.
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 0, 0},
    {1, 0, 0, 1, 0, 0},
    {0, 1, 1, 0, 1, 1},
    {0, 0, 0, 1, 0, 0},
    {0, 0, 0, 1, 0, 0},
};

void BFS(int start)
{
    int visited[VERTEX_COUNT] = {0};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;

    visited[start] = 1;
    queue[tail++] = start;

    printf("bfs:");
    while (head < tail) {
        int vertex = queue[head++];
        printf(" %d", vertex);
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (GRAPH[vertex][next] != 0 && !visited[next]) {
                visited[next] = 1;
                queue[tail++] = next;
            }
        }
    }
    printf("\n");
}

int main(void)
{
    BFS(0);
    return 0;
}

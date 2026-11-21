/*
 * Depth-first search in C11.
 *
 * Enter a vertex, mark it, print it, then recurse into each unvisited neighbour
 * in increasing vertex order. The recursion stack holds one frame per vertex on
 * the current path. Time O(V^2) with this adjacency matrix, space O(V).
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

// Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.
static void Visit(int vertex, int visited[VERTEX_COUNT])
{
    visited[vertex] = 1;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next) {
        if (GRAPH[vertex][next] != 0 && !visited[next]) {
            Visit(next, visited);
        }
    }
}

void DFS(int start)
{
    int visited[VERTEX_COUNT] = {0};
    printf("dfs:");
    Visit(start, visited);
    printf("\n");
}

int main(void)
{
    DFS(0);
    return 0;
}

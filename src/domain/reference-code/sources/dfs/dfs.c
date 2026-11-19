/*
 * AlgoViz reference implementation: depth-first search.
 * Original code written for this repository under the MIT License.
 * Recursively follows one branch as far as possible before backtracking.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6

void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b) {
    graph[a][b] = 1;
    graph[b][a] = 1;
}

void dfs_visit(const int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT]) {
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next) {
        if (graph[vertex][next] && !visited[next]) {
            dfs_visit(graph, next, visited);
        }
    }
}

void dfs(const int graph[VERTEX_COUNT][VERTEX_COUNT], int start) {
    bool visited[VERTEX_COUNT] = {false};
    printf("order:");
    dfs_visit(graph, start, visited);
    printf("\n");
}

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1);
    add_edge(graph, 0, 2);
    add_edge(graph, 1, 3);
    add_edge(graph, 2, 4);
    add_edge(graph, 4, 5);

    dfs(graph, 0);
    dfs(graph, 3);
    return 0;
}

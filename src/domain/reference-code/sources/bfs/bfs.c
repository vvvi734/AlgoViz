/*
 * AlgoViz reference implementation: breadth-first search.
 * Original code written for this repository under the MIT License.
 * Uses an adjacency matrix and a FIFO queue; visits vertices level by level.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6

void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b) {
    graph[a][b] = 1;
    graph[b][a] = 1;
}

void bfs(const int graph[VERTEX_COUNT][VERTEX_COUNT], int start) {
    bool visited[VERTEX_COUNT] = {false};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;

    visited[start] = true;
    queue[tail++] = start;
    printf("order:");

    while (head < tail) {
        int vertex = queue[head++];
        printf(" %d", vertex);
        for (int next = 0; next < VERTEX_COUNT; ++next) {
            if (graph[vertex][next] && !visited[next]) {
                visited[next] = true;
                queue[tail++] = next;
            }
        }
    }
    printf("\n");
}

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1);
    add_edge(graph, 0, 2);
    add_edge(graph, 1, 3);
    add_edge(graph, 2, 4);
    add_edge(graph, 4, 5);

    bfs(graph, 0);
    bfs(graph, 3);
    return 0;
}

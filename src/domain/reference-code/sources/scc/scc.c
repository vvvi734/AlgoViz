/*
 * AlgoViz reference implementation: strongly connected components (Kosaraju).
 * Original code written for this repository under the MIT License.
 * First pass records finish order on the original graph; second pass walks
 * the reversed graph in reverse finish order. Each tree is one SCC.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6

void first_pass(const int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT], int order[VERTEX_COUNT], int *position) {
    visited[vertex] = true;
    for (int next = 0; next < VERTEX_COUNT; ++next) {
        if (graph[vertex][next] && !visited[next]) {
            first_pass(graph, next, visited, order, position);
        }
    }
    order[(*position)++] = vertex;
}

void collect(const int reverse_graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT]) {
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next) {
        if (reverse_graph[vertex][next] && !visited[next]) {
            collect(reverse_graph, next, visited);
        }
    }
}

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int reverse_graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int edges[][2] = {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}, {4, 5}, {5, 3}};
    int edge_count = (int)(sizeof(edges) / sizeof(edges[0]));

    for (int i = 0; i < edge_count; ++i) {
        int from = edges[i][0];
        int to = edges[i][1];
        graph[from][to] = 1;
        reverse_graph[to][from] = 1;
    }

    bool visited[VERTEX_COUNT] = {false};
    int order[VERTEX_COUNT];
    int position = 0;
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex) {
        if (!visited[vertex]) {
            first_pass(graph, vertex, visited, order, &position);
        }
    }

    for (int i = 0; i < VERTEX_COUNT; ++i) {
        visited[i] = false;
    }
    int components = 0;
    for (int i = VERTEX_COUNT - 1; i >= 0; --i) {
        int vertex = order[i];
        if (!visited[vertex]) {
            ++components;
            printf("scc %d:", components);
            collect(reverse_graph, vertex, visited);
            printf("\n");
        }
    }
    printf("total: %d\n", components);
    return 0;
}

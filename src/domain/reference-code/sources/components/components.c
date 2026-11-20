/*
 * 教材素材说明
 * 用户提供的《数据结构与算法（Windows版）》未包含本算法的对应实现。
 * 本文件保留 AlgoViz 原创 C 实现与现有注释，未冒充教材原文。
 */

/*
 * AlgoViz reference implementation: connected components.
 * Original code written for this repository under the MIT License.
 * Runs DFS from every unvisited vertex; one DFS tree is one component.
 *
 * Reading guide:
 * 1. Scan every vertex from 0 to V - 1.
 * 2. Each unvisited vertex starts a new component and receives a fresh component id.
 * 3. DFS marks all vertices reachable from that start; disconnected vertices form
 *    further components.
 *
 * Complexity: O(V + E) for adjacency lists, O(V^2) for an adjacency matrix; extra
 *   space O(V).
 * Convention: Components are numbered in ascending order of their smallest vertex.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 7

void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b) {
    graph[a][b] = 1;
    graph[b][a] = 1;
}

void visit(const int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT]) {
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next) {
        if (graph[vertex][next] && !visited[next]) {
            visit(graph, next, visited);
        }
    }
}

// Every unvisited start opens a new component; one DFS marks all vertices reachable from it.
int count_components(const int graph[VERTEX_COUNT][VERTEX_COUNT]) {
    bool visited[VERTEX_COUNT] = {false};
    int components = 0;
    for (int start = 0; start < VERTEX_COUNT; ++start) {
        if (!visited[start]) {
            ++components;
            printf("component %d:", components);
            visit(graph, start, visited);
            printf("\n");
        }
    }
    return components;
}

int main(void) {
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1);
    add_edge(graph, 1, 2);
    add_edge(graph, 3, 4);
    add_edge(graph, 5, 6);

    printf("total: %d\n", count_components(graph));
    return 0;
}

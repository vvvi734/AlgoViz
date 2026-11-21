/*
 * 中文导读：在有向图中找出互相可达的极大结点集合；本文件用两遍 DFS/Kosaraju 或等价方法。
 * 阅读顺序：先看第一遍 DFS 的完成顺序；再看反向图；最后看第二遍按逆完成顺序收集分量。
 * 关键不变量：第一遍完成时间最晚的结点属于源分量；在反向图上从它出发只能到达同一强连通分量。
 * 易错点：忘记反向图；完成顺序存成进入顺序；递归深度溢出；把弱连通分量当强连通。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 * 输入/输出：输入有向图邻接表；返回每个强连通分量的顶点集合；main 打印 SCC。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * AlgoViz reference implementation: strongly connected components (Kosaraju).
 * First pass records finish order on the original graph; second pass walks
 * the reversed graph in reverse finish order. Each tree is one SCC.
 *
 * Reading guide:
 * 1. First DFS on the original graph records vertices in finish order.
 * 2. Build the reverse graph by flipping every directed edge.
 * 3. Process vertices in reverse finish order; each DFS tree in the reverse graph is
 *    one SCC.
 *
 * Complexity: O(V + E) for adjacency lists, O(V^2) for adjacency matrices; extra
 *   space O(V + E) for lists, O(V^2) for a matrix, plus O(V) recursion.
 * Convention: Directed graph with 0-based vertices; components are emitted in
 *   Kosaraju order.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 6

// First pass appends a vertex only after all its outgoing neighbours are finished.
// First pass records finish order; the reverse graph is then explored in decreasing finish order to isolate SCCs.
// Purpose: First DFS pass: record each finish time while position increases, producing the reverse finish order.
// 作用：第一遍 DFS：记录每个结点的完成时间；position 递增，最后得到逆完成顺序。
void first_pass(int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT],
                int order[VERTEX_COUNT], int *position)
{
    visited[vertex] = true;
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        if (graph[vertex][next] && !visited[next])
        {
            first_pass(graph, next, visited, order, position);
        }
    }
    order[(*position)++] = vertex;
}

// Purpose: Collect one SCC from vertex on the reversed graph, expanding only through unvisited vertices.
// 作用：在反向图上从 vertex 出发收集同一强连通分量；只沿未访问结点扩散。
void collect(int reverse_graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT])
{
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        if (reverse_graph[vertex][next] && !visited[next])
        {
            collect(reverse_graph, next, visited);
        }
    }
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int reverse_graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    int edges[][2] = {{0, 1}, {1, 2}, {2, 0}, {2, 3}, {3, 4}, {4, 5}, {5, 3}};
    int edge_count = (int)(sizeof(edges) / sizeof(edges[0]));

    for (int i = 0; i < edge_count; ++i)
    {
        int from = edges[i][0];
        int to = edges[i][1];
        graph[from][to] = 1;
        reverse_graph[to][from] = 1;
    }

    bool visited[VERTEX_COUNT] = {false};
    int order[VERTEX_COUNT];
    int position = 0;
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        if (!visited[vertex])
        {
            first_pass(graph, vertex, visited, order, &position);
        }
    }

    for (int i = 0; i < VERTEX_COUNT; ++i)
    {
        visited[i] = false;
    }
    int components = 0;
    for (int i = VERTEX_COUNT - 1; i >= 0; --i)
    {
        int vertex = order[i];
        if (!visited[vertex])
        {
            ++components;
            printf("scc %d:", components);
            collect(reverse_graph, vertex, visited);
            printf("\n");
        }
    }
    printf("total: %d\n", components);
    return 0;
}

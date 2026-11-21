/*
 * 中文导读：对每个未访问结点启动一次遍历，给同一连通块的所有结点相同编号。
 * 阅读顺序：先看 visited/component 数组；再看外层为什么遍历所有结点；最后看内层 DFS/BFS 如何扩散。
 * 关键不变量：一次内层遍历访问到的结点恰好属于同一个连通分量；外层保证不遗漏任何分量。
 * 易错点：只从 0 号点开始；把有向图弱连通当成强连通；visited 标记时机不一致。
 * 复杂度：O(V+E) 时间，O(V) 额外空间。
 * 输入/输出：输入无向图邻接表；返回每个连通分量的顶点集合；main 打印全部分量。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * AlgoViz reference implementation: connected components.
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

// Purpose: Write both a→b and b→a in the undirected adjacency matrix so neither direction is missed.
// 作用：在无向邻接矩阵中同时写入 a→b 与 b→a，避免只连一个方向。
void add_edge(int graph[VERTEX_COUNT][VERTEX_COUNT], int a, int b)
{
    graph[a][b] = 1;
    graph[b][a] = 1;
}

// Purpose: DFS from vertex, marking every vertex in the same connected component as visited.
// 作用：从 vertex 出发 DFS，把同一连通分量中的所有结点标记为已访问。
void visit(int graph[VERTEX_COUNT][VERTEX_COUNT], int vertex, bool visited[VERTEX_COUNT])
{
    visited[vertex] = true;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        if (graph[vertex][next] && !visited[next])
        {
            visit(graph, next, visited);
        }
    }
}

// Every unvisited start opens a new component; one DFS marks all vertices reachable from it.
// The outer scan opens a new component only at an unvisited vertex; one DFS marks its whole component.
// Purpose: Scan all unvisited vertices; each new DFS start yields one connected component.
// 作用：扫描所有未访问结点，每启动一次 DFS 就得到一个连通分量。
int count_components(int graph[VERTEX_COUNT][VERTEX_COUNT])
{
    bool visited[VERTEX_COUNT] = {false};
    int components = 0;
    for (int start = 0; start < VERTEX_COUNT; ++start)
    {
        if (!visited[start])
        {
            ++components;
            printf("component %d:", components);
            visit(graph, start, visited);
            printf("\n");
        }
    }
    return components;
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int graph[VERTEX_COUNT][VERTEX_COUNT] = {{0}};
    add_edge(graph, 0, 1);
    add_edge(graph, 1, 2);
    add_edge(graph, 3, 4);
    add_edge(graph, 5, 6);

    printf("total: %d\n", count_components(graph));
    return 0;
}

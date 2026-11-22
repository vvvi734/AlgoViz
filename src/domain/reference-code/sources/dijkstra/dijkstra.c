/*
 * 中文导读：每次从未确定集合中取当前距离最小的结点，并用它松弛出边。
 * 阅读顺序：先看 dist/visited 初始化；再看待确定集合的最小值；最后看为什么一旦确定就不再改。
 * 关键不变量：已确定结点的 dist 是最终最短路；候选 dist 是经过已确定结点的一条路径长度。
 * 易错点：负权边下使用 Dijkstra；忘记跳过已确定点；多重边没有取最小；INF 溢出。
 * 复杂度：邻接矩阵 O(V²)，二叉堆 O((V+E)log V)；辅助空间 O(V)，矩阵本身 O(V²)。
 * 输入/输出：输入非负权邻接矩阵与源点；函数计算并打印最短距离和一条前驱路径，不返回结果数组。
*/

/*
 * Dijkstra shortest paths in C11.
 *
 * For non-negative edge weights, grow a settled set from the source. Each round
 * selects the unsettled vertex with the smallest tentative distance, relaxes its
 * outgoing edges, and records the predecessor used. The result is one
 * shortest-path tree from the source. O(V^2) with this adjacency matrix.
 */

#include <stdio.h>

#define VERTEX_COUNT 6
#define INF 1000000

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 7, 9, 0, 0, 14},  {7, 0, 10, 15, 0, 0}, {9, 10, 0, 11, 0, 2},
    {0, 15, 11, 0, 6, 0}, {0, 0, 0, 6, 0, 9},   {14, 0, 2, 0, 9, 0},
};

// Purpose: Walk previous[] backward to collect the path, then print it in source-to-target order; read-only.
// 作用：沿 previous[] 反向收集路径，再按源点到目标点的顺序打印；只读。
static void PrintPath(const int previous[], int vertex)
{
    int path[VERTEX_COUNT];
    int length = 0;
    for (int current = vertex; current != -1; current = previous[current])
    {
        path[length++] = current;
    }
    for (int index = length - 1; index >= 0; --index)
    {
        printf("%d%s", path[index], index == 0 ? "" : " -> ");
    }
}

// Purpose: Select the unsettled vertex with the smallest dist, relax its outgoing edges, and never change a settled distance again.
// 作用：每次选未确定结点中 dist 最小者，松弛其出边；已确定结点的距离不再改变。
void Dijkstra(int source)
{
    int distance[VERTEX_COUNT];
    int previous[VERTEX_COUNT];
    int settled[VERTEX_COUNT] = {0};

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        distance[vertex] = INF;
        previous[vertex] = -1;
    }
    distance[source] = 0;

    for (int round = 0; round < VERTEX_COUNT; ++round)
    {
        // This linear scan is why the matrix implementation costs O(V^2); a heap would avoid rescanning all vertices.
        int best = -1;
        for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
        {
            if (!settled[vertex] && (best == -1 || distance[vertex] < distance[best]))
            {
                best = vertex;
            }
        }
        if (best == -1 || distance[best] == INF)
        {
            break;
        }
        // best has the smallest tentative distance; with non-negative weights this value is final.
        settled[best] = 1;
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            // A zero matrix entry means no edge, not a zero-cost edge.
            if (GRAPH[best][next] != 0 && distance[best] + GRAPH[best][next] < distance[next])
            {
                distance[next] = distance[best] + GRAPH[best][next];
                previous[next] = best;
            }
        }
    }

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        printf("0 -> %d: ", vertex);
        if (distance[vertex] == INF)
        {
            printf("unreachable\n");
        }
        else
        {
            printf("%d (", distance[vertex]);
            PrintPath(previous, vertex);
            printf(")\n");
        }
    }
}

int main(void)
{
    Dijkstra(0);
    return 0;
}

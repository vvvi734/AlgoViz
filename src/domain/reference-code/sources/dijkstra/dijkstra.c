/*
 * 中文导读：每次从未确定集合中取当前距离最小的结点，并用它松弛出边。
 * 阅读顺序：先看 dist/visited 初始化；再看待确定集合的最小值；最后看为什么一旦确定就不再改。
 * 关键不变量：已确定结点的 dist 是最终最短路；候选 dist 是经过已确定结点的一条路径长度。
 * 易错点：负权边下使用 Dijkstra；忘记跳过已确定点；多重边没有取最小；INF 溢出。
 * 复杂度：邻接矩阵 O(V²)，二叉堆 O((V+E)log V)，空间 O(V+E)。
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

// 作用：递归回溯 previous[]，打印 source 到 vertex 的路径；只读。
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    Dijkstra(0);
    return 0;
}

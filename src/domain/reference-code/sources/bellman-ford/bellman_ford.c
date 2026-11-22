/*
 * 中文导读：允许负权边，通过反复松弛所有边求最短路径，并能检测从源点可达的负环。
 * 阅读顺序：先看 dist[] 的初始化；再看外层为什么跑 V-1 轮；最后看第 V 轮仍能松弛说明了什么。
 * 关键不变量：第 k 轮结束后，dist[v] 已经不超过“最多用 k 条边”的最短路径长度。
 * 易错点：把 INF 加上负权后仍当普通数比较；负环不可达也报错；忘记无向图一条边要当两条有向边。
 * 复杂度：O(VE) 时间，O(V) 额外空间。
 * 输入/输出：输入顶点数、带权边表与源点；返回最短距离数组；存在可达负环时返回失败标记。
*/

/*
 * AlgoViz reference implementation: Bellman-Ford.
 * Relaxes every edge V - 1 times; an extra successful relaxation means a
 * reachable negative cycle. Supports negative edges.
 *
 * Reading guide:
 * 1. Initialise all distances to infinity and the source to 0.
 * 2. Relax every directed edge V - 1 times; each pass extends paths by at most one
 *    edge.
 * 3. Stop early when a full pass makes no change.
 * 4. One extra pass that still relaxes an edge proves a reachable negative cycle.
 *
 * Complexity: O(V * E); extra space O(V) for distances and predecessors.
 * Convention: Edges are (u, v, weight) with 0-based endpoints; returns None/null on
 *   a negative cycle.
 */

#include <stdbool.h>
#include <stdio.h>

#define VERTEX_COUNT 5
#define EDGE_COUNT 10
#define INF 1000000

typedef struct
{
    int from;
    int to;
    int weight;
} Edge;

// V - 1 passes suffice because a shortest simple path uses at most V - 1 edges.
// V-1 full passes settle every simple shortest path; one more pass that still relaxes proves a reachable negative cycle.
// Purpose: Relax every edge for V-1 passes; a further relaxation on pass V proves a negative cycle reachable from the source.
// 作用：对所有边做 V-1 轮松弛；若第 V 轮仍能松弛，说明存在从源点可达的负环。
bool bellman_ford(int vertex_count, const Edge edges[], int edge_count, int source, int dist[])
{
    for (int i = 0; i < vertex_count; ++i)
    {
        dist[i] = INF;
    }
    dist[source] = 0;

    for (int round = 0; round < vertex_count - 1; ++round)
    {
        bool changed = false;
        for (int i = 0; i < edge_count; ++i)
        {
            const Edge *edge = &edges[i];
            if (dist[edge->from] == INF)
            {
                continue;
            }
            int candidate = dist[edge->from] + edge->weight;
            if (candidate < dist[edge->to])
            {
                dist[edge->to] = candidate;
                changed = true;
            }
        }
        if (!changed)
        {
            break;
        }
    }

    for (int i = 0; i < edge_count; ++i)
    {
        const Edge *edge = &edges[i];
        if (dist[edge->from] != INF && dist[edge->from] + edge->weight < dist[edge->to])
        {
            return false;
        }
    }
    return true;
}

int main(void)
{
    Edge edges[EDGE_COUNT] = {
        {0, 1, 6},  {0, 2, 7}, {1, 2, 8},  {1, 3, 5}, {1, 4, -4},
        {2, 3, -3}, {2, 4, 9}, {3, 1, -2}, {4, 0, 2}, {4, 3, 7},
    };
    int dist[VERTEX_COUNT];

    if (!bellman_ford(VERTEX_COUNT, edges, EDGE_COUNT, 0, dist))
    {
        printf("negative cycle\n");
        return 0;
    }
    printf("distances:");
    for (int i = 0; i < VERTEX_COUNT; ++i)
    {
        if (dist[i] == INF)
        {
            printf(" INF");
        }
        else
        {
            printf(" %d", dist[i]);
        }
    }
    printf("\n");
    return 0;
}

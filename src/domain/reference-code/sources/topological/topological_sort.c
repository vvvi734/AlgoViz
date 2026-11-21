/*
 * 中文导读：在有向无环图中反复取出入度为 0 的结点，得到满足所有前驱关系的顺序。
 * 阅读顺序：先看入度数组和队列/栈；再看取出结点后如何减少邻居入度；最后看输出数量少于 V 说明有环。
 * 关键不变量：队列中的结点当前入度都是 0；已输出结点不会再影响后续。
 * 易错点：入度更新方向写反；有环仍输出部分序列并当成功；重复入队；邻接表漏边。
 * 复杂度：O(V+E) 时间，O(V+E) 空间。
 */

/*
 * Kahn topological sort in C11.
 *
 * Compute each vertex's indegree. Vertices with indegree 0 enter a FIFO queue;
 * removing a vertex appends its neighbours whose last incoming edge disappears.
 * If the queue drains before all vertices are emitted, the graph contains a
 * directed cycle. Time O(V + E) with the adjacency matrix used below (O(V^2)),
 * space O(V).
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0}, {0, 0, 0, 1, 0, 0}, {0, 0, 0, 1, 0, 0},
    {0, 0, 0, 0, 1, 1}, {0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0},
};

// A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.
// 作用：反复取入度为 0 的结点输出，并减少邻居入度；输出少于 V 说明有环。
int TopologicalSort(int order[])
{
    int indegree[VERTEX_COUNT] = {0};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;
    int emitted = 0;

    for (int from = 0; from < VERTEX_COUNT; ++from)
    {
        for (int to = 0; to < VERTEX_COUNT; ++to)
        {
            if (GRAPH[from][to] != 0)
            {
                ++indegree[to];
            }
        }
    }
    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        if (indegree[vertex] == 0)
        {
            queue[tail++] = vertex;
        }
    }

    while (head < tail)
    {
        int vertex = queue[head++];
        order[emitted++] = vertex;
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            if (GRAPH[vertex][next] != 0)
            {
                --indegree[next];
                if (indegree[next] == 0)
                {
                    queue[tail++] = next;
                }
            }
        }
    }

    return emitted;
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    int order[VERTEX_COUNT];
    int count = TopologicalSort(order);

    if (count < VERTEX_COUNT)
    {
        printf("cycle detected\n");
        return 0;
    }
    printf("topological order:");
    for (int index = 0; index < count; ++index)
    {
        printf(" %d", order[index]);
    }
    printf("\n");
    return 0;
}

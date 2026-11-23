/*
 * 中文导读：在有向无环图中反复取出入度为 0 的结点，得到满足所有前驱关系的顺序。
 * 阅读顺序：先看入度数组和队列/栈；再看取出结点后如何减少邻居入度；最后看输出数量少于 V 说明有环。
 * 关键不变量：队列中的结点当前入度都是 0；已输出结点不会再影响后续。
 * 易错点：入度更新方向写反；有环仍输出部分序列并当成功；重复入队；邻接矩阵漏边。
 * 复杂度：O(V²) 时间（邻接矩阵每次扫描全部列），O(V) 空间。
 * 输入/输出：输入有向无环图；返回拓扑序；输出顶点数不足 V 时说明有环；main 打印序列。
*/

/*
 * Kahn topological sort in C11.
 *
 * Compute each vertex's indegree. Vertices with indegree 0 enter a FIFO queue;
 * removing a vertex appends its neighbours whose last incoming edge disappears.
 * If the queue drains before all vertices are emitted, the graph contains a
 * directed cycle. Time O(V^2) with the adjacency matrix used below, space O(V).
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0}, {0, 0, 0, 1, 0, 0}, {0, 0, 0, 1, 0, 0},
    {0, 0, 0, 0, 1, 1}, {0, 0, 0, 0, 0, 0}, {0, 0, 0, 0, 0, 0},
};

// A vertex enters the queue only when its indegree reaches zero; fewer than V emitted vertices means a directed cycle.
// Purpose: Repeatedly output a zero-indegree vertex and decrement its neighbours; fewer than V outputs means a cycle.
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
            // The double loop scans every matrix cell; each 1 contributes one incoming edge, so the degree table costs O(V²).
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
            // All zero-indegree vertices are ready at time zero; FIFO order is a valid tie-break, not a required order.
            queue[tail++] = vertex;
        }
    }

    while (head < tail)
    {
        // head is the next unread slot, not the queue length; head == tail means the queue is empty.
        int vertex = queue[head++];
        // A vertex is committed only after it leaves the queue; emitted is both the output length and the next write index.
        order[emitted++] = vertex;
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            if (GRAPH[vertex][next] != 0)
            {
                // Removing this vertex deletes one incoming edge from each neighbour; indegree reaches zero only once, so no duplicate enqueue.
                --indegree[next];
                if (indegree[next] == 0)
                {
                    queue[tail++] = next;
                }
            }
        }
    }

    // A count below V is not a partial answer; it is the cycle certificate the caller must check.
    return emitted;
}

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

/*
 * 中文导读：按距离分层访问图，先访问所有距离为 d 的结点，再访问距离为 d+1 的结点。
 * 阅读顺序：先看 visited[] 与队列；再看入队时为什么立刻标记；最后看 BFS 树如何由 parent[] 还原路径。
 * 关键不变量：队列中的结点按距离非降排列；每个结点最多入队一次。
 * 易错点：出队才标记导致重复入队；把队列写成栈；忽略不连通分量。
 * 复杂度：本文件用邻接矩阵，O(V²) 时间；O(V) 额外空间。
 * 输入/输出：输入 main 内置的邻接矩阵与起点；函数只打印从起点可达顶点的 BFS 顺序，不返回数组。
*/

/*
 * Breadth-first search in C11.
 *
 * Visit the start vertex, then every unvisited neighbour in increasing vertex
 * order, using a FIFO queue. A vertex is marked when it enters the queue, so it
 * is never enqueued twice. With this adjacency matrix every vertex scans all V
 * columns, so time is O(V^2); a list representation would give O(V + E).
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0}, {1, 0, 0, 1, 0, 0}, {1, 0, 0, 1, 0, 0},
    {0, 1, 1, 0, 1, 1}, {0, 0, 0, 1, 0, 0}, {0, 0, 0, 1, 0, 0},
};

// Mark a vertex when it enters the queue, not when it leaves, so it cannot be enqueued twice.
// Purpose: Traverse from start in distance layers; mark visited on enqueue so the queue finishes nearer layers first.
// 作用：从 start 开始按距离分层遍历；入队时标记 visited，队列保证先访问近层。
void BFS(int start)
{
    int visited[VERTEX_COUNT] = {0};
    int queue[VERTEX_COUNT];
    int head = 0;
    int tail = 0;

    visited[start] = 1;
    queue[tail++] = start;

    printf("bfs:");
    while (head < tail)
    {
        int vertex = queue[head++];
        printf(" %d", vertex);
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            if (GRAPH[vertex][next] != 0 && !visited[next])
            {
                visited[next] = 1;
                queue[tail++] = next;
            }
        }
    }
    printf("\n");
}

int main(void)
{
    BFS(0);
    return 0;
}

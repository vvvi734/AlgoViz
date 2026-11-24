/*
 * 中文导读：按距离分层访问图，先访问所有距离为 d 的结点，再访问距离为 d+1 的结点。
 * 阅读顺序：先看 visited[] 与队列；再看入队时为什么立刻标记；最后看邻接矩阵如何枚举邻居。
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

// The queue holds only discovered vertices; visited is set at enqueue time, so no vertex can enter twice.
int BFS(int start)
{
    // A caller-supplied index must be a real vertex before it is used as an array subscript.
    if (start < 0 || start >= VERTEX_COUNT)
    {
        printf("bfs: start vertex out of range\n");
        return 0;
    }
    // One zeroed mark per vertex; zero means undiscovered before the start is inserted.
    int visited[VERTEX_COUNT] = {0};
    // The array is a FIFO ring: head removes, tail inserts, and VERTEX_COUNT bounds the frontier because each vertex is enqueued at most once.
    int queue[VERTEX_COUNT];
    // head names the next vertex to remove; tail names the next free slot.
    int head = 0;
    // Both indices start at zero, so the queue begins empty and no reserved slot is needed.
    int tail = 0;

    // Mark the start before enqueueing; the invariant is 'queued implies visited'.
    visited[start] = 1;
    // Store at tail and post-increment it; the old tail slot now holds the first frontier vertex.
    queue[tail++] = start;

    printf("bfs:");
    // head < tail means live elements remain; the gap between them is the queue length.
    while (head < tail)
    {
        // Copy the oldest vertex and advance head; post-increment leaves head at the next live slot.
        int vertex = queue[head++];
        // Print on removal, so the output is the BFS processing order rather than discovery order.
        printf(" %d", vertex);
        // The matrix row is scanned left to right; this fixes neighbor order but costs O(V) even for sparse rows.
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            // An edge alone is not enough; the visited guard prevents duplicate discovery and repeated queue insertion.
            if (GRAPH[vertex][next] != 0 && !visited[next])
            {
                // Mark before storing next; a later row that also reaches next must see the mark.
                visited[next] = 1;
                // Discover at the back; next waits behind every vertex already in the queue.
                queue[tail++] = next;
            }
        }
    }
    printf("\n");
    return 1;
}

int main(void)
{
    if (!BFS(0))
    {
        return 1;
    }
    return 0;
}

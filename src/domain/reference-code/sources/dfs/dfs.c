/*
 * 中文导读：沿一条路径尽可能深入，走不通再回溯；递归和显式栈是两种等价写法。
 * 阅读顺序：先看 visited 标记发生在进入还是出边时；再看递归/栈的推进与回退；最后看时间戳或 parent。
 * 关键不变量：递归栈中保存的是当前根到当前结点的路径；已标记结点不会被再次展开。
 * 易错点：递归深度超过系统栈；无向图把父边当回边；只遍历一个分量；显式栈弹出顺序写反。
 * 复杂度：O(V+E) 时间，O(V) 额外空间（递归深度可达 V）。
 * 输入/输出：输入邻接表与起点；返回/打印 DFS 访问顺序；递归实现不修改图。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Depth-first search in C11.
 *
 * Enter a vertex, mark it, print it, then recurse into each unvisited neighbour
 * in increasing vertex order. The recursion stack holds one frame per vertex on
 * the current path. Time O(V^2) with this adjacency matrix, space O(V).
 */

#include <stdio.h>

#define VERTEX_COUNT 6

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 1, 1, 0, 0, 0}, {1, 0, 0, 1, 0, 0}, {1, 0, 0, 1, 0, 0},
    {0, 1, 1, 0, 1, 1}, {0, 0, 0, 1, 0, 0}, {0, 0, 0, 1, 0, 0},
};

// Mark a vertex on entry; the recursion then visits every unvisited neighbour before returning.
// 作用：递归访问 vertex 及其未访问邻居；进入时立即标记 visited，避免回边重复展开。
static void Visit(int vertex, int visited[VERTEX_COUNT])
{
    visited[vertex] = 1;
    printf(" %d", vertex);
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        if (GRAPH[vertex][next] != 0 && !visited[next])
        {
            Visit(next, visited);
        }
    }
}

// 作用：从 start 开始深度优先遍历；递归栈保存当前根到当前结点的路径。
void DFS(int start)
{
    int visited[VERTEX_COUNT] = {0};
    printf("dfs:");
    Visit(start, visited);
    printf("\n");
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    DFS(0);
    return 0;
}

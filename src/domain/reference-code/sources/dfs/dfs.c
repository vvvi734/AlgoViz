/*
 * 中文导读：沿一条路径尽可能深入，走不通再回溯；本文件用递归调用栈实现。
 * 阅读顺序：先看 visited 标记发生在进入顶点时；再看邻接矩阵枚举与递归返回；最后看单分量限制。
 * 关键不变量：递归栈中保存的是当前根到当前结点的路径；已标记结点不会被再次展开。
 * 易错点：递归深度超过系统栈；无向图把父边当回边；只遍历一个分量。
 * 复杂度：本文件用邻接矩阵，O(V²) 时间；O(V) 额外空间（递归深度可达 V）。
 * 输入/输出：输入邻接矩阵与起点；函数只打印 DFS 访问顺序，不返回数组；递归实现不修改图。
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

// visited is shared across recursive calls; the caller owns its storage and initial zeroes.
static void Visit(int vertex, int visited[VERTEX_COUNT])
{
    // Mark on entry, before scanning neighbors; this is what stops a cycle from recursing forever.
    visited[vertex] = 1;
    // Printing on entry makes this a preorder DFS; moving the print after the loop would produce postorder.
    printf(" %d", vertex);
    // The matrix row is scanned left to right; recursion goes as deep as possible before the next sibling.
    for (int next = 0; next < VERTEX_COUNT; ++next)
    {
        // Only unvisited neighbors recurse; the visited check is what turns a cyclic graph into a tree of calls.
        if (GRAPH[vertex][next] != 0 && !visited[next])
        {
            // The call returns only after the entire branch below next is exhausted, then the loop continues with the next sibling.
            Visit(next, visited);
        }
    }
}

// One call covers exactly the connected component containing start.
void DFS(int start)
{
    // The array is zero-initialized once; every recursive call receives the same array, not a copy.
    int visited[VERTEX_COUNT] = {0};
    printf("dfs:");
    // The entry call marks and prints every vertex reachable from start; other components keep their zero flags.
    Visit(start, visited);
    printf("\n");
}

int main(void)
{
    DFS(0);
    return 0;
}

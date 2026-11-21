/*
 * 中文导读：从一个结点开始，每次选择连接“已选集合”和“未选集合”的最小边。
 * 阅读顺序：先看 key[]/in_mst[]；再看每次选最小 key 的顶点；最后看用它更新邻居的 key。
 * 关键不变量：已选顶点集合始终连成一棵树；key[v] 是 v 到该树的最小边权。
 * 易错点：没有跳过已选点；非连通图仍报成功；key 初始化成 0 而非 INF；更新条件写成小于等于。
 * 复杂度：邻接矩阵 O(V²)，堆 O(E log V)，空间 O(V+E)。
 * 输入/输出：输入无向带权图；输出选中的 MST 边与总权值；main 打印结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Prim minimum spanning tree in C11.
 *
 * Grow one tree from vertex 0. Key[v] is the lightest edge that would attach v
 * to the current tree; each round adds the unsettled vertex with the smallest
 * key, then relaxes its incident edges. Works on a connected undirected graph
 * with non-negative weights. O(V^2) with this adjacency matrix.
 */

#include <stdio.h>

#define VERTEX_COUNT 5
#define INF 1000000

static const int GRAPH[VERTEX_COUNT][VERTEX_COUNT] = {
    {0, 2, 0, 6, 0}, {2, 0, 3, 8, 5}, {0, 3, 0, 0, 7}, {6, 8, 0, 0, 9}, {0, 5, 7, 9, 0},
};

// `key[v]` is the lightest edge from v to the current tree; `parent[v]` records the endpoint that supplied it.
// Purpose: Grow the chosen set by repeatedly taking the lightest edge across the cut and updating neighbour keys until every vertex is in the tree.
// 作用：从起点扩张已选集合：每次选连接内外的最小边，更新邻居 key，直到所有结点入树。
void Prim(void)
{
    int key[VERTEX_COUNT];
    int parent[VERTEX_COUNT];
    int selected[VERTEX_COUNT] = {0};
    int total = 0;

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        key[vertex] = INF;
        parent[vertex] = -1;
    }
    key[0] = 0;

    printf("mst edges:\n");
    for (int round = 0; round < VERTEX_COUNT; ++round)
    {
        int best = -1;
        for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
        {
            if (!selected[vertex] && (best == -1 || key[vertex] < key[best]))
            {
                best = vertex;
            }
        }
        if (best == -1 || key[best] == INF)
        {
            break;
        }
        selected[best] = 1;
        if (parent[best] != -1)
        {
            printf("%d - %d: %d\n", parent[best], best, key[best]);
            total += key[best];
        }
        for (int next = 0; next < VERTEX_COUNT; ++next)
        {
            if (GRAPH[best][next] != 0 && !selected[next] && GRAPH[best][next] < key[next])
            {
                key[next] = GRAPH[best][next];
                parent[next] = best;
            }
        }
    }
    printf("total: %d\n", total);
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    Prim();
    return 0;
}

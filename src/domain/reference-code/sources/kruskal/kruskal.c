/*
 * 中文导读：按边权从小到大扫描，用并查集跳过会成环的边，选出 V-1 条边。
 * 阅读顺序：先看边的排序；再看 find/union 如何判断两端是否已连通；最后看提前停止条件。
 * 关键不变量：已选边始终构成森林；加入一条边前，它的两个端点必须属于不同集合。
 * 易错点：忘记路径压缩/按秩合并；边数不足 V-1 仍当成功；并查集父数组未初始化；有向边误用。
 * 复杂度：O(E log E) 排序 + 近似 O(E α(V)) 并查集，空间 O(V+E)。
 * 输入/输出：输入无向带权边表；返回选中的 V-1 条边与总权值；main 打印 MST。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

/*
 * Kruskal minimum spanning tree in C11.
 *
 * Sort all edges by weight, then scan them in ascending order. An edge joins the
 * tree only when its endpoints are in different components, tracked by a
 * union-find structure with path compression and union by rank. Stop after
 * V - 1 accepted edges. Sorting dominates: O(E log E).
 */

#include <stdio.h>
#include <stdlib.h>

#define VERTEX_COUNT 5
#define EDGE_COUNT 7

typedef struct
{
    int from;
    int to;
    int weight;
} Edge;

// Purpose: Edge-weight ascending comparator for qsort; a negative result means left should come first.
// 作用：qsort 使用的边权升序比较器；返回负数表示 left 应排在前面。
static int CompareEdges(const void *left, const void *right)
{
    const Edge *a = (const Edge *)left;
    const Edge *b = (const Edge *)right;
    return a->weight - b->weight;
}

// Purpose: Find the union-find root with path compression, attaching every node on the path directly to the root.
// 作用：并查集查找根；带路径压缩，把路径上的结点直接挂到根。
static int FindRoot(int parent[], int vertex)
{
    if (parent[vertex] != vertex)
    {
        parent[vertex] = FindRoot(parent, parent[vertex]);
    }
    return parent[vertex];
}

// Purpose: Union two sets by rank only when their roots differ; return whether a merge happened.
// 作用：按秩合并两个集合；只有根不同才合并，返回是否合并成功。
static int UnionRoots(int parent[], int rank[], int left, int right)
{
    int left_root = FindRoot(parent, left);
    int right_root = FindRoot(parent, right);
    if (left_root == right_root)
    {
        return 0;
    }
    if (rank[left_root] < rank[right_root])
    {
        parent[left_root] = right_root;
    }
    else if (rank[left_root] > rank[right_root])
    {
        parent[right_root] = left_root;
    }
    else
    {
        parent[right_root] = left_root;
        ++rank[left_root];
    }
    return 1;
}

// Sort by weight, then accept an edge only when union-find reports different components; otherwise it closes a cycle.
// Purpose: Scan edges by increasing weight, skip cycle-forming edges with union-find, and stop after selecting V-1 edges.
// 作用：按边权升序扫描；用并查集跳过成环边，选满 V-1 条边即得到最小生成树。
void Kruskal(Edge edges[], int edge_count)
{
    int parent[VERTEX_COUNT];
    int rank[VERTEX_COUNT] = {0};
    int total = 0;
    int accepted = 0;

    for (int vertex = 0; vertex < VERTEX_COUNT; ++vertex)
    {
        parent[vertex] = vertex;
    }
    qsort(edges, (size_t)edge_count, sizeof(Edge), CompareEdges);

    printf("mst edges:\n");
    for (int index = 0; index < edge_count && accepted < VERTEX_COUNT - 1; ++index)
    {
        if (UnionRoots(parent, rank, edges[index].from, edges[index].to))
        {
            printf("%d - %d: %d\n", edges[index].from, edges[index].to, edges[index].weight);
            total += edges[index].weight;
            ++accepted;
        }
    }
    printf("total: %d\n", total);
}

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    Edge edges[EDGE_COUNT] = {
        {0, 1, 2}, {0, 3, 6}, {1, 2, 3}, {1, 3, 8}, {1, 4, 5}, {2, 4, 7}, {3, 4, 9},
    };

    Kruskal(edges, EDGE_COUNT);
    return 0;
}

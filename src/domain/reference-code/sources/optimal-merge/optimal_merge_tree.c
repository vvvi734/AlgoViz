/*
 * 中文导读：以每个初始归并段的长度为权重，每次从森林中取 k 个最轻的根，
 * 新建父节点，权重为孩子之和；父节点放回森林，累计代价加上父权重。
 * 真实叶数 n 可能无法构成满 k 叉树，需要补 d 个零权重虚拟叶；虚拟叶只占结构位置。
 * 关键不变量：每个内部节点恰有 k 个孩子，权重等于孩子权重和，总代价等于所有内部权重之和。
 * 易错点：只取 k 个最小根却不补虚拟叶，森林最后无法合并；把根权重当总代价；
 * 把虚拟零权重叶当成真实长度为 0 的归并段；把这个过程直接称为哈夫曼编码。
 * 复杂度：本实现每次扫描森林排序，小规模下 O(n² log n) 以内；优先队列可优化选择。
 * 输入/输出：main 使用段长 [3,5,8,11]、k=2，打印每次合并和最终总代价。
 */

/*
 * Optimal merge tree in C11 for a full k-ary merge schedule.
 *
 * Real leaves carry initial-run lengths. Virtual leaves have weight zero and
 * only fill the shape so every internal node can have exactly k children.
 * Total merge cost is the sum of all internal-node weights, not the root alone.
 */

#include <stdio.h>

#define MAX_SEGMENTS 12
#define MAX_K 4
#define MAX_NODES 36

enum NodeKind
{
    REAL_LEAF = 0,
    VIRTUAL_LEAF = 1,
    INTERNAL = 2
};

typedef struct
{
    int weight;
    int kind;
    int localIndex;
    int children[MAX_K];
    int childCount;
    int parent;
} Node;

// Greedy order: lightest first; real leaves before virtual leaves, then node id.
// 作用：森林根的选择顺序；权重相同时真实节点优先，再按节点编号保证可复现。
static int RootComesBefore(const Node *nodes, int left, int right)
{
    if (nodes[left].weight != nodes[right].weight)
    {
        return nodes[left].weight < nodes[right].weight;
    }
    if (nodes[left].kind != nodes[right].kind)
    {
        return nodes[left].kind != VIRTUAL_LEAF;
    }
    return left < right;
}

// Purpose: Build the optimal merge tree and return its total merge cost.
// 作用：构造 k 路最佳归并树，返回所有内部节点权重之和。
static int BuildOptimalMergeTree(const int *weights, int segmentCount, int k, Node *nodes)
{
    int nodeCount = 0;
    int realCount = segmentCount;
    int missing = ((k - 1) - ((segmentCount - 1) % (k - 1))) % (k - 1);
    int totalLeaves = realCount + missing;

    for (int index = 0; index < realCount; ++index)
    {
        nodes[nodeCount].weight = weights[index];
        nodes[nodeCount].kind = REAL_LEAF;
        nodes[nodeCount].localIndex = index;
        nodes[nodeCount].childCount = 0;
        nodes[nodeCount].parent = -1;
        nodeCount += 1;
    }
    for (int index = 0; index < missing; ++index)
    {
        nodes[nodeCount].weight = 0;
        nodes[nodeCount].kind = VIRTUAL_LEAF;
        nodes[nodeCount].localIndex = index;
        nodes[nodeCount].childCount = 0;
        nodes[nodeCount].parent = -1;
        nodeCount += 1;
    }

    int roots[MAX_NODES];
    int rootCount = 0;
    for (int node = 0; node < nodeCount; ++node)
    {
        roots[rootCount++] = node;
    }

    int totalCost = 0;
    int internalCount = 0;
    while (rootCount > 1)
    {
        if (rootCount < k)
        {
            return -1;
        }
        // Selection sort the roots and take the first k; the forest is tiny.
        for (int left = 0; left + 1 < rootCount; ++left)
        {
            for (int right = left + 1; right < rootCount; ++right)
            {
                if (RootComesBefore(nodes, roots[right], roots[left]))
                {
                    int swap = roots[left];
                    roots[left] = roots[right];
                    roots[right] = swap;
                }
            }
        }

        int parent = nodeCount;
        nodes[parent].weight = 0;
        nodes[parent].kind = INTERNAL;
        nodes[parent].localIndex = internalCount;
        nodes[parent].childCount = k;
        nodes[parent].parent = -1;
        printf("combine T%d =", internalCount);
        for (int child = 0; child < k; ++child)
        {
            int selected = roots[child];
            nodes[parent].children[child] = selected;
            nodes[parent].weight += nodes[selected].weight;
            nodes[selected].parent = parent;
            printf(" %d", nodes[selected].weight);
        }
        printf(" -> %d\n", nodes[parent].weight);
        nodeCount += 1;
        internalCount += 1;
        totalCost += nodes[parent].weight;

        // Remove the selected roots and reinsert the new parent at the end.
        int kept = 0;
        for (int root = k; root < rootCount; ++root)
        {
            roots[kept++] = roots[root];
        }
        roots[kept++] = parent;
        rootCount = kept;
    }

    printf("leaves: real=%d virtual=%d total=%d\n", realCount, missing, totalLeaves);
    printf("root weight=%d totalCost=%d combines=%d\n",
           nodes[roots[0]].weight, totalCost, internalCount);
    return totalCost;
}

int main(void)
{
    int weights[MAX_SEGMENTS] = {3, 5, 8, 11};
    Node nodes[MAX_NODES];
    int cost = BuildOptimalMergeTree(weights, 4, 2, nodes);
    if (cost < 0)
    {
        printf("optimal merge tree invariant failed\n");
        return 1;
    }
    return 0;
}

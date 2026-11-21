/*
 * 中文导读：把记录放在完全二叉树的叶节点，内部节点保存两个孩子的较优候选；根是当前最小值。
 * 阅读顺序：先看 Better 如何用 (value, originalIndex) 决胜；再看 BuildTree 如何自底向上上送；最后看 RemoveWinner 为什么只重算一条叶到根路径。
 * 关键不变量：每个内部节点的 recordIndex 等于其两个子树当前 active 赢家中的较优者；根节点因此总是剩余记录的最小者。
 * 易错点：填充叶被当作 0；删除叶后重算整棵树；只比较 value 而丢掉 originalIndex；忘记过滤 inactive 记录。
 * 复杂度：建树 O(n)，每输出一个记录更新 O(log n)，总计 O(n log n)；选择树需要 O(n) 额外空间。
 * 输入/输出：输入 main 内置的整数数组；排序后原地输出有序记录；main 打印每条记录的关键字与原始下标。
 * 函数地图：先读 main 的调用顺序，再按需查看 BuildTree、RemoveWinner 和辅助函数。
 */

/*
 * Tournament selection sort in C11.
 *
 * Leaves hold records; every internal node stores the better child winner.
 * Equality is decided by originalIndex, so the order is stable. The tree is
 * rebuilt once, and each removal recomputes only the winner's leaf-to-root path.
 */

#include <stdio.h>

#define MAX_RECORDS 12
#define MAX_LEAVES 16

typedef struct
{
    int value;
    int originalIndex;
} Record;

typedef struct
{
    int recordIndex;
} TreeNode;

// Stable order: smaller value wins; on equality the smaller originalIndex wins.
// Purpose: Return the index of the better active candidate, or -1 when both candidates are absent.
// 作用：返回两个候选中较优的 active 记录下标；两个孩子都无记录时返回 -1。
static int Better(const Record *records, const int *active, int left, int right)
{
    if (left < 0 || !active[left])
    {
        return (right >= 0 && active[right]) ? right : -1;
    }
    if (right < 0 || !active[right])
    {
        return left;
    }
    if (records[left].value != records[right].value)
    {
        return records[left].value < records[right].value ? left : right;
    }
    return records[left].originalIndex < records[right].originalIndex ? left : right;
}

// Purpose: Compute the smallest power of two that can hold n leaves.
// 作用：计算能容纳 n 条记录的最小 2 的幂叶容量。
static int LeafCapacity(int n)
{
    int capacity = 1;
    while (capacity < n)
    {
        capacity *= 2;
    }
    return capacity;
}

// Purpose: Fill leaves in input order, then build every internal winner bottom-up.
// 作用：按输入次序填叶节点，再自底向上为每个内部节点选出赢家。
static void BuildTree(const Record *records, int n, const int *active, TreeNode *tree, int leafCount)
{
    for (int node = 1; node < 2 * leafCount; ++node)
    {
        tree[node].recordIndex = -1;
    }
    for (int slot = 0; slot < leafCount; ++slot)
    {
        tree[leafCount + slot].recordIndex = slot < n ? slot : -1;
    }
    for (int node = leafCount - 1; node >= 1; --node)
    {
        tree[node].recordIndex = Better(
            records,
            active,
            tree[node * 2].recordIndex,
            tree[node * 2 + 1].recordIndex);
    }
}

// Purpose: Remove one winner and recompute only the ancestors of its leaf.
// 作用：取出一个赢家，并只重算它所在叶子到根的祖先路径。
static void RemoveWinner(
    const Record *records,
    int *active,
    TreeNode *tree,
    int leafCount,
    int winner)
{
    active[winner] = 0;
    int node = (leafCount + records[winner].originalIndex) / 2;
    while (node >= 1)
    {
        tree[node].recordIndex = Better(
            records,
            active,
            tree[node * 2].recordIndex,
            tree[node * 2 + 1].recordIndex);
        node /= 2;
    }
}

// Purpose: Print the final stable sequence using the same original labels as the animation.
// 作用：按与动画一致的原始标签打印最终稳定序列。
static void PrintResult(const Record *records, int n)
{
    for (int index = 0; index < n; ++index)
    {
        printf("(%d,%c)%s", records[index].value, 'A' + records[index].originalIndex,
               index + 1 == n ? "\n" : " ");
    }
}

int main(void)
{
    Record records[MAX_RECORDS] = {
        {8, 0}, {3, 1}, {11, 2}, {1, 3}, {7, 4}, {2, 5}, {9, 6}, {4, 7}};
    int n = 8;
    int leafCount = LeafCapacity(n);
    TreeNode tree[2 * MAX_LEAVES];
    int active[MAX_RECORDS];
    int output[MAX_RECORDS];
    for (int index = 0; index < n; ++index)
    {
        active[index] = 1;
    }

    BuildTree(records, n, active, tree, leafCount);
    for (int count = 0; count < n; ++count)
    {
        int winner = tree[1].recordIndex;
        if (winner < 0)
        {
            return 1;
        }
        output[count] = winner;
        RemoveWinner(records, active, tree, leafCount, winner);
    }

    Record sorted[MAX_RECORDS];
    for (int index = 0; index < n; ++index)
    {
        sorted[index] = records[output[index]];
    }
    PrintResult(sorted, n);
    return 0;
}

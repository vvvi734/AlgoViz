/*
 * 中文导读：把记录放在完全二叉树的叶节点，内部节点保存两个孩子的较优候选；根是当前最小值。
 * 阅读顺序：先看 Better 如何用 (value, originalIndex) 决胜；再看 BuildTree 如何自底向上上送；最后看 RemoveWinner 为什么只重算一条叶到根路径。
 * 关键不变量：每个内部节点的 recordIndex 等于其两个子树当前 active 赢家中的较优者；根节点因此总是剩余记录的最小者。
 * 易错点：填充叶被当作 0；删除叶后重算整棵树；只比较 value 而丢掉 originalIndex；忘记过滤 inactive 记录。
 * 复杂度：建树 O(n)，每输出一个记录更新 O(log n)，总计 O(n log n)；选择树需要 O(n) 额外空间。
 * 输入/输出：输入 main 内置的整数数组；排序结果写入调用方提供的记录数组；main 打印每条记录的关键字与原始下标。
 */

/*
 * Tournament selection sort in C11.
 *
 * Leaves hold records; every internal node stores the better child winner.
 * Equality is decided by originalIndex, so the order is stable. The tree is
 * rebuilt once, and each removal recomputes only the winner's leaf-to-root path.
 */

#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

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
    // An absent or inactive left child is not a candidate; the right child can win by default, but only if it is also active.
    {
        return (right >= 0 && active[right]) ? right : -1;
    }
    if (right < 0 || !active[right])
    {
        return left;
    }
    if (records[left].value != records[right].value)
    // The primary key decides first; originalIndex is consulted only when the values tie, so ordinary comparisons stay cheap.
    {
        return records[left].value < records[right].value ? left : right;
    }
    return records[left].originalIndex < records[right].originalIndex ? left : right;
    // The smaller original index wins a tie; this is the stability rule and also gives the animation a deterministic label order.
}

// Purpose: Compute the smallest power of two that can hold n leaves; return 0 if it cannot be represented.
// 作用：计算能容纳 n 条记录的最小 2 的幂叶容量；无法用 int 表示时返回 0。
static int LeafCapacity(int n)
{
    int capacity = 1;
    while (capacity < n)
    {
        if (capacity > INT_MAX / 2)
        // Doubling again would overflow int and make the tree size wrap; the caller treats 0 as a capacity failure.
        {
            return 0;
        }
        capacity *= 2;
        // The leaf layer must be a power of two so every internal node has two children; extra leaf slots become inactive sentinels.
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
        // Every tree slot is cleared before leaves are filled; otherwise an old winner could survive in a padding subtree.
    }
    for (int slot = 0; slot < leafCount; ++slot)
    {
        tree[leafCount + slot].recordIndex = slot < n ? slot : -1;
        // Leaves map input positions directly; slots beyond n are marked -1 rather than mapped to a fake record 0.
    }
    for (int node = leafCount - 1; node >= 1; --node)
    // Building from the last internal node down to 1 guarantees both children already hold winners before their parent is computed.
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
    // Deactivation happens before any ancestor recomputation; the Better calls then ignore the removed record even if its leaf slot remains.
    int node = (leafCount + records[winner].originalIndex) / 2;
    // The walk starts at the parent of the winner's leaf, not at the leaf: the leaf itself is already represented by active[].
    while (node >= 1)
    {
        tree[node].recordIndex = Better(
            records,
            active,
            tree[node * 2].recordIndex,
            tree[node * 2 + 1].recordIndex);
        node /= 2;
        // Only the ancestor chain changes; the sibling subtree's winner is still valid and is intentionally reused.
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

// Purpose: Allocate the tournament tree for exactly n records and write the stable result into sorted.
// 作用：按 n 动态分配记录、active、树与输出数组，把稳定排序结果写入调用方的 sorted；容量或分配失败返回 0。
static int TournamentSort(const int *values, int n, Record *sorted)
{
    if (n < 0 || n > INT_MAX / 2)
    // The leaf capacity doubles up to n, and 2*leafCount must remain a valid int for the tree indices.
    {
        return 0;
    }
    if (n == 0)
    {
        return 1;
    }
    int leafCount = LeafCapacity(n);
    if (leafCount == 0 || leafCount > INT_MAX / 2)
    // 2*leafCount must remain a valid int because BuildTree and RemoveWinner use int node indices.
    {
        return 0;
    }

    Record *records = (Record *)malloc((size_t)n * sizeof(Record));
    int *active = (int *)malloc((size_t)n * sizeof(int));
    TreeNode *tree = (TreeNode *)malloc((size_t)(2 * leafCount) * sizeof(TreeNode));
    int *output = (int *)malloc((size_t)n * sizeof(int));
    // Every array is sized from n instead of a fixed MAX_RECORDS; the earlier 12-record ceiling was an implementation limit, not part of the algorithm.
    if (records == NULL || active == NULL || tree == NULL || output == NULL)
    {
        free(records);
        free(active);
        free(tree);
        free(output);
        return 0;
    }

    for (int index = 0; index < n; ++index)
    {
        records[index].value = values[index];
        records[index].originalIndex = index;
        active[index] = 1;
        // The original index is assigned before sorting; it is the stable tie-breaker and must not be confused with the output position.
    }

    BuildTree(records, n, active, tree, leafCount);
    for (int count = 0; count < n; ++count)
    {
        int winner = tree[1].recordIndex;
        if (winner < 0)
        {
            free(records);
            free(active);
            free(tree);
            free(output);
            return 0;
        }
        output[count] = winner;
        RemoveWinner(records, active, tree, leafCount, winner);
    }

    for (int index = 0; index < n; ++index)
    {
        sorted[index] = records[output[index]];
    }
    free(records);
    free(active);
    free(tree);
    free(output);
    return 1;
}

int main(void)
{
    int values[] = {8, 3, 11, 1, 7, 2, 9, 4};
    int n = (int)(sizeof(values) / sizeof(values[0]));
    Record sorted[8];
    // The caller owns the result array; only its length must match n. The sorting routine allocates its own tree from n.
    if (!TournamentSort(values, n, sorted))
    {
        printf("tournament sort failed: invalid length or allocation failure\n");
        return 1;
    }
    PrintResult(sorted, n);
    return 0;
}

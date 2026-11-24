/*
 * 中文导读：树形选择排序用一棵完全二叉树缓存“谁更小”的比较结果，根节点就是当前最小记录。
 * 阅读顺序：先看 Better 的稳定决胜规则；再看 buildTree 如何自底向上填内部节点；最后看 removeWinner 只改一条祖先路径。
 * 关键不变量：内部节点保存其两个子树当前 active 赢家中的较优者；失效记录不会重新进入比较。
 * 易错点：把填充叶当作关键字 0；删除赢家后重建整棵树；用 value 单独比较导致相等关键字次序不稳定。
 * 复杂度：建树 O(n)，每轮更新 O(log n)，总计 O(n log n)；树需要 O(n) 额外空间。
 * 输入/输出：main 用官方数组构造记录，排序后打印每条记录的关键字与原始身份。
 */

/*
 * Tournament selection sort in C++17.
 *
 * A complete winner tree caches child comparisons. The root is the minimum;
 * removing it updates only the leaf-to-root path. Ties use originalIndex.
 */

#include <algorithm>
#include <cstdio>
#include <vector>

struct Record
{
    int value;
    int originalIndex;
};

struct TreeNode
{
    int recordIndex = -1;
};

// Stable order: smaller value wins; on equality the smaller originalIndex wins.
// Purpose: Return the better active candidate index, or -1 when neither child has an active record.
// 作用：返回更优的 active 候选下标；两个孩子都没有有效记录时返回 -1。
static int Better(
    const std::vector<Record> &records,
    const std::vector<int> &active,
    int left,
    int right)
{
    if (left < 0 || !active[left])
    // The active array is the source of truth after removal; a stored leaf index alone is not proof that the record still participates.
    {
        return (right >= 0 && active[right]) ? right : -1;
    }
    if (right < 0 || !active[right])
    {
        return left;
    }
    if (records[left].value != records[right].value)
    // Value comparison is the hot path; equality falls through to the stable identity comparison below.
    {
        return records[left].value < records[right].value ? left : right;
    }
    return records[left].originalIndex < records[right].originalIndex ? left : right;
    // Ties are broken by input position, so equal keys keep their original relative order after extraction.
}

// Purpose: Fill leaves in input order, then build every internal winner bottom-up.
// 作用：按输入次序填叶节点，再自底向上为每个内部节点选出赢家。
static void BuildTree(
    const std::vector<Record> &records,
    const std::vector<int> &active,
    std::vector<TreeNode> &tree,
    int leafCount)
{
    for (int slot = 0; slot < leafCount; ++slot)
    {
        tree[leafCount + slot].recordIndex =
            slot < static_cast<int>(records.size()) ? slot : -1;
            // Padding leaves deliberately become -1; mapping them to record 0 would make a real record appear twice.
    }
    for (int node = leafCount - 1; node >= 1; --node)
    // Bottom-up construction is a postorder over the complete tree; a parent is never read before its children are ready.
    {
        tree[node].recordIndex = Better(
            records,
            active,
            tree[node * 2].recordIndex,
            tree[node * 2 + 1].recordIndex);
    }
}

// Purpose: Deactivate the winner and recompute parents along its leaf-to-root path.
// 作用：将赢家置为失效，并沿其叶到根的路径逐层重算父节点。
static void RemoveWinner(
    const std::vector<Record> &records,
    std::vector<int> &active,
    std::vector<TreeNode> &tree,
    int leafCount,
    int winner)
{
    active[winner] = 0;
    // The winner is removed logically, not erased from the vector; tree slots and record indices stay stable.
    int node = (leafCount + records[winner].originalIndex) / 2;
    // The parent formula mirrors the leaf layout; using winner directly would be wrong when winner is not the leaf slot.
    while (node >= 1)
    {
        tree[node].recordIndex = Better(
            records,
            active,
            tree[node * 2].recordIndex,
            tree[node * 2 + 1].recordIndex);
        node /= 2;
        // Each division moves one level toward the root, so the total repair is O(log n) rather than a full rebuild.
    }
}

int main()
{
    std::vector<Record> records = {
        {8, 0}, {3, 1}, {11, 2}, {1, 3}, {7, 4}, {2, 5}, {9, 6}, {4, 7}};
    const int n = static_cast<int>(records.size());
    if (n < 1 || n > 12)
    {
        std::puts("record count must be 1..12");
        return 1;
    }

    int leafCount = 1;
    while (leafCount < n)
    {
        leafCount *= 2;
    }
    std::vector<int> active(n, 1);
    std::vector<TreeNode> tree(2 * leafCount);
    std::vector<int> output;
    output.reserve(n);

    BuildTree(records, active, tree, leafCount);
    while (static_cast<int>(output.size()) < n)
    {
        int winner = tree[1].recordIndex;
        if (winner < 0)
        {
            return 1;
        }
        output.push_back(winner);
        RemoveWinner(records, active, tree, leafCount, winner);
    }

    for (int index = 0; index < n; ++index)
    {
        const Record &record = records[output[index]];
        std::printf("(%d,%c)%s", record.value, 'A' + record.originalIndex,
                    index + 1 == n ? "\n" : " ");
    }
    return 0;
}

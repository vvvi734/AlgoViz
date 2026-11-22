/*
 * 中文导读：固定 M 槽工作区，eligible 记录可参与当前段，frozen 记录等待下一段。
 * 每次输出最小 eligible 记录并立即补读下一条；小于阈值则冻结，否则继续当前段。
 * 没有 eligible 记录时封段并解冻全部 frozen 记录，同时清空阈值。
 * 关键不变量：当前段按 (value, originalIndex) 非降序，冻结记录不会被删除。
 * 易错点：固定切片冒充置换选择；冻结后覆盖槽位；解冻时忘记清 lastOutput。
 * 复杂度：每输出一条扫描至多 M 个槽位，O(n × M)，工作区 O(M)。
 * 输入/输出：main 处理九个乱序记录，工作区 3，打印每段长度与内容。
 */

/*
 * Replacement selection in C++17 with a fixed-size workspace.
 *
 * A record below the last output is frozen rather than discarded. When no
 * eligible record remains, the current run closes and every frozen record is
 * unfrozen for the next run. Input is never cut into fixed-size chunks.
 */

#include <algorithm>
#include <cstdio>
#include <vector>

enum SlotState
{
    EMPTY,
    ELIGIBLE,
    FROZEN
};

struct Item
{
    int value;
    int originalIndex;
};

struct Slot
{
    Item item{};
    SlotState state = EMPTY;
};

// The originalIndex tie-break keeps equal keys in stable input order.
static bool comes_before(const Item &left, const Item &right)
{
    if (left.value != right.value)
    {
        return left.value < right.value;
    }
    return left.originalIndex < right.originalIndex;
}

// Purpose: Run replacement selection and return the generated initial runs.
// 作用：真实运行置换选择，返回生成的初始归并段。
static std::vector<std::vector<Item>> replacement_selection(const std::vector<Item> &input,
                                                            int capacity)
{
    std::vector<Slot> workspace(capacity);
    std::vector<std::vector<Item>> runs;
    std::vector<Item> current;
    int inputIndex = 0;
    int lastOutput = 0;
    bool hasLastOutput = false;

    for (int slot = 0; slot < capacity && inputIndex < static_cast<int>(input.size()); ++slot)
    {
        workspace[slot].item = input[inputIndex++];
        workspace[slot].state = ELIGIBLE;
    }

    while (true)
    {
        int winner = -1;
        for (int slot = 0; slot < capacity; ++slot)
        {
            if (workspace[slot].state != ELIGIBLE)
            {
                continue;
            }
            if (winner < 0 || comes_before(workspace[slot].item, workspace[winner].item))
            {
                winner = slot;
            }
        }

        if (winner >= 0)
        {
            current.push_back(workspace[winner].item);
            lastOutput = workspace[winner].item.value;
            hasLastOutput = true;
            workspace[winner].state = EMPTY;

            if (inputIndex < static_cast<int>(input.size()))
            {
                int empty = -1;
                for (int slot = 0; slot < capacity; ++slot)
                {
                    if (workspace[slot].state == EMPTY)
                    {
                        empty = slot;
                        break;
                    }
                }
                if (empty < 0)
                {
                    throw "no empty workspace slot";
                }
                workspace[empty].item = input[inputIndex++];
                // Only keys below the threshold are frozen; equality remains eligible.
                workspace[empty].state =
                    (!hasLastOutput || workspace[empty].item.value >= lastOutput) ? ELIGIBLE : FROZEN;
            }
            continue;
        }

        if (!current.empty())
        {
            runs.push_back(current);
            current.clear();
        }

        int unfrozen = 0;
        for (Slot &slot : workspace)
        {
            if (slot.state == FROZEN)
            {
                slot.state = ELIGIBLE;
                unfrozen += 1;
            }
        }
        if (unfrozen == 0)
        {
            if (inputIndex >= static_cast<int>(input.size()))
            {
                break;
            }
            throw "remaining input without a resident record";
        }
        // A new run starts with no threshold; carrying lastOutput forward would freeze smaller keys incorrectly.
        hasLastOutput = false;
    }

    return runs;
}

int main()
{
    const std::vector<Item> input = {
        {7, 0}, {3, 1}, {9, 2}, {1, 3}, {8, 4}, {2, 5}, {6, 6}, {4, 7}, {5, 8}};
    const std::vector<std::vector<Item>> runs = replacement_selection(input, 3);

    int total = 0;
    for (int runIndex = 0; runIndex < static_cast<int>(runs.size()); ++runIndex)
    {
        std::printf("run%c length=%d:", 'A' + runIndex, static_cast<int>(runs[runIndex].size()));
        for (const Item &item : runs[runIndex])
        {
            std::printf(" %d", item.value);
        }
        std::printf("\n");
        total += static_cast<int>(runs[runIndex].size());
    }
    std::printf("runs=%d records=%d workspace=3\n", static_cast<int>(runs.size()), total);
    return 0;
}

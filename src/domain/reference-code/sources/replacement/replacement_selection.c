/*
 * 中文导读：工作区只有 M 个槽位，但新读入记录只要不小于“上次输出”就仍可加入当前段；
 * 小于阈值的记录被冻结，当前段没有可输出记录时把冻结记录解冻，开始下一段。
 * 关键不变量：当前段输出序列按 (value, originalIndex) 非降序；冻结记录仍占槽位但暂不可输出。
 * 易错点：把输入切成固定长度片段冒充置换选择；冻结记录被删除；封段后忘记解冻；
 * 解冻后忘记清空 lastOutput；把空槽当成关键字 0。
 * 复杂度：每条输出线性扫描至多 M 个可输出记录，O(n × M)，工作区 O(M)。
 * 输入/输出：main 处理 [7,3,9,1,8,2,6,4,5]，工作区 3，打印每个初始归并段。
 */

/*
 * Replacement selection in C11 over a fixed-size teaching workspace.
 *
 * The workspace holds at most M resident records. A new record stays eligible
 * when it is not below the last output, otherwise it is frozen until the
 * current run closes. This can create runs longer than the workspace itself.
 */

#include <stdio.h>

#define MAX_RECORDS 20
#define MAX_WORKSPACE 6
#define MAX_RUNS 20

enum SlotState
{
    SLOT_EMPTY = 0,
    SLOT_ELIGIBLE = 1,
    SLOT_FROZEN = 2
};

typedef struct
{
    int value;
    int originalIndex;
} Item;

typedef struct
{
    Item items[MAX_WORKSPACE];
    int state[MAX_WORKSPACE];
} Workspace;

typedef struct
{
    Item items[MAX_RECORDS];
    int length;
} RunResult;

// Stable order: smaller value first, then the earlier original record.
// 作用：按 (关键字, 原始下标) 比较，重复关键字也保持原始稳定次序。
static int ComesBefore(Item left, Item right)
{
    if (left.value != right.value)
    {
        return left.value < right.value;
    }
    return left.originalIndex < right.originalIndex;
}

// Purpose: Return the eligible slot with the smallest stable key, or -1.
// 作用：在工作区中找出当前可输出的最小记录槽位；没有可输出记录时返回 -1。
static int SmallestEligible(const Workspace *workspace, int capacity)
{
    // This selection is a linear scan; a heap would reduce the O(M) choice to O(log M), but the teaching version keeps every slot state visible.
    int best = -1;
    for (int slot = 0; slot < capacity; ++slot)
    {
        if (workspace->state[slot] != SLOT_ELIGIBLE)
        {
            continue;
        }
        if (best < 0 || ComesBefore(workspace->items[slot], workspace->items[best]))
        {
            best = slot;
        }
    }
    return best;
}

// Purpose: Find an empty slot; frozen records keep occupying their slots.
// 作用：寻找空槽以读入下一条记录；冻结记录仍占槽位，不能被覆盖。
static int EmptySlot(const Workspace *workspace, int capacity)
{
    for (int slot = 0; slot < capacity; ++slot)
    {
        // Only EMPTY slots can receive a new record; a FROZEN slot is still resident and must keep its record for the next run.
        if (workspace->state[slot] == SLOT_EMPTY)
        {
            return slot;
        }
    }
    return -1;
}

// Purpose: Copy the current run into completed runs and reset its buffer.
// 作用：把当前段完整移入已完成归并段，并清空当前段缓冲。
static void CloseRun(RunResult *runs, int *runCount, Item *current, int *currentLength)
{
    if (*currentLength == 0)
    {
        return;
    }
    for (int index = 0; index < *currentLength; ++index)
    {
        runs[*runCount].items[index] = current[index];
    }
    runs[*runCount].length = *currentLength;
    *runCount += 1;
    *currentLength = 0;
}

// Purpose: Generate every initial run from the input and report each length.
// 作用：生成全部初始归并段，并返回段数。
static int ReplacementSelection(const Item *input, int n, int capacity, RunResult *runs)
{
    // The workspace holds only resident candidates; current is a separate run buffer, so a run may grow beyond the workspace capacity.
    Workspace workspace = {0};
    // The run buffer is appended in nondecreasing key order: after the first output, every eligible refill is checked against lastOutput.
    Item current[MAX_RECORDS];
    int currentLength = 0;
    int runCount = 0;
    int inputIndex = 0;
    int lastOutput = 0;
    // hasLastOutput separates no-output-yet from a real threshold of 0; without it, key 0 would be mistaken for a previous output.
    int hasLastOutput = 0;

    for (int slot = 0; slot < capacity && inputIndex < n; ++slot)
    {
        workspace.items[slot] = input[inputIndex++];
        workspace.state[slot] = SLOT_ELIGIBLE;
    }

    while (1)
    {
        // The winner is the smallest eligible key; choosing it next is what keeps the current run nondecreasing.
        int winner = SmallestEligible(&workspace, capacity);
        if (winner >= 0)
        {
            // Append the winner to the run buffer before replacing it; the record leaves the workspace, so this output can be longer than M.
            current[currentLength++] = workspace.items[winner];
            lastOutput = workspace.items[winner].value;
            hasLastOutput = 1;
            // Mark the output slot empty so exactly one replacement can be read into it; frozen records must not be overwritten.
            workspace.state[winner] = SLOT_EMPTY;

            // A refilled record joins the run only when key >= lastOutput; equality is allowed, smaller keys freeze.
            if (inputIndex < n)
            {
                int empty = EmptySlot(&workspace, capacity);
                // If input remains but no slot is empty, the one-output-one-refill invariant has been broken; return -1 instead of reusing a frozen slot.
                if (empty < 0)
                {
                    return -1;
                }
                workspace.items[empty] = input[inputIndex++];
                workspace.state[empty] =
                    (!hasLastOutput || workspace.items[empty].value >= lastOutput)
                        ? SLOT_ELIGIBLE
                        : SLOT_FROZEN;
            }
            continue;
        }

        // No eligible key means the current run cannot grow; close and copy it before unfreezing candidates for the next run.
        CloseRun(runs, &runCount, current, &currentLength);
        int unfrozen = 0;
        for (int slot = 0; slot < capacity; ++slot)
        {
            // Frozen records still occupy their slots; unfreezing changes only eligibility, not their keys or storage positions.
            if (workspace.state[slot] == SLOT_FROZEN)
            {
                workspace.state[slot] = SLOT_ELIGIBLE;
                unfrozen += 1;
            }
        }
        if (unfrozen == 0)
        {
            if (inputIndex >= n)
            {
                break;
            }
            // With no eligible and no frozen record, every slot should be empty;
            // remaining input means the refill invariant was violated.
            return -1;
        }
        // A new run starts with no threshold; keeping the old lastOutput would wrongly freeze smaller keys.
        hasLastOutput = 0;
    }

    int total = 0;
    for (int runIndex = 0; runIndex < runCount; ++runIndex)
    {
        total += runs[runIndex].length;
        printf("run%c length=%d:", 'A' + runIndex, runs[runIndex].length);
        for (int index = 0; index < runs[runIndex].length; ++index)
        {
            printf(" %d", runs[runIndex].items[index].value);
        }
        printf("\n");
    }
    printf("runs=%d records=%d workspace=%d\n", runCount, total, capacity);
    return runCount;
}

int main(void)
{
    Item input[MAX_RECORDS] = {
        {7, 0}, {3, 1}, {9, 2}, {1, 3}, {8, 4}, {2, 5}, {6, 6}, {4, 7}, {5, 8}};
    RunResult runs[MAX_RUNS];
    int runCount = ReplacementSelection(input, 9, 3, runs);
    if (runCount < 0)
    {
        printf("replacement selection invariant failed\n");
        return 1;
    }
    return 0;
}

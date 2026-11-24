/*
 * 中文导读：k 个输入归并段各自只有一个 FIFO 缓冲区队首能参加比较；每选出最小记录就推进该段，
 * 缓冲区空时再读一个模拟数据块；共享输出缓冲区满一块后写回模拟外存。
 * 关键不变量：每段的缓冲区内容只能是它尚未消费记录的一个连续前缀，且该段原始记录已经有序。
 * 易错点：把整段都当成候选；某段耗尽后仍保留旧候选；最后一个不满输出块没有写出；
 * 把这里的模拟读写计数误当成浏览器真实磁盘访问。
 * 复杂度：本实现线性扫描 k 个候选，O(n × k)；败者树可把选择降到 O(n log k)。
 * 输入/输出：main 使用两个已有序段 [2,5,9] 与 [1,6,10]；打印稳定合并结果和模拟块计数。
 */

/*
 * k-way balanced merge in C11 over a teaching-model external store.
 *
 * Each run owns a FIFO input buffer and exposes only its head as a candidate.
 * A full output buffer becomes one simulated block write. The counters below
 * describe model events; they never access a real disk or file system.
 */

#include <stdio.h>
#include <string.h>

#define MAX_RECORDS 24
#define MAX_K 4
#define MAX_RUN_RECORDS 6
#define MAX_BUFFER 3

typedef struct
{
    int value;
    int originalIndex;
} Record;

typedef struct
{
    Record records[MAX_RUN_RECORDS];
    int length;
    int cursor;
    int buffer[MAX_RECORDS];
    int bufferLength;
} InputRun;

typedef struct
{
    Record records[MAX_RECORDS];
    int length;
    int capacity;
} OutputBuffer;

// Stable candidate order: smaller value wins, then the earlier original record.
// 作用：比较两个候选记录；关键字相等时用原始下标决胜，保证稳定。
static int ComesBefore(const Record *left, const Record *right)
{
    if (left->value != right->value)
    {
        return left->value < right->value;
    }
    return left->originalIndex < right->originalIndex;
}

// Purpose: Read one simulated block into the free tail of a run's input buffer.
// 作用：向输入缓冲区尾部读入一个模拟块；缓冲满或段耗尽时什么也不做。
static int Refill(InputRun *run, int blockSize, int capacity, int *readBlocks)
{
    int freeSlots = capacity - run->bufferLength;
    // capacity is the per-run FIFO capacity, not the global record capacity; freeSlots bounds how much one refill may add.
    int remaining = run->length - run->cursor;
    // cursor counts records already moved into the buffer; remaining is the unread tail that refill is allowed to consume.
    int take = blockSize;
    if (take > freeSlots)
    {
        take = freeSlots;
    }
    if (take > remaining)
    {
        take = remaining;
    }
    if (take <= 0)
    {
        return 0;
    }
    for (int offset = 0; offset < take; ++offset)
    {
        run->buffer[run->bufferLength] = run->cursor;
        // The buffer stores record indices, not record copies; the actual Record stays in the run and is read through this index.
        run->bufferLength += 1;
        run->cursor += 1;
    }
    *readBlocks += 1;
    // A refill counts as one simulated block read only when take > 0; an exhausted run must not inflate the counter.
    return take;
}

// Purpose: Move the shared output buffer into the written region as one block.
// 作用：把共享输出缓冲区整块写出，并累计一次模拟写块。
static void FlushOutput(OutputBuffer *output, Record *written, int *writtenLength,
                        int *writeBlocks)
{
    if (output->length == 0)
    {
        return;
    }
    for (int index = 0; index < output->length; ++index)
    {
        written[*writtenLength] = output->records[index];
        *writtenLength += 1;
    }
    output->length = 0;
    // Flushing resets the logical length but does not erase the array; the next block overwrites the prefix from index 0.
    *writeBlocks += 1;
}

// Purpose: Merge exactly k non-empty-or-empty sorted runs and return the written count.
// 作用：真正执行一趟 k 路平衡归并，返回写出的记录总数。
static int MultiwayMerge(InputRun runs[MAX_K], int k, int bufferCapacity, int blockSize,
                         int *readBlocks, int *writeBlocks)
{
    OutputBuffer output;
    Record written[MAX_RECORDS];
    int writtenLength = 0;
    output.length = 0;
    output.capacity = bufferCapacity;
    *readBlocks = 0;
    *writeBlocks = 0;

    for (int runIndex = 0; runIndex < k; ++runIndex)
    {
        runs[runIndex].bufferLength = 0;
        runs[runIndex].cursor = 0;
        Refill(&runs[runIndex], blockSize, bufferCapacity, readBlocks);
    }

    // Only buffer[0] of each run is a candidate; the run's unread tail stays invisible until Refill moves it in.
    // Every iteration selects one candidate. A run with an empty buffer after
    // its head leaves may refill immediately, but a fully consumed run stays out.
    while (1)
    {
        int winnerRun = -1;
        int winnerOffset = -1;
        for (int runIndex = 0; runIndex < k; ++runIndex)
        {
            InputRun *run = &runs[runIndex];
            if (run->bufferLength == 0)
            // An empty buffer contributes no candidate; skipping it is different from treating its missing head as value 0.
            {
                continue;
            }
            Record *candidate = &run->records[run->buffer[0]];
            if (winnerRun < 0 ||
                ComesBefore(candidate, &runs[winnerRun].records[runs[winnerRun].buffer[winnerOffset]]))
            {
                winnerRun = runIndex;
                winnerOffset = 0;
            }
        }
        if (winnerRun < 0)
        {
            break;
        }

        InputRun *owner = &runs[winnerRun];
        Record winner = owner->records[owner->buffer[winnerOffset]];
        for (int index = winnerOffset; index + 1 < owner->bufferLength; ++index)
        // Removing the winner shifts the FIFO tail left; this keeps the next record at buffer[0] and preserves arrival order.
        {
            owner->buffer[index] = owner->buffer[index + 1];
        }
        owner->bufferLength -= 1;

        output.records[output.length] = winner;
        output.length += 1;
        if (output.length == output.capacity)
        // A block is written exactly when the shared output buffer reaches capacity; flushing earlier would create smaller artificial blocks.
        {
            FlushOutput(&output, written, &writtenLength, writeBlocks);
        }

        if (owner->bufferLength == 0)
        {
            Refill(owner, blockSize, bufferCapacity, readBlocks);
        }
    }

    // The last partial output block is still a block and must not be dropped.
    // The final flush is outside the loop because the last block is usually partial; dropping it would lose records.
    FlushOutput(&output, written, &writtenLength, writeBlocks);

    printf("merged:");
    for (int index = 0; index < writtenLength; ++index)
    {
        printf(" (%d,%c)", written[index].value, 'A' + written[index].originalIndex);
    }
    printf("\n");
    return writtenLength;
}

int main(void)
{
    InputRun runs[MAX_K];
    memset(runs, 0, sizeof(runs));
    int values[MAX_K][MAX_RUN_RECORDS] = {{2, 5, 9}, {1, 6, 10}};
    int lengths[MAX_K] = {3, 3};
    int originalIndex = 0;
    for (int runIndex = 0; runIndex < 2; ++runIndex)
    {
        runs[runIndex].length = lengths[runIndex];
        for (int slot = 0; slot < lengths[runIndex]; ++slot)
        {
            runs[runIndex].records[slot].value = values[runIndex][slot];
            runs[runIndex].records[slot].originalIndex = originalIndex;
            originalIndex += 1;
        }
    }

    int reads = 0;
    int writes = 0;
    int total = MultiwayMerge(runs, 2, 2, 1, &reads, &writes);
    printf("records=%d readBlocks=%d writeBlocks=%d mergePasses=1\n", total, reads, writes);
    printf("note: simulated teaching I/O, not browser disk access\n");
    return 0;
}

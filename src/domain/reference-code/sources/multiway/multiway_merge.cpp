/*
 * 中文导读：用 vector 保存 k 个已排序输入段；每段 vector 缓冲区只让队首参加比较。
 * 每输出一个赢家就把该段缓冲区头移除，缓冲区空且仍有记录时读入一个模拟块；
 * 输出缓冲区达到容量就整块写出，最后残余也必须写出。
 * 关键不变量：每段缓冲区始终是尚未消费记录的前缀，候选集合只由各段缓冲区头组成。
 * 易错点：比较整段；段耗尽后仍保留旧候选；忘记最后不满块；把模拟 I/O 当作真实磁盘访问。
 * 复杂度：线性扫描 k 个候选为 O(n × k)；败者树可降到 O(n log k)。
 * 输入/输出：main 合并 [2,5,9] 与 [1,6,10]，打印稳定次序和模拟块计数。
 */

/*
 * k-way balanced merge in C++17 over a teaching-model external store.
 *
 * Input runs are already sorted. The program maintains one FIFO buffer per run,
 * compares only buffer heads, and turns a full output buffer into one simulated
 * block write. Counters are model events, never real disk access.
 */

#include <algorithm>
#include <cstdio>
#include <vector>

struct Record
{
    int value;
    int originalIndex;
};

struct InputRun
{
    std::vector<Record> records;
    int cursor = 0;
    std::vector<int> buffer;
};

static bool comes_before(const Record &left, const Record &right)
{
    if (left.value != right.value)
    {
        return left.value < right.value;
    }
    return left.originalIndex < right.originalIndex;
}

// Purpose: Fill the free tail of one input buffer from the run's unread prefix.
// 作用：从该段尚未读入的前缀中补满输入缓冲区。
static int refill(InputRun &run, int blockSize, int capacity, int &readBlocks)
{
    const int freeSlots = capacity - static_cast<int>(run.buffer.size());
    const int remaining = static_cast<int>(run.records.size()) - run.cursor;
    const int take = std::max(0, std::min(blockSize, std::min(freeSlots, remaining)));
    for (int offset = 0; offset < take; ++offset)
    {
        run.buffer.push_back(run.cursor);
        run.cursor += 1;
    }
    if (take > 0)
    {
        readBlocks += 1;
    }
    return take;
}

// Purpose: Merge k runs and print the stable output plus simulated block counts.
// 作用：执行一趟 k 路归并，输出稳定结果和模拟读写块数。
static std::vector<Record> multiway_merge(std::vector<InputRun> runs, int bufferCapacity,
                                          int blockSize, int &readBlocks, int &writeBlocks)
{
    std::vector<Record> outputBuffer;
    std::vector<Record> written;
    readBlocks = 0;
    writeBlocks = 0;

    for (auto &run : runs)
    {
        refill(run, blockSize, bufferCapacity, readBlocks);
    }

    // Only buffer.front() of each run is a candidate; unread records behind the FIFO window are not compared.
    while (true)
    {
        int winnerRun = -1;
        for (int runIndex = 0; runIndex < static_cast<int>(runs.size()); ++runIndex)
        {
            if (runs[runIndex].buffer.empty())
            {
                continue;
            }
            if (winnerRun < 0 ||
                comes_before(runs[runIndex].records[runs[runIndex].buffer.front()],
                             runs[winnerRun].records[runs[winnerRun].buffer.front()]))
            {
                winnerRun = runIndex;
            }
        }
        if (winnerRun < 0)
        {
            break;
        }

        InputRun &owner = runs[winnerRun];
        const Record winner = owner.records[owner.buffer.front()];
        owner.buffer.erase(owner.buffer.begin());
        outputBuffer.push_back(winner);

        if (static_cast<int>(outputBuffer.size()) == bufferCapacity)
        {
            for (const Record &record : outputBuffer)
            {
                written.push_back(record);
            }
            outputBuffer.clear();
            writeBlocks += 1;
        }

        if (owner.buffer.empty())
        {
            refill(owner, blockSize, bufferCapacity, readBlocks);
        }
    }

    // A trailing partial buffer is still one simulated output block.
    if (!outputBuffer.empty())
    {
        for (const Record &record : outputBuffer)
        {
            written.push_back(record);
        }
        writeBlocks += 1;
    }
    return written;
}

int main()
{
    std::vector<InputRun> runs(2);
    runs[0].records = {{2, 0}, {5, 1}, {9, 2}};
    runs[1].records = {{1, 3}, {6, 4}, {10, 5}};

    int reads = 0;
    int writes = 0;
    const std::vector<Record> written = multiway_merge(runs, 2, 1, reads, writes);

    std::printf("merged:");
    for (const Record &record : written)
    {
        std::printf(" (%d,%c)", record.value, static_cast<char>('A' + record.originalIndex));
    }
    std::printf("\nrecords=%d readBlocks=%d writeBlocks=%d mergePasses=1\n",
                static_cast<int>(written.size()), reads, writes);
    std::printf("note: simulated teaching I/O, not browser disk access\n");
    return 0;
}

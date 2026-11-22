/*
 * 中文导读：数据记录按主关键字排序后分块。稠密索引每记录一项，稀疏索引每块只保留上界。
 * 查找选“不大于目标的最后一项”，只读一个数据块并在块内确认；失败也计一次块读取。
 * 易错点：稀疏索引误选后继项；把索引项直接当成记录；不区分索引探查与数据块读取。
 * 复杂度：一级索引线性 O(E)，块内 O(B)；这里的 I/O 计数只是教学模型。
 * 输入/输出：8 条记录、块容量 3，演示稠密/稀疏命中和失败。
 */

/*
 * Indexed-file lookup in C++17. The data file and its one-level index are
 * separate vectors; a lookup routes by entries, then reads exactly one block.
 */

#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Record
{
    int key;
    std::string label;
};

struct Block
{
    std::vector<Record> records;
};

struct Entry
{
    int key;
    int blockIndex;
};

struct Io
{
    int probes = 0;
    int blockReads = 0;
};

// Stable sorting keeps equal keys in input order, so the block layout is deterministic for the demo.
// 作用：按主关键字排序；相等键保持原输入次序，使切块结果可重复。
static void SortRecords(std::vector<Record> &records)
{
    std::stable_sort(records.begin(), records.end(),
                     [](const Record &left, const Record &right)
                     { return left.key < right.key; });
}

// 作用：按块容量切块，块号成为索引项的真实地址。
static std::vector<Block> BuildBlocks(const std::vector<Record> &records, int capacity)
{
    std::vector<Block> blocks;
    for (std::size_t start = 0; start < records.size(); start += static_cast<std::size_t>(capacity))
    {
        Block block;
        std::size_t end = std::min(records.size(), start + static_cast<std::size_t>(capacity));
        for (std::size_t index = start; index < end; index += 1)
        {
            block.records.push_back(records[index]);
        }
        blocks.push_back(block);
    }
    return blocks;
}

// Dense mode emits every record key; sparse mode emits each block's last key as an upper bound, not the next block's first key.
// 作用：dense=true 时每记录一项；否则每块最后一条记录的关键字作为上界，上界属于被索引的块。
static std::vector<Entry> BuildIndex(const std::vector<Block> &blocks, bool dense)
{
    std::vector<Entry> index;
    for (std::size_t block = 0; block < blocks.size(); block += 1)
    {
        if (dense)
        {
            for (const Record &record : blocks[block].records)
            {
                index.push_back({record.key, static_cast<int>(block)});
            }
        }
        else
        {
            index.push_back({blocks[block].records.back().key, static_cast<int>(block)});
        }
    }
    return index;
}

// Choose the last entry not greater than target, then read exactly one block; a miss still counts that block read.
// 作用：逐项检查索引，选择不大于目标的最后一项，读一块并在块内比较；失败同样计一次块读取。
static int Lookup(const std::vector<Block> &blocks, const std::vector<Entry> &index, int target, Io &io)
{
    std::size_t chosen = 0;
    io = {};
    for (std::size_t position = 0; position < index.size(); position += 1)
    {
        io.probes += 1;
        if (index[position].key == target)
        {
            chosen = position;
            break;
        }
        if (index[position].key > target)
        {
            break;
        }
        chosen = position;
    }

    int blockIndex = index[chosen].blockIndex;
    io.blockReads = 1;
    std::cout << "index chooses block B" << blockIndex
              << " (entry " << index[chosen].key << ")\n";
    const Block &block = blocks[static_cast<std::size_t>(blockIndex)];
    for (std::size_t offset = 0; offset < block.records.size(); offset += 1)
    {
        const Record &record = block.records[offset];
        std::cout << "  compare " << record.key << " (" << record.label << ")\n";
        if (record.key == target)
        {
            return blockIndex * 3 + static_cast<int>(offset);
        }
    }
    return -1;
}

int main()
{
    std::vector<Record> records = {
        {107, "G"}, {101, "A"}, {105, "E"}, {103, "C"},
        {102, "B"}, {108, "H"}, {104, "D"}, {106, "F"}};
    SortRecords(records);
    std::vector<Block> blocks = BuildBlocks(records, 3);

    for (bool dense : {true, false})
    {
        std::vector<Entry> index = BuildIndex(blocks, dense);
        std::cout << (dense ? "dense" : "sparse") << " index: "
                  << index.size() << " entries\n";
        Io io;
        int found = Lookup(blocks, index, 106, io);
        std::cout << "lookup 106: " << (found >= 0 ? "hit" : "miss")
                  << ", probes=" << io.probes
                  << ", block reads=" << io.blockReads << "\n";
    }

    std::vector<Entry> dense = BuildIndex(blocks, true);
    Io io;
    int missing = Lookup(blocks, dense, 109, io);
    std::cout << "lookup 109: " << (missing >= 0 ? "hit" : "miss")
              << ", probes=" << io.probes
              << ", block reads=" << io.blockReads << "\n";
    return 0;
}

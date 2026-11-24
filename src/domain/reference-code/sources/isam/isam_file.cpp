/*
 * 中文导读：ISAM 主区按关键字有序分块，索引项保存每块与溢出链的真实最大键。
 * 查找先用上界选块，扫主块，再沿专属链继续；插入块满时创建/追加溢出节点并刷新上界。
 * 易错点：上界选错块；主块命中还读链；新节点没有前驱链接；插入后不重查。
 * 复杂度：索引 O(E)、主块 O(B)、溢出链 O(C)；I/O 是模拟事件。
 * 输入/输出：6 条记录、块容量 2，插入 105 到 B2 溢出链后重新查找。
 */

/*
 * ISAM file in C++17 with ordered main blocks and per-block overflow chains.
 * The index stores each block's true maximum, including its chain.
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

struct OverflowNode
{
    std::vector<Record> records;
    int next = -1;
};

struct MainBlock
{
    std::vector<Record> records;
    int overflowHead = -1;
};

class IsamFile
{
  public:
    std::vector<MainBlock> blocks;
    std::vector<OverflowNode> overflow;
    std::vector<int> bounds;
    int capacity = 2;
    int mainReads = 0;
    int overflowReads = 0;

    // The main block alone is insufficient: an overflow record can be the true maximum, so the chain is scanned.
    // 作用：计算主块与全部溢出节点的真实最大键；索引上界不能只取主块末项。
    int BlockMaximum(int blockIndex) const
    {
        int maximum = blocks[blockIndex].records.back().key;
        // The main block's back() is the starting point, but overflow records are scanned because they can be the true maximum.
        int node = blocks[blockIndex].overflowHead;
        while (node >= 0)
        {
            for (const Record &record : overflow[node].records)
            {
                maximum = std::max(maximum, record.key);
            }
            node = overflow[node].next;
        }
        return maximum;
    }

    // Bounds are derived data, so every mutation rebuilds them from the current blocks and chains.
    // 作用：上界是派生数据；每次插入后按当前主块与溢出链重建，避免索引落后于真实记录。
    void RefreshBounds()
    {
        bounds.clear();
        // Bounds are derived data: clearing and rebuilding prevents a stale upper bound from surviving an overflow append.
        for (std::size_t block = 0; block < blocks.size(); block += 1)
        {
            bounds.push_back(BlockMaximum(static_cast<int>(block)));
        }
    }

    // Select the first block whose bound is at least target; beyond all bounds, only the last block can contain it.
    // 作用：选第一个上界不小于目标的主块；目标超过全部上界时选最后一块，保证下标有效。
    int ChooseBlock(int target) const
    {
        for (std::size_t block = 0; block < bounds.size(); block += 1)
        {
            if (bounds[block] >= target)
            {
                return static_cast<int>(block);
            }
        }
        return static_cast<int>(bounds.size()) - 1;
        // Out-of-range targets fall back to the last block; this is a defined probe location, not a claim that the record exists.
    }

    // The block is chosen before overflow is considered; a full block appends to its private chain, then bounds are rebuilt.
    // 作用：先锁定主块；有空间就按序插入，块满则追加到该块专属溢出链，最后重建上界。
    void Insert(Record record)
    {
        int blockIndex = ChooseBlock(record.key);
        MainBlock &block = blocks[static_cast<std::size_t>(blockIndex)];
        if (static_cast<int>(block.records.size()) < capacity)
        {
            auto position = std::upper_bound(
            // upper_bound returns the first key strictly greater than record.key, so the new record is inserted after equal keys and matches the C/Python stability rule.
                block.records.begin(), block.records.end(), record.key,
                [](int key, const Record &right)
                { return key < right.key; });
            block.records.insert(position, record);
            std::cout << "insert " << record.key << " into main B" << blockIndex << "\n";
            RefreshBounds();
            return;
        }

        std::cout << "B" << blockIndex << " full: append "
                  << record.key << " to overflow\n";
        if (block.overflowHead < 0)
        // A full main block creates its own overflow head; records never spill into another block's chain, which preserves the index mapping.
        {
            block.overflowHead = static_cast<int>(overflow.size());
            overflow.push_back({});
            std::cout << "set B" << blockIndex << " overflowHead = O"
                      << block.overflowHead << "\n";
        }

        int node = block.overflowHead;
        while (overflow[static_cast<std::size_t>(node)].next >= 0)
        {
            node = overflow[static_cast<std::size_t>(node)].next;
        }
        OverflowNode &tail = overflow[static_cast<std::size_t>(node)];
        if (static_cast<int>(tail.records.size()) >= capacity)
        {
            int newNode = static_cast<int>(overflow.size());
            overflow.push_back({});
            tail.next = newNode;
            std::cout << "link O" << node << " -> O" << newNode << "\n";
            node = newNode;
        }
        auto &records = overflow[static_cast<std::size_t>(node)].records;
        auto position = std::upper_bound(
        // The overflow insertion uses the same upper_bound rule as the main block; both paths must preserve the arrival order of equal keys.
            records.begin(), records.end(), record.key,
            [](int key, const Record &right)
            { return key < right.key; });
        records.insert(position, record);
        RefreshBounds();
    }

    // Scan the selected main block first; only a main-area miss follows that block's private overflow chain.
    // 作用：先查主块，未命中再沿专属溢出链继续；主区与溢出节点分别计数。
    int Lookup(int target, bool &fromOverflow)
    {
        int blockIndex = ChooseBlock(target);
        mainReads += 1;
        // The main-block read is counted before scanning, so a subsequent overflow lookup still includes the initial main access.
        std::cout << "bound " << bounds[blockIndex]
                  << " selects B" << blockIndex << "\n";
        const MainBlock &block = blocks[static_cast<std::size_t>(blockIndex)];
        for (std::size_t offset = 0; offset < block.records.size(); offset += 1)
        {
            std::cout << "  compare main " << block.records[offset].key << "\n";
            if (block.records[offset].key == target)
            {
                fromOverflow = false;
                return blockIndex * capacity + static_cast<int>(offset);
                // The position uses the runtime capacity, so unlike file-index this version remains correct if the block capacity changes.
            }
        }

        int node = block.overflowHead;
        while (node >= 0)
        {
            overflowReads += 1;
            std::cout << "  read overflow O" << node << "\n";
            const OverflowNode &current = overflow[static_cast<std::size_t>(node)];
            for (std::size_t offset = 0; offset < current.records.size(); offset += 1)
            {
                std::cout << "    compare overflow " << current.records[offset].key << "\n";
                if (current.records[offset].key == target)
                {
                    fromOverflow = true;
                    return node * capacity + static_cast<int>(offset);
                }
            }
            node = current.next;
        }
        fromOverflow = false;
        return -1;
    }
};

int main()
{
    std::vector<Record> input = {
        {101, "A"}, {102, "B"}, {103, "C"},
        {104, "D"}, {106, "F"}, {108, "H"}};
    std::stable_sort(input.begin(), input.end(),
                     [](const Record &left, const Record &right)
                     { return left.key < right.key; });

    IsamFile file;
    for (std::size_t start = 0; start < input.size(); start += 2)
    {
        MainBlock block;
        std::size_t end = std::min(input.size(), start + 2);
        block.records.assign(input.begin() + static_cast<std::ptrdiff_t>(start),
                             input.begin() + static_cast<std::ptrdiff_t>(end));
        file.blocks.push_back(block);
    }
    file.RefreshBounds();

    file.Insert({105, "E"});
    bool fromOverflow = false;
    int found = file.Lookup(105, fromOverflow);
    std::cout << "lookup 105: " << (found >= 0 ? "hit" : "miss")
              << " in " << (fromOverflow ? "overflow" : "main area")
              << ", main reads=" << file.mainReads
              << ", overflow reads=" << file.overflowReads << "\n";
    return 0;
}

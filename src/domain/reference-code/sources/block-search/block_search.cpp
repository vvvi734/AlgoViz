/*
 * 中文导读：先为每个连续数据块建立“块最大值”索引，再先查索引、后查一个块。
 * 阅读顺序：先看 build_index 的切块与范围校验；再看 search 如何选择第一个 max≥target 的块；最后看块内线性扫描。
 * 关键不变量：块覆盖原 vector 且不重排；块最大值严格递增；后一块的所有值都大于前一块最大值。
 * 易错点：拒绝输入时偷偷排序；把块内有序也当成前提；忽略最后一个短块。
 * 复杂度：建索引 O(n)，查找 O(b+s)，b 为块数、s 为块大小；空间 O(b)。
 * 输入/输出：输入原始数组、块大小与目标；返回真实下标或 -1；main 打印索引与两阶段比较次数。
*/

/*
 * Indexed sequential (block) search in C++17.
 *
 * Values keep their original order. A sequential index stores each block's real
 * maximum; the index is valid only when maxima strictly increase and every
 * later block lies above the previous maximum. The search probes the index and
 * scans one real block, so the second stage remains a genuine linear search.
 */

#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>

constexpr int MAX_BLOCKS = 8;
constexpr int MAX_BLOCK_SIZE = 8;

struct IndexEntry
{
    int max;
    int start;
    int length;
};

struct SearchStats
{
    int indexComparisons = 0;
    int blockComparisons = 0;
};

// Purpose: Validate the range prerequisite and build one entry per consecutive block.
// 作用：校验块范围递增前提，并为每个连续块建立索引项。
std::vector<IndexEntry> build_index(const std::vector<int> &data, int blockSize)
{
    if (data.empty() || blockSize < 1 || blockSize > MAX_BLOCK_SIZE)
    {
        throw std::invalid_argument("block size is outside 1..8");
    }
    // Ceiling division includes the tail block even when its length is smaller than blockSize; truncating division would silently lose that suffix.
    int blocks = (static_cast<int>(data.size()) + blockSize - 1) / blockSize;
    if (blocks > MAX_BLOCKS)
    {
        throw std::invalid_argument("too many blocks");
    }
    std::vector<IndexEntry> index;
    for (int start = 0, block = 0; start < static_cast<int>(data.size()); start += blockSize, ++block)
    {
        int length = static_cast<int>(data.size()) - start < blockSize
                         ? static_cast<int>(data.size()) - start
                         : blockSize;
        int maximum = data[start];
        for (int offset = 1; offset < length; ++offset)
        {
            maximum = std::max(maximum, data[start + offset]);
        }
        // Later blocks must have strictly larger maxima and every element above the previous maximum. Without both checks, selecting by max could enter a block that does not contain the target.
        if (block > 0)
        {
            if (maximum <= index.back().max)
            {
                throw std::invalid_argument("block maxima must strictly increase");
            }
            for (int offset = 0; offset < length; ++offset)
            {
                if (data[start + offset] <= index.back().max)
                {
                    throw std::invalid_argument("later blocks must start above the previous maximum");
                }
            }
        }
        index.push_back({maximum, start, length});
    }
    return index;
}

// Purpose: Probe the index, then scan the selected block; stats separates the two stages.
// 作用：先探测索引，再扫描选中的块；stats 分开记录两个阶段的比较次数。
int search(const std::vector<int> &data, int blockSize, int target, SearchStats &stats)
{
    auto index = build_index(data, blockSize);
    int selected = -1;
    for (int block = 0; block < static_cast<int>(index.size()); ++block)
    {
        ++stats.indexComparisons;
        // Earlier blocks have smaller maxima, so this first satisfying block is the only one that can contain target; all later blocks lie strictly above the previous maximum.
        if (target <= index[block].max)
        {
            selected = block;
            break;
        }
    }
    // If no maximum reaches target, target exceeds every record. Return -1 before doing any block scan.
    if (selected < 0)
    {
        return -1;
    }
    const auto &entry = index[selected];
    for (int offset = 0; offset < entry.length; ++offset)
    {
        ++stats.blockComparisons;
        // The block is scanned linearly because its internal order is not part of the index contract. Only equality can guide this stage; binary search would require sorted data.
        if (data[entry.start + offset] == target)
        {
            return entry.start + offset;
        }
    }
    return -1;
}

// Purpose: Run the documented example and show that both stages report real counts.
// 作用：运行文档示例，展示两个阶段各自的真实比较次数。
int main()
{
    std::vector<int> data{22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69};
    auto index = build_index(data, 4);
    // The index is probed sequentially because its maxima increase. The first block whose max reaches target is the unique candidate; a later block starts above it and cannot hold a smaller target.
    for (int block = 0; block < static_cast<int>(index.size()); ++block)
    {
        std::cout << "block " << block + 1 << ": [" << index[block].start << ", "
                  << index[block].start + index[block].length << ") max="
                  << index[block].max << "\n";
    }
    SearchStats hit;
    int position = search(data, 4, 38, hit);
    std::cout << "find 38: index=" << position << " indexComparisons=" << hit.indexComparisons
              << " blockComparisons=" << hit.blockComparisons << "\n";
    SearchStats miss;
    int absent = search(data, 4, 60, miss);
    std::cout << "find 60: index=" << absent << " indexComparisons=" << miss.indexComparisons
              << " blockComparisons=" << miss.blockComparisons << "\n";
    return 0;
}

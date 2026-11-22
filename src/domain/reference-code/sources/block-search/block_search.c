/*
 * 中文导读：先为每个连续数据块建立“块最大值”索引，再先查索引、后查一个块。
 * 阅读顺序：先看 build_index 如何切块与校验范围；再看 block_search 如何选第一个 max≥target 的块；最后看块内线性扫描。
 * 关键不变量：块覆盖原数组且不重排；块最大值严格递增；后一块的所有值都大于前一块最大值。
 * 易错点：为了“满足索引条件”静默排序数组；块内也要求有序；目标大于所有索引最大值时仍进入最后一块。
 * 复杂度：建索引 O(n)，查找 O(b+s)，b 为块数、s 为块大小；空间 O(b)。
 * 输入/输出：输入原始数组、块大小与目标；返回真实下标或 -1；main 打印索引、比较次数与结果。
*/

/*
 * Indexed sequential (block) search in C11.
 *
 * The data array is never reordered. blockSize only partitions the prefix into
 * consecutive blocks. Every block stores its real maximum, and the index is
 * valid only when maxima strictly increase and every later block starts above
 * the previous maximum. Search scans that index sequentially, enters the first
 * block whose maximum reaches the target, then scans that one block linearly.
 */

#include <stdio.h>

#define MAX_BLOCKS 8
#define MAX_BLOCK_SIZE 8

typedef struct
{
    int max;
    int start;
    int length;
} IndexEntry;

// Before any entry exists, reject a size that cannot partition the array; otherwise the ceiling division and later maximum lookup have no defined block boundary.
static int build_index(const int *data, int count, int block_size, IndexEntry *index)
{
    if (count <= 0 || block_size <= 0 || block_size > MAX_BLOCK_SIZE)
    {
        return -1;
    }
    // Ceiling division counts the final short block. Floor division would omit it whenever count is not a multiple of block_size.
    int blocks = (count + block_size - 1) / block_size;
    if (blocks > MAX_BLOCKS)
    {
        return -1;
    }
    int start = 0;
    for (int block = 0; block < blocks; ++block)
    {
        int length = count - start < block_size ? count - start : block_size;
        int maximum = data[start];
        for (int offset = 1; offset < length; ++offset)
        {
            if (data[start + offset] > maximum)
            {
                maximum = data[start + offset];
            }
        }
        // The index is valid only if maxima strictly increase and every value in this block exceeds the previous maximum. Otherwise a later block could contain a value smaller than an earlier block's max, so max-based selection would be unsafe.
        if (block > 0)
        {
            if (maximum <= index[block - 1].max)
            {
                return -1;
            }
            for (int offset = 0; offset < length; ++offset)
            {
                if (data[start + offset] <= index[block - 1].max)
                {
                    return -1;
                }
            }
        }
        index[block].max = maximum;
        index[block].start = start;
        index[block].length = length;
        start += length;
    }
    return blocks;
}

// Index and block comparisons are counted separately because they measure two different searches; merging them would hide which stage dominates.
static int block_search(const int *data, int count, int block_size, int target,
                        int *index_comparisons, int *block_comparisons)
{
    IndexEntry index[MAX_BLOCKS];
    int blocks = build_index(data, count, block_size, index);
    *index_comparisons = 0;
    *block_comparisons = 0;
    if (blocks < 0)
    {
        return -1;
    }
    int selected = -1;
    for (int block = 0; block < blocks; ++block)
    {
        ++*index_comparisons;
        // The first block whose maximum reaches target is the only possible block: earlier maxima are too small, and later blocks all start above this maximum.
        if (target <= index[block].max)
        {
            selected = block;
            break;
        }
    }
    // No maximum reaches target means target is larger than every value in the array; return -1 before scanning any block.
    if (selected < 0)
    {
        return -1;
    }
    int start = index[selected].start;
    int length = index[selected].length;
    for (int offset = 0; offset < length; ++offset)
    {
        ++*block_comparisons;
        // Inside a block the values are not promised sorted, so only a linear equality scan is valid. A binary search here would assume an ordering the index never guarantees.
        if (data[start + offset] == target)
        {
            return start + offset;
        }
    }
    return -1;
}

// The sample deliberately keeps the data unsorted: the index contract concerns block ranges and maxima, not reordering the array.
int main(void)
{
    int data[] = {22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69};
    int count = (int)(sizeof(data) / sizeof(data[0]));
    IndexEntry index[MAX_BLOCKS];
    int blocks = build_index(data, count, 4, index);
    for (int block = 0; block < blocks; ++block)
    {
        printf("block %d: [%d, %d) max=%d\n", block + 1, index[block].start,
               index[block].start + index[block].length, index[block].max);
    }
    int index_comparisons = 0;
    int block_comparisons = 0;
    int found = block_search(data, count, 4, 38, &index_comparisons, &block_comparisons);
    printf("find 38: index=%d, index comparisons=%d, block comparisons=%d\n",
           found, index_comparisons, block_comparisons);
    int missing = block_search(data, count, 4, 60, &index_comparisons, &block_comparisons);
    printf("find 60: index=%d, index comparisons=%d, block comparisons=%d\n",
           missing, index_comparisons, block_comparisons);
    return 0;
}

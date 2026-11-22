/*
 * 中文导读：数据记录按主关键字排序后切成文件块。稠密索引为每条记录保存“关键字 → 块”，
 * 稀疏索引只保存每块最后一条记录的关键字作为上界。查找先在线性索引中选“不大于目标的最后一项”，
 * 然后只读一个数据块，在块内逐条比较。索引项地址必须与真实块号一致。
 * 易错点：稀疏索引误选第一个大于目标的项；命中索引后不读块；失败路径不计块读取。
 * 复杂度：一级索引线性检查 O(E)，块内 O(B)；本文件只模拟块事件，不访问真实磁盘。
 * 输入/输出：固定 8 条记录、块容量 3，分别演示稠密命中、稀疏命中与失败。
 */

/*
 * Indexed-file lookup in C11 over an in-memory teaching model.
 *
 * Records are sorted by primary key, split into blocks, and indexed either
 * densely (one entry per record) or sparsely (one upper bound per block).
 * Exactly one data block is read for a hit or a miss; the index is one block.
 */

#include <stdio.h>
#include <string.h>

#define MAX_RECORDS 12
#define MAX_BLOCKS 6
#define BLOCK_CAPACITY 3

typedef struct
{
    int key;
    char label[8];
} Record;

typedef struct
{
    Record records[MAX_RECORDS];
    int length;
} DataBlock;

typedef struct
{
    int key;
    int blockIndex;
} IndexEntry;

typedef struct
{
    int probes;
    int blockReads;
} IoCounters;

// Purpose: Sort the fixed input by primary key; ties keep input order.
// 作用：按主关键字升序排序，相等键保持输入次序，保证块内与块间有序。
static void SortRecords(Record *records, int count)
{
    for (int i = 1; i < count; i += 1)
    {
        Record current = records[i];
        int j = i - 1;
        while (j >= 0 && records[j].key > current.key)
        {
            records[j + 1] = records[j];
            j -= 1;
        }
        records[j + 1] = current;
    }
}

// Purpose: Split sorted records into fixed-capacity data blocks.
// 作用：把有序记录按块容量切块；块号就是索引项要保存的真实地址；块内顺序由排序保证。
static int BuildBlocks(const Record *records, int count, DataBlock *blocks)
{
    int blockCount = 0;
    for (int start = 0; start < count; start += BLOCK_CAPACITY)
    {
        int length = count - start;
        if (length > BLOCK_CAPACITY)
        {
            length = BLOCK_CAPACITY;
        }
        blocks[blockCount].length = length;
        for (int offset = 0; offset < length; offset += 1)
        {
            blocks[blockCount].records[offset] = records[start + offset];
        }
        blockCount += 1;
    }
    return blockCount;
}

// Dense emits one entry per record; sparse emits each block's last key as an upper bound, not the next block's first key.
// Purpose: Build a dense index (one record per entry) or a sparse index (one upper bound per block).
// 作用：稠密索引每记录一项；稀疏索引每块一项，使用该块最后一条记录的关键字作为上界。
static int BuildIndex(const DataBlock *blocks, int blockCount, int dense, IndexEntry *index)
{
    int count = 0;
    for (int block = 0; block < blockCount; block += 1)
    {
        if (dense)
        {
            for (int offset = 0; offset < blocks[block].length; offset += 1)
            {
                index[count].key = blocks[block].records[offset].key;
                index[count].blockIndex = block;
                count += 1;
            }
        }
        else
        {
            index[count].key = blocks[block].records[blocks[block].length - 1].key;
            index[count].blockIndex = block;
            count += 1;
        }
    }
    return count;
}

// Choose the last entry not greater than target: a sparse bound belongs to the block whose maximum it is.
// A miss still reads the selected block once, so success and failure are measured with the same I/O unit.
// Purpose: Probe entries, read exactly one block, and compare records inside.
// 作用：逐项检查索引，选不大于目标的最后一项；读一个数据块并在块内比较；失败同样计一次块读取。
static int Lookup(const DataBlock *blocks, const IndexEntry *index, int entryCount, int target, IoCounters *io)
{
    int chosen = 0;
    io->probes = 0;
    io->blockReads = 0;

    for (int position = 0; position < entryCount; position += 1)
    {
        io->probes += 1;
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
    io->blockReads = 1;
    printf("index chooses block B%d (key %d)\n", blockIndex, index[chosen].key);

    for (int offset = 0; offset < blocks[blockIndex].length; offset += 1)
    {
        const Record *record = &blocks[blockIndex].records[offset];
        printf("  compare block record %d (%s)\n", record->key, record->label);
        if (record->key == target)
        {
            return blockIndex * BLOCK_CAPACITY + offset;
        }
    }
    return -1;
}

int main(void)
{
    Record records[MAX_RECORDS] = {
        {101, "A"}, {102, "B"}, {103, "C"}, {104, "D"},
        {106, "F"}, {108, "H"}, {105, "E"}, {107, "G"}};
    const int count = 8;
    DataBlock blocks[MAX_BLOCKS];
    IndexEntry index[MAX_RECORDS];

    SortRecords(records, count);
    int blockCount = BuildBlocks(records, count, blocks);

    for (int dense = 1; dense >= 0; dense -= 1)
    {
        int entryCount = BuildIndex(blocks, blockCount, dense, index);
        printf("%s index (%d entries)\n", dense ? "dense" : "sparse", entryCount);
        IoCounters io;
        int found = Lookup(blocks, index, entryCount, 106, &io);
        printf("lookup 106: %s, index probes=%d, block reads=%d\n",
               found >= 0 ? "hit" : "miss", io.probes, io.blockReads);
    }

    int entryCount = BuildIndex(blocks, blockCount, 1, index);
    IoCounters io;
    int missing = Lookup(blocks, index, entryCount, 109, &io);
    printf("lookup 109: %s, index probes=%d, block reads=%d\n",
           missing >= 0 ? "hit" : "miss", io.probes, io.blockReads);
    return 0;
}


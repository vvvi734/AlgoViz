/*
 * 中文导读：ISAM 的主数据区按关键字有序分块，索引保存每块（含溢出链）的最大键。
 * 查找选第一个上界不小于目标的主块；扫主块后未命中，再沿该块专属溢出链继续。
 * 插入先选块：有空间就按序插入主区；块满则创建/追加溢出节点，维护 next 链接；
 * 若块最大键变化，索引上界也要刷新。最后必须真实重查新记录。
 * 易错点：上界当成下一块首键；主块命中仍读链；溢出链跨块；插入后索引未更新。
 * 复杂度：索引 O(E)，主块 O(B)，溢出链 O(C)；所有块访问都是教学模拟。
 * 输入/输出：6 条记录、主块容量 2；插入 105 进入 B2 溢出链，再查找并打印命中位置。
 */

/*
 * ISAM insertion and lookup in C11. Main blocks are ordered and capped at two
 * records. A full block sends the new record to its private overflow chain.
 */

#include <stdio.h>

#define MAX_RECORDS 18
#define MAX_BLOCKS 6
#define BLOCK_CAPACITY 2
#define MAX_OVERFLOW 5
#define OVERFLOW_CAPACITY 2

typedef struct
{
    int key;
    char label[8];
} Record;

typedef struct
{
    Record records[BLOCK_CAPACITY];
    int length;
    int overflowHead;
} MainBlock;

typedef struct
{
    Record records[OVERFLOW_CAPACITY];
    int length;
    int next;
} OverflowNode;

typedef struct
{
    MainBlock blocks[MAX_BLOCKS];
    int blockCount;
    int bounds[MAX_BLOCKS];
    OverflowNode overflow[MAX_OVERFLOW];
    int overflowCount;
    int mainReads;
    int overflowReads;
} IsamFile;

// Purpose: Insert one record into a sorted fixed array.
// 作用：在有序定长数组中按关键字插入一条记录，保持块内顺序。
static int InsertSorted(Record *records, int *length, int capacity, Record record)
{
    if (*length >= capacity)
    {
        return 0;
    }
    int position = *length;
    while (position > 0 && records[position - 1].key > record.key)
    {
        records[position] = records[position - 1];
        position -= 1;
    }
    records[position] = record;
    *length += 1;
    return 1;
}

// Purpose: Recompute a block's true maximum including its overflow chain.
// 作用：计算主块与全部溢出节点的真实最大键；索引上界不能凭空取新插入值。
static int BlockMaximum(const IsamFile *file, int blockIndex)
{
    int maximum = file->blocks[blockIndex].records[file->blocks[blockIndex].length - 1].key;
    int node = file->blocks[blockIndex].overflowHead;
    while (node >= 0)
    {
        const OverflowNode *current = &file->overflow[node];
        for (int offset = 0; offset < current->length; offset += 1)
        {
            if (current->records[offset].key > maximum)
            {
                maximum = current->records[offset].key;
            }
        }
        node = current->next;
    }
    return maximum;
}

// Purpose: Choose the first block whose bound is not below the target; if the
// target exceeds every bound, choose the last block.
// 作用：按上界选择主块；目标超过所有上界时落到最后一块，保证有确定检查点。
static int ChooseBlock(const IsamFile *file, int target)
{
    for (int block = 0; block < file->blockCount; block += 1)
    {
        if (file->bounds[block] >= target)
        {
            return block;
        }
    }
    return file->blockCount - 1;
}

// Purpose: Maintain the index after an insertion changed a block's maximum.
// 作用：插入后刷新索引上界；只在实际最大键变化时更新。
static void RefreshBounds(IsamFile *file)
{
    for (int block = 0; block < file->blockCount; block += 1)
    {
        file->bounds[block] = BlockMaximum(file, block);
    }
}

// Purpose: Look up a key through the main block and its private overflow chain.
// 作用：查找主块，未命中再沿专属溢出链继续，分别统计主区与溢出读取。
static int Lookup(IsamFile *file, int target, int *isOverflow)
{
    int blockIndex = ChooseBlock(file, target);
    file->mainReads += 1;
    printf("index bound %d selects B%d\n", file->bounds[blockIndex], blockIndex);

    const MainBlock *block = &file->blocks[blockIndex];
    for (int offset = 0; offset < block->length; offset += 1)
    {
        printf("  compare main record %d\n", block->records[offset].key);
        if (block->records[offset].key == target)
        {
            *isOverflow = 0;
            return blockIndex * BLOCK_CAPACITY + offset;
        }
    }

    int node = block->overflowHead;
    while (node >= 0)
    {
        file->overflowReads += 1;
        printf("  read overflow node O%d\n", node);
        for (int offset = 0; offset < file->overflow[node].length; offset += 1)
        {
            printf("    compare overflow record %d\n", file->overflow[node].records[offset].key);
            if (file->overflow[node].records[offset].key == target)
            {
                *isOverflow = 1;
                return node * OVERFLOW_CAPACITY + offset;
            }
        }
        node = file->overflow[node].next;
    }
    *isOverflow = 0;
    return -1;
}

// Purpose: Insert a record into the main block, or append it to that block's
// overflow chain when the main block is full.
// 作用：主块有空间按序插入；否则追加到该块专属溢出链，必要时新建节点。
static void Insert(IsamFile *file, Record record)
{
    int blockIndex = ChooseBlock(file, record.key);
    MainBlock *block = &file->blocks[blockIndex];
    if (InsertSorted(block->records, &block->length, BLOCK_CAPACITY, record))
    {
        printf("insert %d into main block B%d\n", record.key, blockIndex);
        RefreshBounds(file);
        return;
    }

    printf("main block B%d is full; insert %d into overflow\n", blockIndex, record.key);
    if (block->overflowHead < 0)
    {
        block->overflowHead = file->overflowCount;
        file->overflow[file->overflowCount].length = 0;
        file->overflow[file->overflowCount].next = -1;
        file->overflowCount += 1;
        printf("set B%d overflowHead = O%d\n", blockIndex, block->overflowHead);
    }

    int node = block->overflowHead;
    while (file->overflow[node].next >= 0)
    {
        node = file->overflow[node].next;
    }
    if (file->overflow[node].length >= OVERFLOW_CAPACITY)
    {
        file->overflow[file->overflowCount].length = 0;
        file->overflow[file->overflowCount].next = -1;
        file->overflow[node].next = file->overflowCount;
        printf("link O%d -> O%d\n", node, file->overflowCount);
        node = file->overflowCount;
        file->overflowCount += 1;
    }
    InsertSorted(file->overflow[node].records, &file->overflow[node].length,
                 OVERFLOW_CAPACITY, record);
    RefreshBounds(file);
}

int main(void)
{
    IsamFile file = {0};
    file.mainReads = 0;
    file.overflowReads = 0;
    file.overflowCount = 0;

    Record input[] = {{101, "A"}, {102, "B"}, {103, "C"},
                      {104, "D"}, {106, "F"}, {108, "H"}};
    int count = 6;
    for (int start = 0; start < count; start += BLOCK_CAPACITY)
    {
        int blockIndex = file.blockCount;
        file.blocks[blockIndex].length = 0;
        file.blocks[blockIndex].overflowHead = -1;
        for (int offset = 0; offset < BLOCK_CAPACITY && start + offset < count; offset += 1)
        {
            file.blocks[blockIndex].records[offset] = input[start + offset];
            file.blocks[blockIndex].length += 1;
        }
        file.blockCount += 1;
    }
    RefreshBounds(&file);

    Insert(&file, (Record){105, "E"});
    int isOverflow = 0;
    int found = Lookup(&file, 105, &isOverflow);
    printf("lookup 105: %s in %s, main reads=%d, overflow reads=%d\n",
           found >= 0 ? "hit" : "miss",
           isOverflow ? "overflow" : "main area",
           file.mainReads, file.overflowReads);
    return 0;
}

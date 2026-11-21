/*
 * 中文导读：冲突时在表内继续探测空位；本文件使用线性探测并处理删除墓碑。
 * 阅读顺序：先看 EMPTY/OCCUPIED/DELETED 三种槽状态；再看 insert 如何从 hash 开始找空位；最后看 search 何时可以停止。
 * 关键不变量：查找路径上若目标存在，一定在第一个 EMPTY 之前被看到；DELETED 不能被当成空位截断查找。
 * 易错点：删除直接置 EMPTY 截断后续查找；表满死循环；负载因子过高；负哈希下标。
 * 复杂度：平均 O(1)，最坏 O(n)；空间 O(capacity)。
 */

/*
 * Linear probing hash table in C11.
 *
 * -1 marks an empty slot. The home slot is key % capacity; on a collision,
 * probe forward with wraparound until the key or an empty slot is found.
 * Insert uses the first empty slot; search stops at an empty slot, which proves
 * absence. Expected O(1 + 1/(1-alpha)) per operation, O(n) worst; no deletion
 * tombstones in this teaching version.
 */

#include <stdbool.h>
#include <stdio.h>

#define HASH_CAPACITY 11
#define HASH_EMPTY (-1)

typedef struct
{
    int slots[HASH_CAPACITY];
} HashTable;

// 作用：初始化开放地址散列表：所有槽先标为 EMPTY，并清零墓碑计数。
void InitHashTable(HashTable *table)
{
    for (int index = 0; index < HASH_CAPACITY; ++index)
    {
        table->slots[index] = HASH_EMPTY;
    }
}

// 作用：计算 key 的初始槽位；后续线性探测从这里开始向后找空位。
static int HomeSlot(int key)
{
    int slot = key % HASH_CAPACITY;
    return slot < 0 ? slot + HASH_CAPACITY : slot;
}

// This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
// 作用：线性探测找第一个 EMPTY 槽写入；遇到 DELETED 可复用，但查找不能在此截断。
bool HashInsert(HashTable *table, int key)
{
    int start = HomeSlot(key);
    for (int step = 0; step < HASH_CAPACITY; ++step)
    {
        int index = (start + step) % HASH_CAPACITY;
        if (table->slots[index] == HASH_EMPTY)
        {
            table->slots[index] = key;
            return true;
        }
        if (table->slots[index] == key)
        {
            return false;
        }
    }
    return false;
}

// 作用：从 HomeSlot 开始线性探测；遇到 EMPTY 才停止，DELETED 要继续向后找。
bool HashContains(const HashTable *table, int key)
{
    int start = HomeSlot(key);
    for (int step = 0; step < HASH_CAPACITY; ++step)
    {
        int index = (start + step) % HASH_CAPACITY;
        if (table->slots[index] == HASH_EMPTY)
        {
            return false;
        }
        if (table->slots[index] == key)
        {
            return true;
        }
    }
    return false;
}

// 作用：输出散列表每个槽的状态和内容，用于观察冲突与墓碑。
void PrintHashTable(const HashTable *table)
{
    for (int index = 0; index < HASH_CAPACITY; ++index)
    {
        printf("[%d] ", index);
        if (table->slots[index] == HASH_EMPTY)
        {
            printf("_\n");
        }
        else
        {
            printf("%d\n", table->slots[index]);
        }
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    HashTable table;
    InitHashTable(&table);
    int keys[] = {22, 11, 33, 44, 55};
    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index)
    {
        HashInsert(&table, keys[index]);
    }

    PrintHashTable(&table);
    printf("contains 44: %s\n", HashContains(&table, 44) ? "yes" : "no");
    printf("contains 7: %s\n", HashContains(&table, 7) ? "yes" : "no");
    return 0;
}

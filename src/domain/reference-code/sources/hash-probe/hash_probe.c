/*
 * 中文导读：冲突时在表内继续探测空位；本文件使用线性探测，但教学版本不实现删除，因此没有墓碑状态。
 * 阅读顺序：先看 EMPTY 与“非空键值”两种槽状态；再看 insert 如何从 hash 开始找空位；最后看 search 为何遇到 EMPTY 才停止。
 * 关键不变量：查找路径上若目标存在，一定在第一个 EMPTY 之前被看到；本版本不删除，EMPTY 是唯一终止标记。
 * 易错点：删除直接置 EMPTY 截断后续查找；表满死循环；负载因子过高；负哈希下标。
 * 复杂度：平均 O(1)，最坏 O(n)；空间 O(capacity)。
 * 输入/输出：输入非负整数 key 的插入/查找序列；操作返回布尔；main 打印槽的空/占用状态。
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

// Purpose: Initialize open addressing by marking every slot EMPTY; this version keeps no tombstone or deletion counter.
// 作用：初始化开放地址散列表：所有槽标为 EMPTY；本版本没有墓碑，也没有删除计数字段。
void InitHashTable(HashTable *table)
{
    for (int index = 0; index < HASH_CAPACITY; ++index)
    {
        table->slots[index] = HASH_EMPTY;
    }
}

// Purpose: Compute key's initial slot; linear probing starts there and scans forward for a free slot.
// 作用：计算 key 的初始槽位；后续线性探测从这里开始向后找空位。
static int HomeSlot(int key)
{
    int slot = key % HASH_CAPACITY;
    return slot < 0 ? slot + HASH_CAPACITY : slot;
}

// This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
// Purpose: Find the first EMPTY slot by linear probing and write there; duplicates are rejected, and no DELETED state exists here.
// 作用：线性探测找第一个 EMPTY 槽写入；重复键拒绝；本版本没有 DELETED 状态。
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

// Purpose: Start linear probing at HomeSlot and stop only at EMPTY; without deletion, EMPTY alone proves absence.
// 作用：从 HomeSlot 开始线性探测，遇到 EMPTY 才停止；本版本没有删除，因此 EMPTY 足以证明不存在。
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

// Purpose: Print every slot as empty or occupied with its key to observe collisions; read-only.
// 作用：输出每个槽是空还是占用及其键值，用于观察冲突；只读。
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

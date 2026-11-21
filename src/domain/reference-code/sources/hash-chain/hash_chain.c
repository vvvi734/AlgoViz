/*
 * 中文导读：每个桶挂一条链表，冲突的元素共享同一个桶但保留为独立结点。
 * 阅读顺序：先看 hash 函数和桶数组；再看 insert 为什么先查重；最后看 remove 如何跨过待删结点重接链表。
 * 关键不变量：同一个键最多出现一次；每个结点只属于其哈希值对应的桶。
 * 易错点：删除头结点不更新桶指针；哈希为负未取模；扩容后没有重新散列；比较键时只比哈希值。
 * 复杂度：平均 O(1)，最坏 O(n)（全部冲突）；空间 O(n+buckets)。
 */

/*
 * AlgoViz reference implementation: hash table with chained buckets.
 * Each bucket is a singly linked list; collisions append to the same chain.
 *
 * Reading guide:
 * 1. Map a key to bucket key % table_size.
 * 2. Each bucket is a chain of nodes holding colliding keys.
 * 3. Insert rejects duplicates; search scans only the target bucket's chain.
 *
 * Complexity: Expected time: O(1 + alpha) per operation, O(n) worst; extra space O(n
 *   + table_size).
 * Convention: Non-negative integer keys; table size is fixed at compile/construction
 *   time.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define TABLE_SIZE 7

typedef struct Node
{
    int key;
    struct Node *next;
} Node;

typedef struct
{
    Node *buckets[TABLE_SIZE];
} HashTable;

// 作用：初始化链地址散列表：所有桶头指针置空。
void table_init(HashTable *table)
{
    for (int i = 0; i < TABLE_SIZE; ++i)
    {
        table->buckets[i] = NULL;
    }
}

// 作用：把 key 映射到 0..bucket_count-1 的桶下标；负键要先转成非负。
int hash_index(int key)
{
    int index = key % TABLE_SIZE;
    return index < 0 ? index + TABLE_SIZE : index;
}

// Search the target bucket before appending; the chain holds only colliding keys.
// Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.
// 作用：头插到对应桶；先查重，重复键返回 false。
bool table_insert(HashTable *table, int key)
{
    int index = hash_index(key);
    for (Node *node = table->buckets[index]; node != NULL; node = node->next)
    {
        if (node->key == key)
        {
            return false;
        }
    }
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL)
    {
        return false;
    }
    node->key = key;
    node->next = table->buckets[index];
    table->buckets[index] = node;
    return true;
}

// 作用：只读遍历目标桶，比较真实键而不是只比较哈希值。
bool table_contains(const HashTable *table, int key)
{
    int index = hash_index(key);
    for (const Node *node = table->buckets[index]; node != NULL; node = node->next)
    {
        if (node->key == key)
        {
            return true;
        }
    }
    return false;
}

// 作用：逐桶输出链地址散列表的内容，用于观察冲突链；只读。
void table_print(const HashTable *table)
{
    for (int i = 0; i < TABLE_SIZE; ++i)
    {
        printf("[%d]", i);
        for (const Node *node = table->buckets[i]; node != NULL; node = node->next)
        {
            printf(" -> %d", node->key);
        }
        printf("\n");
    }
}

// 作用：释放所有桶中的结点，再把桶头置空，避免内存泄漏。
void table_free(HashTable *table)
{
    for (int i = 0; i < TABLE_SIZE; ++i)
    {
        Node *node = table->buckets[i];
        while (node != NULL)
        {
            Node *next = node->next;
            free(node);
            node = next;
        }
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    HashTable table;
    table_init(&table);
    int keys[] = {15, 22, 8, 29, 36, 50};
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i)
    {
        table_insert(&table, keys[i]);
    }
    table_print(&table);
    printf("contains 29: %s\n", table_contains(&table, 29) ? "yes" : "no");
    printf("contains 7: %s\n", table_contains(&table, 7) ? "yes" : "no");
    table_free(&table);
    return 0;
}

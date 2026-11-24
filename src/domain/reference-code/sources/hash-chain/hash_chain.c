/*
 * 中文导读：每个桶挂一条链表，冲突的元素共享同一个桶但保留为独立结点。
 * 阅读顺序：先看 hash 函数和桶数组；再看 insert 为什么先查重；最后看 table_free 如何释放结点（本版本不提供 remove）。
 * 关键不变量：同一个键最多出现一次；每个结点只属于其哈希值对应的桶。
 * 易错点：释放后误以为桶头已清空；哈希为负未归一；扩容后没有重新散列；比较键时只比哈希值。
 * 复杂度：平均 O(1)，最坏 O(n)（全部冲突）；空间 O(n+buckets)。
 * 输入/输出：输入非负整数 key 的插入/查找序列；操作返回布尔值；main 打印桶链状态；不提供删除。
*/

/*
 * AlgoViz reference implementation: hash table with chained buckets.
 * Each bucket is a singly linked list; collisions share the same chain, and a new node is prepended at the bucket head.
 *
 * Reading guide:
 * 1. Map a key to bucket key % table_size.
 * 2. Each bucket is a chain of nodes holding colliding keys.
 * 3. Insert rejects duplicates; search scans only the target bucket's chain.
 *
 * Complexity: Expected time: O(1 + alpha) per operation, O(n) worst; extra space O(n
 *   + table_size).
 * Convention: Non-negative integer keys; table size is fixed at compile/construction
 *   time. This C demo implements insert and lookup only; remove is not provided.
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

// Purpose: Initialize the chained hash table by clearing every bucket head.
// 作用：初始化链地址散列表：所有桶头指针置空。
// The table has a fixed bucket array; initialization only clears heads, and this version never resizes or rehashes existing keys.
void table_init(HashTable *table)
{
    for (int i = 0; i < TABLE_SIZE; ++i)
    {
        table->buckets[i] = NULL;
    }
}

// Purpose: Map key to a bucket index in 0..bucket_count-1; convert negative keys to a non-negative value first.
// 作用：把 key 映射到 0..bucket_count-1 的桶下标；负键要先转成非负。
int hash_index(int key)
{
    // C's remainder can be negative, so the conditional adds TABLE_SIZE; without it a negative key would index outside the bucket array.
    int index = key % TABLE_SIZE;
    return index < 0 ? index + TABLE_SIZE : index;
}

// Search the target bucket before appending; the chain holds only colliding keys.
// Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.
// Purpose: Insert at the bucket head after checking for duplicates; return false for an existing key.
// 作用：头插到对应桶；先查重，重复键返回 false。
bool table_insert(HashTable *table, int key)
{
    int index = hash_index(key);
    // The duplicate test scans the entire target chain before allocation; a colliding duplicate may sit behind several nodes, not only at the head.
    for (Node *node = table->buckets[index]; node != NULL; node = node->next)
    {
        if (node->key == key)
        {
            return false;
        }
    }
    // A failed allocation returns false, the same value used for a duplicate; the caller cannot distinguish out-of-memory from an existing key in this API.
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL)
    {
        return false;
    }
    node->key = key;
    // Head insertion is O(1): the new node points at the old head, then the bucket head is republished; chain order becomes reverse insertion order.
    node->next = table->buckets[index];
    table->buckets[index] = node;
    return true;
}

// Purpose: Traverse the target bucket and compare real keys rather than only hash values.
// 作用：只读遍历目标桶，比较真实键而不是只比较哈希值。
// Only the target bucket can hold this key because every insertion uses the same hash index; an empty bucket is a proof of absence for this fixed table.
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

// Purpose: Print the chained hash table bucket by bucket to observe collision chains; read-only.
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

// Purpose: Free every node in every bucket and clear the head so the table is safe for reuse.
// 作用：释放所有桶中的结点，并把桶头清空，使表可安全复用。
void table_free(HashTable *table)
{
    // Clearing the head is part of the operation: leaving it pointing at freed memory turns a later contains() into a use-after-free.
    for (int i = 0; i < TABLE_SIZE; ++i)
    {
        Node *node = table->buckets[i];
        while (node != NULL)
        {
            // next is saved before free because freeing node would make node->next unreadable; the loop must advance through the saved pointer.
            Node *next = node->next;
            free(node);
            node = next;
        }
        table->buckets[i] = NULL;
    }
}

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

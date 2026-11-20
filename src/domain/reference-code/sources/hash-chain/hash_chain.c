/*
 * 教材素材说明
 * 用户提供的《数据结构与算法（Windows版）》未包含本算法的对应实现。
 * 本文件保留 AlgoViz 原创 C 实现与现有注释，未冒充教材原文。
 */

/*
 * AlgoViz reference implementation: hash table with chained buckets.
 * Original code written for this repository under the MIT License.
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

typedef struct Node {
    int key;
    struct Node *next;
} Node;

typedef struct {
    Node *buckets[TABLE_SIZE];
} HashTable;

void table_init(HashTable *table) {
    for (int i = 0; i < TABLE_SIZE; ++i) {
        table->buckets[i] = NULL;
    }
}

int hash_index(int key) {
    int index = key % TABLE_SIZE;
    return index < 0 ? index + TABLE_SIZE : index;
}

// Search the target bucket before appending; the chain holds only colliding keys.
bool table_insert(HashTable *table, int key) {
    int index = hash_index(key);
    for (Node *node = table->buckets[index]; node != NULL; node = node->next) {
        if (node->key == key) {
            return false;
        }
    }
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL) {
        return false;
    }
    node->key = key;
    node->next = table->buckets[index];
    table->buckets[index] = node;
    return true;
}

bool table_contains(const HashTable *table, int key) {
    int index = hash_index(key);
    for (const Node *node = table->buckets[index]; node != NULL; node = node->next) {
        if (node->key == key) {
            return true;
        }
    }
    return false;
}

void table_print(const HashTable *table) {
    for (int i = 0; i < TABLE_SIZE; ++i) {
        printf("[%d]", i);
        for (const Node *node = table->buckets[i]; node != NULL; node = node->next) {
            printf(" -> %d", node->key);
        }
        printf("\n");
    }
}

void table_free(HashTable *table) {
    for (int i = 0; i < TABLE_SIZE; ++i) {
        Node *node = table->buckets[i];
        while (node != NULL) {
            Node *next = node->next;
            free(node);
            node = next;
        }
    }
}

int main(void) {
    HashTable table;
    table_init(&table);
    int keys[] = {15, 22, 8, 29, 36, 50};
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i) {
        table_insert(&table, keys[i]);
    }
    table_print(&table);
    printf("contains 29: %s\n", table_contains(&table, 29) ? "yes" : "no");
    printf("contains 7: %s\n", table_contains(&table, 7) ? "yes" : "no");
    table_free(&table);
    return 0;
}

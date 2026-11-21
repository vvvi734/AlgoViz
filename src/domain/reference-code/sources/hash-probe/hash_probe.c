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

typedef struct {
    int slots[HASH_CAPACITY];
} HashTable;

void InitHashTable(HashTable *table)
{
    for (int index = 0; index < HASH_CAPACITY; ++index) {
        table->slots[index] = HASH_EMPTY;
    }
}

static int HomeSlot(int key)
{
    int slot = key % HASH_CAPACITY;
    return slot < 0 ? slot + HASH_CAPACITY : slot;
}

// This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
bool HashInsert(HashTable *table, int key)
{
    int start = HomeSlot(key);
    for (int step = 0; step < HASH_CAPACITY; ++step) {
        int index = (start + step) % HASH_CAPACITY;
        if (table->slots[index] == HASH_EMPTY) {
            table->slots[index] = key;
            return true;
        }
        if (table->slots[index] == key) {
            return false;
        }
    }
    return false;
}

bool HashContains(const HashTable *table, int key)
{
    int start = HomeSlot(key);
    for (int step = 0; step < HASH_CAPACITY; ++step) {
        int index = (start + step) % HASH_CAPACITY;
        if (table->slots[index] == HASH_EMPTY) {
            return false;
        }
        if (table->slots[index] == key) {
            return true;
        }
    }
    return false;
}

void PrintHashTable(const HashTable *table)
{
    for (int index = 0; index < HASH_CAPACITY; ++index) {
        printf("[%d] ", index);
        if (table->slots[index] == HASH_EMPTY) {
            printf("_\n");
        } else {
            printf("%d\n", table->slots[index]);
        }
    }
}

int main(void)
{
    HashTable table;
    InitHashTable(&table);
    int keys[] = {22, 11, 33, 44, 55};
    for (int index = 0; index < (int)(sizeof(keys) / sizeof(keys[0])); ++index) {
        HashInsert(&table, keys[index]);
    }

    PrintHashTable(&table);
    printf("contains 44: %s\n", HashContains(&table, 44) ? "yes" : "no");
    printf("contains 7: %s\n", HashContains(&table, 7) ? "yes" : "no");
    return 0;
}

/*
 * AlgoViz reference implementation: open-addressing hash table with linear probing.
 * Original code written for this repository under the MIT License.
 * -1 marks an empty slot; insert and search probe forward with wraparound.
 */

#include <stdbool.h>
#include <stdio.h>

#define TABLE_SIZE 11
#define EMPTY (-1)

int hash_index(int key) {
    int index = key % TABLE_SIZE;
    return index < 0 ? index + TABLE_SIZE : index;
}

bool table_insert(int table[TABLE_SIZE], int key) {
    int start = hash_index(key);
    for (int step = 0; step < TABLE_SIZE; ++step) {
        int index = (start + step) % TABLE_SIZE;
        if (table[index] == EMPTY) {
            table[index] = key;
            return true;
        }
        if (table[index] == key) {
            return false;
        }
    }
    return false;
}

bool table_contains(const int table[TABLE_SIZE], int key) {
    int start = hash_index(key);
    for (int step = 0; step < TABLE_SIZE; ++step) {
        int index = (start + step) % TABLE_SIZE;
        if (table[index] == EMPTY) {
            return false;
        }
        if (table[index] == key) {
            return true;
        }
    }
    return false;
}

void table_print(const int table[TABLE_SIZE]) {
    for (int i = 0; i < TABLE_SIZE; ++i) {
        if (table[i] == EMPTY) {
            printf("[%d] _\n", i);
        } else {
            printf("[%d] %d\n", i, table[i]);
        }
    }
}

int main(void) {
    int table[TABLE_SIZE];
    for (int i = 0; i < TABLE_SIZE; ++i) {
        table[i] = EMPTY;
    }

    int keys[] = {22, 11, 33, 44, 55};
    for (size_t i = 0; i < sizeof(keys) / sizeof(keys[0]); ++i) {
        table_insert(table, keys[i]);
    }
    table_print(table);
    printf("contains 44: %s\n", table_contains(table, 44) ? "yes" : "no");
    printf("contains 7: %s\n", table_contains(table, 7) ? "yes" : "no");
    return 0;
}

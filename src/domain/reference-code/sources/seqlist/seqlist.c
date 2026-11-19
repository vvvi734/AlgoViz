/*
 * AlgoViz reference implementation: sequential list.
 * Original code written for this repository under the MIT License.
 * Fixed-capacity array with manual shifting in insert and erase.
 */

#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

#define SEQLIST_CAPACITY 8

typedef struct {
    int items[SEQLIST_CAPACITY];
    int length;
} SeqList;

void seq_init(SeqList *list) {
    list->length = 0;
}

bool seq_insert(SeqList *list, int index, int value) {
    if (list->length >= SEQLIST_CAPACITY || index < 0 || index > list->length) {
        return false;
    }
    for (int i = list->length; i > index; --i) {
        list->items[i] = list->items[i - 1];
    }
    list->items[index] = value;
    ++list->length;
    return true;
}

bool seq_erase(SeqList *list, int index, int *out_value) {
    if (index < 0 || index >= list->length) {
        return false;
    }
    *out_value = list->items[index];
    for (int i = index; i < list->length - 1; ++i) {
        list->items[i] = list->items[i + 1];
    }
    --list->length;
    return true;
}

void seq_print(const SeqList *list) {
    for (int i = 0; i < list->length; ++i) {
        printf("%d%s", list->items[i], i + 1 == list->length ? "" : " ");
    }
    printf("\n");
}

int main(void) {
    SeqList list;
    seq_init(&list);
    seq_insert(&list, 0, 1);
    seq_insert(&list, 1, 3);
    seq_insert(&list, 1, 2);
    seq_insert(&list, 3, 4);
    printf("after inserts: ");
    seq_print(&list);

    int removed = 0;
    seq_erase(&list, 1, &removed);
    printf("removed: %d\n", removed);
    printf("after erase: ");
    seq_print(&list);

    printf("insert at 9: %s\n", seq_insert(&list, 9, 5) ? "ok" : "rejected");
    return 0;
}

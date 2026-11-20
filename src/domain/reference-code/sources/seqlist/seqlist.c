/*
 * Sequential list in C11.
 *
 * Values occupy a contiguous array and length is the number of valid slots.
 * Insertion shifts [index, length) one slot right, then writes the new value.
 * Erasure shifts (index, length) one slot left and decreases length.
 * Indexed access is O(1); insert and erase are O(n) worst case.
 */

#include <stdbool.h>
#include <stdio.h>

#define LIST_CAPACITY 8

typedef struct {
    int values[LIST_CAPACITY];
    int length;
} SeqList;

void InitList(SeqList *list)
{
    list->length = 0;
}

bool ListInsert(SeqList *list, int index, int value)
{
    if (list->length == LIST_CAPACITY || index < 0 || index > list->length) {
        return false;
    }
    for (int position = list->length; position > index; --position) {
        list->values[position] = list->values[position - 1];
    }
    list->values[index] = value;
    ++list->length;
    return true;
}

bool ListErase(SeqList *list, int index, int *removed)
{
    if (index < 0 || index >= list->length) {
        return false;
    }
    *removed = list->values[index];
    for (int position = index; position + 1 < list->length; ++position) {
        list->values[position] = list->values[position + 1];
    }
    --list->length;
    return true;
}

void PrintList(const SeqList *list)
{
    for (int index = 0; index < list->length; ++index) {
        printf("%d%s", list->values[index], index + 1 == list->length ? "\n" : " ");
    }
}

int main(void)
{
    SeqList list;
    InitList(&list);
    ListInsert(&list, 0, 1);
    ListInsert(&list, 1, 3);
    ListInsert(&list, 1, 2);
    ListInsert(&list, 3, 4);

    printf("after inserts: ");
    PrintList(&list);

    int removed = 0;
    if (ListErase(&list, 1, &removed)) {
        printf("removed: %d\n", removed);
    }
    printf("after erase: ");
    PrintList(&list);
    printf("insert at 9: %s\n", ListInsert(&list, 9, 5) ? "ok" : "rejected");
    return 0;
}

/*
 * 中文导读：用连续数组和 length 保存线性表，随机访问 O(1)，中间插入删除要搬移元素。
 * 阅读顺序：先看 data/length/capacity；再看下标合法性检查；最后看插入时从后往前搬、删除时从前往后搬。
 * 关键不变量：有效元素在 data[0..length)，length <= capacity；下标 i 的合法范围由 length 决定。
 * 易错点：把 capacity 当 length；插入从前往后搬覆盖数据；删除漏搬最后一个；length 与搬移顺序不同步。
 * 复杂度：访问 O(1)，按位置插删 O(n)，空间 O(capacity)。
 * 输入/输出：输入容量与演示操作序列；插入/删除返回成功，查找返回下标；main 打印表内容。
*/

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

typedef struct
{
    int values[LIST_CAPACITY];
    int length;
} SeqList;

void InitList(SeqList *list)
{
    list->length = 0;
}

// `length` is the live element count, not capacity; insert/erase shift only the live range and then update it.
bool ListInsert(SeqList *list, int index, int value)
{
    // Insertion accepts index == length as append, but rejects length == capacity: the legal range is bounded by both the live count and the physical array.
    if (list->length == LIST_CAPACITY || index < 0 || index > list->length)
    {
        return false;
    }
    // Copy backwards from the tail; moving from index upward would overwrite values that still have to be shifted.
    for (int position = list->length; position > index; --position)
    {
        list->values[position] = list->values[position - 1];
    }
    list->values[index] = value;
    // Publish the new element only after values[index] is written; length is the boundary every traversal trusts.
    ++list->length;
    return true;
}

bool ListErase(SeqList *list, int index, int *removed)
{
    if (index < 0 || index >= list->length)
    {
        return false;
    }
    // Save the removed value before the shift overwrites its slot; the caller still receives the original element.
    *removed = list->values[index];
    // Copy forward from index+1; each write fills the hole left by the previous copy, and the last slot becomes dead.
    for (int position = index; position + 1 < list->length; ++position)
    {
        list->values[position] = list->values[position + 1];
    }
    --list->length;
    return true;
}

void PrintList(const SeqList *list)
{
    // Print exactly [0, length): slots from length to capacity-1 are allocated but not part of the list.
    for (int index = 0; index < list->length; ++index)
    {
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
    if (ListErase(&list, 1, &removed))
    {
        printf("removed: %d\n", removed);
    }
    printf("after erase: ");
    PrintList(&list);
    printf("insert at 9: %s\n", ListInsert(&list, 9, 5) ? "ok" : "rejected");
    return 0;
}

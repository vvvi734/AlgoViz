/*
 * 中文导读：用连续数组和 length 保存线性表，随机访问 O(1)，中间插入删除要搬移元素。
 * 阅读顺序：先看 data/length/capacity；再看下标合法性检查；最后看插入时从后往前搬、删除时从前往后搬。
 * 关键不变量：有效元素在 data[0..length)，length <= capacity；下标 i 的合法范围由 length 决定。
 * 易错点：把 capacity 当 length；插入从前往后搬覆盖数据；删除漏搬最后一个；length 与搬移顺序不同步。
 * 复杂度：访问 O(1)，按位置插删 O(n)，空间 O(capacity)。
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

// 作用：初始化顺序表：把 length 置 0，容量保持不变。
void InitList(SeqList *list)
{
    list->length = 0;
}

// `length` is the live element count, not capacity; insert/erase shift only the live range and then update it.
// 作用：在下标 index 前插入 value；先检查 index 范围和容量，再从后往前搬移。
bool ListInsert(SeqList *list, int index, int value)
{
    if (list->length == LIST_CAPACITY || index < 0 || index > list->length)
    {
        return false;
    }
    for (int position = list->length; position > index; --position)
    {
        list->values[position] = list->values[position - 1];
    }
    list->values[index] = value;
    ++list->length;
    return true;
}

// 作用：删除下标 index 的元素；先保存值，再从前往后搬移覆盖空位并减小 length。
bool ListErase(SeqList *list, int index, int *removed)
{
    if (index < 0 || index >= list->length)
    {
        return false;
    }
    *removed = list->values[index];
    for (int position = index; position + 1 < list->length; ++position)
    {
        list->values[position] = list->values[position + 1];
    }
    --list->length;
    return true;
}

// 作用：只读遍历并输出链表；不修改 head 或结点链接。
void PrintList(const SeqList *list)
{
    for (int index = 0; index < list->length; ++index)
    {
        printf("%d%s", list->values[index], index + 1 == list->length ? "\n" : " ");
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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

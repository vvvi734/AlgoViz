/*
 * 中文导读：用数组下标代替指针，在固定数组中维护数据链表和空闲链表。
 * 阅读顺序：先看 StaticNode 的 data/cur 与两个头游标；再看 static_init 如何串空闲链表、static_insert 如何借结点；最后看插入删除只改游标。
 * 关键不变量：数据链表和空闲链表互不重叠，合起来覆盖所有数组槽；cur=NULL_INDEX（-1）表示结束。
 * 易错点：游标 -1/0 混用；分配后忘记更新空闲头；删除结点没回收；数组满仍分配；把下标当真实地址。
 * 复杂度：按位置插删需先 O(n) 找前驱；已知前驱时改游标 O(1)，空间 O(capacity)。
 * 输入/输出：输入固定容量 8 的初始值序列与演示操作；插入/删除返回成功，遍历返回逻辑顺序；main 打印 data/cur。
*/

/*
 * Static linked list — independent teaching implementation.
 * 静态链表——独立教学实现。
 *
 * Nodes live in one fixed array. `data` holds the element and `cur` holds the
 * successor's array index. NULL_INDEX (-1) is this implementation's null cursor;
 * many textbook versions reserve slot 0 as a header, so never assume that index
 * 0 always means null.
 *
 * 结点存放在固定数组中：data 保存元素，cur 保存后继下标。-1 是本实现的空游标；
 * 教材常见做法保留 0 号单元作头结点，因此不能把“下标 0 一定是空”当成通用规则。
 *
 * Compile: cc -std=c11 -Wall -Wextra static_linked_list.c -o static_list
 */
#include <stdio.h>

#define CAPACITY 8
#define NULL_INDEX (-1)

typedef struct
{
    int data;
    int cur;
} StaticNode;

typedef struct
{
    StaticNode nodes[CAPACITY];
    int head;
    int free_head;
} StaticList;

/* Build the live chain in logical order, then chain every remaining cell. */
// Purpose: Build a static list from the given values by chaining the data list first and the leftover slots into the free list.
// 作用：用给定值建立静态链表：先串数据链表，再把剩余槽串成空闲链表。
static void static_init(StaticList *list, const int *values, int count)
{
    int i;
    list->head = NULL_INDEX;
    list->free_head = NULL_INDEX;
    for (i = 0; i < CAPACITY; ++i)
    {
        list->nodes[i].data = 0;
        list->nodes[i].cur = NULL_INDEX;
    }
    if (count > CAPACITY)
        count = CAPACITY;

    for (i = 0; i < count; ++i)
    { /* live prefix */
        list->nodes[i].data = values[i];
        list->nodes[i].cur = (i + 1 < count) ? i + 1 : NULL_INDEX;
    }
    if (count > 0)
        list->head = 0;

    for (i = count; i < CAPACITY; ++i)
    { /* free suffix */
        list->nodes[i].cur = (i + 1 < CAPACITY) ? i + 1 : NULL_INDEX;
    }
    if (count < CAPACITY)
        list->free_head = count;
}

// Purpose: Count live elements by following cur from the data-list head.
// 作用：从数据链表头沿 cur 计数，返回当前有效元素个数。
static int static_length(const StaticList *list)
{
    int count = 0;
    int current = list->head;
    while (current != NULL_INDEX)
    {
        ++count;
        current = list->nodes[current].cur;
    }
    return count;
}

// Purpose: Return the cursor preceding position; position 0 returns the head cursor.
// 作用：返回位置 position 的前驱游标；position=0 时返回头游标。
static int static_predecessor(const StaticList *list, int position)
{
    int step;
    int previous;
    if (position == 1)
        return NULL_INDEX; /* 1-based logical position */
    previous = list->head;
    for (step = 1; step < position - 1; ++step)
    {
        previous = list->nodes[previous].cur;
    }
    return previous;
}

/* Insert at 1-based logical position. Returns 0 on failure, 1 on success. */
// Purpose: Insert value before position by allocating a free node, then relinking the predecessor's cur; return success or failure.
// 作用：在 position 前插入 value：先分配空闲结点，再改前驱 cur；返回成功/失败。
// Keep the successor first, then redirect the predecessor.
static int static_insert(StaticList *list, int position, int value)
{
    int length = static_length(list);
    int new_index;
    int previous;
    int successor;

    if (position < 1 || position > length + 1)
        return 0; /* precondition */
    if (list->free_head == NULL_INDEX)
        return 0; /* capacity exhausted */

    new_index = list->free_head;
    list->free_head = list->nodes[new_index].cur; /* borrow from free chain */

    list->nodes[new_index].data = value;
    list->nodes[new_index].cur = NULL_INDEX;

    previous = static_predecessor(list, position);
    successor = (previous == NULL_INDEX) ? list->head : list->nodes[previous].cur;

    list->nodes[new_index].cur = successor;
    if (previous == NULL_INDEX)
    {
        list->head = new_index;
    }
    else
    {
        list->nodes[previous].cur = new_index;
    }
    return 1;
}

/* Delete at 1-based logical position. Returns 0 if the position is invalid. */
// Purpose: Delete the node at position by linking its predecessor to its successor, then recycle the node into the free list.
// 作用：删除 position 位置结点：把前驱 cur 指向后继，再把结点归还空闲链表。
static int static_delete(StaticList *list, int position, int *removed)
{
    int length = static_length(list);
    int previous;
    int target;
    int successor;

    if (position < 1 || position > length)
        return 0;

    previous = static_predecessor(list, position);
    target = (previous == NULL_INDEX) ? list->head : list->nodes[previous].cur;
    successor = list->nodes[target].cur;
    if (removed != NULL)
        *removed = list->nodes[target].data;

    /* Unlink from the live chain. */
    if (previous == NULL_INDEX)
    {
        list->head = successor;
    }
    else
    {
        list->nodes[previous].cur = successor;
    }

    /* Recycle: the target becomes the new front of the free chain. */
    list->nodes[target].data = 0;
    list->nodes[target].cur = list->free_head;
    list->free_head = target;
    return 1;
}

// Purpose: Print every element along the data-list cur cursors; read-only.
// 作用：沿数据链表 cur 游标输出全部元素；只读。
static void static_traverse(const StaticList *list)
{
    int current = list->head;
    printf("logical:");
    while (current != NULL_INDEX)
    {
        printf(" [%d]=%d", current, list->nodes[current].data);
        current = list->nodes[current].cur;
    }
    printf(" -> NULL\n");
}

int main(void)
{
    const int values[] = {10, 20, 30};
    StaticList list;
    static_init(&list, values, 3);

    printf("physical rows:\n");
    {
        int i;
        for (i = 0; i < CAPACITY; ++i)
        {
            printf("  [%d] data=%2d cur=%2d\n", i, list.nodes[i].data, list.nodes[i].cur);
        }
    }
    static_traverse(&list);

    static_insert(&list, 2, 25);   /* logical: 10, 25, 20, 30 */
    static_delete(&list, 3, NULL); /* remove 20 */
    printf("after insert/delete:\n");
    {
        int i;
        for (i = 0; i < CAPACITY; ++i)
        {
            printf("  [%d] data=%2d cur=%2d\n", i, list.nodes[i].data, list.nodes[i].cur);
        }
    }
    static_traverse(&list); /* 10, 25, 30 in array indices 0 -> 3 -> 2 */
    printf("head=%d freeHead=%d length=%d\n", list.head, list.free_head, static_length(&list));
    return 0;
}

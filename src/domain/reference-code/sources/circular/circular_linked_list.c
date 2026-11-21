/*
 * 中文导读：让尾结点的 next 指回头结点，使“从任意结点出发都能绕一圈”。
 * 阅读顺序：先看 tail/head 的指向；再看插入/删除如何维护环；最后看遍历为什么必须用 do-while 或记录起点。
 * 关键不变量：最后一个结点的 next 永远指回第一个结点；空表时指针关系要单独定义。
 * 易错点：用 while(p != NULL) 遍历环导致死循环；删除时没有更新前驱/尾指针；空表和非空表分支不一致。
 * 复杂度：已知位置插入/删除 O(1)，查找 O(n)，空间 O(n)。
 */

/*
 * AlgoViz reference implementation: circular singly linked list.
 * The tail node links back to the head, so traversal stops when it returns.
 *
 * Reading guide:
 * 1. The list keeps a tail pointer and tail->next points back to the head.
 * 2. Appending inserts after tail and moves tail to the new node.
 * 3. Traversal starts at head and stops when it returns to head; an empty list has
 *    tail == NULL.
 *
 * Complexity: O(1) append, O(n) traversal; extra space O(n).
 * Convention: There is no NULL terminator inside a non-empty list; emptiness is tail
 *   == NULL.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct Node
{
    int value;
    struct Node *next;
} Node;

typedef struct
{
    Node *head;
    Node *tail;
} CircularList;

// 作用：初始化链表：head/tail 置空、length 置 0；空表状态要能安全遍历。
void list_init(CircularList *list)
{
    list->head = NULL;
    list->tail = NULL;
}

// New node points at head; the old tail points at the new node, preserving the ring.
// The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
// 作用：在循环链表尾部追加 value；尾结点的 next 必须重新指回头结点。
bool list_append(CircularList *list, int value)
{
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL)
    {
        return false;
    }
    node->value = value;
    if (list->tail == NULL)
    {
        node->next = node;
        list->head = node;
    }
    else
    {
        node->next = list->head;
        list->tail->next = node;
    }
    list->tail = node;
    return true;
}

// 作用：只读遍历并输出链表；不修改 head 或结点链接。
void list_print(const CircularList *list)
{
    if (list->head == NULL)
    {
        printf("(empty)\n");
        return;
    }
    const Node *node = list->head;
    do
    {
        printf("%d%s", node->value, node->next == list->head ? "" : " ");
        node = node->next;
    } while (node != list->head);
    printf("\n");
}

// 作用：释放循环链表全部结点，并恢复空表状态；注意环的终止条件。
void list_free(CircularList *list)
{
    if (list->head == NULL)
    {
        return;
    }
    Node *node = list->head;
    while (node != list->tail)
    {
        Node *next = node->next;
        free(node);
        node = next;
    }
    free(list->tail);
    list->head = NULL;
    list->tail = NULL;
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main(void)
{
    CircularList list;
    list_init(&list);
    list_append(&list, 1);
    list_append(&list, 2);
    list_append(&list, 3);
    printf("circular: ");
    list_print(&list);
    printf("tail->next: %d\n", list.tail->next->value);
    list_free(&list);
    return 0;
}

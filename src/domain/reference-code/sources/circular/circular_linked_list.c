/*
 * 中文导读：让尾结点的 next 指回头结点，使“从任意结点出发都能绕一圈”。
 * 阅读顺序：先看 head/tail 如何表示空表；再看 append 的两条链接顺序；最后看遍历和释放怎样判断“绕回起点”。
 * 关键不变量：tail 非空时 tail->next == head；空表时 head == tail == NULL；非空表中不存在以 NULL 结尾的结点。
 * 易错点：把空表当成“有一个结点”而漏掉 head 赋值；先改 tail 再连边导致环断裂；用 while (p != NULL) 遍历造成死循环。
 * 复杂度：append 为 O(1)（不查找位置），遍历 O(n)，释放 O(n)，额外空间 O(n)。
 * 输入/输出：main 依次追加 1、2、3；append 返回是否分配成功，list_print 只读输出，失败路径释放已建结点。
*/

/*
 * AlgoViz reference implementation: circular singly linked list.
 * The tail node links back to the head, so a non-empty list has no NULL terminator.
 *
 * Reading guide:
 * 1. `CircularList` stores only `head` and `tail`; an empty list has both equal to
 *    NULL. There is deliberately no `length` field.
 * 2. The first node points to itself. Later appends point the new node at `head`,
 *    join the old tail to it, and only then move `tail`.
 * 3. Traversal starts at `head` and stops when it returns to `head`; an empty list
 *    must be handled before entering the ring. Freeing saves `next` before each
 *    `free`, because the link is unreadable afterwards.
 *
 * Complexity: O(1) append, O(n) traversal and free; extra space O(n).
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

/*
 * Empty state: both endpoints are NULL. `head` and `tail` describe the same
 * empty ring from two sides, so initialization must clear both. There is no
 * separate count to reset in this structure.
 */
// Purpose: Initialize the list as an empty ring by clearing both endpoints.
// 作用：把链表初始化为空环：head 与 tail 同时置空，不维护并不存在的 length 字段。
void list_init(CircularList *list)
{
    list->head = NULL;
    list->tail = NULL;
}

// The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
/*
 * The first node closes the ring on itself, so `head` and `tail` become the same
 * node. For a later node, `node->next = head` and `tail->next = node` must happen
 * before `tail = node`: once `tail` moves, the old tail is no longer reachable
 * through the tail pointer, and its link would be lost. Allocation failure returns
 * before touching the list, so the existing ring stays valid.
 *
 * Purpose: Append one value at the tail while preserving the closing link.
 * 作用：在尾部追加一个值；先接好新旧两条边，最后再移动 tail。
 */
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

/*
 * A non-empty ring has no NULL node, so `while (node != NULL)` would never end.
 * Handle the empty list first, then use do-while to print `head` before advancing.
 * The loop stops when the next pointer returns to `head`, which proves one full lap.
 */
// Purpose: Print one full lap read-only; stop when traversal returns to the head.
// 作用：只读打印一整圈；回到 head 即停止，不修改任何链接。
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

/*
 * Freeing a node invalidates its `next`, so the successor is saved first. The loop
 * uses `tail` as the stopping marker: following links until `head` would cycle
 * forever, while stopping at `tail` also handles a one-node ring by skipping the
 * loop. After the tail is freed, both endpoints are cleared so no dangling pointer
 * can be mistaken for a valid empty list.
 */
// Purpose: Release every node safely and restore the two-pointer empty state.
// 作用：逐个释放结点并恢复空表；释放前保存后继，最后把 head/tail 同时清空。
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

/*
 * Each append reports whether node allocation succeeded. A caller that ignored the
 * result could print a partial list or dereference a NULL tail; on failure this
 * demo frees the nodes already created and exits. The final assertion checks the
 * ring contract through `tail->next`, which is safe only after all appends passed.
 */
int main(void)
{
    CircularList list;
    list_init(&list);
    if (!list_append(&list, 1))
    {
        fprintf(stderr, "append 1 failed\n");
        list_free(&list);
        return EXIT_FAILURE;
    }
    if (!list_append(&list, 2))
    {
        fprintf(stderr, "append 2 failed\n");
        list_free(&list);
        return EXIT_FAILURE;
    }
    if (!list_append(&list, 3))
    {
        fprintf(stderr, "append 3 failed\n");
        list_free(&list);
        return EXIT_FAILURE;
    }
    printf("circular: ");
    list_print(&list);
    if (list.tail == NULL)
    {
        fprintf(stderr, "tail is unexpectedly NULL\n");
        list_free(&list);
        return EXIT_FAILURE;
    }
    printf("tail->next: %d\n", list.tail->next->value);
    list_free(&list);
    return EXIT_SUCCESS;
}

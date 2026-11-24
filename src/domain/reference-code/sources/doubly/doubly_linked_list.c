/*
 * 中文导读：每个结点同时保存 prev 和 next，使已知结点两侧的插入/删除都为 O(1)。
 * 阅读顺序：先看 Node 的两个指针和 head/tail；再看插入时四条链接的赋值顺序；最后看删除时两侧如何互相接回。
 * 关键不变量：对任意相邻结点 a、b，必须同时有 a.next == b 与 b.prev == a。
 * 易错点：只改 next 不改 prev；删除尾结点不更新 tail；头尾边界空指针；释放后仍访问旧结点。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(n)（每结点多一个指针）。
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 prev/next，返回成功/元素；main 双向打印。
*/

/*
 * AlgoViz reference implementation: doubly linked list.
 * Each node stores prev/next pointers; append and remove are O(1)
 * once the target node is known.
 *
 * Reading guide:
 * 1. Each node stores prev and next; the list keeps head and tail.
 * 2. Appending links the new node after tail and updates tail.
 * 3. Removing a known node patches its two neighbours; head/tail are fixed when
 *    necessary.
 * 4. Forward traversal follows next; backward traversal follows prev.
 *
 * Complexity: O(1) splice at a known node, O(n) search; extra space O(n).
 * Convention: NULL/None marks both ends; prev and next must stay mutually
 *   consistent.
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct Node
{
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

typedef struct
{
    Node *head;
    Node *tail;
} DoublyList;

/*
 * Empty means both endpoints are NULL. This structure has no count field, so the
 * only work here is clearing `head` and `tail`; those two nulls are the complete
 * empty-state invariant for later traversals and appends.
 */
// Both endpoints are cleared together; this implementation keeps no count, so those two nulls fully describe the empty state.
void list_init(DoublyList *list)
{
    list->head = NULL;
    list->tail = NULL;
}

/*
 * `node->prev` must be the old tail before `tail` moves, and the old tail's `next`
 * must point to the new node before the new node becomes reachable as the tail.
 * When the list is empty, there is no old tail to patch, so `head` must be set
 * instead. Allocation failure returns before any link changes, leaving the list
 * exactly as it was.
 */
Node *list_append(DoublyList *list, int value)
{
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL)
    {
        return NULL;
    }
    node->value = value;
    // The new node's prev is the old tail before tail moves; next stays NULL because append always creates the new last node.
    node->prev = list->tail;
    node->next = NULL;
    if (list->tail != NULL)
    {
        // Patch the old tail's next before publishing the new tail; otherwise the backward chain would end at a node with no forward partner.
        list->tail->next = node;
    }
    else
    {
        // Only an empty list reaches this branch: the new node is both head and tail, so head must be set explicitly.
        list->head = node;
    }
    list->tail = node;
    return node;
}

// Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.
int list_remove(DoublyList *list, Node *node)
{
    // A pointer from another list still has plausible prev/next links, so membership must be proved before any splice or free.
    if (list == NULL || node == NULL)
    {
        return 0;
    }
    Node *current = list->head;
    while (current != NULL && current != node)
    {
        current = current->next;
    }
    if (current == NULL)
    {
        return 0;
    }
    // Head removal has no predecessor to patch, so it must move list->head to node->next instead.
    if (node->prev != NULL)
    {
        node->prev->next = node->next;
    }
    else
    {
        list->head = node->next;
    }
    // Tail removal has no successor to patch, so list->tail retreats to node->prev.
    if (node->next != NULL)
    {
        node->next->prev = node->prev;
    }
    else
    {
        list->tail = node->prev;
    }
    free(node);
    return 1;
}

void list_print_forward(const DoublyList *list)
{
    for (const Node *node = list->head; node != NULL; node = node->next)
    {
        printf("%d%s", node->value, node->next == NULL ? "" : " ");
    }
    printf("\n");
}

void list_print_backward(const DoublyList *list)
{
    for (const Node *node = list->tail; node != NULL; node = node->prev)
    {
        printf("%d%s", node->value, node->prev == NULL ? "" : " ");
    }
    printf("\n");
}

void list_free(DoublyList *list)
{
    // This is a linear doubly linked list, not a ring: following next from head reaches NULL exactly once per node.
    Node *node = list->head;
    while (node != NULL)
    {
        Node *next = node->next;
        free(node);
        node = next;
    }
    list->head = NULL;
    list->tail = NULL;
}

int main(void)
{
    DoublyList list;
    list_init(&list);
    Node *one = list_append(&list, 1);
    Node *two = list_append(&list, 2);
    list_append(&list, 3);

    printf("forward: ");
    list_print_forward(&list);
    printf("backward: ");
    list_print_backward(&list);

    if (!list_remove(&list, two))
    {
        printf("remove 2 rejected\n");
    }
    printf("after remove 2: ");
    list_print_forward(&list);
    printf("tail prev: %d\n",
           list.tail != NULL && list.tail->prev != NULL ? list.tail->prev->value : one->value);
    list_free(&list);
    return 0;
}

/*
 * 中文导读：每个结点同时保存 prev 和 next，使已知结点两侧的插入/删除都为 O(1)。
 * 阅读顺序：先看 Node 的两个指针和 head/tail；再看插入时四条链接的赋值顺序；最后看删除时两侧如何互相接回。
 * 关键不变量：对任意相邻结点 a、b，必须同时有 a.next == b 与 b.prev == a。
 * 易错点：只改 next 不改 prev；删除尾结点不更新 tail；头尾边界空指针；释放后仍访问旧结点。
 * 复杂度：已知位置插删 O(1)，查找 O(n)，空间 O(n)（每结点多一个指针）。
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

// 作用：初始化链表：head/tail 置空、length 置 0；空表状态要能安全遍历。
void list_init(DoublyList *list)
{
    list->head = NULL;
    list->tail = NULL;
}

// Append wires prev and next first; only then does tail move to the new node.
// 作用：在双向链表尾部追加 value，同时维护 prev、next、tail 和 length。
Node *list_append(DoublyList *list, int value)
{
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL)
    {
        return NULL;
    }
    node->value = value;
    node->prev = list->tail;
    node->next = NULL;
    if (list->tail != NULL)
    {
        list->tail->next = node;
    }
    else
    {
        list->head = node;
    }
    list->tail = node;
    return node;
}

// Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.
// 作用：删除已知结点 node：让前驱的 next 指向后继，后继的 prev 指回前驱，再释放结点。
void list_remove(DoublyList *list, Node *node)
{
    if (node->prev != NULL)
    {
        node->prev->next = node->next;
    }
    else
    {
        list->head = node->next;
    }
    if (node->next != NULL)
    {
        node->next->prev = node->prev;
    }
    else
    {
        list->tail = node->prev;
    }
    free(node);
}

// 作用：从 head 沿 next 正向输出链表；只读，不改变结构。
void list_print_forward(const DoublyList *list)
{
    for (const Node *node = list->head; node != NULL; node = node->next)
    {
        printf("%d%s", node->value, node->next == NULL ? "" : " ");
    }
    printf("\n");
}

// 作用：从 tail 沿 prev 反向输出链表；只读，不改变结构。
void list_print_backward(const DoublyList *list)
{
    for (const Node *node = list->tail; node != NULL; node = node->prev)
    {
        printf("%d%s", node->value, node->prev == NULL ? "" : " ");
    }
    printf("\n");
}

// 作用：释放循环链表全部结点，并恢复空表状态；注意环的终止条件。
void list_free(DoublyList *list)
{
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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

    list_remove(&list, two);
    printf("after remove 2: ");
    list_print_forward(&list);
    printf("tail prev: %d\n",
           list.tail != NULL && list.tail->prev != NULL ? list.tail->prev->value : one->value);
    list_free(&list);
    return 0;
}

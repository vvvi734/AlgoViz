/*
 * 中文导读：用 Node 和 next 指针保存线性序列，重点练习插入/删除时的断链与重接。
 * 阅读顺序：先看 Node 只有 value/next，调用方只持有 head；再看 index=0 的头插分支；最后看按位置删除为何要先找前驱。
 * 关键不变量：从 head 出发沿 next 能走完整个序列；尾结点的 next 为 NULL；本实现没有 tail 和 length 字段。
 * 易错点：先改 *head 再接新结点会丢失旧表；删除头结点不更新 head；先 free 再读 next；把 index==长度 的插入误当成独立尾插操作。
 * 复杂度：头插 O(1)；按位置插入/删除需先走到 index-1，最坏 O(n)；已知前驱的改链本身 O(1)，空间 O(n)。
 * 输入/输出：main 在 index 0、1、2 插入，删除 index 1，再尝试越界 index 9；函数以 bool 返回成功/失败，遍历只读输出。
*/

/*
 * Singly linked list in C11.
 *
 * Each node stores one value and one next pointer. Head insertion links the new
 * node before the old head. Insertion and deletion at a known position rewire
 * the predecessor's next pointer. Traversal follows next until NULL.
 * Head insertion is O(1); search, indexed insertion and deletion are O(n).
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

struct Node
{
    int value;
    struct Node *next;
};

// Purpose: Create a singly linked-list node holding value with a null next pointer.
// 作用：创建一个单链表结点，保存 value 并把 next 置空。
static struct Node *CreateNode(int value)
{
    struct Node *node = (struct Node *)malloc(sizeof(struct Node));
    if (node == NULL)
    {
        return NULL;
    }
    node->value = value;
    node->next = NULL;
    return node;
}

/*
 * Index 0 is the only case that changes `*head`; the new node must point at the
 * old head before `*head` moves, otherwise the rest of the list becomes unreachable.
 * For index > 0 the loop stops at the predecessor (`index - 1`), so linking the new
 * node needs no second traversal. If the predecessor is NULL, the index is past the
 * end and the function returns false without allocating or modifying the list.
 */
// Purpose: Insert before `index`; index 0 changes the caller's head, invalid index returns false.
// 作用：在 index 前插入；只有 index 0 改 *head；越界时在分配前返回 false。
bool ListInsert(struct Node **head, int index, int value)
{
    if (head == NULL || index < 0)
    {
        return false;
    }
    if (index == 0)
    {
        struct Node *node = CreateNode(value);
        if (node == NULL)
        {
            return false;
        }
        // Link the new node to the old head before changing *head; otherwise the list is lost.
        node->next = *head;
        *head = node;
        return true;
    }

    struct Node *previous = *head;
    for (int position = 0; previous != NULL && position < index - 1; ++position)
    {
        previous = previous->next;
    }
    if (previous == NULL)
    {
        return false;
    }
    struct Node *node = CreateNode(value);
    if (node == NULL)
    {
        return false;
    }
    node->next = previous->next;
    previous->next = node;
    return true;
}

/*
 * Deletion also has a head special case: `*head` must advance before the old head
 * is freed. For later indices, the loop stops on the predecessor; if it has no
 * successor, index is past the last node. The target's successor is copied into the
 * predecessor's link before `free`, because the freed node must not be read again.
 */
// Purpose: Remove the node at `index`; save its value, relink, then free exactly once.
// 作用：删除 index 处结点；先保存返回值与后继，再改链，最后释放目标。
bool ListDelete(struct Node **head, int index, int *removed)
{
    if (head == NULL || *head == NULL || index < 0)
    {
        return false;
    }
    if (index == 0)
    {
        struct Node *node = *head;
        *removed = node->value;
        // Deleting the head only moves *head; the successor already owns the rest of the list.
        *head = node->next;
        free(node);
        return true;
    }

    struct Node *previous = *head;
    for (int position = 0; previous->next != NULL && position < index - 1; ++position)
    {
        previous = previous->next;
    }
    if (previous->next == NULL)
    {
        return false;
    }
    struct Node *node = previous->next;
    *removed = node->value;
    // Unlink the target before freeing it; previous keeps the only link to its successor.
    previous->next = node->next;
    free(node);
    return true;
}

// Purpose: Traverse and print the list without changing head or node links.
// 作用：只读遍历并输出链表；不修改 head 或结点链接。
void PrintList(const struct Node *head)
{
    printf("list:");
    for (const struct Node *node = head; node != NULL; node = node->next)
    {
        printf(" %d", node->value);
    }
    printf("\n");
}

// Purpose: Traverse and free every node, then clear head; save next before calling free.
// 作用：遍历释放链表全部结点，并把 head 置空；先保存 next 再 free。
void FreeList(struct Node **head)
{
    struct Node *node = *head;
    while (node != NULL)
    {
        struct Node *next = node->next;
        free(node);
        node = next;
    }
    *head = NULL;
}

/*
 * With one, two, then three existing nodes, inserting at index 1 and 2 happens to
 * place each node after the current last node. That is a consequence of the index
 * matching the current length, not a dedicated tail-append routine; there is no
 * tail pointer in this implementation. The final index 9 is deliberately past the
 * end and must be rejected.
 */
int main(void)
{
    struct Node *head = NULL;
    ListInsert(&head, 0, 1);
    ListInsert(&head, 1, 2);
    ListInsert(&head, 2, 3);
    printf("after inserts: ");
    PrintList(head);

    int removed = 0;
    if (ListDelete(&head, 1, &removed))
    {
        printf("removed: %d\n", removed);
    }
    printf("after delete: ");
    PrintList(head);
    printf("insert at 9: %s\n", ListInsert(&head, 9, 4) ? "ok" : "rejected");

    FreeList(&head);
    return 0;
}

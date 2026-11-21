/*
 * 中文导读：用结点和 next 指针保存线性序列，重点练习插入/删除时的断链与重接。
 * 阅读顺序：先看 Node 和 head/tail/length；再看头插、尾插、按位置插入；最后看删除时为什么要先保存前驱/目标。
 * 关键不变量：从 head 出发沿 next 能走完 length 个结点；尾结点的 next 为 NULL；每个结点只有一个前驱。
 * 易错点：先改指针后保存后继导致断链；删除头结点不更新 head；尾插不更新 tail；释放后访问；长度不同步。
 * 复杂度：头插 O(1)，按位置查找 O(n)，已知前驱插删 O(1)，空间 O(n)。
 * 输入/输出：输入 main 内置的演示操作序列；结构函数原地改 next 并返回成功/元素；main 打印遍历结果。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// 作用：在位置 index 前插入 value；index=0 时改 head；越界或分配失败返回 false。
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

// 作用：删除位置 index 的结点；先找前驱并保存目标，再重接 next，最后释放。
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

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
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

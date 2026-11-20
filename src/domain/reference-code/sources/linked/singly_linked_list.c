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

struct Node {
    int value;
    struct Node *next;
};

static struct Node *CreateNode(int value)
{
    struct Node *node = (struct Node *)malloc(sizeof(struct Node));
    if (node == NULL) {
        return NULL;
    }
    node->value = value;
    node->next = NULL;
    return node;
}

bool ListInsert(struct Node **head, int index, int value)
{
    if (head == NULL || index < 0) {
        return false;
    }
    if (index == 0) {
        struct Node *node = CreateNode(value);
        if (node == NULL) {
            return false;
        }
        node->next = *head;
        *head = node;
        return true;
    }

    struct Node *previous = *head;
    for (int position = 0; previous != NULL && position < index - 1; ++position) {
        previous = previous->next;
    }
    if (previous == NULL) {
        return false;
    }
    struct Node *node = CreateNode(value);
    if (node == NULL) {
        return false;
    }
    node->next = previous->next;
    previous->next = node;
    return true;
}

bool ListDelete(struct Node **head, int index, int *removed)
{
    if (head == NULL || *head == NULL || index < 0) {
        return false;
    }
    if (index == 0) {
        struct Node *node = *head;
        *removed = node->value;
        *head = node->next;
        free(node);
        return true;
    }

    struct Node *previous = *head;
    for (int position = 0; previous->next != NULL && position < index - 1; ++position) {
        previous = previous->next;
    }
    if (previous->next == NULL) {
        return false;
    }
    struct Node *node = previous->next;
    *removed = node->value;
    previous->next = node->next;
    free(node);
    return true;
}

void PrintList(const struct Node *head)
{
    printf("list:");
    for (const struct Node *node = head; node != NULL; node = node->next) {
        printf(" %d", node->value);
    }
    printf("\n");
}

void FreeList(struct Node **head)
{
    struct Node *node = *head;
    while (node != NULL) {
        struct Node *next = node->next;
        free(node);
        node = next;
    }
    *head = NULL;
}

int main(void)
{
    struct Node *head = NULL;
    ListInsert(&head, 0, 1);
    ListInsert(&head, 1, 2);
    ListInsert(&head, 2, 3);
    printf("after inserts: ");
    PrintList(head);

    int removed = 0;
    if (ListDelete(&head, 1, &removed)) {
        printf("removed: %d\n", removed);
    }
    printf("after delete: ");
    PrintList(head);
    printf("insert at 9: %s\n", ListInsert(&head, 9, 4) ? "ok" : "rejected");

    FreeList(&head);
    return 0;
}

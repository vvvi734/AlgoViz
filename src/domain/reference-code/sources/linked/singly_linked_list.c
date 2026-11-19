/*
 * AlgoViz reference implementation: singly linked list.
 * Original code written for this repository under the MIT License.
 * Algorithmic structure follows the classic textbook treatment in
 * Yan Weimin, Data Structures (C Language Edition), without copying text.
 */

#include <stdio.h>
#include <stdlib.h>

typedef int DataType;

typedef struct Node {
    DataType value;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    size_t length;
} SinglyLinkedList;

static Node *node_create(DataType value) {
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL) {
        return NULL;
    }
    node->value = value;
    node->next = NULL;
    return node;
}

void list_init(SinglyLinkedList *list) {
    list->head = NULL;
    list->length = 0;
}

int list_insert_head(SinglyLinkedList *list, DataType value) {
    Node *node = node_create(value);
    if (node == NULL) {
        return 0;
    }
    node->next = list->head;
    list->head = node;
    list->length++;
    return 1;
}

/* Return the node immediately before target, or NULL when target is the head
 * or does not belong to this list. O(n). */
Node *list_find_prev(const SinglyLinkedList *list, const Node *target) {
    if (list->head == NULL || target == NULL || target == list->head) {
        return NULL;
    }
    Node *prev = list->head;
    while (prev->next != NULL && prev->next != target) {
        prev = prev->next;
    }
    return prev->next == target ? prev : NULL;
}

/* Insert after a known node. The new node must point at the old successor
 * before the predecessor is relinked, otherwise the rest of the list is lost. */
int list_insert_after(SinglyLinkedList *list, Node *prev, DataType value) {
    if (prev == NULL) {
        return 0;
    }
    Node *node = node_create(value);
    if (node == NULL) {
        return 0;
    }
    node->next = prev->next;
    prev->next = node;
    list->length++;
    return 1;
}

int list_delete_value(SinglyLinkedList *list, DataType value) {
    Node *prev = NULL;
    Node *current = list->head;
    while (current != NULL && current->value != value) {
        prev = current;
        current = current->next;
    }
    if (current == NULL) {
        return 0;
    }
    if (prev == NULL) {
        list->head = current->next;
    } else {
        prev->next = current->next;
    }
    free(current);
    list->length--;
    return 1;
}

void list_traverse(const SinglyLinkedList *list) {
    const Node *current = list->head;
    printf("list:");
    while (current != NULL) {
        printf(" %d", current->value);
        current = current->next;
    }
    printf("\n");
}

void list_clear(SinglyLinkedList *list) {
    Node *current = list->head;
    while (current != NULL) {
        Node *next = current->next;
        free(current);
        current = next;
    }
    list->head = NULL;
    list->length = 0;
}

int main(void) {
    SinglyLinkedList list;
    list_init(&list);

    list_insert_head(&list, 5);
    list_insert_head(&list, 8);
    list_insert_head(&list, 3);

    Node *prev = list_find_prev(&list, list.head->next);
    if (prev != NULL) {
        list_insert_after(&list, prev, 6);
    }

    list_delete_value(&list, 8);
    list_traverse(&list);
    printf("length=%zu\n", list.length);

    list_clear(&list);
    return 0;
}

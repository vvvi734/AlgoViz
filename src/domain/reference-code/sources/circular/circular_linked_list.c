/*
 * Textbook material note
 * The textbook provided by the user does not contain this algorithm.
 * This file keeps AlgoViz's original C implementation and comments; it does
 * not present itself as textbook text.
 */

/*
 * AlgoViz reference implementation: circular singly linked list.
 * Original code written for this repository under the MIT License.
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

typedef struct Node {
    int value;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    Node *tail;
} CircularList;

void list_init(CircularList *list) {
    list->head = NULL;
    list->tail = NULL;
}

// New node points at head; the old tail points at the new node, preserving the ring.
bool list_append(CircularList *list, int value) {
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL) {
        return false;
    }
    node->value = value;
    if (list->tail == NULL) {
        node->next = node;
        list->head = node;
    } else {
        node->next = list->head;
        list->tail->next = node;
    }
    list->tail = node;
    return true;
}

void list_print(const CircularList *list) {
    if (list->head == NULL) {
        printf("(empty)\n");
        return;
    }
    const Node *node = list->head;
    do {
        printf("%d%s", node->value, node->next == list->head ? "" : " ");
        node = node->next;
    } while (node != list->head);
    printf("\n");
}

void list_free(CircularList *list) {
    if (list->head == NULL) {
        return;
    }
    Node *node = list->head;
    while (node != list->tail) {
        Node *next = node->next;
        free(node);
        node = next;
    }
    free(list->tail);
    list->head = NULL;
    list->tail = NULL;
}

int main(void) {
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

/*
 * AlgoViz reference implementation: doubly linked list.
 * Original code written for this repository under the MIT License.
 * Each node stores prev/next pointers; append and remove are O(1)
 * once the target node is known.
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *prev;
    struct Node *next;
} Node;

typedef struct {
    Node *head;
    Node *tail;
} DoublyList;

void list_init(DoublyList *list) {
    list->head = NULL;
    list->tail = NULL;
}

Node *list_append(DoublyList *list, int value) {
    Node *node = (Node *)malloc(sizeof(Node));
    if (node == NULL) {
        return NULL;
    }
    node->value = value;
    node->prev = list->tail;
    node->next = NULL;
    if (list->tail != NULL) {
        list->tail->next = node;
    } else {
        list->head = node;
    }
    list->tail = node;
    return node;
}

void list_remove(DoublyList *list, Node *node) {
    if (node->prev != NULL) {
        node->prev->next = node->next;
    } else {
        list->head = node->next;
    }
    if (node->next != NULL) {
        node->next->prev = node->prev;
    } else {
        list->tail = node->prev;
    }
    free(node);
}

void list_print_forward(const DoublyList *list) {
    for (const Node *node = list->head; node != NULL; node = node->next) {
        printf("%d%s", node->value, node->next == NULL ? "" : " ");
    }
    printf("\n");
}

void list_print_backward(const DoublyList *list) {
    for (const Node *node = list->tail; node != NULL; node = node->prev) {
        printf("%d%s", node->value, node->prev == NULL ? "" : " ");
    }
    printf("\n");
}

void list_free(DoublyList *list) {
    Node *node = list->head;
    while (node != NULL) {
        Node *next = node->next;
        free(node);
        node = next;
    }
    list->head = NULL;
    list->tail = NULL;
}

int main(void) {
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
    printf("tail prev: %d\n", list.tail != NULL && list.tail->prev != NULL ? list.tail->prev->value : one->value);
    list_free(&list);
    return 0;
}

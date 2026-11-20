// AlgoViz reference implementation: level-order traversal with a FIFO queue (C11).
// This file adds the queue-based fourth traversal.
//
// Reading guide:
// 1. Enqueue the root.
// 2. Dequeue the front, visit it, then enqueue its left child and right child.
// 3. Repeat until the queue is empty; FIFO gives top-to-bottom, left-to-right order.
//
// Complexity: O(n) time; extra space O(w), where w is the maximum level width
// (O(n) worst case). Convention: NULL is an empty subtree.
// The fixed ring buffer holds at most MAX_NODES pending nodes; this example
// tree has only 5, so it never fills.

#include <stdio.h>

#define MAX_NODES 40

typedef struct BiTNode {
    int data;
    struct BiTNode* left;
    struct BiTNode* right;
} BiTNode;

typedef struct {
    BiTNode* items[MAX_NODES];
    int front;
    int rear;
    int count;
} Queue;

void queue_init(Queue* q) {
    q->front = 0;
    q->rear = 0;
    q->count = 0;
}

int queue_enqueue(Queue* q, BiTNode* node) {
    if (q->count == MAX_NODES) {
        return 0;
    }
    q->items[q->rear] = node;
    q->rear = (q->rear + 1) % MAX_NODES;
    q->count++;
    return 1;
}

BiTNode* queue_dequeue(Queue* q) {
    if (q->count == 0) {
        return NULL;
    }
    BiTNode* node = q->items[q->front];
    q->front = (q->front + 1) % MAX_NODES;
    q->count--;
    return node;
}

// Visit each node exactly once, level by level and left to right.
void level_order(BiTNode* root) {
    if (root == NULL) {
        return;
    }

    Queue q;
    queue_init(&q);
    queue_enqueue(&q, root);

    while (q.count > 0) {
        BiTNode* node = queue_dequeue(&q);
        printf("%d ", node->data);

        if (node->left != NULL) {
            queue_enqueue(&q, node->left);
        }
        if (node->right != NULL) {
            queue_enqueue(&q, node->right);
        }
    }
}

int main(void) {
    BiTNode one = {1, NULL, NULL};
    BiTNode three = {3, NULL, NULL};
    BiTNode six = {6, NULL, NULL};
    BiTNode two = {2, &one, &three};
    BiTNode four = {4, &two, &six};

    printf("level order: ");
    level_order(&four);
    printf("\n");

    printf("empty: ");
    level_order(NULL);
    printf("\n");
    return 0;
}

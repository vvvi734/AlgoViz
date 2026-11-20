/*
 * Circular queue in C11.
 *
 * A fixed array stores the FIFO sequence. Head is the first item, tail is the
 * next free slot, and count distinguishes empty from full. Enqueue writes at
 * tail; dequeue reads at head; both advance modulo capacity. O(1) per operation.
 */

#include <stdbool.h>
#include <stdio.h>

#define QUEUE_CAPACITY 8

typedef struct {
    int items[QUEUE_CAPACITY];
    int head;
    int tail;
    int count;
} Queue;

void InitQueue(Queue *queue)
{
    queue->head = 0;
    queue->tail = 0;
    queue->count = 0;
}

bool QueueEmpty(const Queue *queue)
{
    return queue->count == 0;
}

bool Enqueue(Queue *queue, int value)
{
    if (queue->count == QUEUE_CAPACITY) {
        return false;
    }
    queue->items[queue->tail] = value;
    queue->tail = (queue->tail + 1) % QUEUE_CAPACITY;
    ++queue->count;
    return true;
}

bool Dequeue(Queue *queue, int *value)
{
    if (queue->count == 0) {
        return false;
    }
    *value = queue->items[queue->head];
    queue->head = (queue->head + 1) % QUEUE_CAPACITY;
    --queue->count;
    return true;
}

bool QueueFront(const Queue *queue, int *value)
{
    if (queue->count == 0) {
        return false;
    }
    *value = queue->items[queue->head];
    return true;
}

int main(void)
{
    Queue queue;
    InitQueue(&queue);
    for (int value = 1; value <= 4; ++value) {
        Enqueue(&queue, value);
    }

    int front = 0;
    if (QueueFront(&queue, &front)) {
        printf("front: %d\n", front);
    }

    int value = 0;
    while (Dequeue(&queue, &value)) {
        printf("dequeue: %d\n", value);
    }
    printf("empty: %s\n", QueueEmpty(&queue) ? "yes" : "no");
    return 0;
}

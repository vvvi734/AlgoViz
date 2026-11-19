/*
 * AlgoViz reference implementation: circular queue.
 * Original code written for this repository under the MIT License.
 * A fixed-capacity ring buffer using head, tail and count.
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

void queue_init(Queue *queue) {
    queue->head = 0;
    queue->tail = 0;
    queue->count = 0;
}

bool queue_enqueue(Queue *queue, int value) {
    if (queue->count == QUEUE_CAPACITY) {
        return false;
    }
    queue->items[queue->tail] = value;
    queue->tail = (queue->tail + 1) % QUEUE_CAPACITY;
    ++queue->count;
    return true;
}

bool queue_dequeue(Queue *queue, int *out_value) {
    if (queue->count == 0) {
        return false;
    }
    *out_value = queue->items[queue->head];
    queue->head = (queue->head + 1) % QUEUE_CAPACITY;
    --queue->count;
    return true;
}

bool queue_front(const Queue *queue, int *out_value) {
    if (queue->count == 0) {
        return false;
    }
    *out_value = queue->items[queue->head];
    return true;
}

int main(void) {
    Queue queue;
    queue_init(&queue);
    for (int value = 1; value <= 4; ++value) {
        queue_enqueue(&queue, value);
    }

    int value = 0;
    queue_front(&queue, &value);
    printf("front: %d\n", value);
    while (queue_dequeue(&queue, &value)) {
        printf("dequeue: %d\n", value);
    }
    printf("empty: %s\n", queue.count == 0 ? "yes" : "no");
    printf("underflow: %s\n", queue_dequeue(&queue, &value) ? "no" : "yes");
    return 0;
}

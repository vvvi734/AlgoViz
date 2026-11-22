/*
 * 中文导读：用循环数组实现先进先出；front 指队首，rear 指下一个待写入空位。
 * 阅读顺序：先看“牺牲一个单元”的空/满约定；再看 enqueue 写 rear 后取模；然后看 dequeue 读 front 后取模。
 * 关键不变量：front == rear 为空，(rear + 1) % capacity == front 为满；有效元素最多 capacity - 1 个。
 * 易错点：把 rear 当成最后一个元素；混用 count 与牺牲单元两套规则；自增后忘记取模；空队列仍读 front。
 * 复杂度：enqueue/dequeue/front O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；入队/出队返回成功或队头；main 打印出队顺序。
*/

/*
 * Circular queue in C11.
 *
 * The array wraps with modulo. front is the first live item and rear is the
 * next free slot. One slot is reserved so the empty and full states stay
 * distinguishable: front == rear is empty, (rear + 1) % capacity == front is
 * full. Every operation is O(1).
 */

#include <stdbool.h>
#include <stdio.h>

#define QUEUE_CAPACITY 8

typedef struct
{
    int data[QUEUE_CAPACITY];
    int front;
    int rear;
} Queue;

// front and rear start at the same index; that equality is the empty state, so no count field is needed.
void InitQueue(Queue *queue)
{
    queue->front = 0;
    queue->rear = 0;
}

bool QueueEmpty(const Queue *queue)
{
    return queue->front == queue->rear;
}

// front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.

/*
 * 只剩那个保留空位，不能再入队。
 */
bool QueueFull(const Queue *queue)
{
    // The reserved slot is the one just before front: rear never writes there, so a capacity-8 array holds at most 7 items.
    return (queue->rear + 1) % QUEUE_CAPACITY == queue->front;
}

/*
 * 取模使 rear 从最后一个下标回到 0，完成物理数组上的回绕。
 */
bool Enqueue(Queue *queue, int value)
{
    // Fullness is tested before the write; a rejected enqueue must not overwrite the reserved slot or any live item.
    if (QueueFull(queue))
    {
        return false;
    }
    // rear names the next free slot, so write there before advancing; advancing first would overwrite the following slot.
    queue->data[queue->rear] = value;
    // Modulo wraps the physical index without shifting elements; logical order is encoded by the front/rear offsets.
    queue->rear = (queue->rear + 1) % QUEUE_CAPACITY;
    return true;
}

/*
 * 前移即可，不需要搬移其余元素。
 */
// Dequeue reads front before advancing; the value must be copied out before that slot leaves the live range.
bool Dequeue(Queue *queue, int *value)
{
    if (QueueEmpty(queue))
    {
        return false;
    }
    *value = queue->data[queue->front];
    // Advancing front is the entire removal; the old bytes remain but are outside [front, rear).
    queue->front = (queue->front + 1) % QUEUE_CAPACITY;
    return true;
}

// QueueFront is read-only and leaves front unchanged, so the same item can still be dequeued later.
bool QueueFront(const Queue *queue, int *value)
{
    if (QueueEmpty(queue))
    {
        return false;
    }
    *value = queue->data[queue->front];
    return true;
}

int main(void)
{
    Queue queue;
    InitQueue(&queue);

    for (int value = 1; value <= QUEUE_CAPACITY - 1; ++value)
    {
        Enqueue(&queue, value);
    }
    printf("full: %s\n", QueueFull(&queue) ? "yes" : "no");

    int front = 0;
    if (QueueFront(&queue, &front))
    {
        printf("front: %d\n", front);
    }

    int value = 0;
    if (Dequeue(&queue, &value))
    {
        printf("dequeue: %d\n", value);
    }

    if (Enqueue(&queue, QUEUE_CAPACITY))
    {
        printf("wrapped rear: %d\n", queue.rear);
    }

    while (Dequeue(&queue, &value))
    {
        printf("dequeue: %d\n", value);
    }
    printf("empty: %s\n", QueueEmpty(&queue) ? "yes" : "no");
    return 0;
}

/*
 * 中文导读：用循环数组实现先进先出；front 指队首，rear 指下一个待写入空位。
 * 阅读顺序：先看“牺牲一个单元”的空/满约定；再看 enqueue 写 rear 后取模；然后看 dequeue 读 front 后取模。
 * 关键不变量：front == rear 为空，(rear + 1) % capacity == front 为满；有效元素最多 capacity - 1 个。
 * 易错点：把 rear 当成最后一个元素；混用 count 与牺牲单元两套规则；自增后忘记取模；空队列仍读 front。
 * 复杂度：enqueue/dequeue/front O(1)，空间 O(capacity)。
 * 输入/输出：输入 main 内置的演示操作序列；入队/出队返回成功或队头；main 打印出队顺序。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
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

// Purpose: Initialize an empty queue with front = rear = 0; front == rear means empty.
/*
 * 作用：初始化空队列。front = rear = 0；此后 front == rear 表示空。
 */
void InitQueue(Queue *queue)
{
    queue->front = 0;
    queue->rear = 0;
}

// Purpose: Read-only empty check; under the reserved-slot convention, front == rear means empty.
/*
 * 作用：只读判断队列是否为空。牺牲单元约定下，front == rear 就是空。
 */
bool QueueEmpty(const Queue *queue)
{
    return queue->front == queue->rear;
}

// front == rear means empty; one reserved slot makes (rear + 1) % capacity == front full.

// Purpose: Read-only full check: if the slot after rear meets front, only the reserved slot remains.
/*
 * 作用：只读判断队列是否已满。rear 的下一个位置若撞上 front，就说明数组里
 * 只剩那个保留空位，不能再入队。
 */
bool QueueFull(const Queue *queue)
{
    return (queue->rear + 1) % QUEUE_CAPACITY == queue->front;
}

// Purpose: Enqueue: check fullness, write value to data[rear], then advance rear modulo capacity.
/*
 * 作用：入队。先判满，再把 value 写入 data[rear]，最后让 rear 取模后移。
 * 取模使 rear 从最后一个下标回到 0，完成物理数组上的回绕。
 */
bool Enqueue(Queue *queue, int value)
{
    if (QueueFull(queue))
    {
        return false;
    }
    queue->data[queue->rear] = value;
    queue->rear = (queue->rear + 1) % QUEUE_CAPACITY;
    return true;
}

// Purpose: Dequeue: return false when empty; otherwise read data[front] and advance front modulo capacity.
/*
 * 作用：出队。空队列返回 false；否则读取 data[front]，再让 front 取模后移。
 * 前移即可，不需要搬移其余元素。
 */
bool Dequeue(Queue *queue, int *value)
{
    if (QueueEmpty(queue))
    {
        return false;
    }
    *value = queue->data[queue->front];
    queue->front = (queue->front + 1) % QUEUE_CAPACITY;
    return true;
}

// Purpose: Read the queue front without removing it; access data[front] and leave front unchanged.
/*
 * 作用：读取队首但不删除。只访问 data[front]，不移动 front。
 */
bool QueueFront(const Queue *queue, int *value)
{
    if (QueueEmpty(queue))
    {
        return false;
    }
    *value = queue->data[queue->front];
    return true;
}

// Purpose: Demonstrate filling the queue, reading the front, dequeueing and wrap-around enqueueing, printing each state.
/*
 * 作用：演示入队到满、读取队首、出队、回绕后再入队，并输出每一步状态。
 */
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

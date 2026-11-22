/*
 * 中文导读：按访问根结点的时机区分前序、中序、后序；层序遍历则借助队列逐层访问。
 * 阅读顺序：先看递归函数中 visit 放在两次递归的哪一侧；再看显式栈版本为什么要一路压左孩子；最后看层序队列的 size 分层。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：前/中/后序访问语句位置放错；显式栈弹栈后忘记右子树；层序不记录每层 size 导致分层错误；空树边界。
 * 复杂度：O(n) 时间，递归 O(h) 栈 / 层序 O(width) 队列。
 * 输入/输出：输入 main 内置的二叉树；中序/层序遍历把键写入输出数组；main 打印序列。
*/

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

typedef struct BiTNode
{
    int data;
    struct BiTNode *left;
    struct BiTNode *right;
} BiTNode;

typedef struct
{
    BiTNode *items[MAX_NODES];
    int front;
    int rear;
    int count;
} Queue;

// Purpose: Initialize the circular queue with front = rear = 0 and no elements.
// 作用：初始化顺序队列：front=rear=0，元素个数为 0。
void queue_init(Queue *q)
{
    q->front = 0;
    q->rear = 0;
    q->count = 0;
}

// Purpose: Append a tree-node pointer to the sequential queue; return 0 when the queue is full.
// 作用：把树结点指针放入顺序队列尾部；队列满返回 0。
int queue_enqueue(Queue *q, BiTNode *node)
{
    if (q->count == MAX_NODES)
    {
        return 0;
    }
    q->items[q->rear] = node;
    q->rear = (q->rear + 1) % MAX_NODES;
    q->count++;
    return 1;
}

// Purpose: Remove the tree-node pointer at the queue front; return NULL when the queue is empty.
// 作用：从队首取出树结点指针；队列空返回 NULL。
BiTNode *queue_dequeue(Queue *q)
{
    if (q->count == 0)
    {
        return NULL;
    }
    BiTNode *node = q->items[q->front];
    q->front = (q->front + 1) % MAX_NODES;
    q->count--;
    return node;
}

// Visit each node exactly once, level by level and left to right.
// The FIFO queue holds pending nodes; enqueue children after visiting the parent to keep level order.
// Purpose: Visit the tree level by level with a queue: enqueue the root, then enqueue left and right children after each dequeue, using each level's size.
// 作用：借助队列逐层访问二叉树：先根，出队后把左右孩子依次入队；用每层 size 分层输出。
void level_order(BiTNode *root)
{
    if (root == NULL)
    {
        return;
    }

    Queue q;
    queue_init(&q);
    queue_enqueue(&q, root);

    while (q.count > 0)
    {
        BiTNode *node = queue_dequeue(&q);
        printf("%d ", node->data);

        if (node->left != NULL)
        {
            queue_enqueue(&q, node->left);
        }
        if (node->right != NULL)
        {
            queue_enqueue(&q, node->right);
        }
    }
}

int main(void)
{
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

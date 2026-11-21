/* 线索二叉树的中序线索化与线索遍历 — AlgoViz C 参考实现。
 *
 * 中文导读：n 个结点的二叉树有 n+1 个空指针。本实现不新增结点，只把空左
 * 指针改写成指向前驱的线索、空右指针改写成指向后继的线索，并用 ltag /
 * rtag 区分“真实孩子”与“线索”。线索完成后，中序遍历不需要递归栈。
 *
 * 阅读顺序：先看 ThreadNode 的字段，再看 thread_walk 的“左 → 根 → 右”
 * 处理，最后看 inorder_by_threads 如何沿线索前进。
 *
 * 关键不变量：
 * 1. ltag==0 时 left 指向真实孩子；ltag==1 时 left 为空，left_thread 是线索。
 * 2. 右指针同理，rtag==1 时 right 为空，right_thread 是后继线索。
 * 3. 中序第一个结点的左线索为空，最后一个结点的右线索为空，但 tag 仍为 1。
 */

#include <stdio.h>
#include <stdlib.h>

// Thread null left pointers into predecessors and null right pointers into successors.

typedef struct ThreadNode
{
    int value;
    struct ThreadNode *left;
    struct ThreadNode *right;
    struct ThreadNode *left_thread;
    struct ThreadNode *right_thread;
    int ltag;
    int rtag;
} ThreadNode;

typedef struct
{
    ThreadNode *prev;
    ThreadNode *last;
} ThreadState;

static ThreadNode *make_node(int value)
{
    ThreadNode *node = (ThreadNode *)malloc(sizeof(ThreadNode));
    if (node == NULL)
    {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    node->value = value;
    node->left = NULL;
    node->right = NULL;
    node->left_thread = NULL;
    node->right_thread = NULL;
    node->ltag = 0;
    node->rtag = 0;
    return node;
}

static void thread_walk(ThreadNode *node, ThreadState *state)
{
    if (node == NULL)
    {
        return;
    }

    /* 左子树必须先完成，state->prev 才是当前结点的中序前驱。 */
    thread_walk(node->left, state);

    if (node->left == NULL)
    {
        /* 空左指针变成前驱线索；真实 left 仍保持 NULL。 */
        node->ltag = 1;
        node->left_thread = state->prev;
    }
    if (state->prev != NULL && state->prev->right == NULL)
    {
        /* 前驱右指针为空，当前结点正好是它的中序后继。 */
        state->prev->rtag = 1;
        state->prev->right_thread = node;
    }

    state->prev = node;
    state->last = node;
    thread_walk(node->right, state);
}

static void thread_inorder(ThreadNode *root)
{
    ThreadState state;
    state.prev = NULL;
    state.last = NULL;
    thread_walk(root, &state);

    /* 最后一个中序结点没有后继，但右指针仍标记为线索。 */
    if (state.last != NULL && state.last->right == NULL)
    {
        state.last->rtag = 1;
        state.last->right_thread = NULL;
    }
}

static ThreadNode *leftmost(ThreadNode *node)
{
    while (node != NULL && node->ltag == 0)
    {
        node = node->left;
    }
    return node;
}

static void inorder_by_threads(ThreadNode *root)
{
    ThreadNode *node = leftmost(root);
    printf("threaded inorder:");
    while (node != NULL)
    {
        printf(" %d", node->value);
        if (node->rtag == 1)
        {
            /* 右指针是线索，直接跳到后继；后继为空则结束。 */
            node = node->right_thread;
        }
        else
        {
            /* 右指针是真实孩子，后继是右子树的最左结点。 */
            node = leftmost(node->right);
        }
    }
    printf("\n");
}

static int count_tags(ThreadNode *node)
{
    if (node == NULL)
    {
        return 0;
    }
    return node->ltag + node->rtag + count_tags(node->left) + count_tags(node->right);
}

static void free_tree(ThreadNode *node)
{
    if (node == NULL)
    {
        return;
    }
    /* 只释放真实孩子；线索指向的结点由别的真实边负责释放，不能重复 free。 */
    if (node->ltag == 0)
    {
        free_tree(node->left);
    }
    if (node->rtag == 0)
    {
        free_tree(node->right);
    }
    free(node);
}

int main(void)
{
    /* 教学树：4 为根，2/6 为第二层，1/3 为 2 的左右孩子，中序为 1 2 3 4 6。 */
    ThreadNode *root = make_node(4);
    ThreadNode *two = make_node(2);
    ThreadNode *six = make_node(6);
    ThreadNode *one = make_node(1);
    ThreadNode *three = make_node(3);

    root->left = two;
    root->right = six;
    two->left = one;
    two->right = three;

    thread_inorder(root);
    printf("tagged pointers = %d\n", count_tags(root));
    inorder_by_threads(root);

    free_tree(root);
    return 0;
}

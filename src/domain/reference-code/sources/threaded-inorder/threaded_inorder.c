/* 线索二叉树的中序线索化与线索遍历 — AlgoViz C 参考实现。
 *
 * 中文导读：n 个结点的二叉树有 n+1 个空指针。本实现不覆盖真实孩子指针，
 * 而是为每个结点额外保存 left_thread / right_thread 两个线索字段；空 left /
 * right 仍为 NULL，由 ltag / rtag 标记线索是否有效。线索完成后，中序遍历
 * 不需要递归栈。
 *
 * 阅读顺序：先看 ThreadNode 的字段，再看 thread_walk 的“左 → 根 → 右”
 * 处理，最后看 inorder_by_threads 如何沿线索前进。
 *
 * 关键不变量：
 * 1. ltag==0 时 left 是真实孩子；ltag==1 时 left 为 NULL，前驱保存在
 *    left_thread 中。
 * 2. 右指针同理：rtag==1 时 right 为 NULL，后继保存在 right_thread 中。
 * 3. 中序第一个结点的前驱线索为空，最后一个结点的后继线索为空，但 tag 仍为 1。
 */

/*
 * Threaded binary tree: in-order threading and traversal in C11.
 *
 * A binary tree with n nodes has n+1 null links. This implementation keeps the
 * child links untouched and stores predecessor/successor in separate
 * left_thread/right_thread fields; a null left/right pointer with a tag of 1
 * means "use the thread field". Threading is O(n); traversal is O(n) time and
 * O(1) extra space.
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct ThreadNode
{
    int value;
    struct ThreadNode *left;
    struct ThreadNode *right;
    // Thread targets live in separate fields, so a real left/right child is never overwritten. ltag/rtag tell traversal which pointer is meaningful.
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

// Tags start at 0 because both child pointers begin as NULL; a thread is written only after the real child is known to be absent.
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

// One prev pointer is enough: in-order recursion visits exactly one predecessor immediately before each node, so threading never needs an ancestor stack.
static void thread_walk(ThreadNode *node, ThreadState *state)
{
    if (node == NULL)
    {
        return;
    }

    thread_walk(node->left, state);

    // A missing real left child is exactly the slot that can store the predecessor. prev is NULL only for the first in-order node, and that NULL is itself the correct no-predecessor thread.
    if (node->left == NULL)
    {
        node->ltag = 1;
        node->left_thread = state->prev;
    }
    // The current node is the predecessor's successor only when the predecessor has no real right child. If it has a right child, the successor lies inside that subtree, so this thread must not be written.
    if (state->prev != NULL && state->prev->right == NULL)
    {
        state->prev->rtag = 1;
        state->prev->right_thread = node;
    }

    // Advance prev only after both links are handled. The next node must see this node as its predecessor, while this node's successor may be written when the next node is visited.
    state->prev = node;
    state->last = node;
    thread_walk(node->right, state);
}

// The whole walk must finish before the tail is patched: only then is last the true in-order tail whose right thread is empty.
static void thread_inorder(ThreadNode *root)
{
    ThreadState state;
    state.prev = NULL;
    state.last = NULL;
    thread_walk(root, &state);

    // The in-order tail has no successor, but its right link is still a thread. Setting rtag=1 with a NULL thread records that the absence is intentional, not a forgotten real child.
    if (state.last != NULL && state.last->right == NULL)
    {
        state.last->rtag = 1;
        state.last->right_thread = NULL;
    }
}

// ltag==0 means left is a real child; stopping at the first tag==1 node returns this subtree's first in-order node.
static ThreadNode *leftmost(ThreadNode *node)
{
    while (node != NULL && node->ltag == 0)
    {
        node = node->left;
    }
    return node;
}

// The walk needs no recursion stack: a right thread jumps directly to the successor, otherwise the successor is the leftmost node of the real right subtree.
static void inorder_by_threads(ThreadNode *root)
{
    ThreadNode *node = leftmost(root);
    printf("threaded inorder:");
    while (node != NULL)
    {
        printf(" %d", node->value);
        // rtag==1 means right is not a real child, so right_thread is the successor. rtag==0 means descend into the real right subtree and take its leftmost node.
        if (node->rtag == 1)
        {
            node = node->right_thread;
        }
        else
        {
            node = leftmost(node->right);
        }
    }
    printf("\n");
}

// Each node contributes its two tags; summing over real children counts every thread once and should equal n+1.
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
    // Each node is freed once through the real edge that owns it; thread edges do not own their targets.
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

// The demo builds only real child edges; threading then creates non-owning aliases that traversal reads.
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

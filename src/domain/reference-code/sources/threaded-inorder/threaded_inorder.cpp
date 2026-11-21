// 线索二叉树的中序线索化与线索遍历 — AlgoViz C++ 参考实现。
//
// 中文导读：用 unique_ptr 管理真实孩子，线索只是不拥有结点的裸指针。
// 空左指针写入前驱、空右指针写入后继，并用 ltag / rtag 区分两者。
// 线索完成后中序遍历只靠当前指针，额外空间 O(1)。
//
// 关键不变量：
// 1. unique_ptr 只管理真实孩子，绝不接管线索，否则会重复释放或形成环。
// 2. ltag==1 时 left 为空且 left_thread 是线索；右指针规则相同。
// 3. 中序第一个结点没有前驱，最后一个结点没有后继，但 tag 都为 1。

/*
 * Threaded binary tree: in-order threading and traversal in C++17.
 *
 * unique_ptr owns only real children. Null left/right links are reused to store
 * in-order predecessor/successor threads, and ltag/rtag distinguish a real child
 * (0) from a thread (1). Because threads are non-owning raw pointers, destruction
 * follows only real children and cannot double-free or form ownership cycles.
 * Threading O(n), traversal O(n) time and O(1) extra space.
 */

#include <iostream>
#include <memory>
#include <utility>

// Thread null left pointers into predecessors and null right pointers into successors.

struct Node
{
    int value;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    Node *left_thread = nullptr;
    Node *right_thread = nullptr;
    int ltag = 0;
    int rtag = 0;

    explicit Node(int value) : value(value)
    {
    }
};

// 作用：沿真实左孩子走到子树中序第一个结点。
// Purpose: Follow real left children to the first in-order node of this subtree.
static Node *leftmost(Node *node)
{
    while (node != nullptr && node->ltag == 0)
    {
        node = node->left.get();
    }
    return node;
}

// 作用：中序递归线索化；prev 与 last 通过引用回传，保证递归各层看到同一状态。
// Purpose: Thread in order; prev/last are reference outputs shared by every recursive call.
static void thread_walk(Node *node, Node *&prev, Node *&last)
{
    if (node == nullptr)
    {
        return;
    }

    // 左子树完成后，prev 才是当前结点的中序前驱。
    // Purpose: Finish the left subtree first so prev is the current predecessor.
    thread_walk(node->left.get(), prev, last);

    if (node->left == nullptr)
    {
        node->ltag = 1;
        node->left_thread = prev;
    }
    if (prev != nullptr && prev->right == nullptr)
    {
        prev->rtag = 1;
        prev->right_thread = node;
    }

    prev = node;
    last = node;
    thread_walk(node->right.get(), prev, last);
}

// 作用：线索化整棵树；最后给中序尾结点补一条空后继线索。
// Purpose: Thread the tree, then tag the in-order tail's empty successor link.
static void thread_inorder(Node *root)
{
    Node *prev = nullptr;
    Node *last = nullptr;
    thread_walk(root, prev, last);

    if (last != nullptr && last->right == nullptr)
    {
        last->rtag = 1;
        last->right_thread = nullptr;
    }
}

// 作用：不借助递归栈，靠线索或右子树最左结点逐步求后继。
// Purpose: Traverse with no stack; each step uses a thread or the right subtree's leftmost node.
static void inorder_by_threads(Node *root)
{
    Node *node = leftmost(root);
    std::cout << "threaded inorder:";
    while (node != nullptr)
    {
        std::cout << ' ' << node->value;
        if (node->rtag == 1)
        {
            // 右指针是线索，直接跳到后继；空后继结束遍历。
            // Purpose: A right thread is the successor directly; null ends the walk.
            node = node->right_thread;
        }
        else
        {
            // 真实右孩子：后继是右子树的最左结点。
            // Purpose: A real right child means the successor is that subtree's leftmost node.
            node = leftmost(node->right.get());
        }
    }
    std::cout << '\n';
}

// 作用：统计线索数；n 个结点应有 n+1 条线索，用于自检。
// Purpose: Count threads; an n-node tree has n+1, which serves as a self-check.
static int count_tags(const Node *node)
{
    if (node == nullptr)
    {
        return 0;
    }
    return node->ltag + node->rtag + count_tags(node->left.get()) + count_tags(node->right.get());
}

// 作用：构造教学树，线索化后打印线索数和无线索栈的中序序列。
// Purpose: Build the sample tree, thread it, and print both checks.
int main()
{
    auto root = std::make_unique<Node>(4);
    root->left = std::make_unique<Node>(2);
    root->right = std::make_unique<Node>(6);
    root->left->left = std::make_unique<Node>(1);
    root->left->right = std::make_unique<Node>(3);

    thread_inorder(root.get());
    std::cout << "tagged pointers = " << count_tags(root.get()) << '\n';
    inorder_by_threads(root.get());
    return 0;
}

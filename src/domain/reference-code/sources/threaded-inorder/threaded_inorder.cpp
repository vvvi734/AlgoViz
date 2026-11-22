// 线索二叉树的中序线索化与线索遍历 — AlgoViz C++ 参考实现。
//
// 中文导读：用 unique_ptr 管理真实孩子，线索保存在独立的 left_thread / right_thread 裸指针中，不拥有结点。
// 空 left / right 仍为 NULL；ltag / rtag 只表示对应线索字段是否有效。
// 线索完成后中序遍历只靠当前指针，额外空间 O(1)。
//
// 关键不变量：
// 1. unique_ptr 只管理真实孩子，绝不接管线索，否则会重复释放或形成环。
// 2. ltag==1 时 left 为空且 left_thread 是线索；右指针规则相同。
// 3. 中序第一个结点没有前驱，最后一个结点没有后继，但 tag 都为 1。

/*
 * Threaded binary tree: in-order threading and traversal in C++17.
 *
 * unique_ptr owns only real children. Threads are stored in separate
 * left_thread/right_thread raw pointers rather than overwriting child links;
 * a real left/right pointer stays null, and ltag/rtag say whether the thread
 * field is valid. Because threads are non-owning, destruction follows only real
 * children and cannot double-free or form ownership cycles.
 * Threading O(n), traversal O(n) time and O(1) extra space.
 */

#include <iostream>
#include <memory>
#include <utility>

struct Node
{
    int value;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    // unique_ptr owns only real children; thread targets are non-owning raw pointers. Keeping them separate prevents ownership cycles and accidental deletion of a threaded target.
    Node *left_thread = nullptr;
    Node *right_thread = nullptr;
    int ltag = 0;
    int rtag = 0;

    explicit Node(int value) : value(value)
    {
    }
};

// ltag==0 proves the left link is a real child; the loop stops as soon as it meets a thread, which marks the subtree's first in-order node.
static Node *leftmost(Node *node)
{
    while (node != nullptr && node->ltag == 0)
    {
        node = node->left.get();
    }
    return node;
}

// prev and last are reference outputs so every recursive frame updates one shared threading state; in-order order makes prev the true predecessor.
static void thread_walk(Node *node, Node *&prev, Node *&last)
{
    if (node == nullptr)
    {
        return;
    }

    thread_walk(node->left.get(), prev, last);

    // A null real left child is the exact place to store the predecessor. prev is null only for the first in-order node, and that null is the correct end-of-thread value.
    if (node->left == nullptr)
    {
        node->ltag = 1;
        node->left_thread = prev;
    }
    // The current node is the predecessor's successor only if the predecessor has no real right child. When a real right subtree exists, its leftmost node is the successor instead.
    if (prev != nullptr && prev->right == nullptr)
    {
        prev->rtag = 1;
        prev->right_thread = node;
    }

    // Move prev after both connections. The next visit must use this node as its predecessor, and this node's successor link may be filled when the next node is processed.
    prev = node;
    last = node;
    thread_walk(node->right.get(), prev, last);
}

// After the walk, last is the true in-order tail; only it still needs an explicit empty successor tag.
static void thread_inorder(Node *root)
{
    Node *prev = nullptr;
    Node *last = nullptr;
    thread_walk(root, prev, last);

    // The final in-order node has no successor. rtag=1 plus a null thread says the empty link is intentional, not a real child that was lost.
    if (last != nullptr && last->right == nullptr)
    {
        last->rtag = 1;
        last->right_thread = nullptr;
    }
}

// Each step either follows a ready successor thread or descends to the leftmost node of a real right subtree; no call stack is involved.
static void inorder_by_threads(Node *root)
{
    Node *node = leftmost(root);
    std::cout << "threaded inorder:";
    while (node != nullptr)
    {
        std::cout << ' ' << node->value;
        // A tagged right link already points at the successor. Otherwise right is a real child, and the successor is the leftmost node of that subtree.
        if (node->rtag == 1)
        {
            node = node->right_thread;
        }
        else
        {
            node = leftmost(node->right.get());
        }
    }
    std::cout << '\n';
}

// Tagging every null child link once gives n+1 threads for n nodes; the count is a structural self-check.
static int count_tags(const Node *node)
{
    if (node == nullptr)
    {
        return 0;
    }
    return node->ltag + node->rtag + count_tags(node->left.get()) + count_tags(node->right.get());
}

// Owning unique_ptr links build the demo tree; traversal later reads only non-owning thread fields.
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

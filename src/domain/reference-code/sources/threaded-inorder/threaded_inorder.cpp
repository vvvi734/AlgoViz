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

static Node *leftmost(Node *node)
{
    while (node != nullptr && node->ltag == 0)
    {
        node = node->left.get();
    }
    return node;
}

static void thread_walk(Node *node, Node *&prev, Node *&last)
{
    if (node == nullptr)
    {
        return;
    }

    // 左子树完成后，prev 才是当前结点的中序前驱。
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
            node = node->right_thread;
        }
        else
        {
            // 真实右孩子：后继是右子树的最左结点。
            node = leftmost(node->right.get());
        }
    }
    std::cout << '\n';
}

static int count_tags(const Node *node)
{
    if (node == nullptr)
    {
        return 0;
    }
    return node->ltag + node->rtag + count_tags(node->left.get()) + count_tags(node->right.get());
}

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

/*
 * 中文导读：按访问根结点的时机区分前序、中序、后序；层序遍历则借助队列逐层访问。
 * 阅读顺序：先看递归函数中 visit 放在两次递归的哪一侧；再看显式栈版本为什么要一路压左孩子；最后看层序队列的 size 分层。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：前/中/后序访问语句位置放错；显式栈弹栈后忘记右子树；层序不记录每层 size 导致分层错误；空树边界。
 * 复杂度：O(n) 时间，递归 O(h) 栈 / 层序 O(width) 队列。
 * 输入/输出：输入 main 内置的二叉树；中序/层序遍历把键写入输出数组；main 打印序列。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: level-order traversal with std::queue (C++17).
// This convenience file adds a fourth traversal alongside the recursive
// preorder/inorder/postorder reference implementation.
//
// Reading guide:
// 1. Push the root into std::queue.
// 2. Pop the front, print it, then push its left child and right child.
// 3. Repeat until the queue is empty; FIFO gives top-to-bottom, left-to-right order.
//
// Complexity: O(n) time; extra space O(w), where w is the maximum level width
// (O(n) worst case). Convention: nullptr is an empty subtree.

#include <iostream>
#include <queue>

struct Node
{
    int value = 0;
    Node *left = nullptr;
    Node *right = nullptr;
};

// The FIFO queue holds pending nodes; enqueue children after visiting the parent to keep level order.
// 作用：借助队列逐层访问二叉树：先根，出队后把左右孩子依次入队；用每层 size 分层输出。
void level_order(const Node *root)
{
    if (!root)
    {
        return;
    }

    std::queue<const Node *> pending;
    pending.push(root);

    while (!pending.empty())
    {
        const Node *node = pending.front();
        pending.pop();
        std::cout << node->value << ' ';

        if (node->left)
        {
            pending.push(node->left);
        }
        if (node->right)
        {
            pending.push(node->right);
        }
    }
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    Node one{1, nullptr, nullptr};
    Node three{3, nullptr, nullptr};
    Node six{6, nullptr, nullptr};
    Node two{2, &one, &three};
    Node four{4, &two, &six};

    std::cout << "level order: ";
    level_order(&four);
    std::cout << '\n';
    std::cout << "empty: ";
    level_order(nullptr);
    std::cout << '\n';
    return 0;
}

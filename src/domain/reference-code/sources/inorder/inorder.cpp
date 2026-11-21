/*
 * 中文导读：按访问根结点的时机区分前序、中序、后序；层序遍历则借助队列逐层访问。
 * 阅读顺序：先看递归函数中 visit 放在两次递归的哪一侧；再看显式栈版本为什么要一路压左孩子；最后看层序队列的 size 分层。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：前/中/后序访问语句位置放错；显式栈弹栈后忘记右子树；层序不记录每层 size 导致分层错误；空树边界。
 * 复杂度：O(n) 时间，递归 O(h) 栈 / 层序 O(width) 队列。
 */

// AlgoViz reference implementation: inorder traversal (C++17).
// Visits left subtree, root, then right subtree; the result is sorted
// for a binary search tree.
//
// Reading guide:
// 1. Recurse into the left subtree.
// 2. Visit the current node.
// 3. Recurse into the right subtree; a BST therefore yields ascending keys.
//
// Complexity: O(n); extra space O(h) recursion, where h is the tree height.
// Convention: NULL/None is an empty subtree; output is emitted in visit order.

#include <iostream>

struct Node
{
    int value = 0;
    Node *left = nullptr;
    Node *right = nullptr;
};

// Left subtree, then node, then right subtree; a BST yields ascending keys.
// Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.
// 作用：中序遍历：先左子树，再访问根，最后右子树；只读。
void inorder(const Node *node)
{
    if (!node)
    {
        return;
    }
    inorder(node->left);
    std::cout << node->value << ' ';
    inorder(node->right);
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    Node one{1, nullptr, nullptr};
    Node three{3, nullptr, nullptr};
    Node five{5, nullptr, nullptr};
    Node seven{7, nullptr, nullptr};
    Node two{2, &one, &three};
    Node six{6, &five, &seven};
    Node four{4, &two, &six};

    std::cout << "inorder: ";
    inorder(&four);
    std::cout << "\nempty: ";
    inorder(nullptr);
    std::cout << "done\n";
    return 0;
}

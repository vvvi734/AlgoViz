/*
 * 中文导读：递归实现二叉树的中序遍历，访问顺序固定为“左子树、根、右子树”。
 * 阅读顺序：先看空指针递归出口；再看左递归返回后访问根；最后看右递归与 BST 升序性质。
 * 关键不变量：递归栈保存的是尚未访问完的祖先；中序输出始终按左—根—右。
 * 易错点：先访问根再走左子树会变成前序；忘记空指针出口；把右递归写在访问之前。
 * 复杂度：O(n) 时间，O(h) 递归栈空间，h 为树高。
 * 输入/输出：输入 main 内置的二叉树；按中序打印键；空树不输出任何键。
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
void inorder(const Node *node)
{
    // nullptr is the empty subtree, so return without touching value or child links; this base case stops every descent.
    if (!node)
    {
        return;
    }
    // The left call must return before the root is printed; the call stack holds ancestors whose right subtrees are still pending.
    inorder(node->left);
    // Visiting between the two recursive calls is the definition of inorder; moving this line changes the traversal order.
    std::cout << node->value << ' ';
    // The right subtree runs after the root, so a BST emits keys in ascending order.
    inorder(node->right);
}

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

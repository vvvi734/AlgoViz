/*
 * 中文导读：利用左小右大的中序顺序，把查找、插入、删除限制在一条根到叶的路径上。
 * 阅读顺序：先看 insert() 如何比较并下探；再看 search() 的循环/递归；最后看 delete() 的三种情况，尤其两个孩子的替换。
 * 关键不变量：任意结点左子树所有键小于它，右子树所有键大于它；中序遍历得到升序。
 * 易错点：删除双子结点时只改值却忘记删除后继；重复键处理不一致；用引用/指针更新父结点时接错边。
 * 复杂度：平均 O(log n)，最坏 O(n)（退化成链）；额外空间 O(n)。
 */

// AlgoViz reference implementation: binary search tree (C++17).
// Insert, search, remove and inorder traversal for unique integer keys.
//
// Reading guide:
// 1. Invariant: every left key is smaller and every right key is larger than the
//    node.
// 2. Insert/search descend exactly one branch per level.
// 3. Removal has three cases: leaf, one child, or two children replaced by the
//    inorder successor.
//
// Complexity: O(h) per operation, O(log n) average and O(n) worst; extra space
//   O(h) recursion.
// Convention: Keys are unique integers; the inorder traversal is the sorted key
//   sequence.

#include <iostream>
#include <memory>

class BST
{
  public:
    struct Node
    {
        // 作用：构造 BST 结点：保存键值，左右孩子置空。
        explicit Node(int key) : value(key)
        {
        }
        int value;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
    };

    // Descend one branch by key comparison; duplicates are ignored by the insert contract.
    // BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.
    // 作用：在 BST 中插入 value；重复键忽略，返回新的子树根。
    void insert(int value)
    {
        root_ = insert(std::move(root_), value);
    }

    // 作用：按左小右大下探查找 value；找到返回 true。
    bool contains(int value) const
    {
        Node *node = root_.get();
        while (node)
        {
            if (value == node->value)
            {
                return true;
            }
            node = value < node->value ? node->left.get() : node->right.get();
        }
        return false;
    }

    // 作用：删除 value：分叶子、单孩子、双孩子三种情况；双孩子用右子树最小结点替换。
    void remove(int value)
    {
        root_ = remove(std::move(root_), value);
    }

    // 作用：中序遍历整棵树并输出升序键值；静态重载负责递归左—根—右，只读。
    void inorder() const
    {
        inorder(root_.get());
        std::cout << '\n';
    }

    // 作用：返回根指针供只读访问；不要绕过封装修改树结构。
    const Node *root() const
    {
        return root_.get();
    }

  private:
    // 作用：在 BST 中插入 value；重复键忽略，返回新的子树根。
    static std::unique_ptr<Node> insert(std::unique_ptr<Node> node, int value)
    {
        if (!node)
        {
            return std::make_unique<Node>(value);
        }
        if (value < node->value)
        {
            node->left = insert(std::move(node->left), value);
        }
        else if (value > node->value)
        {
            node->right = insert(std::move(node->right), value);
        }
        return node;
    }

    // 作用：删除 value：分叶子、单孩子、双孩子三种情况；双孩子用右子树最小结点替换。
    static std::unique_ptr<Node> remove(std::unique_ptr<Node> node, int value)
    {
        if (!node)
        {
            return nullptr;
        }
        if (value < node->value)
        {
            node->left = remove(std::move(node->left), value);
            return node;
        }
        if (value > node->value)
        {
            node->right = remove(std::move(node->right), value);
            return node;
        }
        if (!node->left)
        {
            return std::move(node->right);
        }
        if (!node->right)
        {
            return std::move(node->left);
        }
        Node *successor = node->right.get();
        while (successor->left)
        {
            successor = successor->left.get();
        }
        node->value = successor->value;
        node->right = remove(std::move(node->right), successor->value);
        return node;
    }

    // 作用：中序遍历整棵树并输出升序键值；静态重载负责递归左—根—右，只读。
    static void inorder(const Node *node)
    {
        if (!node)
        {
            return;
        }
        inorder(node->left.get());
        std::cout << node->value << ' ';
        inorder(node->right.get());
    }

    std::unique_ptr<Node> root_;
};

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    BST tree;
    for (int key : {5, 2, 7, 1, 4, 6, 8, 3})
    {
        tree.insert(key);
    }

    std::cout << "inorder: ";
    tree.inorder();
    std::cout << "contains 4: " << (tree.contains(4) ? "yes" : "no") << '\n';
    std::cout << "contains 9: " << (tree.contains(9) ? "yes" : "no") << '\n';

    tree.remove(5);
    std::cout << "after remove 5: ";
    tree.inorder();
    std::cout << "root: " << tree.root()->value << '\n';
    return 0;
}

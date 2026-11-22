/*
 * 中文导读：利用左小右大的中序顺序，把查找、插入、删除限制在一条根到叶的路径上。
 * 阅读顺序：先看 insert() 如何比较并下探；再看 search() 的循环/递归；最后看 delete() 的三种情况，尤其两个孩子的替换。
 * 关键不变量：任意结点左子树所有键小于它，右子树所有键大于它；中序遍历得到升序。
 * 易错点：删除双子结点时只改值却忘记删除后继；重复键处理不一致；用引用/指针更新父结点时接错边。
 * 复杂度：平均 O(log n)，最坏 O(n)（退化成链）；额外空间 O(n)。
 * 输入/输出：输入整数键与待删除键；插入/删除原地修改树，中序输出升序键，查找返回是否存在。
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
        // Purpose: Construct a BST node with the key and null children.
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
    // Purpose: Start an insertion at the root and publish the returned subtree; the static overload does the real insert.
    // 作用：从根启动插入并接回返回的子树；真正的递归插入与去重由静态重载完成。
    void insert(int value)
    {
        root_ = insert(std::move(root_), value);
    }

    // Purpose: Descend by the left-smaller/right-larger rule to find value; return true on a hit.
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

    // Purpose: Start deletion at the root and publish the rebuilt subtree; the static overload handles leaf/one-child/two-child cases.
    // 作用：从根启动删除并接回重建的子树；叶子、单孩子、双孩子三种情况由静态重载处理。
    void remove(int value)
    {
        root_ = remove(std::move(root_), value);
    }

    // Purpose: Start the recursive inorder walk at the root and terminate the output line; read-only.
    // 作用：从 root 启动递归中序遍历并在末尾换行；只读，不修改树。
    void inorder() const
    {
        inorder(root_.get());
        std::cout << '\n';
    }

    // Purpose: Return the root pointer for read-only access; do not bypass the class to mutate the tree.
    // 作用：返回根指针供只读访问；不要绕过封装修改树结构。
    const Node *root() const
    {
        return root_.get();
    }

  private:
    // Purpose: Insert value into the BST, ignore duplicates, and return the new subtree root.
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

    // Purpose: Delete value in three cases: leaf, one child, or two children; with two children, replace it with the minimum node of the right subtree.
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

    // Purpose: Inorder traversal of the whole tree printing ascending keys; the static overload recurses left-root-right and is read-only.
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

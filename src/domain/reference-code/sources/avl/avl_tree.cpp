/*
 * 中文导读：在普通二叉搜索树上维护高度差，使查找、插入、删除都保持 O(log n)。
 * 阅读顺序：先看 Node 的 height 字段；再看 height()/balance_factor() 如何由子树高度算出；最后跟 insert() 的递归返回路径看四种旋转。
 * 关键不变量：任意结点的左右子树高度差只能是 -1、0、1；旋转后仍要满足 BST 的中序有序性。
 * 易错点：只改指针却忘记更新 height；把“不平衡”误判成只要左右高度相等；删除时没有沿整条返回路径继续修复。
 * 复杂度：查找/插入/删除 O(log n)，单次旋转 O(1)，额外空间 O(n)。
 * 输入/输出：输入 main 中的整数键序列；插入/删除原地修改树，中序输出升序键；重复键被忽略。
 * 函数地图：先读 main 的调用顺序，再按需查看被调用的静态函数；每个函数前的“作用”注释给出职责、输入和返回。
*/

// AlgoViz reference implementation: AVL tree (C++17).
// Height-balanced BST with LL, RR, LR and RL rotations on insert.
//
// Reading guide:
// 1. Each node stores its height; the balance factor is height(left) -
//    height(right).
// 2. Insert like a BST, then recompute heights while recursion unwinds.
// 3. If the balance factor leaves {-1, 0, 1}, apply LL, RR, LR or RL rotations.
//
// Complexity: O(log n) for insert/search; extra space O(h) = O(log n)
//   recursion.
// Convention: Height of an empty subtree is 0; duplicate keys are ignored.

#include <algorithm>
#include <iostream>
#include <memory>

class AVLTree
{
  public:
    struct Node
    {
        // Purpose: Construct an AVL node with the key, height 1 and null children.
        // 作用：构造 AVL 结点：保存键值，把高度置为 1，左右孩子置空。
        explicit Node(int key) : value(key), height(1)
        {
        }
        int value;
        int height;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
    };

    // Purpose: Insert value into the AVL tree, ignore duplicates, and update heights and rotate while recursion unwinds.
    // 作用：在 AVL 树中插入 value；重复键忽略，递归返回时更新高度并旋转修复平衡。
    void insert(int value)
    {
        root_ = insert(std::move(root_), value);
    }

    // Purpose: Inorder traversal of the whole tree printing ascending keys; read-only.
    // 作用：中序遍历整棵树并输出升序键值；只读。
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
    // Purpose: Return node height with null mapped to 0, the basis for balance-factor calculations.
    // 作用：返回结点高度；空指针返回 0，是平衡因子计算的基础。
    static int height(const Node *node)
    {
        return node ? node->height : 0;
    }

    // Purpose: Recompute the current node's height from child heights after a rotation.
    // 作用：由左右子树高度重算当前结点高度；旋转后必须调用。
    static void update_height(Node *node)
    {
        node->height = 1 + std::max(height(node->left.get()), height(node->right.get()));
    }

    // Purpose: Return left height minus right height; an absolute value greater than 1 means imbalance.
    // 作用：返回左子树高度减右子树高度；绝对值大于 1 表示失衡。
    static int balance_factor(const Node *node)
    {
        return node ? height(node->left.get()) - height(node->right.get()) : 0;
    }

    // Purpose: Rotate right and return the new subtree root; update the affected heights afterwards.
    // 作用：右旋并返回新的子树根；旋转后要更新受影响结点的高度。
    static std::unique_ptr<Node> rotate_right(std::unique_ptr<Node> y)
    {
        auto x = std::move(y->left);
        y->left = std::move(x->right);
        x->right = std::move(y);
        update_height(x->right.get());
        update_height(x.get());
        return x;
    }

    // Purpose: Rotate left and return the new subtree root; update the affected heights afterwards.
    // 作用：左旋并返回新的子树根；旋转后要更新受影响结点的高度。
    static std::unique_ptr<Node> rotate_left(std::unique_ptr<Node> x)
    {
        auto y = std::move(x->right);
        x->right = std::move(y->left);
        y->left = std::move(x);
        update_height(y->left.get());
        update_height(y.get());
        return y;
    }

    // Recompute height after insertion, then apply LL/RR/LR/RL if balance leaves {-1, 0, 1}.
    // Purpose: Choose LL, LR, RR or RL from the balance factor and return the repaired subtree root.
    // 作用：根据平衡因子选择 LL/LR/RR/RL 四种旋转，返回修复后的子树根。
    static std::unique_ptr<Node> balance(std::unique_ptr<Node> node)
    {
        update_height(node.get());
        // The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.
        int factor = balance_factor(node.get());
        if (factor > 1)
        {
            if (balance_factor(node->left.get()) < 0)
            {
                // LR case: repair the left-left shape with a left rotation on the child, then a right rotation.
                node->left = rotate_left(std::move(node->left));
            }
            return rotate_right(std::move(node));
        }
        if (factor < -1)
        {
            if (balance_factor(node->right.get()) > 0)
            {
                node->right = rotate_right(std::move(node->right));
            }
            return rotate_left(std::move(node));
        }
        return node;
    }

    // Purpose: Insert value into the AVL tree, ignore duplicates, and update heights and rotate while recursion unwinds.
    // 作用：在 AVL 树中插入 value；重复键忽略，递归返回时更新高度并旋转修复平衡。
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
        else
        {
            return node;
        }
        return balance(std::move(node));
    }

    // Purpose: Inorder traversal of the whole tree printing ascending keys; read-only.
    // 作用：中序遍历整棵树并输出升序键值；只读。
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

// Purpose: Run the core operations in order and print key states so abstract steps map to visible results.
// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    AVLTree tree;
    for (int key : {30, 20, 10, 25, 27, 5})
    {
        tree.insert(key);
    }

    std::cout << "inorder: ";
    tree.inorder();
    std::cout << "root: " << tree.root()->value << " height: " << tree.root()->height << '\n';
    return 0;
}

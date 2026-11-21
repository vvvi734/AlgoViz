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

class AVLTree {
 public:
    struct Node {
        explicit Node(int key) : value(key), height(1) {}
        int value;
        int height;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
    };

    void insert(int value) {
        root_ = insert(std::move(root_), value);
    }

    void inorder() const {
        inorder(root_.get());
        std::cout << '\n';
    }

    const Node* root() const {
        return root_.get();
    }

 private:
    static int height(const Node* node) {
        return node ? node->height : 0;
    }

    static void update_height(Node* node) {
        node->height = 1 + std::max(height(node->left.get()), height(node->right.get()));
    }

    static int balance_factor(const Node* node) {
        return node ? height(node->left.get()) - height(node->right.get()) : 0;
    }

    static std::unique_ptr<Node> rotate_right(std::unique_ptr<Node> y) {
        auto x = std::move(y->left);
        y->left = std::move(x->right);
        x->right = std::move(y);
        update_height(x->right.get());
        update_height(x.get());
        return x;
    }

    static std::unique_ptr<Node> rotate_left(std::unique_ptr<Node> x) {
        auto y = std::move(x->right);
        x->right = std::move(y->left);
        y->left = std::move(x);
        update_height(y->left.get());
        update_height(y.get());
        return y;
    }

    // Recompute height after insertion, then apply LL/RR/LR/RL if balance leaves {-1, 0, 1}.
    static std::unique_ptr<Node> balance(std::unique_ptr<Node> node) {
        update_height(node.get());
        // The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.
        int factor = balance_factor(node.get());
        if (factor > 1) {
            if (balance_factor(node->left.get()) < 0) {
                // LR case: repair the left-left shape with a left rotation on the child, then a right rotation.
                node->left = rotate_left(std::move(node->left));
            }
            return rotate_right(std::move(node));
        }
        if (factor < -1) {
            if (balance_factor(node->right.get()) > 0) {
                node->right = rotate_right(std::move(node->right));
            }
            return rotate_left(std::move(node));
        }
        return node;
    }

    static std::unique_ptr<Node> insert(std::unique_ptr<Node> node, int value) {
        if (!node) {
            return std::make_unique<Node>(value);
        }
        if (value < node->value) {
            node->left = insert(std::move(node->left), value);
        } else if (value > node->value) {
            node->right = insert(std::move(node->right), value);
        } else {
            return node;
        }
        return balance(std::move(node));
    }

    static void inorder(const Node* node) {
        if (!node) {
            return;
        }
        inorder(node->left.get());
        std::cout << node->value << ' ';
        inorder(node->right.get());
    }

    std::unique_ptr<Node> root_;
};

int main() {
    AVLTree tree;
    for (int key : {30, 20, 10, 25, 27, 5}) {
        tree.insert(key);
    }

    std::cout << "inorder: ";
    tree.inorder();
    std::cout << "root: " << tree.root()->value << " height: " << tree.root()->height << '\n';
    return 0;
}

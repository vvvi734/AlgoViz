// AlgoViz reference implementation: binary search tree (C++17).
// Original code written for this repository under the MIT License.
// Insert, search, remove and inorder traversal for unique integer keys.

#include <iostream>
#include <memory>

class BST {
 public:
    struct Node {
        explicit Node(int key) : value(key) {}
        int value;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
    };

    void insert(int value) {
        root_ = insert(std::move(root_), value);
    }

    bool contains(int value) const {
        Node* node = root_.get();
        while (node) {
            if (value == node->value) {
                return true;
            }
            node = value < node->value ? node->left.get() : node->right.get();
        }
        return false;
    }

    void remove(int value) {
        root_ = remove(std::move(root_), value);
    }

    void inorder() const {
        inorder(root_.get());
        std::cout << '\n';
    }

    const Node* root() const {
        return root_.get();
    }

 private:
    static std::unique_ptr<Node> insert(std::unique_ptr<Node> node, int value) {
        if (!node) {
            return std::make_unique<Node>(value);
        }
        if (value < node->value) {
            node->left = insert(std::move(node->left), value);
        } else if (value > node->value) {
            node->right = insert(std::move(node->right), value);
        }
        return node;
    }

    static std::unique_ptr<Node> remove(std::unique_ptr<Node> node, int value) {
        if (!node) {
            return nullptr;
        }
        if (value < node->value) {
            node->left = remove(std::move(node->left), value);
            return node;
        }
        if (value > node->value) {
            node->right = remove(std::move(node->right), value);
            return node;
        }
        if (!node->left) {
            return std::move(node->right);
        }
        if (!node->right) {
            return std::move(node->left);
        }
        Node* successor = node->right.get();
        while (successor->left) {
            successor = successor->left.get();
        }
        node->value = successor->value;
        node->right = remove(std::move(node->right), successor->value);
        return node;
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
    BST tree;
    for (int key : {5, 2, 7, 1, 4, 6, 8, 3}) {
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

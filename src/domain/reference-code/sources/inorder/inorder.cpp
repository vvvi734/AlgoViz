// AlgoViz reference implementation: inorder traversal (C++17).
// Original code written for this repository under the MIT License.
// Visits left subtree, root, then right subtree; the result is sorted
// for a binary search tree.

#include <iostream>

struct Node {
    int value = 0;
    Node* left = nullptr;
    Node* right = nullptr;
};

void inorder(const Node* node) {
    if (!node) {
        return;
    }
    inorder(node->left);
    std::cout << node->value << ' ';
    inorder(node->right);
}

int main() {
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

// AlgoViz reference implementation: inorder traversal (C++17).
// Original code written for this repository under the MIT License.
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

struct Node {
    int value = 0;
    Node* left = nullptr;
    Node* right = nullptr;
};

// Left subtree, then node, then right subtree; a BST yields ascending keys.
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

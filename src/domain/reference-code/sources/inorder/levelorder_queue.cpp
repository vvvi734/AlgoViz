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

struct Node {
    int value = 0;
    Node* left = nullptr;
    Node* right = nullptr;
};

// The FIFO queue holds pending nodes; enqueue children after visiting the parent to keep level order.
void level_order(const Node* root) {
    if (!root) {
        return;
    }

    std::queue<const Node*> pending;
    pending.push(root);

    while (!pending.empty()) {
        const Node* node = pending.front();
        pending.pop();
        std::cout << node->value << ' ';

        if (node->left) {
            pending.push(node->left);
        }
        if (node->right) {
            pending.push(node->right);
        }
    }
}

int main() {
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

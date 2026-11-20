// AlgoViz convenience implementation: Huffman tree with std::priority_queue.
// priority_queue is a max-heap by default, so the comparator reverses order.
//
// Reading guide:
// 1. This convenience file keeps the Huffman merge logic but uses
//    std::priority_queue.
// 2. The queue orders nodes by frequency; two minima are merged until one root
//    remains.
// 3. The library supplies heap maintenance; the tree and code construction stay
//    explicit.
//
// Complexity: O(n log n); extra space O(n).
// Convention: Left edges are 0 and right edges are 1; ties are resolved by the
//   comparator.


#include <iostream>
#include <memory>
#include <queue>
#include <string>
#include <vector>

struct Node {
    int frequency = 0;
    char symbol = '\0';
    int order = 0;
    Node* left = nullptr;
    Node* right = nullptr;
};

struct Compare {
    bool operator()(const Node* a, const Node* b) const {
        if (a->frequency != b->frequency) {
            return a->frequency > b->frequency;
        }
        return a->order > b->order;
    }
};

void print_codes(const Node* node, const std::string& path) {
    if (!node->left && !node->right) {
        std::cout << node->symbol << ": " << (path.empty() ? "(empty)" : path) << '\n';
        return;
    }
    if (node->left) {
        print_codes(node->left, path + '0');
    }
    if (node->right) {
        print_codes(node->right, path + '1');
    }
}

void free_tree(Node* node) {
    if (!node) {
        return;
    }
    free_tree(node->left);
    free_tree(node->right);
    delete node;
}

int main() {
    std::vector<int> frequencies{5, 9, 12, 13, 16, 45};
    std::vector<char> symbols{'a', 'b', 'c', 'd', 'e', 'f'};
    std::priority_queue<Node*, std::vector<Node*>, Compare> heap;

    for (std::size_t i = 0; i < frequencies.size(); ++i) {
        heap.push(new Node{frequencies[i], symbols[i], static_cast<int>(i), nullptr, nullptr});
    }

    int order = static_cast<int>(frequencies.size());
    while (heap.size() > 1) {
        Node* first = heap.top();
        heap.pop();
        Node* second = heap.top();
        heap.pop();
        // Min-heap ordering is (frequency, insertion order), keeping ties deterministic.
        heap.push(new Node{
            first->frequency + second->frequency, '\0', order++, first, second});
    }

    Node* root = heap.top();
    heap.pop();
    std::cout << "root frequency: " << root->frequency << '\n';
    std::cout << "codes:\n";
    print_codes(root, "");
    free_tree(root);
    return 0;
}

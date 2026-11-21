/*
 * AlgoViz reference implementation: order-4 B-tree (search and insertion).
 *
 * Reading guide:
 * 1. Each node keeps a sorted std::vector<int> and at most four child pointers.
 * 2. A node with k keys has exactly k + 1 children; child i owns the interval
 *    between key i - 1 and key i.
 * 3. Search compares inside one node, then follows one child.
 * 4. Insertion rejects duplicates, splits a full root first, then splits every
 *    full child before descending. Splitting moves the median up and keeps the
 *    left node at the old object.
 *
 * Complexity: height h = O(log_4 n); search and insert visit O(h) nodes.
 * Space: O(n). Deletion is out of scope.
 * Convention: unique integer keys. std::map is NOT used here: the point is a
 * real B-tree, not a standard-library shortcut.
 */

#include <algorithm>
#include <iostream>
#include <memory>
#include <queue>
#include <vector>

constexpr int ORDER = 4;
constexpr int MAX_KEYS = ORDER - 1;

struct BTreeNode {
    std::vector<int> keys;
    std::vector<std::shared_ptr<BTreeNode>> children;
    bool leaf = true;
};

using NodePtr = std::shared_ptr<BTreeNode>;

NodePtr make_node(bool leaf) {
    auto node = std::make_shared<BTreeNode>();
    node->leaf = leaf;
    return node;
}

/* Read-only search; comparisons counts key comparisons when non-null. */
bool btree_search(const NodePtr &node, int target, int *comparisons = nullptr) {
    const BTreeNode *current = node.get();
    while (current != nullptr) {
        std::size_t index = 0;
        while (index < current->keys.size()) {
            if (comparisons != nullptr) {
                ++*comparisons;
            }
            if (target == current->keys[index]) {
                return true;
            }
            if (target < current->keys[index]) {
                break;
            }
            ++index;
        }
        if (current->leaf) {
            return false;
        }
        current = current->children[index].get();
    }
    return false;
}

/* Split parent->children[index] (full) and promote its median into parent. */
NodePtr split_child(const NodePtr &parent, std::size_t index) {
    NodePtr left = parent->children[index];
    int promoted = left->keys[1];

    NodePtr right = make_node(left->leaf);
    right->keys.push_back(left->keys[2]);
    if (!left->leaf) {
        right->children.push_back(left->children[2]);
        right->children.push_back(left->children[3]);
        left->children.resize(2);
    }
    left->keys.resize(1);

    parent->keys.insert(parent->keys.begin() + static_cast<std::ptrdiff_t>(index), promoted);
    parent->children.insert(
        parent->children.begin() + static_cast<std::ptrdiff_t>(index + 1), right);
    return right;
}

/* Insert a unique key; returns the possibly new root. Duplicate is rejected. */
// A full child is split before descending; its median moves into the parent, so insertion never needs to back up.
NodePtr btree_insert(NodePtr root, int value) {
    if (root == nullptr) {
        root = make_node(true);
        root->keys.push_back(value);
        return root;
    }

    if (btree_search(root, value)) {
        return root;
    }

    if (root->keys.size() == MAX_KEYS) {
        NodePtr new_root = make_node(false);
        new_root->children.push_back(root);
        split_child(new_root, 0);
        root = new_root;
    }

    NodePtr node = root;
    while (!node->leaf) {
        std::size_t index = 0;
        while (index < node->keys.size() && value > node->keys[index]) {
            ++index;
        }
        NodePtr child = node->children[index];
        if (child->keys.size() == MAX_KEYS) {
            int promoted = child->keys[1];
            NodePtr right = split_child(node, index);
            if (value > promoted) {
                child = right;
            }
        }
        node = child;
    }

    auto position = std::upper_bound(node->keys.begin(), node->keys.end(), value);
    node->keys.insert(position, value);
    return root;
}

void print_tree(const NodePtr &root) {
    if (root == nullptr) {
        return;
    }
    std::queue<NodePtr> pending;
    pending.push(root);
    while (!pending.empty()) {
        const std::size_t level_size = pending.size();
        for (std::size_t i = 0; i < level_size; ++i) {
            NodePtr node = pending.front();
            pending.pop();
            std::cout << "[";
            for (std::size_t k = 0; k < node->keys.size(); ++k) {
                if (k != 0) {
                    std::cout << ",";
                }
                std::cout << node->keys[k];
            }
            std::cout << "]";
            if (!node->leaf) {
                for (const NodePtr &child : node->children) {
                    pending.push(child);
                }
            }
        }
        std::cout << "\n";
    }
}

int main() {
    NodePtr root;
    const std::vector<int> values = {10, 20, 30, 40, 50, 60, 70, 45};
    for (int value : values) {
        root = btree_insert(root, value);
    }

    std::cout << "B-tree after insertion:\n";
    print_tree(root);

    int comparisons = 0;
    const bool found_30 = btree_search(root, 30, &comparisons);
    std::cout << "search 30: " << (found_30 ? "found" : "missing")
              << " (" << comparisons << " comparisons)\n";

    comparisons = 0;
    const bool found_35 = btree_search(root, 35, &comparisons);
    std::cout << "search 35: " << (found_35 ? "found" : "missing")
              << " (" << comparisons << " comparisons)\n";

    root = btree_insert(root, 45);
    std::cout << "duplicate 45 rejected; search says "
              << (btree_search(root, 45) ? "present" : "impossible") << "\n";
    return 0;
}

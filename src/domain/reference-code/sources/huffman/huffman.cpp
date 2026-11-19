// AlgoViz reference implementation: Huffman coding (C++17).
// Original code written for this repository under the MIT License.
// Builds a min-heap of nodes, repeatedly merges the two lightest nodes,
// then emits prefix-free codes by walking the tree.

#include <iostream>
#include <string>
#include <vector>

struct Node {
    int frequency = 0;
    char symbol = '\0';
    int order = 0;
    int left = -1;
    int right = -1;
};

class MinHeap {
 public:
    explicit MinHeap(std::vector<Node>& nodes) : nodes_(nodes) {}

    void push(int index) {
        heap_.push_back(index);
        sift_up(heap_.size() - 1);
    }

    int pop() {
        int top = heap_.front();
        heap_.front() = heap_.back();
        heap_.pop_back();
        if (!heap_.empty()) {
            sift_down(0);
        }
        return top;
    }

    bool empty() const {
        return heap_.empty();
    }

    std::size_t size() const {
        return heap_.size();
    }

 private:
    bool less(int a, int b) const {
        if (nodes_[a].frequency != nodes_[b].frequency) {
            return nodes_[a].frequency < nodes_[b].frequency;
        }
        return nodes_[a].order < nodes_[b].order;
    }

    void sift_up(std::size_t index) {
        while (index > 0) {
            std::size_t parent = (index - 1) / 2;
            if (!less(heap_[index], heap_[parent])) {
                return;
            }
            std::swap(heap_[parent], heap_[index]);
            index = parent;
        }
    }

    void sift_down(std::size_t index) {
        while (true) {
            std::size_t left = index * 2 + 1;
            std::size_t right = left + 1;
            std::size_t smallest = index;
            if (left < heap_.size() && less(heap_[left], heap_[smallest])) {
                smallest = left;
            }
            if (right < heap_.size() && less(heap_[right], heap_[smallest])) {
                smallest = right;
            }
            if (smallest == index) {
                return;
            }
            std::swap(heap_[index], heap_[smallest]);
            index = smallest;
        }
    }

    std::vector<Node>& nodes_;
    std::vector<int> heap_;
};

void print_codes(const std::vector<Node>& nodes, int index, std::string path) {
    const Node& node = nodes[index];
    if (node.left == -1 && node.right == -1) {
        std::cout << node.symbol << ": " << (path.empty() ? "(empty)" : path) << '\n';
        return;
    }
    if (node.left != -1) {
        print_codes(nodes, node.left, path + '0');
    }
    if (node.right != -1) {
        print_codes(nodes, node.right, path + '1');
    }
}

int main() {
    std::vector<int> frequencies{5, 9, 12, 13, 16, 45};
    std::vector<char> symbols{'a', 'b', 'c', 'd', 'e', 'f'};

    std::vector<Node> nodes;
    nodes.reserve(2 * frequencies.size() - 1);
    MinHeap heap(nodes);
    for (std::size_t i = 0; i < frequencies.size(); ++i) {
        nodes.push_back(Node{frequencies[i], symbols[i], static_cast<int>(i), -1, -1});
        heap.push(static_cast<int>(i));
    }

    int order = static_cast<int>(frequencies.size());
    while (heap.size() > 1) {
        int first = heap.pop();
        int second = heap.pop();
        nodes.push_back(Node{
            nodes[first].frequency + nodes[second].frequency, '\0', order++, first, second});
        heap.push(static_cast<int>(nodes.size() - 1));
    }

    int root = heap.pop();
    std::cout << "root frequency: " << nodes[root].frequency << '\n';
    std::cout << "codes:\n";
    print_codes(nodes, root, "");
    return 0;
}

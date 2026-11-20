// AlgoViz reference implementation: max heap (C++17).
// Array-backed binary heap with sift-up on insert and sift-down on pop.
//
// Reading guide:
// 1. Store the complete binary tree in an array without holes.
// 2. For index i, the parent is (i - 1) / 2 and the children are 2i + 1, 2i + 2.
// 3. Push appends and sifts up; pop moves the last value to the root and sifts down.
//
// Complexity: O(log n) push/pop, O(1) top; extra space O(n).
// Convention: Max-heap property: every parent is >= its children; 0-based array
//   indices.

#include <iostream>
#include <optional>
#include <vector>

class MaxHeap {
 public:
    bool push(int value) {
        items_.push_back(value);
        sift_up(items_.size() - 1);
        return true;
    }

    std::optional<int> pop() {
        if (items_.empty()) {
            return std::nullopt;
        }
        int top = items_.front();
        items_.front() = items_.back();
        items_.pop_back();
        if (!items_.empty()) {
            sift_down(0);
        }
        return top;
    }

    void print() const {
        for (std::size_t i = 0; i < items_.size(); ++i) {
            std::cout << items_[i] << (i + 1 == items_.size() ? "" : " ");
        }
        std::cout << '\n';
    }

 private:
    // Sift up while the parent is smaller; stop when the heap property holds or root is reached.
    void sift_up(std::size_t index) {
        while (index > 0) {
            std::size_t parent = (index - 1) / 2;
            if (items_[parent] >= items_[index]) {
                break;
            }
            std::swap(items_[parent], items_[index]);
            index = parent;
        }
    }

    void sift_down(std::size_t index) {
        while (true) {
            std::size_t left = index * 2 + 1;
            std::size_t right = left + 1;
            std::size_t largest = index;
            if (left < items_.size() && items_[left] > items_[largest]) {
                largest = left;
            }
            if (right < items_.size() && items_[right] > items_[largest]) {
                largest = right;
            }
            if (largest == index) {
                return;
            }
            std::swap(items_[index], items_[largest]);
            index = largest;
        }
    }

    std::vector<int> items_;
};

int main() {
    MaxHeap heap;
    for (int value : {5, 3, 8, 1, 9, 2}) {
        heap.push(value);
    }
    std::cout << "heap array: ";
    heap.print();

    std::cout << "extract: ";
    while (auto value = heap.pop()) {
        std::cout << *value << ' ';
    }
    std::cout << "\nempty pop: " << (heap.pop() ? "no" : "yes") << '\n';
    return 0;
}

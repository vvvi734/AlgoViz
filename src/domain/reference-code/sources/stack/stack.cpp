// AlgoViz reference implementation: array stack (C++17).
// A fixed-capacity stack with manual top index and overflow checks.
//
// Reading guide:
// 1. The stack stores items in a fixed array plus a size counter.
// 2. The top element is items[size - 1]; push writes at items[size] and increments
//    size.
// 3. Pop decrements size before reading; empty and full operations report failure
//    instead of crashing.
//
// Complexity: O(1) per operation; extra space O(capacity).
// Convention: size is the number of stored items and also the next free slot;
//   capacity is fixed.

#include <array>
#include <iostream>
#include <optional>

class Stack {
 public:
    // Push writes at size and increments it; the capacity check prevents overflow.
    bool push(int value) {
        if (size_ == items_.size()) {
            return false;
        }
        items_[size_] = value;
        ++size_;
        return true;
    }

    std::optional<int> pop() {
        if (size_ == 0) {
            return std::nullopt;
        }
        --size_;
        return items_[size_];
    }

    std::optional<int> peek() const {
        if (size_ == 0) {
            return std::nullopt;
        }
        return items_[size_ - 1];
    }

    bool empty() const {
        return size_ == 0;
    }

 private:
    std::array<int, 8> items_{};
    std::size_t size_ = 0;
};

int main() {
    Stack stack;
    stack.push(1);
    stack.push(2);
    stack.push(3);

    if (auto top = stack.peek()) {
        std::cout << "top: " << *top << '\n';
    }
    while (auto value = stack.pop()) {
        std::cout << "pop: " << *value << '\n';
    }
    std::cout << "empty: " << (stack.empty() ? "yes" : "no") << '\n';
    std::cout << "underflow: " << (stack.pop() ? "no" : "yes") << '\n';
    return 0;
}

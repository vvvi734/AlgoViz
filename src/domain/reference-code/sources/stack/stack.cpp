// AlgoViz reference implementation: array stack (C++17).
// Original code written for this repository under the MIT License.
// A fixed-capacity stack with manual top index and overflow checks.

#include <array>
#include <iostream>
#include <optional>

class Stack {
 public:
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

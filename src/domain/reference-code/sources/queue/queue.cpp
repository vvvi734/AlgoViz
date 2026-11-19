// AlgoViz reference implementation: circular queue (C++17).
// Original code written for this repository under the MIT License.
// A fixed-capacity ring buffer using head, tail and count.

#include <array>
#include <iostream>
#include <optional>

class Queue {
 public:
    bool enqueue(int value) {
        if (count_ == items_.size()) {
            return false;
        }
        items_[tail_] = value;
        tail_ = (tail_ + 1) % items_.size();
        ++count_;
        return true;
    }

    std::optional<int> dequeue() {
        if (count_ == 0) {
            return std::nullopt;
        }
        int value = items_[head_];
        head_ = (head_ + 1) % items_.size();
        --count_;
        return value;
    }

    std::optional<int> front() const {
        if (count_ == 0) {
            return std::nullopt;
        }
        return items_[head_];
    }

 private:
    std::array<int, 8> items_{};
    std::size_t head_ = 0;
    std::size_t tail_ = 0;
    std::size_t count_ = 0;
};

int main() {
    Queue queue;
    for (int value = 1; value <= 4; ++value) {
        queue.enqueue(value);
    }

    if (auto front = queue.front()) {
        std::cout << "front: " << *front << '\n';
    }
    while (auto value = queue.dequeue()) {
        std::cout << "dequeue: " << *value << '\n';
    }
    std::cout << "empty: " << (queue.dequeue() ? "no" : "yes") << '\n';
    return 0;
}

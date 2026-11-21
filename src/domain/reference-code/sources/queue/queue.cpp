// AlgoViz reference implementation: circular queue (C++17).
// A fixed-capacity ring buffer using head, tail and count.
//
// Reading guide:
// 1. Store items in a circular array with head, tail and count.
// 2. Enqueue writes at tail, advances tail modulo capacity, then increments count.
// 3. Dequeue reads at head, advances head modulo capacity, and decrements count.
//
// Complexity: O(1) per operation; extra space O(capacity).
// Convention: count distinguishes empty from full; all slot arithmetic is modulo
//   capacity.

#include <array>
#include <iostream>
#include <optional>

class Queue {
 public:
    // Enqueue writes at tail, advances tail modulo capacity, then increments count.
    // `head` is the next slot to remove, `tail` the next free slot, and `count` separates empty from full when indices wrap.
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

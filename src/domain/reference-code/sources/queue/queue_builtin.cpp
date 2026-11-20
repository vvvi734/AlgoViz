// AlgoViz convenience implementation: queue with std::queue (C++17).
// Original code written for this repository under the MIT License.
// std::queue is an adapter; its default container is std::deque.
//
// Reading guide:
// 1. This convenience file wraps std::queue, which is FIFO by contract.
// 2. push adds at the back; front reads the oldest element; pop removes it.
// 3. No circular-buffer indices are exposed by this adapter.
//
// Complexity: O(1) per push/pop/front; extra space O(n).
// Convention: front/pop require a non-empty queue; the demo checks empty() first.


#include <iostream>
#include <queue>

int main() {
    std::queue<int> queue;
    for (int value = 1; value <= 4; ++value) {
        queue.push(value);
    }

    std::cout << "front: " << queue.front() << '\n';
    while (!queue.empty()) {
        std::cout << "dequeue: " << queue.front() << '\n';
        queue.pop();
    }
    std::cout << "empty: " << (queue.empty() ? "yes" : "no") << '\n';
    return 0;
}

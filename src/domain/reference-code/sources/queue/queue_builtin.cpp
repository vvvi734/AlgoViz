// AlgoViz convenience implementation: queue with std::queue (C++17).
// Original code written for this repository under the MIT License.
// std::queue is an adapter; its default container is std::deque.

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

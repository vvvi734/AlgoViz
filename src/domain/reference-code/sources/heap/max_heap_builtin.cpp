// AlgoViz convenience implementation: max heap with std::priority_queue.
// Original code written for this repository under the MIT License.
// std::priority_queue is a max-heap by default.

#include <iostream>
#include <queue>
#include <vector>

int main() {
    std::priority_queue<int> heap;
    for (int value : {5, 3, 8, 1, 9, 2}) {
        heap.push(value);
    }

    std::cout << "extract: ";
    while (!heap.empty()) {
        std::cout << heap.top() << ' ';
        heap.pop();
    }
    std::cout << "\nempty: " << (heap.empty() ? "yes" : "no") << '\n';
    return 0;
}

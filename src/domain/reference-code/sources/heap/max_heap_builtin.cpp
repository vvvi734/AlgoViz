// AlgoViz convenience implementation: max heap with std::priority_queue.
// Original code written for this repository under the MIT License.
// std::priority_queue is a max-heap by default.
//
// Reading guide:
// 1. This convenience file uses std::priority_queue with std::less, which is a
//    max-heap.
// 2. top reads the maximum; push and pop let the library maintain the heap property.
// 3. No manual sift-up or sift-down code is present in this version.
//
// Complexity: O(1) top, O(log n) push/pop; extra space O(n).
// Convention: The largest element is on top; equal keys have unspecified relative
//   order.


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

// AlgoViz reference implementation: selection sort (C++17).
// Original code written for this repository under the MIT License.
// Each pass selects the smallest remaining element and places it at the front.
//
// Reading guide:
// 1. The prefix [0, start) is already the sorted portion.
// 2. Scan the unsorted suffix for its minimum.
// 3. Swap that minimum into position start and grow the sorted prefix by one.
//
// Complexity: O(n^2) in all cases; extra space O(1).
// Convention: Ascending order; 0-based indices; the exchange can move equal keys, so
//   the sort is not stable.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

// Invariant: [0, start) is sorted; each scan finds the minimum of the unsorted suffix.
void selection_sort(std::vector<int>& values) {
    for (std::size_t start = 0; start + 1 < values.size(); ++start) {
        std::size_t minimum = start;
        for (std::size_t index = start + 1; index < values.size(); ++index) {
            if (values[index] < values[minimum]) {
                minimum = index;
            }
        }
        if (minimum != start) {
            std::swap(values[start], values[minimum]);
        }
    }
}

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    selection_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    selection_sort(empty);
    selection_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}

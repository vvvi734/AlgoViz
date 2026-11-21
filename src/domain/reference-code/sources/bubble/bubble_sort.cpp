// AlgoViz reference implementation: bubble sort (C++17).
// This is the manual exchange-sort version; std::sort is intentionally not used.
//
// Reading guide:
// 1. Each pass compares adjacent pairs from the left and swaps inverted pairs.
// 2. After pass k, the largest k values are fixed at the right end.
// 3. A pass with no swap proves the remaining prefix is already sorted, so stop
//    early.
//
// Complexity: O(n^2) average/worst, O(n) best with early exit; extra space
//   O(1).
// Convention: Ascending order; 0-based array access; equal values are never swapped,
//   so the sort is stable.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

// Invariant: after each pass, the largest remaining values are fixed at the right end.
// After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
void bubble_sort(std::vector<int>& values) {
    if (values.size() < 2) {
        return;
    }

    for (std::size_t end = values.size(); end > 1; --end) {
        bool swapped = false;
        for (std::size_t index = 1; index < end; ++index) {
            if (values[index - 1] > values[index]) {
                std::swap(values[index - 1], values[index]);
                swapped = true;
            }
        }
        // A pass without swaps means the remaining prefix is already sorted.
        if (!swapped) {
            break;
        }
    }
}

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    bubble_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    bubble_sort(empty);
    bubble_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}

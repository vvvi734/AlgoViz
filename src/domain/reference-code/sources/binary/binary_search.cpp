// AlgoViz reference implementation: binary search (C++17).
// The algorithm is implemented explicitly; std::binary_search is not used.
//
// Reading guide:
// 1. The input must be non-decreasing; the function checks this before searching.
// 2. Keep an inclusive search window [low, high].
// 3. Compare the middle element and discard the half that cannot contain the target.
// 4. Return the found index, or -1 when the window becomes empty.
//
// Complexity: O(log n); extra space O(1).
// Convention: 0-based indices; low and high are inclusive; duplicate targets may
//   return any matching index.

#include <cstddef>
#include <iostream>
#include <vector>

bool is_non_decreasing(const std::vector<int>& values) {
    for (std::size_t i = 1; i < values.size(); ++i) {
        if (values[i - 1] > values[i]) {
            return false;
        }
    }
    return true;
}

int binary_search_index(const std::vector<int>& values, int target) {
    if (values.empty()) {
        return -1;
    }
    int left = 0;
    int right = static_cast<int>(values.size()) - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (values[static_cast<std::size_t>(mid)] == target) {
            return mid;
        }
        if (values[static_cast<std::size_t>(mid)] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}

int main() {
    const std::vector<int> sorted{1, 3, 5, 7, 9, 11, 13};
    if (!is_non_decreasing(sorted)) {
        std::cerr << "input must be sorted in non-decreasing order\n";
        return 1;
    }

    std::cout << "target=9 index=" << binary_search_index(sorted, 9) << '\n';
    std::cout << "missing=8 index=" << binary_search_index(sorted, 8) << '\n';
    return 0;
}

// AlgoViz reference implementation: binary search (C++17).
// Original code written for this repository under the MIT License.
// The algorithm is implemented explicitly; std::binary_search is not used.

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

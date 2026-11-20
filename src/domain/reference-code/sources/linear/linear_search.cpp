// AlgoViz reference implementation: linear search (C++17).
// Original code written for this repository under the MIT License.
// Scans from left to right and returns the first matching index, or -1.
//
// Reading guide:
// 1. Scan values[0..n) from left to right.
// 2. Return the first index whose value equals the target.
// 3. Return -1 after the scan if no value matched.
//
// Complexity: O(n); extra space O(1).
// Convention: 0-based indices; returns the first match, or -1 when absent.

#include <iostream>
#include <vector>

// Return the first matching index; -1 means the whole array was scanned.
int linear_search(const std::vector<int>& values, int target) {
    for (std::size_t index = 0; index < values.size(); ++index) {
        if (values[index] == target) {
            return static_cast<int>(index);
        }
    }
    return -1;
}

int main() {
    std::vector<int> values{4, 7, 2, 9, 1, 5};
    std::cout << "target 9 -> " << linear_search(values, 9) << '\n';
    std::cout << "target 1 -> " << linear_search(values, 1) << '\n';
    std::cout << "target 6 -> " << linear_search(values, 6) << '\n';
    std::cout << "empty -> " << linear_search({}, 6) << '\n';
    return 0;
}

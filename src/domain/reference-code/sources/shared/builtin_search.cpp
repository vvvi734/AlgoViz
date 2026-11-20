// AlgoViz shared convenience implementation: binary search with lower_bound.
// lower_bound finds the first position that is not less than the target.
// The input range must already be sorted.
//
// Reading guide:
// 1. This is the C++ standard-library binary-search shortcut, not a hand-written
//    search.
// 2. std::lower_bound finds the first element not less than the target.
// 3. The range must be partitioned with respect to the comparator.
//
// Complexity: O(log n) comparisons; extra space O(1).
// Convention: Half-open iterator range; the returned iterator may equal end().

#include <algorithm>
#include <iostream>
#include <vector>

int binary_search_builtin(const std::vector<int>& values, int target) {
    auto position = std::lower_bound(values.begin(), values.end(), target);
    if (position == values.end() || *position != target) {
        return -1;
    }
    return static_cast<int>(position - values.begin());
}

int main() {
    std::vector<int> values{0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    std::cout << "target 6 -> " << binary_search_builtin(values, 6) << '\n';
    std::cout << "target 10 -> " << binary_search_builtin(values, 10) << '\n';
    std::cout << "empty -> " << binary_search_builtin({}, 6) << '\n';
    return 0;
}

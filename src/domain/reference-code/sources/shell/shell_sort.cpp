// AlgoViz reference implementation: Shell sort (C++17).
// Gap insertion sort, halving the gap until the final gap-1 pass.
//
// Reading guide:
// 1. Choose a decreasing gap sequence; each pass insertion-sorts the subsequences
//    with that gap.
// 2. Elements far apart move early, reducing the work left for smaller gaps.
// 3. The final gap of 1 is ordinary insertion sort over the whole array.
//
// Complexity: Time depends on the gap sequence; O(n^2) worst case, often
//   subquadratic; extra space O(1).
// Convention: Ascending order; gaps are positive; the implementation uses n/2, n/4,
//   ... , 1.

#include <cstddef>
#include <iostream>
#include <vector>

// Each gap pass insertion-sorts independent subsequences; gap 1 finishes the array.
void shell_sort(std::vector<int>& values) {
    for (std::size_t gap = values.size() / 2; gap > 0; gap /= 2) {
        for (std::size_t index = gap; index < values.size(); ++index) {
            int current = values[index];
            std::size_t position = index;
            while (position >= gap && values[position - gap] > current) {
                values[position] = values[position - gap];
                position -= gap;
            }
            values[position] = current;
        }
    }
}

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    shell_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    shell_sort(empty);
    shell_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}

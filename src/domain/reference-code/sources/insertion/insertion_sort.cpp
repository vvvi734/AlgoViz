// AlgoViz reference implementation: insertion sort (C++17).
// The sorted prefix grows one element at a time; larger elements shift right.
//
// Reading guide:
// 1. Treat [0, i) as the sorted prefix and values[i] as the key to insert.
// 2. Shift every prefix value greater than the key one slot right.
// 3. Write the key into the first free slot; this preserves the relative order of
//    equal keys.
//
// Complexity: O(n^2) worst, O(n) best for nearly sorted input; extra space
//   O(1).
// Convention: Ascending order; 0-based indices; the shift stops at the first value
//   <= key, so the sort is stable.

#include <cstddef>
#include <iostream>
#include <vector>

// Invariant: [0, i) is sorted; shift larger values right before writing the key.
void insertion_sort(std::vector<int>& values) {
    for (std::size_t index = 1; index < values.size(); ++index) {
        int current = values[index];
        std::size_t position = index;
        while (position > 0 && values[position - 1] > current) {
            values[position] = values[position - 1];
            --position;
        }
        values[position] = current;
    }
}

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    insertion_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    insertion_sort(empty);
    insertion_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}

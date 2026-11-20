// AlgoViz reference implementation: quicksort (C++17).
// Original code written for this repository under the MIT License.
// Lomuto partition: <= pivot goes left, > pivot goes right.
//
// Reading guide:
// 1. Partition the range around the last element as pivot.
// 2. Move values smaller than the pivot left and values greater than it right.
// 3. Place the pivot in its final slot and recurse on the two sides.
//
// Complexity: O(n log n) average, O(n^2) worst; extra space O(log n) average
//   recursion, O(n) worst.
// Convention: Ranges are inclusive [low, high]; 0-based indices; the partition
//   scheme is not stable.

#include <iostream>
#include <utility>
#include <vector>

namespace {

// Lomuto partition: <= pivot goes left, > pivot goes right, pivot returns at boundary + 1.
int partition(std::vector<int>& values, int low, int high) {
    int pivot = values[static_cast<std::size_t>(high)];
    int boundary = low - 1;
    for (int index = low; index < high; ++index) {
        if (values[static_cast<std::size_t>(index)] <= pivot) {
            ++boundary;
            std::swap(values[static_cast<std::size_t>(boundary)],
                      values[static_cast<std::size_t>(index)]);
        }
    }
    std::swap(values[static_cast<std::size_t>(boundary + 1)],
              values[static_cast<std::size_t>(high)]);
    return boundary + 1;
}

void quick_sort_range(std::vector<int>& values, int low, int high) {
    if (low >= high) {
        return;
    }
    int middle = partition(values, low, high);
    quick_sort_range(values, low, middle - 1);
    quick_sort_range(values, middle + 1, high);
}

}  // namespace

void quick_sort(std::vector<int>& values) {
    quick_sort_range(values, 0, static_cast<int>(values.size()) - 1);
}

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    quick_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::vector<int> single{42};
    quick_sort(empty);
    quick_sort(single);
    std::cout << "empty:ok single:" << single.front() << '\n';
    return 0;
}

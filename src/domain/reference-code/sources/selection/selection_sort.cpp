// AlgoViz reference implementation: selection sort (C++17).
// Original code written for this repository under the MIT License.
// Each pass selects the smallest remaining element and places it at the front.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

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

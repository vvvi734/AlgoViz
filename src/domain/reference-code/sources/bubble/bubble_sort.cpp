// AlgoViz reference implementation: bubble sort (C++17).
// Original code written for this repository under the MIT License.
// This is the manual exchange-sort version; std::sort is intentionally not used.

#include <cstddef>
#include <iostream>
#include <utility>
#include <vector>

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

// AlgoViz reference implementation: insertion sort (C++17).
// Original code written for this repository under the MIT License.
// The sorted prefix grows one element at a time; larger elements shift right.

#include <cstddef>
#include <iostream>
#include <vector>

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

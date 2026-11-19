// AlgoViz reference implementation: Shell sort (C++17).
// Original code written for this repository under the MIT License.
// Gap insertion sort, halving the gap until the final gap-1 pass.

#include <cstddef>
#include <iostream>
#include <vector>

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

// AlgoViz reference implementation: merge sort (C++17).
// Original code written for this repository under the MIT License.
// std::sort / std::stable_sort are deliberately not used.

#include <iostream>
#include <vector>

void merge_range(std::vector<int>& values,
                 std::vector<int>& buffer,
                 int left,
                 int middle,
                 int right) {
    int i = left;
    int j = middle + 1;
    int k = left;

    while (i <= middle && j <= right) {
        // Take the left run on ties to preserve stability.
        if (values[static_cast<std::size_t>(i)] <= values[static_cast<std::size_t>(j)]) {
            buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(i++)];
        } else {
            buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(j++)];
        }
    }
    while (i <= middle) {
        buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(i++)];
    }
    while (j <= right) {
        buffer[static_cast<std::size_t>(k++)] = values[static_cast<std::size_t>(j++)];
    }
    for (k = left; k <= right; ++k) {
        values[static_cast<std::size_t>(k)] = buffer[static_cast<std::size_t>(k)];
    }
}

void merge_sort_range(std::vector<int>& values,
                      std::vector<int>& buffer,
                      int left,
                      int right) {
    if (left >= right) {
        return;
    }
    int middle = left + (right - left) / 2;
    merge_sort_range(values, buffer, left, middle);
    merge_sort_range(values, buffer, middle + 1, right);
    merge_range(values, buffer, left, middle, right);
}

void merge_sort(std::vector<int>& values) {
    if (values.size() < 2) {
        return;
    }
    std::vector<int> buffer(values.size());
    merge_sort_range(values, buffer, 0, static_cast<int>(values.size()) - 1);
}

int main() {
    std::vector<int> values{9, 4, 7, 2, 6, 1, 3, 8, 5};
    merge_sort(values);

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    return 0;
}

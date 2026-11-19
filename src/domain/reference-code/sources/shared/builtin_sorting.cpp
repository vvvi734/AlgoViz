// AlgoViz shared convenience reference: C++ standard-library sorting.
// Original example written for this repository under the MIT License.
//
// std::sort and std::stable_sort perform the same task (order an int vector
// ascending), but they are not bubble/selection/insertion implementations.
// std::sort is not guaranteed stable; std::stable_sort preserves equal-key order.
//
// Reference: C++ standard library <algorithm> documentation.

#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    std::sort(values.begin(), values.end());

    std::cout << "sorted:";
    for (int value : values) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> stable{5, 1, 4, 2, 8, 0, 3, 7, 6, 9};
    std::stable_sort(stable.begin(), stable.end());
    std::cout << "stable:";
    for (int value : stable) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    std::vector<int> empty;
    std::sort(empty.begin(), empty.end());
    std::cout << "empty:ok\n";
    return 0;
}

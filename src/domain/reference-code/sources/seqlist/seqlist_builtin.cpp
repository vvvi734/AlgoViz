// AlgoViz convenience implementation: sequential list with std::vector.
// Original code written for this repository under the MIT License.
// vector::insert and vector::erase perform the same shifting internally.

#include <iostream>
#include <vector>

template <typename T>
void print(const std::vector<T>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        std::cout << values[i] << (i + 1 == values.size() ? "" : " ");
    }
    std::cout << '\n';
}

int main() {
    std::vector<int> values{1, 3};
    values.insert(values.begin() + 1, 2);
    values.insert(values.end(), 4);
    std::cout << "after inserts: ";
    print(values);

    values.erase(values.begin() + 1);
    std::cout << "after erase: ";
    print(values);
    return 0;
}

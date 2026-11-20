// AlgoViz convenience implementation: sequential list with std::vector.
// Original code written for this repository under the MIT License.
// vector::insert and vector::erase perform the same shifting internally.
//
// Reading guide:
// 1. This convenience file uses std::vector as a dynamic sequential list.
// 2. push_back is amortized O(1); insert/erase in the middle shift later elements.
// 3. Indexing is O(1), matching the contiguous-storage model.
//
// Complexity: O(1) indexed access, O(n) middle insert/erase, O(1) amortized
//   append; extra space O(n).
// Convention: Positions are 0-based; insert takes an iterator position and erase
//   invalidates later iterators.


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

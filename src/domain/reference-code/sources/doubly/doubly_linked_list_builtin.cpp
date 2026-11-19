// AlgoViz convenience implementation: doubly linked list with std::list.
// Original code written for this repository under the MIT License.
// std::list is a doubly linked list with O(1) insert/erase at a known position.

#include <iostream>
#include <iterator>
#include <list>

template <typename T>
void print(const std::list<T>& values) {
    for (auto it = values.begin(); it != values.end(); ++it) {
        std::cout << *it << (std::next(it) == values.end() ? "" : " ");
    }
    std::cout << '\n';
}

int main() {
    std::list<int> values;
    values.push_back(1);
    values.push_back(2);
    values.push_back(3);

    std::cout << "forward: ";
    print(values);
    std::cout << "backward: ";
    for (auto it = values.rbegin(); it != values.rend(); ++it) {
        std::cout << *it << (std::next(it) == values.rend() ? "" : " ");
    }
    std::cout << '\n';

    auto it = std::next(values.begin());
    values.erase(it);
    std::cout << "after remove 2: ";
    print(values);
    return 0;
}

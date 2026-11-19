// AlgoViz convenience implementation: ordered set with std::set (C++17).
// Original code written for this repository under the MIT License.
// std::set is a balanced binary search tree; iteration is ascending.

#include <iostream>
#include <set>

int main() {
    std::set<int> tree;
    for (int key : {5, 2, 7, 1, 4, 6, 8, 3}) {
        tree.insert(key);
    }

    std::cout << "inorder:";
    for (int value : tree) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    std::cout << "contains 4: " << (tree.count(4) ? "yes" : "no") << '\n';
    std::cout << "contains 9: " << (tree.count(9) ? "yes" : "no") << '\n';

    tree.erase(5);
    std::cout << "after remove 5:";
    for (int value : tree) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';
    return 0;
}

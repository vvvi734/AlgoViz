// AlgoViz convenience implementation: ordered set with std::set (C++17).
// std::set is a balanced binary search tree; iteration is ascending.
//
// Reading guide:
// 1. This convenience file uses std::set instead of writing BST node rotations or
//    links.
// 2. insert/erase/count each take logarithmic time on a balanced red-black tree.
// 3. Iterating the set yields the keys in ascending order; duplicates are discarded.
//
// Complexity: O(log n) per insert/erase/search; extra space O(n).
// Convention: Unique integer keys; ordering is ascending; no manual tree structure
//   is exposed.


#include <iostream>
#include <set>

int main() {
    // `std::set` keeps unique keys ordered; `count` is membership, not an index lookup.
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

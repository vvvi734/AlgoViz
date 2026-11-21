// AlgoViz convenience implementation: hash table with std::unordered_map.
// unordered_map handles hashing, buckets and collision chains internally.
//
// Reading guide:
// 1. This convenience file uses std::unordered_map instead of hand-written buckets.
// 2. insert/count/find are expected O(1), with O(n) worst case under extreme
//    collisions.
// 3. The library owns hashing, bucket growth and chain layout.
//
// Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
// Convention: Unique integer keys; iteration order is unspecified.


#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    // `unordered_map` owns hashing and chains; iteration order is unspecified, so it is not sorted output.
    std::unordered_map<int, std::string> table;
    table[15] = "alpha";
    table[22] = "beta";
    table[8] = "gamma";
    table[29] = "delta";

    for (const auto& [key, value] : table) {
        std::cout << key << " -> " << value << '\n';
    }
    std::cout << "contains 29: " << (table.count(29) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.count(7) ? "yes" : "no") << '\n';
    return 0;
}

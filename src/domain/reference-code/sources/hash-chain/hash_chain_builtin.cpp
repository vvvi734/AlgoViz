// AlgoViz convenience implementation: hash table with std::unordered_map.
// Original code written for this repository under the MIT License.
// unordered_map handles hashing, buckets and collision chains internally.

#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
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

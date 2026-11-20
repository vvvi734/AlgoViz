// AlgoViz convenience implementation: hash table with std::unordered_map.
// unordered_map chooses its own collision strategy; no probing loop is visible.
//
// Reading guide:
// 1. This convenience file uses std::unordered_map, not an open-addressing table.
// 2. The standard library chooses its own collision strategy; probing is not
//    exposed.
// 3. Use this file to compare the interface, not to inspect linear-probe mechanics.
//
// Complexity: Expected time: O(1) per operation, O(n) worst; extra space O(n).
// Convention: Unique integer keys; the internal bucket layout is unspecified.


#include <iostream>
#include <string>
#include <unordered_map>

int main() {
    std::unordered_map<int, std::string> table;
    table[22] = "a";
    table[11] = "b";
    table[33] = "c";
    table[44] = "d";
    table[55] = "e";

    for (const auto& [key, value] : table) {
        std::cout << key << " -> " << value << '\n';
    }
    std::cout << "contains 44: " << (table.count(44) ? "yes" : "no") << '\n';
    std::cout << "contains 7: " << (table.count(7) ? "yes" : "no") << '\n';
    return 0;
}

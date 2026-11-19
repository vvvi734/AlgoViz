// AlgoViz convenience implementation: hash table with std::unordered_map.
// Original code written for this repository under the MIT License.
// unordered_map chooses its own collision strategy; no probing loop is visible.

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

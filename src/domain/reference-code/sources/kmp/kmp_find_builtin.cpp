/*
 * Convenience example: find every occurrence with std::string::find().
 *
 * This is the standard-library shortcut for the same lookup task. It is not
 * guaranteed to use the KMP algorithm internally; see kmp.cpp for the explicit
 * KMP implementation.
 *
 * Reading guide:
 * 1. This convenience file calls std::string::find repeatedly instead of building an
 *    LPS table.
 * 2. Each call searches forward from the previous match + 1, so occurrences may
 *    overlap.
 * 3. The standard library owns the substring search strategy; it is not an explicit
 *    KMP implementation.
 *
 * Complexity: implementation-defined by the standard library, not the guaranteed O(n + m) of KMP.
 * Convention: 0-based positions; an empty pattern is handled separately to avoid an
 *   infinite loop.
 */
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

std::vector<std::size_t> find_all(const std::string &text,
                                  const std::string &pattern)
{
    std::vector<std::size_t> starts;
    if (pattern.empty()) {
        return starts;
    }

    std::size_t pos = text.find(pattern);
    while (pos != std::string::npos) {
        starts.push_back(pos);
        // +1 keeps overlapping occurrences instead of skipping past them.
        pos = text.find(pattern, pos + 1);
    }
    return starts;
}

int main()
{
    std::string text = "ABABABCABABABC";
    std::string pattern = "ABABC";
    std::vector<std::size_t> starts = find_all(text, pattern);

    std::cout << "matches = " << starts.size() << '\n';
    for (std::size_t k = 0; k < starts.size(); ++k) {
        std::cout << "start[" << k << "] = " << starts[k] << '\n';
    }
    return 0;
}

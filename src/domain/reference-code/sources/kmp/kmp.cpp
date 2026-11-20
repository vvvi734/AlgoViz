/*
 * KMP pattern matching — original C++17 implementation, MIT.
 *
 * LPS convention used here: 0-based, lps[k] is the length of the longest
 * proper prefix of pattern[0..k] that is also a suffix. On a mismatch, j moves
 * to lps[j - 1]; the text pointer i never moves backwards.
 *
 * Reading guide:
 * 1. Build lps[i], the length of the longest proper prefix that is also a suffix of
 *    pattern[0..i].
 * 2. Build it with two indices: extend on a match, otherwise fall back to lps[j -
 *    1].
 * 3. Scan the text with the same fallback rule; every full pattern match is
 *    reported.
 * 4. After a match, fall back to lps[m - 1] so overlapping occurrences are found.
 *
 * Complexity: O(n + m); extra space O(m) for the lps table.
 * Convention: 0-based string indices; lps values are lengths, not positions; empty
 *   patterns return no matches.
 */

#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

// lps[i] is a length, not a position: on mismatch fall back to lps[j - 1].
std::vector<std::size_t> build_lps(const std::string &pattern)
{
    std::size_t m = pattern.size();
    std::vector<std::size_t> lps(m, 0);
    std::size_t i = 1;
    std::size_t j = 0;

    while (i < m) {
        if (pattern[i] == pattern[j]) {
            lps[i] = ++j;
            ++i;
        } else if (j > 0) {
            j = lps[j - 1];
        } else {
            lps[i] = 0;
            ++i;
        }
    }
    return lps;
}

// All starts, including overlapping occurrences.
std::vector<std::size_t> kmp_find_all(const std::string &text,
                                      const std::string &pattern)
{
    std::vector<std::size_t> starts;
    if (pattern.empty()) {
        return starts;
    }

    std::vector<std::size_t> lps = build_lps(pattern);
    std::size_t n = text.size();
    std::size_t m = pattern.size();
    std::size_t i = 0;
    std::size_t j = 0;

    while (i < n) {
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
            if (j == m) {
                starts.push_back(i - m);
                j = lps[j - 1];
            }
        } else if (j > 0) {
            j = lps[j - 1];
        } else {
            ++i;
        }
    }
    return starts;
}

int main()
{
    std::string text = "ABABABCABABABC";
    std::string pattern = "ABABC";
    std::vector<std::size_t> starts = kmp_find_all(text, pattern);

    std::cout << "matches = " << starts.size() << '\n';
    for (std::size_t k = 0; k < starts.size(); ++k) {
        std::cout << "start[" << k << "] = " << starts[k] << '\n';
    }
    return 0;
}

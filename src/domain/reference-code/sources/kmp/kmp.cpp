/*
 * 中文导读：利用模式串自身的最长相等前后缀，匹配失败时不回退主串指针。
 * 阅读顺序：先看 next/prefix 数组每个位置的含义；再看构建时 j=next[j-1] 的回退；最后看匹配循环为何只前进 i。
 * 关键不变量：next[i] 是 pattern[0..i] 的最长相等前后缀长度；回退后已经匹配的前缀仍然成立。
 * 易错点：把 next 定义为“包含当前字符”还是“前一位”混用；回退条件写错；空模式串；下标从 0/1 混用。
 * 复杂度：预处理 O(m)，匹配 O(n)，总 O(n+m)，空间 O(m)。
 * 输入/输出：输入主串与非空模式串；返回全部 0 基匹配起点或匹配次数；main 打印结果。
*/

/*
 * KMP pattern matching — original C++17 implementation.
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
// Purpose: Build the LPS/next table, recording the longest equal prefix-suffix length for each pattern prefix.
// 作用：构建 LPS/next 数组：每个位置记录模式串前缀的最长相等前后缀长度。
std::vector<std::size_t> build_lps(const std::string &pattern)
{
    std::size_t m = pattern.size();
    std::vector<std::size_t> lps(m, 0);
    // i is the prefix end being filled; j is the border length. lps[0] stays 0 because a one-character prefix has no proper border.
    std::size_t i = 1;
    std::size_t j = 0;

    while (i < m)
    {
        if (pattern[i] == pattern[j])
        {
            // Extending by one character succeeds; the new border length is the old j plus one, stored at the current prefix end.
            lps[i] = ++j;
            ++i;
        }
        else if (j > 0)
        {
            // j is a length, so the last matched character is at j-1; lps[j-1] is the next shorter border to try.
            j = lps[j - 1];
        }
        else
        {
            // No border can be extended and j is already zero, so this prefix has no non-empty proper border.
            lps[i] = 0;
            ++i;
        }
    }
    return lps;
}

// All starts, including overlapping occurrences.
// Purpose: Use the LPS table to find every match in text, including overlaps, and return each start index.
// 作用：用 LPS 在 text 中查找全部匹配（允许重叠）；返回每个起始下标。
std::vector<std::size_t> kmp_find_all(const std::string &text, const std::string &pattern)
{
    std::vector<std::size_t> starts;
    // An empty pattern has no meaningful start positions in this implementation; return no matches rather than inventing a convention.
    if (pattern.empty())
    {
        return starts;
    }

    std::vector<std::size_t> lps = build_lps(pattern);
    std::size_t n = text.size();
    std::size_t m = pattern.size();
    // In the scan, i is the next text position and j is the number of pattern characters already matched.
    std::size_t i = 0;
    std::size_t j = 0;

    while (i < n)
    {
        if (text[i] == pattern[j])
        {
            ++i;
            ++j;
            // A full match ends at i-1, so i-m is its start; j then falls back to lps[m-1] to preserve the longest overlap.
            if (j == m)
            {
                // i has already moved past the match; subtract m to report its start.
                starts.push_back(i - m);
                j = lps[j - 1];
            }
        }
        else if (j > 0)
        {
            // Only the pattern pointer rewinds here; j-1 is the last matched character and lps[j-1] is the longest border that can still extend.
            j = lps[j - 1];
        }
        else
        {
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
    for (std::size_t k = 0; k < starts.size(); ++k)
    {
        std::cout << "start[" << k << "] = " << starts[k] << '\n';
    }
    return 0;
}

/*
 * 中文导读：利用模式串自身的最长相等前后缀，匹配失败时不回退主串指针。
 * 阅读顺序：先看 next/prefix 数组每个位置的含义；再看构建时 j=next[j-1] 的回退；最后看匹配循环为何只前进 i。
 * 关键不变量：next[i] 是 pattern[0..i] 的最长相等前后缀长度；回退后已经匹配的前缀仍然成立。
 * 易错点：把 next 定义为“包含当前字符”还是“前一位”混用；回退条件写错；空模式串；下标从 0/1 混用。
 * 复杂度：预处理 O(m)，匹配 O(n)，总 O(n+m)，空间 O(m)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 */

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

// 作用：标准库对照实现：用 string::find 循环查找所有匹配，允许重叠。
std::vector<std::size_t> find_all(const std::string &text, const std::string &pattern)
{
    std::vector<std::size_t> starts;
    if (pattern.empty())
    {
        return starts;
    }

    // Advancing by one after a hit keeps overlapping occurrences; find is a library shortcut, not KMP.
    std::size_t pos = text.find(pattern);
    while (pos != std::string::npos)
    {
        starts.push_back(pos);
        // +1 keeps overlapping occurrences instead of skipping past them.
        pos = text.find(pattern, pos + 1);
    }
    return starts;
}

// 作用：按顺序调用核心操作并打印关键状态，便于把抽象步骤和可见结果对应起来。
int main()
{
    std::string text = "ABABABCABABABC";
    std::string pattern = "ABABC";
    std::vector<std::size_t> starts = find_all(text, pattern);

    std::cout << "matches = " << starts.size() << '\n';
    for (std::size_t k = 0; k < starts.size(); ++k)
    {
        std::cout << "start[" << k << "] = " << starts[k] << '\n';
    }
    return 0;
}

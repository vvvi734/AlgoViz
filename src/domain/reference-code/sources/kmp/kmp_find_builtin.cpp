/*
 * 中文导读：本文件用 std::string::find 作标准库对照；它反复查找子串，不保证内部使用 KMP。
 * 阅读顺序：先看 find 的起点；再看命中后从 match+1 继续以保留重叠；最后与手写 KMP 比较复杂度。
 * 关键不变量：每次 find 从上次命中后一位开始；命中位置是 0 基；空模式串单独处理。
 * 易错点：把 std::string::find 当 KMP；命中后从 match+len 继续而漏掉重叠；忽略实现定义的复杂度。
 * 复杂度：由标准库实现决定，不保证 KMP 的 O(n+m)。
 * 本文件是标准库对照版：重点看“库函数调用”与手写算法在接口、稳定性、边界上的差异。
 * This is the standard-library comparison file: focus on interface, stability and boundary differences from the hand-written algorithm.
 * 输入/输出：输入主串与非空模式串；返回全部 0 基匹配起点或匹配次数；main 打印结果。
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

// Purpose: Standard-library comparison: loop over string::find to report every match, including overlaps.
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

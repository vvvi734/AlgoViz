/*
 * AlgoViz 参考代码 · 朴素模式匹配（BF） · C++17
 * 原理实现
 *
 * 中文导读：逐个枚举模式串在主串中的对齐起点，每个起点都从 P[0] 重新逐位比较；命中后仍继续下一起点，因此不会漏掉重叠出现。
 *
 * 思路：对每个合法起点 s，让模式串从 P[0] 开始与 T[s..] 逐字符比较。
 *   相同则 j 前进；不同则当前对齐作废，s 右移一格并令 j 归零。j 到达
 *   m 时记录 s，但仍继续下一个起点，因此 AAA 在 AAAAA 中会得到 0、1、2。
 *
 * 输入输出：text 为主串，pattern 必须非空；返回 std::vector<int>，元素是
 *   全部 0 基匹配起点，按递增顺序排列，允许重叠。
 *
 * 关键不变量：s 最大为 n - m；比较位置始终是 s + j；j 只表示模式串内
 *   偏移，不能拿来直接索引主串。
 *
 * 易错点：用 s < n 枚举起点导致越界；失配时忘记移动 s；找到匹配后提前
 *   结束；把空模式串当作匹配所有位置。
 *
 * 复杂度：最坏 O(nm) 时间；额外空间 O(1)，返回的结果容器不计入辅助空间。
 */

#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

/*
 * 返回 text 中 pattern 的全部匹配起点。
 *
 * 参数：
 *   text     主串，可为空；空串直接得到空结果。
 *   pattern  模式串，不能为空；空模式串抛出 std::invalid_argument。
 *
 * 返回值：全部 0 基起点的 vector，按递增顺序排列。
 * 副作用：只读取输入并构造返回值，不修改 text 或 pattern。
 */
std::vector<int> bf_find_all(const std::string &text, const std::string &pattern)
{
    if (pattern.empty())
    {
        throw std::invalid_argument("pattern must be a non-empty string");
    }

    std::vector<int> matches;
    std::size_t n = text.size();
    std::size_t m = pattern.size();

    // n < m 时不存在能容纳整个模式串的对齐，空结果就是正确结果。
    if (n < m)
    {
        return matches;
    }

    std::size_t candidate_count = n - m + 1;

    // 外层枚举起点；用 size_t 时上界必须是 candidate_count，不能写 s <= n - m + 1。
    for (std::size_t s = 0; s < candidate_count; ++s)
    {
        std::size_t j = 0;

        // 逐个确认前缀；循环结束时 j 可能等于 m，也可能停在第一个失配字符。
        while (j < m && text[s + j] == pattern[j])
        {
            ++j;
        }

        // 只有 j == m 才代表整个模式串匹配，不能只看最后一次比较是否相等。
        if (j == m)
        {
            matches.push_back(static_cast<int>(s));
        }

        // 成功分支也不提前退出：s 继续加一，重叠匹配才不会丢。
    }

    return matches;
}

/*
 * 演示入口：打印匹配数量与每个起点，并覆盖重叠、主串过短和空模式串。
 * 空模式串的异常在这里被捕获，避免程序直接终止。
 */
int main()
{
    std::vector<int> starts = bf_find_all("ABABABCABABABC", "ABABC");
    std::cout << "matches = " << starts.size() << '\n';
    for (std::size_t i = 0; i < starts.size(); ++i)
    {
        std::cout << "start[" << i << "] = " << starts[i] << '\n';
    }

    std::cout << "overlapping = " << bf_find_all("AAAAA", "AAA").size() << '\n';
    std::cout << "shorter text = " << bf_find_all("AB", "ABC").size() << '\n';

    try
    {
        bf_find_all("ABC", "");
    }
    catch (const std::invalid_argument &error)
    {
        std::cout << "empty pattern: " << error.what() << '\n';
    }
    return 0;
}

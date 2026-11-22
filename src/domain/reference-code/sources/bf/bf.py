# Brute-force substring search (BF) in Python 3.
# Try every legal alignment of the pattern. For start s, compare text[s + j]
# with pattern[j] from j = 0; a mismatch moves s right and restarts at j = 0.
# Reaching j == m records a match, and the loop still continues with s + 1 so
# overlapping occurrences are kept. Worst-case time O(nm), extra space O(1).
"""朴素模式匹配（BF）— AlgoViz Python 参考实现。

中文导读：逐个枚举模式串在主串中的对齐起点，每个起点都从 P[0] 重新逐位比较；命中后仍继续下一起点，因此不会漏掉重叠出现。

思路：BF 不预处理模式串，也不复用上一次对齐的结果。外层让模式串首字符
依次对齐到主串的每个合法起点 s，内层令 j 从 0 开始逐字符比较
text[s + j] 与 pattern[j]。相同则 j 前进；不同就说明当前起点不可能
完整匹配，令 s 右移一格并重新从 j = 0 开始。j 到达 m 时记录 s，但外层
仍继续，因此重叠出现不会漏掉。

阅读顺序：先看 `bf_find_all` 的起点上界 n - m；再看内层循环如何用
s + j 定位主串；最后看命中后为什么不 return。

输入输出：`text` 是主串，`pattern` 必须非空。返回全部 0 基匹配起点，
按递增顺序排列，允许重叠。空主串合法，返回空列表。

关键不变量：s 始终位于 [0, n - m]；j 是模式串内偏移，不是主串绝对
下标；`starts` 中任意相邻两项严格递增。

易错点：外层写成 range(n) 会越界；失配只清 j 不移动 s 会死循环；找到
第一个匹配就返回会漏掉重叠；把空模式串当作匹配所有位置。

复杂度：最坏时间 O(nm)，例如 T = "AAAA...A"、P = "AAA...AB"；额外
空间 O(1)，返回的列表本身不计入辅助空间。
"""

from __future__ import annotations


# Return every 0-based occurrence start, overlaps included; empty pattern raises.
def bf_find_all(text: str, pattern: str) -> list[int]:
    """返回 pattern 在 text 中的全部匹配起点，允许重叠。

    参数：
        text：主串，可为空。空串没有任何候选起点，结果为空列表。
        pattern：模式串，不能为空。

    返回：
        全部 0 基起点，按递增顺序排列。

    异常：
        ValueError：pattern 为空。空模式串没有定义好的匹配语义，不能
        当作“在每个位置都匹配”。

    副只读取两个参数并构造返回值，不修改输入。
    """
    if not pattern:
        raise ValueError("pattern must be a non-empty string")

    n = len(text)
    m = len(pattern)
    starts: list[int] = []

    # If n < m no alignment can hold the pattern; the early return also avoids a non-positive range bound.
    if n < m:
        return starts

    # The n < m case has already returned, so candidate_count is at least one and range(candidate_count) always has a valid first start.
    candidate_count = n - m + 1

    # Enumerate only legal starts; start aligns pattern[0] with text[start], so its maximum is n - m.
    for start in range(candidate_count):
        # j is reset for every start because BF does not reuse a matched prefix. The same text character can be compared in several alignments, which is why the worst case is O(nm).
        j = 0

        # j is both the confirmed prefix length and the next pattern index; the compared text position is start + j.
        # The legal-start bound keeps start+j within text; the loop therefore only checks the pattern index and character equality.
        while j < m and text[start + j] == pattern[j]:
            j += 1

        # j == m proves all m characters matched, not just the last pair.
        if j == m:
            starts.append(start)

        # Do not break after a hit: start + 1 may still form an overlapping match.

    return starts


if __name__ == "__main__":
    text = "ABABABCABABABC"
    pattern = "ABABC"
    starts = bf_find_all(text, pattern)
    print(f"matches = {len(starts)}")
    for index, start in enumerate(starts):
        print(f"start[{index}] = {start}")

    # 重叠检查：AAA 在 AAAAA 中应得到 0、1、2。
    # Overlap check: AAA in AAAAA must yield 0, 1, 2.
    print(f"overlapping = {bf_find_all('AAAAA', 'AAA')}")

    # 主串短于模式串是合法输入，只返回空列表。
    # A shorter text is valid input and yields an empty list.
    print(f"shorter text = {bf_find_all('AB', 'ABC')}")

    # 空模式串必须被拒绝，而不是返回所有下标。
    # An empty pattern must be rejected, not treated as matching all indices.
    try:
        bf_find_all("ABC", "")
    except ValueError as error:
        print(f"empty pattern: {error}")

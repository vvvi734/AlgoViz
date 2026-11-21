"""Convenience example: find every occurrence with str.find().

This is the standard-library shortcut for the same lookup task. It is not
guaranteed to use the KMP algorithm internally; see kmp.py for the explicit
KMP implementation.

Reading guide:
1. This convenience file calls str.find repeatedly instead of building an LPS table.
2. The next search starts at the previous match + 1, so overlapping occurrences are
   found.
3. CPython uses an optimized substring search, but this file does not demonstrate KMP's
   fallback rule.

Complexity: implementation-dependent; not the explicit O(n + m) KMP bound.
Convention: 0-based positions; an empty pattern is handled separately to avoid an
  infinite loop.
"""
# 中文导读：反复调用 str.find 查找所有出现位置，作为 KMP 的标准库对照。
# 阅读顺序：先看空模式串拒绝，再看 find 的起点为何每次加一。
# 输入/输出：输入主串与模式串；返回所有 0 基起点；空模式串抛 ValueError。
# 不变量：每次从上一个命中位置加一开始，因而能找到重叠出现。
# 易错点：把库函数当成一定使用 KMP；命中后从 pos + m 继续导致漏掉重叠。
# 复杂度：取决于 CPython 实现，不保证 O(n+m)。


# Purpose: Return every 0-based start of pattern in text; an empty pattern raises ValueError.
# 作用：返回 pattern 在 text 中的全部 0 基起点；空模式串抛 ValueError。
def find_all(text: str, pattern: str) -> list[int]:
    if not pattern:
        raise ValueError("pattern must not be empty")

    starts: list[int] = []
    # Advancing by one after a hit keeps overlapping occurrences; find is a library shortcut, not KMP.
    pos = text.find(pattern)
    while pos != -1:
        starts.append(pos)
        # +1 keeps overlapping occurrences instead of skipping past them.
        pos = text.find(pattern, pos + 1)
    return starts


if __name__ == "__main__":
    text = "ABABABCABABABC"
    pattern = "ABABC"
    starts = find_all(text, pattern)
    print(f"matches = {len(starts)}")
    for k, start in enumerate(starts):
        print(f"start[{k}] = {start}")

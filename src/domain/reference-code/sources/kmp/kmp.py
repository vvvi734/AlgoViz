"""KMP pattern matching — original Python reference.

LPS convention: 0-based, lps[k] is the length of the longest proper prefix of
pattern[0..k] that is also a suffix. On a mismatch, j moves to lps[j - 1]; the
text pointer i never moves backwards.

Reading guide:
1. Build lps[i], the length of the longest proper prefix that is also a suffix of
   pattern[0..i].
2. Build it with two indices: extend on a match, otherwise fall back to lps[j - 1].
3. Scan the text with the same fallback rule; every full pattern match is reported.
4. After a match, fall back to lps[m - 1] so overlapping occurrences are found.

Input/output: kmp_find_all returns every 0-based match start, in increasing
order, and keeps overlapping occurrences. Empty text is legal and yields an
empty list; an empty pattern raises ValueError.

Complexity: O(n + m); extra space O(m) for the lps table.
Convention: 0-based string indices; lps values are lengths, not positions.
"""
# 中文导读：先构造模式串的最长真前缀/后缀表，再在失配时按表回退，避免主串指针回退。
# 阅读顺序：先看 build_lps 的 j 回退，再看 kmp_find_all 中 i 只前进的分支。
# 输入/输出：输入主串与模式串；返回所有 0 基起点；空模式串抛 ValueError。
# 不变量：lps[i] 是 pattern[0..i] 的最长真 border 长度；匹配失败时 j 回到 lps[j-1]。
# 易错点：把 lps 当成位置表；失配后让 i 回退；空模式串未拒绝。
# 复杂度：O(n+m)，额外空间 O(m)。


# lps[i] is a length, not a position: on mismatch fall back to lps[j - 1].
# Purpose: Return the longest proper border length for every pattern prefix; an empty pattern returns [].
# 作用：返回模式串每个前缀的最长真 border 长度；空串返回 []。
def build_lps(pattern: str) -> list[int]:
    """Return the 0-based lps table for pattern.

    lps[k] is the length of the longest proper prefix of pattern[0..k] that is
    also its suffix. The function only reads pattern and allocates a new list;
    an empty pattern returns [].

    Invariant: before each iteration j is the length of the longest border of
    pattern[0..i-1], and every lps[0..i-1] entry is final.
    """
    m = len(pattern)
    if m == 0:
        return []

    lps = [0] * m
    i = 1
    j = 0
    while i < m:
        if pattern[i] == pattern[j]:
            j += 1
            lps[i] = j
            i += 1
        elif j > 0:
            # Fall back to the longest border that can still be extended.
            j = lps[j - 1]
        else:
            lps[i] = 0
            i += 1
    return lps


# Purpose: Return all 0-based starts; an empty pattern raises ValueError and overlaps are included.
# 作用：返回全部 0 基起点；空模式串抛 ValueError，支持重叠。
def kmp_find_all(text: str, pattern: str) -> list[int]:
    """Return every 0-based match start, including overlapping occurrences.

    Parameters:
        text: the haystack; an empty string is legal and returns an empty list.
        pattern: the needle; it must be non-empty.

    Returns:
        Starts in increasing order. A match that ends at text index i is
        reported as i - m, which is the start of the whole pattern.

    Raises:
        ValueError: pattern is empty. Empty patterns have no well-defined
        border table and are rejected instead of matching every position.

    Side effects: none; the inputs are not modified.
    """
    if not pattern:
        raise ValueError("pattern must not be empty")

    lps = build_lps(pattern)
    n = len(text)
    m = len(pattern)
    starts: list[int] = []
    i = 0
    j = 0

    while i < n:
        if text[i] == pattern[j]:
            i += 1
            j += 1
            if j == m:
                # i is already past the match; i - m is the start, then j falls back for overlaps.
                starts.append(i - m)
                j = lps[j - 1]
        elif j > 0:
            j = lps[j - 1]
        else:
            i += 1
    return starts


if __name__ == "__main__":
    text = "ABABABCABABABC"
    pattern = "ABABC"
    starts = kmp_find_all(text, pattern)
    print(f"matches = {len(starts)}")
    for k, start in enumerate(starts):
        print(f"start[{k}] = {start}")

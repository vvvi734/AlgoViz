"""KMP pattern matching — original Python reference, MIT.

LPS convention: 0-based, lps[k] is the length of the longest proper prefix of
pattern[0..k] that is also a suffix. On a mismatch, j moves to lps[j - 1]; the
text pointer i never moves backwards.
"""


def build_lps(pattern: str) -> list[int]:
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
            j = lps[j - 1]
        else:
            lps[i] = 0
            i += 1
    return lps


def kmp_find_all(text: str, pattern: str) -> list[int]:
    """Return every match start, including overlapping occurrences."""
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

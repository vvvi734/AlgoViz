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


def find_all(text: str, pattern: str) -> list[int]:
    if not pattern:
        raise ValueError("pattern must not be empty")

    starts: list[int] = []
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

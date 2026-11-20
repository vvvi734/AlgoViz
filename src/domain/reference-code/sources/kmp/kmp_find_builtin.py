"""Convenience example: find every occurrence with str.find().

This is the standard-library shortcut for the same lookup task. It is not
guaranteed to use the KMP algorithm internally; see kmp.py for the explicit
KMP implementation.
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

"""AlgoViz reference implementation: linear search.

Scans from left to right and returns the first matching index, or -1.

Reading guide:
1. Scan values[0..n) from left to right.
2. Return the first index whose value equals the target.
3. Return -1 after the scan if no value matched.

Complexity: O(n); extra space O(1).
Convention: 0-based indices; returns the first match, or -1 when absent.
"""

from __future__ import annotations


# Return the first matching index; -1 means the whole array was scanned.
def linear_search(values: list[int], target: int) -> int:
    for index, value in enumerate(values):
        if value == target:
            return index
    return -1


def main() -> None:
    values = [4, 7, 2, 9, 1, 5]
    print("target 9 ->", linear_search(values, 9))
    print("target 1 ->", linear_search(values, 1))
    print("target 6 ->", linear_search(values, 6))
    print("empty ->", linear_search([], 6))
    assert linear_search(values, 9) == 3
    assert linear_search(values, 6) == -1


if __name__ == "__main__":
    main()

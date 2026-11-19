"""AlgoViz shared convenience implementation: binary search with bisect.

Original code written for this repository under the MIT License.
bisect_left finds the first position that is not less than the target.
The input list must already be sorted.
"""

from __future__ import annotations

from bisect import bisect_left


def binary_search_builtin(values: list[int], target: int) -> int:
    position = bisect_left(values, target)
    if position == len(values) or values[position] != target:
        return -1
    return position


def main() -> None:
    values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    print("target 6 ->", binary_search_builtin(values, 6))
    print("target 10 ->", binary_search_builtin(values, 10))
    print("empty ->", binary_search_builtin([], 6))
    assert binary_search_builtin(values, 6) == 6
    assert binary_search_builtin(values, 10) == -1


if __name__ == "__main__":
    main()

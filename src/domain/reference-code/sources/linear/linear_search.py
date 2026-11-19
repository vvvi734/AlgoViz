"""AlgoViz reference implementation: linear search.

Original code written for this repository under the MIT License.
Scans from left to right and returns the first matching index, or -1.
"""

from __future__ import annotations


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

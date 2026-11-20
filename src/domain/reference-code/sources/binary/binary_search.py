"""AlgoViz reference implementation: binary search.

Based on this project's tested Python teaching implementation, with
teaching-only tracing calls removed. Released under the MIT License.
The algorithm is implemented explicitly; bisect is not used.

Reading guide:
1. The input must be non-decreasing; the function checks this before searching.
2. Keep an inclusive search window [low, high].
3. Compare the middle element and discard the half that cannot contain the target.
4. Return the found index, or -1 when the window becomes empty.

Complexity: O(log n); extra space O(1).
Convention: 0-based indices; low and high are inclusive; duplicate targets may return
  any matching index.
"""

from __future__ import annotations


def is_non_decreasing(values: list[int]) -> bool:
    return all(values[i - 1] <= values[i] for i in range(1, len(values)))


# Invariant: the answer, if present, stays inside the inclusive [low, high] window.
def binary_search(values: list[int], target: int) -> int:
    """Return the index of target in a non-decreasing list, or -1."""
    if not values:
        return -1
    left, right = 0, len(values) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1


def main() -> None:
    sorted_values = [1, 3, 5, 7, 9, 11, 13]
    if not is_non_decreasing(sorted_values):
        raise ValueError("binary search requires a non-decreasing list")

    print(f"target=9 index={binary_search(sorted_values, 9)}")
    print(f"missing=8 index={binary_search(sorted_values, 8)}")


if __name__ == "__main__":
    main()

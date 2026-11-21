"""AlgoViz reference implementation: binary search.

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
# 中文导读：在非降序数组中用闭区间折半查找目标，区间为空时返回 -1。
# 阅读顺序：先看 is_non_decreasing 的前置检查，再看 low/high 的收缩方式。
# 输入/输出：输入数组与目标；返回首个匹配下标或 -1；空数组返回 -1。
# 不变量：目标若存在，始终位于闭区间 [low, high] 内。
# 易错点：在未排序数组上调用；high = mid - 1 与 low = mid + 1 写反。
# 复杂度：O(log n)，额外空间 O(1)。

from __future__ import annotations


# Purpose: Check that adjacent values are non-decreasing; empty and single-element arrays return True.
# 作用：判断相邻元素是否非降；空数组和单元素数组返回 True。
def is_non_decreasing(values: list[int]) -> bool:
    return all(values[i - 1] <= values[i] for i in range(1, len(values)))


# Invariant: the answer, if present, stays inside the inclusive [low, high] window.
# The window is inclusive: low == high still leaves one candidate, and mid is computed without overflow.
# Purpose: Return target's index or -1; values must be non-decreasing.
# 作用：返回 target 的下标或 -1；要求 values 已非降排序。
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


# Purpose: Demonstrate a hit and a miss on a sorted array.
# 作用：演示有序数组上的命中和未命中。
def main() -> None:
    sorted_values = [1, 3, 5, 7, 9, 11, 13]
    if not is_non_decreasing(sorted_values):
        raise ValueError("binary search requires a non-decreasing list")

    print(f"target=9 index={binary_search(sorted_values, 9)}")
    print(f"missing=8 index={binary_search(sorted_values, 8)}")


if __name__ == "__main__":
    main()

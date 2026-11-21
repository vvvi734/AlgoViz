"""AlgoViz shared convenience implementation: binary search with bisect.

bisect_left finds the first position that is not less than the target.
The input list must already be sorted.

Reading guide:
1. This is the Python standard-library binary-search shortcut, not a hand-written
   search.
2. bisect_left finds the first position whose value is >= the target.
3. The list must already be sorted in ascending order.

Complexity: O(log n); extra space O(1).
Convention: 0-based list indices; the insertion point may equal len(values).
"""
# 中文导读：用 bisect 在有序数组中查找插入点，演示标准库的二分语义。
# 阅读顺序：先看 bisect_left 的返回值，再看成员判断为何还要比较一次。
# 输入/输出：输入有序数组与目标；返回下标或 -1。
# 不变量：bisect_left 返回第一个不小于 target 的位置。
# 易错点：把插入点直接当成命中下标；在未排序数组上调用。
# 复杂度：O(log n)，额外空间 O(1)。

from __future__ import annotations

from bisect import bisect_left


# 作用：返回 target 的下标或 -1；要求 values 已排序。
def binary_search_builtin(values: list[int], target: int) -> int:
    # `bisect_left` returns an insertion point in [0, len]; check the slot before treating it as a hit.
    position = bisect_left(values, target)
    if position == len(values) or values[position] != target:
        return -1
    return position


# 作用：演示 bisect 查找。
def main() -> None:
    values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    print("target 6 ->", binary_search_builtin(values, 6))
    print("target 10 ->", binary_search_builtin(values, 10))
    print("empty ->", binary_search_builtin([], 6))
    assert binary_search_builtin(values, 6) == 6
    assert binary_search_builtin(values, 10) == -1


if __name__ == "__main__":
    main()

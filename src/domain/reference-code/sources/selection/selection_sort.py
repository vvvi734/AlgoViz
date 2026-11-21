"""AlgoViz reference implementation: selection sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.

Reading guide:
1. The prefix [0, start) is already the sorted portion.
2. Scan the unsorted suffix for its minimum.
3. Swap that minimum into position start and grow the sorted prefix by one.

Complexity: O(n^2) in all cases; extra space O(1).
Convention: Ascending order; 0-based indices; the exchange can move equal keys, so the
  sort is not stable.
"""
# 中文导读：每轮在未排序后缀中选出最小元素，扫描结束后再与后缀首元素交换。
# 阅读顺序：先看 minimum 的更新，再看交换发生在内层循环之后。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：第 i 轮开始前，前缀 0..i-1 已经就位。
# 易错点：边扫描边交换导致下标错乱；内层范围写成从 0 开始。
# 复杂度：O(n^2)，额外空间 O(1)，不稳定。

from __future__ import annotations


# Invariant: [0, start) is sorted; each scan finds the minimum of the unsorted suffix.
# `minimum` holds the index of the smallest value seen in the unsorted suffix; swap only after the scan finishes.
# 作用：原地升序排序 values；不稳定。
def selection_sort(values: list[int]) -> None:
    for start in range(len(values) - 1):
        minimum = start
        for index in range(start + 1, len(values)):
            if values[index] < values[minimum]:
                minimum = index
        if minimum != start:
            values[start], values[minimum] = values[minimum], values[start]


# 作用：演示选择排序并打印结果。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    selection_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    selection_sort(empty)
    selection_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

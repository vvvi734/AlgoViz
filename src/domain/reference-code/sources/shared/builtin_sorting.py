"""AlgoViz shared convenience reference: Python built-in sorting.


sorted() and list.sort() perform the same task (order a list ascending), not a
hand-written bubble/selection/insertion sort. Both are stable.
sorted() returns a new list; list.sort() mutates the list and returns None.

Reference: Python standard library sorting documentation.

Reading guide:
1. This is the Python standard-library sorting shortcut, not a hand-written sort.
2. sorted() returns a new list; list.sort() mutates the list in place.
3. Both use Timsort and preserve the relative order of equal keys.

Complexity: O(n log n) worst, O(n) best for nearly sorted input; extra space O(n)
  worst.
Convention: 0-based list indices; both routes are stable.
"""
# 中文导读：用 sorted 演示 Timsort 的稳定排序结果。
# 阅读顺序：先看排序键，再看相等元素的相对次序。
# 输入/输出：输入整数数组；返回新的有序列表，输入不变。
# 不变量：sorted 是稳定排序，相等元素保持原相对顺序。
# 易错点：把 sorted 当成原地修改；忽略额外空间。
# 复杂度：O(n log n) 最坏，额外空间 O(n)。

from __future__ import annotations


# 作用：用 sorted 演示稳定排序。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]

    # `sorted()` returns a new list; `list.sort()` mutates in place, and both are stable.
    ordered = sorted(values)
    in_place = values.copy()
    in_place.sort()

    print("sorted:", " ".join(str(value) for value in ordered))
    print("in_place:", " ".join(str(value) for value in in_place))
    print("stable: sorted() and list.sort() preserve equal-key order")

    empty = sorted([])
    assert empty == []
    assert in_place == ordered
    print("empty:ok")


if __name__ == "__main__":
    main()

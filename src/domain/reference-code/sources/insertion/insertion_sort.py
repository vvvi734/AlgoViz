"""AlgoViz reference implementation: insertion sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.

Reading guide:
1. Treat [0, i) as the sorted prefix and values[i] as the key to insert.
2. Shift every prefix value greater than the key one slot right.
3. Write the key into the first free slot; this preserves the relative order of equal
   keys.

Complexity: O(n^2) worst, O(n) best for nearly sorted input; extra space O(1).
Convention: Ascending order; 0-based indices; the shift stops at the first value <= key,
  so the sort is stable.
"""
# 中文导读：把当前元素插入左侧已排好序的前缀，严格大于时才继续左移以保持稳定。
# 阅读顺序：先看已排序前缀的范围，再看内层 while 的停止条件。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：外层第 i 轮开始前，values[0..i-1] 已经有序。
# 易错点：用 >= 比较导致相等元素被越过，破坏稳定性；内层下标越界。
# 复杂度：最坏/平均 O(n^2)，最好 O(n)，额外空间 O(1)，稳定。

from __future__ import annotations


# Invariant: [0, i) is sorted; shift larger values right before writing the key.
# Shift only while the previous value is strictly greater; equal keys stop the shift and keep the sort stable.
# 作用：原地升序排序 values；相等元素不交换，保持稳定。
def insertion_sort(values: list[int]) -> None:
    for index in range(1, len(values)):
        current = values[index]
        position = index
        while position > 0 and values[position - 1] > current:
            values[position] = values[position - 1]
            position -= 1
        values[position] = current


# 作用：演示插入排序并打印结果。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    insertion_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    insertion_sort(empty)
    insertion_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

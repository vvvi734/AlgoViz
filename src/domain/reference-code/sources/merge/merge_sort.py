"""AlgoViz reference implementation: merge sort.

The implementation is intentionally explicit; sorted()/list.sort() are not used.

Reading guide:
1. Split the half-open range [left, right) at its midpoint.
2. Recursively sort both halves, then merge them into a temporary buffer.
3. Merge by repeatedly taking the smaller front element; copy the merged run back.

Complexity: O(n log n); extra space O(n) for the merge buffer.
Convention: Ranges are half-open [left, right); 0-based indices; taking the left element
  on ties keeps the sort stable.
"""
# 中文导读：递归把区间对半划分，合并时从两个有序段的前端取较小者。
# 阅读顺序：先看递归出口，再看 merge_range 的共享 buffer 和稳定性。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：合并前左右两段各自有序；相等时取左段以保持稳定。
# 易错点：buffer 未按相同下标写回；递归区间重叠；相等时取右段破坏稳定性。
# 复杂度：O(n log n)，额外空间 O(n)。

from __future__ import annotations


# The buffer is shared across recursive calls; ties take the left run, which keeps the merge stable.
# 作用：把 values[left..middle] 与 [middle+1..right] 合并到 buffer 再写回。
def merge_range(values: list[int], buffer: list[int], left: int, middle: int, right: int) -> None:
    i, j, k = left, middle + 1, left

    while i <= middle and j <= right:
        # Take the left run on ties to preserve stability.
        if values[i] <= values[j]:
            buffer[k] = values[i]
            i += 1
        else:
            buffer[k] = values[j]
            j += 1
        k += 1

    while i <= middle:
        buffer[k] = values[i]
        i += 1
        k += 1
    while j <= right:
        buffer[k] = values[j]
        j += 1
        k += 1

    for index in range(left, right + 1):
        values[index] = buffer[index]


# 作用：递归排序闭区间 [left, right]。
def merge_sort_range(values: list[int], buffer: list[int], left: int, right: int) -> None:
    if left >= right:
        return
    middle = left + (right - left) // 2
    merge_sort_range(values, buffer, left, middle)
    merge_sort_range(values, buffer, middle + 1, right)
    merge_range(values, buffer, left, middle, right)


# Recursive divide-and-conquer; the merge step takes the smaller front element to stay stable.
# 作用：为整个数组分配 buffer 并启动递归排序。
def merge_sort(values: list[int]) -> None:
    if len(values) < 2:
        return
    buffer = [0] * len(values)
    merge_sort_range(values, buffer, 0, len(values) - 1)


# 作用：演示归并排序并打印结果。
def main() -> None:
    values = [9, 4, 7, 2, 6, 1, 3, 8, 5]
    merge_sort(values)
    print("sorted:", " ".join(str(value) for value in values))


if __name__ == "__main__":
    main()

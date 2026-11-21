"""AlgoViz reference implementation: quicksort.

Lomuto partition: <= pivot goes left, > pivot goes right.

Reading guide:
1. Partition the range around the last element as pivot.
2. Move values smaller than the pivot left and values greater than it right.
3. Place the pivot in its final slot and recurse on the two sides.

Complexity: O(n log n) average, O(n^2) worst; extra space O(log n) average recursion,
  O(n) worst.
Convention: Ranges are inclusive [low, high]; 0-based indices; the partition scheme is
  not stable.
"""
# 中文导读：以区间末尾为枢轴做 Lomuto 划分，再递归排序左右两段。
# 阅读顺序：先看 boundary 的含义，再看枢轴换到 boundary+1 的位置。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：划分后枢轴左侧不大于枢轴，右侧大于枢轴。
# 易错点：boundary 初值写错；递归区间包含枢轴导致死循环；有序数组退化为 O(n^2)。
# 复杂度：平均 O(n log n)，最坏 O(n^2)，额外空间 O(log n) 递归。

from __future__ import annotations


# Lomuto partition: <= pivot goes left, > pivot goes right, pivot returns at boundary + 1.
# Lomuto partition: `boundary` marks the end of the <= pivot region and starts at low - 1; the pivot is swapped to `boundary + 1`.
# 作用：以 values[high] 为枢轴划分 [low, high]，返回枢轴最终下标。
def partition(values: list[int], low: int, high: int) -> int:
    pivot = values[high]
    boundary = low - 1
    for index in range(low, high):
        if values[index] <= pivot:
            boundary += 1
            values[boundary], values[index] = values[index], values[boundary]
    values[boundary + 1], values[high] = values[high], values[boundary + 1]
    return boundary + 1


# 作用：递归排序闭区间 [low, high]。
def quick_sort_range(values: list[int], low: int, high: int) -> None:
    if low >= high:
        return
    middle = partition(values, low, high)
    quick_sort_range(values, low, middle - 1)
    quick_sort_range(values, middle + 1, high)


# 作用：对整数组启动快速排序。
def quick_sort(values: list[int]) -> None:
    quick_sort_range(values, 0, len(values) - 1)


# 作用：演示快速排序并打印结果。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    quick_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    quick_sort(empty)
    quick_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

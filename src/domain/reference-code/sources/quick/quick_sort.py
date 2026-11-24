"""AlgoViz reference implementation: quicksort.

Median-of-three chooses the pivot; Lomuto partition places it in its final slot.
The smaller side recurses and the larger side iterates, bounding stack depth.

Reading guide:
1. Order low/middle/high and move the median to high.
2. Partition with <= on the left and > on the right.
3. Recurse on the smaller side; continue the loop on the larger side.

Complexity: O(n log n) average, O(n^2) worst; recursion space O(log n) by construction.
Convention: Ranges are inclusive [low, high]; 0-based indices; the partition scheme is
  not stable.
"""
# 中文导读：三数取中选枢轴，Lomuto 划分后先递归较小侧、较大侧用循环处理。
# 阅读顺序：先看 median_of_three 如何把中位数换到末尾，再看 partition 的边界。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：划分后枢轴左侧不大于枢轴，右侧大于枢轴。
# 易错点：固定末尾枢轴导致有序数组退化；两侧都递归导致栈深 O(n)。
# 复杂度：平均 O(n log n)，最坏 O(n^2)，递归栈 O(log n)。

from __future__ import annotations


# Purpose: Order values[low], values[middle], values[high], then move the median to high for Lomuto.
# 作用：先让 low/middle/high 三个位置有序，再把中位数换到 high，供 Lomuto 划分使用。
def median_of_three(values: list[int], low: int, high: int) -> int:
    middle = low + (high - low) // 2
    # The offset midpoint avoids low+high overflow; for a two-element range it equals low.
    if values[middle] < values[low]:
        values[middle], values[low] = values[low], values[middle]
    if values[high] < values[low]:
    # After this swap low holds the smallest of the three, so the median cannot be low.
        values[high], values[low] = values[low], values[high]
    if values[high] < values[middle]:
    # The remaining comparison orders middle and high; the median is now at middle.
        values[high], values[middle] = values[middle], values[high]
    values[middle], values[high] = values[high], values[middle]
    # Lomuto reads values[high] as the pivot, so the median is moved there after the three-way ordering.
    return values[high]


# Lomuto partition: <= pivot goes left, > pivot goes right, pivot returns at boundary + 1.
# Purpose: Partition [low, high] around the median moved to the end and return its final index.
# 作用：以三数取中后放在末尾的基准划分 [low, high]，返回基准最终下标。
def partition(values: list[int], low: int, high: int) -> int:
    pivot = median_of_three(values, low, high)
    # Median-of-three makes sorted and reverse-sorted inputs choose a middle value instead of an extreme.
    boundary = low - 1
    # boundary is the exclusive end of the accepted region; starting at low-1 makes the first accepted element land at low.
    for index in range(low, high):
    # Python's range excludes high, matching the pivot exclusion exactly and avoiding an off-by-one scan.
        if values[index] <= pivot:
        # Equal keys go left by design; this stabilizes duplicate-heavy partitions but does not make the overall sort stable.
            boundary += 1
            # The boundary moves only after a qualifying element is seen; its value is the count of accepted elements minus one.
            values[boundary], values[index] = values[index], values[boundary]
    values[boundary + 1], values[high] = values[high], values[boundary + 1]
    # The tuple assignment swaps pivot and boundary+1 atomically in Python; the pivot is now at its final index.
    return boundary + 1


# Purpose: Partition, recurse on the smaller side, and iterate on the larger side.
# 作用：划分后先递归较小侧、再循环处理较大侧，避免不平衡划分把递归栈推到 O(n)。
def quick_sort_range(values: list[int], low: int, high: int) -> None:
    while low < high:
    # The loop replaces the larger recursive branch; only the smaller branch consumes stack, bounding depth by O(log n).
        middle = partition(values, low, high)
        if middle - low < high - middle:
        # The left side is smaller: recurse there and continue with the right side.
            quick_sort_range(values, low, middle - 1)
            low = middle + 1
        else:
        # The right side is no larger: recurse there and continue with the left side.
            quick_sort_range(values, middle + 1, high)
            high = middle - 1


# Purpose: Start quicksort on the whole array.
# 作用：对整数组启动快速排序。
def quick_sort(values: list[int]) -> None:
    quick_sort_range(values, 0, len(values) - 1)


# Purpose: Demonstrate quicksort and print the result.
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

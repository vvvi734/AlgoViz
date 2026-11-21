"""AlgoViz reference implementation: bubble sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.

Reading guide:
1. Each pass compares adjacent pairs from the left and swaps inverted pairs.
2. After pass k, the largest k values are fixed at the right end.
3. A pass with no swap proves the remaining prefix is already sorted, so stop early.

Complexity: O(n^2) average/worst, O(n) best with early exit; extra space O(1).
Convention: Ascending order; 0-based array access; equal values are never swapped, so
  the sort is stable.
"""
# 中文导读：相邻元素反复比较交换，每趟把当前最大值送到右端；整趟无交换时提前结束。
# 阅读顺序：先看外层趟数，再看内层比较范围为何逐趟缩短。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：第 k 趟结束后，右端 k 个元素已经就位。
# 易错点：内层上界写成 n-1 导致越界；把“无交换”判断放在错误位置。
# 复杂度：最坏/平均 O(n^2)，最好 O(n)，额外空间 O(1)，稳定。

from __future__ import annotations


# Invariant: after each pass, the largest remaining values are fixed at the right end.
# After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
# Purpose: Sort values ascending in place with no return value; stable.
# 作用：原地升序排序 values；无返回值，稳定。
def bubble_sort(values: list[int]) -> None:
    end = len(values) - 1
    while end > 0:
        swapped = False
        for index in range(end):
            if values[index] > values[index + 1]:
                values[index], values[index + 1] = values[index + 1], values[index]
                swapped = True
        # No swap in a full pass means the remaining prefix is already sorted.
        if not swapped:
            break
        end -= 1


# Purpose: Demonstrate bubble sort and print the result.
# 作用：演示冒泡排序并打印结果。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    bubble_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    bubble_sort(empty)
    bubble_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

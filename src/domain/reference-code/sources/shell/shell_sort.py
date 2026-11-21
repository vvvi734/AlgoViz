"""AlgoViz reference implementation: Shell sort.

Gap insertion sort, halving the gap until the final gap-1 pass.

Reading guide:
1. Choose a decreasing gap sequence; each pass insertion-sorts the subsequences with
   that gap.
2. Elements far apart move early, reducing the work left for smaller gaps.
3. The final gap of 1 is ordinary insertion sort over the whole array.

Complexity: Time depends on the gap sequence; O(n^2) worst case, often subquadratic;
  extra space O(1).
Convention: Ascending order; gaps are positive; the implementation uses n/2, n/4, ... ,
  1.
"""
# 中文导读：按逐渐缩小的 gap 对子序列做插入排序，最后 gap=1 时完成整体排序。
# 阅读顺序：先看 gap 序列，再看每个 gap 下的跨步插入。
# 输入/输出：输入整数数组；原地排序，无返回值。
# 不变量：每个 gap 轮次后，相隔 gap 的子序列已经有序。
# 易错点：gap 最终没有降到 1；跨步插入的边界写成 i-gap 越界。
# 复杂度：平均 O(n^1.3) 左右，最坏 O(n^2)，额外空间 O(1)，不稳定。

from __future__ import annotations


# Each gap pass insertion-sorts independent subsequences; gap 1 finishes the array.
# Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.
# 作用：原地升序排序 values；按 gap 分组做插入排序。
def shell_sort(values: list[int]) -> None:
    gap = len(values) // 2
    while gap > 0:
        for index in range(gap, len(values)):
            current = values[index]
            position = index
            while position >= gap and values[position - gap] > current:
                values[position] = values[position - gap]
                position -= gap
            values[position] = current
        gap //= 2


# 作用：演示希尔排序并打印结果。
def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    shell_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    shell_sort(empty)
    shell_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

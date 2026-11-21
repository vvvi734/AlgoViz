"""AlgoViz reference implementation: linear search.

Scans from left to right and returns the first matching index, or -1.

Reading guide:
1. Scan values[0..n) from left to right.
2. Return the first index whose value equals the target.
3. Return -1 after the scan if no value matched.

Complexity: O(n); extra space O(1).
Convention: 0-based indices; returns the first match, or -1 when absent.
"""
# 中文导读：从头到尾逐个比较，返回第一个匹配下标；扫描完仍无匹配才返回 -1。
# 阅读顺序：先看循环范围，再看返回时机。
# 输入/输出：输入数组与目标；返回首个匹配下标或 -1。
# 不变量：扫描到 i 时，0..i-1 都不等于 target。
# 易错点：找到后继续扫描；空数组未返回 -1。
# 复杂度：O(n)，额外空间 O(1)。

from __future__ import annotations


# Return the first matching index; -1 means the whole array was scanned.
# Return the first matching index; -1 is correct only after the entire array has been scanned.
# Purpose: Return target's first index or -1 without modifying values.
# 作用：返回 target 的首个下标或 -1；不修改 values。
def linear_search(values: list[int], target: int) -> int:
    for index, value in enumerate(values):
        if value == target:
            return index
    return -1


# Purpose: Demonstrate both a hit and a miss.
# 作用：演示命中和未命中。
def main() -> None:
    values = [4, 7, 2, 9, 1, 5]
    print("target 9 ->", linear_search(values, 9))
    print("target 1 ->", linear_search(values, 1))
    print("target 6 ->", linear_search(values, 6))
    print("empty ->", linear_search([], 6))
    assert linear_search(values, 9) == 3
    assert linear_search(values, 6) == -1


if __name__ == "__main__":
    main()

"""Sparse transpose — Python convenience example.

This is the common “swap then sort” approach: it produces the same row-major
transposed triplet list, but costs O(t log t), not O(t + c). It does not use
num/cpot and is not the fast transpose taught in the course.

Reading guide:
1. This convenience file swaps row/col in every triplet, then sorts by (row, col).
2. Sorting restores row-major order, producing the same transpose table as the fast
   algorithm.
3. It does not compute num/cpot and runs in O(t log t), not O(t + c).

Complexity: O(t log t); extra space O(t) for the copied list.
Convention: 0-based coordinates; input must still be a valid sparse triplet table.
"""
# 中文导读：先转置三元组并交换行列，再按行优先重新排序，得到转置矩阵的三元组。
# 阅读顺序：先看三元组的行列交换，再看排序键 (row, col)。
# 输入/输出：输入行数、列数和三元组；返回转置后的三元组。
# 不变量：转置后每个非零元素的位置是 (原 col, 原 row)。
# 易错点：忘记交换行列；排序键只按行不按列。
# 复杂度：O(nnz log nnz)，额外空间 O(nnz)。

from dataclasses import dataclass
from typing import List, Tuple


@dataclass(frozen=True)
class Triple:
    row: int
    col: int
    value: int


# Purpose: Return the transposed triplets sorted in row-major order.
# 作用：返回按行优先排序的转置三元组。
def sort_transpose(triples: List[Triple]) -> List[Triple]:
    swapped = [Triple(item.col, item.row, item.value) for item in triples]
    # Swap row/col first, then sort by (row, col); this is O(t log t), not the course O(t+c) fast transpose.
    return sorted(swapped, key=lambda item: (item.row, item.col))


# Purpose: Build a demo sparse matrix and print the transposed result.
# 作用：构造演示稀疏矩阵并打印转置结果。
def main() -> None:
    triples = [
        Triple(0, 0, 3),
        Triple(0, 2, 7),
        Triple(1, 2, 5),
        Triple(2, 1, 4),
        Triple(3, 0, 6),
        Triple(3, 2, 8),
    ]
    for item in sort_transpose(triples):
        print((item.row, item.col, item.value))


if __name__ == "__main__":
    main()

"""Sparse transpose — Python convenience example, MIT.

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

from dataclasses import dataclass
from typing import List, Tuple


@dataclass(frozen=True)
class Triple:
    row: int
    col: int
    value: int


def sort_transpose(triples: List[Triple]) -> List[Triple]:
    swapped = [Triple(item.col, item.row, item.value) for item in triples]
    return sorted(swapped, key=lambda item: (item.row, item.col))


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

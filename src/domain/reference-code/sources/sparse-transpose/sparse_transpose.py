"""Sparse matrix fast transpose — original Python teaching implementation.

Convention: 0-based matrix coordinates, triplet positions and cpot slots; input
triplets are row-major with unique (row, col).

Reading guide:
1. num[c] counts the non-zero entries in original column c, using one pass over the
   triplets.
2. cpot[c] is the first result slot for column c: cpot[0] = 0 and cpot[c] = cpot[c-1] +
   num[c-1].
3. Scan the source triplets again in row-major order; q = cpot[col] is the destination
   slot.
4. Write (col, row, value), then increment cpot[col] so the next entry of that column
   follows.

Complexity: O(t + c) time; extra space O(c) for num/cpot, plus O(t) for the result
  table.
"""

from dataclasses import dataclass
from typing import List, Tuple


@dataclass(frozen=True)
class Triple:
    row: int
    col: int
    value: int


def fast_transpose(rows: int, cols: int, triples: List[Triple]) -> Tuple[int, int, List[Triple]]:
    """Return (transposed_rows, transposed_cols, transposed_triplets)."""
    if rows < 0 or cols < 0:
        raise ValueError("matrix dimensions must be non-negative")
    for item in triples:
        if item.row < 0 or item.row >= rows or item.col < 0 or item.col >= cols:
            raise ValueError("triplet coordinate outside the matrix")
        if item.value == 0:
            raise ValueError("a sparse triplet must be non-zero")
    for previous, current in zip(triples, triples[1:]):
        if current.row < previous.row or (
            current.row == previous.row and current.col <= previous.col
        ):
            raise ValueError("triplets must be strictly row-major and unique")

    result: List[Triple] = []
    new_rows, new_cols = cols, rows
    if cols == 0:
        return new_rows, new_cols, result

    num = [0] * cols
    cpot = [0] * cols
    result = [Triple(0, 0, 0) for _ in triples]

    # Phase 1: count non-zeros per original column.
    for item in triples:
        num[item.col] += 1

    # Phase 2: cpot[c] is the first result slot of column c.
    cpot[0] = 0
    for c in range(1, cols):
        cpot[c] = cpot[c - 1] + num[c - 1]

    # Phase 3: place each source triplet directly into its final slot.
    for item in triples:
        q = cpot[item.col]
        result[q] = Triple(item.col, item.row, item.value)
        cpot[item.col] = q + 1

    return new_rows, new_cols, result


def main() -> None:
    rows, cols = 4, 5
    triples = [
        Triple(0, 0, 3),
        Triple(0, 2, 7),
        Triple(1, 2, 5),
        Triple(2, 1, 4),
        Triple(3, 0, 6),
        Triple(3, 2, 8),
    ]
    new_rows, new_cols, result = fast_transpose(rows, cols, triples)
    print(f"shape = {rows} x {cols}, nnz = {len(triples)}")
    for item in triples:
        print((item.row, item.col, item.value))
    print("--- transposed ---")
    print(f"shape = {new_rows} x {new_cols}, nnz = {len(result)}")
    for item in result:
        print((item.row, item.col, item.value))


if __name__ == "__main__":
    main()

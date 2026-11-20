"""AlgoViz reference implementation: insertion sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.
Released under the MIT License.

Reading guide:
1. Treat [0, i) as the sorted prefix and values[i] as the key to insert.
2. Shift every prefix value greater than the key one slot right.
3. Write the key into the first free slot; this preserves the relative order of equal
   keys.

Complexity: O(n^2) worst, O(n) best for nearly sorted input; extra space O(1).
Convention: Ascending order; 0-based indices; the shift stops at the first value <= key,
  so the sort is stable.
"""

from __future__ import annotations


# Invariant: [0, i) is sorted; shift larger values right before writing the key.
def insertion_sort(values: list[int]) -> None:
    for index in range(1, len(values)):
        current = values[index]
        position = index
        while position > 0 and values[position - 1] > current:
            values[position] = values[position - 1]
            position -= 1
        values[position] = current


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

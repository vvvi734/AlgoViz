"""AlgoViz reference implementation: selection sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.
Released under the MIT License.

Reading guide:
1. The prefix [0, start) is already the sorted portion.
2. Scan the unsorted suffix for its minimum.
3. Swap that minimum into position start and grow the sorted prefix by one.

Complexity: O(n^2) in all cases; extra space O(1).
Convention: Ascending order; 0-based indices; the exchange can move equal keys, so the
  sort is not stable.
"""

from __future__ import annotations


# Invariant: [0, start) is sorted; each scan finds the minimum of the unsorted suffix.
def selection_sort(values: list[int]) -> None:
    for start in range(len(values) - 1):
        minimum = start
        for index in range(start + 1, len(values)):
            if values[index] < values[minimum]:
                minimum = index
        if minimum != start:
            values[start], values[minimum] = values[minimum], values[start]


def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    selection_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    selection_sort(empty)
    selection_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

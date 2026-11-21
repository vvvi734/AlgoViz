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

from __future__ import annotations


# Invariant: after each pass, the largest remaining values are fixed at the right end.
# After pass k the largest k values sit at the right end; an unchanged pass ends the sort early.
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

"""AlgoViz shared convenience reference: Python built-in sorting.


sorted() and list.sort() perform the same task (order a list ascending), not a
hand-written bubble/selection/insertion sort. Both are stable.
sorted() returns a new list; list.sort() mutates the list and returns None.

Reference: Python standard library sorting documentation.

Reading guide:
1. This is the Python standard-library sorting shortcut, not a hand-written sort.
2. sorted() returns a new list; list.sort() mutates the list in place.
3. Both use Timsort and preserve the relative order of equal keys.

Complexity: O(n log n) worst, O(n) best for nearly sorted input; extra space O(n)
  worst.
Convention: 0-based list indices; both routes are stable.
"""

from __future__ import annotations


def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]

    # `sorted()` returns a new list; `list.sort()` mutates in place, and both are stable.
    ordered = sorted(values)
    in_place = values.copy()
    in_place.sort()

    print("sorted:", " ".join(str(value) for value in ordered))
    print("in_place:", " ".join(str(value) for value in in_place))
    print("stable: sorted() and list.sort() preserve equal-key order")

    empty = sorted([])
    assert empty == []
    assert in_place == ordered
    print("empty:ok")


if __name__ == "__main__":
    main()

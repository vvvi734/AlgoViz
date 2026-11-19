"""AlgoViz shared convenience reference: Python built-in sorting.

Original example written for this repository under the MIT License.

sorted() and list.sort() perform the same task (order a list ascending), not a
hand-written bubble/selection/insertion sort. Both are stable.
sorted() returns a new list; list.sort() mutates the list and returns None.

Reference: Python standard library sorting documentation.
"""

from __future__ import annotations


def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]

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

"""AlgoViz reference implementation: selection sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.
Released under the MIT License.
"""

from __future__ import annotations


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

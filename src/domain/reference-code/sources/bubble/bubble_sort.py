"""AlgoViz reference implementation: bubble sort.

Explicit teaching implementation; sorted()/list.sort() are intentionally not used.
Released under the MIT License.
"""

from __future__ import annotations


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

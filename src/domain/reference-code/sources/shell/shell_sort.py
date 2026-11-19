"""AlgoViz reference implementation: Shell sort.

Original code written for this repository under the MIT License.
Gap insertion sort, halving the gap until the final gap-1 pass.
"""

from __future__ import annotations


def shell_sort(values: list[int]) -> None:
    gap = len(values) // 2
    while gap > 0:
        for index in range(gap, len(values)):
            current = values[index]
            position = index
            while position >= gap and values[position - gap] > current:
                values[position] = values[position - gap]
                position -= gap
            values[position] = current
        gap //= 2


def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    shell_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    shell_sort(empty)
    shell_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

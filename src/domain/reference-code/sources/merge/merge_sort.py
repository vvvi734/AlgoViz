"""AlgoViz reference implementation: merge sort.

Based on this project's tested Python teaching implementation, with
teaching-only tracing calls removed. Released under the MIT License.
The implementation is intentionally explicit; sorted()/list.sort() are not used.
"""

from __future__ import annotations


def merge_range(values: list[int], buffer: list[int], left: int, middle: int, right: int) -> None:
    i, j, k = left, middle + 1, left

    while i <= middle and j <= right:
        # Take the left run on ties to preserve stability.
        if values[i] <= values[j]:
            buffer[k] = values[i]
            i += 1
        else:
            buffer[k] = values[j]
            j += 1
        k += 1

    while i <= middle:
        buffer[k] = values[i]
        i += 1
        k += 1
    while j <= right:
        buffer[k] = values[j]
        j += 1
        k += 1

    for index in range(left, right + 1):
        values[index] = buffer[index]


def merge_sort_range(values: list[int], buffer: list[int], left: int, right: int) -> None:
    if left >= right:
        return
    middle = left + (right - left) // 2
    merge_sort_range(values, buffer, left, middle)
    merge_sort_range(values, buffer, middle + 1, right)
    merge_range(values, buffer, left, middle, right)


def merge_sort(values: list[int]) -> None:
    if len(values) < 2:
        return
    buffer = [0] * len(values)
    merge_sort_range(values, buffer, 0, len(values) - 1)


def main() -> None:
    values = [9, 4, 7, 2, 6, 1, 3, 8, 5]
    merge_sort(values)
    print("sorted:", " ".join(str(value) for value in values))


if __name__ == "__main__":
    main()

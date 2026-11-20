"""AlgoViz reference implementation: quicksort.

Original code written for this repository under the MIT License.
Lomuto partition: <= pivot goes left, > pivot goes right.

Reading guide:
1. Partition the range around the last element as pivot.
2. Move values smaller than the pivot left and values greater than it right.
3. Place the pivot in its final slot and recurse on the two sides.

Complexity: O(n log n) average, O(n^2) worst; extra space O(log n) average recursion,
  O(n) worst.
Convention: Ranges are inclusive [low, high]; 0-based indices; the partition scheme is
  not stable.
"""

from __future__ import annotations


# Lomuto partition: <= pivot goes left, > pivot goes right, pivot returns at boundary + 1.
def partition(values: list[int], low: int, high: int) -> int:
    pivot = values[high]
    boundary = low - 1
    for index in range(low, high):
        if values[index] <= pivot:
            boundary += 1
            values[boundary], values[index] = values[index], values[boundary]
    values[boundary + 1], values[high] = values[high], values[boundary + 1]
    return boundary + 1


def quick_sort_range(values: list[int], low: int, high: int) -> None:
    if low >= high:
        return
    middle = partition(values, low, high)
    quick_sort_range(values, low, middle - 1)
    quick_sort_range(values, middle + 1, high)


def quick_sort(values: list[int]) -> None:
    quick_sort_range(values, 0, len(values) - 1)


def main() -> None:
    values = [5, 1, 4, 2, 8, 0, 3, 7, 6, 9]
    quick_sort(values)
    print("sorted:", " ".join(str(value) for value in values))

    empty: list[int] = []
    single = [42]
    quick_sort(empty)
    quick_sort(single)
    assert empty == []
    assert single == [42]
    print("empty:ok single:42")


if __name__ == "__main__":
    main()

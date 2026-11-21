"""AlgoViz reference implementation: Shell sort.

Gap insertion sort, halving the gap until the final gap-1 pass.

Reading guide:
1. Choose a decreasing gap sequence; each pass insertion-sorts the subsequences with
   that gap.
2. Elements far apart move early, reducing the work left for smaller gaps.
3. The final gap of 1 is ordinary insertion sort over the whole array.

Complexity: Time depends on the gap sequence; O(n^2) worst case, often subquadratic;
  extra space O(1).
Convention: Ascending order; gaps are positive; the implementation uses n/2, n/4, ... ,
  1.
"""

from __future__ import annotations


# Each gap pass insertion-sorts independent subsequences; gap 1 finishes the array.
# Each gap pass insertion-sorts independent subsequences; gap 1 is the final ordinary insertion sort.
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

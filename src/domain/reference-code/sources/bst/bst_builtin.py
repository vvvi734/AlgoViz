"""AlgoViz convenience implementation: sorted list with bisect.

bisect.insort keeps the list sorted after each insertion; membership
uses bisect_left. This is O(n) per insertion because list shifts.

Reading guide:
1. This convenience file keeps a sorted list and uses bisect for lookup/insertion.
2. bisect_left finds the insertion point in O(log n) comparisons.
3. insort shifts the tail of the list, so insertion is O(n) even though search is
   logarithmic.

Complexity: O(log n) search, O(n) insertion due to shifting; extra space O(n).
Convention: Unique keys in ascending order; duplicates are ignored before insertion.
"""

from __future__ import annotations

from bisect import bisect_left, insort


def main() -> None:
    tree: list[int] = []
    for key in [5, 2, 7, 1, 4, 6, 8, 3]:
        insort(tree, key)

    print("inorder:", tree)
    print("contains 4:", tree[bisect_left(tree, 4)] == 4)
    print("contains 9:", bisect_left(tree, 9) < len(tree) and tree[bisect_left(tree, 9)] == 9)

    tree.remove(5)
    print("after remove 5:", tree)


if __name__ == "__main__":
    main()

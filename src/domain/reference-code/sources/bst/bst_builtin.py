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
# 中文导读：用 Python 的 bisect 维护有序列表，演示与 BST 中序查找等价的语义。
# 阅读顺序：先看 insort 的插入位置，再看 bisect_left 的成员判断。
# 输入/输出：输入整数键序列；输出有序列表与查找结果。
# 不变量：列表始终保持升序；bisect_left 返回第一个不小于 key 的位置。
# 易错点：把 bisect 的 O(log n) 比较误当成整体 O(log n)；忽略 insort 的 O(n) 搬移。
# 复杂度：查找 O(log n) 比较，插入 O(n) 搬移，额外空间 O(n)。

from __future__ import annotations

from bisect import bisect_left, insort


# 作用：构造有序列表并演示插入、查找和删除。
def main() -> None:
    tree: list[int] = []
    for key in [5, 2, 7, 1, 4, 6, 8, 3]:
        # `insort` keeps the list ordered but shifts the tail, so insertion is O(n) even though search is O(log n).
        insort(tree, key)

    print("inorder:", tree)
    print("contains 4:", tree[bisect_left(tree, 4)] == 4)
    print("contains 9:", bisect_left(tree, 9) < len(tree) and tree[bisect_left(tree, 9)] == 9)

    tree.remove(5)
    print("after remove 5:", tree)


if __name__ == "__main__":
    main()

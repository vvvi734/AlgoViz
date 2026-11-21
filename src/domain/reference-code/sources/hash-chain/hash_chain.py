"""AlgoViz reference implementation: hash table with chained buckets.

Each bucket is a list of keys; collisions append to the same chain.

Reading guide:
1. Map a key to bucket key % table_size.
2. Each bucket is a chain of nodes holding colliding keys.
3. Insert rejects duplicates; search scans only the target bucket's chain.

Complexity: Expected time: O(1 + alpha) per operation, O(n) worst; extra space O(n +
  table_size).
Convention: Non-negative integer keys; table size is fixed at compile/construction time.
"""
# 中文导读：每个桶挂一条链，冲突键追加到同一桶；查找只扫描目标桶。
# 阅读顺序：先看 _index 取模，再看 insert 的重复检查和 contains 的桶内扫描。
# 输入/输出：输入非负整数键；插入返回是否成功，查找返回布尔值。
# 不变量：同一个键在表中至多出现一次；桶下标等于 key % 表长。
# 易错点：重复键未拒绝；桶数改变后旧下标失效。
# 复杂度：平均 O(1+α)，最坏 O(n)，额外空间 O(n+表长)。

from __future__ import annotations

TABLE_SIZE = 7


class HashTable:
    def __init__(self, size: int = TABLE_SIZE) -> None:
        self._buckets: list[list[int]] = [[] for _ in range(size)]

    def _index(self, key: int) -> int:
        return key % len(self._buckets)

    # Search the target bucket before appending; the chain holds only colliding keys.
    # Each bucket owns a chain; inserting at the bucket head is O(1), and duplicates are rejected before allocation.
    # Purpose: Insert key into its bucket; return False if it already exists, otherwise append and return True.
    # 作用：把 key 插入对应桶；已存在返回 False，否则追加并返回 True。
    def insert(self, key: int) -> bool:
        bucket = self._buckets[self._index(key)]
        if key in bucket:
            return False
        bucket.append(key)
        return True

    # Purpose: Check whether key exists in its target bucket.
    # 作用：判断 key 是否在目标桶中。
    def contains(self, key: int) -> bool:
        return key in self._buckets[self._index(key)]

    # Purpose: Return a copy of the bucket contents so callers cannot mutate the internal chain.
    # 作用：返回桶内容的副本，避免调用方直接改内部链。
    def buckets(self) -> list[list[int]]:
        return [list(bucket) for bucket in self._buckets]


def main() -> None:
    table = HashTable()
    for key in [15, 22, 8, 29, 36, 50]:
        table.insert(key)
    for index, bucket in enumerate(table.buckets()):
        print(f"[{index}]", " -> ".join(str(key) for key in bucket))
    print("contains 29:", table.contains(29))
    print("contains 7:", table.contains(7))
    assert table.buckets()[1] == [15, 22, 8, 29, 36, 50]


if __name__ == "__main__":
    main()

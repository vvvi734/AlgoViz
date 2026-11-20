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

from __future__ import annotations

TABLE_SIZE = 7


class HashTable:
    def __init__(self, size: int = TABLE_SIZE) -> None:
        self._buckets: list[list[int]] = [[] for _ in range(size)]

    def _index(self, key: int) -> int:
        return key % len(self._buckets)

    # Search the target bucket before appending; the chain holds only colliding keys.
    def insert(self, key: int) -> bool:
        bucket = self._buckets[self._index(key)]
        if key in bucket:
            return False
        bucket.append(key)
        return True

    def contains(self, key: int) -> bool:
        return key in self._buckets[self._index(key)]

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

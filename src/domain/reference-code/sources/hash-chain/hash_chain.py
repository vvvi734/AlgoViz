"""AlgoViz reference implementation: hash table with chained buckets.

Original code written for this repository under the MIT License.
Each bucket is a list of keys; collisions append to the same chain.
"""

from __future__ import annotations

TABLE_SIZE = 7


class HashTable:
    def __init__(self, size: int = TABLE_SIZE) -> None:
        self._buckets: list[list[int]] = [[] for _ in range(size)]

    def _index(self, key: int) -> int:
        return key % len(self._buckets)

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

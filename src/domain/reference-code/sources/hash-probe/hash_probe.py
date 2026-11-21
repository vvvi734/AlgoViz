"""AlgoViz reference implementation: linear probing hash table.

None marks an empty slot; insert and search probe forward with wraparound.

Reading guide:
1. Map a key to its home slot with key % table_size.
2. Linear probing scans forward modulo capacity until it finds the key or an empty slot.
3. Insert uses the first empty slot; search stops at an empty slot, which proves
   absence.

Complexity: Expected time: O(1 + 1/(1-alpha)) per operation, O(n) worst; extra space
  O(table_size).
Convention: Fixed-capacity open addressing; this teaching version has no deletion
  tombstones.
"""

from __future__ import annotations

EMPTY = -1


class HashTable:
    def __init__(self, size: int = 11) -> None:
        self._slots: list[int] = [EMPTY] * size

    def _index(self, key: int) -> int:
        return key % len(self._slots)

    # Probe forward modulo capacity; an empty slot both accepts an insert and proves absence.
    # This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
    def insert(self, key: int) -> bool:
        start = self._index(key)
        for step in range(len(self._slots)):
            index = (start + step) % len(self._slots)
            if self._slots[index] == EMPTY:
                self._slots[index] = key
                return True
            if self._slots[index] == key:
                return False
        return False

    def contains(self, key: int) -> bool:
        start = self._index(key)
        for step in range(len(self._slots)):
            index = (start + step) % len(self._slots)
            if self._slots[index] == EMPTY:
                return False
            if self._slots[index] == key:
                return True
        return False

    def slots(self) -> list[int]:
        return list(self._slots)


def main() -> None:
    table = HashTable()
    for key in [22, 11, 33, 44, 55]:
        table.insert(key)
    for index, value in enumerate(table.slots()):
        print(f"[{index}]", "_" if value == EMPTY else value)
    print("contains 44:", table.contains(44))
    print("contains 7:", table.contains(7))
    assert table.slots() == [22, 11, 33, 44, 55, -1, -1, -1, -1, -1, -1]


if __name__ == "__main__":
    main()

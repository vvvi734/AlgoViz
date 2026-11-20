"""AlgoViz reference implementation: sequential list.

Original code written for this repository under the MIT License.
A fixed-capacity list with manual shifting in insert and erase.

Reading guide:
1. Values occupy a contiguous array; length is the number of valid slots.
2. Insertion shifts [index, length) one slot right, then writes the new value.
3. Erasure shifts (index, length) one slot left and decreases length.

Complexity: O(n) insert/erase, O(1) indexed access; extra space O(capacity).
Convention: Valid element indices are 0..length-1; insertion also accepts index ==
  length; erasure returns the removed value.
"""

from __future__ import annotations


class SeqList:
    def __init__(self, capacity: int = 8) -> None:
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._items: list[int] = [0] * capacity
        self._size = 0

    def __len__(self) -> int:
        return self._size

    # Insert shifts [index, length) one slot right, then writes the new value.
    def insert(self, index: int, value: int) -> bool:
        if self._size == len(self._items) or not 0 <= index <= self._size:
            return False
        for i in range(self._size, index, -1):
            self._items[i] = self._items[i - 1]
        self._items[index] = value
        self._size += 1
        return True

    def erase(self, index: int) -> int | None:
        if not 0 <= index < self._size:
            return None
        removed = self._items[index]
        for i in range(index, self._size - 1):
            self._items[i] = self._items[i + 1]
        self._size -= 1
        return removed

    def to_list(self) -> list[int]:
        return self._items[: self._size]


def main() -> None:
    seq = SeqList()
    seq.insert(0, 1)
    seq.insert(1, 3)
    seq.insert(1, 2)
    seq.insert(3, 4)
    print("after inserts:", seq.to_list())
    print("removed:", seq.erase(1))
    print("after erase:", seq.to_list())
    print("insert at 9:", "ok" if seq.insert(9, 5) else "rejected")
    assert seq.to_list() == [1, 3, 4]


if __name__ == "__main__":
    main()

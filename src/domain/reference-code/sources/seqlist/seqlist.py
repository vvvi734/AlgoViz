"""AlgoViz reference implementation: sequential list.

A fixed-capacity list with manual shifting in insert and erase.

Reading guide:
1. Values occupy a contiguous array; length is the number of valid slots.
2. Insertion shifts [index, length) one slot right, then writes the new value.
3. Erasure shifts (index, length) one slot left and decreases length.

Complexity: O(n) insert/erase, O(1) indexed access; extra space O(capacity).
Convention: Valid element indices are 0..length-1; insertion also accepts index ==
  length; erasure returns the removed value.
"""
# 中文导读：用定长数组和 length 字段实现顺序表，插入时从尾部依次后移。
# 阅读顺序：先看 length 与 capacity 的区别，再看 insert 的后移方向和删除的前移方向。
# 输入/输出：输入容量与操作序列；输出顺序表内容。
# 不变量：0..length-1 是有效元素；length 等于容量时不能再插入。
# 易错点：后移方向写反覆盖元素；删除后忘记递减 length。
# 复杂度：访问 O(1)，插入/删除 O(n)，空间 O(capacity)。

from __future__ import annotations


class SeqList:
    def __init__(self, capacity: int = 8) -> None:
        # A non-positive capacity would make every insert fail and every erase index invalid, so reject it at construction.
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._items: list[int] = [0] * capacity
        self._size = 0

    def __len__(self) -> int:
        return self._size

    # Insert shifts [index, length) one slot right, then writes the new value.
    # `_size` is the live element count, not capacity; insert/erase shift only the live range and then update it.
    def insert(self, index: int, value: int) -> bool:
        # The chained bound accepts index == _size for append and rejects negative indices before any list access.
        if self._size == len(self._items) or not 0 <= index <= self._size:
            return False
        # range starts at _size and stops above index, so each assignment consumes a slot that was already copied.
        for i in range(self._size, index, -1):
            self._items[i] = self._items[i - 1]
        self._items[index] = value
        # The new value is visible before _size grows; no reader can treat an unwritten slot as live.
        self._size += 1
        return True

    def erase(self, index: int) -> int | None:
        if not 0 <= index < self._size:
            return None
        removed = self._items[index]
        # This loop touches pairs (i, i+1) inside the live prefix; the old last element is left beyond the new _size.
        for i in range(index, self._size - 1):
            self._items[i] = self._items[i + 1]
        self._size -= 1
        return removed

    def to_list(self) -> list[int]:
        # Slicing copies only the live prefix, so callers cannot mutate the backing capacity or see dead slots.
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

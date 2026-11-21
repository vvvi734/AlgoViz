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
# 中文导读：线性探测解决冲突：位置被占用就向后找第一个空槽；本教学版本不实现删除墓碑。
# 阅读顺序：先看 probe 的环形步进，再看 insert 的重复检查与 contains 的空槽终止。
# 输入/输出：输入非负整数键；插入返回是否成功，查找返回布尔值。
# 不变量：探测序列覆盖整张表；遇到 EMPTY 才能断定键不存在。
# 易错点：表满时无法插入；若加入删除，必须用墓碑而不能直接清空槽。
# 复杂度：平均 O(1/(1-α))，最坏 O(n)，额外空间 O(表长)。

from __future__ import annotations

EMPTY = -1


class HashTable:
    def __init__(self, size: int = 11) -> None:
        self._slots: list[int] = [EMPTY] * size

    def _index(self, key: int) -> int:
        return key % len(self._slots)

    # Probe forward modulo capacity; an empty slot both accepts an insert and proves absence.
    # This teaching version has no deletion, so an empty slot ends the probe; adding tombstones would require lookup to continue past them.
    # Purpose: Insert key by linear probing; return False for a duplicate key or a full table.
    # 作用：线性探测插入 key；重复键或表满返回 False。
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

    # Purpose: Search for key along the probe sequence and stop at EMPTY.
    # 作用：沿探测序列查找 key，遇到 EMPTY 停止。
    def contains(self, key: int) -> bool:
        start = self._index(key)
        for step in range(len(self._slots)):
            index = (start + step) % len(self._slots)
            if self._slots[index] == EMPTY:
                return False
            if self._slots[index] == key:
                return True
        return False

    # Purpose: Return a copy of the slot content to demonstrate empty and occupied states.
    # 作用：返回槽内容副本，便于演示空/占用状态。
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

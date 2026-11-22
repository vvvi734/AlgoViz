"""Static linked list — independent Python teaching implementation.

静态链表——独立 Python 教学实现。

The array owns every node. `data` stores the element and `cur` stores the
successor's index. `None` is this implementation's null cursor; many textbook
versions reserve slot 0 as a header, so index 0 must not be assumed to mean
“empty” in every convention.

Run: python3 static_linked_list.py
"""
# 中文导读：用数组下标代替指针，data 存值、cur 存后继下标，空闲结点单独串成 free 链。
# 阅读顺序：先看 head/free_head 两个入口，再看 insert 如何从 free 链借结点、delete 如何归还。
# 输入/输出：输入容量与初始值；插入/删除返回是否成功，遍历返回逻辑顺序。
# 不变量：head 链按逻辑顺序串接；free_head 链只包含空闲槽；两条链不交叉。
# 易错点：把数组下标当逻辑位置；删除后忘记把槽还给 free 链；free 链断链。
# 复杂度：插入/删除 O(n) 找前驱，空间 O(capacity)。

from __future__ import annotations


class StaticList:
    def __init__(self, capacity: int, values: list[int]) -> None:
        self.capacity = capacity
        self.data: list[int | None] = [None] * capacity
        self.cur: list[int | None] = [None] * capacity
        self.head: int | None = None
        self.free_head: int | None = None

        count = min(len(values), capacity)
        for index in range(count):
            self.data[index] = values[index]
            self.cur[index] = index + 1 if index + 1 < count else None
        self.head = 0 if count else None

        for index in range(count, capacity):
            self.cur[index] = index + 1 if index + 1 < capacity else None
        self.free_head = count if count < capacity else None

    # Follow cur from head; array order is not logical order.
    def _order(self) -> list[int]:
        order: list[int] = []
        current = self.head
        while current is not None:
            order.append(current)
            current = self.cur[current]
        return order

    def _predecessor(self, position: int) -> int | None:
        if position == 1:                 # 1-based logical position
            return None
        previous = self.head
        for _ in range(position - 2):
            previous = self.cur[previous]
        return previous

    # Purpose: Insert value at the 1-based logical position; return True on success.
    # 作用：在 1 基逻辑位置 position 插入 value；成功返回 True。
    def insert(self, position: int, value: int) -> bool:
        length = len(self._order())
        if position < 1 or position > length + 1:
            return False                  # invalid precondition
        if self.free_head is None:
            return False                  # capacity is exhausted

        fresh = self.free_head
        self.free_head = self.cur[fresh]  # borrow from the free chain
        self.data[fresh] = value
        self.cur[fresh] = None

        previous = self._predecessor(position)
        successor = self.cur[previous] if previous is not None else self.head

        # Keep the successor first, then redirect the predecessor.
        self.cur[fresh] = successor
        if previous is None:
            self.head = fresh
        else:
            self.cur[previous] = fresh
        return True

    # Purpose: Delete the node at 1-based logical position and return its slot to the free chain.
    # 作用：删除 1 基逻辑位置 position 的结点并把槽归还 free 链。
    def delete(self, position: int) -> int | None:
        length = len(self._order())
        if position < 1 or position > length:
            return None

        previous = self._predecessor(position)
        target = self.cur[previous] if previous is not None else self.head
        removed = self.data[target]
        successor = self.cur[target]

        # Unlink, then recycle the cell to the front of the free chain.
        if previous is None:
            self.head = successor
        else:
            self.cur[previous] = successor
        self.data[target] = None
        self.cur[target] = self.free_head
        self.free_head = target
        return removed

    # Purpose: Return the elements in logical order by following the head chain.
    # 作用：按 head 链返回逻辑顺序的元素列表。
    def traverse(self) -> list[int]:
        return [self.data[index] for index in self._order()]

    def dump(self, title: str) -> None:
        print(title)
        for index in range(self.capacity):
            print(f"  [{index}] data={self.data[index]!s:>4} cur={self.cur[index]!s:>4}")
        print(f"  head={self.head} freeHead={self.free_head}")
        print(f"  logical={self.traverse()}")


if __name__ == "__main__":
    demo = StaticList(8, [10, 20, 30])
    demo.dump("initial:")
    demo.insert(2, 25)
    demo.delete(3)
    demo.dump("after insert/delete:")

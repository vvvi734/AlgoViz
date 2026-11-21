"""AlgoViz reference implementation: doubly linked list.

Each node stores prev/next references; append and remove are O(1)
once the target node is known.

Reading guide:
1. Each node stores prev and next; the list keeps head and tail.
2. Appending links the new node after tail and updates tail.
3. Removing a known node patches its two neighbours; head/tail are fixed when necessary.
4. Forward traversal follows next; backward traversal follows prev.

Complexity: O(1) splice at a known node, O(n) search; extra space O(n).
Convention: NULL/None marks both ends; prev and next must stay mutually consistent.
"""
# 中文导读：用 prev/next 双向指针维护链表，删除已知结点时无需再找前驱。
# 阅读顺序：先看插入时四条指针的赋值顺序，再看删除时两侧指针的接回。
# 输入/输出：输入整数序列；输出正向和反向遍历结果。
# 不变量：任意结点满足 node.next.prev == node（首尾除外）。
# 易错点：先改 next 再保存后继导致断链；删除头/尾时未更新 head/tail。
# 复杂度：插入/删除 O(1)，查找 O(n)，空间 O(n)。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    prev: "Node | None" = None
    next: "Node | None" = None


class DoublyList:
    def __init__(self) -> None:
        self.head: Node | None = None
        self.tail: Node | None = None

    # Append wires prev and next first; only then does tail move to the new node.
    def append(self, value: int) -> Node:
        node = Node(value, prev=self.tail)
        if self.tail is None:
            self.head = node
        else:
            self.tail.next = node
        self.tail = node
        return node

    # Removal repairs both `prev` and `next`; removing the head or tail must also update the external head/tail pointer.
    def remove(self, node: Node) -> None:
        if node.prev is None:
            self.head = node.next
        else:
            node.prev.next = node.next
        if node.next is None:
            self.tail = node.prev
        else:
            node.next.prev = node.prev
        node.prev = None
        node.next = None

    def forward(self) -> list[int]:
        values: list[int] = []
        node = self.head
        while node is not None:
            values.append(node.value)
            node = node.next
        return values

    def backward(self) -> list[int]:
        values: list[int] = []
        node = self.tail
        while node is not None:
            values.append(node.value)
            node = node.prev
        return values


# Purpose: Build a doubly linked list and demonstrate insertion, deletion and traversal in both directions.
# 作用：构造双向链表并演示插入、删除和双向遍历。
def main() -> None:
    lst = DoublyList()
    lst.append(1)
    two = lst.append(2)
    lst.append(3)
    print("forward:", lst.forward())
    print("backward:", lst.backward())

    lst.remove(two)
    print("after remove 2:", lst.forward())
    print("tail prev:", lst.tail.prev.value)
    assert lst.forward() == [1, 3]
    assert lst.backward() == [3, 1]


if __name__ == "__main__":
    main()

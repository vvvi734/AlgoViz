"""AlgoViz reference implementation: circular singly linked list.

The tail node links back to the head, so traversal stops when it returns.

Reading guide:
1. The list keeps a tail pointer and tail->next points back to the head.
2. Appending inserts after tail and moves tail to the new node.
3. Traversal starts at head and stops when it returns to head; an empty list has tail ==
   NULL.

Complexity: O(1) append, O(n) traversal; extra space O(n).
Convention: There is no NULL terminator inside a non-empty list; emptiness is tail ==
  NULL.
"""
# 中文导读：用尾指针维护循环单链表，使头尾插入都能 O(1) 完成。
# 阅读顺序：先看 tail.next 指向头结点，再看插入/删除后尾指针的更新。
# 输入/输出：输入整数序列；输出循环链表的遍历结果。
# 不变量：tail 非空时 tail.next 是头结点；空表 tail 为 None。
# 易错点：删除唯一结点后忘记把 tail 置空；遍历没有在回到头结点时停止。
# 复杂度：插入/删除 O(1)，遍历 O(n)，空间 O(n)。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    next: "Node | None" = None


class CircularList:
    def __init__(self) -> None:
        self.head: Node | None = None
        self.tail: Node | None = None

    # New node points at head; the old tail points at the new node, preserving the ring.
    # The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
    def append(self, value: int) -> None:
        node = Node(value)
        if self.tail is None:
            node.next = node
            self.head = node
        else:
            node.next = self.head
            self.tail.next = node
        self.tail = node

    def to_list(self) -> list[int]:
        values: list[int] = []
        if self.head is None:
            return values
        node = self.head
        while True:
            values.append(node.value)
            assert node.next is not None
            node = node.next
            if node is self.head:
                return values


# 作用：构造循环链表并演示头插、尾插、删除和遍历。
def main() -> None:
    lst = CircularList()
    lst.append(1)
    lst.append(2)
    lst.append(3)
    print("circular:", lst.to_list())
    assert lst.tail is not None and lst.tail.next is lst.head
    print("tail->next:", lst.tail.next.value)


if __name__ == "__main__":
    main()

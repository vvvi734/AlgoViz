"""AlgoViz reference implementation: circular singly linked list.

The tail node links back to the head, so traversal stops when it returns.

Reading guide:
1. The list keeps a tail pointer and tail->next points back to the head.
2. Appending inserts after tail and moves tail to the new node.
3. Traversal starts at head and stops when it returns to head; an empty list has head ==
   tail == None.

Complexity: O(1) append, O(n) traversal; extra space O(n).
Convention: There is no None terminator inside a non-empty list; emptiness is
  head == tail == None.
"""
# 中文导读：用 head/tail 两个端点维护循环单链表；本实现只提供尾部追加和只读遍历，不包含头插或删除。
# 阅读顺序：先看空表如何用两个 None 表示；再看 append 的单结点自环与“先连边、后移尾指针”；最后看遍历怎样回到 head 才停。
# 输入/输出：main 固定追加 1、2、3，输出遍历列表，并断言 tail.next 指回 head。
# 不变量：tail 非空时 tail.next is head；空表 head 与 tail 都是 None；非空环中没有以 None 结尾的结点。
# 易错点：把空表当成已有结点而漏设 head；先移动 tail 再连边导致环断裂；用 while node is not None 遍历而陷入死循环。
# 复杂度：append 为 O(1)，遍历 O(n)，空间 O(n)；没有头插/删除操作，因此不宣称它们的 O(1) 复杂度。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    next: "Node | None" = None


# Nodes point to one another, so this ring is reclaimed by Python's cyclic garbage collector after the list becomes unreachable; there is no manual free step.
class CircularList:
    def __init__(self) -> None:
        self.head: Node | None = None
        # An empty ring has no node: both head and tail are None; neither points at a sentinel.
        self.tail: Node | None = None

    # 单结点时 tail 为空：让 node.next 指向自己，并同时设 head。非空时先把新结点接到
    # head，再让旧 tail 接到新结点，最后才移动 tail；顺序反过来会失去旧尾结点。
    # The tail's `next` points back to `head`, so traversal stops after returning to head, not at NULL.
    # Python allocation failure raises MemoryError; unlike the C/C++ demos, append has no false return value to check.
    def append(self, value: int) -> None:
        node = Node(value)
        if self.tail is None:
            # The first node points to itself: it is simultaneously head and tail, so the one-node ring is already closed.
            node.next = node
            self.head = node
        else:
            # Link the new node to the old head before changing the old tail; the old ring stays intact until this edge exists.
            node.next = self.head
            # Only now let the old tail point to the new node; then tail can move without losing the old tail.
            self.tail.next = node
        # Move tail last: after both links exist, the new node is the only node whose next points back to head.
        self.tail = node

    # 空环必须先返回，否则无法进入循环。`while True` 不是等 None：非空环没有 None，
    # 每次前进后与 head 比较，回到起点才说明正好走完一圈。断言只用于暴露损坏的链接。
    def to_list(self) -> list[int]:
        values: list[int] = []
        # Handle the empty ring before the loop: None means there is no first node, not a terminator inside a live ring.
        if self.head is None:
            return values
        node = self.head
        # The loop is not waiting for None: a non-empty ring has no None terminator, so it stops by comparing the advanced pointer with head.
        while True:
            values.append(node.value)
            # The assertion documents the link contract only; it does not create a None terminator or define the empty state.
            assert node.next is not None
            node = node.next
            if node is self.head:
                return values


# main 只演示三次尾部 append、一次只读遍历和一个环闭合断言；没有头插、删除或尾插分支。
# 断言在遍历之后检查 tail.next 是否回到 head，任何一次 append 漏掉 tail 更新都会在这里暴露。
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

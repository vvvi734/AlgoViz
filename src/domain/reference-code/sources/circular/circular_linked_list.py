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


class CircularList:
    def __init__(self) -> None:
        self.head: Node | None = None
        self.tail: Node | None = None

    # 单结点时 tail 为空：让 node.next 指向自己，并同时设 head。非空时先把新结点接到
    # head，再让旧 tail 接到新结点，最后才移动 tail；顺序反过来会失去旧尾结点。
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

    # 空环必须先返回，否则无法进入循环。`while True` 不是等 None：非空环没有 None，
    # 每次前进后与 head 比较，回到起点才说明正好走完一圈。断言只用于暴露损坏的链接。
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

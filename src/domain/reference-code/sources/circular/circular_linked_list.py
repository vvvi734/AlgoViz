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

"""AlgoViz reference implementation: doubly linked list.

Original code written for this repository under the MIT License.
Each node stores prev/next references; append and remove are O(1)
once the target node is known.
"""

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

    def append(self, value: int) -> Node:
        node = Node(value, prev=self.tail)
        if self.tail is None:
            self.head = node
        else:
            self.tail.next = node
        self.tail = node
        return node

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

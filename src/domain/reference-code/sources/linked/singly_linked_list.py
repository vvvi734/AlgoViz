"""AlgoViz reference implementation: singly linked list.

Based on this project's tested Python teaching implementation, with
teaching-only tracing calls removed. Released under the MIT License.
Algorithmic structure follows the classic textbook treatment in
Yan Weimin, Data Structures (C Language Edition), without copying text.
"""

from __future__ import annotations


class Node:
    def __init__(self, value: int) -> None:
        self.value = value
        self.next: Node | None = None


class SinglyLinkedList:
    def __init__(self) -> None:
        self.head: Node | None = None
        self.length = 0

    def insert_head(self, value: int) -> None:
        node = Node(value)
        node.next = self.head
        self.head = node
        self.length += 1

    def find_prev(self, target: Node | None) -> Node | None:
        """Return the node before target, or None for the head / a miss."""
        if self.head is None or target is None or target is self.head:
            return None
        prev = self.head
        while prev.next is not None and prev.next is not target:
            prev = prev.next
        return prev if prev.next is target else None

    def insert_after(self, prev: Node | None, value: int) -> bool:
        if prev is None:
            return False
        node = Node(value)
        # Point the new node at the old successor before relinking prev.
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def remove(self, value: int) -> bool:
        prev: Node | None = None
        current = self.head
        while current is not None and current.value != value:
            prev = current
            current = current.next
        if current is None:
            return False
        if prev is None:
            self.head = current.next
        else:
            prev.next = current.next
        self.length -= 1
        return True

    def traverse(self) -> list[int]:
        values: list[int] = []
        current = self.head
        while current is not None:
            values.append(current.value)
            current = current.next
        return values


def main() -> None:
    linked = SinglyLinkedList()
    linked.insert_head(5)
    linked.insert_head(8)
    linked.insert_head(3)

    target = linked.head.next if linked.head is not None else None
    prev = linked.find_prev(target)
    linked.insert_after(prev, 6)
    linked.remove(8)

    print("list:", " ".join(str(value) for value in linked.traverse()))
    print(f"length={linked.length}")


if __name__ == "__main__":
    main()

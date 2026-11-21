"""AlgoViz reference implementation: singly linked list.

Reading guide:
1. A node stores one value and one next pointer; the list owns a head pointer and a
   length.
2. Head insertion links the new node before the old head, then updates head and length.
3. Insertion/removal after a known node rewires next pointers; search first finds that
   predecessor.
4. Traversal follows next until NULL; clear frees every node and resets the list.

Complexity: O(1) head insertion, O(n) search/delete; extra space O(n).
Convention: NULL terminates the list; node positions are 0-based when printed.
"""
# 中文导读：用 next 指针串联结点，演示头插、尾插、按值删除和遍历。
# 阅读顺序：先看 head 的更新，再看删除时前驱的 next 如何跨过目标结点。
# 输入/输出：输入整数序列；输出链表遍历结果。
# 不变量：head 指向首结点；尾结点的 next 为 None。
# 易错点：删除头结点时丢失 head；遍历时提前移动指针导致断链。
# 复杂度：插入/删除 O(1)（已知位置），查找 O(n)，空间 O(n)。

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
        # Point the new node at the old head before reassigning self.head.
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
        # A None predecessor means the insertion point is unknown, so reject the request instead of dereferencing it.
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


# Purpose: Build a singly linked list and demonstrate insertion, deletion and traversal.
# 作用：构造单链表并演示插入、删除和遍历。
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

"""AlgoViz reference implementation: level-order traversal with collections.deque.

Original code written for this repository under the MIT License.
This convenience file adds the queue-based fourth traversal alongside the
recursive preorder/inorder/postorder reference implementation.

Reading guide:
1. Put the root at the left end of the deque.
2. popleft() the front, visit it, then append its left child and right child.
3. Repeat until the deque is empty; FIFO gives top-to-bottom, left-to-right order.

Complexity: O(n) time; extra space O(w), where w is the maximum level width
(O(n) worst case). Convention: None is an empty subtree.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


def level_order(root: Node | None) -> list[int]:
    if root is None:
        return []

    pending: deque[Node] = deque([root])
    output: list[int] = []

    while pending:
        node = pending.popleft()
        output.append(node.value)
        if node.left is not None:
            pending.append(node.left)
        if node.right is not None:
            pending.append(node.right)

    return output


def main() -> None:
    root = Node(
        4,
        Node(2, Node(1), Node(3)),
        Node(6),
    )
    print("level order:", level_order(root))
    print("empty:", level_order(None))
    assert level_order(root) == [4, 2, 6, 1, 3]
    assert level_order(None) == []


if __name__ == "__main__":
    main()

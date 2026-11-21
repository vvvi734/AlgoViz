"""AlgoViz reference implementation: level-order traversal with collections.deque.

This convenience file adds the queue-based fourth traversal alongside the
recursive preorder/inorder/postorder reference implementation.

Reading guide:
1. Put the root at the left end of the deque.
2. popleft() the front, visit it, then append its left child and right child.
3. Repeat until the deque is empty; FIFO gives top-to-bottom, left-to-right order.

Complexity: O(n) time; extra space O(w), where w is the maximum level width
(O(n) worst case). Convention: None is an empty subtree.
"""
# 中文导读：用 deque 作为 FIFO 队列实现层序遍历，按层输出结点。
# 阅读顺序：先看根入队，再看出队后左右孩子入队的顺序。
# 输入/输出：输入二叉树根；返回层序列表。
# 不变量：队列中结点的入队顺序就是它们的层序。
# 易错点：用 list.pop(0) 导致 O(n) 搬移；空树未返回空列表。
# 复杂度：O(n)，额外空间 O(w)，w 为最大层宽。

from __future__ import annotations

from collections import deque
from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


# `deque.popleft()` is O(1); a list pop(0) would shift every remaining element.
# Purpose: Return the level-order traversal; an empty tree returns an empty list.
# 作用：返回层序遍历结果；空树返回空列表。
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


# Purpose: Build a demo tree and print its level-order sequence.
# 作用：构造演示树并打印层序序列。
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

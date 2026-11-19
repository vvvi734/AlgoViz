"""AlgoViz reference implementation: inorder traversal.

Original code written for this repository under the MIT License.
Visits left subtree, root, then right subtree; the result is sorted
for a binary search tree.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


def inorder(node: Node | None, output: list[int]) -> None:
    if node is None:
        return
    inorder(node.left, output)
    output.append(node.value)
    inorder(node.right, output)


def main() -> None:
    root = Node(
        4,
        Node(2, Node(1), Node(3)),
        Node(6, Node(5), Node(7)),
    )
    output: list[int] = []
    inorder(root, output)
    print("inorder:", output)
    empty: list[int] = []
    inorder(None, empty)
    print("empty:", empty)
    assert output == [1, 2, 3, 4, 5, 6, 7]


if __name__ == "__main__":
    main()

"""AlgoViz reference implementation: binary search tree.

Insert, search, remove and inorder traversal for unique integer keys.

Reading guide:
1. Invariant: every left key is smaller and every right key is larger than the node.
2. Insert/search descend exactly one branch per level.
3. Removal has three cases: leaf, one child, or two children replaced by the inorder
   successor.

Complexity: O(h) per operation, O(log n) average and O(n) worst; extra space O(h)
  recursion.
Convention: Keys are unique integers; the inorder traversal is the sorted key sequence.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


# Descend one branch by key comparison; duplicates are ignored by the insert contract.
def insert(root: Node | None, value: int) -> Node:
    if root is None:
        return Node(value)
    if value < root.value:
        root.left = insert(root.left, value)
    elif value > root.value:
        root.right = insert(root.right, value)
    return root


def contains(root: Node | None, value: int) -> bool:
    node = root
    while node is not None:
        if value == node.value:
            return True
        node = node.left if value < node.value else node.right
    return False


def minimum(node: Node) -> Node:
    while node.left is not None:
        node = node.left
    return node


def remove(root: Node | None, value: int) -> Node | None:
    if root is None:
        return None
    if value < root.value:
        root.left = remove(root.left, value)
    elif value > root.value:
        root.right = remove(root.right, value)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        successor = minimum(root.right)
        root.value = successor.value
        root.right = remove(root.right, successor.value)
    return root


def inorder(root: Node | None, output: list[int]) -> None:
    if root is None:
        return
    inorder(root.left, output)
    output.append(root.value)
    inorder(root.right, output)


def main() -> None:
    root: Node | None = None
    for key in [5, 2, 7, 1, 4, 6, 8, 3]:
        root = insert(root, key)

    output: list[int] = []
    inorder(root, output)
    print("inorder:", output)
    print("contains 4:", contains(root, 4))
    print("contains 9:", contains(root, 9))

    root = remove(root, 5)
    output = []
    inorder(root, output)
    print("after remove 5:", output)
    assert root is not None and root.value == 6
    assert output == [1, 2, 3, 4, 6, 7, 8]


if __name__ == "__main__":
    main()

"""AlgoViz reference implementation: AVL tree.

Original code written for this repository under the MIT License.
Height-balanced BST with LL, RR, LR and RL rotations on insert.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    height: int = 1
    left: "Node | None" = None
    right: "Node | None" = None


def height(node: Node | None) -> int:
    return node.height if node is not None else 0


def update_height(node: Node) -> None:
    node.height = 1 + max(height(node.left), height(node.right))


def balance_factor(node: Node | None) -> int:
    return height(node.left) - height(node.right) if node is not None else 0


def rotate_right(y: Node) -> Node:
    x = y.left
    assert x is not None
    middle = x.right
    x.right = y
    y.left = middle
    update_height(y)
    update_height(x)
    return x


def rotate_left(x: Node) -> Node:
    y = x.right
    assert y is not None
    middle = y.left
    y.left = x
    x.right = middle
    update_height(x)
    update_height(y)
    return y


def balance(node: Node) -> Node:
    update_height(node)
    factor = balance_factor(node)
    if factor > 1:
        assert node.left is not None
        if balance_factor(node.left) < 0:
            node.left = rotate_left(node.left)
        return rotate_right(node)
    if factor < -1:
        assert node.right is not None
        if balance_factor(node.right) > 0:
            node.right = rotate_right(node.right)
        return rotate_left(node)
    return node


def insert(node: Node | None, value: int) -> Node:
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    else:
        return node
    return balance(node)


def inorder(node: Node | None, output: list[int]) -> None:
    if node is None:
        return
    inorder(node.left, output)
    output.append(node.value)
    inorder(node.right, output)


def main() -> None:
    root: Node | None = None
    for key in [30, 20, 10, 25, 27, 5]:
        root = insert(root, key)

    output: list[int] = []
    inorder(root, output)
    print("inorder:", output)
    assert root is not None
    print("root:", root.value, "height:", root.height)
    assert output == [5, 10, 20, 25, 27, 30]
    assert abs(balance_factor(root)) <= 1


if __name__ == "__main__":
    main()

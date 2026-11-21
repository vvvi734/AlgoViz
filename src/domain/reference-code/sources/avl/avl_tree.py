"""AlgoViz reference implementation: AVL tree.

Height-balanced BST with LL, RR, LR and RL rotations on insert.

Reading guide:
1. Each node stores its height; the balance factor is height(left) - height(right).
2. Insert like a BST, then recompute heights while recursion unwinds.
3. If the balance factor leaves {-1, 0, 1}, apply LL, RR, LR or RL rotations.

Complexity: O(log n) for insert/search; extra space O(h) = O(log n) recursion.
Convention: Height of an empty subtree is 0; duplicate keys are ignored.
"""
# 中文导读：在二叉搜索树上维护结点高度，用 LL/RR/LR/RL 四种旋转把平衡因子控制在 -1、0、1。
# 阅读顺序：先看 Node.height，再看 height()/balance_factor() 如何由子树高度算出，最后跟 insert() 的递归返回路径看旋转。
# 输入/输出：输入整数键；输出中序升序序列；重复键被忽略。
# 不变量：任意结点的左右子树高度差只能是 -1、0、1，且中序序列始终有序。
# 易错点：旋转后漏更新高度；LR/RL 只做单旋；把空子树高度当成 1。
# 复杂度：查找/插入 O(log n)，单次旋转 O(1)，额外空间 O(n)。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    height: int = 1
    left: "Node | None" = None
    right: "Node | None" = None


# 作用：返回子树高度；空子树为 0，无副作用。
def height(node: Node | None) -> int:
    return node.height if node is not None else 0


# 作用：由左右子树高度重算 node.height；旋转后必须调用。
def update_height(node: Node) -> None:
    node.height = 1 + max(height(node.left), height(node.right))


# 作用：返回左子树高度减右子树高度；空结点为 0。
def balance_factor(node: Node | None) -> int:
    return height(node.left) - height(node.right) if node is not None else 0


# 作用：以 y 为轴右旋，返回新的子树根，并更新受影响结点高度。
def rotate_right(y: Node) -> Node:
    x = y.left
    assert x is not None
    middle = x.right
    x.right = y
    y.left = middle
    update_height(y)
    update_height(x)
    return x


# 作用：以 x 为轴左旋，返回新的子树根，并更新受影响结点高度。
def rotate_left(x: Node) -> Node:
    y = x.right
    assert y is not None
    middle = y.left
    y.left = x
    x.right = middle
    update_height(x)
    update_height(y)
    return y


# Recompute height after insertion, then apply LL/RR/LR/RL if balance leaves {-1, 0, 1}.
# 作用：重算高度并按 LL/RR/LR/RL 修复失衡，返回新的子树根。
def balance(node: Node) -> Node:
    update_height(node)
    # The balance factor is height(left) - height(right); values outside {-1, 0, 1} need rotation.
    factor = balance_factor(node)
    if factor > 1:
        assert node.left is not None
        if balance_factor(node.left) < 0:
            # A negative left-child factor means LR: rotate the child left before rotating the root right.
            node.left = rotate_left(node.left)
        return rotate_right(node)
    if factor < -1:
        assert node.right is not None
        if balance_factor(node.right) > 0:
            node.right = rotate_right(node.right)
        return rotate_left(node)
    return node


# 作用：按 BST 规则插入 value，回溯时重新平衡；返回新的子树根，重复键原样返回。
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


# 作用：中序遍历子树，把键依次追加到 output；只读。
def inorder(node: Node | None, output: list[int]) -> None:
    if node is None:
        return
    inorder(node.left, output)
    output.append(node.value)
    inorder(node.right, output)


# 作用：构造演示 AVL 树并打印中序序列。
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

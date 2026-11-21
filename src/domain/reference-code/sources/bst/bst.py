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
# 中文导读：实现不存重复键的二叉搜索树，插入、查找、删除都沿一条根到叶的路径完成。
# 阅读顺序：先看 insert 的递归落点，再看 remove 对 0/1/2 个孩子的处理。
# 输入/输出：输入整数键；输出中序升序序列；删除不存在的键时树不变。
# 不变量：左子树键 < 根键 < 右子树键；重复键被拒绝。
# 易错点：删除双孩子结点时直接断开；递归返回值没有接回父指针。
# 复杂度：平均 O(log n)，最坏 O(n)，额外空间 O(h)。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


# Descend one branch by key comparison; duplicates are ignored by the insert contract.
# BST invariant: left keys < root < right keys; duplicates are rejected, so search follows one path.
# Purpose: Insert value and return the new subtree root; leave duplicate keys unchanged.
# 作用：插入 value 并返回新的子树根；重复键原样返回。
def insert(root: Node | None, value: int) -> Node:
    if root is None:
        return Node(value)
    if value < root.value:
        root.left = insert(root.left, value)
    elif value > root.value:
        root.right = insert(root.right, value)
    return root


# Purpose: Check whether value exists in the tree; read-only.
# 作用：判断 value 是否在树中；只读。
def contains(root: Node | None, value: int) -> bool:
    node = root
    while node is not None:
        if value == node.value:
            return True
        node = node.left if value < node.value else node.right
    return False


# Purpose: Return the node holding the smallest key in the subtree; the caller guarantees node is non-null.
# 作用：返回子树中最小键所在结点；调用方保证 node 非空。
def minimum(node: Node) -> Node:
    while node.left is not None:
        node = node.left
    return node


# Purpose: Delete value and return the new subtree root; return the tree unchanged when value is absent.
# 作用：删除 value 并返回新的子树根；不存在时原样返回。
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


# Purpose: Inorder traversal that appends to output; read-only.
# 作用：中序遍历并追加到 output；只读。
def inorder(root: Node | None, output: list[int]) -> None:
    if root is None:
        return
    inorder(root.left, output)
    output.append(root.value)
    inorder(root.right, output)


# Purpose: Build a demo BST and print its inorder, search and deletion results.
# 作用：构造演示 BST 并打印中序、查找和删除结果。
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

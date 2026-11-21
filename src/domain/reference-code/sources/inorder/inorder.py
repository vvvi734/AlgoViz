"""AlgoViz reference implementation: inorder traversal.

Visits left subtree, root, then right subtree; the result is sorted
for a binary search tree.

Reading guide:
1. Recurse into the left subtree.
2. Visit the current node.
3. Recurse into the right subtree; a BST therefore yields ascending keys.

Complexity: O(n); extra space O(h) recursion, where h is the tree height.
Convention: NULL/None is an empty subtree; output is emitted in visit order.
"""
# 中文导读：递归实现二叉树中序遍历：左子树、根、右子树。
# 阅读顺序：先看递归出口，再看三次访问的先后顺序。
# 输入/输出：输入二叉树根；输出中序序列。
# 不变量：对 BST 而言，中序序列严格升序。
# 易错点：把根结点访问放在左递归之前；空结点未直接返回。
# 复杂度：O(n)，递归空间 O(h)。

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Node:
    value: int
    left: "Node | None" = None
    right: "Node | None" = None


# Left subtree, then node, then right subtree; a BST yields ascending keys.
# Recurse left, visit the root, then recurse right; for a BST this emits keys in ascending order.
# 作用：中序遍历子树并把键追加到 output；只读。
def inorder(node: Node | None, output: list[int]) -> None:
    if node is None:
        return
    inorder(node.left, output)
    output.append(node.value)
    inorder(node.right, output)


# 作用：构造演示 BST 并打印中序序列。
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

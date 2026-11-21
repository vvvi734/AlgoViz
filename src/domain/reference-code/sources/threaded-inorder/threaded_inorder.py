"""线索二叉树的中序线索化与线索遍历 — AlgoViz Python 参考实现。

中文导读：普通二叉树的 n 个结点有 n+1 个空指针。这里不新增结点，而是把
空左指针改写成指向前驱的线索，把空右指针改写成指向后继的线索，并用
ltag / rtag 区分“真实孩子”与“线索”。线索建好后，中序遍历不再需要递归栈。

阅读顺序：先看 `Node` 的四个指针/标志字段，再看 `thread_inorder` 如何按
“左 → 根 → 右”写入前驱与后继，最后看 `inorder_by_threads` 如何只靠当前
指针走完整棵树。

输入输出：`build_tree` 接收层序数组，`None` 表示空位；返回根结点或 None。
`inorder_by_threads` 返回中序值列表，顺序与递归中序完全一致。

关键不变量：
1. tag=0 时 left / right 必须指向真实孩子；tag=1 时它们只是线索字段的副本，
   真实孩子为空。
2. 每个结点最多有一个父结点，树中不存在环。
3. 中序第一个结点的左线索为空，最后一个结点的右线索为空，但两者的 tag
   都仍然是 1。
"""

from __future__ import annotations

# Thread null left pointers into predecessors and null right pointers into successors.


class Node:
    """二叉树结点，额外保存线索与两个标志位。"""

    def __init__(self, value: int) -> None:
        self.value = value
        self.left: Node | None = None
        self.right: Node | None = None
        self.ltag = 0
        self.rtag = 0
        self.left_thread: Node | None = None
        self.right_thread: Node | None = None

    def __repr__(self) -> str:
        return f"Node({self.value})"


def build_tree(values: list[int | None]) -> Node | None:
    """按层序数组建树，下标 i 的孩子候选是 2i+1 与 2i+2。"""
    if not values or values[0] is None:
        return None

    nodes = [Node(value) if value is not None else None for value in values]
    for index, node in enumerate(nodes):
        if node is None:
            continue
        left_index = index * 2 + 1
        right_index = index * 2 + 2
        if left_index < len(nodes):
            node.left = nodes[left_index]
        if right_index < len(nodes):
            node.right = nodes[right_index]
    return nodes[0]


def thread_inorder(root: Node | None) -> Node | None:
    """就地完成中序线索化，返回中序最后一个结点。

    递归顺序必须是“左子树 → 当前结点 → 右子树”，否则前驱/后继会错位。
    这里用一个列表保存 PRE，避免在嵌套函数里声明 nonlocal。
    """
    pre: list[Node | None] = [None]
    last: list[Node | None] = [None]

    def walk(node: Node | None) -> None:
        if node is None:
            return

        # 左子树必须先完成，这样 PRE 才是当前结点的中序前驱。
        walk(node.left)

        if node.left is None:
            # 空左指针改造成前驱线索，tag 单独保存，真实 left 仍是 None。
            node.ltag = 1
            node.left_thread = pre[0]
        if pre[0] is not None and pre[0].right is None:
            # 前驱的右指针为空，当前结点正好是它的中序后继。
            pre[0].rtag = 1
            pre[0].right_thread = node

        pre[0] = node
        last[0] = node
        walk(node.right)

    walk(root)

    # 中序最后一个结点没有后继，但它的右指针仍应标记为线索。
    if last[0] is not None and last[0].right is None:
        last[0].rtag = 1
        last[0].right_thread = None
    return last[0]


def leftmost(node: Node | None) -> Node | None:
    """沿真实左孩子下降到最左结点；ltag=1 表示左边已是线索，停止。"""
    while node is not None and node.ltag == 0:
        node = node.left
    return node


def inorder_by_threads(root: Node | None) -> list[int]:
    """不使用递归栈的中序遍历，额外空间 O(1)。"""
    result: list[int] = []
    node = leftmost(root)
    while node is not None:
        result.append(node.value)

        if node.rtag == 1:
            # 右指针是线索，直接跳到中序后继；后继为空表示遍历结束。
            node = node.right_thread
        else:
            # 右指针是真实孩子，后继是右子树的最左结点。
            node = leftmost(node.right)
    return result


def inorder_recursive(root: Node | None, out: list[int]) -> None:
    """递归中序，仅用于核对线索遍历的结果。"""
    if root is None:
        return
    inorder_recursive(root.left, out)
    out.append(root.value)
    inorder_recursive(root.right, out)


if __name__ == "__main__":
    sample = [4, 2, 6, 1, 3]
    root = build_tree(sample)
    last = thread_inorder(root)
    print(f"tagged pointers = {sum(node.ltag + node.rtag for node in [root, root.left, root.right, root.left.left, root.left.right])}")
    print(f"last inorder node = {last}")
    print(f"threaded inorder = {inorder_by_threads(root)}")

    recursive: list[int] = []
    inorder_recursive(root, recursive)
    print(f"recursive inorder = {recursive}")
    print(f"same result = {recursive == inorder_by_threads(root)}")

# Threaded binary tree: in-order threading and traversal in Python 3.
# A tree with n nodes has n+1 null links. This implementation keeps child links
# untouched and stores predecessor/successor in separate left_thread/right_thread
# fields; ltag/rtag only say whether that thread field is valid. After threading,
# in-order traversal needs no recursion stack. Time O(n), extra space O(1).
"""线索二叉树的中序线索化与线索遍历 — AlgoViz Python 参考实现。

中文导读：普通二叉树的 n 个结点有 n+1 个空指针。本实现不覆盖真实孩子指针，
而是额外保存 left_thread / right_thread 两个线索字段；空 left / right 仍为
None，由 ltag / rtag 标记线索是否有效。线索建好后，中序遍历不再需要递归栈。

阅读顺序：先看 `Node` 的四个指针/标志字段，再看 `thread_inorder` 如何按
“左 → 根 → 右”写入前驱与后继，最后看 `inorder_by_threads` 如何只靠当前
指针走完整棵树。

输入输出：`build_tree` 接收层序数组，`None` 表示空位；返回根结点或 None。
`inorder_by_threads` 返回中序值列表，顺序与递归中序完全一致。

关键不变量：
1. tag=0 时 left / right 必须指向真实孩子；tag=1 时 left / right 为 None，
   前驱 / 后继分别保存在 left_thread / right_thread。
2. 每个结点最多有一个父结点，树中不存在环。
3. 中序第一个结点的左线索为空，最后一个结点的右线索为空，但两者的 tag
   都仍然是 1。
"""

from __future__ import annotations


# A node keeps real child links and thread fields separate; only the tags decide whether a thread field is valid.
class Node:
    """二叉树结点，额外保存线索与两个标志位。"""

    def __init__(self, value: int) -> None:
        self.value = value
        self.left: Node | None = None
        self.right: Node | None = None
        self.ltag = 0
        self.rtag = 0
        # Threads are separate from real child links. The tag, not the pointer's truthiness alone, decides whether left_thread/right_thread is valid.
        self.left_thread: Node | None = None
        self.right_thread: Node | None = None

    def __repr__(self) -> str:
        return f"Node({self.value})"


# Level-order indices are only a demo construction rule; the real shape is still determined by the child links that build_tree assigns.
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


# The nested walk updates PRE exactly in in-order order, so one shared pointer is enough; last records the tail for the final empty-thread patch.
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

        walk(node.left)

        # A missing real left child is the slot that stores the predecessor. For the first in-order node PRE is None, which is the correct no-predecessor thread.
        if node.left is None:
            node.ltag = 1
            node.left_thread = pre[0]
        # The current node is the predecessor's successor only when the predecessor has no real right child. If pre[0].right exists, the successor lies in that subtree.
        if pre[0] is not None and pre[0].right is None:
            pre[0].rtag = 1
            pre[0].right_thread = node

        # Advance PRE after both links. The next node must treat this node as its predecessor, while this node's own successor may be linked during the next visit.
        pre[0] = node
        last[0] = node
        walk(node.right)

    walk(root)

    # The in-order tail has no successor, yet its right pointer is still a thread. Marking rtag=1 with None records an intentional empty successor.
    if last[0] is not None and last[0].right is None:
        last[0].rtag = 1
        last[0].right_thread = None
    return last[0]


# The loop descends only while ltag==0; the first tagged link marks this subtree's first in-order node, exactly where the walk must start.
def leftmost(node: Node | None) -> Node | None:
    """沿真实左孩子下降到最左结点；ltag=1 表示左边已是线索，停止。"""
    while node is not None and node.ltag == 0:
        node = node.left
    return node


# Each iteration follows either a successor thread or the leftmost node of a real right subtree, so no recursion stack is needed.
def inorder_by_threads(root: Node | None) -> list[int]:
    """不使用递归栈的中序遍历，额外空间 O(1)。"""
    result: list[int] = []
    node = leftmost(root)
    while node is not None:
        result.append(node.value)

        # A right thread is already the successor. With rtag==0, right is a real subtree, so the walk must descend to its leftmost node.
        if node.rtag == 1:
            node = node.right_thread
        else:
            node = leftmost(node.right)
    return result


# This recursive walk is an oracle: it follows real children only and never reads the threads it is checking.
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

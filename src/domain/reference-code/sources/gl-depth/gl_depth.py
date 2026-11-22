# Generalized-list depth in Python 3.
# `tag` separates atoms from sublists. An atom stores text in `atom`; a sublist
# stores its first child in `head`, and `next` links siblings at the same level.
# Depth is 0 for an atom, 1 for an empty list, and 1 + the maximum child depth.
# Time O(n), recursion space O(h).
"""AlgoViz 参考代码 · 广义表深度 · Python 3
原理实现

中文导读：GLNode 用 tag 区分原子与子表。原子把值放在 atom，子表的首元素
放在 head；next 永远连接同层的下一个元素，不是二叉树右孩子。gl_depth
只沿 head 进入子表，沿 next 遍历同层兄弟。

阅读顺序：先看 GLNode 的字段和 make_* 构造函数，再看 gl_depth 的两个终止
条件与 children 循环，最后看 build_demo 构造的 (a,(b,c),((d),e))。

深度约定：原子 0；空表 () 1；非空表 = 1 + 子表最大深度。

输入输出：示例树在 build_demo 中手工构造，不解析外部表达式；gl_depth
接收当前表节点并返回整数深度。None 仅作防御性返回 0，不是合法广义表。

关键不变量：tag == "atom" 时 head 必为 None；tag == "list" 时 atom 必为
None；空表节点真实存在，只是 head == None；next 不跨越层级。

易错点：空表深度写成 0；多个子表深度求和；把 next 当孩子；把空表直接
写成 None 而丢掉 () 这一元素。

复杂度：时间 O(n)，递归栈 O(h)，n 为节点总数，h 为最大嵌套层数。
"""

from __future__ import annotations


# Purpose: A node stores its tag plus either an atom value or a child head.
class GLNode:
    """广义表节点：原子或子表，next 指向同层后继。"""

    __slots__ = ("tag", "atom", "head", "next")

    def __init__(self, tag: str, atom: str | None = None) -> None:
        self.tag = tag
        self.atom = atom
        self.head: GLNode | None = None
        self.next: GLNode | None = None


# Purpose: Construct an atom node; the caller keeps text within the length limit.
def make_atom(text: str) -> GLNode:
    """构造原子节点；text 由调用方保证长度不超过 8。"""
    return GLNode("atom", text)


# Purpose: Construct an empty list node; head is None, but () is a real node.
def make_list() -> GLNode:
    """构造空表节点；head 为空但节点本身代表真实的 ()。"""
    return GLNode("list")


# Purpose: Append child to the sibling chain; this function owns child.next.
def append_child(parent: GLNode, child: GLNode) -> None:
    """把 child 追加到 parent 同层链尾；child.next 由这里接好。"""
    if parent.tag != "list":
        raise ValueError("only a list node can take children")
    if parent.head is None:
        parent.head = child
        return
    tail = parent.head
    while tail.next is not None:
        tail = tail.next
    tail.next = child


# Purpose: Return 0 for an atom, 1 for (), or 1 + the maximum child depth.
def gl_depth(node: GLNode | None) -> int:
    """返回广义表深度：原子 0，空表 1，非空表 1 + 最大子深度。"""
    if node is None:
        return 0
    if node.tag == "atom":
        return 0
    # A list node with head None is the real empty list (), which still counts as one layer. A missing node is different and was handled by the None check above.
    if node.head is None:
        return 1
    # best is safe to start at 0 only because the empty-list case has already returned; every non-empty child must provide a depth to compare.
    best = 0
    child = node.head
    while child is not None:
        # Siblings are alternatives, so take the maximum child depth, not the sum.
        # Recursive descent follows head into one child, while `child = child.next` walks siblings. Those two links represent different levels and must not be mixed.
        child_depth = gl_depth(child)
        if child_depth > best:
            best = child_depth
        child = child.next
    # The current list adds one bracket layer; the maximum child depth is used, so sibling alternatives do not add extra levels.
    return best + 1


# Purpose: Render the list in parenthesized form for demo verification only.
def format_gl(node: GLNode | None) -> str:
    """输出无空格的括号表达式，仅用于核对示例。"""
    if node is None:
        return ""
    # An atom has no child head and no parentheses layer, so its depth is 0; treating it as a list would read the wrong representation.
    if node.tag == "atom":
        return node.atom or ""
    parts: list[str] = []
    child = node.head
    while child is not None:
        parts.append(format_gl(child))
        child = child.next
    return "(" + ",".join(parts) + ")"


# Purpose: Build (a,(b,c),((d),e)) for the demo.
def build_demo() -> GLNode:
    """构造 (a,(b,c),((d),e))，其中 ((d),e) 是第三棵子表。"""
    root = make_list()
    bc = make_list()
    de = make_list()
    inner_d = make_list()
    append_child(bc, make_atom("b"))
    append_child(bc, make_atom("c"))
    append_child(inner_d, make_atom("d"))
    append_child(de, inner_d)
    append_child(de, make_atom("e"))
    append_child(root, make_atom("a"))
    append_child(root, bc)
    append_child(root, de)
    return root


if __name__ == "__main__":
    demo = build_demo()
    print("expression =", format_gl(demo))
    print("depth =", gl_depth(demo))
    print("empty depth =", gl_depth(make_list()))
    nested_empty = make_list()
    append_child(nested_empty, make_list())
    print("nested empty depth =", gl_depth(nested_empty))

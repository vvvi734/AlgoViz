# Generalized-list copy in Python 3.
# Every source node gets a fresh node, so the copy owns its own subtree and
# never shares list/tuple objects with the source. `copy_gl` copies the current
# node and its `head` chain but not its `next` sibling; the caller links it.
# Time O(n), new tree O(n), recursion space O(h).
"""AlgoViz 参考代码 · 广义表复制 · Python 3
原理实现

中文导读：copy_one 先按源节点的 tag 分配新节点。原子复制 atom 文本；子表
沿 head 逐个递归复制 child，再用 copied.next 把同层兄弟串起来。函数只复制
一个节点及其子树，不复制源节点的 next，next 由调用方连接。

阅读顺序：GLNode → copy_one 的原子/表分支 → build_demo 与主程序的结构核对。

输入输出：示例树由 build_demo 手工构造；copy_one 接收源节点并返回全新的
节点，源节点为 None 时返回 None。源树只读，复制后可与副本独立释放。

关键不变量：新节点 tag 与源节点相同；原子值逐字复制；子表的新 head 只
连接新节点；空表保留真实节点；源节点与副本不共享任何节点对象。

易错点：直接返回源节点；先递归孩子后分配父；空表返回 None；复用源
head；忘记把子节点接到 next 导致只剩第一个孩子。

复杂度：时间 O(n)，新表占 O(n)，递归栈 O(h)。
"""

from __future__ import annotations


# One node carries a tag and either atom text or a child head.
class GLNode:
    """广义表节点：tag 为 atom/list，next 指向同层后继。"""

    __slots__ = ("tag", "atom", "head", "next")

    def __init__(self, tag: str, atom: str | None = None) -> None:
        self.tag = tag
        self.atom = atom
        self.head: GLNode | None = None
        self.next: GLNode | None = None


# Construct an atom node; the caller keeps text within the length limit.
def make_atom(text: str) -> GLNode:
    """构造原子节点；text 由调用方保证不超过 8 个字符。"""
    return GLNode("atom", text)


# Construct an empty list; head is None but () is still a real node.
def make_list() -> GLNode:
    """构造空表节点；head 为空但节点本身代表真实的 ()。"""
    return GLNode("list")


# Append child to parent's sibling chain and set its next to None.
def append_child(parent: GLNode, child: GLNode) -> None:
    """把 child 追加到 parent 同层链尾。"""
    if parent.tag != "list":
        raise ValueError("only a list node can take children")
    if parent.head is None:
        parent.head = child
        return
    tail = parent.head
    while tail.next is not None:
        tail = tail.next
    tail.next = child


# Copy one node and its subtree; src.next is intentionally not copied.
def copy_one(src: GLNode | None) -> GLNode | None:
    """复制一个节点及其子树，不复制 src.next；返回新节点。"""
    if src is None:
        return None
    # A fresh node copies the tag and atom value but not head or next. Those links are rebuilt separately, which is what makes this a deep copy rather than an alias.
    dst = GLNode(src.tag, src.atom)
    # An atom has no children, so the fresh node is already a complete copy of this one-node subtree.
    if src.tag == "atom":
        return dst
    # tail starts at the new list node; the first child goes into dst.head, and later children follow tail.next. This mirrors the C pointer-to-pointer insertion without a dummy node.
    tail = dst
    child = src.head
    while child is not None:
        child_copy = copy_one(child)
        if child_copy is None:
            raise MemoryError("copy allocation failed")
        # 新节点逐个接入：dst.head 只指向第一个复制孩子，其余走 next。
        # Link copies one by one; dst.head holds the first child and next holds the rest.
        # The first copied child must initialize head; only later children use next. Checking head here is what distinguishes the two cases without a dummy node.
        if dst.head is None:
            dst.head = child_copy
        else:
            tail.next = child_copy
        # Advance tail after the child is linked. Moving it first would discard the only reference to the slot where the next sibling must be attached.
        tail = child_copy
        child = child.next
    return dst


# Render the list in parenthesized form so copy and source can be compared.
def format_gl(node: GLNode | None) -> str:
    """输出无空格括号表达式，用于核对结构等价。"""
    if node is None:
        return ""
    if node.tag == "atom":
        return node.atom or ""
    parts: list[str] = []
    child = node.head
    while child is not None:
        parts.append(format_gl(child))
        child = child.next
    return "(" + ",".join(parts) + ")"


# Build (a,(b,c),((d),e)) for the copy demo.
def build_demo() -> GLNode:
    """构造 (a,(b,c),((d),e))，用于演示复制。"""
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
    source = build_demo()
    copy = copy_one(source)
    print("source =", format_gl(source))
    print("copy   =", format_gl(copy))
    print("independent root =", source is not copy)
    print("independent atom =", source.head is not copy.head if copy else False)
    nested_empty = make_list()
    append_child(nested_empty, make_list())
    empty_copy = copy_one(nested_empty)
    print("nested empty =", format_gl(empty_copy))

# AlgoViz reference implementation: order-4 B-tree (search and insertion).
#
# Reading guide:
# 1. Each node stores a sorted key list and at most four child references.
# 2. A node with k keys has exactly k + 1 children; child i owns the interval
#    between key i - 1 and key i.
# 3. Search compares keys inside one node, then follows exactly one child.
# 4. Insertion rejects duplicates, splits a full root first, then splits every
#    full child before descending into it. The median rises; the old node keeps
#    the left half and a new node receives the right half.
#
# Complexity: height h = O(log_4 n); search and insert visit O(h) nodes.
# Space: O(n). Deletion is out of scope.
# Convention: integer keys are unique; no dict/set is used as a substitute for
# a real B-tree.

# 中文导读：实现 4 阶 B 树的查找与插入：满孩子先分裂，中位数上移到父结点。
# 阅读顺序：先看 BTreeNode 的 keys/children 对应关系，再看 split_child 的切分，最后跟 btree_insert 的下行路径。
# 输入/输出：输入唯一整数键；btree_search 返回是否命中，btree_insert 返回可能更新的根。
# 不变量：k 个键对应 k+1 个孩子；所有叶子在同一层；分裂后中位数上升。
# 易错点：先下降再分裂导致回溯；孩子区间切错；重复键未在修改前拒绝。
# 复杂度：树高 O(log_4 n)，查找/插入访问 O(log n) 个结点，空间 O(n)。
from collections import deque

ORDER = 4
MAX_KEYS = ORDER - 1


class BTreeNode:
    def __init__(self, leaf=True):
        self.keys = []
        self.children = []
        self.leaf = leaf


# 作用：只读查找 target；命中返回 True，可选的 comparisons[0] 累计键比较次数。
def btree_search(node, target, comparisons=None):
    """Read-only search. Returns True on a hit; counts key comparisons."""
    while node is not None:
        index = 0
        while index < len(node.keys):
            if comparisons is not None:
                comparisons[0] += 1
            if target == node.keys[index]:
                return True
            if target < node.keys[index]:
                break
            index += 1
        if node.leaf:
            return False
        node = node.children[index]
    return False


# 作用：切分 parent 的满孩子，把中位数提升到 parent，返回新右结点。
def split_child(parent, index):
    """Split a full child; promote its median into parent. Returns the new right node."""
    left = parent.children[index]
    promoted = left.keys[1]

    right = BTreeNode(left.leaf)
    right.keys = [left.keys[2]]
    if not left.leaf:
        right.children = left.children[2:]
        left.children = left.children[:2]
    left.keys = left.keys[:1]

    parent.keys.insert(index, promoted)
    parent.children.insert(index + 1, right)
    return right


# A full child is split before descending; its median moves into the parent, so insertion never needs to back up.
# 作用：插入唯一键并返回可能更新的根；重复键在修改前拒绝。
def btree_insert(root, value):
    """Insert one unique key; returns the possibly new root.

    A duplicate is rejected before any mutation, so the tree stays unchanged.
    """
    if root is None:
        root = BTreeNode()
        root.keys.append(value)
        return root

    if btree_search(root, value):
        return root

    if len(root.keys) == MAX_KEYS:
        new_root = BTreeNode(leaf=False)
        new_root.children.append(root)
        split_child(new_root, 0)
        root = new_root

    node = root
    while not node.leaf:
        index = 0
        while index < len(node.keys) and value > node.keys[index]:
            index += 1
        child = node.children[index]
        if len(child.keys) == MAX_KEYS:
            promoted = child.keys[1]
            right = split_child(node, index)
            if value > promoted:
                child = right
        node = child

    position = len(node.keys)
    while position > 0 and node.keys[position - 1] > value:
        position -= 1
    node.keys.insert(position, value)
    return root


# 作用：按层打印键列表，便于观察分裂结果。
def print_tree(root):
    """Level-order print: every node shows its keys in one bracket."""
    if root is None:
        return
    pending = deque([root])
    while pending:
        level_size = len(pending)
        line = []
        for _ in range(level_size):
            node = pending.popleft()
            line.append("[" + ",".join(str(key) for key in node.keys) + "]")
            if not node.leaf:
                pending.extend(node.children)
        print(" ".join(line))


if __name__ == "__main__":
    root = None
    for value in [10, 20, 30, 40, 50, 60, 70, 45]:
        root = btree_insert(root, value)

    print("B-tree after insertion:")
    print_tree(root)

    comparisons = [0]
    print(f"search 30: {'found' if btree_search(root, 30, comparisons) else 'missing'} "
          f"({comparisons[0]} comparisons)")

    comparisons = [0]
    print(f"search 35: {'found' if btree_search(root, 35, comparisons) else 'missing'} "
          f"({comparisons[0]} comparisons)")

    root = btree_insert(root, 45)
    print("duplicate 45 rejected; search says "
          + ("present" if btree_search(root, 45) else "impossible"))

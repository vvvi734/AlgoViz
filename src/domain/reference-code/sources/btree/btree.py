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

from collections import deque

ORDER = 4
MAX_KEYS = ORDER - 1


class BTreeNode:
    def __init__(self, leaf=True):
        self.keys = []
        self.children = []
        self.leaf = leaf


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

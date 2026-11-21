# 中文导读：B+ 树把记录全部放在叶层，内部节点只保存分隔键；叶节点用 next 串成范围扫描链。
# 阅读顺序：先看 4 阶容量与“内部键 i 是右孩子最小键”；再看 split_leaf/split_internal 的不同提升规则；最后看 range_scan 沿 next 前进。
# 关键不变量：内部节点 k 个键有 k+1 个孩子；记录只在叶子；叶链递增；内部键等于右子树最小记录。
# 易错点：记录写进内部节点；叶分裂提升中间键；范围查询每次回到根；删除被误称为已支持。
# 复杂度：点查找/插入 O(log_4 n)，范围查询 O(log_4 n + k)；空间 O(n)。
# 输入/输出：唯一整数键、操作与范围；脚本打印叶链、查找、插入与范围结果。
# 函数地图：先读 main 的调用顺序，再查看 split_leaf、split_internal、insert_rec、find_leaf、range_scan。

"""
Order-4 B+ tree in Python 3 (search, insertion, leaf-chain range scan).

Internal keys are separators equal to the minimum record of the right child.
Records live only in leaves; leaves form an ordered next chain. A leaf split
promotes the first key of the right leaf, while an internal split promotes and
removes the middle separator. Duplicate keys are rejected before mutation.

Deletion is explicitly out of scope for this course.
"""

ORDER = 4
MAX_KEYS = ORDER - 1


class BPlusNode:
    def __init__(self, leaf=True):
        self.keys = []
        self.children = []
        self.leaf = leaf
        self.next = None


class Promotion:
    def __init__(self, separator, right):
        self.separator = separator
        self.right = right


# Purpose: First separator greater than key chooses the child; equality goes right.
# 作用：选第一个大于 key 的分隔键对应的孩子；相等时走右子树。
def child_slot(node, key):
    slot = 0
    while slot < len(node.keys) and key >= node.keys[slot]:
        slot += 1
    return slot


# Purpose: Descend through separators to the only leaf that can own the key.
# 作用：沿分隔键下降到唯一可能包含 key 的叶子。
def find_leaf(root, target):
    node = root
    while node is not None and not node.leaf:
        node = node.children[child_slot(node, target)]
    return node


# Purpose: Point lookup checks leaf records only; internal separators are not records.
# 作用：点查找只在叶记录中检查；内部键不是记录。
def contains(root, target):
    leaf = find_leaf(root, target)
    return leaf is not None and target in leaf.keys


# Purpose: Split a leaf 2/2 and promote the first key of the new right leaf.
# 作用：叶节点按 2/2 分裂，并提升新右叶首键。
def split_leaf(node):
    right = BPlusNode(True)
    right.keys = node.keys[2:]
    node.keys = node.keys[:2]
    right.next = node.next
    node.next = right
    return Promotion(right.keys[0], right)


# Purpose: Split an internal node, promote and remove the middle separator, then move the right child range.
# 作用：分裂内部节点，提升并移除中间分隔键，再移动右半孩子范围。
def split_internal(node):
    right = BPlusNode(False)
    separator = node.keys[2]
    right.keys = node.keys[3:]
    right.children = node.children[3:]
    node.keys = node.keys[:2]
    node.children = node.children[:3]
    return Promotion(separator, right)


# Purpose: Insert a record into a leaf or a promoted separator into an index node.
# 作用：把记录插入叶子，或把上升的分隔键插入索引节点。
def insert_rec(node, key):
    if node.leaf:
        position = len(node.keys)
        while position > 0 and node.keys[position - 1] > key:
            position -= 1
        node.keys.insert(position, key)
        if len(node.keys) <= MAX_KEYS:
            return None
        return split_leaf(node)
    slot = child_slot(node, key)
    promoted = insert_rec(node.children[slot], key)
    if promoted is None:
        return None
    node.keys.insert(slot, promoted.separator)
    node.children.insert(slot + 1, promoted.right)
    if len(node.keys) <= MAX_KEYS:
        return None
    return split_internal(node)


# Purpose: Reject duplicates before mutation; a root split is the only height increase.
# 作用：修改前拒绝重复；根分裂是唯一长高方式。
def insert(root, key):
    if root is None:
        root = BPlusNode(True)
        root.keys.append(key)
        return root, True
    if contains(root, key):
        return root, False
    promoted = insert_rec(root, key)
    if promoted is not None:
        fresh = BPlusNode(False)
        fresh.keys = [promoted.separator]
        fresh.children = [root, promoted.right]
        root = fresh
    return root, True


# Purpose: Start at the lower-bound leaf, follow next, and stop once records exceed high.
# 作用：从下界叶子开始，沿 next 前进，超过上界即停止。
def range_scan(root, low, high):
    result = []
    leaf = find_leaf(root, low)
    while leaf is not None:
        for key in leaf.keys:
            if low <= key <= high:
                result.append(key)
        if leaf.keys and leaf.keys[-1] > high:
            break
        leaf = leaf.next
    return result


# Purpose: Print the real leaf chain to show every record is reachable at one layer.
# 作用：打印真实叶链，说明每条记录都能在叶层访问。
def print_leaves(root):
    leaf = root
    while leaf is not None and not leaf.leaf:
        leaf = leaf.children[0]
    line = []
    while leaf is not None:
        line.append("[" + " ".join(str(key) for key in leaf.keys) + "]")
        leaf = leaf.next
    print("leaves:", " ".join(line))


if __name__ == "__main__":
    root = None
    for key in (8, 9, 10, 15, 20):
        root, _ = insert(root, key)
    print_leaves(root)
    print("find 15:", contains(root, 15))
    print("find 12:", contains(root, 12))
    root, inserted = insert(root, 12)
    print("insert 12:", "inserted" if inserted else "duplicate")
    root, inserted = insert(root, 12)
    print("insert 12 again:", "inserted" if inserted else "duplicate")
    print("range [10, 18]:", range_scan(root, 10, 18))
    print("find 12 after insertion:", contains(root, 12))

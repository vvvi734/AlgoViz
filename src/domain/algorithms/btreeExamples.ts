/**
 * SEARCH-04 + TEXTBOOK-09: the REAL Python order-4 B-tree teaching program.
 *
 * One program handles search, insertion and deletion. Nodes are genuine Python
 * objects with stable teaching ids (`n1`, `n2`, ...), real ordered key lists and
 * real child lists. Policies are fixed and shared by the lesson, the reference
 * code and the animation:
 *   - keys are unique; a duplicate search hit rejects the insert unchanged;
 *   - insertion splits a full child BEFORE descending into it;
 *   - deletion first proves the key exists, then uses top-down repair: before
 *     entering a minimum child it borrows from a richer sibling or merges. A
 *     missing key therefore leaves the tree completely unchanged;
 *   - root contraction is performed immediately after a merge empties the root.
 * No frame is generated from a hard-coded animation script: `emit` reads the
 * current Python tree after the operation named on that frame.
 */

export const BTREE_COMMAND = ['find', 'insert', 'delete'] as const;
export type BtreeCommand = (typeof BTREE_COMMAND)[number];

/** Official presets. The initial tree is built by real silent insertions. */
export const BTREE_PRESETS = [
  {
    id: 'find-hit',
    command: 'find',
    label: 'btreePresetFindHit',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 30,
  },
  {
    id: 'find-miss',
    command: 'find',
    label: 'btreePresetFindMiss',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 35,
  },
  {
    id: 'insert-leaf',
    command: 'insert',
    label: 'btreePresetInsertLeaf',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 35,
  },
  {
    id: 'insert-split',
    command: 'insert',
    label: 'btreePresetInsertSplit',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 45,
  },
  {
    id: 'insert-root-split',
    command: 'insert',
    label: 'btreePresetInsertRootSplit',
    tree: [10, 20, 30],
    target: 40,
  },
  {
    id: 'delete-leaf-plain',
    command: 'delete',
    label: 'btreePresetDeleteLeaf',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 60,
  },
  {
    id: 'delete-internal-replace',
    command: 'delete',
    label: 'btreePresetDeleteInternal',
    tree: [21, 10, 26, 42, 4, 5, 35, 7],
    target: 21,
  },
  {
    id: 'delete-borrow',
    command: 'delete',
    label: 'btreePresetDeleteBorrow',
    tree: [27, 5, 16, 6, 36, 28, 4, 37],
    target: 27,
  },
  {
    id: 'delete-merge',
    command: 'delete',
    label: 'btreePresetDeleteMerge',
    tree: [45, 16, 6, 37, 20, 34, 32, 22],
    target: 45,
  },
  {
    id: 'delete-root-shrink',
    command: 'delete',
    label: 'btreePresetDeleteRootShrink',
    tree: [17, 2, 34, 30, 21, 23, 29, 27, 49],
    target: 17,
  },
  {
    id: 'delete-missing',
    command: 'delete',
    label: 'btreePresetDeleteMissing',
    tree: [10, 20, 30, 40, 50, 60, 70],
    target: 35,
  },
] as const;

export type BtreePreset = (typeof BTREE_PRESETS)[number];
export type BtreePresetId = BtreePreset['id'];

export const BTREE_DEFAULT_INPUT: unknown = {
  preset: 'find-hit',
  operation: 'find',
  tree: [10, 20, 30, 40, 50, 60, 70],
  target: 30,
};

export const BTREE_PYTHON = `# Order-4 B-tree: real nodes, real keys, real child lists, real splits and deletion repair.
# Policies: unique keys; split a full child before descending; for deletion
# prove the key exists first, then borrow/merge BEFORE entering a minimum child.
import inspect
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
OPERATION = raw_input.get("operation", "find")
if OPERATION not in ("find", "insert", "delete"):
    OPERATION = "find"
raw_target = raw_input.get("target", 0)
if isinstance(raw_target, bool) or not isinstance(raw_target, (int, float)) or not math.isfinite(raw_target):
    raw_target = 0
TARGET = raw_target
raw_tree = raw_input.get("tree", [])
if not isinstance(raw_tree, list):
    raw_tree = []
VALUES = []
for item in raw_tree:
    if isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item):
        continue
    VALUES.append(item)
VALUES = VALUES[:24]
PRESET = raw_input.get("preset")
if PRESET is not None and not isinstance(PRESET, str):
    PRESET = None

ORDER = 4
MAX_KEYS = ORDER - 1
MIN_KEYS = 1
TRACING = False
ROOT = None
NODES = []
NEXT_ID = 0


def fmt(value):
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def keys_text(node):
    return "[" + ", ".join(fmt(key) for key in node.keys) + "]"


class BTreeNode:
    def __init__(self, node_id, leaf):
        self.id = node_id
        self.keys = []
        self.children = []
        self.leaf = leaf


def new_node(leaf):
    global NEXT_ID
    NEXT_ID += 1
    node = BTreeNode("n" + str(NEXT_ID), leaf)
    NODES.append(node)
    return node


def node_payload(node):
    return {
        "id": node.id,
        "keys": list(node.keys),
        "children": [child.id for child in node.children],
        "leaf": node.leaf,
    }


def tree_height(node=None):
    if node is None:
        node = ROOT
    if node is None:
        return 0
    if node.leaf:
        return 1
    return 1 + max(tree_height(child) for child in node.children)


def path_text(path):
    if not path:
        return "(空)"
    return " → ".join(keys_text(node) for node in path)


def emit(operation, message, lesson, current=None, path=None, compare=None,
         slot=None, child=None, split=None, inserted=None, delete_info=None, result=None):
    if not TRACING:
        return
    payload = {
        "kind": "btree",
        "order": ORDER,
        "preset": PRESET,
        "command": OPERATION,
        "operation": operation,
        "targetValue": TARGET,
        "rootId": ROOT.id if ROOT is not None else None,
        "nodes": [node_payload(node) for node in NODES],
        "currentNodeId": current.id if current is not None else None,
        "pathIds": [node.id for node in path] if path else [],
        "compareIndex": compare[0] if compare is not None else None,
        "compareKey": compare[1] if compare is not None else None,
        "childSlot": slot,
        "childId": child.id if child is not None else None,
        "split": split,
        "insertedKey": inserted,
        "deleteInfo": delete_info,
        "result": result,
    }
    variables = {
        "order": ORDER,
        "minKeys": MIN_KEYS,
        "maxKeys": MAX_KEYS,
        "target": TARGET,
        "nodeCount": len(NODES),
        "treeHeight": tree_height(),
        "currentKeys": list(current.keys) if current is not None else [],
        "path": path_text(path),
        "result": result if result is not None else "pending",
    }
    flat = []
    for node in NODES:
        flat.extend(node.keys)
    trace(
        {"type": "array", "values": flat, "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


def split_child(parent, index, child, root_changed=False):
    # Order 4: a full child has keys [a, b, c]; b rises, a and c split left/right.
    promoted = child.keys[1]
    right = new_node(child.leaf)
    right.keys = list(child.keys[2:])
    if not child.leaf:
        right.children = list(child.children[2:])
        child.children = list(child.children[:2])
    child.keys = list(child.keys[:1])
    parent.keys.insert(index, promoted)
    parent.children.insert(index + 1, right)
    return {
        "nodeId": child.id,
        "phase": "after",
        "leftId": child.id,
        "rightId": right.id,
        "promotedKey": promoted,
        "parentId": parent.id,
        "rootChanged": root_changed,
    }


def split_before(child):
    return {
        "nodeId": child.id,
        "phase": "before",
        "leftId": None,
        "rightId": None,
        "promotedKey": None,
        "parentId": None,
        "rootChanged": False,
    }


def find_target(target):
    node = ROOT
    path = []
    while node is not None:
        path.append(node)
        for index, key in enumerate(node.keys):
            emit(
                "inspect",
                f"比较 {fmt(target)} 与关键字 {fmt(key)} / compare {fmt(target)} with key {fmt(key)}",
                "inspect",
                current=node,
                path=path,
                compare=(index, key),
            )
            if key == target:
                emit(
                    "found",
                    f"命中 {fmt(target)}：查找结束 / hit {fmt(target)}: search stops",
                    "found",
                    current=node,
                    path=path,
                    compare=(index, key),
                    result="found",
                )
                return True
            if target < key:
                slot = index
                break
        else:
            slot = len(node.keys)
        if node.leaf:
            emit(
                "not-found",
                f"到达叶子仍未命中 {fmt(target)} / reached a leaf without {fmt(target)}",
                "not-found",
                current=node,
                path=path,
                result="not-found",
            )
            return False
        child = node.children[slot]
        emit(
            "descend",
            f"{fmt(target)} 落在该区间，进入第 {slot + 1} 个子树 / enter child {slot + 1}",
            "descend",
            current=node,
            path=path,
            slot=slot,
            child=child,
        )
        node = child
    return False


def locate_for_insert(target):
    # The first pass only proves absence/duplicate. It never splits, so a
    # rejected duplicate leaves the recorded tree exactly unchanged.
    node = ROOT
    path = []
    while node is not None:
        path.append(node)
        for index, key in enumerate(node.keys):
            emit(
                "inspect",
                f"比较 {fmt(target)} 与关键字 {fmt(key)} / compare {fmt(target)} with key {fmt(key)}",
                "inspect",
                current=node,
                path=path,
                compare=(index, key),
            )
            if key == target:
                emit(
                    "duplicate",
                    f"重复关键字 {fmt(target)}：拒绝插入，树不变 / duplicate {fmt(target)}: rejected, tree unchanged",
                    "duplicate",
                    current=node,
                    path=path,
                    compare=(index, key),
                    result="duplicate",
                )
                return False, True
            if target < key:
                slot = index
                break
        else:
            slot = len(node.keys)
        if node.leaf:
            return False, False
        child = node.children[slot]
        emit(
            "descend",
            f"{fmt(target)} 落在该区间，进入第 {slot + 1} 个子树 / enter child {slot + 1}",
            "descend",
            current=node,
            path=path,
            slot=slot,
            child=child,
        )
        node = child
    return False, False


def insert_key(node, target):
    index = len(node.keys)
    while index > 0 and node.keys[index - 1] > target:
        index -= 1
    node.keys.insert(index, target)
    return index


def insert_value(target):
    global ROOT
    if ROOT is None:
        ROOT = new_node(True)
        inserted_index = insert_key(ROOT, target)
        emit(
            "insert",
            f"空树：创建根节点并插入 {fmt(target)} / empty tree: create root and insert {fmt(target)}",
            "insert",
            current=ROOT,
            path=[ROOT],
            compare=(inserted_index, target),
            inserted=target,
            result="inserted",
        )
        return "inserted"

    if len(ROOT.keys) == MAX_KEYS:
        old_root = ROOT
        emit(
            "split",
            f"根节点 {keys_text(old_root)} 已满：分裂前 / full root before split",
            "split-before",
            current=old_root,
            path=[old_root],
            split=split_before(old_root),
        )
        new_root = new_node(False)
        new_root.children.append(old_root)
        ROOT = new_root
        split_info = split_child(new_root, 0, old_root, root_changed=True)
        emit(
            "split",
            f"根节点分裂：{fmt(split_info['promotedKey'])} 成为新根 / root split: {fmt(split_info['promotedKey'])} becomes the new root",
            "split-after",
            current=new_root,
            path=[new_root],
            split=split_info,
        )

    node = ROOT
    path = []
    while not node.leaf:
        path.append(node)
        index = len(node.keys)
        while index > 0 and target < node.keys[index - 1]:
            index -= 1
        child = node.children[index]
        if len(child.keys) == MAX_KEYS:
            emit(
                "split",
                f"孩子 {keys_text(child)} 已满：下降前分裂 / full child before descending is split",
                "split-before",
                current=node,
                path=path,
                split=split_before(child),
            )
            split_info = split_child(node, index, child)
            emit(
                "split",
                f"中间关键字 {fmt(split_info['promotedKey'])} 上升，左右节点各保留 1 个关键字 / median rises; both sides keep one key",
                "split-after",
                current=node,
                path=path,
                split=split_info,
            )
            if target > node.keys[index]:
                index += 1
            child = node.children[index]
        emit(
            "descend",
            f"{fmt(target)} 落在该区间，进入第 {index + 1} 个子树 / enter child {index + 1}",
            "descend",
            current=node,
            path=path,
            slot=index,
            child=child,
        )
        node = child

    path.append(node)
    inserted_index = insert_key(node, target)
    emit(
        "insert",
        f"到达叶子：插入 {fmt(target)}，所有叶子仍同深度 / insert {fmt(target)} at the leaf; leaves stay level",
        "insert",
        current=node,
        path=path,
        compare=(inserted_index, target),
        inserted=target,
        result="inserted",
    )
    return "inserted"


def contains_silent(target):
    node = ROOT
    while node is not None:
        index = 0
        while index < len(node.keys) and target > node.keys[index]:
            index += 1
        if index < len(node.keys) and target == node.keys[index]:
            return True
        if node.leaf:
            return False
        node = node.children[index]


def slot_for(node, target):
    index = 0
    while index < len(node.keys) and target > node.keys[index]:
        index += 1
    return index


def delete_info(action, key=None, parent=None, sibling=None, separator=None, root_changed=False):
    return {
        "action": action,
        "key": key,
        "parentId": parent.id if parent is not None else None,
        "siblingId": sibling.id if sibling is not None else None,
        "separatorKey": separator,
        "rootChanged": root_changed,
    }


def borrow_from_left(parent, slot, child, path):
    left = parent.children[slot - 1]
    separator = parent.keys[slot - 1]
    child.keys.insert(0, parent.keys[slot - 1])
    parent.keys[slot - 1] = left.keys.pop()
    if not child.leaf:
        child.children.insert(0, left.children.pop())
    emit(
        "borrow-left",
        f"左兄弟有富余：父键 {fmt(separator)} 下移，左兄弟最大键上移 / borrow through the parent from the left sibling",
        "borrow-left",
        current=child,
        path=path + [child],
        delete_info=delete_info("borrow-left", parent=parent, sibling=left, separator=separator),
    )


def borrow_from_right(parent, slot, child, path):
    right = parent.children[slot + 1]
    separator = parent.keys[slot]
    child.keys.append(parent.keys[slot])
    parent.keys[slot] = right.keys.pop(0)
    if not child.leaf:
        child.children.append(right.children.pop(0))
    emit(
        "borrow-right",
        f"右兄弟有富余：父键 {fmt(separator)} 下移，右兄弟最小键上移 / borrow through the parent from the right sibling",
        "borrow-right",
        current=child,
        path=path + [child],
        delete_info=delete_info("borrow-right", parent=parent, sibling=right, separator=separator),
    )


def merge_with_left(parent, slot, child, path):
    global ROOT
    left = parent.children[slot - 1]
    separator = parent.keys.pop(slot - 1)
    parent.children.pop(slot)
    left.keys.append(separator)
    left.keys.extend(child.keys)
    left.children.extend(child.children)
    NODES.remove(child)
    root_changed = False
    if parent is ROOT and len(parent.keys) == 0:
        ROOT = parent.children[0]
        NODES.remove(parent)
        root_changed = True
    emit(
        "merge",
        f"兄弟不够借：父键 {fmt(separator)} 与两个节点合并 / siblings cannot lend: merge through the parent",
        "merge",
        current=left,
        path=([ROOT] if root_changed else path + [left]),
        delete_info=delete_info(
            "merge",
            parent=None if root_changed else parent,
            sibling=child,
            separator=separator,
            root_changed=root_changed,
        ),
    )
    if root_changed:
        emit(
            "root-shrink",
            "根节点已空：唯一孩子成为新根，树高减一 / empty root contracts; the tree gets shorter",
            "root-shrink",
            current=ROOT,
            path=[ROOT],
            delete_info=delete_info("root-shrink", root_changed=True),
        )
    return left


def merge_with_right(parent, slot, child, path):
    global ROOT
    right = parent.children[slot + 1]
    separator = parent.keys.pop(slot)
    parent.children.pop(slot + 1)
    child.keys.append(separator)
    child.keys.extend(right.keys)
    child.children.extend(right.children)
    NODES.remove(right)
    root_changed = False
    if parent is ROOT and len(parent.keys) == 0:
        ROOT = parent.children[0]
        NODES.remove(parent)
        root_changed = True
    emit(
        "merge",
        f"兄弟不够借：父键 {fmt(separator)} 与两个节点合并 / siblings cannot lend: merge through the parent",
        "merge",
        current=child,
        path=([ROOT] if root_changed else path + [child]),
        delete_info=delete_info(
            "merge",
            parent=None if root_changed else parent,
            sibling=right,
            separator=separator,
            root_changed=root_changed,
        ),
    )
    if root_changed:
        emit(
            "root-shrink",
            "根节点已空：唯一孩子成为新根，树高减一 / empty root contracts; the tree gets shorter",
            "root-shrink",
            current=ROOT,
            path=[ROOT],
            delete_info=delete_info("root-shrink", root_changed=True),
        )
    return child


def ensure_child(parent, slot, path):
    # Called BEFORE entering a minimum child. The child always ends with at
    # least two keys, so a subsequent delete can never underflow it.
    global ROOT
    child = parent.children[slot]
    if len(child.keys) > MIN_KEYS:
        return child
    left = parent.children[slot - 1] if slot > 0 else None
    right = parent.children[slot + 1] if slot + 1 < len(parent.children) else None
    if left is not None and len(left.keys) > MIN_KEYS:
        borrow_from_left(parent, slot, child, path)
        return child
    if right is not None and len(right.keys) > MIN_KEYS:
        borrow_from_right(parent, slot, child, path)
        return child
    if left is not None:
        return merge_with_left(parent, slot, child, path)
    if right is not None:
        return merge_with_right(parent, slot, child, path)
    return child


def report_missing(target):
    node = ROOT
    path = []
    while node is not None:
        path.append(node)
        for index, key in enumerate(node.keys):
            emit(
                "inspect",
                f"比较 {fmt(target)} 与关键字 {fmt(key)} / compare with key {fmt(key)}",
                "inspect",
                current=node,
                path=path,
                compare=(index, key),
            )
            if target < key:
                slot = index
                break
        else:
            slot = len(node.keys)
        if node.leaf:
            emit(
                "not-found",
                f"叶子中没有 {fmt(target)}：删除失败，结构不变 / key absent: delete does nothing",
                "not-found",
                current=node,
                path=path,
                result="not-found",
            )
            return "not-found"
        child = node.children[slot]
        emit(
            "descend",
            f"继续搜索第 {slot + 1} 个子树 / descend into child {slot + 1}",
            "descend",
            current=node,
            path=path,
            slot=slot,
            child=child,
        )
        node = child
    return "not-found"


def delete_value(target):
    global ROOT
    if ROOT is None:
        emit(
            "not-found",
            "空树：没有可删除的关键字 / empty tree: nothing to delete",
            "not-found",
            result="not-found",
        )
        return "not-found"
    if not contains_silent(target):
        return report_missing(target)

    while ROOT is not None:
        node = ROOT
        path = [node]
        while True:
            index = 0
            while index < len(node.keys) and target > node.keys[index]:
                index += 1
            found = index < len(node.keys) and target == node.keys[index]

            if found and node.leaf:
                node.keys.pop(index)
                if node is ROOT and len(node.keys) == 0:
                    NODES.clear()
                    ROOT = None
                    emit(
                        "delete-leaf",
                        f"删除叶子中的 {fmt(target)}：树已为空 / delete the last key: the tree becomes empty",
                        "delete-leaf",
                        current=None,
                        path=[],
                        delete_info=delete_info("delete-leaf", key=target),
                        result=None,
                    )
                    return "deleted"
                emit(
                    "delete-leaf",
                    f"在叶子中删除 {fmt(target)}；节点仍满足下限 / delete from a leaf that stays above the minimum",
                    "delete-leaf",
                    current=node,
                    path=path,
                    delete_info=delete_info("delete-leaf", key=target),
                )
                return "deleted"

            if found and not node.leaf:
                emit(
                    "locate",
                    f"关键字 {fmt(target)} 位于内部节点：用左子树最大前驱替换 / internal key: replace by its predecessor",
                    "locate",
                    current=node,
                    path=path,
                    compare=(index, target),
                    delete_info=delete_info("locate", key=target),
                )
                root_before = ROOT
                left = ensure_child(node, index, path)
                if ROOT is not root_before:
                    break
                if index >= len(node.keys) or node.keys[index] != target:
                    break
                # Walk to the rightmost leaf of the left subtree, repairing any
                # minimum child before entering it.
                current = node.children[index]
                pred_path = path + [current]
                while not current.leaf:
                    repaired = ensure_child(current, len(current.keys), pred_path)
                    if ROOT is not root_before:
                        break
                    current = current.children[len(current.children) - 1]
                    pred_path.append(current)
                if ROOT is not root_before:
                    break
                if not current.keys:
                    break
                predecessor = current.keys.pop()
                node.keys[index] = predecessor
                emit(
                    "replace",
                    f"内部键 {fmt(target)} 被前驱 {fmt(predecessor)} 替换 / internal key replaced by predecessor {fmt(predecessor)}",
                    "replace",
                    current=node,
                    path=path,
                    compare=(index, predecessor),
                    delete_info=delete_info("replace", key=target, parent=node),
                )
                emit(
                    "delete-leaf",
                    f"前驱 {fmt(predecessor)} 已从其叶子删除 / predecessor removed from its leaf",
                    "delete-leaf",
                    current=current,
                    path=pred_path,
                    delete_info=delete_info("delete-leaf", key=predecessor),
                )
                return "deleted"

            if node.leaf:
                emit(
                    "not-found",
                    f"叶子中没有 {fmt(target)}：结构不变 / key absent: tree unchanged",
                    "not-found",
                    current=node,
                    path=path,
                    result="not-found",
                )
                return "not-found"

            root_before = ROOT
            child = ensure_child(node, index, path)
            if ROOT is not root_before:
                break
            # Repair may have merged the former child into its left sibling.
            # Recompute the slot against the new keys of this same parent.
            index = slot_for(node, target)
            child = node.children[index]
            emit(
                "descend",
                f"进入第 {index + 1} 个子树继续删除 / descend into repaired child {index + 1}",
                "descend",
                current=node,
                path=path,
                slot=index,
                child=child,
            )
            node = child
            path.append(node)
    return "deleted"


def build_from_values(values):
    global TRACING
    TRACING = False
    for value in values:
        if contains_silent(value):
            continue
        insert_value(value)
    TRACING = True


build_from_values(VALUES)

emit(
    "init",
    "4 阶 B 树：最多 4 个孩子、3 个关键字 / order-4 B-tree ready",
    "init",
    current=ROOT,
    path=[ROOT] if ROOT is not None else [],
)

if OPERATION == "find":
    found = find_target(TARGET)
    emit(
        "done",
        "查找完成：命中 / search complete: found" if found else "查找完成：未命中 / search complete: missing",
        "done",
        result="found" if found else "not-found",
    )
elif OPERATION == "insert":
    _, duplicate = locate_for_insert(TARGET)
    if duplicate:
        emit(
            "done",
            "重复键已拒绝：树保持不变 / duplicate rejected: tree unchanged",
            "done",
            result="duplicate",
        )
    else:
        insert_value(TARGET)
        emit(
            "done",
            "插入完成：关键字有序、子树区间正确、叶子同深度 / insertion complete: order, ranges and leaf depth hold",
            "done",
            result="inserted",
        )
else:
    outcome = delete_value(TARGET)
    emit(
        "done",
        "删除完成：容量、区间、叶深与根规则仍成立 / deletion complete: all B-tree invariants hold"
        if outcome == "deleted"
        else "删除失败：关键字不存在，结构不变 / delete failed: key absent, structure unchanged",
        "done",
        result="deleted" if outcome == "deleted" else "not-found",
    )
`;

/** Normalise the stored input at the UI boundary, then hand it to the Python preset. */
export function btreeCommandFromInput(input: unknown): BtreeCommand {
  if (!input || typeof input !== 'object') return 'find';
  const command = (input as { operation?: unknown }).operation;
  return command === 'insert' || command === 'delete' ? command : 'find';
}

export function btreeTargetFromInput(input: unknown): number {
  if (!input || typeof input !== 'object') return 0;
  const target = (input as { target?: unknown }).target;
  return typeof target === 'number' && Number.isFinite(target) ? target : 0;
}

export function btreeTreeFromInput(input: unknown): number[] {
  if (!input || typeof input !== 'object') return [];
  const tree = (input as { tree?: unknown }).tree;
  if (!Array.isArray(tree)) return [];
  return tree.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

export function btreePresetFromInput(input: unknown): BtreePresetId | null {
  if (!input || typeof input !== 'object') return null;
  const preset = (input as { preset?: unknown }).preset;
  return typeof preset === 'string' && BTREE_PRESETS.some((entry) => entry.id === preset)
    ? (preset as BtreePresetId)
    : null;
}

export function btreePresetInput(id: BtreePresetId): unknown {
  const preset = BTREE_PRESETS.find((entry) => entry.id === id) ?? BTREE_PRESETS[0];
  return {
    preset: preset.id,
    operation: preset.command,
    tree: [...preset.tree],
    target: preset.target,
  };
}

/** Dynamic source string for the shared Python runner. */
export function btreePythonExample(): string {
  return BTREE_PYTHON;
}

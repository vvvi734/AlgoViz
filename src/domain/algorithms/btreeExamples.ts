/**
 * SEARCH-04: the REAL Python order-4 B-tree teaching program.
 *
 * One program handles search and insertion. Nodes are genuine Python objects
 * with stable teaching ids (`n1`, `n2`, ...), real ordered key lists and real
 * child lists. The insertion policy is fixed and shared by the lesson, the
 * reference code and the animation:
 *   - keys are unique; a duplicate search hit rejects the insert before any
 *     structural change;
 *   - split a full child BEFORE descending into it;
 *   - a full root is split first, creating a new root.
 * No frame is generated from a hard-coded animation script: `emit` reads the
 * current Python tree after the operation named on that frame.
 */

export const BTREE_COMMAND = ['find', 'insert'] as const;
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
] as const;

export type BtreePreset = (typeof BTREE_PRESETS)[number];
export type BtreePresetId = BtreePreset['id'];

export const BTREE_DEFAULT_INPUT: unknown = {
  preset: 'find-hit',
  operation: 'find',
  tree: [10, 20, 30, 40, 50, 60, 70],
  target: 30,
};

export const BTREE_PYTHON = `# Order-4 B-tree: real nodes, real keys, real child lists and real splits.
# Policy: unique keys; split a full child before descending; split a full root first.
import inspect
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
OPERATION = raw_input.get("operation", "find")
if OPERATION not in ("find", "insert"):
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
         slot=None, child=None, split=None, inserted=None, result=None):
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
        "result": result,
    }
    variables = {
        "order": ORDER,
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
else:
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
`;

/** Normalise the stored input at the UI boundary, then hand it to the Python preset. */
export function btreeCommandFromInput(input: unknown): BtreeCommand {
  if (!input || typeof input !== 'object') return 'find';
  const command = (input as { operation?: unknown }).operation;
  return command === 'insert' ? 'insert' : 'find';
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

/**
 * TEXTBOOK-09: real order-4 B+ tree with index-only internal nodes, all records
 * in a linked leaf layer, and range queries that continue along the leaf chain.
 *
 * Conventions used by the course, the Python trace and the reference code:
 *   - order m = 4: at most 4 children, at most 3 keys per node;
 *   - internal key i is the minimum key of child i+1 (a separator lower bound);
 *   - duplicate keys are rejected and leave the tree unchanged;
 *   - split promotion of a leaf is the first key of the new right leaf;
 *   - split promotion of an internal node is the separator between its middle
 *     children, copied up and removed from the right node;
 *   - every record is reachable only from a leaf; range scans follow next.
 */
import type { AlgorithmEntry } from './types';

export const BPLUS_TREE_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '⌘',
  name: ['B+ 树：查找、插入与范围扫描', 'B+ tree: search, insert and range scan'],
  desc: [
    '4 阶 B+ 树的内部节点只存分隔键，所有记录都只在叶节点；叶节点用 next 顺序链接。演示点查找必须走到叶子、插入触发叶分裂/内部索引分裂/根分裂，以及范围查询沿叶链连续扫描。',
    'Order-4 B+ tree: internal nodes hold separators only, every record lives in a leaf, and leaves are linked by next. Demonstrate point search reaching a leaf, insertion with leaf/internal/root splits, and a range query continuing along the leaf chain.',
  ],
  time: 'O(log₄ n) point lookup; O(log₄ n + k) range of k records',
  space: 'O(n) records plus internal separators and leaf links',
  input: undefined,
  code: "trace({type:'array',values:['B+ tree: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const BPLUS_TREE_PRESETS = [
  {
    id: 'find-hit',
    label: 'bplusPresetFind',
    tree: [5, 10, 15, 20, 25, 30, 35, 40],
    operation: 'find',
    target: 25,
  },
  {
    id: 'find-miss',
    label: 'bplusPresetMiss',
    tree: [5, 10, 15, 20, 25, 30, 35, 40],
    operation: 'find',
    target: 27,
  },
  {
    id: 'insert-leaf',
    label: 'bplusPresetInsert',
    tree: [5, 10, 15, 20, 25, 30, 35, 40],
    operation: 'insert',
    target: 22,
  },
  {
    id: 'insert-leaf-split',
    label: 'bplusPresetLeafSplit',
    tree: [10, 20, 30, 40, 50, 60, 70],
    operation: 'insert',
    target: 55,
  },
  {
    id: 'insert-root-split',
    label: 'bplusPresetRootSplit',
    tree: [5, 10, 15, 20, 25, 30, 35, 40, 45],
    operation: 'insert',
    target: 37,
  },
  {
    id: 'range-query',
    label: 'bplusPresetRange',
    tree: [5, 10, 15, 20, 25, 30, 35, 40],
    operation: 'range',
    target: 18,
    end: 33,
  },
] as const;

export type BplusTreePreset = (typeof BPLUS_TREE_PRESETS)[number];
export type BplusTreePresetId = BplusTreePreset['id'];

export const BPLUS_TREE_DEFAULT_INPUT: unknown = {
  preset: 'find-hit',
  tree: [5, 10, 15, 20, 25, 30, 35, 40],
  operation: 'find',
  target: 25,
  end: 33,
};

export const BPLUS_TREE_PYTHON = `# Order-4 B+ tree: internal separators, linked leaves, point search and range scan.
# Conventions: unique keys; an internal key is the minimum of its right child;
# a leaf split promotes the first key of the new right leaf; an internal split
# promotes and removes the separator between the middle children.
import inspect
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
raw_tree = raw_input.get("tree", [])
if not isinstance(raw_tree, list):
    raw_tree = []
VALUES = []
for item in raw_tree:
    if isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item):
        continue
    VALUES.append(item)
VALUES = VALUES[:20]
OPERATION = raw_input.get("operation", "find")
if OPERATION not in ("find", "insert", "range"):
    OPERATION = "find"
raw_target = raw_input.get("target", 0)
if isinstance(raw_target, bool) or not isinstance(raw_target, (int, float)) or not math.isfinite(raw_target):
    raw_target = 0
TARGET = raw_target
raw_end = raw_input.get("end", 0)
if isinstance(raw_end, bool) or not isinstance(raw_end, (int, float)) or not math.isfinite(raw_end):
    raw_end = 0
RANGE_END = raw_end
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


class BPlusNode:
    def __init__(self, node_id, leaf):
        self.id = node_id
        self.keys = []
        self.children = []
        self.leaf = leaf
        self.next = None


def new_node(leaf):
    global NEXT_ID
    NEXT_ID += 1
    node = BPlusNode("p" + str(NEXT_ID), leaf)
    NODES.append(node)
    return node


def node_payload(node):
    return {
        "id": node.id,
        "keys": list(node.keys),
        "children": [child.id for child in node.children],
        "leaf": node.leaf,
        "next": node.next.id if node.next is not None else None,
    }


def leaf_chain():
    if ROOT is None:
        return []
    node = ROOT
    while not node.leaf:
        node = node.children[0]
    leaves = []
    while node is not None:
        leaves.append(node)
        node = node.next
    return leaves


def all_records():
    records = []
    for leaf in leaf_chain():
        records.extend(leaf.keys)
    return records


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
         slot=None, child=None, split=None, inserted=None, result=None,
         range_keys=None, range_leaf_ids=None):
    if not TRACING:
        return
    payload = {
        "kind": "bplus-tree",
        "order": ORDER,
        "preset": PRESET,
        "command": OPERATION,
        "operation": operation,
        "targetValue": TARGET,
        "rangeEnd": RANGE_END,
        "rootId": ROOT.id if ROOT is not None else None,
        "nodes": [node_payload(node) for node in NODES],
        "leafOrder": [leaf.id for leaf in leaf_chain()],
        "currentNodeId": current.id if current is not None else None,
        "pathIds": [node.id for node in path] if path else [],
        "compareIndex": compare[0] if compare is not None else None,
        "compareKey": compare[1] if compare is not None else None,
        "childSlot": slot,
        "childId": child.id if child is not None else None,
        "split": split,
        "insertedKey": inserted,
        "rangeKeys": list(range_keys) if range_keys is not None else [],
        "rangeLeafIds": list(range_leaf_ids) if range_leaf_ids is not None else [],
        "result": result,
    }
    variables = {
        "order": ORDER,
        "target": TARGET,
        "rangeEnd": RANGE_END,
        "nodeCount": len(NODES),
        "treeHeight": tree_height(),
        "records": len(all_records()),
        "currentKeys": list(current.keys) if current is not None else [],
        "result": result if result is not None else "pending",
    }
    trace(
        {"type": "array", "values": all_records(), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


def child_slot(node, target):
    slot = 0
    while slot < len(node.keys) and target >= node.keys[slot]:
        slot += 1
    return slot


def find_path(target, emit_steps):
    if ROOT is None:
        return None, []
    node = ROOT
    path = [node]
    while not node.leaf:
        for index, key in enumerate(node.keys):
            if emit_steps:
                emit(
                    "inspect-internal",
                    f"索引键 {fmt(key)}：target {'≥' if target >= key else '<'} {fmt(key)}，向右/向左 / route by separator",
                    "inspect-internal",
                    current=node,
                    path=path,
                    compare=(index, key),
                )
            if target < key:
                break
        slot = child_slot(node, target)
        child = node.children[slot]
        if emit_steps:
            emit(
                "descend",
                f"沿第 {slot + 1} 个孩子继续向下 / follow child {slot + 1}",
                "descend",
                current=node,
                path=path,
                slot=slot,
                child=child,
            )
        node = child
        path.append(node)
    return node, path


def find_target(target):
    leaf, path = find_path(target, True)
    if leaf is None:
        emit("not-found", "空树：查找失败 / empty tree: not found", "not-found", result="not-found")
        return "not-found"
    for index, key in enumerate(leaf.keys):
        emit(
            "inspect-leaf",
            f"叶节点记录 {fmt(key)}：与 {fmt(target)} 比较 / compare record inside the leaf",
            "inspect-leaf",
            current=leaf,
            path=path,
            compare=(index, key),
        )
        if key == target:
            emit(
                "found",
                f"在叶子命中 {fmt(target)}；B+ 树记录只在叶子 / hit in a leaf; B+ records live only there",
                "found",
                current=leaf,
                path=path,
                compare=(index, key),
                result="found",
            )
            return "found"
        if key > target:
            break
    emit(
        "not-found",
        f"叶子中没有 {fmt(target)}：查找失败 / leaf does not contain the target",
        "not-found",
        current=leaf,
        path=path,
        result="not-found",
    )
    return "not-found"


def leaf_after(node):
    while not node.leaf:
        node = node.children[0]
    return node


def split_leaf(node):
    right = new_node(True)
    right.keys = list(node.keys[2:])
    node.keys = list(node.keys[:2])
    right.next = node.next
    node.next = right
    return {"sep": right.keys[0], "right": right, "kind": "leaf"}


def split_internal(node):
    right = new_node(False)
    promoted = node.keys[2]
    right.keys = list(node.keys[3:])
    right.children = list(node.children[3:])
    node.keys = list(node.keys[:2])
    node.children = list(node.children[:3])
    return {"sep": promoted, "right": right, "kind": "internal"}


EVENTS = []


def record_split(kind, node, parent, split_info, root_changed=False):
    EVENTS.append({
        "kind": kind,
        "nodeId": node.id,
        "leftId": node.id,
        "rightId": split_info["right"].id,
        "promotedKey": split_info["sep"],
        "parentId": parent.id if parent is not None else None,
        "rootChanged": root_changed,
    })


def node_path(target):
    """Root-to-node path; range scans keep the same root-anchored path shape."""
    if target is None:
        return []

    def walk(node, path):
        here = path + [node]
        if node is target:
            return here
        for child in node.children:
            found = walk(child, here)
            if found:
                return found
        return None

    return walk(ROOT, []) or []


def right_parent(target_id):
    """Parent that currently owns the split's right node after later restructuring."""
    def walk(node):
        for child in node.children:
            if child.id == target_id:
                return node
            found = walk(child)
            if found:
                return found
        return None

    return walk(ROOT)


def insert_rec(node, parent, key):
    if node.leaf:
        index = len(node.keys)
        while index > 0 and node.keys[index - 1] > key:
            index -= 1
        node.keys.insert(index, key)
        if len(node.keys) <= MAX_KEYS:
            return None
        split_info = split_leaf(node)
        record_split("leaf", node, parent, split_info)
        return split_info
    slot = child_slot(node, key)
    child = node.children[slot]
    promoted = insert_rec(child, node, key)
    if promoted is None:
        return None
    node.keys.insert(slot, promoted["sep"])
    node.children.insert(slot + 1, promoted["right"])
    if len(node.keys) <= MAX_KEYS:
        return None
    split_info = split_internal(node)
    record_split("internal", node, parent, split_info)
    return split_info


def insert_value(target):
    global ROOT
    if ROOT is None:
        ROOT = new_node(True)
        ROOT.keys.append(target)
        emit(
            "insert-leaf",
            f"空树：创建叶子根并插入 {fmt(target)} / empty tree: create a leaf root",
            "insert-leaf",
            current=ROOT,
            path=[ROOT],
            compare=(0, target),
            inserted=target,
            result="inserted",
        )
        return "inserted"

    leaf, path = find_path(target, True)
    if leaf is not None and target in leaf.keys:
        index = leaf.keys.index(target)
        emit(
            "duplicate",
            f"重复关键字 {fmt(target)}：拒绝插入，树不变 / duplicate rejected",
            "duplicate",
            current=leaf,
            path=path,
            compare=(index, target),
            result="duplicate",
        )
        return "duplicate"

    # Reset the event journal after the read-only locate pass.
    EVENTS.clear()
    promoted = insert_rec(ROOT, None, target)
    if promoted is not None:
        old_root = ROOT
        new_root = new_node(False)
        new_root.keys = [promoted["sep"]]
        new_root.children = [old_root, promoted["right"]]
        ROOT = new_root
        # The old root's own split event had no parent yet; the new-root event
        # below describes the same structural split with a real parent.
        EVENTS[:] = [event for event in EVENTS if event["parentId"] is not None]
        record_split("root", old_root, new_root, promoted, root_changed=True)

    leaf, path = find_path(target, False)
    if EVENTS:
        for event in EVENTS:
            parent_node = right_parent(event["rightId"])
            split = {
                "nodeId": event["nodeId"],
                "phase": "after",
                "leftId": event["leftId"],
                "rightId": event["rightId"],
                "promotedKey": event["promotedKey"],
                "parentId": parent_node.id if parent_node is not None else ROOT.id,
                "rootChanged": event["rootChanged"],
            }
            label = "叶节点分裂 / leaf split"
            if event["kind"] == "internal":
                label = "内部索引节点分裂 / internal split"
            if event["kind"] == "root":
                label = "根节点分裂 / root split"
            emit(
                "split-leaf" if event["kind"] == "leaf" else ("split-internal" if event["kind"] == "internal" else "new-root"),
                f"{label}：{fmt(event['promotedKey'])} 上升为分隔键 / separator rises",
                "split-" + event["kind"],
                current=leaf,
                path=path,
                split=split,
            )
    if leaf is None:
        emit("not-found", "插入后无法重新定位叶子 / cannot relocate the target leaf", "not-found", result="not-found")
        return "not-found"
    index = leaf.keys.index(target)
    emit(
        "insert-leaf",
        f"插入完成：{fmt(target)} 只写入叶子，叶链保持有序 / record inserted into the leaf layer",
        "insert-leaf",
        current=leaf,
        path=path,
        compare=(index, target),
        inserted=target,
        result="inserted",
    )
    return "inserted"


def contains_silent(target):
    if ROOT is None:
        return False
    node = ROOT
    while not node.leaf:
        node = node.children[child_slot(node, target)]
    return target in node.keys


def build_from_values(values):
    global TRACING, ROOT
    TRACING = False
    for value in values:
        if contains_silent(value):
            continue
        if ROOT is None:
            ROOT = new_node(True)
            ROOT.keys.append(value)
        else:
            EVENTS.clear()
            promoted = insert_rec(ROOT, None, value)
            if promoted is not None:
                old_root = ROOT
                new_root = new_node(False)
                new_root.keys = [promoted["sep"]]
                new_root.children = [old_root, promoted["right"]]
                ROOT = new_root
            EVENTS.clear()
    TRACING = True


def range_search(low, high):
    global FINAL_RANGE_KEYS, FINAL_RANGE_LEAF_IDS
    FINAL_RANGE_KEYS = []
    FINAL_RANGE_LEAF_IDS = []
    if ROOT is None:
        emit("range-end", "空树：范围为空 / empty tree: empty range", "range-end", result="range",
             range_keys=[], range_leaf_ids=[])
        return "range"
    leaf, path = find_path(low, True)
    if leaf is None:
        emit("range-end", "范围为空 / empty range", "range-end", result="range", range_keys=[], range_leaf_ids=[])
        return "range"
    emit(
        "range-start",
        f"定位到起点叶子 {keys_text(leaf)}：沿叶链向右扫描 / start at the lower-bound leaf and follow next",
        "range-start",
        current=leaf,
        path=path,
        range_keys=[],
        range_leaf_ids=[leaf.id],
    )
    collected = []
    leaf_ids = []
    node = leaf
    while node is not None:
        took_any = False
        for index, key in enumerate(node.keys):
            if key < low:
                continue
            if key > high:
                FINAL_RANGE_KEYS = list(collected)
                FINAL_RANGE_LEAF_IDS = list(leaf_ids)
                emit(
                    "range-end",
                    f"记录 {fmt(key)} 已超过上界 {fmt(high)}：停止 / exceeded the upper bound",
                    "range-end",
                    current=node,
                    path=node_path(node),
                    compare=(index, key),
                    result="range",
                    range_keys=collected,
                    range_leaf_ids=leaf_ids,
                )
                return "range"
            collected.append(key)
            took_any = True
            if node.id not in leaf_ids:
                leaf_ids.append(node.id)
            emit(
                "range-scan",
                f"收集 {fmt(key)}；继续沿叶链 / collect {fmt(key)} and continue",
                "range-scan",
                current=node,
                path=node_path(node),
                compare=(index, key),
                range_keys=collected,
                range_leaf_ids=leaf_ids,
            )
        next_node = node.next
        if next_node is None:
            break
        if took_any and next_node.keys and next_node.keys[0] > high:
            break
        node = next_node
    FINAL_RANGE_KEYS = list(collected)
    FINAL_RANGE_LEAF_IDS = list(leaf_ids)
    emit(
        "range-end",
        f"范围查询完成：{len(collected)} 条记录 / range complete",
        "range-end",
        current=None,
        path=[],
        result="range",
        range_keys=collected,
        range_leaf_ids=leaf_ids,
    )
    return "range"


build_from_values(VALUES)

FINAL_RANGE_KEYS = []
FINAL_RANGE_LEAF_IDS = []

emit(
    "init",
    f"4 阶 B+ 树：内部只存分隔键，所有记录在叶子 / order-4 B+ tree ready",
    "init",
    current=ROOT,
    path=[ROOT] if ROOT is not None else [],
)

if OPERATION == "find":
    outcome = find_target(TARGET)
elif OPERATION == "insert":
    outcome = insert_value(TARGET)
else:
    if TARGET > RANGE_END:
        TARGET, RANGE_END = RANGE_END, TARGET
    outcome = range_search(TARGET, RANGE_END)

emit(
    "done",
    "B+ 树操作完成 / operation complete",
    "done",
    result=outcome,
    range_keys=FINAL_RANGE_KEYS,
    range_leaf_ids=FINAL_RANGE_LEAF_IDS,
)
`;

export function bplusTreePresetFromInput(input: unknown): BplusTreePresetId | null {
  if (!input || typeof input !== 'object') return null;
  const preset = (input as { preset?: unknown }).preset;
  return typeof preset === 'string' && BPLUS_TREE_PRESETS.some((entry) => entry.id === preset)
    ? (preset as BplusTreePresetId)
    : null;
}

export function bplusTreePresetInput(id: BplusTreePresetId): unknown {
  const preset = BPLUS_TREE_PRESETS.find((entry) => entry.id === id) ?? BPLUS_TREE_PRESETS[0];
  return {
    preset: preset.id,
    tree: [...preset.tree],
    operation: preset.operation,
    target: preset.target,
    end: 'end' in preset ? preset.end : preset.target,
  };
}

export function bplusTreePythonExample(): string {
  return BPLUS_TREE_PYTHON;
}

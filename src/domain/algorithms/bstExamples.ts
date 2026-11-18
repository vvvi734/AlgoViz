/**
 * T1: the REAL Python binary-search-tree teaching program.
 *
 * One program handles `find`, `insert` and `delete`. Nodes are genuine Python
 * objects with stable teaching ids (`b1`, `b2`, ...). Insertion assigns ids in
 * real insertion order; deletion never renames a survivor. A two-child delete
 * physically transplants the in-order successor node, so its stable id survives
 * the move and the target object is genuinely unlinked.
 *
 * Every snapshot is a full picture of the attached tree after the operation
 * named on that frame. `removedNode` reports the object that really left the
 * tree, including the parent link and replacement child. It is NOT inferred
 * from a value array or from node positions on screen.
 */

export const BST_COMMAND = ['find', 'insert', 'delete'] as const;
export type BstCommand = (typeof BST_COMMAND)[number];

export const BST_DELETE_CASES = ['leaf', 'one-child', 'two-child'] as const;
export type BstDeleteCase = (typeof BST_DELETE_CASES)[number];

/** Official presets, each with its own tree and target. */
export const BST_PRESETS = [
  { id: 'find-success', command: 'find', label: 'bstPresetFindSuccess', tree: [50, 30, 70, 20, 40, 60, 80], target: 40 },
  { id: 'find-missing', command: 'find', label: 'bstPresetFindMissing', tree: [50, 30, 70, 20, 40, 60, 80], target: 55 },
  { id: 'insert', command: 'insert', label: 'bstPresetInsert', tree: [50, 30, 70, 20, 40, 60, 80], target: 35 },
  { id: 'delete-leaf', command: 'delete', label: 'bstPresetDeleteLeaf', tree: [50, 30, 70, 20, 40, 60, 80], target: 20 },
  { id: 'delete-one', command: 'delete', label: 'bstPresetDeleteOne', tree: [50, 30, 70, 20, 40, 60, 80, null, null, null, null, null, 65], target: 60 },
  { id: 'delete-two', command: 'delete', label: 'bstPresetDeleteTwo', tree: [50, 30, 70, 20, 40, 60, 80, null, null, null, null, null, 65], target: 50 },
] as const;

export type BstPreset = (typeof BST_PRESETS)[number];
export type BstPresetId = BstPreset['id'];

export const BST_DEFAULT_INPUT: unknown = {
  preset: 'find-success',
  operation: 'find',
  tree: [50, 30, 70, 20, 40, 60, 80],
  target: 40,
};

export const BST_PYTHON = `# Binary search tree: real TreeNode objects and real left/right references.
raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
OPERATION = raw_input.get("operation", "find")
if OPERATION not in ("find", "insert", "delete"):
    OPERATION = "find"
values = raw_input.get("tree", [])
if not isinstance(values, list):
    values = []
target = raw_input.get("target", 0)
if isinstance(target, bool) or not isinstance(target, (int, float)):
    target = 0
TARGET = target
PRESET = raw_input.get("preset")
if PRESET is not None and not isinstance(PRESET, str):
    PRESET = None

class TreeNode:
    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.left = None
        self.right = None
    def __repr__(self):
        return "TreeNode(" + self.node_id + "=" + str(self.value) + ")"

ROOT = None
NEXT_ID = 0
NODES = []
PATH = []
VISITED = []

def new_node(value):
    global NEXT_ID
    NEXT_ID += 1
    node = TreeNode("b" + str(NEXT_ID), value)
    NODES.append(node)
    return node

def insert_plain(value):
    global ROOT
    node = new_node(value)
    if ROOT is None:
        ROOT = node
        return
    current = ROOT
    while True:
        if value < current.value:
            if current.left is None:
                current.left = node
                return
            current = current.left
        else:
            if current.right is None:
                current.right = node
                return
            current = current.right

def parent_of(node):
    if node is None or ROOT is node:
        return None
    stack = [ROOT]
    while stack:
        current = stack.pop()
        if current is None:
            continue
        if current.left is node or current.right is node:
            return current
        if current.left is not None:
            stack.append(current.left)
        if current.right is not None:
            stack.append(current.right)
    return None

def inorder_nodes(node=ROOT):
    if node is None:
        return []
    result = []
    stack = []
    current = node
    while current is not None or stack:
        while current is not None:
            stack.append(current)
            current = current.left
        current = stack.pop()
        result.append(current)
        current = current.right
    return result

def tree_nodes():
    return inorder_nodes(ROOT)

def inorder_ids():
    return [node.node_id for node in tree_nodes()]

def snapshot(operation, current=None, path=None, visited=None, result=None,
             target_node=None, parent=None, side=None, inserted=None,
             successor=None, replacement=None, removed=None, old_root=None,
             delete_case=None, next_node=None):
    nodes_now = tree_nodes()
    nodes = []
    for node in nodes_now:
        nodes.append({
            "id": node.node_id,
            "value": node.value,
            "leftId": node.left.node_id if node.left is not None else None,
            "rightId": node.right.node_id if node.right is not None else None,
        })
    return {
        "kind": "bst",
        "preset": PRESET,
        "command": OPERATION,
        "operation": operation,
        "deleteCase": delete_case,
        "targetValue": TARGET,
        "rootId": ROOT.node_id if ROOT is not None else None,
        "nodes": nodes,
        "currentNodeId": current.node_id if current is not None else None,
        "pathIds": [node.node_id for node in (path or [])],
        "visitedIds": [node.node_id for node in (visited or [])],
        "inorderIds": inorder_ids(),
        "targetNodeId": target_node.node_id if target_node is not None else None,
        "nextNodeId": next_node.node_id if next_node is not None else None,
        "parentId": parent.node_id if parent is not None else None,
        "side": side,
        "insertedId": inserted.node_id if inserted is not None else None,
        "successorId": successor.node_id if successor is not None else None,
        "replacementId": replacement.node_id if replacement is not None else None,
        "removedNode": removed,
        "oldRootId": old_root.node_id if old_root is not None else None,
        "result": result,
    }

def emit(operation, message, line, lesson, **kwargs):
    current = kwargs.get("current")
    path = kwargs.get("path")
    visited = kwargs.get("visited")
    state = {
        "type": "array",
        "values": [node.value for node in tree_nodes()],
        "focus": [current.value] if current is not None else [],
        "done": operation == "done",
    }
    variables = {
        "operation": OPERATION,
        "target": TARGET,
        "current": current.value if current is not None else None,
        "path": [node.node_id for node in (path or [])],
        "comparisons": [node.value for node in (visited or [])],
        "root": ROOT.value if ROOT is not None else None,
        "inorder": [node.value for node in tree_nodes()],
    }
    trace(state, message, line=line, variables=variables,
          lesson_step=lesson, structure=snapshot(operation, **kwargs))

def search(value):
    current = ROOT
    path = []
    visited = []
    while current is not None:
        path.append(current)
        visited.append(current)
        emit("inspect", "比较 " + str(value) + " 与节点 " + str(current.value), 116, "compare",
             current=current, path=path, visited=visited, target_node=None)
        if value == current.value:
            return current, path, visited, "equal"
        if value < current.value:
            next_node = current.left
            emit("go-left", "目标更小，走左子树 / go left", 122, "direction",
                 current=current, path=path, visited=visited, next_node=next_node)
            if next_node is None:
                return current, path, visited, "missing"
            current = next_node
        else:
            next_node = current.right
            emit("go-right", "目标更大，走右子树 / go right", 128, "direction",
                 current=current, path=path, visited=visited, next_node=next_node)
            if next_node is None:
                return current, path, visited, "missing"
            current = next_node
    return None, [], [], "missing"

ACTIVE_DELETE_CASE = None

def finish(result):
    emit("done", "操作结束 / done", 286, "done", result=result,
         inserted=None, successor=None, replacement=None, removed=None,
         old_root=None, delete_case=ACTIVE_DELETE_CASE)

# Build the initial tree by real BST insertion in the supplied order.
for value in values:
    if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
        continue
    insert_plain(value)

emit("init", "初始化二叉搜索树 / init BST", 54, "init", result=None)

if OPERATION == "find":
    found, path, visited, outcome = search(TARGET)
    if outcome == "equal":
        emit("found", "查找成功：找到 " + str(TARGET) + " / found", 180, "found",
             current=found, path=path, visited=visited, target_node=found, result="found")
        finish("found")
    else:
        emit("not-found", "查找失败：不存在 " + str(TARGET) + " / not found", 184, "not-found",
             current=found, path=path, visited=visited, result="not-found")
        finish("not-found")

elif OPERATION == "insert":
    found, path, visited, outcome = search(TARGET)
    if outcome == "equal":
        emit("duplicate", "重复键 " + str(TARGET) + "：拒绝插入 / duplicate", 198, "duplicate",
             current=found, path=path, visited=visited, target_node=found, result="duplicate")
        finish("duplicate")
    else:
        if found is None:
            node = new_node(TARGET)
            ROOT = node
            emit("attach", "空树：新节点成为根 / new root", 206, "insert",
                 current=node, path=[node], inserted=node, result="inserted")
            finish("inserted")
        else:
            node = new_node(TARGET)
            side = "left" if TARGET < found.value else "right"
            if side == "left":
                found.left = node
            else:
                found.right = node
            new_path = path + [node]
            emit("attach", "创建节点并挂到父节点 " + found.node_id + " 的 " + side, 216, "insert",
                 current=node, path=new_path, inserted=node, parent=found, side=side,
                 result="inserted")
            finish("inserted")

else:
    found, path, visited, outcome = search(TARGET)
    if outcome != "equal":
        emit("not-found", "删除失败：不存在 " + str(TARGET) + " / missing", 228, "not-found",
             current=found, path=path, visited=visited, result="missing")
        finish("missing")
    else:
        target_node = found
        target_path = path
        parent = parent_of(target_node)
        side = None if parent is None else ("left" if parent.left is target_node else "right")
        emit("locate", "定位待删除节点 " + target_node.node_id + " / locate", 238, "delete-locate",
             current=target_node, path=target_path, visited=visited, target_node=target_node)
        child_count = (1 if target_node.left is not None else 0) + (1 if target_node.right is not None else 0)
        if child_count == 0:
            ACTIVE_DELETE_CASE = "leaf"
            old_root = target_node if parent is None else None
            if parent is None:
                ROOT = None
            elif side == "left":
                parent.left = None
            else:
                parent.right = None
            removed = {
                "id": target_node.node_id, "value": target_node.value,
                "parentId": parent.node_id if parent is not None else None,
                "side": side, "role": "target", "replacementId": None,
            }
            target_node.left = None
            target_node.right = None
            emit("delete-leaf", "删除叶子 " + target_node.node_id + "：父指针置空 / remove leaf", 252,
                 "delete-leaf", current=None, path=[], visited=[], result="deleted",
                 removed=removed, old_root=old_root, delete_case="leaf")
            finish("deleted")
        elif child_count == 1:
            ACTIVE_DELETE_CASE = "one-child"
            child = target_node.left if target_node.left is not None else target_node.right
            old_root = target_node if parent is None else None
            if parent is None:
                ROOT = child
            elif side == "left":
                parent.left = child
            else:
                parent.right = child
            removed = {
                "id": target_node.node_id, "value": target_node.value,
                "parentId": parent.node_id if parent is not None else None,
                "side": side, "role": "target",
                "replacementId": child.node_id if child is not None else None,
            }
            target_node.left = None
            target_node.right = None
            emit("delete-one", "删除单孩子 " + target_node.node_id + "：孩子接替原位置 / bypass", 264,
                 "delete-one", current=None, path=[], visited=[], result="deleted",
                 replacement=child, removed=removed, old_root=old_root, delete_case="one-child")
            finish("deleted")
        else:
            ACTIVE_DELETE_CASE = "two-child"
            successor_path = target_path[:]
            successor = target_node.right
            successor_path.append(successor)
            while successor.left is not None:
                successor = successor.left
                successor_path.append(successor)
            for candidate in successor_path[len(target_path):]:
                emit("successor-search", "寻找右子树最左节点 / successor search", 274,
                     "successor", current=candidate, path=successor_path[:successor_path.index(candidate) + 1],
                     visited=[], target_node=target_node, successor=successor,
                     delete_case="two-child")
            emit("successor-found", "中序后继是 " + successor.node_id + " = " + str(successor.value), 276,
                 "successor", current=successor, path=successor_path, visited=[],
                 target_node=target_node, successor=successor, delete_case="two-child")
            successor_parent = parent_of(successor)
            successor_side = None if successor_parent is None else ("left" if successor_parent.left is successor else "right")
            successor_right = successor.right
            if successor_parent is target_node:
                target_node.right = successor_right
            elif successor_side == "left":
                successor_parent.left = successor_right
            else:
                successor_parent.right = successor_right
            successor.right = None
            removed_successor = {
                "id": successor.node_id, "value": successor.value,
                "parentId": successor_parent.node_id if successor_parent is not None else None,
                "side": successor_side, "role": "successor",
                "replacementId": successor_right.node_id if successor_right is not None else None,
            }
            emit("successor-detach", "后继 " + successor.node_id + " 离开原位置，原右孩子接回 / detach successor", 280,
                 "successor-detach", current=target_node, path=target_path, visited=[],
                 target_node=target_node, successor=successor,
                 replacement=successor_right, removed=removed_successor, delete_case="two-child")
            old_root = target_node if parent is None else None
            if parent is None:
                ROOT = successor
            elif parent.left is target_node:
                parent.left = successor
            else:
                parent.right = successor
            successor.left = target_node.left
            successor.right = target_node.right
            removed_target = {
                "id": target_node.node_id, "value": target_node.value,
                "parentId": parent.node_id if parent is not None else None,
                "side": side, "role": "target", "replacementId": successor.node_id,
            }
            new_path = [successor] if parent is None else target_path[:-1] + [successor]
            target_node.left = None
            target_node.right = None
            emit("transplant", "后继 " + successor.node_id + " 接入目标位置，目标节点被摘除 / transplant", 284,
                 "transplant", current=successor, path=new_path, visited=[], result="deleted",
                 replacement=successor, successor=successor, removed=removed_target,
                 old_root=old_root, delete_case="two-child")
            finish("deleted")
`;

export function bstCommandFromInput(input: unknown): BstCommand {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'find';
  const operation = (input as { operation?: unknown }).operation;
  return operation === 'insert' || operation === 'delete' ? operation : 'find';
}

export function bstTargetFromInput(input: unknown): number {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 0;
  const target = (input as { target?: unknown }).target;
  return typeof target === 'number' && Number.isFinite(target) ? target : 0;
}

export function bstTreeFromInput(input: unknown): unknown[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];
  const tree = (input as { tree?: unknown }).tree;
  return Array.isArray(tree) ? tree : [];
}

export function bstPresetFromInput(input: unknown): BstPresetId | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const preset = (input as { preset?: unknown }).preset;
  return BST_PRESETS.some((item) => item.id === preset) ? (preset as BstPresetId) : null;
}

export function bstPresetInput(id: BstPresetId): unknown {
  const preset = BST_PRESETS.find((item) => item.id === id) ?? BST_PRESETS[0];
  return {
    preset: preset.id,
    operation: preset.command,
    tree: [...preset.tree],
    target: preset.target,
  };
}

export function bstPythonExample(): string {
  return BST_PYTHON;
}

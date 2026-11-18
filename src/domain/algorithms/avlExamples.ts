/**
 * T2: the REAL Python AVL teaching program.
 *
 * One program handles insertion and deletion. Nodes are genuine Python objects
 * with stable teaching ids (`a1`, `a2`, ...), real `left`/`right`/`parent`
 * references, real subtree heights and real rotations. Every rotation frame is
 * emitted before or after actual pointer rewiring, never from a visual-only
 * animation. A two-child delete physically transplants the in-order successor
 * and keeps its id, matching the T1 BST teaching contract.
 */

export const AVL_COMMAND = ['insert', 'delete'] as const;
export type AvlCommand = (typeof AVL_COMMAND)[number];

export const AVL_DELETE_CASES = ['leaf', 'one-child', 'two-child'] as const;
export type AvlDeleteCase = (typeof AVL_DELETE_CASES)[number];

/** Official presets, each with its own AVL-valid starting tree and target. */
export const AVL_PRESETS = [
  { id: 'insert-ll', command: 'insert', label: 'avlPresetInsertLL', tree: [30, 20, 40, 10], target: 5 },
  { id: 'insert-rr', command: 'insert', label: 'avlPresetInsertRR', tree: [30, 20, 40, 50], target: 60 },
  { id: 'insert-lr', command: 'insert', label: 'avlPresetInsertLR', tree: [50, 30, 70, 20, 40, 60, 80, 10, 25], target: 27 },
  { id: 'insert-rl', command: 'insert', label: 'avlPresetInsertRL', tree: [50, 30, 70, 60, 55], target: 52 },
  { id: 'insert-balanced', command: 'insert', label: 'avlPresetInsertBalanced', tree: [30, 20, 40, 10, 25, 35], target: 28 },
  { id: 'delete-leaf', command: 'delete', label: 'avlPresetDeleteLeaf', tree: [30, 20, 40, 10, 25, 35, 5], target: 35 },
  { id: 'delete-one', command: 'delete', label: 'avlPresetDeleteOne', tree: [30, 20, 40, 10, 25, 35, 5], target: 40 },
  { id: 'delete-two', command: 'delete', label: 'avlPresetDeleteTwo', tree: [50, 30, 70, 20, 40, 60, 80, 65], target: 50 },
  { id: 'delete-cascade', command: 'delete', label: 'avlPresetDeleteCascade', tree: [3, 9, 1, 6, 8, 11, 12, 2, 10, 7, 5, 4], target: 12 },
  { id: 'delete-missing', command: 'delete', label: 'avlPresetDeleteMissing', tree: [30, 20, 40, 10, 25, 35], target: 50 },
] as const;

export type AvlPreset = (typeof AVL_PRESETS)[number];
export type AvlPresetId = AvlPreset['id'];

export const AVL_DEFAULT_INPUT: unknown = {
  preset: 'insert-ll',
  operation: 'insert',
  tree: [30, 20, 40, 10],
  target: 5,
};

export const AVL_PYTHON = `# AVL tree: real node objects, real left/right/parent links and real rotations.
raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
OPERATION = raw_input.get("operation", "insert")
if OPERATION not in ("insert", "delete"):
    OPERATION = "insert"
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
# Initial construction must not leak intermediate rotation frames into the run.
SILENT = True

class AvlNode:
    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.left = None
        self.right = None
        self.parent = None
        self.height = 1
    def __repr__(self):
        return "AvlNode(" + self.node_id + "=" + str(self.value) + ")"

ROOT = None
NEXT_ID = 0
NODES = []
ACTIVE_DELETE_CASE = None

def new_node(value):
    global NEXT_ID
    NEXT_ID += 1
    node = AvlNode("a" + str(NEXT_ID), value)
    NODES.append(node)
    return node

def height(node):
    return node.height if node is not None else 0

def balance_factor(node):
    if node is None:
        return 0
    return height(node.left) - height(node.right)

def update_height(node):
    if node is not None:
        node.height = 1 + max(height(node.left), height(node.right))

def refresh_heights(node=None):
    # Real post-order height recomputation after every structural change.
    if node is None:
        node = ROOT
        if node is None:
            return
    refresh_heights_node(node)

def refresh_heights_node(node):
    if node is None:
        return
    refresh_heights_node(node.left)
    refresh_heights_node(node.right)
    update_height(node)

def path_to(node):
    result = []
    current = node
    while current is not None:
        result.append(current)
        current = current.parent
    result.reverse()
    return result

def inorder_nodes(node=None):
    if node is None:
        node = ROOT
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
             delete_case=None, next_node=None, imbalance=None, rotation_case=None,
             rotation_phase=None, pivot=None, promoted=None, rotation_step=None,
             rotation_total=None):
    refresh_heights()
    nodes_now = tree_nodes()
    nodes = []
    for node in nodes_now:
        nodes.append({
            "id": node.node_id,
            "value": node.value,
            "leftId": node.left.node_id if node.left is not None else None,
            "rightId": node.right.node_id if node.right is not None else None,
            "height": node.height,
            "balance": balance_factor(node),
        })
    return {
        "kind": "avl",
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
        "imbalanceId": imbalance.node_id if imbalance is not None else None,
        "rotationCase": rotation_case,
        "rotationPhase": rotation_phase,
        "pivotId": pivot.node_id if pivot is not None else None,
        "promotedId": promoted.node_id if promoted is not None else None,
        "rotationStep": rotation_step,
        "rotationTotal": rotation_total,
        "result": result,
    }

def emit(operation, message, line, lesson, **kwargs):
    if SILENT:
        return
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
        "root": ROOT.value if ROOT is not None else None,
        "inorder": [node.value for node in tree_nodes()],
        "rotationCase": kwargs.get("rotation_case"),
        "rotationStep": kwargs.get("rotation_step"),
        "rotationTotal": kwargs.get("rotation_total"),
    }
    trace(state, message, line=line, variables=variables,
          lesson_step=lesson, structure=snapshot(operation, **kwargs))

def rotation_case(node):
    factor = balance_factor(node)
    if factor > 1:
        return "LL" if balance_factor(node.left) >= 0 else "LR"
    if factor < -1:
        return "RR" if balance_factor(node.right) <= 0 else "RL"
    return None

def rotate_right(x, case, step, total):
    global ROOT
    y = x.left
    if y is None:
        return x
    old_parent = x.parent
    beta = y.right
    emit("rotate-right", "右旋：以 " + x.node_id + " 为轴，左孩子 " + y.node_id + " 上升 / rotate right", 238,
         "rotate-right", current=x, path=path_to(x), visited=[], imbalance=x,
         rotation_case=case, rotation_phase="before", pivot=x, promoted=y,
         rotation_step=step, rotation_total=total,
         delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
    y.parent = old_parent
    if old_parent is None:
        ROOT = y
    elif old_parent.left is x:
        old_parent.left = y
    else:
        old_parent.right = y
    y.right = x
    x.parent = y
    x.left = beta
    if beta is not None:
        beta.parent = x
    update_height(x)
    update_height(y)
    emit("rotate-right", "右旋完成：" + y.node_id + " 接管原子树", 239,
         "rotate-right", current=x, path=path_to(x), visited=[], imbalance=x,
         rotation_case=case, rotation_phase="after", pivot=x, promoted=y,
         rotation_step=step, rotation_total=total,
         delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
    return y

def rotate_left(x, case, step, total):
    global ROOT
    y = x.right
    if y is None:
        return x
    old_parent = x.parent
    beta = y.left
    emit("rotate-left", "左旋：以 " + x.node_id + " 为轴，右孩子 " + y.node_id + " 上升 / rotate left", 250,
         "rotate-left", current=x, path=path_to(x), visited=[], imbalance=x,
         rotation_case=case, rotation_phase="before", pivot=x, promoted=y,
         rotation_step=step, rotation_total=total,
         delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
    y.parent = old_parent
    if old_parent is None:
        ROOT = y
    elif old_parent.left is x:
        old_parent.left = y
    else:
        old_parent.right = y
    y.left = x
    x.parent = y
    x.right = beta
    if beta is not None:
        beta.parent = x
    update_height(x)
    update_height(y)
    emit("rotate-left", "左旋完成：" + y.node_id + " 接管原子树", 251,
         "rotate-left", current=x, path=path_to(x), visited=[], imbalance=x,
         rotation_case=case, rotation_phase="after", pivot=x, promoted=y,
         rotation_step=step, rotation_total=total,
         delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
    return y

def perform_balance(node):
    case = rotation_case(node)
    total = 2 if case in ("LR", "RL") else 1
    emit("imbalance", "检测到 " + case + " 失衡：节点 " + node.node_id + " 的平衡因子为 " + str(balance_factor(node)), 226,
         "imbalance", current=node, path=path_to(node), visited=[], imbalance=node,
         rotation_case=case, rotation_phase=None, pivot=node, promoted=None,
         rotation_step=1, rotation_total=total,
         delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
    if case == "LL":
        return rotate_right(node, case, 1, 1)
    if case == "RR":
        return rotate_left(node, case, 1, 1)
    if case == "LR":
        rotate_left(node.left, case, 1, 2)
        return rotate_right(node, case, 2, 2)
    if case == "RL":
        rotate_right(node.right, case, 1, 2)
        return rotate_left(node, case, 2, 2)
    return node

def balance_up(start):
    node = start
    while node is not None:
        refresh_heights()
        factor = balance_factor(node)
        op = "height" if OPERATION == "insert" else "balance"
        emit(op, "更新 " + node.node_id + " 高度=" + str(node.height) + "，平衡因子=" + str(factor), 232,
             "height", current=node, path=path_to(node), visited=[],
             delete_case=ACTIVE_DELETE_CASE, result=("inserted" if OPERATION == "insert" else "deleted"))
        if abs(factor) > 1:
            new_root = perform_balance(node)
            node = new_root.parent
        else:
            node = node.parent

def search_target():
    current = ROOT
    path = []
    visited = []
    while current is not None:
        path.append(current)
        visited.append(current)
        emit("inspect", "比较 " + str(TARGET) + " 与节点 " + str(current.value), 168, "compare",
             current=current, path=path, visited=visited)
        if TARGET == current.value:
            return current, path, visited, "equal"
        if TARGET < current.value:
            next_node = current.left
            emit("go-left", "目标更小，走左子树 / go left", 174, "direction",
                 current=current, path=path, visited=visited, next_node=next_node)
            if next_node is None:
                return current, path, visited, "missing"
            current = next_node
        else:
            next_node = current.right
            emit("go-right", "目标更大，走右子树 / go right", 180, "direction",
                 current=current, path=path, visited=visited, next_node=next_node)
            if next_node is None:
                return current, path, visited, "missing"
            current = next_node
    return None, [], [], "missing"

def build_insert(value):
    global ROOT, NEXT_ID
    node = new_node(value)
    if ROOT is None:
        ROOT = node
        return
    current = ROOT
    while True:
        if value == current.value:
            NODES.pop()
            NEXT_ID -= 1
            return
        if value < current.value:
            if current.left is None:
                current.left = node
                node.parent = current
                break
            current = current.left
        else:
            if current.right is None:
                current.right = node
                node.parent = current
                break
            current = current.right
    node = current
    refresh_heights()
    while node is not None:
        update_height(node)
        factor = balance_factor(node)
        if abs(factor) > 1:
            new_root = perform_balance(node)
            node = new_root.parent
        else:
            node = node.parent

def finish(result):
    emit("done", "操作结束 / done", 300, "done", current=None, path=[], visited=[],
         result=result, delete_case=None, removed=None, old_root=None)

def insert_operation():
    global ROOT
    found, path, visited, outcome = search_target()
    if outcome == "equal":
        emit("duplicate", "重复键 " + str(TARGET) + "：拒绝插入 / duplicate", 192, "duplicate",
             current=found, path=path, visited=visited, target_node=found, result="duplicate")
        finish("duplicate")
        return
    if found is None:
        node = new_node(TARGET)
        ROOT = node
        emit("attach", "空树：新节点成为根 / new root", 202, "insert",
             current=node, path=[node], inserted=node, target_node=node, result="inserted")
        balance_up(None)
        finish("inserted")
        return
    node = new_node(TARGET)
    side = "left" if TARGET < found.value else "right"
    node.parent = found
    if side == "left":
        found.left = node
    else:
        found.right = node
    new_path = path + [node]
    emit("attach", "创建节点并挂到父节点 " + found.node_id + " 的 " + side, 214, "insert",
         current=node, path=new_path, inserted=node, parent=found, side=side,
         target_node=node, result="inserted")
    balance_up(found)
    finish("inserted")

def delete_operation():
    global ROOT, ACTIVE_DELETE_CASE
    found, path, visited, outcome = search_target()
    if outcome != "equal":
        emit("not-found", "删除失败：不存在 " + str(TARGET) + " / missing", 228, "not-found",
             current=found, path=path, visited=visited, result="missing")
        finish("missing")
        return
    target_node = found
    target_path = path
    parent = target_node.parent
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
        target_node.parent = None
        emit("delete-leaf", "删除叶子 " + target_node.node_id + "：父指针置空 / remove leaf", 260,
             "delete-leaf", current=None, path=[], visited=[], result="deleted",
             removed=removed, old_root=old_root, delete_case="leaf")
        refresh_heights()
        balance_up(parent)
        finish("deleted")
        return
    if child_count == 1:
        ACTIVE_DELETE_CASE = "one-child"
        child = target_node.left if target_node.left is not None else target_node.right
        old_root = target_node if parent is None else None
        if parent is None:
            ROOT = child
        elif side == "left":
            parent.left = child
        else:
            parent.right = child
        child.parent = parent
        removed = {
            "id": target_node.node_id, "value": target_node.value,
            "parentId": parent.node_id if parent is not None else None,
            "side": side, "role": "target",
            "replacementId": child.node_id,
        }
        target_node.left = None
        target_node.right = None
        target_node.parent = None
        emit("delete-one", "删除单孩子 " + target_node.node_id + "：孩子接替原位置 / bypass", 274,
             "delete-one", current=None, path=[], visited=[], result="deleted",
             replacement=child, removed=removed, old_root=old_root, delete_case="one-child")
        refresh_heights()
        balance_up(parent)
        finish("deleted")
        return
    ACTIVE_DELETE_CASE = "two-child"
    old_root = target_node if parent is None else None
    successor = target_node.right
    successor_path = path_to(successor)
    while successor.left is not None:
        successor = successor.left
    for candidate in successor_path[len(target_path):]:
        emit("successor-search", "寻找右子树最左节点 / successor search", 286,
             "successor", current=candidate, path=path_to(candidate),
             visited=[], target_node=target_node, successor=successor,
             delete_case="two-child")
    emit("successor-found", "中序后继是 " + successor.node_id + " = " + str(successor.value), 288,
         "successor", current=successor, path=path_to(successor), visited=[],
         target_node=target_node, successor=successor, delete_case="two-child")
    successor_parent = successor.parent
    successor_side = "left" if successor_parent.left is successor else "right"
    successor_right = successor.right
    if successor_parent is target_node:
        target_node.right = successor_right
    elif successor_side == "left":
        successor_parent.left = successor_right
    else:
        successor_parent.right = successor_right
    if successor_right is not None:
        successor_right.parent = successor_parent
    successor.right = None
    removed_successor = {
        "id": successor.node_id, "value": successor.value,
        "parentId": successor_parent.node_id,
        "side": successor_side, "role": "successor",
        "replacementId": successor_right.node_id if successor_right is not None else None,
    }
    emit("successor-detach", "后继 " + successor.node_id + " 离开原位置，原右孩子接回 / detach successor", 292,
         "successor-detach", current=target_node, path=target_path, visited=[],
         target_node=target_node, successor=successor,
         replacement=successor_right, removed=removed_successor, delete_case="two-child")
    if parent is None:
        ROOT = successor
    elif parent.left is target_node:
        parent.left = successor
    else:
        parent.right = successor
    successor.parent = parent
    successor.left = target_node.left
    if successor.left is not None:
        successor.left.parent = successor
    successor.right = target_node.right
    if successor.right is not None:
        successor.right.parent = successor
    removed_target = {
        "id": target_node.node_id, "value": target_node.value,
        "parentId": parent.node_id if parent is not None else None,
        "side": side, "role": "target", "replacementId": successor.node_id,
    }
    new_path = [successor] if parent is None else target_path[:-1] + [successor]
    target_node.left = None
    target_node.right = None
    target_node.parent = None
    emit("transplant", "后继 " + successor.node_id + " 接入目标位置，目标节点被摘除 / transplant", 296,
         "transplant", current=successor, path=new_path, visited=[], result="deleted",
         replacement=successor, successor=successor, removed=removed_target,
         old_root=old_root, delete_case="two-child")
    refresh_heights()
    if successor_parent is target_node:
        start = successor
    else:
        start = successor_parent
    balance_up(start)
    finish("deleted")

for value in values:
    if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
        continue
    build_insert(value)

SILENT = False
emit("init", "初始化 AVL 树 / init AVL", 150, "init", result=None)
if OPERATION == "insert":
    insert_operation()
else:
    delete_operation()
`;
export function avlCommandFromInput(input: unknown): AvlCommand {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'insert';
  const operation = (input as { operation?: unknown }).operation;
  return operation === 'delete' ? 'delete' : 'insert';
}

export function avlTargetFromInput(input: unknown): number {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 0;
  const target = (input as { target?: unknown }).target;
  return typeof target === 'number' && Number.isFinite(target) ? target : 0;
}

export function avlTreeFromInput(input: unknown): unknown[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];
  const tree = (input as { tree?: unknown }).tree;
  return Array.isArray(tree) ? tree : [];
}

export function avlPresetFromInput(input: unknown): AvlPresetId | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const preset = (input as { preset?: unknown }).preset;
  return AVL_PRESETS.some((item) => item.id === preset) ? (preset as AvlPresetId) : null;
}

export function avlPresetInput(id: AvlPresetId): unknown {
  const preset = AVL_PRESETS.find((item) => item.id === id) ?? AVL_PRESETS[0];
  return {
    preset: preset.id,
    operation: preset.command,
    tree: [...preset.tree],
    target: preset.target,
  };
}

export function avlPythonExample(): string {
  return AVL_PYTHON;
}

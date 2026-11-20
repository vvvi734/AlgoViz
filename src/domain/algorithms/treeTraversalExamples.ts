/**
 * Stage 7D: the REAL Python binary-tree teaching program.
 *
 * The tree is built from a level-order array with genuine TreeNode objects and
 * genuine `left` / `right` references. `traverse` is instrumented by the real
 * `@tracked` wrapper; its optional enter/return hooks add the tree snapshot and
 * the real root→current recursion path to the call and return frames. The
 * explicit `visit` / `left` / `right` frames come from statements that actually
 * execute, never from a result array or message parsing.
 *
 * Input accepts the legacy array (`[4, 2, 6, 1, 3, 5, 7]`, meaning inorder) or
 * `{mode, tree}`, so the same `inorder` algorithm id can teach all three modes
 * without creating duplicate catalogue entries.
 */
export const TREE_DEFAULT_TREE = [4, 2, 6, 1, 3, 5, 7];
export const TREE_DEFAULT_INPUT: unknown = TREE_DEFAULT_TREE;

export const TREE_PYTHON = `# Binary tree: real TreeNode objects, real left/right references.
raw_input = input
if isinstance(raw_input, dict):
    requested_mode = raw_input.get("mode", "inorder")
    values = raw_input.get("tree", [])
else:
    requested_mode = "inorder"
    values = raw_input
if requested_mode not in ("preorder", "inorder", "postorder", "levelorder"):
    requested_mode = "inorder"
MODE = requested_mode
if not isinstance(values, list):
    values = []
values = values[:40]

class TreeNode:
    def __init__(self, node_id, value, index):
        self.node_id = node_id
        self.value = value
        self.index = index
        self.left = None
        self.right = None
    def __repr__(self):
        return "TreeNode(" + self.node_id + "=" + str(self.value) + ")"

NODES = []
for index, value in enumerate(values):
    if value is None:
        continue
    if isinstance(value, (dict, list)):
        value = str(value)
    NODES.append(TreeNode("n" + str(index + 1), value, index))

by_index = {node.index: node for node in NODES}
for index, value in enumerate(values):
    node = by_index.get(index)
    if node is None:
        continue
    left_index = index * 2 + 1
    right_index = index * 2 + 2
    if left_index in by_index:
        node.left = by_index[left_index]
    if right_index in by_index:
        node.right = by_index[right_index]

ROOT = by_index.get(0)
if ROOT is not None:
    reachable = set()
    stack = [ROOT]
    while stack:
        node = stack.pop()
        if node is None or node in reachable:
            continue
        reachable.add(node)
        if node.left is not None:
            stack.append(node.left)
        if node.right is not None:
            stack.append(node.right)
    NODES = [node for node in NODES if node in reachable]
else:
    NODES = []

PATH = []
VISITED = []

def tree_state(current=None, done=False):
    values_now = [node.value for node in NODES]
    visited_index = [node.index for node in VISITED]
    focus = [current.index] if current is not None else []
    return {"type": "tree", "values": values_now, "visited": visited_index, "focus": focus, "done": done}

def tree_payload(operation, current=None):
    nodes_now = []
    for node in NODES:
        nodes_now.append({
            "id": node.node_id,
            "value": node.value,
            "leftId": node.left.node_id if node.left is not None else None,
            "rightId": node.right.node_id if node.right is not None else None,
        })
    return {
        "kind": "binary-tree",
        "traversal": MODE,
        "operation": operation,
        "rootId": ROOT.node_id if ROOT is not None else None,
        "nodes": nodes_now,
        "currentNodeId": current.node_id if current is not None else None,
        "visitedIds": [node.node_id for node in VISITED],
        "pathIds": [node.node_id for node in PATH], "queueIds": [node.node_id for node in QUEUE],
    }

def tree_variables(node=None):
    return {
        "node": node,
        "node_id": node.node_id if node is not None else None,
        "value": node.value if node is not None else None,
        "mode": MODE,
        "path": [item.node_id for item in PATH],
        "visited": [item.value for item in VISITED],
        "depth": max(0, len(PATH) - 1),
        "queue": [item.node_id for item in QUEUE],
    }

def emit(operation, node, message, line, lesson_step):
    trace(tree_state(node), message, line=line, variables=tree_variables(node), lesson_step=lesson_step, structure=tree_payload(operation, node))

def visit_node(node, line):
    VISITED.append(node)
    emit("visit", node, "访问节点 / visit " + node.node_id + " = " + str(node.value), line, "visit")

def tree_enter(frame, arguments):
    node = arguments.get("node")
    if node is None:
        return None
    PATH.append(node)
    step = "root" if node is ROOT else "enter"
    return {"state": tree_state(node), "message": "进入节点 / enter " + node.node_id, "variables": tree_variables(node), "lessonStepId": step, "structure": tree_payload("enter", node)}

def tree_return(frame, result):
    node = PATH[-1] if PATH else None
    extra = {"state": tree_state(node), "message": "返回上一层 / return", "variables": tree_variables(node), "lessonStepId": "return", "structure": tree_payload("return", node)}
    if PATH:
        PATH.pop()
    return extra

@tracked(enter_hook=tree_enter, return_hook=tree_return)
def traverse(node):
    if node is None:
        return
    if MODE == "preorder":
        visit_node(node, 131)
    if node.left is not None:
        emit("left", node, "进入左子树 / go left", 133, "left")
        traverse(node.left)
    if MODE == "inorder":
        visit_node(node, 136)
    if node.right is not None:
        emit("right", node, "进入右子树 / go right", 138, "right")
        traverse(node.right)
    if MODE == "postorder":
        visit_node(node, 141)

QUEUE = []
PARENT = {}

def build_parent(node, parent=None):
    if node is None:
        return
    PARENT[node] = parent
    build_parent(node.left, node)
    build_parent(node.right, node)

def set_level_path(node):
    PATH.clear()
    chain = []
    cursor = node
    while cursor is not None:
        chain.append(cursor)
        cursor = PARENT.get(cursor)
    for item in reversed(chain):
        PATH.append(item)

def level_order():
    QUEUE.append(ROOT)
    set_level_path(ROOT)
    emit("enqueue", ROOT, "根节点入队 / enqueue root " + ROOT.node_id, 164, "level-init")
    while QUEUE:
        node = QUEUE.pop(0)
        set_level_path(node)
        emit("dequeue", node, "队首出队 / dequeue " + node.node_id, 168, "level-process")
        VISITED.append(node)
        emit("visit", node, "访问节点 / visit " + node.node_id + " = " + str(node.value), 171, "level-process")
        if node.left is not None:
            QUEUE.append(node.left)
            set_level_path(node.left)
            emit("enqueue", node.left, "左孩子入队 / enqueue left " + node.left.node_id, 174, "level-process")
        if node.right is not None:
            QUEUE.append(node.right)
            set_level_path(node.right)
            emit("enqueue", node.right, "右孩子入队 / enqueue right " + node.right.node_id, 178, "level-process")

build_parent(ROOT)

emit("init", None, "初始化二叉树 / init tree", 184, "init")
if ROOT is not None:
    if MODE == "levelorder":
        level_order()
    else:
        traverse(ROOT)
order = [node.value for node in VISITED]
if MODE == "levelorder":
    PATH.clear()
order_step = "level-order" if MODE == "levelorder" else "order"
trace(tree_state(None, True), "访问顺序 / visit order: " + str(order), line=194, variables=tree_variables(None), lesson_step=order_step, structure=tree_payload("done", None))
trace(tree_state(None, True), "遍历完成 / done", line=195, variables=tree_variables(None), lesson_step="done", structure=tree_payload("done", None))
`;

export type TreeMode = 'preorder' | 'inorder' | 'postorder' | 'levelorder';

export function treeModeFromInput(input: unknown): TreeMode {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'inorder';
  const mode = (input as { mode?: unknown }).mode;
  return mode === 'preorder' || mode === 'inorder' || mode === 'postorder' || mode === 'levelorder'
    ? mode
    : 'inorder';
}

export function treeValuesFromInput(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') {
    const tree = (input as { tree?: unknown }).tree;
    if (Array.isArray(tree)) return tree;
  }
  return [];
}

export function withTreeMode(input: unknown, mode: TreeMode): { mode: TreeMode; tree: unknown[] } {
  return { mode, tree: treeValuesFromInput(input) };
}

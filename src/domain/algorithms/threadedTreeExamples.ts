/**
 * TEXTBOOK-06: real in-order threaded binary tree.
 *
 * The source builds genuine TreeNode objects from a level-order array, then:
 *  1. recursively threads null left pointers to the predecessor and null right
 *     pointers to the successor; tags are stored on the nodes;
 *  2. traverses the finished tree by following threads and left-most descents.
 *
 * Every teaching frame is emitted from a statement that actually executes.
 * `@tracked` records the real recursion call stack; snapshots never infer links
 * from node positions.
 */

import type { AlgorithmEntry } from './types';

export const THREADED_DEFAULT_TREE = [4, 2, 6, 1, 3];
export const THREADED_DEFAULT_INPUT: unknown = {
  mode: 'inorder',
  tree: THREADED_DEFAULT_TREE,
};

export const THREADED_TREE_PYTHON = `# In-order threaded binary tree: real objects, tags and thread pointers.
raw_input = input
if isinstance(raw_input, dict):
    values = raw_input.get("tree", [])
else:
    values = raw_input
if not isinstance(values, list):
    values = []
values = values[:31]

class TreeNode:
    def __init__(self, node_id, value):
        self.node_id = node_id
        self.value = value
        self.left = None
        self.right = None
        self.ltag = 0
        self.rtag = 0
        self.left_thread = None
        self.right_thread = None
    def __repr__(self):
        return "TreeNode(" + self.node_id + "=" + str(self.value) + ")"

NODES = []
for index, value in enumerate(values):
    if value is None:
        continue
    if isinstance(value, (dict, list)):
        value = str(value)
    NODES.append(TreeNode("n" + str(index + 1), value))

by_index = {node.node_id: node for node in NODES}
tree_nodes = []
for index, value in enumerate(values):
    node = by_index.get("n" + str(index + 1))
    if node is None:
        continue
    left_index = index * 2 + 1
    right_index = index * 2 + 2
    if "n" + str(left_index + 1) in by_index:
        node.left = by_index["n" + str(left_index + 1)]
    if "n" + str(right_index + 1) in by_index:
        node.right = by_index["n" + str(right_index + 1)]
    tree_nodes.append(node)

ROOT = by_index.get("n1")
if ROOT is None:
    raise ValueError("the tree needs at least one node")

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
NODES = [node for node in tree_nodes if node in reachable]

PHASE = "thread"
PRE = None
CALL_PATH = []
VISITED = []

def leftmost(node):
    while node is not None and node.left is not None:
        node = node.left
    return node

def threaded_count():
    return sum(node.ltag + node.rtag for node in NODES)

def snapshot(operation, current=None):
    nodes_now = []
    for node in NODES:
        nodes_now.append({
            "id": node.node_id,
            "value": node.value,
            "leftId": node.left.node_id if node.left is not None else None,
            "rightId": node.right.node_id if node.right is not None else None,
            "ltag": node.ltag,
            "rtag": node.rtag,
            "leftThreadId": node.left_thread.node_id if node.left_thread is not None else None,
            "rightThreadId": node.right_thread.node_id if node.right_thread is not None else None,
        })
    return {
        "kind": "threaded-tree",
        "phase": PHASE,
        "operation": operation,
        "rootId": ROOT.node_id,
        "nodes": nodes_now,
        "currentNodeId": current.node_id if current is not None else None,
        "prevId": PRE.node_id if PRE is not None else None,
        "visitedIds": [node.node_id for node in VISITED],
        "threadedCount": threaded_count(),
    }

def tree_state(current=None, done=False):
    return {
        "type": "tree",
        "values": [node.value for node in NODES],
        "visited": [node.node_id for node in VISITED],
        "focus": [current.node_id] if current is not None else [],
        "done": done,
    }

def variables(current=None):
    return {
        "node": current.node_id if current is not None else None,
        "pre": PRE.node_id if PRE is not None else None,
        "ltag": current.ltag if current is not None else None,
        "rtag": current.rtag if current is not None else None,
        "threaded": threaded_count(),
        "visited": [node.value for node in VISITED],
        "phase": PHASE,
    }

def emit(operation, current, message, line, step):
    trace(tree_state(current), message, line=line, variables=variables(current),
          lesson_step=step, structure=snapshot(operation, current))

def walk_enter(frame, arguments):
    node = arguments.get("node")
    if node is None:
        return None
    CALL_PATH.append(node)
    return {
        "state": tree_state(node),
        "message": "进入子树 / enter " + node.node_id,
        "variables": variables(node),
        "lessonStepId": "enter",
        "structure": snapshot("enter", node),
    }

def walk_return(frame, result):
    node = CALL_PATH[-1] if CALL_PATH else None
    extra = {
        "state": tree_state(node),
        "message": "子树处理完 / return " + (node.node_id if node is not None else ""),
        "variables": variables(node),
        "lessonStepId": "return",
        "structure": snapshot("return", node),
    }
    if CALL_PATH:
        CALL_PATH.pop()
    return extra

@tracked(enter_hook=walk_enter, return_hook=walk_return)
def walk(node):
    global PRE
    if node.left is not None:
        walk(node.left)
    if node.left is None:
        node.ltag = 1
        node.left_thread = PRE
        emit("thread-left", node,
             "左指针为空：写入前驱 / null left becomes predecessor " +
             (PRE.node_id if PRE is not None else "None"), 91, "thread-left")
    if PRE is not None and PRE.right is None:
        PRE.rtag = 1
        PRE.right_thread = node
        emit("thread-right", node,
             "前驱右指针为空：写入后继 / null right of " + PRE.node_id +
             " becomes successor " + node.node_id, 96, "thread-right")
    PRE = node
    if node.right is not None:
        walk(node.right)

emit("init", None, "初始化：所有标志为 0 / init: all tags are 0", 52, "init")
walk(ROOT)
if PRE is not None and PRE.right is None:
    PRE.rtag = 1
    PRE.right_thread = None
    emit("thread-last", PRE,
         "中序最后一个结点：右线索为空 / last in-order node keeps a null successor", 106, "thread-last")

PHASE = "traverse"
trace(tree_state(None), "线索建立完成 / threading complete", line=111,
      variables=variables(None), lesson_step="thread-complete",
      structure=snapshot("thread-complete", None))

node = leftmost(ROOT)
emit("start", node, "从最左结点开始 / start at the left-most node", 117, "start")
while node is not None:
    VISITED.append(node)
    emit("visit", node, "访问结点 / visit " + node.node_id + " = " + str(node.value), 120, "visit")
    if node.rtag == 1:
        next_node = node.right_thread
        if next_node is None:
            break
        node = next_node
        emit("follow-thread", node, "沿右线索到后继 / follow right thread to " + node.node_id, 124, "follow-thread")
    else:
        node = leftmost(node.right)
        if node is None:
            break
        emit("descend-left", node, "进入右子树并走到最左 / descend to left-most of right subtree: " + node.node_id, 128, "descend-left")

PHASE = "done"
trace(tree_state(None, True), "中序线索遍历完成 / threaded in-order traversal done", line=132,
      variables=variables(None), lesson_step="done", structure=snapshot("done", None))
`;

export const THREADED_INORDER_ENTRY: AlgorithmEntry = {
  group: 'tree',
  icon: '⇢',
  name: ['线索二叉树的中序遍历', 'In-order threading traversal'],
  desc: [
    '真实 Python 递归线索化：空左指针写入前驱、空右指针写入后继，ltag/rtag 与线索一起生成；随后不用递归栈，沿右线索和右子树最左结点完成中序遍历。',
    'Real Python threads null left pointers to predecessors and null right pointers to successors, storing ltag/rtag beside the thread links; the finished tree is then traversed without a recursion stack by following right threads and left-most descents.',
  ],
  time: 'O(n)',
  space: 'O(h) / O(1)',
  input: THREADED_DEFAULT_INPUT,
  code: "trace({type:'tree',values:[4,2,6,1,3],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

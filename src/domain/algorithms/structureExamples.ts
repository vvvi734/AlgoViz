/**
 * Stage 7B stack/queue Python teaching programs.
 *
 * These strings are REAL Python source executed by the Pyodide worker. Every
 * frame calls `trace(..., structure=...)` with the container snapshot AFTER the
 * operation, stable element ids and the operation that actually ran. Nothing is
 * inferred later from `message` text.
 *
 * The default operation list lives outside the legacy JS catalogue so the
 * byte-for-byte legacy frame oracle stays untouched. Existing JS demos keep
 * working; Python is the primary teaching language for these two structures.
 */
import { LINKED_DEFAULT_INPUT, LINKED_PYTHON } from './linkedListExamples';
import {
  CIRCULAR_DEFAULT_INPUT,
  CIRCULAR_PYTHON,
  DOUBLY_DEFAULT_INPUT,
  DOUBLY_PYTHON,
} from './advancedLinkedListExamples';
import { TREE_PYTHON } from './treeTraversalExamples';
import {
  BST_DEFAULT_INPUT,
  bstPythonExample,
} from './bstExamples';
import {
  AVL_DEFAULT_INPUT,
  avlPythonExample,
} from './avlExamples';
import { GRAPH_DEFAULT_INPUT, graphPythonExample } from './graphTraversalExamples';
import { DIJKSTRA_DEFAULT_INPUT, dijkstraPythonExample } from './dijkstraExamples';
import {
  BELLMAN_DEFAULT_INPUT,
  FLOYD_DEFAULT_INPUT,
  bellmanFordPythonExample,
  floydWarshallPythonExample,
} from './shortestPathExamples';
import {
  KRUSKAL_DEFAULT_INPUT,
  PRIM_DEFAULT_INPUT,
  kruskalPythonExample,
  primPythonExample,
} from './mstExamples';
import {
  CRITICAL_PATH_DEFAULT_INPUT,
  TOPOLOGICAL_DEFAULT_INPUT,
  criticalPathPythonExample,
  topologicalPythonExample,
} from './dagExamples';
import {
  CONNECTED_COMPONENTS_DEFAULT_INPUT,
  SCC_DEFAULT_INPUT,
  connectedComponentsPythonExample,
  kosarajuPythonExample,
} from './componentExamples';
import {
  HEAP_DEFAULT_INPUT,
  HEAP_PYTHON,
} from './heapExamples';
import {
  HUFFMAN_DEFAULT_INPUT,
  HUFFMAN_PYTHON,
} from './huffmanExamples';
import {
  INSERTION_DEFAULT_INPUT,
  MERGE_DEFAULT_INPUT,
  QUICK_DEFAULT_INPUT,
  SELECTION_DEFAULT_INPUT,
  SHELL_DEFAULT_INPUT,
  SORTING_PYTHON,
} from './sortingExamples';
import { BINARY_DEFAULT_INPUT, BINARY_PYTHON, LINEAR_DEFAULT_INPUT, LINEAR_PYTHON } from './searchExamples';
import {
  CHAINING_PYTHON,
  HASH_CHAIN_INPUT,
  HASH_PROBE_INPUT,
  PROBING_PYTHON,
} from './hashExamples';
import {
  SEQUENTIAL_LIST_DEFAULT_INPUT,
  sequentialListPythonExample,
} from './sequentialListExamples';
import { KMP_DEFAULT_INPUT, KMP_PYTHON } from './kmpExamples';
import { BF_DEFAULT_INPUT, BF_PYTHON } from './bfExamples';
import {
  GL_COPY_DEFAULT_INPUT,
  GL_COPY_PYTHON,
  GL_DEPTH_DEFAULT_INPUT,
  GL_DEPTH_PYTHON,
} from './generalizedListExamples';
import {
  SPARSE_TRANSPOSE_DEFAULT_INPUT,
  SPARSE_TRANSPOSE_PYTHON,
} from './sparseTransposeExamples';
import { BTREE_DEFAULT_INPUT, btreePythonExample } from './btreeExamples';
import {
  FACTORIAL_DEFAULT_INPUT,
  FACTORIAL_PYTHON,
  FIB_DEFAULT_INPUT,
  FIB_PYTHON,
} from './recursionExamples';
import {
  POLYNOMIAL_ADD_DEFAULT_INPUT,
  POLYNOMIAL_ADD_PYTHON,
  STATIC_LINKED_DEFAULT_INPUT,
  STATIC_LINKED_PYTHON,
} from './chapter2Examples';

export const STACK_DEFAULT_INPUT: unknown = {
  storage: 'array',
  capacity: 4,
  operations: [
    ['push', 3],
    ['push', 5],
    ['push', 8],
    ['push', 11],
    ['peek'],
    ['pop'],
  ],
};

export const QUEUE_DEFAULT_INPUT: unknown = {
  storage: 'circular',
  capacity: 5,
  operations: [
    ['enqueue', 3],
    ['enqueue', 5],
    ['enqueue', 8],
    ['enqueue', 11],
    ['front'],
    ['dequeue'],
    ['enqueue', 15],
    ['dequeue'],
  ],
};

export const STACK_PYTHON = `# Stack: one logical LIFO container, two real storage layouts.
request = input
if isinstance(request, dict):
    operations = request.get("operations", [])
    storage = request.get("storage", "array")
    capacity = int(request.get("capacity", 4))
else:
    operations = request
    storage = "array"
    capacity = 4

array_values = []
array_ids = []
top = -1
nodes = {}
top_id = None
sequence = 0

def linked_snapshot():
    out = []
    current = top_id
    seen = set()
    while current is not None and current in nodes and current not in seen:
        seen.add(current)
        node = nodes[current]
        out.append({"id": node["id"], "value": node["value"], "nextId": node["nextId"]})
        current = node["nextId"]
    return out

def current_items():
    if storage == "array":
        return [{"id": array_ids[i], "value": array_values[i], "slot": i} for i in range(len(array_values))]
    chain = linked_snapshot()
    return [{"id": node["id"], "value": node["value"]} for node in reversed(chain)]

def emit(operation, message, line, lesson, target=None, removed=None):
    items = current_items()
    payload = {"kind": "stack", "operation": operation, "items": items, "storage": storage}
    if storage == "array":
        payload["capacity"] = capacity
        payload["top"] = top
    else:
        payload["nodes"] = linked_snapshot()
        payload["topId"] = top_id
    if target is not None:
        payload["targetId"] = target
    if removed is not None:
        payload["removed"] = removed
    if storage == "array":
        values = array_values[:]
        variables = {"storage": storage, "stack": values, "top": top, "size": len(values)}
    else:
        values = [item["value"] for item in items]
        variables = {"storage": storage, "stack": values, "topId": top_id, "size": len(values)}
    if removed is not None:
        variables["removed"] = removed["value"]
    trace(
        {"type": "stack", "values": values, "focus": [len(values) - 1] if values else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

emit("init", "空栈：top = -1 / empty stack", 43, "empty")

for entry in operations:
    op = entry[0]
    value = entry[1] if len(entry) > 1 else None
    if op == "push":
        if storage == "array":
            if top >= capacity - 1:
                emit("push", "栈满：top 已到 capacity - 1，push 被拒绝 / stack full, push rejected",
                     48, "full")
                continue
            sequence += 1
            element_id = "s" + str(sequence)
            array_values.append(value)
            array_ids.append(element_id)
            top += 1
            lesson = "full" if top == capacity - 1 else "push"
            emit("push", "push " + str(value) + "：先 ++top，再写入数组 / increment top then write",
                 55, lesson, target=element_id)
        else:
            sequence += 1
            element_id = "n" + str(sequence)
            nodes[element_id] = {"id": element_id, "value": value, "nextId": top_id}
            top_id = element_id
            emit("push", "push " + str(value) + "：新结点 next 指向旧栈顶，top 移到新结点 / relink at the head",
                 61, "push", target=element_id)
    elif op == "peek" and current_items():
        top_item = current_items()[-1]
        emit("peek", "peek 读取栈顶 " + str(top_item["value"]) + "，不移除 / read TOP",
             65, "peek", target=top_item["id"])
    elif op == "pop" and current_items():
        top_item = current_items()[-1]
        if storage == "array":
            removed = {"id": array_ids.pop(), "value": array_values.pop(), "slot": top}
            top -= 1
            emit("pop", "pop " + str(removed["value"]) + "：先读取，再 --top / read then decrement top",
                 72, "pop", target=removed["id"], removed=removed)
        else:
            removed_id = top_id
            removed_value = nodes[removed_id]["value"]
            top_id = nodes[removed_id]["nextId"]
            del nodes[removed_id]
            emit("pop", "pop " + str(removed_value) + "：top 移到下一个结点 / move top to next",
                 78, "pop", target=removed_id, removed={"id": removed_id, "value": removed_value})

emit("done", "演示结束 / done", 82, "done")
`;

export const QUEUE_PYTHON = `# Queue: circular array and linked queue share one logical FIFO stream.
request = input
if isinstance(request, dict):
    operations = request.get("operations", [])
    storage = request.get("storage", "circular")
    capacity = int(request.get("capacity", 5))
else:
    operations = request
    storage = "circular"
    capacity = 5

slots = [None] * capacity
slot_ids = [None] * capacity
front = 0
rear = 0
count = 0
nodes = {}
front_id = "head"
rear_id = "head"
nodes["head"] = {"id": "head", "value": None, "nextId": None}
sequence = 0

def linked_snapshot():
    out = []
    current = front_id
    seen = set()
    while current is not None and current in nodes and current not in seen:
        seen.add(current)
        node = nodes[current]
        out.append({"id": node["id"], "value": node["value"], "nextId": node["nextId"]})
        current = node["nextId"]
    return out

def data_chain():
    out = []
    current = nodes["head"]["nextId"] if "head" in nodes else None
    seen = set()
    while current is not None and current in nodes and current not in seen:
        seen.add(current)
        out.append(nodes[current])
        current = nodes[current]["nextId"]
    return out

def current_items():
    if storage == "circular":
        items = []
        for offset in range(count):
            index = (front + offset) % capacity
            items.append({"id": slot_ids[index], "value": slots[index], "slot": index})
        return items
    return [{"id": node["id"], "value": node["value"]} for node in data_chain()]

def emit(operation, message, line, lesson, target=None, removed=None):
    items = current_items()
    payload = {"kind": "queue", "operation": operation, "items": items, "storage": storage}
    if storage == "circular":
        payload["capacity"] = capacity
        payload["front"] = front
        payload["rear"] = rear
        payload["count"] = count
    else:
        payload["nodes"] = linked_snapshot()
        payload["frontId"] = front_id
        payload["rearId"] = rear_id
    if target is not None:
        payload["targetId"] = target
    if removed is not None:
        payload["removed"] = removed
    values = [item["value"] for item in items]
    if storage == "circular":
        variables = {"storage": storage, "queue": values, "front": front, "rear": rear, "count": count}
    else:
        variables = {"storage": storage, "queue": values, "frontId": front_id, "rearId": rear_id}
    if removed is not None:
        variables["removed"] = removed["value"]
    trace(
        {"type": "queue", "values": values, "focus": [0] if values else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

emit("init", "空队列：front == rear / empty queue", 54, "empty")

for entry in operations:
    op = entry[0]
    value = entry[1] if len(entry) > 1 else None
    if op == "enqueue":
        if storage == "circular":
            if count == capacity - 1:
                emit("enqueue", "队满：(rear + 1) % capacity == front，入队被拒绝 / queue full",
                     59, "full")
                continue
            sequence += 1
            element_id = "q" + str(sequence)
            slots[rear] = value
            slot_ids[rear] = element_id
            count += 1
            rear = (rear + 1) % capacity
            if rear == 0:
                lesson = "wrap"
                message = "enqueue " + str(value) + "：rear 从 " + str(capacity - 1) + " 回绕到 0 / rear wraps to 0"
            elif count == capacity - 1:
                lesson = "full"
                message = "enqueue " + str(value) + "：写入后队满 / queue becomes full"
            else:
                lesson = "enqueue"
                message = "enqueue " + str(value) + "：写入 rear 后 rear 后移 / write at rear then advance"
            emit("enqueue", message, 71, lesson, target=element_id)
        else:
            sequence += 1
            element_id = "n" + str(sequence)
            nodes[element_id] = {"id": element_id, "value": value, "nextId": None}
            nodes[rear_id]["nextId"] = element_id
            rear_id = element_id
            emit("enqueue", "enqueue " + str(value) + "：接在 rear 后，rear 移到新结点 / link after rear",
                 79, "enqueue", target=element_id)
    elif op == "front" and current_items():
        first = current_items()[0]
        emit("front", "front 读取队首 " + str(first["value"]) + "，不移除 / read FRONT",
             83, "front", target=first["id"])
    elif op == "dequeue" and current_items():
        first = current_items()[0]
        if storage == "circular":
            removed = {"id": slot_ids[front], "value": slots[front], "slot": front}
            slots[front] = None
            slot_ids[front] = None
            front = (front + 1) % capacity
            count -= 1
            emit("dequeue", "dequeue " + str(removed["value"]) + "：front 后移，逻辑队首改变 / advance front",
                 92, "dequeue", target=removed["id"], removed=removed)
        else:
            target_id = nodes["head"]["nextId"]
            removed_value = nodes[target_id]["value"]
            nodes["head"]["nextId"] = nodes[target_id]["nextId"]
            if rear_id == target_id:
                rear_id = "head"
            del nodes[target_id]
            emit("dequeue", "dequeue " + str(removed_value) + "：删除 head.next；若删空，rear 回到 head / remove head.next",
                 100, "dequeue", target=target_id, removed={"id": target_id, "value": removed_value})

emit("done", "演示结束 / done", 104, "done")
`;

const STRUCTURE_PYTHON: Record<string, string> = {
  stack: STACK_PYTHON,
  queue: QUEUE_PYTHON,
  linked: LINKED_PYTHON,
  doubly: DOUBLY_PYTHON,
  circular: CIRCULAR_PYTHON,
  seqlist: sequentialListPythonExample(),
  inorder: TREE_PYTHON,
  bst: bstPythonExample(),
  avl: avlPythonExample(),
  bfs: graphPythonExample('bfs') as string,
  dfs: graphPythonExample('dfs') as string,
  dijkstra: dijkstraPythonExample(),
  'floyd-warshall': floydWarshallPythonExample(),
  'bellman-ford': bellmanFordPythonExample(),
  prim: primPythonExample(),
  kruskal: kruskalPythonExample(),
  topological: topologicalPythonExample(),
  'critical-path': criticalPathPythonExample(),
  components: connectedComponentsPythonExample(),
  scc: kosarajuPythonExample(),
  heap: HEAP_PYTHON,
  huffman: HUFFMAN_PYTHON,
  selection: SORTING_PYTHON.selection,
  insertion: SORTING_PYTHON.insertion,
  shell: SORTING_PYTHON.shell,
  quick: SORTING_PYTHON.quick,
  merge: SORTING_PYTHON.merge,
  linear: LINEAR_PYTHON,
  binary: BINARY_PYTHON,
  'hash-chain': CHAINING_PYTHON,
  'hash-probe': PROBING_PYTHON,
  bf: BF_PYTHON,
  'gl-depth': GL_DEPTH_PYTHON,
  'gl-copy': GL_COPY_PYTHON,
  kmp: KMP_PYTHON,
  'sparse-transpose': SPARSE_TRANSPOSE_PYTHON,
  btree: btreePythonExample(),
  factorial: FACTORIAL_PYTHON,
  fib: FIB_PYTHON,
  'static-linked-list': STATIC_LINKED_PYTHON,
  'polynomial-add': POLYNOMIAL_ADD_PYTHON,
};

const STRUCTURE_INPUT: Record<string, unknown> = {
  stack: STACK_DEFAULT_INPUT,
  queue: QUEUE_DEFAULT_INPUT,
  linked: LINKED_DEFAULT_INPUT,
  doubly: DOUBLY_DEFAULT_INPUT,
  circular: CIRCULAR_DEFAULT_INPUT,
  seqlist: SEQUENTIAL_LIST_DEFAULT_INPUT,
  bst: BST_DEFAULT_INPUT,
  avl: AVL_DEFAULT_INPUT,
  bfs: GRAPH_DEFAULT_INPUT,
  dfs: GRAPH_DEFAULT_INPUT,
  dijkstra: DIJKSTRA_DEFAULT_INPUT,
  'floyd-warshall': FLOYD_DEFAULT_INPUT,
  'bellman-ford': BELLMAN_DEFAULT_INPUT,
  prim: PRIM_DEFAULT_INPUT,
  kruskal: KRUSKAL_DEFAULT_INPUT,
  topological: TOPOLOGICAL_DEFAULT_INPUT,
  'critical-path': CRITICAL_PATH_DEFAULT_INPUT,
  components: CONNECTED_COMPONENTS_DEFAULT_INPUT,
  scc: SCC_DEFAULT_INPUT,
  heap: HEAP_DEFAULT_INPUT,
  huffman: HUFFMAN_DEFAULT_INPUT,
  selection: SELECTION_DEFAULT_INPUT,
  insertion: INSERTION_DEFAULT_INPUT,
  shell: SHELL_DEFAULT_INPUT,
  quick: QUICK_DEFAULT_INPUT,
  merge: MERGE_DEFAULT_INPUT,
  linear: LINEAR_DEFAULT_INPUT,
  binary: BINARY_DEFAULT_INPUT,
  'hash-chain': HASH_CHAIN_INPUT,
  'hash-probe': HASH_PROBE_INPUT,
  bf: BF_DEFAULT_INPUT,
  'gl-depth': GL_DEPTH_DEFAULT_INPUT,
  'gl-copy': GL_COPY_DEFAULT_INPUT,
  kmp: KMP_DEFAULT_INPUT,
  'sparse-transpose': SPARSE_TRANSPOSE_DEFAULT_INPUT,
  btree: BTREE_DEFAULT_INPUT,
  factorial: FACTORIAL_DEFAULT_INPUT,
  fib: FIB_DEFAULT_INPUT,
  'static-linked-list': STATIC_LINKED_DEFAULT_INPUT,
  'polynomial-add': POLYNOMIAL_ADD_DEFAULT_INPUT,
};

export function structurePythonExample(algorithmId: string): string | undefined {
  return STRUCTURE_PYTHON[algorithmId];
}

/** Default operations for the Stage 7B stack/queue and Stage 7C linked-list lessons,
 * without touching the legacy catalogue. */
export function structureDefaultInput(algorithmId: string): unknown | undefined {
  return STRUCTURE_INPUT[algorithmId];
}

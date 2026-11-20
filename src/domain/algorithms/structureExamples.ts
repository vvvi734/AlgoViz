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
import {
  SPARSE_TRANSPOSE_DEFAULT_INPUT,
  SPARSE_TRANSPOSE_PYTHON,
} from './sparseTransposeExamples';
import { BTREE_DEFAULT_INPUT, btreePythonExample } from './btreeExamples';

export const STACK_DEFAULT_INPUT: unknown = [
  ['push', 3],
  ['push', 5],
  ['push', 8],
  ['peek'],
  ['pop'],
];

export const QUEUE_DEFAULT_INPUT: unknown = [
  ['enqueue', 3],
  ['enqueue', 5],
  ['enqueue', 8],
  ['front'],
  ['dequeue'],
];

export const STACK_PYTHON = `# Stack: closed bottom, open top. Every frame below comes from real execution.
operations = input
stack = []          # values, bottom -> top
ids = []            # one stable id per element, used only by the animation
sequence = 0

def emit(operation, message, line, lesson, target=None, removed=None):
    items = [{"id": ids[i], "value": stack[i]} for i in range(len(stack))]
    payload = {"kind": "stack", "operation": operation, "items": items}
    if target is not None:
        payload["targetId"] = target
    if removed is not None:
        payload["removed"] = removed
    variables = {"stack": stack[:], "top": stack[-1] if stack else None}
    if removed is not None:
        variables["removed"] = removed["value"]
    trace(
        {"type": "stack", "values": stack[:], "focus": [len(stack) - 1] if stack else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

emit("init", "空栈：还没有元素 / Empty stack: no elements", 23, "empty")

for entry in operations:
    op = entry[0]
    value = entry[1] if len(entry) > 1 else None
    if op == "push":
        sequence += 1
        element_id = f"s{sequence}"
        stack.append(value)
        ids.append(element_id)
        emit("push", f"Push {value}：从顶部进入 / enters at the top", 31, "push", target=element_id)
    elif op == "peek" and stack:
        emit("peek", f"Peek 查看栈顶 {stack[-1]}，不移除 / reads TOP without removing", 35, "peek", target=ids[-1])
    elif op == "pop" and stack:
        removed_id = ids.pop()
        removed_value = stack.pop()
        emit("pop", f"Pop {removed_value}：从顶部离开 / leaves from the top", 38, "pop", target=removed_id, removed={"id": removed_id, "value": removed_value})

emit("done", "演示结束 / Done", 43, "done")
`;

export const QUEUE_PYTHON = `# Queue: enqueue at REAR, dequeue from FRONT. Real Python + real frames.
from collections import deque

operations = input
queue = deque()     # front -> rear
ids = []            # stable ids, used only by the animation
sequence = 0

def emit(operation, message, line, lesson, target=None, removed=None):
    items = [{"id": ids[i], "value": queue[i]} for i in range(len(queue))]
    payload = {"kind": "queue", "operation": operation, "items": items}
    if target is not None:
        payload["targetId"] = target
    if removed is not None:
        payload["removed"] = removed
    variables = {"queue": list(queue), "front": queue[0] if queue else None}
    if removed is not None:
        variables["removed"] = removed["value"]
    trace(
        {"type": "queue", "values": list(queue), "focus": [0] if queue else []},
        message,
        line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

emit("init", "空队列：还没有元素 / Empty queue: no elements", 25, "empty")

for entry in operations:
    op = entry[0]
    value = entry[1] if len(entry) > 1 else None
    if op == "enqueue":
        sequence += 1
        element_id = f"q{sequence}"
        queue.append(value)
        ids.append(element_id)
        emit("enqueue", f"Enqueue {value}：从队尾进入 / enters at REAR", 33, "enqueue", target=element_id)
    elif op == "front" and queue:
        emit("front", f"Front 查看队首 {queue[0]}，不移除 / reads FRONT without removing", 37, "front", target=ids[0])
    elif op == "dequeue" and queue:
        removed_id = ids.pop(0)
        removed_value = queue.popleft()
        emit("dequeue", f"Dequeue {removed_value}：从队首离开 / leaves from FRONT", 40, "dequeue", target=removed_id, removed={"id": removed_id, "value": removed_value})

emit("done", "演示结束 / Done", 43, "done")
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
  kmp: KMP_PYTHON,
  'sparse-transpose': SPARSE_TRANSPOSE_PYTHON,
  btree: btreePythonExample(),
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
  kmp: KMP_DEFAULT_INPUT,
  'sparse-transpose': SPARSE_TRANSPOSE_DEFAULT_INPUT,
  btree: BTREE_DEFAULT_INPUT,
};

export function structurePythonExample(algorithmId: string): string | undefined {
  return STRUCTURE_PYTHON[algorithmId];
}

/** Default operations for the Stage 7B stack/queue and Stage 7C linked-list lessons,
 * without touching the legacy catalogue. */
export function structureDefaultInput(algorithmId: string): unknown | undefined {
  return STRUCTURE_INPUT[algorithmId];
}

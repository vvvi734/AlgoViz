/**
 * Stage 7E real Python BFS / iterative DFS teaching programs.
 *
 * Both programs parse the SAME `{start, nodes, edges}` input, build a stable
 * undirected adjacency list, and emit one GraphSnapshot per real operation.
 * BFS uses `collections.deque`; DFS uses an explicit Python list stack. The
 * runner marks BFS discovered at enqueue and DFS discovered at push; both mark
 * visited only after dequeue/pop. `sourceLocation` comes from the caller frame
 * via `sys._getframe(1).f_lineno`, not from a guessed string index.
 *
 * Duplicate undirected edges are normalised to the first occurrence (stable id
 * e1, e2, …). Self-loops and dangling endpoints are rejected before execution.
 */
export const GRAPH_DEFAULT_INPUT: unknown = {
  start: 'A',
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  edges: [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['B', 'E'],
    ['C', 'F'],
    ['E', 'F'],
    ['F', 'G'],
  ],
};

const GRAPH_INPUT_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("graph input must be an object: {start, nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 20:
    raise ValueError("a teaching graph supports at most 20 nodes")
nodes = []
node_set = set()
for value in nodes_input:
    if not isinstance(value, str) or not value:
        raise ValueError("every node id must be a non-empty string")
    if value in node_set:
        raise ValueError("duplicate node id: " + value)
    node_set.add(value)
    nodes.append(value)
if not isinstance(edges_input, list):
    raise ValueError("edges must be an array of [from, to] pairs")
if len(edges_input) > 80:
    raise ValueError("too many raw edges before de-duplication")
if not nodes:
    start = None
else:
    start = raw.get("start")
    if not isinstance(start, str) or start not in node_set:
        raise ValueError("start must name an existing node")
adjacency = {node: [] for node in nodes}
edges_payload = []
edge_by_pair = {}
for pair in edges_input:
    if not isinstance(pair, (list, tuple)) or len(pair) != 2:
        raise ValueError("every edge must be a [from, to] pair")
    a, b = pair
    if not isinstance(a, str) or not isinstance(b, str) or a not in node_set or b not in node_set:
        raise ValueError("an edge endpoint does not exist")
    if a == b:
        raise ValueError("self-loops are not supported")
    key = tuple(sorted((a, b)))
    if key in edge_by_pair:
        continue
    if len(edges_payload) >= 40:
        raise ValueError("a teaching graph supports at most 40 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_pair[key] = edge_id
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b})
    adjacency[a].append(b)
    adjacency[b].append(a)
nodes_payload = [{"id": node, "value": node} for node in nodes]`;

const BFS_PROGRAM = `${GRAPH_INPUT_HELPER}

def bfs(adjacency, start):
    queue = deque()
    discovered = set()
    discovered_order = []
    visited = set()
    visit_order = []
    entry_ids = {}
    entry_seq = 0

    def emit(operation, message, lesson, current=None, edge=None, neighbor=None, removed=None):
        frontier_items = [{"id": entry_ids[node], "nodeId": node} for node in queue]
        payload = {
            "kind": "graph",
            "algorithm": "bfs",
            "operation": operation,
            "nodes": nodes_payload,
            "edges": edges_payload,
            "startNodeId": start,
            "currentNodeId": current,
            "currentEdgeId": edge,
            "neighborNodeId": neighbor,
            "discoveredIds": discovered_order[:],
            "visitedIds": visit_order[:],
            "visitOrder": visit_order[:],
            "frontierKind": "queue",
            "frontierItems": frontier_items,
            "frontierRemoved": removed,
        }
        variables = {
            "queue": list(queue),
            "current": current,
            "discovered": discovered_order[:],
            "visited": visit_order[:],
            "frontier_size": len(queue),
        }
        if current is not None:
            variables["neighbors"] = list(adjacency[current])
        if neighbor is not None:
            variables["neighbor"] = neighbor
        trace(
            {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": visit_order[:]},
            message,
            line=sys._getframe(1).f_lineno,
            variables=variables,
            lesson_step=lesson,
            structure=payload,
        )

    emit("init", "初始化：建立无向邻接表 / Init: build the undirected adjacency list", "init")
    if start is None:
        emit("done", "空图：没有节点可访问 / Empty graph: no node to visit", "done")
        return

    entry_seq += 1
    entry_ids[start] = "q" + str(entry_seq)
    queue.append(start)
    discovered.add(start)
    discovered_order.append(start)
    emit("enqueue", "起点 " + start + " 入队，成为队首 / Start " + start + " enters the queue", "start", current=start)

    while queue:
        current = queue.popleft()
        removed = {"id": entry_ids.pop(current), "nodeId": current}
        emit("dequeue", current + " 出队，轮到它处理 / " + current + " leaves the FRONT", "dequeue", current=current, removed=removed)
        visited.add(current)
        visit_order.append(current)
        emit("visit", "访问 " + current + "，访问序号 " + str(len(visit_order)) + " / Visit " + current + " (#" + str(len(visit_order)) + ")", "visit", current=current)

        for neighbor in adjacency[current]:
            edge = edge_by_pair[tuple(sorted((current, neighbor)))]
            emit("inspect-edge", "检查边 " + current + "–" + neighbor + " / Inspect edge " + current + "–" + neighbor, "inspect", current=current, edge=edge, neighbor=neighbor)
            if neighbor in discovered:
                emit("skip", neighbor + " 已被发现，跳过 / " + neighbor + " is already discovered, skip", "skip", current=current, edge=edge, neighbor=neighbor)
                continue
            discovered.add(neighbor)
            discovered_order.append(neighbor)
            emit("discover", "第一次发现 " + neighbor + " / Discover " + neighbor + " for the first time", "discover", current=current, edge=edge, neighbor=neighbor)
            entry_seq += 1
            entry_ids[neighbor] = "q" + str(entry_seq)
            queue.append(neighbor)
            emit("enqueue", neighbor + " 从队尾入队 / " + neighbor + " enters at the REAR", "enqueue", current=current, edge=edge, neighbor=neighbor)

    emit("done", "队列为空，BFS 结束；访问顺序 " + " → ".join(visit_order) + " / Queue empty, BFS complete", "done")

bfs(adjacency, start)
`;

const DFS_PROGRAM = `${GRAPH_INPUT_HELPER}

def dfs_iterative(adjacency, start):
    stack = []
    discovered = set()
    discovered_order = []
    visited = set()
    visit_order = []
    entry_ids = {}
    entry_seq = 0

    def emit(operation, message, lesson, current=None, edge=None, neighbor=None, removed=None):
        frontier_items = [{"id": entry_ids[node], "nodeId": node} for node in stack]
        payload = {
            "kind": "graph",
            "algorithm": "dfs",
            "operation": operation,
            "nodes": nodes_payload,
            "edges": edges_payload,
            "startNodeId": start,
            "currentNodeId": current,
            "currentEdgeId": edge,
            "neighborNodeId": neighbor,
            "discoveredIds": discovered_order[:],
            "visitedIds": visit_order[:],
            "visitOrder": visit_order[:],
            "frontierKind": "stack",
            "frontierItems": frontier_items,
            "frontierRemoved": removed,
        }
        variables = {
            "stack": stack[:],
            "current": current,
            "discovered": discovered_order[:],
            "visited": visit_order[:],
            "frontier_size": len(stack),
        }
        if current is not None:
            variables["neighbors"] = list(adjacency[current])
        if neighbor is not None:
            variables["neighbor"] = neighbor
        trace(
            {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": visit_order[:]},
            message,
            line=sys._getframe(1).f_lineno,
            variables=variables,
            lesson_step=lesson,
            structure=payload,
        )

    emit("init", "初始化：建立无向邻接表 / Init: build the undirected adjacency list", "init")
    if start is None:
        emit("done", "空图：没有节点可访问 / Empty graph: no node to visit", "done")
        return

    entry_seq += 1
    entry_ids[start] = "s" + str(entry_seq)
    stack.append(start)
    discovered.add(start)
    discovered_order.append(start)
    emit("push", "起点 " + start + " 入栈，成为栈顶 / Start " + start + " enters the stack", "start", current=start)

    while stack:
        current = stack.pop()
        removed = {"id": entry_ids.pop(current), "nodeId": current}
        emit("pop", current + " 从栈顶弹出 / " + current + " pops from the TOP", "pop", current=current, removed=removed)
        visited.add(current)
        visit_order.append(current)
        emit("visit", "访问 " + current + "，访问序号 " + str(len(visit_order)) + " / Visit " + current + " (#" + str(len(visit_order)) + ")", "visit", current=current)

        # Reversed order puts the FIRST adjacency neighbor on top of the LIFO
        # stack, reproducing recursive DFS order without recursion.
        for neighbor in reversed(adjacency[current]):
            edge = edge_by_pair[tuple(sorted((current, neighbor)))]
            emit("inspect-edge", "检查边 " + current + "–" + neighbor + " / Inspect edge " + current + "–" + neighbor, "inspect", current=current, edge=edge, neighbor=neighbor)
            if neighbor in discovered:
                emit("skip", neighbor + " 已被发现，跳过 / " + neighbor + " is already discovered, skip", "skip", current=current, edge=edge, neighbor=neighbor)
                continue
            discovered.add(neighbor)
            discovered_order.append(neighbor)
            emit("discover", "第一次发现 " + neighbor + " / Discover " + neighbor + " for the first time", "discover", current=current, edge=edge, neighbor=neighbor)
            entry_seq += 1
            entry_ids[neighbor] = "s" + str(entry_seq)
            stack.append(neighbor)
            emit("push", neighbor + " 压入栈顶 / " + neighbor + " is pushed on TOP", "push", current=current, edge=edge, neighbor=neighbor)

    emit("done", "栈为空，DFS 结束；访问顺序 " + " → ".join(visit_order) + " / Stack empty, DFS complete", "done")

dfs_iterative(adjacency, start)
`;

export const GRAPH_PYTHON: Readonly<Record<'bfs' | 'dfs', string>> = {
  bfs: `from collections import deque\nimport sys\n\n${BFS_PROGRAM}`,
  dfs: `import sys\n\n${DFS_PROGRAM}`,
};

export function graphPythonExample(algorithmId: string): string | undefined {
  return algorithmId === 'bfs' || algorithmId === 'dfs' ? GRAPH_PYTHON[algorithmId] : undefined;
}

export function graphDefaultInput(algorithmId: string): unknown | undefined {
  return algorithmId === 'bfs' || algorithmId === 'dfs' ? GRAPH_DEFAULT_INPUT : undefined;
}

/**
 * Stage 7F: a REAL Python Dijkstra teaching program.
 *
 * `heapq` supplies the priority queue. The trace snapshots the heap, the
 * distance table, the previous pointers, the settled set and the final path
 * after every real operation. `float("inf")` is converted to JSON `null` at
 * the snapshot boundary, so no Infinity ever reaches the Trace Schema.
 *
 * Input contract (`{start, target, nodes, edges, directed}`):
 *   edges: [[from, to, weight], ...]
 *   plus optional object form {"from": ..., "to": ..., "weight": ...}
 * Negative weights, NaN/Infinity weights, self-loops and duplicate edges are
 * rejected before any frame is produced. Undirected graphs write the edge into
 * both adjacency lists; directed graphs use only from -> to.
 */
export const DIJKSTRA_DEFAULT_INPUT: unknown = {
  start: 'A',
  target: 'G',
  directed: false,
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  edges: [
    ['A', 'B', 2],
    ['A', 'C', 2],
    ['B', 'D', 4],
    ['B', 'E', 1],
    ['C', 'F', 4],
    ['E', 'F', 1],
    ['F', 'G', 3],
  ],
};

const DIJKSTRA_INPUT_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("Dijkstra input must be an object: {start, target, nodes, edges, directed}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
directed = raw.get("directed", False)
if not isinstance(directed, bool):
    raise ValueError("directed must be true or false")
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
    raise ValueError("edges must be an array of [from, to, weight] triples")
if len(edges_input) > 80:
    raise ValueError("too many raw edges")
if not nodes:
    start = None
    target = None
else:
    start = raw.get("start")
    target = raw.get("target")
    if not isinstance(start, str) or start not in node_set:
        raise ValueError("start must name an existing node")
    if not isinstance(target, str) or target not in node_set:
        raise ValueError("target must name an existing node")
adjacency = {node: [] for node in nodes}
edges_payload = []
edge_by_key = {}
for raw_edge in edges_input:
    if isinstance(raw_edge, dict):
        a, b, weight = raw_edge.get("from"), raw_edge.get("to"), raw_edge.get("weight")
    elif isinstance(raw_edge, (list, tuple)) and len(raw_edge) == 3:
        a, b, weight = raw_edge
    else:
        raise ValueError("every edge must be [from, to, weight] or {from, to, weight}")
    if not isinstance(a, str) or not isinstance(b, str) or a not in node_set or b not in node_set:
        raise ValueError("an edge endpoint does not exist")
    if a == b:
        raise ValueError("self-loops are not supported")
    if isinstance(weight, bool) or not isinstance(weight, (int, float)):
        raise ValueError("edge weight must be a finite non-negative number")
    if not math.isfinite(weight):
        raise ValueError("edge weight must be finite")
    if weight < 0:
        raise ValueError("Dijkstra requires non-negative edge weights; negative weight on " + a + "->" + b)
    key = (a, b) if directed else tuple(sorted((a, b)))
    if key in edge_by_key:
        raise ValueError("duplicate edge " + a + "->" + b)
    if len(edges_payload) >= 40:
        raise ValueError("a teaching graph supports at most 40 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_key[key] = edge_id
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b, "weight": weight})
    adjacency[a].append((b, weight, edge_id))
    if not directed:
        adjacency[b].append((a, weight, edge_id))
nodes_payload = [{"id": node, "value": node} for node in nodes]`;

const DIJKSTRA_PROGRAM = `${DIJKSTRA_INPUT_HELPER}

def safe_distance(value):
    return None if value == math.inf else value

def dijkstra(adjacency, start, target):
    distances = {node: math.inf for node in nodes}
    previous = {node: None for node in nodes}
    discovered = set()
    discovered_order = []
    settled = set()
    settle_order = []
    heap = []
    entry_seq = 0
    target_node = target

    def distance_rows():
        return [{"nodeId": node, "distance": safe_distance(distances[node])} for node in nodes]

    def previous_rows():
        return [{"nodeId": node, "previousId": previous[node]} for node in nodes]

    def heap_rows():
        rows = []
        for d, _, node, entry_id in heap:
            rows.append({
                "id": entry_id,
                "nodeId": node,
                "distance": d,
                "stale": node in settled or d != distances[node],
            })
        return rows

    def push_entry(node, distance):
        nonlocal entry_seq
        entry_seq += 1
        entry_id = "p" + str(entry_seq)
        heapq.heappush(heap, (distance, entry_seq, node, entry_id))
        return {"id": entry_id, "nodeId": node, "distance": distance, "stale": False}

    def emit(operation, message, lesson, current=None, edge=None, neighbor=None,
             removed=None, added=None, relax=None, path=None, path_distance=None):
        current_distance = safe_distance(distances[current]) if current is not None else None
        variables = {
            "heap": [[d, node, entry_id] for d, _, node, entry_id in heap],
            "current": current,
            "current_distance": current_distance,
            "distances": {node: safe_distance(distances[node]) for node in nodes},
            "previous": {node: previous[node] for node in nodes},
            "settled": settle_order[:],
            "discovered": discovered_order[:],
            "target": target_node,
        }
        if neighbor is not None:
            variables["neighbor"] = neighbor
            variables["neighbor_distance"] = safe_distance(distances[neighbor])
        trace(
            {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": settle_order[:]},
            message,
            line=sys._getframe(1).f_lineno,
            variables=variables,
            lesson_step=lesson,
            structure={
                "kind": "weighted-graph",
                "algorithm": "dijkstra",
                "operation": operation,
                "nodes": nodes_payload,
                "edges": edges_payload,
                "directed": directed,
                "startNodeId": start,
                "targetNodeId": target_node,
                "currentNodeId": current,
                "currentEdgeId": edge,
                "neighborNodeId": neighbor,
                "discoveredIds": discovered_order[:],
                "visitedIds": settle_order[:],
                "visitOrder": settle_order[:],
                "distances": distance_rows(),
                "previous": previous_rows(),
                "frontierKind": "priority-queue",
                "frontierItems": heap_rows(),
                "frontierRemoved": removed,
                "frontierAdded": added,
                "relax": relax,
                "pathNodeIds": path or [],
                "pathDistance": path_distance,
            },
        )

    emit("init", "初始化：距离表全部为 ∞，堆为空 / Init: all distances ∞, empty heap", "init")
    if start is None:
        emit("done", "空图：没有节点可处理 / Empty graph: nothing to process", "done", path=[])
        return

    distances[start] = 0
    discovered.add(start)
    discovered_order.append(start)
    added = push_entry(start, 0)
    emit("push", "起点 " + start + " 距离 0，加入最小堆 / Start " + start + " enters the min-heap at distance 0", "start", current=start, added=added)

    while heap:
        d, _, current, entry_id = heapq.heappop(heap)
        stale_entry = current in settled or d != distances[current]
        removed = {
            "id": entry_id,
            "nodeId": current,
            "distance": d,
            "stale": stale_entry,
        }
        if stale_entry:
            emit("stale", "(" + str(d) + ", " + current + ") 已过期，跳过 / Stale heap entry skipped", "stale", current=current, removed=removed)
            continue

        emit("pop", "弹出堆顶 (" + str(d) + ", " + current + ") / Pop the smallest entry", "pop", current=current, removed=removed)
        settled.add(current)
        settle_order.append(current)
        emit("settle", current + " 的距离 " + str(d) + " 已确定 / " + current + " is settled at " + str(d), "settle", current=current)

        for neighbor, weight, edge_id in adjacency[current]:
            emit(
                "inspect-edge",
                "检查边 " + current + "->" + neighbor + "，权重 " + str(weight) + " / Inspect weighted edge",
                "inspect", current=current, edge=edge_id, neighbor=neighbor,
            )
            if neighbor in settled:
                emit("skip", neighbor + " 已确定最短距离，跳过 / " + neighbor + " is already settled", "skip", current=current, edge=edge_id, neighbor=neighbor)
                continue

            candidate = distances[current] + weight
            if candidate < distances[neighbor]:
                old_distance = safe_distance(distances[neighbor])
                old_previous = previous[neighbor]
                distances[neighbor] = candidate
                previous[neighbor] = current
                if neighbor not in discovered:
                    discovered.add(neighbor)
                    discovered_order.append(neighbor)
                added = push_entry(neighbor, candidate)
                emit(
                    "relax",
                    "松弛 " + neighbor + "：" + ("∞" if old_distance is None else str(old_distance)) + " → " + str(candidate) + " / Relax improves the distance",
                    "relax", current=current, edge=edge_id, neighbor=neighbor, added=added,
                    relax={
                        "nodeId": neighbor,
                        "oldDistance": old_distance,
                        "newDistance": candidate,
                        "oldPreviousId": old_previous,
                        "newPreviousId": current,
                    },
                )
            else:
                emit(
                    "skip",
                    "候选距离 " + str(candidate) + " 不小于当前距离，保留前驱 / No strict improvement",
                    "skip", current=current, edge=edge_id, neighbor=neighbor,
                )

    path = []
    path_distance = None
    if target_node is not None and distances[target_node] != math.inf:
        cursor = target_node
        while cursor is not None:
            path.append(cursor)
            cursor = previous[cursor]
        path.reverse()
        path_distance = safe_distance(distances[target_node])
    emit(
        "done",
        "堆为空，Dijkstra 结束；目标路径 " + (" → ".join(path) if path else "不可达") + " / Heap empty, Dijkstra complete",
        "done", path=path, path_distance=path_distance,
    )

dijkstra(adjacency, start, target)
`;

export const DIJKSTRA_PYTHON = `import heapq\nimport math\nimport sys\n\n${DIJKSTRA_PROGRAM}`;

export function dijkstraPythonExample(): string {
  return DIJKSTRA_PYTHON;
}

export function dijkstraDefaultInput(): unknown {
  return DIJKSTRA_DEFAULT_INPUT;
}

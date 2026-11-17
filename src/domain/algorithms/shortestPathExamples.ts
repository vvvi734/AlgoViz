/**
 * G1: real Python teaching programs for Floyd-Warshall and Bellman-Ford.
 *
 * Both consume the same weighted-graph input contract as Dijkstra:
 * `{start, target, nodes, edges, directed}` where edges are
 * `[from, to, weight]` or `{from, to, weight}`. Signed finite weights are
 * accepted here (Dijkstra keeps its own non-negative contract).
 *
 * Every snapshot is built after a real Python operation. Floyd records a
 * complete V×V matrix and previous matrix; Bellman-Ford records the distance
 * table, previous table and each edge relaxation. `float("inf")` becomes
 * JSON `null` before it reaches the Trace Schema.
 */
export const SHORTEST_PATH_INPUT_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {start, target, nodes, edges, directed}")
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
node_index = {}
for value in nodes_input:
    if not isinstance(value, str) or not value:
        raise ValueError("every node id must be a non-empty string")
    if value in node_set:
        raise ValueError("duplicate node id: " + value)
    node_index[value] = len(nodes)
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
        raise ValueError("edge weight must be a finite number")
    if not math.isfinite(weight):
        raise ValueError("edge weight must be finite")
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
nodes_payload = [{"id": node, "value": node} for node in nodes]
`;

export const FLOYD_DEFAULT_INPUT: unknown = {
  start: 'A',
  target: 'E',
  directed: true,
  nodes: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    ['A', 'B', 4],
    ['A', 'C', 1],
    ['C', 'B', -2],
    ['B', 'D', 2],
    ['C', 'D', 5],
    ['D', 'E', 1],
    ['E', 'C', 2],
  ],
};

export const BELLMAN_DEFAULT_INPUT: unknown = {
  start: 'A',
  target: 'E',
  directed: true,
  nodes: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    ['A', 'B', 4],
    ['A', 'C', 1],
    ['C', 'B', -2],
    ['B', 'D', 2],
    ['C', 'D', 5],
    ['D', 'E', 1],
    ['C', 'E', 8],
  ],
};

const FLOYD_PROGRAM = `${SHORTEST_PATH_INPUT_HELPER}
if len(nodes) > 7:
    raise ValueError("Floyd-Warshall teaching graphs are limited to 7 nodes so every comparison stays under the 500-frame cap")

def safe_distance(value):
    return None if value == math.inf else value

def floyd_warshall():
    count = len(nodes)
    dist = [[math.inf for _ in range(count)] for _ in range(count)]
    previous = [[None for _ in range(count)] for _ in range(count)]
    for index in range(count):
        dist[index][index] = 0
    for edge in edges_payload:
        a = node_index[edge["fromId"]]
        b = node_index[edge["toId"]]
        weight = edge["weight"]
        dist[a][b] = weight
        previous[a][b] = edge["fromId"]
        if not directed:
            dist[b][a] = weight
            previous[b][a] = edge["toId"]

    def distance_rows():
        rows = []
        for i, from_node in enumerate(nodes):
            for j, to_node in enumerate(nodes):
                rows.append({"fromId": from_node, "toId": to_node, "distance": safe_distance(dist[i][j])})
        return rows

    def previous_rows():
        rows = []
        for i, from_node in enumerate(nodes):
            for j, to_node in enumerate(nodes):
                rows.append({"fromId": from_node, "toId": to_node, "previousId": previous[i][j]})
        return rows

    def emit(operation, message, lesson, k=None, i=None, j=None, compare=None, cycle=None,
             path=None, path_distance=None):
        trace(
            {"type": "graph", "values": nodes, "focus": [node for node in (k, i, j) if node]},
            message,
            line=sys._getframe(1).f_lineno,
            variables={
                "k": k,
                "i": i,
                "j": j,
                "candidate": compare["candidate"] if compare else None,
                "updated": compare["updated"] if compare else False,
            },
            lesson_step=lesson,
            structure={
                "kind": "floyd-warshall",
                "algorithm": "floyd-warshall",
                "operation": operation,
                "nodes": nodes_payload,
                "edges": edges_payload,
                "directed": directed,
                "startNodeId": start,
                "targetNodeId": target,
                "kNodeId": k,
                "iNodeId": i,
                "jNodeId": j,
                "compare": compare,
                "distances": distance_rows(),
                "previous": previous_rows(),
                "negativeCycle": cycle,
                "pathNodeIds": path or [],
                "pathDistance": path_distance,
            },
        )

    def reconstruct_path():
        if target == start:
            return [start], 0
        if dist[node_index[start]][node_index[target]] == math.inf:
            return [], None
        path = []
        cursor = target
        seen = set()
        while cursor is not None and cursor not in seen:
            seen.add(cursor)
            path.append(cursor)
            if cursor == start:
                break
            cursor = previous[node_index[start]][node_index[cursor]]
        if not path or path[-1] != start:
            return [], None
        path.reverse()
        return path, safe_distance(dist[node_index[start]][node_index[target]])

    emit("init", "初始化距离矩阵：对角线 0，直连边权重，其余 ∞ / Init matrix", "init")
    if not nodes:
        emit("done", "空图：没有节点可处理 / Empty graph: nothing to process", "done",
             cycle={"hasCycle": False, "nodeIds": []}, path=[], path_distance=None)
        return

    for k in range(count):
        k_node = nodes[k]
        emit("k-advance", "当前中间节点 k = " + k_node + " / Current intermediate k", "k", k=k_node)
        for i in range(count):
            if i == k:
                continue
            for j in range(count):
                if j == k:
                    continue
                i_node = nodes[i]
                j_node = nodes[j]
                direct = safe_distance(dist[i][j])
                through_ik = safe_distance(dist[i][k])
                through_kj = safe_distance(dist[k][j])
                candidate = None if through_ik is None or through_kj is None else through_ik + through_kj
                should_update = candidate is not None and (direct is None or candidate < direct)
                old_previous = previous[i][j]
                if should_update:
                    dist[i][j] = candidate
                    previous[i][j] = previous[k][j] if k != j else i_node
                    compare = {
                        "iNodeId": i_node,
                        "jNodeId": j_node,
                        "kNodeId": k_node,
                        "throughIK": through_ik,
                        "throughKJ": through_kj,
                        "candidate": candidate,
                        "oldDistance": direct,
                        "updated": True,
                        "newDistance": candidate,
                    }
                    emit("update", i_node + "→" + j_node + "：" + ("∞" if direct is None else str(direct)) + " → " + str(candidate) + " / Matrix cell improves", "update", k=k_node, i=i_node, j=j_node, compare=compare)
                else:
                    compare = {
                        "iNodeId": i_node,
                        "jNodeId": j_node,
                        "kNodeId": k_node,
                        "throughIK": through_ik,
                        "throughKJ": through_kj,
                        "candidate": candidate,
                        "oldDistance": direct,
                        "updated": False,
                        "newDistance": direct,
                    }
                    emit("skip", i_node + "→" + j_node + "：候选 " + ("∞" if candidate is None else str(candidate)) + " 没有严格更小 / No strict improvement", "skip", k=k_node, i=i_node, j=j_node, compare=compare)

    cycle_nodes = [nodes[index] for index in range(count) if dist[index][index] < 0]
    if cycle_nodes:
        emit("negative-cycle", "检测到负权环：对角线为负 / Negative cycle detected", "negative-cycle",
             cycle={"hasCycle": True, "nodeIds": cycle_nodes})
        emit("done", "存在负权环，最短路径未定义 / Negative cycle: shortest paths are undefined", "done",
             cycle={"hasCycle": True, "nodeIds": cycle_nodes}, path=[], path_distance=None)
        return

    path, path_distance = reconstruct_path()
    emit("done", "矩阵稳定；恢复路径 " + (" → ".join(path) if path else "不可达") + " / Matrix complete", "done",
         cycle={"hasCycle": False, "nodeIds": []}, path=path, path_distance=path_distance)

floyd_warshall()
`;

const BELLMAN_PROGRAM = `${SHORTEST_PATH_INPUT_HELPER}

def safe_distance(value):
    return None if value == math.inf else value

def bellman_ford():
    count = len(nodes)
    distances = {node: math.inf for node in nodes}
    previous = {node: None for node in nodes}
    max_rounds = max(0, count - 1)
    early_exit = False
    cycle_nodes = []

    def distance_rows():
        return [{"fromId": start, "toId": node, "distance": safe_distance(distances[node])} for node in nodes]

    def previous_rows():
        return [{"fromId": start, "toId": node, "previousId": previous[node]} for node in nodes]

    def emit(operation, message, lesson, round_number=0, edge=None, current=None, neighbor=None,
             relax=None, updated_in_round=False, early=False, cycle=None, path=None, path_distance=None):
        trace(
            {"type": "graph", "values": nodes, "focus": [node for node in (current, neighbor) if node]},
            message,
            line=sys._getframe(1).f_lineno,
            variables={
                "round": round_number,
                "current": current,
                "neighbor": neighbor,
                "candidate": (distances[current] + next((w for a, w, eid in adjacency[current] if eid == edge), 0)) if current is not None and edge is not None and distances[current] != math.inf else None,
                "updated": relax is not None,
            },
            lesson_step=lesson,
            structure={
                "kind": "bellman-ford",
                "algorithm": "bellman-ford",
                "operation": operation,
                "nodes": nodes_payload,
                "edges": edges_payload,
                "directed": directed,
                "startNodeId": start,
                "targetNodeId": target,
                "round": round_number,
                "maxRounds": max_rounds,
                "currentNodeId": current,
                "currentEdgeId": edge,
                "neighborNodeId": neighbor,
                "distances": distance_rows(),
                "previous": previous_rows(),
                "relax": relax,
                "updatedInRound": updated_in_round,
                "earlyExit": early,
                "negativeCycle": cycle,
                "pathNodeIds": path or [],
                "pathDistance": path_distance,
            },
        )

    def reconstruct_path():
        if not cycle_nodes and target != start and distances[target] == math.inf:
            return [], None
        if cycle_nodes:
            return [], None
        path = []
        cursor = target
        seen = set()
        while cursor is not None and cursor not in seen:
            seen.add(cursor)
            path.append(cursor)
            if cursor == start:
                break
            cursor = previous[cursor]
        if not path or path[-1] != start:
            return [], None
        path.reverse()
        return path, safe_distance(distances[target])

    emit("init", "初始化：起点距离 0，其余 ∞ / Init: start 0, all others ∞", "init")
    if not nodes:
        emit("done", "空图：没有节点可处理 / Empty graph: nothing to process", "done",
             cycle={"hasCycle": False, "nodeIds": []}, path=[], path_distance=None)
        return

    distances[start] = 0
    emitted_early_exit = False
    completed_round = 0
    for round_number in range(1, max_rounds + 1):
        updated_in_round = False
        emit("round-start", "第 " + str(round_number) + " / " + str(max_rounds) + " 轮松弛开始 / Relaxation round begins", "round", round_number=round_number)
        for edge in edges_payload:
            u = edge["fromId"]
            v = edge["toId"]
            weight = edge["weight"]
            emit("inspect-edge", "检查边 " + u + "->" + v + "，权重 " + str(weight) + " / Inspect edge", "inspect",
                 round_number=round_number, edge=edge["id"], current=u, neighbor=v, updated_in_round=updated_in_round)
            if distances[u] == math.inf:
                emit("skip", u + " 不可达，跳过这条边 / Source is unreachable", "skip",
                     round_number=round_number, edge=edge["id"], current=u, neighbor=v, updated_in_round=updated_in_round)
                continue
            candidate = distances[u] + weight
            if candidate < distances[v]:
                old_distance = safe_distance(distances[v])
                old_previous = previous[v]
                distances[v] = candidate
                previous[v] = u
                updated_in_round = True
                emit("relax", "松弛 " + v + "：" + ("∞" if old_distance is None else str(old_distance)) + " → " + str(candidate) + " / Relax succeeds", "relax",
                     round_number=round_number, edge=edge["id"], current=u, neighbor=v,
                     relax={"nodeId": v, "oldDistance": old_distance, "newDistance": candidate,
                            "oldPreviousId": old_previous, "newPreviousId": u},
                     updated_in_round=True)
            else:
                emit("skip", v + "：候选 " + str(candidate) + " 没有严格更小 / No strict improvement", "skip",
                     round_number=round_number, edge=edge["id"], current=u, neighbor=v, updated_in_round=updated_in_round)
        emit("round-end", "第 " + str(round_number) + " 轮结束" + ("，本轮有更新 / updates occurred" if updated_in_round else "，本轮没有更新 / no update"),
             "round", round_number=round_number, updated_in_round=updated_in_round)
        completed_round = round_number
        if not updated_in_round:
            early_exit = True
            emit("early-exit", "本轮没有更新，提前结束 / Early exit: no update", "early-exit",
                 round_number=round_number, early=True)
            emitted_early_exit = True
            break

    if emitted_early_exit:
        cycle_nodes = []
    else:
        for edge in edges_payload:
            u = edge["fromId"]
            v = edge["toId"]
            weight = edge["weight"]
            if distances[u] != math.inf and distances[v] > distances[u] + weight:
                cycle_nodes = [u, v]
                break
    if cycle_nodes:
        emit("negative-cycle", "检测到从起点可达的负权环 / Reachable negative cycle detected", "negative-cycle",
             round_number=completed_round, cycle={"hasCycle": True, "nodeIds": cycle_nodes})
        emit("done", "存在负权环，最短路径未定义 / Negative cycle: shortest paths are undefined", "done",
             round_number=completed_round, cycle={"hasCycle": True, "nodeIds": cycle_nodes}, path=[], path_distance=None)
        return

    path, path_distance = reconstruct_path()
    emit("done", "完成；恢复路径 " + (" → ".join(path) if path else "不可达") + " / Bellman-Ford complete", "done",
         round_number=completed_round, early=emitted_early_exit,
         cycle={"hasCycle": False, "nodeIds": []}, path=path, path_distance=path_distance)

bellman_ford()
`;

export const FLOYD_PYTHON = `import math\nimport sys\n\n${FLOYD_PROGRAM}`;
export const BELLMAN_PYTHON = `import math\nimport sys\n\n${BELLMAN_PROGRAM}`;

export function floydWarshallPythonExample(): string {
  return FLOYD_PYTHON;
}

export function bellmanFordPythonExample(): string {
  return BELLMAN_PYTHON;
}

export function floydWarshallDefaultInput(): unknown {
  return FLOYD_DEFAULT_INPUT;
}

export function bellmanFordDefaultInput(): unknown {
  return BELLMAN_DEFAULT_INPUT;
}

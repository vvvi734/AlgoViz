/**
 * G3: real Python teaching programs for directed acyclic graphs.
 *
 * Two deliberately different contracts share one DAG input helper family:
 * - Kahn topological sort (`topological-sort`) uses unweighted dependency edges
 *   and a FIFO queue of zero-indegree vertices.
 * - AOE critical path (`critical-path`) uses non-negative activity durations and
 *   the classic two-pass ve / vl event-time table.
 *
 * Both reject undirected input, self-loops and duplicate same-direction edges.
 * The critical-path program additionally rejects negative or non-finite
 * durations; ordinary directed cycles are reported by Kahn instead of being
 * treated as a DAG.
 */

const DAG_HEADER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
directed = raw.get("directed", True)
if directed is not True:
    raise ValueError("this algorithm requires a directed graph; undirected graphs are not supported")
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 12:
    raise ValueError("a teaching DAG supports at most 12 nodes")
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
    raise ValueError("edges must be an array")
if len(edges_input) > 30:
    raise ValueError("a teaching DAG supports at most 30 raw edges")
nodes_payload = [{"id": node, "value": node} for node in nodes]
`;

export const TOPOLOGICAL_INPUT_HELPER = `${DAG_HEADER}
adjacency = {node: [] for node in nodes}
indegree = {node: 0 for node in nodes}
edge_rows = []
edge_pairs = set()
for raw_edge in edges_input:
    if isinstance(raw_edge, dict):
        a, b = raw_edge.get("from"), raw_edge.get("to")
    elif isinstance(raw_edge, (list, tuple)) and len(raw_edge) == 2:
        a, b = raw_edge
    else:
        raise ValueError("every edge must be [from, to] or {from, to}")
    if not isinstance(a, str) or not isinstance(b, str) or a not in node_set or b not in node_set:
        raise ValueError("an edge endpoint does not exist")
    if a == b:
        raise ValueError("self-loops are not supported by a DAG teaching graph")
    if (a, b) in edge_pairs:
        raise ValueError("duplicate directed edge " + a + "->" + b)
    if len(edge_rows) >= 20:
        raise ValueError("a teaching DAG supports at most 20 unique edges")
    edge_pairs.add((a, b))
    edge_id = "e" + str(len(edge_rows) + 1)
    edge_rows.append({"id": edge_id, "fromId": a, "toId": b})
    adjacency[a].append((b, edge_id))
    indegree[b] += 1
`;

export const AOE_INPUT_HELPER = `${DAG_HEADER}
adjacency = {node: [] for node in nodes}
predecessors = {node: [] for node in nodes}
indegree = {node: 0 for node in nodes}
outdegree = {node: 0 for node in nodes}
edge_rows = []
edge_pairs = set()
for raw_edge in edges_input:
    if isinstance(raw_edge, dict):
        a, b, duration = raw_edge.get("from"), raw_edge.get("to"), raw_edge.get("duration")
    elif isinstance(raw_edge, (list, tuple)) and len(raw_edge) == 3:
        a, b, duration = raw_edge
    else:
        raise ValueError("every activity must be [from, to, duration] or {from, to, duration}")
    if not isinstance(a, str) or not isinstance(b, str) or a not in node_set or b not in node_set:
        raise ValueError("an activity endpoint does not exist")
    if a == b:
        raise ValueError("self-loops are not an AOE activity")
    if isinstance(duration, bool) or not isinstance(duration, (int, float)):
        raise ValueError("activity duration must be a finite non-negative number")
    if not math.isfinite(duration) or duration < 0:
        raise ValueError("activity duration must be finite and non-negative")
    if (a, b) in edge_pairs:
        raise ValueError("duplicate activity " + a + "->" + b)
    if len(edge_rows) >= 20:
        raise ValueError("a teaching AOE network supports at most 20 activities")
    edge_pairs.add((a, b))
    edge_id = "e" + str(len(edge_rows) + 1)
    edge_rows.append({"id": edge_id, "fromId": a, "toId": b, "duration": duration})
    adjacency[a].append((b, edge_id, duration))
    predecessors[b].append((a, edge_id, duration))
    indegree[b] += 1
    outdegree[a] += 1
source_nodes = [node for node in nodes if indegree[node] == 0]
sink_nodes = [node for node in nodes if outdegree[node] == 0]
`;

export const TOPOLOGICAL_DEFAULT_INPUT: unknown = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  edges: [
    ['A', 'C'],
    ['A', 'D'],
    ['B', 'C'],
    ['B', 'E'],
    ['C', 'F'],
    ['D', 'F'],
    ['E', 'G'],
    ['F', 'G'],
  ],
};

export const CRITICAL_PATH_DEFAULT_INPUT: unknown = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    ['A', 'B', 3],
    ['A', 'C', 2],
    ['B', 'D', 2],
    ['B', 'E', 6],
    ['C', 'D', 4],
    ['D', 'E', 3],
    ['E', 'F', 2],
  ],
};

export const TOPOLOGICAL_PROGRAM = `${TOPOLOGICAL_INPUT_HELPER}
queue_nodes = []
queue_items = []
queue_sequence = [0]
topological_order = []
removed_edges = []

def snapshot(operation, message, line, lesson, current_node=None, current_edge=None, neighbor=None, change=None, added=None, removed=None, has_cycle=False, cycle_ids=None):
    payload = {
        "kind": "topological-sort", "algorithm": "kahn", "operation": operation,
        "nodes": nodes_payload, "edges": edge_rows, "directed": True,
        "indegree": [{"nodeId": node, "indegree": indegree[node]} for node in nodes],
        "queue": [dict(item) for item in queue_items],
        "queueAdded": added, "queueRemoved": removed,
        "currentNodeId": current_node, "currentEdgeId": current_edge, "neighborNodeId": neighbor,
        "indegreeChange": change, "removedEdgeIds": removed_edges[:],
        "topologicalOrder": topological_order[:],
        "hasCycle": has_cycle, "cycleNodeIds": cycle_ids or [],
    }
    variables = {
        "indegree": {node: indegree[node] for node in nodes},
        "queue": queue_nodes[:],
        "topological_order": topological_order[:],
        "current": current_node,
    }
    trace(
        {"type": "graph", "values": nodes[:], "focus": []},
        message, line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

def enqueue(node):
    queue_sequence[0] += 1
    item = {"id": "q" + str(queue_sequence[0]), "nodeId": node}
    queue_nodes.append(node)
    queue_items.append(item)
    return item

snapshot("init", "初始化：统计每个顶点的入度 / Initialise: count every vertex indegree", 1, "init")
if not nodes:
    snapshot("done", "空图：拓扑序列为空 / Empty graph: the topological order is empty", 1, "done")
else:
    for source in sorted(node for node in nodes if indegree[node] == 0):
        added = enqueue(source)
        snapshot("enqueue", "入度为 0：源点 " + source + " 进入候选队列 / Source " + source + " enters the queue", 1, "seed", added=added)
    while queue_nodes:
        node = queue_nodes.pop(0)
        removed = queue_items.pop(0)
        topological_order.append(node)
        snapshot("dequeue", "出队 " + node + "：加入拓扑序列 / Dequeue " + node + " into the order", 1, "dequeue", current_node=node, removed=removed)
        for neighbor, edge_id in sorted(adjacency[node], key=lambda item: (item[0], item[1])):
            snapshot("inspect-edge", "检查依赖 " + node + "→" + neighbor + " / Inspect dependency " + node + "→" + neighbor, 1, "inspect", current_node=node, current_edge=edge_id, neighbor=neighbor)
            before = indegree[neighbor]
            after = before - 1
            indegree[neighbor] = after
            removed_edges.append(edge_id)
            snapshot("decrement", "移除 " + node + "→" + neighbor + "：入度 " + str(before) + " → " + str(after) + " / Remove it: indegree " + str(before) + " → " + str(after), 1, "decrement", current_node=node, current_edge=edge_id, neighbor=neighbor, change={"nodeId": neighbor, "before": before, "after": after})
            if after == 0:
                added = enqueue(neighbor)
                snapshot("enqueue-node", "新零入度 " + neighbor + " 入队 / New zero-indegree vertex " + neighbor + " enters the queue", 1, "enqueue", current_node=node, added=added)
    if len(topological_order) != len(nodes):
        cycle_nodes = [node for node in nodes if indegree[node] > 0]
        snapshot("cycle", "剩余顶点入度仍大于 0：存在有向环，无法完成拓扑排序 / Remaining indegrees are positive: a directed cycle exists", 1, "cycle", has_cycle=True, cycle_ids=cycle_nodes)
        snapshot("done", "结束：检测到有向环 / Done: directed cycle detected", 1, "done", has_cycle=True, cycle_ids=cycle_nodes)
    else:
        snapshot("done", "完成：得到完整拓扑序列 / Done: a complete topological order", 1, "done")
`;

export const CRITICAL_PATH_PROGRAM = `import math

${AOE_INPUT_HELPER}
topological_order = []
ve = {}
vl = {}
activity_rows = [
    {"edgeId": edge["id"], "fromId": edge["fromId"], "toId": edge["toId"], "duration": edge["duration"], "e": None, "l": None, "slack": None, "critical": False}
    for edge in edge_rows
]
critical_edges = []
critical_paths = []
duration_holder = [None]
MAX_CRITICAL_PATHS = 12

def kahn_order():
    remaining = {node: indegree[node] for node in nodes}
    queue = sorted(node for node in nodes if remaining[node] == 0)
    order = []
    while queue:
        node = queue.pop(0)
        order.append(node)
        for neighbor, edge_id, edge_duration in sorted(adjacency[node], key=lambda item: (item[0], item[1])):
            remaining[neighbor] -= 1
            if remaining[neighbor] == 0:
                queue.append(neighbor)
    return order, len(order) == len(nodes)

def snapshot(operation, phase, message, line, lesson, current_node=None, current_edge=None, change=None, activity_change=None, has_cycle=False, cycle_ids=None, paths=None):
    payload = {
        "kind": "critical-path", "algorithm": "aoe", "operation": operation, "phase": phase,
        "nodes": nodes_payload, "edges": edge_rows, "directed": True,
        "sourceNodeIds": source_nodes, "sinkNodeIds": sink_nodes,
        "topologicalOrder": topological_order[:],
        "veRows": [{"nodeId": node, "time": ve.get(node)} for node in nodes],
        "vlRows": [{"nodeId": node, "time": vl.get(node)} for node in nodes],
        "activities": activity_rows,
        "currentNodeId": current_node, "currentEdgeId": current_edge,
        "timeChange": change, "activityChange": activity_change,
        "criticalEdgeIds": critical_edges[:],
        "criticalPaths": paths if paths is not None else critical_paths[:],
        "projectDuration": duration_holder[0],
        "hasCycle": has_cycle, "cycleNodeIds": cycle_ids or [],
    }
    variables = {
        "ve": {node: ve.get(node) for node in nodes},
        "vl": {node: vl.get(node) for node in nodes},
        "project_duration": duration_holder[0],
        "critical_activities": critical_edges[:],
    }
    trace(
        {"type": "graph", "values": nodes[:], "focus": []},
        message, line=line, variables=variables, lesson_step=lesson, structure=payload,
    )

snapshot("init", "init", "初始化 AOE 网络：事件、活动与持续时间 / Initialise the AOE network", 1, "init")
topo_order, acyclic = kahn_order()
if not acyclic:
    topological_order = []
    cycle_nodes = [node for node in nodes if node not in topo_order]
    snapshot("cycle", "cycle", "存在有向环：AOE 关键路径要求有向无环图 / A directed cycle means there is no AOE critical path", 1, "cycle", has_cycle=True, cycle_ids=cycle_nodes)
    snapshot("done", "done", "结束：无法计算关键路径 / Done: the critical path is undefined", 1, "done", has_cycle=True, cycle_ids=cycle_nodes, paths=[])
else:
    topological_order = topo_order
    snapshot("topo-order", "topo", "拓扑排序完成：" + " → ".join(topological_order) + " / Topological order ready", 1, "topo")

    for node in topological_order:
        candidates = [ve[predecessor] + edge_duration for predecessor, edge_id, edge_duration in predecessors[node]]
        candidate = max(candidates) if candidates else 0
        old = ve.get(node)
        ve[node] = candidate
        snapshot("ve", "ve", "ve[" + node + "] = " + str(candidate) + "：取所有前驱完成时间的最大值 / Earliest event time", 1, "ve", current_node=node, change={"nodeId": node, "previousTime": old, "candidateTime": candidate, "newTime": candidate})

    if sink_nodes:
        duration_holder[0] = max(ve[sink] for sink in sink_nodes)
    else:
        duration_holder[0] = 0

    for node in reversed(topological_order):
        if node in sink_nodes:
            candidate = duration_holder[0]
        else:
            candidate = min(vl[successor] - edge_duration for successor, edge_id, edge_duration in adjacency[node])
        old = vl.get(node)
        vl[node] = candidate
        snapshot("vl", "vl", "vl[" + node + "] = " + str(candidate) + "：不影响总工期的前提下可推迟到的最迟时间 / Latest event time", 1, "vl", current_node=node, change={"nodeId": node, "previousTime": old, "candidateTime": candidate, "newTime": candidate})

    for edge in sorted(edge_rows, key=lambda item: item["id"]):
        earliest = ve[edge["fromId"]]
        latest = vl[edge["toId"]] - edge["duration"]
        slack = latest - earliest
        critical = abs(slack) <= 1e-9
        for row in activity_rows:
            if row["edgeId"] == edge["id"]:
                row["e"] = earliest
                row["l"] = latest
                row["slack"] = slack
                row["critical"] = critical
        if critical:
            critical_edges.append(edge["id"])
        snapshot("activity", "activity", "活动 " + edge["fromId"] + "→" + edge["toId"] + "：e=" + str(earliest) + "，l=" + str(latest) + "，余量=" + str(slack) + " / Activity slack", 1, "activity", current_edge=edge["id"], activity_change={"edgeId": edge["id"], "e": earliest, "l": latest, "slack": slack, "critical": critical})

    critical_ids = set(critical_edges)
    sink_set = set(sink_nodes)

    def collect(node, path, total):
        if len(critical_paths) >= MAX_CRITICAL_PATHS:
            raise ValueError("too many critical paths for a teaching run; this batch limits the list to 12")
        if node in sink_set and abs(total - duration_holder[0]) <= 1e-9:
            critical_paths.append(path[:])
            return
        for neighbor, edge_id, edge_duration in sorted(adjacency[node], key=lambda item: (item[0], item[1])):
            if edge_id in critical_ids:
                path.append(neighbor)
                collect(neighbor, path, total + edge_duration)
                path.pop()

    for source in sorted(source_nodes):
        collect(source, [source], 0)

    snapshot("done", "done", "完成：项目总工期 " + str(duration_holder[0]) + "，关键路径 " + str(len(critical_paths)) + " 条 / Done: project duration and every critical path", 1, "done", paths=critical_paths)
`;

export function topologicalPythonExample(): string {
  return TOPOLOGICAL_PROGRAM;
}

export function criticalPathPythonExample(): string {
  return CRITICAL_PATH_PROGRAM;
}

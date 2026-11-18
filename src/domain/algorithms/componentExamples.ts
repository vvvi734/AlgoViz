/**
 * G4 real Python programs for connected components and Kosaraju SCC.
 *
 * Both programs parse a JSON input containing `nodes` and `edges` and emit one
 * full structure snapshot per real operation. The Python source is executed by
 * the Pyodide worker; nothing in this file invents animation frames.
 */
export const CONNECTED_COMPONENTS_DEFAULT_INPUT: unknown = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  edges: [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'C'],
    ['D', 'E'],
    ['F', 'G'],
  ],
};

export const SCC_DEFAULT_INPUT: unknown = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  edges: [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'A'],
    ['C', 'D'],
    ['D', 'E'],
    ['E', 'D'],
    ['F', 'G'],
  ],
};

const CONNECTED_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 12:
    raise ValueError("a teaching graph supports at most 12 nodes")
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
if len(edges_input) > 30:
    raise ValueError("too many raw edges")
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
        raise ValueError("duplicate undirected edge: " + a + "--" + b)
    if len(edges_payload) >= 20:
        raise ValueError("a teaching graph supports at most 20 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_pair[key] = edge_id
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b})
    adjacency[a].append(b)
    adjacency[b].append(a)
nodes_payload = [{"id": node, "value": node} for node in nodes]`;

const SCC_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 12:
    raise ValueError("a teaching graph supports at most 12 nodes")
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
if len(edges_input) > 30:
    raise ValueError("too many raw edges")
adjacency = {node: [] for node in nodes}
reverse = {node: [] for node in nodes}
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
    key = (a, b)
    if key in edge_by_pair:
        raise ValueError("duplicate directed edge: " + a + "->" + b)
    if len(edges_payload) >= 20:
        raise ValueError("a teaching graph supports at most 20 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_pair[key] = edge_id
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b})
    adjacency[a].append(b)
    reverse[b].append(a)
nodes_payload = [{"id": node, "value": node} for node in nodes]`;

export const CONNECTED_COMPONENTS_PYTHON = `import sys

${CONNECTED_HELPER}

stack = []
entry_ids = {}
entry_seq = 0
discovered = set()
discovered_order = []
visited = set()
visited_order = []
components = []
component_id = 0
current_component = None
current_component_id = None
start_node = None


def components_payload():
    return [
        {"id": item["id"], "nodeIds": item["nodeIds"][:], "complete": item["complete"]}
        for item in components
    ]


def emit(operation, message, lesson, current=None, edge=None, neighbor=None, added=None, removed=None):
    frontier_items = [{"id": entry_ids[node], "nodeId": node} for node in stack]
    payload = {
        "kind": "connected-components",
        "algorithm": "components",
        "operation": operation,
        "nodes": nodes_payload,
        "edges": edges_payload,
        "directed": False,
        "startNodeId": start_node,
        "currentNodeId": current,
        "currentEdgeId": edge,
        "neighborNodeId": neighbor,
        "discoveredIds": discovered_order[:],
        "visitedIds": visited_order[:],
        "frontierKind": "stack",
        "frontierItems": frontier_items,
        "frontierAdded": added,
        "frontierRemoved": removed,
        "currentComponentId": current_component_id,
        "componentCount": len(components),
        "components": components_payload(),
    }
    variables = {
        "stack": stack[:],
        "component": current_component_id,
        "discovered": discovered_order[:],
        "visited": visited_order[:],
        "components": components_payload(),
    }
    trace(
        {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": visited_order[:]},
        message,
        line=sys._getframe(1).f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


emit("init", "初始化：建立无向邻接表，准备扫描所有分量 / Init: build the undirected adjacency list", "init")
if not nodes:
    emit("done", "空图：没有节点，也没有连通分量 / Empty graph: no components", "done")
else:
    for start in nodes:
        if start in discovered:
            continue
        component_id += 1
        current_component_id = component_id
        start_node = start
        current_component = {"id": component_id, "nodeIds": [start], "complete": False}
        components.append(current_component)
        discovered.add(start)
        discovered_order.append(start)
        entry_seq += 1
        entry_ids[start] = "s" + str(entry_seq)
        stack.append(start)
        added = {"id": entry_ids[start], "nodeId": start}
        emit(
            "start-component",
            "选择未访问节点 " + start + "，开始分量 C" + str(component_id) + " / Start component C" + str(component_id),
            "start",
            current=start,
            added=added,
        )
        while stack:
            current = stack.pop()
            removed = {"id": entry_ids.pop(current), "nodeId": current}
            emit("pop", current + " 从 DFS 栈弹出 / " + current + " pops from the stack", "pop", current=current, removed=removed)
            visited.add(current)
            visited_order.append(current)
            emit(
                "visit",
                "访问 " + current + "：加入分量 C" + str(component_id) + " / Visit " + current,
                "visit",
                current=current,
            )
            for neighbor in adjacency[current]:
                edge = edge_by_pair[tuple(sorted((current, neighbor)))]
                emit(
                    "inspect-edge",
                    "检查边 " + current + "–" + neighbor + " / Inspect " + current + "–" + neighbor,
                    "inspect",
                    current=current,
                    edge=edge,
                    neighbor=neighbor,
                )
                if neighbor in discovered:
                    emit("skip", neighbor + " 已发现，留在同一分量 / " + neighbor + " already discovered", "skip", current=current, edge=edge, neighbor=neighbor)
                    continue
                discovered.add(neighbor)
                discovered_order.append(neighbor)
                current_component["nodeIds"].append(neighbor)
                emit(
                    "discover",
                    "第一次发现 " + neighbor + "，并入 C" + str(component_id) + " / Discover " + neighbor,
                    "discover",
                    current=current,
                    edge=edge,
                    neighbor=neighbor,
                )
                entry_seq += 1
                entry_ids[neighbor] = "s" + str(entry_seq)
                stack.append(neighbor)
                added = {"id": entry_ids[neighbor], "nodeId": neighbor}
                emit(
                    "push",
                    neighbor + " 压入 DFS 栈 / " + neighbor + " is pushed on the stack",
                    "push",
                    current=neighbor,
                    edge=edge,
                    neighbor=neighbor,
                    added=added,
                )
        current_component["complete"] = True
        emit(
            "complete-component",
            "分量 C" + str(component_id) + " 完成：栈为空，所有可达节点已访问 / Component C" + str(component_id) + " complete",
            "complete",
            current=None,
        )
    current_component_id = None
    current_component = None
    start_node = None
    emit("done", "所有分量完成 / All connected components complete", "done")

print("components", [item["nodeIds"] for item in components])
`;

export const SCC_PYTHON = `import sys

${SCC_HELPER}

stack = []
entry_ids = {}
entry_seq = 0
discovered = set()
discovered_order = []
visited = set()
visited_order = []
finish_order = []
second_pass_order = []
second_pass_index = None
components = []
component_id = 0
current_component = None
current_component_id = None
start_node = None
phase = "first-pass"
reversed_graph = False


def components_payload():
    return [
        {"id": item["id"], "nodeIds": item["nodeIds"][:], "complete": item["complete"]}
        for item in components
    ]


def emit(operation, message, lesson, current=None, edge=None, neighbor=None, added=None, removed=None):
    frontier_items = [{"id": entry_ids[node], "nodeId": node} for node, _ in stack]
    payload = {
        "kind": "kosaraju",
        "algorithm": "kosaraju",
        "operation": operation,
        "nodes": nodes_payload,
        "edges": edges_payload,
        "directed": True,
        "startNodeId": start_node,
        "currentNodeId": current,
        "currentEdgeId": edge,
        "neighborNodeId": neighbor,
        "discoveredIds": discovered_order[:],
        "visitedIds": visited_order[:],
        "frontierKind": "stack",
        "frontierItems": frontier_items,
        "frontierAdded": added,
        "frontierRemoved": removed,
        "phase": phase,
        "reversed": reversed_graph,
        "finishOrder": finish_order[:],
        "secondPassOrder": second_pass_order[:],
        "secondPassIndex": second_pass_index,
        "currentComponentId": current_component_id,
        "componentCount": len(components),
        "components": components_payload(),
    }
    variables = {
        "stack": [node for node, _ in stack],
        "phase": phase,
        "finish_order": finish_order[:],
        "second_pass": second_pass_order[:],
        "components": components_payload(),
    }
    trace(
        {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": visited_order[:]},
        message,
        line=sys._getframe(1).f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


emit("init", "初始化：建立原图与反向图邻接表 / Init: build the original and reversed adjacency lists", "init")
if not nodes:
    phase = "done"
    emit("done", "空图：没有节点，也没有强连通分量 / Empty graph: no SCCs", "done")
else:
    # First pass: iterative DFS on the original graph, recording real finish order.
    for root in nodes:
        if root in discovered:
            continue
        start_node = root
        discovered.add(root)
        discovered_order.append(root)
        entry_seq += 1
        entry_ids[root] = "s" + str(entry_seq)
        stack.append([root, 0])
        added = {"id": entry_ids[root], "nodeId": root}
        emit("start-first", "第一次 DFS：从 " + root + " 开始 / First pass starts at " + root, "start-first", current=root, added=added)
        while stack:
            node, cursor = stack[-1]
            if cursor < len(adjacency[node]):
                neighbor = adjacency[node][cursor]
                edge = edge_by_pair[(node, neighbor)]
                stack[-1][1] += 1
                emit(
                    "inspect-edge",
                    "第一次 DFS 检查 " + node + "→" + neighbor + " / Inspect " + node + "→" + neighbor,
                    "inspect",
                    current=node,
                    edge=edge,
                    neighbor=neighbor,
                )
                if neighbor in discovered:
                    emit("skip", neighbor + " 已发现，跳过 / " + neighbor + " already discovered", "skip", current=node, edge=edge, neighbor=neighbor)
                    continue
                discovered.add(neighbor)
                discovered_order.append(neighbor)
                entry_seq += 1
                entry_ids[neighbor] = "s" + str(entry_seq)
                stack.append([neighbor, 0])
                added = {"id": entry_ids[neighbor], "nodeId": neighbor}
                emit(
                    "push",
                    neighbor + " 压入第一次 DFS 栈 / " + neighbor + " pushed on the first-pass stack",
                    "push",
                    current=neighbor,
                    edge=edge,
                    neighbor=neighbor,
                    added=added,
                )
            else:
                stack.pop()
                removed = {"id": entry_ids.pop(node), "nodeId": node}
                visited.add(node)
                visited_order.append(node)
                finish_order.append(node)
                emit(
                    "finish",
                    node + " 完成，加入完成顺序 #" + str(len(finish_order)) + " / " + node + " finishes",
                    "finish",
                    current=node,
                    removed=removed,
                )

    # The reverse frame is a real state transition: edges are now drawn reversed
    # and the first-pass sets are reset for the second DFS.
    phase = "reverse"
    reversed_graph = True
    second_pass_order = list(reversed(finish_order))
    second_pass_index = None
    discovered = set()
    discovered_order = []
    visited = set()
    visited_order = []
    stack = []
    components = []
    current_component = None
    current_component_id = None
    start_node = None
    emit("reverse", "反转所有边，按完成顺序的逆序准备第二次 DFS / Reverse edges and reverse the finish order", "reverse")

    # Second pass: DFS on the reversed graph, assigning one SCC per root.
    phase = "second-pass"
    assigned = set()
    for order_index, root in enumerate(second_pass_order):
        if root in assigned:
            continue
        component_id += 1
        current_component_id = component_id
        start_node = root
        second_pass_index = order_index
        current_component = {"id": component_id, "nodeIds": [root], "complete": False}
        components.append(current_component)
        assigned.add(root)
        discovered.add(root)
        discovered_order.append(root)
        entry_seq += 1
        entry_ids[root] = "s" + str(entry_seq)
        stack.append([root, 0])
        added = {"id": entry_ids[root], "nodeId": root}
        emit(
            "start-second",
            "按逆序选择 " + root + "，开始强连通分量 C" + str(component_id) + " / Start SCC C" + str(component_id),
            "start-second",
            current=root,
            added=added,
        )
        while stack:
            node, cursor = stack[-1]
            if cursor < len(reverse[node]):
                neighbor = reverse[node][cursor]
                edge = edge_by_pair[(neighbor, node)]
                stack[-1][1] += 1
                emit(
                    "inspect-edge",
                    "第二次 DFS 在反向图检查 " + node + "←" + neighbor + " / Inspect reversed edge",
                    "inspect",
                    current=node,
                    edge=edge,
                    neighbor=neighbor,
                )
                if neighbor in assigned:
                    emit("skip", neighbor + " 已分配，跳过 / " + neighbor + " already assigned", "skip", current=node, edge=edge, neighbor=neighbor)
                    continue
                assigned.add(neighbor)
                discovered.add(neighbor)
                discovered_order.append(neighbor)
                current_component["nodeIds"].append(neighbor)
                entry_seq += 1
                entry_ids[neighbor] = "s" + str(entry_seq)
                stack.append([neighbor, 0])
                added = {"id": entry_ids[neighbor], "nodeId": neighbor}
                emit(
                    "push",
                    neighbor + " 压入第二次 DFS 栈，并入 C" + str(component_id),
                    "push",
                    current=neighbor,
                    edge=edge,
                    neighbor=neighbor,
                    added=added,
                )
            else:
                stack.pop()
                removed = {"id": entry_ids.pop(node), "nodeId": node}
                visited.add(node)
                visited_order.append(node)
                emit("assign", node + " 归入强连通分量 C" + str(component_id) + " / Assign SCC", "assign", current=node, removed=removed)
        current_component["complete"] = True
        emit(
            "complete-component",
            "强连通分量 C" + str(component_id) + " 完成 / SCC C" + str(component_id) + " complete",
            "complete",
            current=None,
        )
    phase = "done"
    start_node = None
    current_component_id = None
    current_component = None
    second_pass_index = None
    emit("done", "Kosaraju 完成：共 " + str(len(components)) + " 个强连通分量 / Kosaraju complete", "done")

print("scc", [item["nodeIds"] for item in components])
`;

export function connectedComponentsPythonExample(): string {
  return CONNECTED_COMPONENTS_PYTHON;
}

export function kosarajuPythonExample(): string {
  return SCC_PYTHON;
}

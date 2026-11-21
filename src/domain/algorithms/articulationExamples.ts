/**
 * TEXTBOOK-07: articulation points by the classic DFS low-link method.
 *
 * The Python string below is executed by Pyodide. Every frame is emitted after a
 * real state transition: discovery, tree/back-edge classification, low update,
 * a completed child return, the root condition, or a finished vertex. The graph
 * is always the student's input; no fixed DFS frame is replayed.
 */
import type { AlgorithmEntry } from './types';

export const ARTICULATION_ENTRY: AlgorithmEntry = {
  group: 'graph',
  icon: '◉',
  name: ['关节点检测（DFS low-link）', 'Articulation points (DFS low-link)'],
  desc: [
    '真实递归 DFS 维护 disc 发现时间与 low 最早可回溯时间。非根顶点存在 low[v] ≥ disc[u] 的树孩子时成为关节点，根顶点只有至少两个 DFS 树孩子时才是关节点；同一遍 DFS 同时记录桥。',
    'A real recursive DFS maintains discovery time disc and earliest reachable time low. A non-root vertex becomes a cut vertex when a tree child has low[v] ≥ disc[u]; the root only qualifies with at least two DFS children. The same pass records bridges.',
  ],
  time: 'O(V+E)',
  space: 'O(V+E)',
  input: undefined,
  code: "trace({type:'array',values:['Articulation points: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const ARTICULATION_DEFAULT_INPUT: unknown = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  edges: [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'C'],
    ['C', 'D'],
    ['D', 'E'],
    ['D', 'F'],
    ['E', 'F'],
    ['G', 'H'],
  ],
};

export const ARTICULATION_PYTHON = `import sys

raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 10:
    raise ValueError("an articulation-point lesson supports at most 10 nodes")
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
if len(edges_input) > 16:
    raise ValueError("an articulation-point lesson supports at most 16 edges")
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
    if len(edges_payload) >= 16:
        raise ValueError("an articulation-point lesson supports at most 16 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_pair[key] = edge_id
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b})
    adjacency[a].append(b)
    adjacency[b].append(a)
nodes_payload = [{"id": node, "value": node} for node in nodes]

disc = {}
low = {}
parent = {}
discovered_order = []
tree_edge_ids = []
back_edge_ids = []
articulation_ids = []
bridge_ids = []
stack = []
entry_ids = {}
entry_seq = 0
timer = 0
root_id = None
root_count = 0
root_child_count = 0
current_node = None
current_edge = None
neighbor_node = None


def node_records(values):
    return [{"nodeId": node, "value": values.get(node, 0)} for node in nodes]


def parent_records():
    return [{"nodeId": node, "parentId": parent.get(node)} for node in nodes]


def emit(operation, message, lesson, current=None, edge=None, neighbor=None, added=None, removed=None, decision=None):
    frontier_items = [{"id": entry_ids[node], "nodeId": node} for node in stack]
    articulation_view = [node for node in nodes if node in articulation_ids]
    payload = {
        "kind": "articulation",
        "algorithm": "articulation",
        "operation": operation,
        "nodes": nodes_payload,
        "edges": edges_payload,
        "directed": False,
        "currentNodeId": current,
        "currentEdgeId": edge,
        "neighborNodeId": neighbor,
        "rootId": root_id,
        "parentId": parent.get(current) if current is not None else None,
        "rootChildCount": root_child_count,
        "disc": node_records(disc),
        "low": node_records(low),
        "parents": parent_records(),
        "dfsOrder": discovered_order[:],
        "treeEdgeIds": tree_edge_ids[:],
        "backEdgeIds": back_edge_ids[:],
        "articulationIds": articulation_view,
        "bridgeIds": bridge_ids[:],
        "frontierItems": frontier_items,
        "frontierAdded": added,
        "frontierRemoved": removed,
        "decision": decision,
    }
    variables = {
        "disc": node_records(disc),
        "low": node_records(low),
        "root": root_id,
        "tree_edges": tree_edge_ids[:],
        "back_edges": back_edge_ids[:],
        "articulation": articulation_view,
        "bridges": bridge_ids[:],
    }
    trace(
        {"type": "graph", "values": nodes, "focus": [current] if current else [], "visited": discovered_order[:]},
        message,
        line=sys._getframe(1).f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


def dfs(u, root):
    global timer, root_child_count, current_node, current_edge, neighbor_node, entry_seq
    timer += 1
    disc[u] = timer
    low[u] = disc[u]
    discovered_order.append(u)
    entry_seq += 1
    entry_ids[u] = "s" + str(entry_seq)
    stack.append(u)
    added = {"id": entry_ids[u], "nodeId": u}
    current_node = u
    emit(
        "discover",
        "发现 " + u + "：disc=" + str(disc[u]) + "，low 先等于 disc / Discover " + u + ": disc=" + str(disc[u]) + ", low starts equal",
        "discover",
        current=u,
        added=added,
    )

    child_count = 0
    for v in adjacency[u]:
        edge_id = edge_by_pair[tuple(sorted((u, v)))]
        current_node = u
        current_edge = edge_id
        neighbor_node = v
        emit(
            "inspect-edge",
            "检查边 " + u + "–" + v + " / Inspect edge " + u + "–" + v,
            "inspect",
            current=u,
            edge=edge_id,
            neighbor=v,
        )
        if v not in disc:
            parent[v] = u
            child_count += 1
            if u == root:
                root_child_count = child_count
            tree_edge_ids.append(edge_id)
            emit(
                "tree-edge",
                u + "–" + v + " 是 DFS 树边；进入 " + v + " / " + u + "–" + v + " is a DFS tree edge",
                "tree-edge",
                current=u,
                edge=edge_id,
                neighbor=v,
            )
            dfs(v, root)
            if low[v] < low[u]:
                low[u] = low[v]
            emit(
                "update-low",
                "从子节点 " + v + " 返回：low[" + u + "] = min(low[" + u + "], low[" + v + "]) = " + str(low[u]) + " / Propagate low back",
                "update-low",
                current=u,
                edge=edge_id,
                neighbor=v,
            )
            if u != root and low[v] >= disc[u] and u not in articulation_ids:
                articulation_ids.append(u)
                emit(
                    "cut-vertex",
                    "low[" + v + "]=" + str(low[v]) + " ≥ disc[" + u + "]=" + str(disc[u]) + "，非根节点 " + u + " 是关节点 / non-root " + u + " is an articulation point",
                    "cut",
                    current=u,
                    edge=edge_id,
                    neighbor=v,
                    decision="non-root-low",
                )
            if low[v] > disc[u]:
                if edge_id not in bridge_ids:
                    bridge_ids.append(edge_id)
                emit(
                    "bridge",
                    "low[" + v + "]=" + str(low[v]) + " > disc[" + u + "]=" + str(disc[u]) + "，边 " + edge_id + " 是桥 / " + edge_id + " is a bridge",
                    "bridge",
                    current=u,
                    edge=edge_id,
                    neighbor=v,
                    decision="bridge",
                )
        elif v != parent.get(u) and disc[v] < disc[u]:
            if edge_id not in back_edge_ids:
                back_edge_ids.append(edge_id)
            emit(
                "back-edge",
                v + " 已发现且不是父节点：" + edge_id + " 是返祖边 / " + edge_id + " is a back edge",
                "back",
                current=u,
                edge=edge_id,
                neighbor=v,
            )
            if disc[v] < low[u]:
                low[u] = disc[v]
            emit(
                "update-low",
                "返祖边让 low[" + u + "] 回退到 disc[" + v + "] = " + str(disc[v]) + " / Back edge lowers low",
                "update-low",
                current=u,
                edge=edge_id,
                neighbor=v,
            )

    if u == root:
        if child_count >= 2:
            if root not in articulation_ids:
                articulation_ids.append(root)
            emit(
                "root-confirm",
                "根 " + root + " 有 " + str(child_count) + " 个 DFS 树孩子，是关节点 / root has " + str(child_count) + " DFS children, so it is a cut vertex",
                "root",
                current=u,
                decision="root-multi-child",
            )
        else:
            emit(
                "root-check",
                "根 " + root + " 只有 " + str(child_count) + " 个 DFS 树孩子，不是关节点 / root has only " + str(child_count) + " DFS child, so it is not a cut vertex",
                "root",
                current=u,
                decision="root-single-child",
            )

    stack.pop()
    removed = {"id": entry_ids.pop(u), "nodeId": u}
    emit(
        "finish-node",
        u + " 完成：disc=" + str(disc[u]) + "，low=" + str(low[u]) + "，返回父节点 / " + u + " finishes",
        "finish",
        current=u,
        removed=removed,
    )


emit("init", "初始化：无向邻接表、disc/low、DFS 父节点与边分类 / Init: undirected adjacency, disc/low, parent and edge classes", "init")
if not nodes:
    emit("done", "空图：没有顶点，也没有关节点 / Empty graph: no articulation points", "done")
else:
    for start in nodes:
        if start in disc:
            continue
        root_id = start
        root_count += 1
        root_child_count = 0
        parent[start] = None
        emit(
            "start-root",
            "从尚未访问的顶点 " + start + " 开始第 " + str(root_count) + " 棵 DFS 树 / Start DFS tree " + str(root_count) + " at " + start,
            "start-root",
            current=start,
        )
        dfs(start, start)
    emit("done", "DFS 结束：关节点 " + str(articulation_ids) + "；桥 " + str(bridge_ids) + " / Done", "done")

print("articulation", articulation_ids)
print("bridges", bridge_ids)
`;

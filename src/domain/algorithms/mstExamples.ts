/**
 * G2: real Python teaching programs for Prim and Kruskal minimum spanning trees.
 *
 * The input contract is deliberately narrower than the shortest-path graphs:
 * `{start?, nodes, edges}` with `directed` absent or false. Both programs reject
 * directed input instead of silently treating it as undirected. Negative edge
 * weights are legal for an MST, so they are accepted here; only self-loops, duplicate
 * undirected edges, non-finite weights and unknown endpoints are rejected.
 *
 * Every snapshot is taken after a real Python operation. Prim records its
 * heapq candidates and the growing tree, while Kruskal records the sorted edge
 * order, the live union-find parent/rank table and each accepted/rejected edge.
 */
export const MST_INPUT_HELPER = `raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be an object: {start, nodes, edges}")
nodes_input = raw.get("nodes")
edges_input = raw.get("edges", [])
directed = raw.get("directed", False)
if directed is not False:
    raise ValueError("minimum spanning tree requires an undirected graph; directed graphs are not supported")
if not isinstance(nodes_input, list):
    raise ValueError("nodes must be an array of non-empty strings")
if len(nodes_input) > 12:
    raise ValueError("a teaching MST supports at most 12 nodes")
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
if len(edges_input) > 30:
    raise ValueError("a teaching MST supports at most 30 raw edges")
adjacency = {node: [] for node in nodes}
edges_payload = []
edge_by_key = {}
edge_order = {}
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
    key = tuple(sorted((a, b)))
    if key in edge_by_key:
        raise ValueError("duplicate undirected edge " + a + "-" + b)
    if len(edges_payload) >= 20:
        raise ValueError("a teaching MST supports at most 20 unique edges")
    edge_id = "e" + str(len(edges_payload) + 1)
    edge_by_key[key] = edge_id
    edge_order[edge_id] = len(edges_payload)
    edges_payload.append({"id": edge_id, "fromId": a, "toId": b, "weight": weight})
    adjacency[a].append((b, weight, edge_id))
    adjacency[b].append((a, weight, edge_id))
start = raw.get("start")
if nodes and start is not None:
    if not isinstance(start, str) or start not in node_set:
        raise ValueError("start must name an existing node")
nodes_payload = [{"id": node, "value": node} for node in nodes]
`;

export const PRIM_DEFAULT_INPUT: unknown = {
  start: 'A',
  nodes: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    ['B', 'C', 2],
    ['A', 'B', 2],
    ['A', 'C', 2],
    ['C', 'D', 1],
    ['D', 'E', 1],
    ['C', 'E', 3],
  ],
};

export const KRUSKAL_DEFAULT_INPUT: unknown = {
  start: 'A',
  nodes: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    ['B', 'C', 2],
    ['A', 'B', 2],
    ['A', 'C', 2],
    ['C', 'D', 1],
    ['D', 'E', 1],
    ['C', 'E', 3],
  ],
};

const PRIM_PROGRAM = `${MST_INPUT_HELPER}
if not nodes:
    trace(
        {"type": "graph", "values": [], "focus": []},
        "空图：没有节点，也就没有生成树 / Empty graph: no MST",
        line=sys._getframe(1).f_lineno,
        lesson_step="init",
        structure={
            "kind": "prim-mst", "algorithm": "prim", "operation": "init",
            "nodes": [], "edges": [], "directed": False, "startNodeId": None,
            "componentIndex": 0, "componentCount": 0, "treeNodeIds": [], "componentNodeIds": [],
            "visitOrder": [], "selectedEdgeIds": [], "skippedEdgeIds": [], "currentEdgeId": None,
            "frontierKind": "priority-queue", "frontierItems": [],
            "frontierAdded": None, "frontierRemoved": None,
            "selectedEdge": None, "totalWeight": 0, "connected": False, "forest": False,
        },
    )
    trace(
        {"type": "graph", "values": [], "focus": []},
        "空图结束 / Empty run finished",
        line=sys._getframe(1).f_lineno,
        lesson_step="done",
        structure={
            "kind": "prim-mst", "algorithm": "prim", "operation": "done",
            "nodes": [], "edges": [], "directed": False, "startNodeId": None,
            "componentIndex": 0, "componentCount": 0, "treeNodeIds": [], "componentNodeIds": [],
            "visitOrder": [], "selectedEdgeIds": [], "skippedEdgeIds": [], "currentEdgeId": None,
            "frontierKind": "priority-queue", "frontierItems": [],
            "frontierAdded": None, "frontierRemoved": None,
            "selectedEdge": None, "totalWeight": 0, "connected": False, "forest": False,
        },
    )
else:
    if not isinstance(start, str) or start not in node_set:
        raise ValueError("Prim needs a start node")
    if len(nodes) > 10:
        raise ValueError("Prim teaching graphs are limited to 10 nodes so the heap stays readable")

    def graph_components():
        seen = set()
        result = []
        for node in nodes:
            if node in seen:
                continue
            stack = [node]
            seen.add(node)
            group = []
            while stack:
                item = stack.pop()
                group.append(item)
                for neighbor, weight, edge_id in adjacency[item]:
                    if neighbor not in seen:
                        seen.add(neighbor)
                        stack.append(neighbor)
            result.append(group)
        return result

    components = graph_components()
    component_count = len(components)
    tree = []
    tree_set = set()
    component = []
    component_index = 0
    selected = []
    skipped = []
    visit_order = []
    total_weight = 0
    heap = []
    sequence = [0]

    def entry_payload(entry):
        weight, number, node, source, edge_id = entry
        return {"id": "h" + str(number), "edgeId": edge_id, "fromId": source, "toId": node, "weight": weight}

    def frontier_rows():
        rows = []
        for entry in sorted(heap):
            rows.append(entry_payload(entry))
        return rows

    def emit(operation, message, lesson, current_edge=None, selected_edge=None, added=None,
             removed=None, focus=None, extra=None):
        trace(
            {"type": "graph", "values": nodes, "focus": focus or []},
            message,
            line=sys._getframe(1).f_lineno,
            variables={
                "treeSize": len(tree),
                "candidateWeight": removed["weight"] if removed else (added["weight"] if added else None),
                "selectedWeight": selected_edge["weight"] if selected_edge else None,
                "totalWeight": total_weight,
                "componentIndex": component_index,
            },
            lesson_step=lesson,
            structure={
                "kind": "prim-mst",
                "algorithm": "prim",
                "operation": operation,
                "nodes": nodes_payload,
                "edges": edges_payload,
                "directed": False,
                "startNodeId": start,
                "componentIndex": component_index,
                "componentCount": component_count,
                "treeNodeIds": tree[:],
                "componentNodeIds": component[:],
                "visitOrder": visit_order[:],
                "selectedEdgeIds": selected[:],
                "skippedEdgeIds": skipped[:],
                "currentEdgeId": current_edge,
                "frontierKind": "priority-queue",
                "frontierItems": frontier_rows(),
                "frontierAdded": added,
                "frontierRemoved": removed,
                "selectedEdge": selected_edge,
                "totalWeight": total_weight,
                "connected": component_count == 1,
                "forest": component_count > 1,
                **(extra or {}),
            },
        )

    def push_edges(node):
        for neighbor, weight, edge_id in adjacency[node]:
            if neighbor in tree_set:
                continue
            sequence[0] += 1
            entry = (weight, sequence[0], neighbor, node, edge_id)
            heapq.heappush(heap, entry)
            payload = entry_payload(entry)
            emit(
                "push",
                "候选边 " + node + "–" + neighbor + "，权重 " + str(weight) + " 入堆 / Candidate enters heap",
                "push",
                added=payload,
                focus=[node, neighbor],
            )

    emit("init", "初始化：生成树为空，优先队列为空 / Init: empty tree and heap", "init")
    tree.append(start)
    tree_set.add(start)
    component.append(start)
    visit_order.append(start)
    emit("start", "起点 " + start + " 加入生成树 / Start joins the tree", "start", focus=[start])
    push_edges(start)

    while heap or len(tree_set) < len(nodes):
        if not heap:
            remaining = next(node for node in nodes if node not in tree_set)
            component_index += 1
            component = [remaining]
            tree.append(remaining)
            tree_set.add(remaining)
            visit_order.append(remaining)
            emit(
                "component-start",
                "图不连通：从 " + remaining + " 开始下一棵生成树 / Disconnected: start the next tree at " + remaining,
                "component",
                focus=[remaining],
            )
            push_edges(remaining)
            continue
        entry = heapq.heappop(heap)
        weight, number, target, source, edge_id = entry
        removed = entry_payload(entry)
        emit(
            "pop",
            "弹出最小候选 " + source + "–" + target + "，权重 " + str(weight) + " / Pop the lightest candidate",
            "pop",
            current_edge=edge_id,
            removed=removed,
            focus=[target],
        )
        if target in tree_set:
            if edge_id not in skipped:
                skipped.append(edge_id)
            emit(
                "skip",
                source + "–" + target + " 的两个端点都已在生成树中，跳过以避免环 / Both ends are already inside; skip to avoid a cycle",
                "skip",
                current_edge=edge_id,
                focus=[source, target],
            )
            continue

        selected.append(edge_id)
        total_weight += weight
        tree.append(target)
        tree_set.add(target)
        component.append(target)
        visit_order.append(target)
        selected_edge = {
            "edgeId": edge_id,
            "fromId": source,
            "toId": target,
            "weight": weight,
            "newNodeId": target,
        }
        emit(
            "select-edge",
            "选中 " + source + "–" + target + "，加入 " + target + "；累计权重 " + str(total_weight) + " / Select the edge and add the node",
            "select",
            current_edge=edge_id,
            selected_edge=selected_edge,
            focus=[target],
        )
        push_edges(target)

    emit(
        "done",
        ("生成树完成，总权重 " + str(total_weight)) if component_count == 1
        else ("图不连通：得到最小生成森林，总权重 " + str(total_weight)),
        "done",
        focus=visit_order[:],
    )

`;

const KRUSKAL_PROGRAM = `${MST_INPUT_HELPER}
if not nodes:
    trace(
        {"type": "graph", "values": [], "focus": []},
        "空图：没有节点，也就没有生成树 / Empty graph: no MST",
        line=sys._getframe(1).f_lineno,
        lesson_step="init",
        structure={
            "kind": "kruskal-mst", "algorithm": "kruskal", "operation": "init",
            "nodes": [], "edges": [], "directed": False,
            "sortedEdgeIds": [], "currentIndex": 0, "currentEdgeId": None,
            "selectedEdgeIds": [], "rejectedEdgeIds": [], "parent": [], "componentCount": 0,
            "formsCycle": False, "union": None, "totalWeight": 0, "connected": False, "forest": False,
        },
    )
    trace(
        {"type": "graph", "values": [], "focus": []},
        "空图结束 / Empty run finished",
        line=sys._getframe(1).f_lineno,
        lesson_step="done",
        structure={
            "kind": "kruskal-mst", "algorithm": "kruskal", "operation": "done",
            "nodes": [], "edges": [], "directed": False,
            "sortedEdgeIds": [], "currentIndex": 0, "currentEdgeId": None,
            "selectedEdgeIds": [], "rejectedEdgeIds": [], "parent": [], "componentCount": 0,
            "formsCycle": False, "union": None, "totalWeight": 0, "connected": False, "forest": False,
        },
    )
else:
    parent = {node: node for node in nodes}
    rank = {node: 0 for node in nodes}
    selected = []
    rejected = []
    total_weight = 0
    component_count = len(nodes)
    ordered = sorted(edges_payload, key=lambda edge: (edge["weight"], edge_order[edge["id"]]))
    sorted_ids = [edge["id"] for edge in ordered]
    current_index = 0

    def find(node):
        root = node
        while parent[root] != root:
            root = parent[root]
        cursor = node
        while parent[cursor] != cursor:
            next_node = parent[cursor]
            parent[cursor] = root
            cursor = next_node
        return root

    def parent_rows():
        rows = []
        for node in nodes:
            rows.append({"nodeId": node, "parentId": parent[node], "rank": rank[node], "rootId": find(node)})
        return rows

    def groups():
        result = {}
        for node in nodes:
            root = find(node)
            result.setdefault(root, []).append(node)
        return result

    def size_of(root):
        return len(groups().get(root, []))

    def emit(operation, message, lesson, current_edge=None, forms_cycle=False, union=None, focus=None):
        trace(
            {"type": "graph", "values": nodes, "focus": focus or []},
            message,
            line=sys._getframe(1).f_lineno,
            variables={
                "currentIndex": current_index,
                "edgeWeight": next((edge["weight"] for edge in edges_payload if edge["id"] == current_edge), None),
                "componentCount": component_count,
                "selectedCount": len(selected),
                "totalWeight": total_weight,
            },
            lesson_step=lesson,
            structure={
                "kind": "kruskal-mst",
                "algorithm": "kruskal",
                "operation": operation,
                "nodes": nodes_payload,
                "edges": edges_payload,
                "directed": False,
                "sortedEdgeIds": ([] if operation == "init" else sorted_ids[:]),
                "currentIndex": current_index,
                "currentEdgeId": current_edge,
                "selectedEdgeIds": selected[:],
                "rejectedEdgeIds": rejected[:],
                "parent": parent_rows(),
                "componentCount": component_count,
                "formsCycle": forms_cycle,
                "union": union,
                "totalWeight": total_weight,
                "connected": component_count == 1,
                "forest": component_count > 1,
            },
        )

    emit("init", "初始化：每个顶点各自成一个集合 / Init: every vertex is its own set", "init")
    emit(
        "sort",
        "把所有边按权重升序排序；同权时按输入顺序稳定排列 / Sort edges by weight, stable on ties",
        "sort",
    )

    for index, edge in enumerate(ordered):
        current_index = index
        edge_id = edge["id"]
        a = edge["fromId"]
        b = edge["toId"]
        root_a = find(a)
        root_b = find(b)
        cycles = root_a == root_b
        emit(
            "inspect-edge",
            "检查第 " + str(index + 1) + " 条边 " + a + "–" + b + "，权重 " + str(edge["weight"]) +
            "；找根 " + root_a + " / " + root_b + " / Inspect edge and find roots",
            "inspect-edge",
            current_edge=edge_id,
            forms_cycle=cycles,
            focus=[a, b],
        )
        if cycles:
            rejected.append(edge_id)
            emit(
                "reject-edge",
                "两端已经在同一集合，加入会形成环，拒绝 " + a + "–" + b + " / Same set: reject to avoid a cycle",
                "reject-edge",
                current_edge=edge_id,
                forms_cycle=True,
                focus=[a, b],
            )
            continue

        selected.append(edge_id)
        total_weight += edge["weight"]
        before_components = component_count
        if rank[root_a] < rank[root_b]:
            merged = root_a
            attached = root_b
            rank_before = rank[root_b]
            rank_after = rank[root_a]
            parent[root_b] = root_a
        elif rank[root_a] > rank[root_b]:
            merged = root_b
            attached = root_a
            rank_before = rank[root_a]
            rank_after = rank[root_b]
            parent[root_a] = root_b
        else:
            merged = root_a
            attached = root_b
            rank_before = rank[root_b]
            rank[root_a] += 1
            rank_after = rank[root_a]
            parent[root_b] = root_a
        component_count -= 1
        union_detail = {
            "edgeId": edge_id,
            "rootA": root_a,
            "rootB": root_b,
            "mergedRoot": merged,
            "attachedRoot": attached,
            "rankBefore": rank_before,
            "rankAfter": rank_after,
            "parentOfAttachedBefore": attached,
            "parentOfAttachedAfter": merged,
            "componentCountBefore": before_components,
            "componentCountAfter": component_count,
            "mergedSize": size_of(merged),
        }
        emit(
            "union",
            "接受 " + a + "–" + b + "，合并集合 " + root_a + " 与 " + root_b + " → 根 " + merged +
            "，总权重 " + str(total_weight) + " / Accept the edge and union the sets",
            "union",
            current_edge=edge_id,
            union=union_detail,
            focus=[a, b],
        )

    current_index = len(ordered)
    emit(
        "done",
        ("最小生成树完成，总权重 " + str(total_weight)) if component_count == 1
        else ("图不连通：得到最小生成森林，总权重 " + str(total_weight)),
        "done",
        focus=[node for node in nodes],
    )

`;

export const PRIM_PYTHON = `import heapq\nimport math\nimport sys\n\n${PRIM_PROGRAM}`;
export const KRUSKAL_PYTHON = `import math\nimport sys\n\n${KRUSKAL_PROGRAM}`;

export function primPythonExample(): string {
  return PRIM_PYTHON;
}

export function kruskalPythonExample(): string {
  return KRUSKAL_PYTHON;
}

export function primDefaultInput(): unknown {
  return PRIM_DEFAULT_INPUT;
}

export function kruskalDefaultInput(): unknown {
  return KRUSKAL_DEFAULT_INPUT;
}

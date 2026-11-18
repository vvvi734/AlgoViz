"""Independent checks for the G2 Prim / Kruskal Python sources.

This script extracts the exact template strings from mstExamples.ts, executes
them with CPython and a local trace() stub, then verifies the final spanning
structure against a brute-force reference for small graphs. It is separate from
the browser E2E: here we can inspect every edge, every union-find parent and
both algorithms' totals without a DOM.
"""
from __future__ import annotations

import copy
import itertools
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/mstExamples.ts").read_text(encoding="utf-8")


def between(start: str, end: str) -> str:
    body = TS.split(start, 1)[1].split(end, 1)[0]
    return body


HELPER = between("const MST_INPUT_HELPER = `", "`;")
PRIM_BODY = between("const PRIM_PROGRAM = `", "`;").replace("${MST_INPUT_HELPER}", HELPER)
KRUSKAL_BODY = between("const KRUSKAL_PROGRAM = `", "`;").replace("${MST_INPUT_HELPER}", HELPER)
PRIM_SOURCE = "import heapq\nimport math\nimport sys\n\n" + PRIM_BODY
KRUSKAL_SOURCE = "import math\nimport sys\n\n" + KRUSKAL_BODY


def run(source: str, graph):
    frames = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append(
            {
                "state": state,
                "message": message,
                "line": line,
                "variables": variables,
                "lessonStepId": lesson_step,
                "structure": structure,
            }
        )

    ns = {"input": copy.deepcopy(graph), "trace": trace}
    exec(compile(source, "<mst>", "exec"), ns)
    return frames


def edges_of(graph):
    result = []
    for edge in graph.get("edges", []):
        if isinstance(edge, dict):
            result.append((edge["from"], edge["to"], edge["weight"]))
        else:
            result.append((edge[0], edge[1], edge[2]))
    return result


def is_spanning(nodes, chosen, require_connected=True):
    if not nodes:
        return not chosen
    if len(chosen) != len(nodes) - 1:
        return False
    adjacency = {node: [] for node in nodes}
    for a, b, _ in chosen:
        adjacency[a].append(b)
        adjacency[b].append(a)
    seen = set()
    stack = [nodes[0]]
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        stack.extend(adjacency[node])
    return seen == set(nodes) if require_connected else True


def brute_force_weight(nodes, edges):
    """Enumerate every (V-1)-edge subset and keep the cheapest connected one."""
    if not nodes:
        return 0
    best = math.inf
    for combo in itertools.combinations(edges, len(nodes) - 1):
        if is_spanning(nodes, combo):
            total = sum(weight for _, _, weight in combo)
            if total < best:
                best = total
    return None if best == math.inf else best


def reference_kruskal(nodes, edges, forest=False):
    parent = {node: node for node in nodes}

    def find(node):
        while parent[node] != node:
            node = parent[node]
        return node

    for a, b, weight in sorted(edges, key=lambda item: item[2]):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    groups = {}
    for node in nodes:
        groups.setdefault(find(node), []).append(node)
    if not forest and len(groups) > 1:
        return None
    return groups


def reference_forest_weight(nodes, edges):
    """Cheapest acyclic subset: Kruskal run until every reachable edge is seen."""
    parent = {node: node for node in nodes}

    def find(node):
        while parent[node] != node:
            node = parent[node]
        return node

    total = 0
    for a, b, weight in sorted(edges, key=lambda item: item[2]):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra
            total += weight
    return total


def assert_acyclic(nodes, chosen):
    parent = {node: node for node in nodes}

    def find(node):
        while parent[node] != node:
            node = parent[node]
        return node

    for a, b, _ in chosen:
        ra, rb = find(a), find(b)
        assert ra != rb, ("cycle in selected edges", a, b, chosen)
        parent[rb] = ra


def selected_root_count(nodes, chosen):
    parent = {node: node for node in nodes}

    def find(node):
        while parent[node] != node:
            node = parent[node]
        return node

    for a, b, _ in chosen:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra
    return len({find(node) for node in nodes})


def selected_edges(graph, frame):
    ids = set(frame["structure"]["selectedEdgeIds"])
    return [edge for edge in edges_of(graph) if edge_id(edge, graph) in ids]


def edge_id(edge, graph):
    for index, candidate in enumerate(edges_of(graph)):
        if candidate == edge:
            return f"e{index + 1}"
    raise AssertionError(f"edge missing: {edge}")


def assert_clean(frames):
    json.dumps(frames, allow_nan=False)


def assert_frame_totals(frames, graph, algorithm):
    final = frames[-1]["structure"]
    assert final["operation"] == "done", (algorithm, final["operation"])
    nodes = graph["nodes"]
    selected_ids = final["selectedEdgeIds"]
    selected = [edge for edge in edges_of(graph) if edge_id(edge, graph) in selected_ids]
    if not nodes:
        assert selected_ids == []
        assert final["totalWeight"] == 0
        return []
    assert_acyclic(nodes, selected)
    if final["forest"]:
        groups = reference_kruskal(nodes, edges_of(graph), forest=True)
        assert len(groups) > 1, (algorithm, "expected forest")
        assert len(selected) == len(nodes) - len(groups), (algorithm, selected)
        assert selected_root_count(nodes, selected) == len(groups), (
            algorithm,
            "selected edges do not span every reference component",
        )
    else:
        assert is_spanning(nodes, selected), (algorithm, "selected edges are not a spanning tree", selected)
    assert abs(final["totalWeight"] - sum(weight for _, _, weight in selected)) < 1e-9
    if final["forest"]:
        assert abs(final["totalWeight"] - reference_forest_weight(nodes, edges_of(graph))) < 1e-9, (
            algorithm,
            "total does not match reference minimum spanning forest",
        )
    return selected


def main():
    nodes = ["A", "B", "C", "D", "E"]
    default = {
        "start": "A",
        "nodes": nodes,
        "edges": [
            ["B", "C", 2],
            ["A", "B", 2],
            ["A", "C", 2],
            ["C", "D", 1],
            ["D", "E", 1],
            ["C", "E", 3],
        ],
    }
    prim = run(PRIM_SOURCE, default)
    kruskal = run(KRUSKAL_SOURCE, default)
    for frames in (prim, kruskal):
        assert_clean(frames)
        assert 0 < len(frames) < 500
    prim_edges = assert_frame_totals(prim, default, "prim")
    kruskal_edges = assert_frame_totals(kruskal, default, "kruskal")
    assert prim[-1]["structure"]["totalWeight"] == 6
    assert kruskal[-1]["structure"]["totalWeight"] == 6
    assert set(prim_edges) != set(kruskal_edges), (prim_edges, kruskal_edges)
    assert brute_force_weight(nodes, edges_of(default)) == 6

    # Kruskal: every accepted edge really merges two different roots, and each
    # rejected edge really has equal roots in the recorded parent table.
    union_count = 0
    reject_count = 0
    for frame in kruskal:
        structure = frame["structure"]
        if structure["operation"] == "union":
            detail = structure["union"]
            assert detail["rootA"] != detail["rootB"]
            assert detail["componentCountAfter"] == detail["componentCountBefore"] - 1
            assert detail["parentOfAttachedBefore"] == detail["attachedRoot"]
            assert detail["parentOfAttachedAfter"] == detail["mergedRoot"]
            union_count += 1
        if structure["operation"] == "reject-edge":
            current = structure["currentEdgeId"]
            edge = next(item for item in edges_of(default) if edge_id(item, default) == current)
            roots = {row["nodeId"]: row["rootId"] for row in structure["parent"]}
            assert roots[edge[0]] == roots[edge[1]]
            reject_count += 1
    assert union_count == 4, union_count
    assert reject_count == 2, reject_count

    # Prim: every selected edge crosses the tree cut caught by its real frame.
    tree_before = set()
    for frame in prim:
        structure = frame["structure"]
        if structure["operation"] == "select-edge":
            detail = structure["selectedEdge"]
            assert detail["toId"] not in tree_before
            assert detail["fromId"] in tree_before or detail["fromId"] == structure["startNodeId"]
        tree_before = set(structure["treeNodeIds"])

    # Negative edges are legal for an MST.
    negative = {
        "start": "A",
        "nodes": ["A", "B", "C"],
        "edges": [["A", "B", -2], ["B", "C", -1], ["A", "C", 4]],
    }
    assert run(PRIM_SOURCE, negative)[-1]["structure"]["totalWeight"] == -3
    assert run(KRUSKAL_SOURCE, negative)[-1]["structure"]["totalWeight"] == -3
    assert brute_force_weight(negative["nodes"], edges_of(negative)) == -3

    # Single vertex: a valid zero-weight tree.
    single = {"start": "A", "nodes": ["A"], "edges": []}
    assert run(PRIM_SOURCE, single)[-1]["structure"]["totalWeight"] == 0
    assert run(KRUSKAL_SOURCE, single)[-1]["structure"]["connected"] is True

    # Disconnected graph: a forest, never a fake spanning tree.
    forest = {
        "start": "A",
        "nodes": ["A", "B", "C", "D"],
        "edges": [["A", "B", 2], ["C", "D", 1]],
    }
    prim_forest = run(PRIM_SOURCE, forest)
    kruskal_forest = run(KRUSKAL_SOURCE, forest)
    assert prim_forest[-1]["structure"]["forest"] is True
    assert kruskal_forest[-1]["structure"]["forest"] is True
    assert prim_forest[-1]["structure"]["totalWeight"] == 3
    assert kruskal_forest[-1]["structure"]["totalWeight"] == 3
    assert len(prim_forest[-1]["structure"]["selectedEdgeIds"]) == 2
    assert prim_forest[-1]["structure"]["componentCount"] == 2

    # Equal-weight multi-MST: both totals equal the brute-force optimum, even
    # though the selected edge sets differ.
    multi = {
        "start": "A",
        "nodes": ["A", "B", "C", "D"],
        "edges": [["A", "B", 1], ["A", "C", 1], ["B", "C", 1], ["B", "D", 2], ["C", "D", 2]],
    }
    pm = run(PRIM_SOURCE, multi)
    km = run(KRUSKAL_SOURCE, multi)
    assert pm[-1]["structure"]["totalWeight"] == 4
    assert km[-1]["structure"]["totalWeight"] == 4
    assert brute_force_weight(multi["nodes"], edges_of(multi)) == 4
    assert pm[-1]["structure"]["totalWeight"] == reference_forest_weight(multi["nodes"], edges_of(multi))
    assert km[-1]["structure"]["totalWeight"] == reference_forest_weight(multi["nodes"], edges_of(multi))

    # Input rejection: directed input, duplicates and self-loops must fail.
    for bad in (
        {"start": "A", "directed": True, "nodes": ["A", "B"], "edges": [["A", "B", 1]]},
        {"start": "A", "nodes": ["A", "B"], "edges": [["A", "B", 1], ["B", "A", 2]]},
        {"start": "A", "nodes": ["A"], "edges": [["A", "A", 1]]},
    ):
        for source in (PRIM_SOURCE, KRUSKAL_SOURCE):
            try:
                run(source, bad)
            except ValueError:
                pass
            else:
                raise AssertionError("bad input was accepted")

    Path('.tmp').mkdir(exist_ok=True)
    Path('.tmp/mst-frames.json').write_text(
        json.dumps({'prim': prim, 'kruskal': kruskal}, ensure_ascii=False),
        encoding='utf-8',
    )
    print(
        "MST Python checks passed:",
        f"prim {len(prim)} frames / kruskal {len(kruskal)} frames;",
        "both total=6 with different edge sets;",
        f"union={union_count}, reject={reject_count}.",
    )


if __name__ == "__main__":
    main()

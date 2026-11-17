"""Local smoke check for the Stage 7F Dijkstra Python source (not the browser E2E).

Extracts the exact template strings from dijkstraExamples.ts and executes them
with CPython + a local trace() stub. It checks real heap/stale/relax behaviour,
reconstructs the shortest path from previous pointers, compares every final
distance against an independent Bellman-Ford reference, and rejects negative
weights before frames are produced.
"""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/dijkstraExamples.ts").read_text(encoding="utf-8")


def between(start: str, end: str) -> str:
    body = TS.split(start, 1)[1].split(end, 1)[0]
    return body


HELPER = between("const DIJKSTRA_INPUT_HELPER = `", "`;")
PROGRAM = between("const DIJKSTRA_PROGRAM = `", "`;").replace("${DIJKSTRA_INPUT_HELPER}", HELPER)
SOURCE = "import heapq\nimport math\nimport sys\n\n" + PROGRAM


def run(graph):
    frames = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": state,
            "message": message,
            "line": line,
            "variables": variables,
            "lessonStepId": lesson_step,
            "structure": structure,
        })

    ns = {"input": copy.deepcopy(graph), "trace": trace}
    exec(compile(SOURCE, "<dijkstra>", "exec"), ns)
    return frames


def assert_clean_json(frames):
    json.dumps(frames, allow_nan=False)


def normalize_edges(graph):
    """Return directed (u, v, w) triples; undirected input becomes both arcs."""
    edges = []
    for edge in graph.get("edges", []):
        if isinstance(edge, dict):
            u, v, w = edge["from"], edge["to"], edge["weight"]
        else:
            u, v, w = edge
        edges.append((u, v, w))
        if not graph.get("directed", False):
            edges.append((v, u, w))
    return edges


def reference_distances(graph):
    """Independent Bellman-Ford reference: no heap, no Dijkstra logic."""
    nodes = graph.get("nodes", [])
    start = graph.get("start")
    dist = {node: math.inf for node in nodes}
    if start is None:
        return dist
    if start not in dist:
        raise AssertionError(f"reference start missing: {start}")
    dist[start] = 0.0
    edges = normalize_edges(graph)
    for _ in range(max(0, len(nodes) - 1)):
        changed = False
        for u, v, w in edges:
            if dist[u] != math.inf and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    return dist


def path_cost(graph, path):
    edges = normalize_edges(graph)
    total = 0
    for u, v in zip(path, path[1:]):
        matches = [w for a, b, w in edges if a == u and b == v]
        assert matches, f"path edge missing: {u}->{v}"
        total += min(matches)
    return total


def verify(name: str, graph, expected_order, expected_path, expected_distance):
    frames = run(graph)
    assert_clean_json(frames)
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    final = frames[-1]["structure"]
    assert final["pathNodeIds"] == expected_path, (name, final["pathNodeIds"])
    assert final["pathDistance"] == expected_distance, (name, final["pathDistance"])
    assert final["visitedIds"] == expected_order, (name, final["visitedIds"])
    assert final["frontierItems"] == []

    # Independent shortest distances for every node, compared with the trace.
    reference = reference_distances(graph)
    table = {row["nodeId"]: row["distance"] for row in final["distances"]}
    for node, value in reference.items():
        expected = None if value == math.inf else value
        assert table[node] == expected, (name, node, table[node], expected)

    # The reconstructed path must use real edges and attain the reference cost.
    if expected_path:
        assert path_cost(graph, expected_path) == expected_distance, (name, expected_path)
        target = graph.get("target")
        assert target is None or reference[target] == expected_distance, (name, "target distance")
        assert final["pathDistance"] == reference[graph["target"]], (name, "reference target")
    else:
        assert graph.get("target") is None or reference[graph["target"]] == math.inf, (name, "unreachable")

    relaxes = [f for f in frames if f["structure"]["operation"] == "relax"]
    for frame in relaxes:
        change = frame["structure"]["relax"]
        assert change["oldDistance"] is None or change["newDistance"] < change["oldDistance"]
        assert change["newPreviousId"] == frame["structure"]["currentNodeId"]
    stale = [f for f in frames if f["structure"]["operation"] == "stale"]
    print(f"{name}: {len(frames)} frames, settle {expected_order}, path {expected_path}, d={expected_distance}, relax={len(relaxes)}, stale={len(stale)}")
    return frames, relaxes, stale


def expect_error(name: str, graph, needle: str):
    try:
        run(graph)
    except ValueError as error:
        assert needle in str(error), (name, str(error))
        print(f"{name}: rejected -> {error}")
        return
    raise AssertionError(f"{name}: expected ValueError containing {needle!r}")


DEFAULT = {
    "start": "A",
    "target": "G",
    "directed": False,
    "nodes": ["A", "B", "C", "D", "E", "F", "G"],
    "edges": [["A", "B", 2], ["A", "C", 2], ["B", "D", 4], ["B", "E", 1], ["C", "F", 4], ["E", "F", 1], ["F", "G", 3]],
}
frames, relaxes, stale = verify("default", DEFAULT, ["A", "B", "C", "E", "F", "D", "G"], ["A", "B", "E", "F", "G"], 7)
FIXTURE = ROOT / "src/test/fixtures/dijkstra-default-frames.json"
FIXTURE.write_text(
    json.dumps({"input": DEFAULT, "frames": frames}, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
    encoding="utf-8",
)
print(f"wrote {FIXTURE.relative_to(ROOT)}")
assert frames[0]["structure"]["nodes"] == [{"id": n, "value": n} for n in "ABCDEFG"]
assert any(f["structure"]["frontierRemoved"] and f["structure"]["frontierRemoved"]["stale"] for f in stale)
assert all(isinstance(f["line"], int) and f["line"] > 0 for f in frames)
assert frames[0]["variables"]["distances"]["A"] is None
assert frames[-1]["variables"]["distances"]["G"] == 7

verify("start-is-target", {"start": "A", "target": "A", "directed": False, "nodes": ["A", "B"], "edges": [["A", "B", 5]]}, ["A", "B"], ["A"], 0)
verify("unreachable", {"start": "A", "target": "D", "directed": False, "nodes": ["A", "B", "C", "D"], "edges": [["A", "B", 1], ["C", "D", 1]]}, ["A", "B"], [], None)
verify("single", {"start": "A", "target": "A", "directed": False, "nodes": ["A"], "edges": []}, ["A"], ["A"], 0)
verify("directed", {"start": "A", "target": "C", "directed": True, "nodes": ["A", "B", "C"], "edges": [["A", "B", 1], ["A", "C", 5], ["B", "C", 1]]}, ["A", "B", "C"], ["A", "B", "C"], 2)
verify("equal-distance", {"start": "A", "target": "C", "directed": False, "nodes": ["A", "B", "C", "D"], "edges": [["A", "B", 1], ["A", "C", 1], ["B", "D", 1], ["C", "D", 1]]}, ["A", "B", "C", "D"], ["A", "C"], 1)
verify("zero-weight", {"start": "A", "target": "C", "directed": False, "nodes": ["A", "B", "C"], "edges": [["A", "B", 0], ["B", "C", 0], ["A", "C", 2]]}, ["A", "B", "C"], ["A", "B", "C"], 0)
empty_frames = run({"start": None, "target": None, "nodes": [], "edges": [], "directed": False})
assert_clean_json(empty_frames)
assert [f["structure"]["operation"] for f in empty_frames] == ["init", "done"]
print("empty:", len(empty_frames), "frames")

expect_error("negative", {"start": "A", "target": "B", "nodes": ["A", "B"], "edges": [["A", "B", -1]]}, "non-negative")
expect_error("nan", {"start": "A", "target": "B", "nodes": ["A", "B"], "edges": [["A", "B", float("nan")]]}, "finite")
expect_error("infinity", {"start": "A", "target": "B", "nodes": ["A", "B"], "edges": [["A", "B", float("inf")]]}, "finite")
expect_error("self-loop", {"start": "A", "target": "A", "nodes": ["A"], "edges": [["A", "A", 1]]}, "self-loops")
expect_error("duplicate-edge", {"start": "A", "target": "B", "nodes": ["A", "B"], "edges": [["A", "B", 1], ["B", "A", 2]]}, "duplicate edge")
expect_error("bad-start", {"start": "Z", "target": "A", "nodes": ["A"], "edges": []}, "start")
expect_error("bad-target", {"start": "A", "target": "Z", "nodes": ["A"], "edges": []}, "target")

print("\nlocal Python Dijkstra smoke check passed")

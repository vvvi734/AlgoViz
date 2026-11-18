"""Independent reference checks for the G3 DAG Python sources.

Run with CPython: extracts the exact template strings from dagExamples.ts,
executes them with a trace() stub, and validates topological dependencies,
AOE ve/vl/e/l/slack and every critical path against an independent reference.
"""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/dagExamples.ts").read_text(encoding="utf-8")


def between(start: str, end: str = "`;") -> str:
    return TS.split(start, 1)[1].split(end, 1)[0]


DAG_HEADER = between("const DAG_HEADER = `")
TOPOLOGICAL_HELPER = between("export const TOPOLOGICAL_INPUT_HELPER = `", "`;\n\nexport const AOE")
AOE_HELPER = between("export const AOE_INPUT_HELPER = `", "`;\n\nexport const TOPOLOGICAL_DEFAULT_INPUT")
TOPOLOGICAL_BODY = between("export const TOPOLOGICAL_PROGRAM = `", "`;\n\nexport const CRITICAL_PATH_PROGRAM")
CRITICAL_BODY = between("export const CRITICAL_PATH_PROGRAM = `", "`;\n\nexport function topologicalPythonExample")
TOPOLOGICAL_SOURCE = (
    "import math\nimport sys\n\n"
    + TOPOLOGICAL_HELPER.replace("${DAG_HEADER}", DAG_HEADER)
    + "\n"
    + TOPOLOGICAL_BODY.replace("${TOPOLOGICAL_INPUT_HELPER}", TOPOLOGICAL_HELPER.replace("${DAG_HEADER}", DAG_HEADER))
)
CRITICAL_SOURCE = (
    "import math\nimport sys\n\n"
    + AOE_HELPER.replace("${DAG_HEADER}", DAG_HEADER)
    + "\n"
    + CRITICAL_BODY.replace("${AOE_INPUT_HELPER}", AOE_HELPER.replace("${DAG_HEADER}", DAG_HEADER))
)


def run(source: str, graph):
    frames = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append(
            {
                "state": copy.deepcopy(state),
                "message": message,
                "line": line,
                "variables": copy.deepcopy(variables),
                "lessonStepId": lesson_step,
                "structure": copy.deepcopy(structure),
            }
        )

    ns = {"input": copy.deepcopy(graph), "trace": trace}
    exec(compile(source, "<dag>", "exec"), ns)
    return frames


def graph_edges(graph):
    result = []
    for edge in graph.get("edges", []):
        if isinstance(edge, dict):
            result.append((edge["from"], edge["to"], edge.get("duration", edge.get("weight"))))
        else:
            result.append(tuple(edge))
    return result


def check_topological(graph):
    frames = run(TOPOLOGICAL_SOURCE, graph)
    assert frames, "topological produced no frames"
    first = frames[0]["structure"]
    assert first["kind"] == "topological-sort" and first["operation"] == "init"
    nodes = list(graph.get("nodes", []))
    actual = {node: 0 for node in nodes}
    for a, b in [tuple(edge[:2]) for edge in graph.get("edges", [])]:
        actual[b] += 1
    for row in first["indegree"]:
        assert row["indegree"] == actual[row["nodeId"]], ("bad init indegree", row, actual)
    final = frames[-1]["structure"]
    assert final["operation"] == "done"
    if final["hasCycle"]:
        assert len(final["topologicalOrder"]) < len(nodes), "cycle must be incomplete"
        assert set(final["cycleNodeIds"]) == set(nodes) - set(final["topologicalOrder"]), "cycle nodes wrong"
    else:
        assert sorted(final["topologicalOrder"]) == sorted(nodes), "topological order must contain every node"
        position = {node: index for index, node in enumerate(final["topologicalOrder"])}
        for a, b in [tuple(edge[:2]) for edge in graph.get("edges", [])]:
            assert position[a] < position[b], ("dependency order violated", a, b, final["topologicalOrder"])
        assert len(final["removedEdgeIds"]) == len(graph.get("edges", [])), "all edges removed once"
    # The queue and indegree frames must remain self-consistent.
    for frame in frames:
        structure = frame["structure"]
        qids = [item["nodeId"] for item in structure["queue"]]
        assert len(qids) == len(set(qids)), ("duplicate queued node", frame)
        for item in structure["queue"]:
            assert item["nodeId"] in nodes
        if structure["operation"] == "decrement":
            change = structure["indegreeChange"]
            assert change and change["before"] == change["after"] + 1
            row = next(row for row in structure["indegree"] if row["nodeId"] == change["nodeId"])
            assert row["indegree"] == change["after"]
    return frames, final


def reference_aoe(graph):
    nodes = list(graph["nodes"])
    edges = [(edge[0], edge[1], edge[2]) for edge in graph["edges"]]
    preds = {node: [] for node in nodes}
    adj = {node: [] for node in nodes}
    indeg = {node: 0 for node in nodes}
    outdeg = {node: 0 for node in nodes}
    for a, b, d in edges:
        preds[b].append((a, d))
        adj[a].append((b, d))
        indeg[b] += 1
        outdeg[a] += 1
    queue = sorted(node for node in nodes if indeg[node] == 0)
    topo = []
    remaining = dict(indeg)
    while queue:
        node = queue.pop(0)
        topo.append(node)
        for neighbor, _ in sorted(adj[node]):
            remaining[neighbor] -= 1
            if remaining[neighbor] == 0:
                queue.append(neighbor)
    assert len(topo) == len(nodes), "reference graph is cyclic"
    ve = {}
    for node in topo:
        ve[node] = max((ve[parent] + duration for parent, duration in preds[node]), default=0)
    sources = sorted(node for node in nodes if indeg[node] == 0)
    sinks = sorted(node for node in nodes if outdeg[node] == 0)
    duration = max((ve[sink] for sink in sinks), default=0)
    vl = {node: duration for node in sinks}
    for node in reversed(topo):
        if node not in sinks:
            vl[node] = min(vl[child] - edge_duration for child, edge_duration in adj[node])
    activities = {}
    for a, b, d in edges:
        earliest = ve[a]
        latest = vl[b] - d
        slack = latest - earliest
        activities[(a, b)] = (earliest, latest, slack, abs(slack) <= 1e-9)
    critical = {(a, b) for a, b, _, flag in [(a, b, d, activities[(a, b)][3]) for a, b, d in edges] if flag}
    paths = []
    def collect(node, path, total):
        if len(paths) > 12:
            raise AssertionError("reference has too many paths")
        if node in sinks and abs(total - duration) <= 1e-9:
            paths.append(path[:])
            return
        for child, edge_duration in sorted(adj[node]):
            if (node, child) in critical:
                path.append(child)
                collect(child, path, total + edge_duration)
                path.pop()
    for source in sources:
        collect(source, [source], 0)
    return {
        "nodes": nodes, "edges": edges, "topo": topo, "ve": ve, "vl": vl,
        "duration": duration, "sources": sources, "sinks": sinks,
        "activities": activities, "critical": critical, "paths": paths,
    }


def check_critical(graph):
    frames = run(CRITICAL_SOURCE, graph)
    assert frames, "critical path produced no frames"
    final = frames[-1]["structure"]
    assert final["kind"] == "critical-path" and final["operation"] == "done"
    reference = reference_aoe(graph)
    if final["hasCycle"]:
        raise AssertionError("valid DAG reported as cycle")
    assert abs(final["projectDuration"] - reference["duration"]) <= 1e-9, ("duration", final["projectDuration"], reference["duration"])
    ve_rows = {row["nodeId"]: row["time"] for row in final["veRows"]}
    vl_rows = {row["nodeId"]: row["time"] for row in final["vlRows"]}
    for node in reference["nodes"]:
        assert abs(ve_rows[node] - reference["ve"][node]) <= 1e-9, ("ve", node, ve_rows[node], reference["ve"][node])
        assert abs(vl_rows[node] - reference["vl"][node]) <= 1e-9, ("vl", node, vl_rows[node], reference["vl"][node])
    for row in final["activities"]:
        key = (row["fromId"], row["toId"])
        expected = reference["activities"][key]
        assert abs(row["e"] - expected[0]) <= 1e-9, ("e", key, row, expected)
        assert abs(row["l"] - expected[1]) <= 1e-9, ("l", key, row, expected)
        assert abs(row["slack"] - expected[2]) <= 1e-9, ("slack", key, row, expected)
        assert row["critical"] == expected[3], ("critical", key, row, expected)
    assert set(final["criticalEdgeIds"]) == {
        f"e{index + 1}" for index, edge in enumerate(graph["edges"]) if reference["activities"][(edge[0], edge[1])][3]
    }
    assert len(final["criticalPaths"]) == len(reference["paths"]), ("path count", final["criticalPaths"], reference["paths"])
    for path in final["criticalPaths"]:
        assert path[0] in reference["sources"] and path[-1] in reference["sinks"], ("path ends", path)
        total = 0
        for a, b in zip(path, path[1:]):
            edge = next(edge for edge in reference["edges"] if edge[0] == a and edge[1] == b)
            assert (a, b) in reference["critical"], ("non-critical path edge", path, a, b)
            total += edge[2]
        assert abs(total - reference["duration"]) <= 1e-9, ("path duration", path, total)
    # Every intermediate frame's rows must be internally consistent.
    for frame in frames:
        structure = frame["structure"]
        for row in structure["activities"]:
            if row["e"] is not None and row["l"] is not None:
                assert abs((row["l"] - row["e"]) - row["slack"]) <= 1e-9
        if structure["operation"] == "activity":
            change = structure["activityChange"]
            assert change and change["edgeId"] == structure["currentEdgeId"]
    return frames, final, reference


def main():
    topo_default = {
        "nodes": ["A", "B", "C", "D", "E", "F", "G"],
        "edges": [["A", "C"], ["A", "D"], ["B", "C"], ["B", "E"], ["C", "F"], ["D", "F"], ["E", "G"], ["F", "G"]],
    }
    topo_frames, topo_final = check_topological(topo_default)
    assert topo_final["hasCycle"] is False
    print("topological default:", len(topo_frames), "frames, order", " ".join(topo_final["topologicalOrder"]))

    disconnected = {"nodes": ["A", "B", "C", "D"], "edges": [["A", "B"], ["C", "D"]]}
    topo_disconnected, final_disconnected = check_topological(disconnected)
    assert final_disconnected["hasCycle"] is False
    print("topological disconnected:", len(topo_disconnected), "frames, order", " ".join(final_disconnected["topologicalOrder"]))

    cycle = {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"], ["C", "A"]]}
    topo_cycle, final_cycle = check_topological(cycle)
    assert final_cycle["hasCycle"] is True
    assert set(final_cycle["cycleNodeIds"]) == {"A", "B", "C"}
    print("topological cycle:", len(topo_cycle), "frames, cycle nodes", " ".join(final_cycle["cycleNodeIds"]))

    aoe_default = {
        "nodes": ["A", "B", "C", "D", "E", "F"],
        "edges": [["A", "B", 3], ["A", "C", 2], ["B", "D", 2], ["B", "E", 6], ["C", "D", 4], ["D", "E", 3], ["E", "F", 2]],
    }
    cp_frames, cp_final, cp_ref = check_critical(aoe_default)
    print("critical default:", len(cp_frames), "frames, duration", cp_final["projectDuration"], "paths", cp_final["criticalPaths"])
    assert len(cp_final["criticalPaths"]) == 2

    multi_source = {"nodes": ["A", "B", "C", "D"], "edges": [["A", "C", 2], ["B", "C", 3], ["C", "D", 1]]}
    ms_frames, ms_final, ms_ref = check_critical(multi_source)
    assert ms_ref["sources"] == ["A", "B"] and ms_ref["sinks"] == ["D"]
    print("critical multi-source:", len(ms_frames), "frames, duration", ms_final["projectDuration"])

    multi_sink = {"nodes": ["A", "B", "C"], "edges": [["A", "B", 2], ["A", "C", 5]]}
    msink_frames, msink_final, msink_ref = check_critical(multi_sink)
    assert msink_ref["sinks"] == ["B", "C"]
    assert msink_final["criticalPaths"] == [["A", "C"]]
    print("critical multi-sink:", len(msink_frames), "frames, duration", msink_final["projectDuration"])

    single = {"nodes": ["A"], "edges": []}
    one_frames, one_final, one_ref = check_critical(single)
    assert one_final["projectDuration"] == 0 and one_final["criticalPaths"] == [["A"]]
    print("critical single node:", len(one_frames), "frames")

    empty = {"nodes": [], "edges": []}
    e_topo, _ = check_topological(empty)
    e_cp, e_final, e_ref = check_critical(empty)
    assert e_final["projectDuration"] == 0 and e_final["criticalPaths"] == []
    print("empty:", len(e_topo), "topological frames,", len(e_cp), "critical frames")

    json.dumps({"topological": topo_frames, "critical": cp_frames}, allow_nan=False)
    print("DAG Python checks passed.")


if __name__ == "__main__":
    main()

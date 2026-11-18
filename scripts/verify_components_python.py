"""Independent reference checks for the G4 component / Kosaraju Python sources.

Run with CPython. This script deliberately does not use the TypeScript schema:
it checks the raw trace snapshots against an independently computed partition.

Usage:
    python scripts/verify_components_python.py
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/componentExamples.ts").read_text(encoding="utf-8")


def between(start: str, end: str) -> str:
    return TS.split(start, 1)[1].split(end, 1)[0]


CC_HELPER = between("const CONNECTED_HELPER = `", "`;\n\nconst SCC_HELPER")
SCC_HELPER = between("const SCC_HELPER = `", "`;\n\nexport const CONNECTED_COMPONENTS_PYTHON")
CC_BODY = between("export const CONNECTED_COMPONENTS_PYTHON = `", "`;\n\nexport const SCC_PYTHON")
SCC_BODY = between("export const SCC_PYTHON = `", "`;\n\nexport function connectedComponentsPythonExample")
CC_SOURCE = "import sys\n\n" + CC_HELPER + "\n\n" + CC_BODY.replace("${CONNECTED_HELPER}", CC_HELPER)
SCC_SOURCE = "import sys\n\n" + SCC_HELPER + "\n\n" + SCC_BODY.replace("${SCC_HELPER}", SCC_HELPER)
assert "${" not in CC_SOURCE and "${" not in SCC_SOURCE, "unexpanded template expression"

DEFAULT_CC = {
    "nodes": ["A", "B", "C", "D", "E", "F", "G", "H"],
    "edges": [["A", "B"], ["A", "C"], ["B", "C"], ["D", "E"], ["F", "G"]],
}
DEFAULT_SCC = {
    "nodes": ["A", "B", "C", "D", "E", "F", "G", "H"],
    "edges": [["A", "B"], ["B", "C"], ["C", "A"], ["C", "D"], ["D", "E"], ["E", "D"], ["F", "G"]],
}
CC_EDGE_CASES = {
    "disconnected": {
        "nodes": ["A", "B", "C", "D", "E"],
        "edges": [["A", "B"], ["C", "D"]],
    },
    "single": {"nodes": ["A"], "edges": []},
    "empty": {"nodes": [], "edges": []},
    "complete": {
        "nodes": ["A", "B", "C", "D"],
        "edges": [["A", "B"], ["A", "C"], ["A", "D"], ["B", "C"], ["B", "D"], ["C", "D"]],
    },
}
SCC_EDGE_CASES = {
    "chain": {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"]]},
    "cycle": {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"], ["C", "A"]]},
    "bridge": {
        "nodes": ["A", "B", "C", "D"],
        "edges": [["A", "B"], ["B", "A"], ["B", "C"], ["C", "D"], ["D", "C"]],
    },
    "single": {"nodes": ["A"], "edges": []},
    "empty": {"nodes": [], "edges": []},
}


def run(source: str, graph: dict) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "line": line,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    ns = {"input": copy.deepcopy(graph), "trace": trace}
    exec(compile(source, "<g4>", "exec"), ns)
    return frames


def adjacency_of(graph: dict, directed: bool) -> dict[str, list[str]]:
    adjacency = {node: [] for node in graph["nodes"]}
    for a, b in graph["edges"]:
        adjacency[a].append(b)
        if not directed:
            adjacency[b].append(a)
    return adjacency


def reachable(adjacency: dict[str, list[str]], start: str) -> set[str]:
    seen = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for neighbor in adjacency[node]:
            if neighbor not in seen:
                seen.add(neighbor)
                stack.append(neighbor)
    return seen


def reference_cc_groups(graph: dict) -> set[frozenset[str]]:
    adjacency = adjacency_of(graph, directed=False)
    seen: set[str] = set()
    groups: list[frozenset[str]] = []
    for node in graph["nodes"]:
        if node not in seen:
            component = reachable(adjacency, node)
            seen |= component
            groups.append(frozenset(component))
    return set(groups)


def reference_scc_groups(graph: dict) -> set[frozenset[str]]:
    adjacency = adjacency_of(graph, directed=True)
    reverse = {node: [] for node in graph["nodes"]}
    for a, b in graph["edges"]:
        reverse[b].append(a)
    remaining = set(graph["nodes"])
    groups: list[frozenset[str]] = []
    while remaining:
        root = next(node for node in graph["nodes"] if node in remaining)
        forward = reachable(adjacency, root)
        backward = reachable(reverse, root)
        group = frozenset(forward & backward)
        assert group, "reference SCC is empty"
        groups.append(group)
        remaining -= group
    return set(groups)


def frame_groups(structure: dict) -> set[frozenset[str]]:
    return {frozenset(group["nodeIds"]) for group in structure["components"]}


def check_cc(graph: dict) -> list[dict]:
    frames = run(CC_SOURCE, graph)
    assert frames, "connected components produced no frames"
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    nodes = list(graph["nodes"])
    final = frames[-1]["structure"]
    assert sorted(final["discoveredIds"]) == sorted(nodes), "done must discover every node"
    assert sorted(final["visitedIds"]) == sorted(nodes), "done must visit every node"
    assert all(group["complete"] for group in final["components"]), "done groups must be complete"
    assert frame_groups(final) == reference_cc_groups(graph), (
        "component partition differs from independent reachability reference",
        frame_groups(final),
        reference_cc_groups(graph),
    )

    discovered: list[str] = []
    visited: list[str] = []
    stack_nodes: list[str] = []
    current_component = None
    for frame in frames:
        structure = frame["structure"]
        assert structure["kind"] == "connected-components"
        assert structure["directed"] is False
        assert len(set(structure["discoveredIds"])) == len(structure["discoveredIds"])
        assert len(set(structure["visitedIds"])) == len(structure["visitedIds"])
        assert set(structure["visitedIds"]) <= set(structure["discoveredIds"])
        stack = [item["nodeId"] for item in structure["frontierItems"]]
        assert len(stack) == len(set(stack)), "duplicate stack node"
        assert all(node in structure["discoveredIds"] for node in stack), "stack node must be discovered"
        if structure["frontierAdded"] is not None:
            assert structure["frontierAdded"]["nodeId"] in stack
        if structure["frontierRemoved"] is not None:
            assert structure["frontierRemoved"]["nodeId"] not in stack
        if structure["operation"] == "start-component":
            assert structure["currentComponentId"] is not None
            assert structure["startNodeId"] is not None
            assert structure["components"][-1]["nodeIds"][0] == structure["startNodeId"]
        if structure["operation"] == "complete-component":
            assert structure["components"][-1]["complete"] is True
        if structure["operation"] == "done":
            assert structure["currentComponentId"] is None
            assert structure["frontierItems"] == []
        # Every recorded component must be one of the independently computed
        # connected components; a subset check is enough to catch a bad merge.
        reference_groups = reference_cc_groups(graph)
        for group in structure["components"]:
            component = frozenset(group["nodeIds"])
            assert any(component <= ref for ref in reference_groups), (
                "component is not a subset of an independent component",
                component,
            )
        discovered = structure["discoveredIds"]
        visited = structure["visitedIds"]
        stack_nodes = stack
    assert len(current_component or []) == 0
    return frames


def check_scc(graph: dict) -> list[dict]:
    frames = run(SCC_SOURCE, graph)
    assert frames, "Kosaraju produced no frames"
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    nodes = list(graph["nodes"])
    final = frames[-1]["structure"]
    assert sorted(final["finishOrder"]) == sorted(nodes), "finish order must be a permutation"
    assert final["secondPassOrder"] == list(reversed(final["finishOrder"])), "second pass order must reverse finish order"
    assert sorted(final["visitedIds"]) == sorted(nodes), "done must assign every node"
    assert all(group["complete"] for group in final["components"]), "done SCCs must be complete"
    assert frame_groups(final) == reference_scc_groups(graph), (
        "SCC partition differs from independent bidirectional reachability reference",
        frame_groups(final),
        reference_scc_groups(graph),
    )

    for frame in frames:
        structure = frame["structure"]
        assert structure["kind"] == "kosaraju"
        assert structure["directed"] is True
        stack = [item["nodeId"] for item in structure["frontierItems"]]
        assert len(stack) == len(set(stack)), "duplicate SCC stack node"
        if structure["frontierAdded"] is not None:
            assert structure["frontierAdded"]["nodeId"] in stack
        if structure["frontierRemoved"] is not None:
            assert structure["frontierRemoved"]["nodeId"] not in stack
        if structure["operation"] in {"init", "start-first", "inspect-edge", "skip", "push", "finish"} and structure["phase"] == "first-pass":
            assert structure["reversed"] is False
            assert structure["components"] == []
            assert structure["currentComponentId"] is None
        if structure["operation"] == "reverse":
            assert structure["phase"] == "reverse"
            assert structure["reversed"] is True
            assert structure["discoveredIds"] == []
            assert structure["visitedIds"] == []
            assert structure["frontierItems"] == []
            assert structure["components"] == []
            assert structure["secondPassOrder"] == list(reversed(structure["finishOrder"]))
        if structure["operation"] == "start-second":
            assert structure["phase"] == "second-pass"
            assert structure["reversed"] is True
            assert structure["currentComponentId"] is not None
            assert structure["components"][-1]["id"] == structure["currentComponentId"]
            assert structure["startNodeId"] == structure["secondPassOrder"][structure["secondPassIndex"]]
        if structure["operation"] == "complete-component":
            assert structure["components"][-1]["complete"] is True
        if structure["operation"] == "done":
            assert structure["phase"] == "done"
            assert structure["currentComponentId"] is None
            assert structure["frontierItems"] == []
    return frames


def check_cross_component_reachability(graph: dict, groups: set[frozenset[str]]) -> None:
    adjacency = adjacency_of(graph, directed=True)
    reach = {node: reachable(adjacency, node) for node in graph["nodes"]}
    for group in groups:
        for node in group:
            for other in group:
                assert other in reach[node], "group is not strongly connected"
        for other in groups - {group}:
            for node in group:
                for other_node in other:
                    assert not (other_node in reach[node] and node in reach[other_node]), (
                        "different SCCs accidentally mutually reachable",
                        group,
                        other,
                    )


def main() -> None:
    cc_frames = check_cc(DEFAULT_CC)
    scc_frames = check_scc(DEFAULT_SCC)
    assert len(cc_frames) == 50, f"expected 50 connected-component frames, got {len(cc_frames)}"
    assert len(scc_frames) == 60, f"expected 60 Kosaraju frames, got {len(scc_frames)}"
    assert frame_groups(cc_frames[-1]["structure"]) == {
        frozenset({"A", "B", "C"}), frozenset({"D", "E"}), frozenset({"F", "G"}), frozenset({"H"})
    }
    assert frame_groups(scc_frames[-1]["structure"]) == {
        frozenset({"H"}), frozenset({"F"}), frozenset({"G"}), frozenset({"A", "B", "C"}), frozenset({"D", "E"})
    }
    assert scc_frames[-1]["structure"]["finishOrder"] == ["E", "D", "C", "B", "A", "G", "F", "H"]

    for name, graph in CC_EDGE_CASES.items():
        frames = check_cc(graph)
        assert frames[-1]["structure"]["componentCount"] == len(reference_cc_groups(graph)), name
        print(f"CC edge case {name}: {len(frames)} frames, {frames[-1]['structure']['componentCount']} components")

    for name, graph in SCC_EDGE_CASES.items():
        frames = check_scc(graph)
        assert frames[-1]["structure"]["componentCount"] == len(reference_scc_groups(graph)), name
        print(f"SCC edge case {name}: {len(frames)} frames, {frames[-1]['structure']['componentCount']} SCCs")

    check_cross_component_reachability(DEFAULT_SCC, reference_scc_groups(DEFAULT_SCC))
    print("G4 Python reference checks passed")
    print("connected default groups:", [g["nodeIds"] for g in cc_frames[-1]["structure"]["components"]])
    print("Kosaraju default groups:", [g["nodeIds"] for g in scc_frames[-1]["structure"]["components"]])


if __name__ == "__main__":
    main()

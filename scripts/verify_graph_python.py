"""Local smoke check for the Stage 7E Python sources (not the Pyodide E2E).

Extracts the exact template strings from graphTraversalExamples.ts, executes
them with the real Python runtime and a local trace() stub, then prints the
operation/visit/frontier evidence. This verifies the algorithm and snapshot
shape before the browser test.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/graphTraversalExamples.ts").read_text(encoding="utf-8")


def between(start: str, end: str) -> str:
    body = TS.split(start, 1)[1].split(end, 1)[0]
    return body


HELPER = between("const GRAPH_INPUT_HELPER = `", "`;")
BFS = between("const BFS_PROGRAM = `", "`;").replace("${GRAPH_INPUT_HELPER}", HELPER)
DFS = between("const DFS_PROGRAM = `", "`;").replace("${GRAPH_INPUT_HELPER}", HELPER)

GRAPH = {
    "start": "A",
    "nodes": ["A", "B", "C", "D", "E", "F", "G"],
    "edges": [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["E", "F"], ["F", "G"]],
}


def run(source: str):
    frames = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": state,
            "message": message,
            "line": line,
            "variables": variables,
            "lessonStep": lesson_step,
            "structure": structure,
        })

    ns = {"input": json.loads(json.dumps(GRAPH)), "trace": trace}
    exec(compile(source, "<algo>", "exec"), ns)
    return frames


def report(name: str, frames):
    ops = [f["structure"]["operation"] for f in frames]
    visited = frames[-1]["structure"]["visitOrder"]
    checks = []
    for frame in frames:
        s = frame["structure"]
        pals = s["frontierItems"]
        checks.append({
            "op": s["operation"],
            "current": s["currentNodeId"],
            "edge": s["currentEdgeId"],
            "neighbor": s["neighborNodeId"],
            "visited": len(s["visitedIds"]),
            "frontier": [x["nodeId"] for x in pals],
            "removed": s["frontierRemoved"]["nodeId"] if s["frontierRemoved"] else None,
        })
    print(f"\n{name}: {len(frames)} frames")
    print("ops:", " ".join(ops))
    print("visitOrder:", " → ".join(visited))
    print("last message:", frames[-1]["message"])
    print("first line / last line:", frames[0]["line"], frames[-1]["line"])
    print("key frames:")
    for row in checks:
        if row["op"] in {"enqueue", "dequeue", "visit", "inspect-edge", "discover", "skip", "push", "pop", "done"}:
            print(row)
    assert len(frames) > 0
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    assert frames[-1]["structure"]["frontierItems"] == []


bfs_frames = run("from collections import deque\nimport sys\n\n" + BFS)
report("BFS", bfs_frames)
assert bfs_frames[-1]["structure"]["visitOrder"] == ["A", "B", "C", "D", "E", "F", "G"]
assert bfs_frames[0]["structure"]["nodes"][-1]["id"] == "G"

dfs_frames = run("import sys\n\n" + DFS)
report("DFS", dfs_frames)
assert dfs_frames[-1]["structure"]["visitOrder"] == ["A", "B", "D", "E", "F", "G", "C"]
assert dfs_frames[0]["structure"]["nodes"][-1]["id"] == "G"

print("\nlocal Python smoke check passed")

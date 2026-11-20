#!/usr/bin/env python3
"""Independent CPython check for the real order-4 B-tree teaching program.

The source is extracted from `btreeExamples.ts` so this script exercises the
same string that ships to Pyodide. It validates the structural invariants after
every emitted frame, then checks the official presets and the duplicate policy.
"""

from __future__ import annotations

import pathlib
import re
import sys
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_TS = ROOT / "src/domain/algorithms/btreeExamples.ts"


def extract_python() -> str:
    text = SOURCE_TS.read_text(encoding="utf-8")
    match = re.search(r"export const BTREE_PYTHON = `(.*?)`;\n\n/\*\* Normalise", text, re.S)
    if not match:
        raise SystemExit("BTREE_PYTHON template literal not found")
    return match.group(1)


def extract_presets() -> list[dict[str, Any]]:
    text = SOURCE_TS.read_text(encoding="utf-8")
    block = re.search(r"export const BTREE_PRESETS = \[(.*?)\] as const;", text, re.S)
    if not block:
        raise SystemExit("BTREE_PRESETS block not found")
    presets: list[dict[str, Any]] = []
    pattern = re.compile(
        r"id: '([^']+)',\s+command: '([^']+)',\s+label: '[^']+',\s+"
        r"tree: \[([^\]]*)\],\s+target: (\d+)",
    )
    for match in pattern.finditer(block.group(1)):
        preset_id, command, tree, target = match.groups()
        presets.append(
            {
                "id": preset_id,
                "operation": command,
                "tree": [int(value.strip()) for value in tree.split(",") if value.strip()],
                "target": int(target),
            }
        )
    return presets


def run(source: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    frames: list[dict[str, Any]] = []

    def trace(state, message, line=None, variables=None, lesson_step=None, structure=None, **_kwargs):
        frames.append(
            {
                "state": state,
                "message": message,
                "line": line,
                "variables": variables,
                "lesson_step": lesson_step,
                "structure": structure,
            }
        )

    namespace: dict[str, Any] = {
        "__name__": "__main__",
        "input": payload,
        "trace": trace,
    }
    exec(compile(source, str(SOURCE_TS), "exec"), namespace)
    return frames


def node_map(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {node["id"]: node for node in snapshot["nodes"]}


def check_frame(frame: dict[str, Any], label: str) -> None:
    snapshot = frame["structure"]
    assert snapshot is not None, f"{label}: missing structure"
    assert snapshot["kind"] == "btree"
    assert snapshot["order"] == 4
    nodes = node_map(snapshot)
    assert len(nodes) == len(snapshot["nodes"]), f"{label}: duplicate ids"

    if not nodes:
        assert snapshot["rootId"] is None
        return

    root = nodes.get(snapshot["rootId"])
    assert root is not None, f"{label}: missing root"
    parent_count: dict[str, int] = {}
    for node in nodes.values():
        assert 1 <= len(node["keys"]) <= 3, f"{label}: node {node['id']} key count"
        assert node["keys"] == sorted(node["keys"]), f"{label}: node {node['id']} keys unsorted"
        assert len(set(node["keys"])) == len(node["keys"]), f"{label}: node {node['id']} local duplicate"
        if node["leaf"]:
            assert node["children"] == [], f"{label}: leaf {node['id']} has children"
        else:
            assert len(node["children"]) == len(node["keys"]) + 1, f"{label}: node {node['id']} child count"
        for child in node["children"]:
            assert child in nodes, f"{label}: missing child {child}"
            parent_count[child] = parent_count.get(child, 0) + 1
    assert all(count == 1 for count in parent_count.values()), f"{label}: multiple parents"
    assert parent_count.get(snapshot["rootId"], 0) == 0, f"{label}: root has parent"

    all_keys: list[int] = []
    leaf_depths: set[int] = set()

    def walk(node_id: str, lower: float, upper: float, depth: int) -> None:
        node = nodes[node_id]
        for index, key in enumerate(node["keys"]):
            assert lower < key < upper, f"{label}: key {key} outside range at {node_id}"
            if index:
                assert node["keys"][index - 1] < key, f"{label}: keys unordered at {node_id}"
            all_keys.append(key)
        if node["leaf"]:
            leaf_depths.add(depth)
            return
        for slot, child in enumerate(node["children"]):
            child_lower = lower if slot == 0 else node["keys"][slot - 1]
            child_upper = upper if slot == len(node["keys"]) else node["keys"][slot]
            walk(child, child_lower, child_upper, depth + 1)

    walk(snapshot["rootId"], float("-inf"), float("inf"), 0)
    assert len(leaf_depths) == 1, f"{label}: leaves not at one depth: {leaf_depths}"
    assert len(all_keys) == len(set(all_keys)), f"{label}: duplicate key globally"

    current_id = snapshot["currentNodeId"]
    path = snapshot["pathIds"]
    if current_id is None:
        assert path == [], f"{label}: current without path"
    else:
        assert path and path[-1] == current_id, f"{label}: path does not end at current"
        assert path[0] == snapshot["rootId"], f"{label}: path does not start at root"
        for parent_id, child_id in zip(path, path[1:]):
            assert child_id in nodes[parent_id]["children"], f"{label}: path is not a real child chain"

    compare_index = snapshot["compareIndex"]
    compare_key = snapshot["compareKey"]
    if compare_index is not None or compare_key is not None:
        assert compare_index is not None and compare_key is not None
        assert nodes[current_id]["keys"][compare_index] == compare_key, f"{label}: compare key mismatch"

    child_slot = snapshot["childSlot"]
    child_id = snapshot["childId"]
    if child_slot is not None or child_id is not None:
        assert child_slot is not None and child_id is not None
        assert nodes[current_id]["children"][child_slot] == child_id, f"{label}: child slot mismatch"

    split = snapshot["split"]
    if split is not None:
        assert snapshot["operation"] == "split"
        if split["phase"] == "before":
            assert len(nodes[split["nodeId"]]["keys"]) == 3, f"{label}: split-before not full"
            assert split["leftId"] is None and split["rightId"] is None
        else:
            parent = nodes[split["parentId"]]
            index = parent["keys"].index(split["promotedKey"])
            left = nodes[split["leftId"]]
            right = nodes[split["rightId"]]
            assert len(left["keys"]) == 1 and len(right["keys"]) == 1
            assert parent["children"][index] == split["leftId"]
            assert parent["children"][index + 1] == split["rightId"]
            if split["rootChanged"]:
                assert split["parentId"] == snapshot["rootId"]


def run_preset(source: str, preset: dict[str, Any]) -> list[dict[str, Any]]:
    frames = run(
        source,
        {
            "preset": preset["id"],
            "operation": preset["operation"],
            "tree": preset["tree"],
            "target": preset["target"],
        },
    )
    assert frames, f"{preset['id']}: no frames"
    for index, frame in enumerate(frames):
        check_frame(frame, f"{preset['id']}[{index}]")
    return frames


def main() -> int:
    source = extract_python()
    presets = extract_presets()
    assert {preset["id"] for preset in presets} == {
        "find-hit",
        "find-miss",
        "insert-leaf",
        "insert-split",
        "insert-root-split",
    }
    results: list[str] = []
    lesson_steps: set[str] = set()
    for preset in presets:
        frames = run_preset(source, preset)
        lesson_steps.update(
            frame["lesson_step"] for frame in frames if isinstance(frame.get("lesson_step"), str)
        )
        last = frames[-1]["structure"]
        results.append(
            f"{preset['id']}: {len(frames)} frames, result={last['result']}, "
            f"height={frames[-1]['variables']['treeHeight']}"
        )
        if preset["id"] == "find-hit":
            assert any(frame["structure"]["operation"] == "found" for frame in frames)
        if preset["id"] == "find-miss":
            assert any(frame["structure"]["operation"] == "not-found" for frame in frames)
        if preset["id"].startswith("insert-"):
            assert any(frame["structure"]["operation"] == "insert" for frame in frames)
        if preset["id"] == "insert-split":
            assert any(
                frame["structure"]["operation"] == "split"
                and frame["structure"]["split"]["phase"] == "after"
                and not frame["structure"]["split"]["rootChanged"]
                for frame in frames
            )
        if preset["id"] == "insert-root-split":
            assert any(
                frame["structure"]["operation"] == "split"
                and frame["structure"]["split"]["phase"] == "after"
                and frame["structure"]["split"]["rootChanged"]
                for frame in frames
            )

    duplicate_frames = run(
        source,
        {
            "preset": "duplicate",
            "operation": "insert",
            "tree": [10, 20, 30, 40, 50, 60, 70],
            "target": 30,
        },
    )
    for index, frame in enumerate(duplicate_frames):
        check_frame(frame, f"duplicate[{index}]")
    duplicate_last = duplicate_frames[-1]["structure"]
    assert duplicate_last["result"] == "duplicate"
    assert not any(frame["structure"]["operation"] == "split" for frame in duplicate_frames)
    before = duplicate_frames[0]["structure"]
    after = duplicate_last
    assert before["nodes"] == after["nodes"], "duplicate insertion changed the tree"
    lesson_steps.update(
        frame["lesson_step"] for frame in duplicate_frames if isinstance(frame.get("lesson_step"), str)
    )
    assert lesson_steps == {
        "init", "inspect", "descend", "found", "not-found", "duplicate",
        "split-before", "split-after", "insert", "done",
    }, f"lesson step coverage mismatch: {sorted(lesson_steps)}"

    print("btree python verification passed")
    for result in results:
        print("  " + result)
    print(f"  duplicate: {len(duplicate_frames)} frames, tree unchanged")
    return 0


if __name__ == "__main__":
    sys.exit(main())

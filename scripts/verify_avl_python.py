#!/usr/bin/env python3
"""Independent CPython verification for the T2 AVL teaching program.

It extracts the real Python source from avlExamples.ts, executes it with a fake
`trace` collector, and validates every emitted structure snapshot. It also
cross-checks final shapes against a separate, minimal reference AVL
implementation (not the teaching program's own rotation helpers).

Run: python scripts/verify_avl_python.py
"""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "src" / "domain" / "algorithms" / "avlExamples.ts"

PRESETS = [
    ("insert-ll", "insert", [30, 20, 40, 10], 5),
    ("insert-rr", "insert", [30, 20, 40, 50], 60),
    ("insert-lr", "insert", [50, 30, 70, 20, 40, 60, 80, 10, 25], 27),
    ("insert-rl", "insert", [50, 30, 70, 60, 55], 52),
    ("insert-balanced", "insert", [30, 20, 40, 10, 25, 35], 28),
    ("delete-leaf", "delete", [30, 20, 40, 10, 25, 35, 5], 35),
    ("delete-one", "delete", [30, 20, 40, 10, 25, 35, 5], 40),
    ("delete-two", "delete", [50, 30, 70, 20, 40, 60, 80, 65], 50),
    ("delete-cascade", "delete", [3, 9, 1, 6, 8, 11, 12, 2, 10, 7, 5, 4], 12),
    ("delete-missing", "delete", [30, 20, 40, 10, 25, 35], 50),
]

EXPECTED_ROTATIONS = {
    "insert-ll": {"LL": 2},              # before + after
    "insert-rr": {"RR": 2},
    "insert-lr": {"LR": 4},              # two real rotations, before + after each
    "insert-rl": {"RL": 4},
    "delete-leaf": {"LL": 2},            # leaf delete rebalances at the root
    "delete-one": {"LL": 2},             # 35 replaces 40, root becomes LL-heavy
    "delete-cascade": {"LR": 8},         # two real LR double rotations up the ancestor chain
}

failure_count = 0


def fail(message: str) -> None:
    global failure_count
    failure_count += 1
    print("FAIL: " + message)


def load_source() -> str:
    text = EXAMPLES.read_text(encoding="utf-8")
    match = re.search(r"export const AVL_PYTHON = `([\s\S]*?)`;\n", text)
    if not match:
        raise SystemExit("could not extract AVL_PYTHON")
    return match.group(1)


def run_preset(source: str, name: str, operation: str, tree: list[int], target: int) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message, line=None, variables=None, lesson_step=None, structure=None):
        if structure is not None:
            frames.append({
                "state": state,
                "message": message,
                "lessonStepId": lesson_step,
                "structure": structure,
            })

    namespace = {
        "__name__": "avl_teaching_program",
        "input": {"preset": name, "operation": operation, "tree": tree, "target": target},
        "trace": trace,
    }
    exec(compile(source, "<avlExamples.ts:AVL_PYTHON>", "exec"), namespace)
    if not frames:
        fail(name + ": emitted no frames")
    return frames


def node_map(snapshot: dict) -> dict[str, dict]:
    return {node["id"]: node for node in snapshot["nodes"]}


def child_map(snapshot: dict) -> dict[str, Optional[str]]:
    return {node["id"]: node["leftId"] for node in snapshot["nodes"]}


def actual_height(nodes: dict[str, dict], node_id: Optional[str], seen: set[str]) -> int:
    if node_id is None:
        return 0
    if node_id in seen or node_id not in nodes:
        return 0
    seen.add(node_id)
    node = nodes[node_id]
    left = actual_height(nodes, node["leftId"], seen)
    right = actual_height(nodes, node["rightId"], seen)
    return 1 + max(left, right)


def check_snapshot(name: str, index: int, snapshot: dict) -> None:
    nodes = node_map(snapshot)
    root = snapshot["rootId"]
    label = f"{name} frame {index} ({snapshot['operation']})"

    ids = list(nodes)
    if len(ids) != len(set(ids)):
        fail(label + ": duplicate node ids")
        return

    # All nodes reachable from root, and no node has more than one parent.
    parents: dict[str, str] = {}
    seen: set[str] = set()

    def walk(node_id: Optional[str]) -> None:
        if node_id is None:
            return
        if node_id in seen:
            fail(label + ": cycle or repeated ownership at " + node_id)
            return
        seen.add(node_id)
        node = nodes.get(node_id)
        if node is None:
            fail(label + ": missing referenced node " + node_id)
            return
        for child in (node["leftId"], node["rightId"]):
            if child is not None:
                if child in parents:
                    fail(label + ": node " + child + " has multiple parents")
                parents[child] = node_id
                walk(child)

    if root is not None and root not in nodes:
        fail(label + ": root id absent from nodes")
    walk(root)
    if seen != set(ids):
        fail(label + ": orphan nodes " + str(sorted(set(ids) - seen)))
    if root is not None and root in parents:
        fail(label + ": root has a parent")

    # In-order strict increase and height / balance invariants.
    inorder_values = [nodes[node_id]["value"] for node_id in snapshot["inorderIds"] if node_id in nodes]
    if inorder_values != sorted(inorder_values) or len(set(inorder_values)) != len(inorder_values):
        fail(label + ": inorder values not strictly increasing: " + str(inorder_values))
    if snapshot["inorderIds"] != inorder_ids_from_nodes(nodes, root):
        fail(label + ": inorderIds do not match the real tree")

    for node_id, node in nodes.items():
        expected_height = actual_height(nodes, node_id, set())
        if node["height"] != expected_height:
            fail(f"{label}: height mismatch at {node_id}: {node['height']} != {expected_height}")
        expected_balance = (
            nodes[node["leftId"]]["height"] if node["leftId"] else 0
        ) - (nodes[node["rightId"]]["height"] if node["rightId"] else 0)
        if node["balance"] != expected_balance:
            fail(f"{label}: balance mismatch at {node_id}: {node['balance']} != {expected_balance}")

    # All frames are refreshed post-order, so this must hold even before a rotation.
    if snapshot["operation"] in {"init", "done"}:
        for node_id, node in nodes.items():
            if abs(node["balance"]) > 1:
                fail(f"{label}: unbalanced at {node_id} (bf={node['balance']})")

    # Path metadata must be a real root-to-current path.
    path = snapshot["pathIds"]
    if path:
        current = snapshot["currentNodeId"]
        if path[-1] != current:
            fail(label + ": path does not end at current")
        for left, right in zip(path, path[1:]):
            if left not in nodes or right not in (nodes[left]["leftId"], nodes[left]["rightId"]):
                fail(label + f": path edge {left}->{right} is not a real pointer")
        if root is not None and path[0] != root:
            fail(label + ": path does not start at root")

    # Rotation metadata: before/after phases belong to real rotation frames only.
    rotation_frames = snapshot["operation"] in {"rotate-left", "rotate-right"}
    if rotation_frames:
        if snapshot["rotationCase"] not in {"LL", "RR", "LR", "RL"}:
            fail(label + ": rotate frame without a valid rotationCase")
        if snapshot["rotationPhase"] not in {"before", "after"}:
            fail(label + ": rotate frame without a valid rotationPhase")
        if snapshot["rotationStep"] is None or snapshot["rotationTotal"] not in {1, 2}:
            fail(label + ": rotate frame without rotationStep/Total")
    else:
        if snapshot["rotationPhase"] is not None:
            fail(label + ": rotationPhase on a non-rotation frame")

    # Removed-object metadata cannot still be attached.
    removed = snapshot["removedNode"]
    if removed is not None:
        if removed["id"] in nodes:
            fail(label + ": removedNode is still attached")
        if snapshot["replacementId"] is not None and snapshot["replacementId"] not in nodes:
            fail(label + ": replacementId is not attached")
    if snapshot["oldRootId"] is not None and snapshot["oldRootId"] == snapshot["rootId"]:
        fail(label + ": oldRootId equals new root")


def inorder_ids_from_nodes(nodes: dict[str, dict], root: Optional[str]) -> list[str]:
    result: list[str] = []
    stack: list[str] = []
    current = root
    while current is not None or stack:
        while current is not None:
            stack.append(current)
            current = nodes[current]["leftId"]
        current = stack.pop()
        result.append(current)
        current = nodes[current]["rightId"]
    return result


class RefNode:
    __slots__ = ("value", "left", "right", "height")

    def __init__(self, value: int):
        self.value = value
        self.left: Optional["RefNode"] = None
        self.right: Optional["RefNode"] = None
        self.height = 1


def ref_height(node: Optional[RefNode]) -> int:
    return node.height if node is not None else 0


def ref_update(node: Optional[RefNode]) -> None:
    if node is not None:
        node.height = 1 + max(ref_height(node.left), ref_height(node.right))


def ref_balance(node: RefNode) -> int:
    return ref_height(node.left) - ref_height(node.right)


def ref_rot_right(y: RefNode) -> RefNode:
    x = y.left
    assert x is not None
    y.left = x.right
    x.right = y
    ref_update(y)
    ref_update(x)
    return x


def ref_rot_left(x: RefNode) -> RefNode:
    y = x.right
    assert y is not None
    x.right = y.left
    y.left = x
    ref_update(x)
    ref_update(y)
    return y


def ref_rebalance(node: RefNode) -> RefNode:
    ref_update(node)
    balance = ref_balance(node)
    if balance > 1:
        assert node.left is not None
        if ref_balance(node.left) < 0:
            node.left = ref_rot_left(node.left)
        return ref_rot_right(node)
    if balance < -1:
        assert node.right is not None
        if ref_balance(node.right) > 0:
            node.right = ref_rot_right(node.right)
        return ref_rot_left(node)
    return node


def ref_insert(node: Optional[RefNode], value: int) -> RefNode:
    if node is None:
        return RefNode(value)
    if value < node.value:
        node.left = ref_insert(node.left, value)
    elif value > node.value:
        node.right = ref_insert(node.right, value)
    else:
        return node
    return ref_rebalance(node)


def ref_delete(node: Optional[RefNode], value: int) -> Optional[RefNode]:
    if node is None:
        return None
    if value < node.value:
        node.left = ref_delete(node.left, value)
    elif value > node.value:
        node.right = ref_delete(node.right, value)
    else:
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
        successor = node.right
        while successor.left is not None:
            successor = successor.left
        node.value = successor.value
        node.right = ref_delete(node.right, successor.value)
    return ref_rebalance(node)


def canonical(node: Optional[RefNode]) -> tuple:
    if node is None:
        return ()
    return (node.value, canonical(node.left), canonical(node.right))


def canonical_snapshot(snapshot: dict) -> tuple:
    nodes = node_map(snapshot)
    memo: dict[str, tuple] = {}

    def walk(node_id: Optional[str]) -> tuple:
        if node_id is None:
            return ()
        if node_id in memo:
            return memo[node_id]
        node = nodes[node_id]
        value = (node["value"], walk(node["leftId"]), walk(node["rightId"]))
        memo[node_id] = value
        return value

    return walk(snapshot["rootId"])


def check_preset(name: str, operation: str, tree: list[int], target: int, frames: list[dict]) -> None:
    for index, frame in enumerate(frames):
        check_snapshot(name, index, frame["structure"])

    snapshots = [frame["structure"] for frame in frames]
    init = snapshots[0]
    done = snapshots[-1]
    if init["operation"] != "init":
        fail(name + ": first frame is not init")
    if done["operation"] != "done":
        fail(name + ": last frame is not done")

    initial_values = sorted(tree)
    if sorted(node["value"] for node in node_map(init).values()) != initial_values:
        fail(name + ": initial tree values differ from preset")

    # Cross-check with the independent reference implementation.
    ref_root: Optional[RefNode] = None
    for value in tree:
        ref_root = ref_insert(ref_root, value)
    if operation == "insert":
        ref_root = ref_insert(ref_root, target)
    else:
        ref_root = ref_delete(ref_root, target)
    if canonical_snapshot(done) != canonical(ref_root):
        fail(name + ": final shape differs from independent reference AVL")

    # Per-operation expectations.
    if operation == "insert":
        if done["result"] not in {"inserted", "duplicate"}:
            fail(name + ": bad insert result " + str(done["result"]))
    else:
        if target in [node["value"] for node in node_map(done).values()]:
            fail(name + ": target still present after delete")
        if done["result"] != ("missing" if target not in initial_values else "deleted"):
            fail(name + ": bad delete result " + str(done["result"]))

    # Rotation counts and real before/after pairs.
    rotations = [s for s in snapshots if s["operation"] in {"rotate-left", "rotate-right"}]
    cases = {}
    for s in rotations:
        cases[s["rotationCase"]] = cases.get(s["rotationCase"], 0) + 1
    expected = EXPECTED_ROTATIONS.get(name)
    if expected is not None and cases != expected:
        fail(name + f": rotation counts {cases} != expected {expected}")
    if rotations:
        if any(s["rotationPhase"] not in {"before", "after"} for s in rotations):
            fail(name + ": invalid rotation phase")
        if any(s["imbalanceId"] is None or s["pivotId"] is None or s["promotedId"] is None for s in rotations):
            fail(name + ": rotation frame lacks imbalance/pivot/promoted ids")
        for before, after in zip(rotations, rotations[1:]):
            if before["rotationStep"] == after["rotationStep"] and before["rotationPhase"] == after["rotationPhase"]:
                fail(name + ": duplicate rotation phase")
            if before["rotationStep"] == after["rotationStep"] and before["rotationPhase"] == "after" and after["rotationPhase"] == "before":
                fail(name + ": phases out of order")
        for s in rotations:
            if s["rotationPhase"] == "before":
                pivot = s["pivotId"]
                promoted = s["promotedId"]
                nodes = node_map(s)
                if pivot not in nodes or promoted not in nodes:
                    fail(name + ": pivot/promoted missing in before frame")
                if s["operation"] == "rotate-right" and nodes[pivot]["leftId"] != promoted:
                    fail(name + ": right rotation before: promoted is not pivot.left")
                if s["operation"] == "rotate-left" and nodes[pivot]["rightId"] != promoted:
                    fail(name + ": left rotation before: promoted is not pivot.right")
            if s["rotationPhase"] == "after":
                pivot = s["pivotId"]
                promoted = s["promotedId"]
                nodes = node_map(s)
                if pivot not in nodes or promoted not in nodes:
                    fail(name + ": pivot/promoted missing in after frame")
                if s["operation"] == "rotate-right" and nodes[promoted]["rightId"] != pivot:
                    fail(name + ": right rotation after: pivot is not promoted.right")
                if s["operation"] == "rotate-left" and nodes[promoted]["leftId"] != pivot:
                    fail(name + ": left rotation after: pivot is not promoted.left")

    if name == "insert-rl":
        if sorted({s["rotationStep"] for s in rotations}) != [1, 2]:
            fail(name + ": expected two real rotation steps")
        if {s["rotationCase"] for s in rotations} != {"RL"}:
            fail(name + ": expected only RL case")
    if name == "insert-lr":
        if sorted({s["rotationStep"] for s in rotations}) != [1, 2]:
            fail(name + ": expected two real rotation steps")
        if {s["rotationCase"] for s in rotations} != {"LR"}:
            fail(name + ": expected only LR case")

    if name == "delete-two":
        successor_ids = {s["successorId"] for s in snapshots if s["successorId"]}
        if len(successor_ids) != 1:
            fail(name + ": successor id should stay stable")
        successor_id = next(iter(successor_ids))
        found = next(s for s in snapshots if s["operation"] == "successor-found")
        after = next(s for s in snapshots if s["operation"] == "transplant")
        if successor_id not in node_map(found) or successor_id not in node_map(after):
            fail(name + ": successor identity lost during transplant")
        if node_map(found)[successor_id]["value"] != node_map(after)[successor_id]["value"]:
            fail(name + ": successor value changed during transplant")
        if done["rootId"] != successor_id:
            fail(name + ": root should be the transplanted successor")
        if done["result"] != "deleted":
            fail(name + ": two-child delete not reported as deleted")

    if name == "delete-leaf":
        if done["deleteCase"] is not None:
            fail(name + ": done frame should clear deleteCase")
        leaf_frames = [s for s in snapshots if s["operation"] == "delete-leaf"]
        if not leaf_frames or leaf_frames[0]["deleteCase"] != "leaf":
            fail(name + ": leaf delete case missing")
    if name == "delete-one":
        one_frames = [s for s in snapshots if s["operation"] == "delete-one"]
        if not one_frames or one_frames[0]["deleteCase"] != "one-child":
            fail(name + ": one-child delete case missing")
        if not one_frames[0]["removedNode"] or one_frames[0]["removedNode"]["role"] != "target":
            fail(name + ": target removed metadata missing")
    if name == "delete-missing":
        if done["result"] != "missing":
            fail(name + ": missing delete not reported")
        if len(node_map(done)) != len(node_map(init)):
            fail(name + ": missing delete changed the tree")


def check_multi_ancestor(source: str) -> None:
    sequence = [3, 9, 1, 6, 8, 11, 12, 2, 10, 7, 5, 4]
    target = 12
    frames = run_preset(source, "multi-ancestor", "delete", sequence, target)
    for index, frame in enumerate(frames):
        check_snapshot("multi-ancestor", index, frame["structure"])
    snapshots = [f["structure"] for f in frames]
    imbalances = {s["imbalanceId"] for s in snapshots if s["imbalanceId"]}
    rotations = [s for s in snapshots if s["operation"] in {"rotate-left", "rotate-right"}]
    steps = {(s["imbalanceId"], s["rotationStep"]) for s in rotations if s["imbalanceId"]}
    if len(imbalances) < 2:
        fail("multi-ancestor: expected at least two distinct imbalance ancestors, got " + str(imbalances))
    if len(rotations) < 4:
        fail("multi-ancestor: expected more than one real rotation, got " + str(len(rotations)))
    if not steps:
        fail("multi-ancestor: no rotation steps recorded")
    if any(abs(node["balance"]) > 1 for node in node_map(snapshots[-1]).values()):
        fail("multi-ancestor: final tree unbalanced")


def check_boundaries(source: str) -> None:
    # Empty tree insert and empty tree delete are real edge cases, not presets.
    frames = run_preset(source, "empty-insert", "insert", [], 7)
    done = frames[-1]["structure"]
    if done["rootId"] is None or node_map(done)[done["rootId"]]["value"] != 7:
        fail("empty insert: root not created")
    if done["result"] != "inserted":
        fail("empty insert: wrong result")

    frames = run_preset(source, "empty-delete", "delete", [], 7)
    done = frames[-1]["structure"]
    if done["rootId"] is not None:
        fail("empty delete: root should stay empty")
    if done["result"] != "missing":
        fail("empty delete: wrong result")

    # Duplicate insertion must not create a second node.
    frames = run_preset(source, "duplicate", "insert", [30, 20, 40], 20)
    done = frames[-1]["structure"]
    if done["result"] != "duplicate":
        fail("duplicate: wrong result")
    if len(node_map(done)) != 3:
        fail("duplicate: node count changed")

    # Malformed tree values are skipped, never crash.
    frames = run_preset(source, "invalid-tree", "insert", [30, None, True, "x", 20], 10)
    done = frames[-1]["structure"]
    if len(node_map(done)) != 3:
        fail("invalid tree: malformed values were not skipped")


def check_source_syntax(source: str) -> None:
    try:
        ast.parse(source)
    except SyntaxError as error:
        fail("AVL_PYTHON syntax error: " + str(error))


def main() -> int:
    source = load_source()
    check_source_syntax(source)
    for name, operation, tree, target in PRESETS:
        frames = run_preset(source, name, operation, tree, target)
        check_preset(name, operation, tree, target, frames)
        print(f"{name:16s} frames={len(frames):3d} rotations={sum(1 for f in frames if f['structure']['operation'].startswith('rotate'))}")
    check_multi_ancestor(source)
    print("multi-ancestor    frames/rotation checks passed")
    check_boundaries(source)
    print("boundaries        empty/duplicate/invalid checks passed")
    if failure_count:
        print(f"\n{failure_count} failure(s)")
        return 1
    print("\nAVL verification passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Independent CPython verification for L1A doubly / circular linked lists.

The shipped teaching Python is extracted from `advancedLinkedListExamples.ts`
and executed with a local trace collector. A separately written reference model
replays the same operations and compares the terminal chain, every stable node
id, every prev/next value, and the head/tail references.

On every emitted frame this verifier additionally checks:
  - completed frames satisfy the structure's pointer invariant;
  - every `change.beforeId` equals the previous frame's recorded value;
  - every `change.afterId` equals the current frame's recorded value;
  - a removed node ends with null links and is unreachable;
  - a single-node circular list points to itself.

This is an operation-level audit, not a screenshot comparison.
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/advancedLinkedListExamples.ts").read_text(encoding="utf-8")

SOURCES = {}
for name in ("DOUBLY_PYTHON", "CIRCULAR_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"doubly": SOURCES["DOUBLY_PYTHON"], "circular": SOURCES["CIRCULAR_PYTHON"]}

OFFICIAL = {
    "doubly": [
        ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
        ["insert_after", 5, 6], ["insert_tail", 8],
        ["traverse_forward"], ["traverse_reverse"], ["find", 6], ["find", 99],
        ["delete", 6], ["delete_head"], ["delete_tail"], ["delete", 5], ["delete_tail", 7],
        ["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"],
    ],
    "circular": [
        ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
        ["insert_after", 5, 6], ["insert_tail", 8],
        ["traverse_circle"], ["find", 6], ["find", 99],
        ["delete", 6], ["delete_head"], ["delete_tail"], ["delete", 5], ["delete_tail", 7],
        ["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"],
    ],
}

EDGE = {
    "doubly": {
        "empty": [],
        "single_forward_reverse": [
            ["insert_head", 5], ["traverse_forward"], ["traverse_reverse"],
            ["find", 5], ["find", 99], ["delete_head"],
        ],
        "head_tail": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["delete_head"], ["delete_tail"],
        ],
        "middle": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["insert_after", 5, 6], ["insert_tail", 8], ["delete", 6],
        ],
        "missing_insert": [["insert_head", 5], ["insert_after", 99, 8], ["find", 99], ["delete", 99]],
        "delete_all": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["delete_head"], ["delete_tail"], ["delete", 2],
        ],
        "rebuild": [
            ["insert_head", 9], ["delete_head"], ["insert_head", 11],
            ["insert_tail", 13], ["delete_tail"], ["insert_head", 15],
        ],
        "order": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["insert_tail", 4], ["insert_tail", 5], ["delete", 2], ["delete", 4],
        ],
    },
    "circular": {
        "empty": [],
        "single_self_loop": [
            ["insert_head", 5], ["traverse_circle"], ["find", 5], ["find", 99], ["delete_head"],
        ],
        "head_tail": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["traverse_circle"], ["delete_head"], ["delete_tail"],
        ],
        "middle": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["insert_after", 5, 6], ["insert_tail", 8], ["delete", 6], ["traverse_circle"],
        ],
        "delete_last": [["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"]],
        "missing": [["insert_head", 5], ["find", 99], ["insert_after", 99, 8], ["delete", 99]],
        "rebuild": [
            ["insert_head", 9], ["delete_head"], ["insert_head", 11],
            ["insert_tail", 13], ["traverse_circle"], ["delete_tail"], ["insert_head", 15],
        ],
        "order": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["insert_tail", 4], ["insert_tail", 5], ["delete", 2], ["delete", 4],
            ["traverse_circle"],
        ],
    },
}


def run(algorithm, operations):
    frames = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "line": line,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    env = {"input": copy.deepcopy(operations), "trace": trace, "__name__": "l1a_verify"}
    exec(compile(ALGORITHMS[algorithm], f"<l1a-{algorithm}>", "exec"), env)
    return frames


# ---------------------------------------------------------------------------
# Independent reference models. They never import the app or the shipped code.
# ---------------------------------------------------------------------------

class RefNode:
    __slots__ = ("id", "value", "prev", "next")

    def __init__(self, node_id, value):
        self.id = node_id
        self.value = value
        self.prev = None
        self.next = None


class RefDoubly:
    def __init__(self):
        self.nodes = []
        self.sequence = 0
        self.head = None
        self.tail = None

    def make(self, value):
        self.sequence += 1
        node = RefNode(f"n{self.sequence}", value)
        self.nodes.append(node)
        return node

    def find(self, value):
        node = self.head
        while node is not None:
            if node.value == value:
                return node
            node = node.next
        return None

    def insert_head(self, value):
        node = self.make(value)
        if self.head is None:
            self.head = node
            self.tail = node
            return
        node.next = self.head
        self.head.prev = node
        self.head = node

    def insert_tail(self, value):
        node = self.make(value)
        if self.head is None:
            self.head = node
            self.tail = node
            return
        node.prev = self.tail
        self.tail.next = node
        self.tail = node

    def insert_after(self, target_value, value):
        target = self.find(target_value)
        if target is None:
            return
        node = self.make(value)
        node.prev = target
        node.next = target.next
        if target.next is not None:
            target.next.prev = node
        else:
            self.tail = node
        target.next = node

    def delete_node(self, target):
        if target is None:
            return
        if target.prev is None:
            self.head = target.next
        else:
            target.prev.next = target.next
        if target.next is None:
            self.tail = target.prev
        else:
            target.next.prev = target.prev
        target.prev = None
        target.next = None

    def delete(self, value):
        self.delete_node(self.find(value))

    def delete_head(self):
        self.delete_node(self.head)

    def delete_tail(self):
        self.delete_node(self.tail)

    def values(self):
        result = []
        node = self.head
        while node is not None:
            result.append(node.value)
            node = node.next
        return result

    def reverse_values(self):
        result = []
        node = self.tail
        while node is not None:
            result.append(node.value)
            node = node.prev
        return result

    def view(self):
        ordered = []
        node = self.head
        while node is not None:
            ordered.append((node.id, node.prev.id if node.prev else None, node.next.id if node.next else None))
            node = node.next
        return {
            "headId": self.head.id if self.head else None,
            "tailId": self.tail.id if self.tail else None,
            "values": self.values(),
            "chain": ordered,
            "nodes": {
                node.id: {
                    "value": node.value,
                    "prevId": node.prev.id if node.prev else None,
                    "nextId": node.next.id if node.next else None,
                }
                for node in self.nodes
            },
        }


class RefCircular:
    def __init__(self):
        self.nodes = []
        self.sequence = 0
        self.head = None
        self.tail = None

    def make(self, value):
        self.sequence += 1
        node = RefNode(f"n{self.sequence}", value)
        self.nodes.append(node)
        return node

    def find(self, value):
        node = self.head
        if node is None:
            return None
        while True:
            if node.value == value:
                return node
            node = node.next
            if node is self.head:
                return None

    def insert_head(self, value):
        node = self.make(value)
        if self.head is None:
            node.next = node
            self.head = node
            self.tail = node
            return
        node.next = self.head
        self.tail.next = node
        self.head = node

    def insert_tail(self, value):
        node = self.make(value)
        if self.head is None:
            node.next = node
            self.head = node
            self.tail = node
            return
        node.next = self.head
        self.tail.next = node
        self.tail = node

    def insert_after(self, target_value, value):
        target = self.find(target_value)
        if target is None:
            return
        node = self.make(value)
        node.next = target.next
        target.next = node
        if target is self.tail:
            self.tail = node

    def delete_node(self, target):
        if target is None:
            return
        if target is self.head and target is self.tail:
            target.next = None
            self.head = None
            self.tail = None
            return
        previous = self.tail if target is self.head else self.head
        while previous.next is not target:
            previous = previous.next
        if target is self.head:
            self.head = target.next
            self.tail.next = self.head
        elif target is self.tail:
            self.tail = previous
            previous.next = self.head
        else:
            previous.next = target.next
        target.next = None

    def delete(self, value):
        self.delete_node(self.find(value))

    def delete_head(self):
        self.delete_node(self.head)

    def delete_tail(self):
        self.delete_node(self.tail)

    def values(self):
        if self.head is None:
            return []
        result = []
        node = self.head
        while True:
            result.append(node.value)
            node = node.next
            if node is self.head:
                return result

        return result

    def view(self):
        ordered = []
        node = self.head
        if node is not None:
            while True:
                ordered.append((node.id, node.next.id if node.next else None))
                node = node.next
                if node is self.head:
                    break
        return {
            "headId": self.head.id if self.head else None,
            "tailId": self.tail.id if self.tail else None,
            "values": self.values(),
            "chain": ordered,
            "nodes": {
                node.id: {
                    "value": node.value,
                    "prevId": None,
                    "nextId": node.next.id if node.next else None,
                }
                for node in self.nodes
            },
        }


def replay(algorithm, operations):
    ref = RefDoubly() if algorithm == "doubly" else RefCircular()
    traversals = []
    for entry in operations:
        op = entry[0]
        if op == "insert_head":
            ref.insert_head(entry[1])
        elif op == "insert_tail":
            ref.insert_tail(entry[1])
        elif op == "insert_after":
            ref.insert_after(entry[1], entry[2])
        elif op == "delete":
            ref.delete(entry[1])
        elif op == "delete_head":
            ref.delete_head()
        elif op == "delete_tail":
            ref.delete_tail()
        elif op == "traverse_forward":
            traversals.append(("forward", ref.values()))
        elif op == "traverse_reverse":
            traversals.append(("reverse", ref.reverse_values()))
        elif op == "traverse_circle":
            traversals.append(("circle", ref.values()))
    return ref.view(), traversals


def fail(errors, message):
    errors.append(message)


def frame_invariants(frame, algorithm, errors):
    snap = frame["structure"]
    nodes = snap["nodes"]
    ids = [node["id"] for node in nodes]
    if len(set(ids)) != len(ids):
        fail(errors, "duplicate node ids")
    if snap["phase"] != "complete":
        return
    if algorithm == "doubly":
        if (snap["headId"] is None) != (snap["tailId"] is None):
            fail(errors, "empty list must have both endpoints None")
        chain_ids = []
        seen = set()
        current = snap["headId"]
        while current is not None:
            if current in seen:
                fail(errors, f"completed doubly list cycles at {current}")
                break
            node = next((n for n in nodes if n["id"] == current), None)
            if node is None:
                fail(errors, f"dangling next {current}")
                break
            seen.add(current)
            chain_ids.append(node["id"])
            current = node["nextId"]
        if snap["headId"] is not None:
            if not chain_ids:
                fail(errors, "head cannot be reached")
            if chain_ids[-1] != snap["tailId"]:
                fail(errors, "tail is not the last next-chain node")
        for index, node_id in enumerate(chain_ids):
            node = next(n for n in nodes if n["id"] == node_id)
            expected_prev = None if index == 0 else chain_ids[index - 1]
            expected_next = None if index == len(chain_ids) - 1 else chain_ids[index + 1]
            if node["prevId"] != expected_prev:
                fail(errors, f"{node_id} prevId mismatch")
            if node["nextId"] != expected_next:
                fail(errors, f"{node_id} nextId mismatch")
        for node in nodes:
            if node["id"] not in seen and (node["prevId"] is not None or node["nextId"] is not None):
                fail(errors, f"detached {node['id']} kept a link")
    else:
        if (snap["headId"] is None) != (snap["tailId"] is None):
            fail(errors, "empty list must have both endpoints None")
        if snap["headId"] is None:
            for node in nodes:
                if node["nextId"] is not None:
                    fail(errors, f"empty list retained next on {node['id']}")
            return
        cycle_ids = []
        seen = set()
        current = snap["headId"]
        while current is not None and current not in seen:
            node = next((n for n in nodes if n["id"] == current), None)
            if node is None:
                fail(errors, f"dangling next {current}")
                break
            seen.add(current)
            cycle_ids.append(node["id"])
            current = node["nextId"]
            if current == snap["headId"]:
                break
        if current != snap["headId"]:
            fail(errors, "next chain does not return to head")
        if cycle_ids[-1] != snap["tailId"]:
            fail(errors, "tail is not the return-edge source")
        tail = next((n for n in nodes if n["id"] == snap["tailId"]), None)
        if tail is None or tail["nextId"] != snap["headId"]:
            fail(errors, "tail.next is not head")
        if len(cycle_ids) == 1:
            single = next((n for n in nodes if n["id"] == snap["headId"]), None)
            if snap["headId"] != snap["tailId"] or single is None or single["nextId"] != single["id"]:
                fail(errors, "single node must point to itself")
        for node in nodes:
            if node["id"] not in seen and node["nextId"] is not None:
                fail(errors, f"detached {node['id']} kept next")


def change_continuity(frames, errors):
    for index, frame in enumerate(frames):
        change = frame["structure"].get("change")
        if not change:
            continue
        current = next((n for n in frame["structure"]["nodes"] if n["id"] == change["nodeId"]), None)
        if current is None:
            fail(errors, f"frame {index}: change node missing")
            continue
        actual_field = current["prevId"] if change["field"] == "prev" else current["nextId"]
        if actual_field != change["afterId"]:
            fail(errors, f"frame {index}: afterId does not match snapshot")
        if index == 0:
            fail(errors, f"frame {index}: change has no predecessor frame")
            continue
        previous = next((n for n in frames[index - 1]["structure"]["nodes"] if n["id"] == change["nodeId"]), None)
        if previous is None:
            fail(errors, f"frame {index}: change node absent from previous frame")
            continue
        before_field = previous["prevId"] if change["field"] == "prev" else previous["nextId"]
        if before_field != change["beforeId"]:
            fail(errors, f"frame {index}: beforeId does not match previous frame")


def compare_terminal(algorithm, frames, expected, errors, label):
    complete = [frame for frame in frames if frame["structure"]["phase"] == "complete"]
    if not complete:
        fail(errors, f"{label}: no complete frame")
        return
    snap = complete[-1]["structure"]
    e = expected
    if snap["headId"] != e["headId"] or snap["tailId"] != e["tailId"]:
        fail(errors, f"{label}: head/tail mismatch {snap['headId']}/{snap['tailId']} != {e['headId']}/{e['tailId']}")
    frame_nodes = {node["id"]: node for node in snap["nodes"]}
    if set(frame_nodes) != set(e["nodes"]):
        fail(errors, f"{label}: node id set mismatch")
    for node_id, expected_node in e["nodes"].items():
        actual = frame_nodes.get(node_id)
        if actual is None:
            continue
        if actual["value"] != expected_node["value"]:
            fail(errors, f"{label}: {node_id} value mismatch")
        if actual["nextId"] != expected_node["nextId"]:
            fail(errors, f"{label}: {node_id} nextId mismatch")
        if algorithm == "doubly" and actual["prevId"] != expected_node["prevId"]:
            fail(errors, f"{label}: {node_id} prevId mismatch")
    if snap["headId"] is not None:
        ordered = []
        node = snap["headId"]
        guard = 0
        while node is not None and guard <= len(frame_nodes):
            current = frame_nodes[node]
            ordered.append(current["id"])
            node = current["nextId"]
            if algorithm == "circular" and node == snap["headId"]:
                break
            guard += 1
        expected_chain = [item[0] for item in e["chain"]]
        if ordered != expected_chain:
            fail(errors, f"{label}: chain order mismatch {ordered} != {expected_chain}")


def main():
    errors = []
    for algorithm in ("doubly", "circular"):
        cases = {"official": OFFICIAL[algorithm], **EDGE[algorithm]}
        for label, operations in cases.items():
            frames = run(algorithm, operations)
            expected, traversals = replay(algorithm, operations)
            for frame in frames:
                frame_invariants(frame, algorithm, errors)
            change_continuity(frames, errors)
            compare_terminal(algorithm, frames, expected, errors, f"{algorithm}/{label}")
            if label == "official" and algorithm == "doubly":
                forward = [f["variables"]["current"] for f in frames if f["lessonStepId"] == "traverse-forward"]
                reverse = [f["variables"]["current"] for f in frames if f["lessonStepId"] == "traverse-reverse"]
                forward_ref = next((values for kind, values in traversals if kind == "forward"), [])
                reverse_ref = next((values for kind, values in traversals if kind == "reverse"), [])
                if forward != list(reversed(reverse)):
                    fail(errors, f"doubly forward/reverse mismatch {forward} != {reverse}")
                if forward != forward_ref or reverse != reverse_ref:
                    fail(errors, "doubly traversal does not match the reference at that point")
            if label == "official" and algorithm == "circular":
                walk = [f for f in frames if f["lessonStepId"] == "traverse-circle"]
                if walk:
                    if len(walk) != walk[0]["variables"]["length"]:
                        fail(errors, "circular traversal is not exactly one lap")
                else:
                    fail(errors, "circular traversal produced no frames")
                circle_values = [f["variables"]["current"] for f in walk]
                circle_ref = next((values for kind, values in traversals if kind == "circle"), [])
                if circle_values != circle_ref:
                    fail(errors, "circular traversal values do not match the reference ring")
            # Empty / single-node boundary and missing search are observable in real frames.
            if label in ("empty", "delete_last", "delete_all"):
                if not any(f["structure"]["phase"] == "complete" and f["structure"]["headId"] is None for f in frames):
                    fail(errors, f"{algorithm}/{label}: no empty completed frame")
            if label == "single_self_loop":
                singles = [
                    f for f in frames
                    if f["structure"]["phase"] == "complete" and f["structure"]["headId"] is not None
                    and len(f["structure"]["nodes"]) == 1
                ]
                if not singles:
                    fail(errors, "no single-node complete frame")
                else:
                    snap = singles[0]["structure"]
                    node = snap["nodes"][0]
                    if snap["headId"] != snap["tailId"] or node["nextId"] != node["id"]:
                        fail(errors, "single-node self-loop is not closed")
            if label in ("single_forward_reverse", "single_self_loop", "missing", "missing_insert"):
                if not any(f["structure"]["operation"] == "not-found" for f in frames):
                    fail(errors, f"{algorithm}/{label}: missing search did not terminate with not-found")
            if not frames:
                fail(errors, f"{algorithm}/{label}: produced no frames")
            print(f"{algorithm}/{label}: {len(frames)} frames")

    if errors:
        for error in errors[:30]:
            print(f"ERROR: {error}")
        print(f"FAIL: {len(errors)} errors")
        return 1
    print("ALL L1A INDEPENDENT CHECKS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())

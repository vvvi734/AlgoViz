"""Independent CPython verification for F2 separate chaining and linear probing.

The real teaching Python is extracted from `hashExamples.ts` and executed with a
local `trace()` collector. A separately written reference model, which never
imports the app schema or the shipped classes, replays the same operations and
compares:

- every command's terminal result and exact probe/chain events;
- every bucket chain, node next reference, tri-state slot and element count;
- the final key set and load factor;
- duplicate policy, tombstones, wraparound, full-table failure and negative keys.

This is an operation-level audit, not a screenshot comparison.
"""
from __future__ import annotations

import ast
import copy
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/hashExamples.ts").read_text(encoding="utf-8")

SOURCES = {}
for name in ("CHAINING_PYTHON", "PROBING_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {
    "hash-chain": SOURCES["CHAINING_PYTHON"],
    "hash-probe": SOURCES["PROBING_PYTHON"],
}


def ts_input(name: str):
    marker = f"export const {name}: unknown = "
    raw = TS.split(marker, 1)[1].split(";", 1)[0].strip()
    # The TS literal uses unquoted top-level keys; quote them without touching
    # the string operation names inside the operations array.
    raw = re.sub(r"(?m)^(\s*)(tableSize|operations)\s*:", r'\1"\2":', raw)
    return ast.literal_eval(raw)


OFFICIAL = {
    "hash-chain": ts_input("HASH_CHAIN_INPUT"),
    "hash-probe": ts_input("HASH_PROBE_INPUT"),
}

# Mirrors the exported fixtures' edge inputs but stays an independent operation
# list used only by this verifier.
EDGE = {
    "hash-chain": {
        "empty": {"tableSize": 7, "operations": []},
        "single": {"tableSize": 7, "operations": [["insert", 5], ["find", 5], ["delete", 5], ["find", 5]]},
        "negative": {"tableSize": 7, "operations": [["insert", -1], ["insert", -8], ["insert", -15], ["find", -8], ["delete", -1], ["find", -15]]},
        "delete_orders": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["insert", 22], ["delete", 1], ["delete", 15], ["delete", 8], ["delete", 22]]},
        "duplicate": {"tableSize": 7, "operations": [["insert", 5], ["insert", 5], ["find", 5], ["delete", 5], ["delete", 5]]},
        "table2": {"tableSize": 2, "operations": [["insert", 1], ["insert", 3], ["find", 5], ["delete", 3], ["find", 1]]},
        "long_chain": {"tableSize": 2, "operations": [["insert", 1], ["insert", 3], ["insert", 5], ["insert", 7], ["find", 7], ["delete", 5], ["find", 3]]},
        "missing": {"tableSize": 7, "operations": [["delete", 99], ["find", 99]]},
    },
    "hash-probe": {
        "empty": {"tableSize": 7, "operations": []},
        "single": {"tableSize": 7, "operations": [["insert", 5], ["find", 5], ["delete", 5], ["find", 5]]},
        "negative": {"tableSize": 7, "operations": [["insert", -1], ["insert", -8], ["insert", -15], ["find", -8], ["delete", -1], ["find", -15]]},
        "tombstone": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["delete", 8], ["find", 15], ["insert", 22], ["delete", 22], ["find", 15]]},
        "table2_full": {"tableSize": 2, "operations": [["insert", 0], ["insert", 2], ["insert", 4], ["delete", 0], ["insert", 4], ["find", 2], ["delete", 2], ["find", 4]]},
        "wrap": {"tableSize": 3, "operations": [["insert", 1], ["insert", 4], ["insert", 7], ["insert", 10], ["find", 7], ["delete", 4], ["find", 7], ["insert", 10], ["find", 1]]},
        "duplicate": {"tableSize": 7, "operations": [["insert", 5], ["insert", 5], ["find", 5], ["delete", 5], ["delete", 5]]},
        "tombstone_chain": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["delete", 1], ["delete", 8], ["delete", 15], ["find", 15], ["insert", 22], ["find", 22]]},
        "table17": {"tableSize": 17, "operations": [["insert", 1], ["insert", 18], ["insert", 35], ["insert", 52], ["insert", 69], ["find", 69], ["delete", 35], ["find", 52], ["insert", 86]]},
    },
}


def normalize_operations(payload):
    table_size = payload.get("tableSize", 7)
    m = max(2, min(17, table_size))
    result = []
    for entry in payload.get("operations", []):
        if not isinstance(entry, (list, tuple)) or len(entry) < 2:
            continue
        op, key = entry[0], entry[1]
        if op not in ("insert", "find", "delete"):
            continue
        if not isinstance(key, int) or isinstance(key, bool):
            continue
        result.append((op, key))
    return m, result


def run(algorithm, payload):
    frames = []

    def trace(state, message="", variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    env = {"input": copy.deepcopy(payload), "trace": trace, "__name__": "hash_verify"}
    exec(compile(ALGORITHMS[algorithm], f"<f2-{algorithm}>", "exec"), env)
    return frames


# ---------------------------------------------------------------------------
# Independent reference implementations. No app classes or schema are used.
# ---------------------------------------------------------------------------

def chain_snapshot(buckets):
    nodes = []
    bucket_views = []
    for index, head in enumerate(buckets):
        bucket_views.append({"index": index, "headId": None if head is None else head["id"]})
        node = head
        while node is not None:
            nodes.append({
                "id": node["id"],
                "key": node["key"],
                "bucket": index,
                "nextId": None if node["next"] is None else node["next"]["id"],
            })
            node = node["next"]
    return nodes, bucket_views


def ref_chaining(payload):
    m, operations = normalize_operations(payload)
    buckets = [None] * m
    count = 0
    sequence = 0
    outcomes = []

    for op, key in operations:
        bucket_index = key % m
        events = []
        occupied = buckets[bucket_index] is not None

        node = buckets[bucket_index]
        previous = None
        while node is not None:
            same = node["key"] == key
            events.append({
                "operation": "chain-compare",
                "key": key,
                "bucketIndex": bucket_index,
                "currentNodeId": node["id"],
                "previousNodeId": None if previous is None else previous["id"],
                "comparison": "equal" if same else "different",
                "conflict": True,
                "result": None,
                "found": None,
                "removed": None,
            })
            if same:
                break
            previous = node
            node = node["next"]

        if op == "insert":
            if node is not None:
                events.append({
                    "operation": "duplicate", "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": node["id"],
                    "previousNodeId": None if previous is None else previous["id"],
                    "comparison": "equal", "conflict": True,
                    "result": "duplicate", "found": None, "removed": None,
                })
            else:
                sequence += 1
                new_node = {"id": f"n{sequence}", "key": key, "next": buckets[bucket_index]}
                buckets[bucket_index] = new_node
                count += 1
                events.append({
                    "operation": "insert", "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": new_node["id"], "previousNodeId": None,
                    "comparison": None, "conflict": occupied,
                    "result": "inserted", "found": None, "removed": None,
                })
        elif op == "find":
            if node is not None:
                events.append({
                    "operation": "found", "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": node["id"],
                    "previousNodeId": None if previous is None else previous["id"],
                    "comparison": "equal", "conflict": occupied,
                    "result": "found", "found": True, "removed": None,
                })
            else:
                events.append({
                    "operation": "not-found", "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": None, "previousNodeId": None,
                    "comparison": None, "conflict": occupied,
                    "result": "not-found", "found": False, "removed": None,
                })
        else:
            if node is not None:
                next_node = node["next"]
                if previous is None:
                    buckets[bucket_index] = next_node
                    position = "head"
                    operation_name = "delete-head"
                elif next_node is None:
                    previous["next"] = None
                    position = "tail"
                    operation_name = "delete-tail"
                else:
                    previous["next"] = next_node
                    position = "middle"
                    operation_name = "delete-middle"
                removed = {
                    "kind": "node", "id": node["id"], "key": node["key"],
                    "nextId": None if next_node is None else next_node["id"],
                    "position": position,
                }
                count -= 1
                events.append({
                    "operation": operation_name, "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": None,
                    "previousNodeId": None if previous is None else previous["id"],
                    "comparison": "equal", "conflict": True,
                    "result": "deleted", "found": None, "removed": removed,
                })
            else:
                events.append({
                    "operation": "delete-missing", "key": key, "bucketIndex": bucket_index,
                    "currentNodeId": None, "previousNodeId": None,
                    "comparison": None, "conflict": occupied,
                    "result": "missing", "found": False, "removed": None,
                })

        nodes, bucket_views = chain_snapshot(buckets)
        values = [node["key"] for node in nodes]
        outcomes.append({
            "events": events,
            "nodes": nodes,
            "buckets": bucket_views,
            "values": values,
            "count": count,
            "loadFactor": count / m,
        })

    nodes, bucket_views = chain_snapshot(buckets)
    return {
        "outcomes": outcomes,
        "final": {
            "nodes": nodes, "buckets": bucket_views,
            "values": [node["key"] for node in nodes],
            "count": count, "loadFactor": count / m,
        },
    }


TOMBSTONE = object()


def probing_snapshot(slots):
    views = []
    values = []
    count = 0
    for index, slot in enumerate(slots):
        if slot is None:
            views.append({"index": index, "state": "empty", "key": None, "id": None})
            values.append(None)
        elif slot is TOMBSTONE:
            views.append({"index": index, "state": "deleted", "key": None, "id": None})
            values.append(None)
        else:
            views.append({"index": index, "state": "occupied", "key": slot["key"], "id": slot["id"]})
            values.append(slot["key"])
            count += 1
    return views, values, count


def ref_probing(payload):
    m, operations = normalize_operations(payload)
    slots = [None] * m
    sequence = 0
    outcomes = []

    for op, key in operations:
        start = key % m
        path = [start]
        first_deleted = None
        events = []
        result = None
        target_index = None
        hit_entry = None

        for step in range(m):
            index = path[-1]
            slot = slots[index]
            if slot is None:
                events.append({
                    "operation": "probe-check", "key": key, "probePath": list(path),
                    "currentIndex": index, "comparison": None, "conflict": False,
                    "result": None, "found": None, "removed": None,
                    "reusedDeleted": False, "reason": None,
                    "slotState": "empty", "slotKey": None, "slotId": None,
                })
                result = {"kind": "empty", "index": index, "first_deleted": first_deleted}
                break
            if slot is TOMBSTONE:
                if first_deleted is None:
                    first_deleted = index
                events.append({
                    "operation": "probe-check", "key": key, "probePath": list(path),
                    "currentIndex": index, "comparison": None, "conflict": False,
                    "result": None, "found": None, "removed": None,
                    "reusedDeleted": False, "reason": None,
                    "slotState": "deleted", "slotKey": None, "slotId": None,
                })
            else:
                same = slot["key"] == key
                events.append({
                    "operation": "probe-check", "key": key, "probePath": list(path),
                    "currentIndex": index,
                    "comparison": "equal" if same else "different",
                    "conflict": not same, "result": None, "found": None,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": "occupied", "slotKey": slot["key"], "slotId": slot["id"],
                })
                if same:
                    hit_entry = slot
                    result = {"kind": "hit", "index": index, "first_deleted": first_deleted}
                    break

            if step + 1 < m:
                next_index = (start + step + 1) % m
                path.append(next_index)
                events.append({
                    "operation": "probe-next", "key": key, "probePath": list(path),
                    "currentIndex": next_index, "comparison": None,
                    "conflict": slot is not TOMBSTONE, "result": None, "found": None,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })

        if result is None:
            result = {"kind": "full", "index": None, "first_deleted": first_deleted}

        if op == "insert":
            if result["kind"] == "hit":
                events.append({
                    "operation": "duplicate", "key": key, "probePath": list(path),
                    "currentIndex": result["index"], "comparison": "equal",
                    "conflict": True, "result": "duplicate", "found": None,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })
            elif result["kind"] == "full" and result["first_deleted"] is None:
                events.append({
                    "operation": "table-full", "key": key, "probePath": list(path),
                    "currentIndex": path[-1], "comparison": None, "conflict": True,
                    "result": "full", "found": None, "removed": None,
                    "reusedDeleted": False, "reason": "full",
                    "slotState": None, "slotKey": None, "slotId": None,
                })
            else:
                reuse = result["first_deleted"]
                target_index = reuse if reuse is not None else result["index"]
                if target_index is None:
                    target_index = path[-1]
                sequence += 1
                entry = {"id": f"e{sequence}", "key": key}
                slots[target_index] = entry
                events.append({
                    "operation": "insert", "key": key, "probePath": list(path),
                    "currentIndex": target_index, "comparison": None,
                    "conflict": len(path) > 1, "result": "inserted", "found": None,
                    "removed": None, "reusedDeleted": reuse is not None, "reason": None,
                    "slotState": "occupied", "slotKey": key, "slotId": entry["id"],
                })
        elif op == "find":
            if result["kind"] == "hit":
                events.append({
                    "operation": "found", "key": key, "probePath": list(path),
                    "currentIndex": result["index"], "comparison": "equal",
                    "conflict": len(path) > 1, "result": "found", "found": True,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })
            else:
                events.append({
                    "operation": "not-found", "key": key, "probePath": list(path),
                    "currentIndex": path[-1], "comparison": None,
                    "conflict": len(path) > 1, "result": "not-found", "found": False,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })
        else:
            if result["kind"] == "hit":
                removed = {"kind": "slot", "index": result["index"], "key": hit_entry["key"], "id": hit_entry["id"]}
                slots[result["index"]] = TOMBSTONE
                events.append({
                    "operation": "delete", "key": key, "probePath": list(path),
                    "currentIndex": result["index"], "comparison": "equal",
                    "conflict": len(path) > 1, "result": "deleted", "found": None,
                    "removed": removed, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })
            else:
                events.append({
                    "operation": "delete-missing", "key": key, "probePath": list(path),
                    "currentIndex": path[-1], "comparison": None,
                    "conflict": len(path) > 1, "result": "missing", "found": False,
                    "removed": None, "reusedDeleted": False, "reason": None,
                    "slotState": None, "slotKey": None, "slotId": None,
                })

        slot_views, values, count = probing_snapshot(slots)
        outcomes.append({
            "events": events,
            "slots": slot_views,
            "values": values,
            "count": count,
            "loadFactor": count / m,
        })

    slot_views, values, count = probing_snapshot(slots)
    return {
        "outcomes": outcomes,
        "final": {
            "slots": slot_views, "values": values,
            "count": count, "loadFactor": count / m,
        },
    }


REFERENCES = {"hash-chain": ref_chaining, "hash-probe": ref_probing}


# ---------------------------------------------------------------------------
# Frame validation.
# ---------------------------------------------------------------------------

def command_groups(frames):
    groups = []
    for frame in frames:
        structure = frame["structure"]
        if structure["operation"] == "hash":
            groups.append({"frames": [frame]})
        elif groups:
            groups[-1]["frames"].append(frame)
    for group in groups:
        group["frames"] = [frame for frame in group["frames"] if frame["structure"]["operation"] != "done"]
    return groups


EVENT_FIELDS_COMMON = (
    "operation", "key", "bucketIndex", "currentNodeId", "previousNodeId",
    "comparison", "conflict", "result", "found", "removed",
)


def validate_static(frame, algorithm, seen_ids, errors):
    structure = frame["structure"]
    state = frame["state"]
    m = structure["tableSize"]
    if structure["kind"] != "hash":
        errors.append("structure kind is not hash")
        return
    expected_algorithm = "chaining" if algorithm == "hash-chain" else "probing"
    if structure["algorithm"] != expected_algorithm:
        errors.append(f"algorithm {structure['algorithm']!r} != {expected_algorithm!r}")
    if state.get("type") != "array":
        errors.append("state is not an array")
    if abs(structure["loadFactor"] - structure["elementCount"] / m) > 1e-9:
        errors.append("loadFactor does not equal elementCount / tableSize")
    if structure["key"] is not None:
        expected_hash = structure["key"] % m
        if structure["hashIndex"] != expected_hash:
            errors.append(f"hashIndex {structure['hashIndex']!r} != {expected_hash}")

    if algorithm == "hash-chain":
        if structure["buckets"] and len(structure["buckets"]) != m:
            errors.append("bucket count mismatch")
        if len(structure["slots"]) or structure["probePath"] or structure["currentIndex"] is not None:
            errors.append("chaining leaked probing fields")
        node_by_id = {node["id"]: node for node in structure["nodes"]}
        if len(node_by_id) != len(structure["nodes"]):
            errors.append("duplicate node id")
        reached = set()
        for bucket in structure["buckets"]:
            local = set()
            node = node_by_id.get(bucket["headId"]) if bucket["headId"] is not None else None
            while node is not None:
                if node["id"] in local:
                    errors.append("bucket chain cycle")
                    break
                local.add(node["id"])
                reached.add(node["id"])
                if node["bucket"] != bucket["index"]:
                    errors.append("node is in the wrong bucket")
                if node["nextId"] is not None:
                    next_node = node_by_id.get(node["nextId"])
                    if next_node is None:
                        errors.append("nextId is not a real node")
                        break
                    if next_node["bucket"] != node["bucket"]:
                        errors.append("next node crosses buckets")
                node = node_by_id.get(node["nextId"]) if node["nextId"] is not None else None
        if len(reached) != len(structure["nodes"]):
            errors.append("not every node is reachable from a bucket")
        if structure["elementCount"] != len(structure["nodes"]):
            errors.append("elementCount != node count")
        values = [node["key"] for node in structure["nodes"]]
        if state.get("values") != values:
            errors.append("state.values disagrees with bucket-order node keys")
        for node in structure["nodes"]:
            previous_key = seen_ids.setdefault(node["id"], node["key"])
            if previous_key != node["key"]:
                errors.append(f"node id {node['id']} changed key")
    else:
        if len(structure["buckets"]) or len(structure["nodes"]):
            errors.append("probing leaked chain fields")
        if len(structure["slots"]) != m:
            errors.append("slot count mismatch")
        occupied = [slot for slot in structure["slots"] if slot["state"] == "occupied"]
        if len(occupied) != structure["elementCount"]:
            errors.append("elementCount != occupied slots")
        if len({slot["id"] for slot in occupied}) != len(occupied):
            errors.append("occupied slot ids are not unique")
        if len({slot["key"] for slot in occupied}) != len(occupied):
            errors.append("occupied keys are not unique")
        if state.get("values") != [slot["key"] if slot["state"] == "occupied" else None for slot in structure["slots"]]:
            errors.append("state.values disagrees with tri-state slots")
        path = structure["probePath"]
        if path:
            if structure["hashIndex"] is None or path[0] != structure["hashIndex"]:
                errors.append("probe path does not start at hashIndex")
            for index in range(1, len(path)):
                if path[index] != (path[index - 1] + 1) % m:
                    errors.append("probe path does not advance by one with wraparound")
            if len(set(path)) != len(path):
                errors.append("probe path repeats a slot")
        if structure["currentIndex"] is not None and structure["currentIndex"] not in path:
            errors.append("currentIndex is off the probe path")
        if structure["operation"] == "table-full":
            if len(path) != m or structure["elementCount"] != m:
                errors.append("table-full must probe all m slots and have m entries")
        for slot in occupied:
            previous_key = seen_ids.setdefault(slot["id"], slot["key"])
            if previous_key != slot["key"]:
                errors.append(f"slot id {slot['id']} changed key")


def compare_terminal(frame, expected, algorithm, errors):
    structure = frame["structure"]
    if structure["elementCount"] != expected["count"]:
        errors.append("terminal elementCount mismatch")
    if abs(structure["loadFactor"] - expected["loadFactor"]) > 1e-9:
        errors.append("terminal loadFactor mismatch")
    if frame["state"].get("values") != expected["values"]:
        errors.append("terminal state.values mismatch")
    if algorithm == "hash-chain":
        if structure["buckets"] != expected["buckets"]:
            errors.append("terminal bucket heads mismatch")
        if structure["nodes"] != expected["nodes"]:
            errors.append("terminal node links mismatch")
    else:
        if structure["slots"] != expected["slots"]:
            errors.append("terminal tri-state slots mismatch")


def validate(algorithm, payload, frames):
    errors = []
    reference = REFERENCES[algorithm](payload)
    operations = normalize_operations(payload)[1]

    seen_ids = {}
    for index, frame in enumerate(frames):
        try:
            validate_static(frame, algorithm, seen_ids, errors)
        except Exception as exc:  # malformed frames must fail loudly, not skip
            errors.append(f"frame {index}: static validation crashed: {exc}")
            break

    groups = command_groups(frames)
    if len(groups) != len(operations):
        return errors + [f"command groups {len(groups)} != operations {len(operations)}"]

    for command_index, (group, expected) in enumerate(zip(groups, reference["outcomes"])):
        actual_events = [frame["structure"] for frame in group["frames"]]
        actual_events = [event for event in actual_events if event["operation"] not in ("hash", "bucket")]
        expected_events = expected["events"]
        if len(actual_events) != len(expected_events):
            errors.append(
                f"command {command_index}: event count {len(actual_events)} != reference {len(expected_events)}"
            )
            continue
        for event_index, (actual, want) in enumerate(zip(actual_events, expected_events)):
            for field in EVENT_FIELDS_COMMON:
                if actual.get(field) != want.get(field):
                    errors.append(
                        f"command {command_index} event {event_index}: {field} "
                        f"{actual.get(field)!r} != {want.get(field)!r}"
                    )
            if algorithm == "hash-probe":
                for field in ("probePath", "currentIndex", "reusedDeleted", "reason"):
                    if actual.get(field) != want.get(field):
                        errors.append(
                            f"command {command_index} event {event_index}: {field} "
                            f"{actual.get(field)!r} != {want.get(field)!r}"
                        )
                if want["operation"] == "probe-check":
                    index = actual["currentIndex"]
                    slot = actual["slots"][index]
                    if slot["state"] != want["slotState"] or slot["key"] != want["slotKey"] or slot["id"] != want["slotId"]:
                        errors.append(
                            f"command {command_index} event {event_index}: probed slot "
                            f"{slot!r} != {want['slotState']}/{want['slotKey']}/{want['slotId']}"
                        )
            if algorithm == "hash-chain" and actual["operation"] == "insert":
                head = actual["buckets"][actual["bucketIndex"]]["headId"]
                if head != actual["currentNodeId"]:
                    errors.append(f"command {command_index}: inserted node is not the bucket head")

        terminal = group["frames"][-1]
        if terminal["structure"]["key"] != operations[command_index][1]:
            errors.append(f"command {command_index}: terminal key mismatch")
        if terminal["structure"]["result"] != expected_events[-1]["result"]:
            errors.append(f"command {command_index}: terminal result mismatch")
        compare_terminal(terminal, expected, algorithm, errors)

    done = next((frame for frame in frames if frame["structure"]["operation"] == "done"), None)
    if done is None:
        errors.append("missing done frame")
    else:
        compare_terminal(done, reference["final"], algorithm, errors)
        if done["structure"]["key"] is not None:
            errors.append("done frame carries a key")
        if done["structure"]["result"] is not None:
            errors.append("done frame carries a terminal result")

    # The final key set is independently recomputed from the operation stream.
    final_keys = [key for key in reference["final"]["values"] if key is not None]
    if algorithm == "hash-chain":
        actual_final_keys = [node["key"] for node in reference["final"]["nodes"]]
    else:
        actual_final_keys = [slot["key"] for slot in reference["final"]["slots"] if slot["state"] == "occupied"]
    if sorted(actual_final_keys) != sorted(final_keys):
        errors.append("final key set disagrees with independent operation replay")
    if len(final_keys) != reference["final"]["count"]:
        errors.append("reference final key set disagrees with its own count")
    return errors


def main():
    total = 0
    cases = 0
    for algorithm in ("hash-chain", "hash-probe"):
        print(f"[{algorithm}]")
        inputs = [("official", OFFICIAL[algorithm]), *EDGE[algorithm].items()]
        for name, payload in inputs:
            frames = run(algorithm, payload)
            errors = validate(algorithm, payload, frames)
            total += len(frames)
            cases += 1
            if len(frames) > 700:
                raise SystemExit(f"{algorithm}/{name}: frame budget exceeded")
            if errors:
                print(f"  FAIL {name}: {len(errors)} errors")
                for error in errors[:10]:
                    print(f"    - {error}")
                raise SystemExit(1)
            print(f"  ok {name}: {len(frames)} frames")
    print(f"verified {total} frames across {cases} independent hash inputs")
    print("checked: bucket ownership, acyclic next links, deletion relinking, tri-state slots,")
    print("         probe sequence and wraparound, tombstone continuation, reuse, full table,")
    print("         duplicate policy, negative keys, load factor and final key sets")


if __name__ == "__main__":
    main()

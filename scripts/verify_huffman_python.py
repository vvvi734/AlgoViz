"""Independent CPython verification for the T4 Huffman source.

The real Python string is read from `huffmanExamples.ts` and executed with a
local `trace()` collector. This script deliberately does not import the TypeScript
schema: it validates the frames from first principles and compares the final WPL
with a separately implemented Huffman merge that only accumulates merged weights.
"""
from __future__ import annotations

import copy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/huffmanExamples.ts").read_text(encoding="utf-8")
BODY = TS.split("export const HUFFMAN_PYTHON = `", 1)[1].split("`;", 1)[0]
assert "${" not in BODY, "unexpanded template expression"
SOURCE = BODY

OFFICIAL = {
    "preset": "official",
    "symbols": [["A", 5], ["B", 9], ["C", 12], ["D", 13], ["E", 16], ["F", 45]],
}
EQUAL = {"preset": "equal", "symbols": [["A", 4], ["B", 4], ["C", 4], ["D", 4]]}
SINGLE = {"preset": "single", "symbols": [["Z", 7]]}
EMPTY = {"preset": "empty", "symbols": []}
DUPLICATE = {"preset": "duplicate", "symbols": [["A", 5], ["A", 3], ["B", 7], ["C", 9]]}
DEFAULT = {"official": OFFICIAL}
EDGE = {"equal": EQUAL, "single": SINGLE, "empty": EMPTY, "duplicate": DUPLICATE}


def run(payload: dict) -> list[dict]:
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

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(SOURCE, "<t4>", "exec"), ns)
    return frames


def aggregate(payload: dict) -> list[tuple[str, int]]:
    items = []
    seen = {}
    for raw in payload.get("symbols", []):
        if not isinstance(raw, (list, tuple)) or len(raw) != 2:
            continue
        symbol, weight = raw
        if not isinstance(symbol, str) or not symbol.strip():
            continue
        weight = int(weight)
        if weight <= 0:
            continue
        if symbol in seen:
            index = seen[symbol]
            items[index] = (symbol, items[index][1] + weight)
        else:
            seen[symbol] = len(items)
            items.append((symbol, weight))
    return items[:16]


def reference_wpl(payload: dict) -> int:
    """Independent Huffman reference: WPL equals the sum of every merged weight."""
    forest = [(weight, index) for index, (_, weight) in enumerate(aggregate(payload))]
    merged_total = 0
    next_index = len(forest)
    while len(forest) > 1:
        forest.sort(key=lambda item: (item[0], item[1]))
        first = forest.pop(0)
        second = forest.pop(0)
        merged = first[0] + second[0]
        merged_total += merged
        forest.append((merged, next_index))
        next_index += 1
    return merged_total


def roots(snapshot: dict) -> list[dict]:
    child_ids = set()
    for node in snapshot["nodes"]:
        if node["leftId"] is not None:
            child_ids.add(node["leftId"])
        if node["rightId"] is not None:
            child_ids.add(node["rightId"])
    return [node for node in snapshot["nodes"] if node["id"] not in child_ids]


def tree_metrics(snapshot: dict) -> tuple[int, int, int, int, int]:
    nodes = {node["id"]: node for node in snapshot["nodes"]}
    root_list = roots(snapshot)
    if not root_list:
        return 0, 0, 0, 0, 0
    assert len(root_list) == 1, "final/encoding snapshot must have one root"
    root = root_list[0]
    leaves = []
    depths = {}

    def walk(node_id: str, depth: int, visiting: set[str]):
        assert node_id not in visiting, "cycle"
        visiting.add(node_id)
        node = nodes[node_id]
        if node["leftId"] is None:
            leaves.append(node)
            depths[node_id] = depth
        else:
            walk(node["leftId"], depth + 1, visiting)
            walk(node["rightId"], depth + 1, visiting)
        visiting.remove(node_id)

    walk(root["id"], 0, set())
    total_weight = sum(leaf["weight"] for leaf in leaves)
    wpl = sum(leaf["weight"] * depths[leaf["id"]] for leaf in leaves)
    single = len(leaves) == 1
    total_bits = total_weight if single else wpl
    fixed_per = 0 if not leaves else (1 if single else (len(leaves) - 1).bit_length())
    return len(leaves), total_weight, wpl, total_bits, fixed_per


def check_frames(name: str, frames: list[dict], payload: dict) -> None:
    assert frames, f"{name}: no frames"
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    final = frames[-1]["structure"]
    items = aggregate(payload)
    expected_wpl = reference_wpl(payload)
    expected_leaf_count = len(items)
    seen_ids = set()
    seen_orders = set()
    final_metrics = None

    for index, frame in enumerate(frames):
        snapshot = frame["structure"]
        assert snapshot and snapshot["kind"] == "huffman", f"{name}#{index}: wrong structure"
        assert frame["lessonStepId"] == snapshot["operation"], f"{name}#{index}: lesson step mismatch"
        assert frame["message"], f"{name}#{index}: empty message"
        nodes = snapshot["nodes"]
        by_id = {node["id"]: node for node in nodes}
        assert len(by_id) == len(nodes), f"{name}#{index}: duplicate node id"
        orders = sorted(node["order"] for node in nodes)
        assert orders == list(range(len(nodes))), f"{name}#{index}: non-contiguous orders"
        for node in nodes:
            assert node["id"] not in seen_ids or snapshot["operation"] != "init", "id reuse"
            seen_ids.add(node["id"])
            if node["order"] in seen_orders and node["order"] >= len(items):
                pass
            seen_orders.add(node["order"])
            has_left = node["leftId"] is not None
            has_right = node["rightId"] is not None
            assert has_left == has_right, f"{name}#{index}: one-child node"
            if has_left:
                assert node["symbol"] is None
                left = by_id[node["leftId"]]
                right = by_id[node["rightId"]]
                assert left["weight"] + right["weight"] == node["weight"], f"{name}#{index}: bad parent weight"
            else:
                assert node["symbol"] is not None

        root_list = roots(snapshot)
        root_ids = {node["id"] for node in root_list}
        queue = snapshot["queueIds"]
        assert len(queue) == len(set(queue)), f"{name}#{index}: duplicate queue id"
        assert set(queue) <= set(by_id), f"{name}#{index}: queue missing node"
        for qid in queue:
            assert qid in root_ids, f"{name}#{index}: queue node has a parent"

        # The real heapq array must be a valid min-heap under (weight, order).
        for slot in range(1, len(queue)):
            parent = by_id[queue[(slot - 1) // 2]]
            child = by_id[queue[slot]]
            assert (parent["weight"], parent["order"]) <= (child["weight"], child["order"]), (
                f"{name}#{index}: queue is not a min-heap"
            )

        operation = snapshot["operation"]
        if operation == "init":
            expected_queue = root_ids
        elif operation == "merge-select":
            expected_queue = root_ids - set(snapshot["pickedIds"])
        elif operation == "merge-create":
            expected_queue = root_ids - {snapshot["createdId"]}
        elif operation == "merge-requeue":
            expected_queue = root_ids
        elif operation == "done" and not root_list:
            expected_queue = set()
        else:
            expected_queue = root_ids
        assert set(queue) == expected_queue, f"{name}#{index}: queue/forest mismatch"

        picked = snapshot["pickedIds"]
        created = snapshot["createdId"]
        if operation == "merge-select":
            sorted_roots = sorted(root_list, key=lambda node: (node["weight"], node["order"]))
            assert picked == [sorted_roots[0]["id"], sorted_roots[1]["id"]], (
                f"{name}#{index}: did not pop the two minimum roots"
            )
        if operation == "merge-create":
            parent = by_id[created]
            assert parent["leftId"] == picked[0] and parent["rightId"] == picked[1]
            assert parent["weight"] == by_id[picked[0]]["weight"] + by_id[picked[1]]["weight"]
            assert parent["order"] == max(node["order"] for node in nodes)

        if node_metrics := snapshot["metrics"]:
            leaf_count, total_weight, wpl, total_bits, fixed_per = tree_metrics(snapshot)
            assert node_metrics["leafCount"] == leaf_count, f"{name}#{index}: leafCount"
            assert node_metrics["totalWeight"] == total_weight, f"{name}#{index}: totalWeight"
            assert node_metrics["wpl"] == wpl, f"{name}#{index}: WPL from tree"
            assert node_metrics["totalBits"] == total_bits, f"{name}#{index}: totalBits"
            assert node_metrics["fixedBitsPerChar"] == fixed_per, f"{name}#{index}: fixed bits"
            assert node_metrics["fixedBits"] == total_weight * fixed_per, f"{name}#{index}: fixed total"
            if operation in {"build-done", "done"}:
                final_metrics = node_metrics

        if operation in {"encode-start", "encode-left", "encode-right", "encode-leaf"}:
            path = snapshot["pathIds"]
            assert path and path[0] == root_list[0]["id"], f"{name}#{index}: bad path start"
            for step in range(1, len(path)):
                parent = by_id[path[step - 1]]
                assert path[step] in (parent["leftId"], parent["rightId"]), f"{name}#{index}: bad path edge"
            assert path[-1] == snapshot["activeNodeId"], f"{name}#{index}: path end"
            bits = ""
            for step in range(1, len(path)):
                parent = by_id[path[step - 1]]
                bits += "0" if parent["leftId"] == path[step] else "1"
            assert snapshot["prefix"] == ("" if len([n for n in nodes if n["leftId"] is None]) == 1 and operation == "encode-leaf" else bits), (
                f"{name}#{index}: prefix"
            )

        codes = snapshot["codes"]
        symbols = [row["symbol"] for row in codes]
        assert len(symbols) == len(set(symbols)), f"{name}#{index}: duplicate code symbol"
        for row in codes:
            leaf = by_id[row["nodeId"]]
            assert leaf["leftId"] is None and leaf["symbol"] == row["symbol"]
            assert row["length"] == len(row["code"])
            assert row["weight"] == leaf["weight"]
            assert row["contribution"] == leaf["weight"] * row["length"]
            if len(items) == 1:
                assert row["code"] == "0", f"{name}#{index}: single code must be 0"
            else:
                path_bits = ""
                current = leaf["id"]
                parent_map = {}
                for node in nodes:
                    if node["leftId"] is not None:
                        parent_map[node["leftId"]] = (node["id"], "0")
                        parent_map[node["rightId"]] = (node["id"], "1")
                while current in parent_map:
                    current, bit = parent_map[current]
                    path_bits = bit + path_bits
                assert row["code"] == path_bits, f"{name}#{index}: code does not follow tree"

        if codes:
            sorted_codes = sorted(codes, key=lambda row: len(row["code"]))
            for short_index, short in enumerate(sorted_codes):
                for long in sorted_codes[short_index + 1:]:
                    if len(long["code"]) > len(short["code"]):
                        assert not long["code"].startswith(short["code"]), (
                            f"{name}#{index}: code {short['symbol']} is a prefix of {long['symbol']}"
                        )

        if operation == "done":
            leaf_count, _tw, _wpl, _tb, _fp = tree_metrics(snapshot)
            if not nodes:
                assert snapshot["result"] == "empty"
                assert snapshot["metrics"] == {
                    "leafCount": 0, "totalWeight": 0, "wpl": 0,
                    "totalBits": 0, "fixedBitsPerChar": 0, "fixedBits": 0,
                }
                assert snapshot["codes"] == []
            else:
                assert snapshot["result"] == "encoded"
                assert len(codes) == leaf_count
                assert set(row["symbol"] for row in codes) == {symbol for symbol, _ in items}

    if not items:
        assert final["result"] == "empty" and final["metrics"]["wpl"] == 0
    else:
        assert final["result"] == "encoded"
        assert len([node for node in final["nodes"] if node["leftId"] is None]) == expected_leaf_count
        assert final_metrics is not None
        assert final_metrics["wpl"] == expected_wpl, (
            f"{name}: independent reference WPL {expected_wpl} != snapshot {final_metrics['wpl']}"
        )
        # Round-trip every symbol twice, then decode the concatenated bit string
        # with the produced code table. Prefix-freedom is checked above.
        table = {row["symbol"]: row["code"] for row in final["codes"]}
        message = [symbol for symbol, _ in items] * 2
        encoded = "".join(table[symbol] for symbol in message)
        decoded = []
        cursor = 0
        # Decode by trying every code; a prefix-free table makes this unambiguous.
        while cursor < len(encoded):
            matched = None
            for symbol, code in table.items():
                if encoded.startswith(code, cursor):
                    matched = (symbol, code)
                    break
            assert matched is not None, f"{name}: undecodable bits at {cursor}"
            decoded.append(matched[0])
            cursor += len(matched[1])
        assert decoded == message, f"{name}: round-trip failed"


def verify_all() -> dict[str, list[dict]]:
    result = {}
    for name, payload in {**DEFAULT, **EDGE}.items():
        frames = run(payload)
        check_frames(name, frames, payload)
        result[name] = frames
    return result


if __name__ == "__main__":
    all_frames = verify_all()
    for name, frames in all_frames.items():
        print(f"{name}: {len(frames)} frames, WPL={reference_wpl({**DEFAULT, **EDGE}[name])}")
    print(f"T4 Huffman verification passed: {sum(len(v) for v in all_frames.values())} frames")

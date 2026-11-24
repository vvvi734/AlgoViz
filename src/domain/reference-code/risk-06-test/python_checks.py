"""RISK-06 Python harness: dynamic tournament, ordered quicksort, optimal tree and indexed capacity."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "sources"


def load(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


tournament = load("risk_tournament", "tournament/tournament_sort.py")
quick = load("risk_quick", "quick/quick_sort.py")
optimal = load("risk_optimal", "optimal-merge/optimal_merge_tree.py")
indexed = load("risk_indexed", "file-index/indexed_file.py")


def check(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


values = [(index * 37) % 19 - 9 for index in range(64)]
ordered = tournament.tournament_sort(values)
check(len(ordered) == 64, "tournament count")
check([item["value"] for item in ordered] == sorted(values), "tournament order")

large = list(range(100000))
quick.quick_sort(large)
check(large == list(range(100000)), "quicksort ordered")

weights = list(range(1, 21))
cost, nodes, missing = optimal.build_optimal_merge_tree(weights, 3)
check(sum(node["weight"] for node in nodes if node["kind"] == "real") == sum(weights), "optimal real weight")
check(any(node["kind"] == "virtual" for node in nodes) or missing == 0, "optimal virtual count")
check(all(node["weight"] == 0 for node in nodes if node["kind"] == "virtual"), "virtual zero")

records = [indexed.Record(key, label) for key, label in [
    (107, "G"), (101, "A"), (105, "E"), (103, "C"),
    (102, "B"), (108, "H"), (104, "D"), (106, "F")]]
records.sort(key=lambda record: record.key)
blocks = indexed.build_blocks(records, 4)
index = indexed.build_index(blocks, True)
position, _ = indexed.lookup(blocks, index, 106, 4)
check(position == 5, f"indexed position={position}")

print("PASS: Python dynamic capacity and ordered quicksort")

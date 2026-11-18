"""Export the exact T2 AVL frames used by unit tests."""
from __future__ import annotations

import json
from pathlib import Path

from verify_avl_python import load_source, run_preset

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/test/fixtures/avl-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/avl-edge-frames.json"

DEFAULT = {
    "insert-ll": {"preset": "insert-ll", "operation": "insert", "tree": [30, 20, 40, 10], "target": 5},
    "insert-rr": {"preset": "insert-rr", "operation": "insert", "tree": [30, 20, 40, 50], "target": 60},
    "insert-lr": {"preset": "insert-lr", "operation": "insert", "tree": [50, 30, 70, 20, 40, 60, 80, 10, 25], "target": 27},
    "insert-rl": {"preset": "insert-rl", "operation": "insert", "tree": [50, 30, 70, 60, 55], "target": 52},
    "insert-balanced": {"preset": "insert-balanced", "operation": "insert", "tree": [30, 20, 40, 10, 25, 35], "target": 28},
    "delete-leaf": {"preset": "delete-leaf", "operation": "delete", "tree": [30, 20, 40, 10, 25, 35, 5], "target": 35},
    "delete-one": {"preset": "delete-one", "operation": "delete", "tree": [30, 20, 40, 10, 25, 35, 5], "target": 40},
    "delete-two": {"preset": "delete-two", "operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, 65], "target": 50},
    "delete-cascade": {"preset": "delete-cascade", "operation": "delete", "tree": [3, 9, 1, 6, 8, 11, 12, 2, 10, 7, 5, 4], "target": 12},
    "delete-missing": {"preset": "delete-missing", "operation": "delete", "tree": [30, 20, 40, 10, 25, 35], "target": 50},
}

EDGE = {
    "insert-empty": {"preset": None, "operation": "insert", "tree": [], "target": 7},
    "insert-duplicate": {"preset": None, "operation": "insert", "tree": [30, 20, 40], "target": 20},
    "delete-empty": {"preset": None, "operation": "delete", "tree": [], "target": 7},
    "delete-root-leaf": {"preset": None, "operation": "delete", "tree": [7], "target": 7},
    "delete-root-one": {"preset": None, "operation": "delete", "tree": [50, 30], "target": 50},
    "invalid-values": {"preset": None, "operation": "insert", "tree": [30, None, True, "x", 20], "target": 10},
}

source = load_source()
default_payload = {
    name: run_preset(source, name, payload["operation"], payload["tree"], payload["target"])
    for name, payload in DEFAULT.items()
}
edge_payload = {
    name: run_preset(source, name, payload["operation"], payload["tree"], payload["target"])
    for name, payload in EDGE.items()
}
OUT.write_text(json.dumps(default_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {OUT} ({sum(len(v) for v in default_payload.values())} frames)")
print(f"wrote {EDGE_OUT} ({sum(len(v) for v in edge_payload.values())} frames)")
for name, frames in default_payload.items():
    print(f"  {name}: {len(frames)}")

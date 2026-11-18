"""Export the exact T1 BST frames used by unit tests and the browser E2E."""
from __future__ import annotations

import json
from pathlib import Path

from verify_bst_python import run

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/test/fixtures/bst-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/bst-edge-frames.json"

DEFAULT = {
    "find-success": {"preset": "find-success", "operation": "find", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 40},
    "find-missing": {"preset": "find-missing", "operation": "find", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 55},
    "insert": {"preset": "insert", "operation": "insert", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 35},
    "delete-leaf": {"preset": "delete-leaf", "operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 20},
    "delete-one": {"preset": "delete-one", "operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, None, None, None, None, None, 65], "target": 60},
    "delete-two": {"preset": "delete-two", "operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, None, None, None, None, None, 65], "target": 50},
}

EDGE = {
    "find-empty": {"operation": "find", "tree": [], "target": 9},
    "find-single": {"operation": "find", "tree": [7], "target": 7},
    "insert-empty": {"operation": "insert", "tree": [], "target": 7},
    "insert-duplicate": {"operation": "insert", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 40},
    "delete-empty": {"operation": "delete", "tree": [], "target": 5},
    "delete-missing": {"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 99},
    "delete-root-one": {"operation": "delete", "tree": [50, 30], "target": 50},
    "delete-root-two": {"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, None, None, None, None, None, 65], "target": 50},
}

default_payload = {name: run(payload) for name, payload in DEFAULT.items()}
edge_payload = {name: run(payload) for name, payload in EDGE.items()}
OUT.write_text(json.dumps(default_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {OUT} ({sum(len(v) for v in default_payload.values())} frames)")
print(f"wrote {EDGE_OUT} ({sum(len(v) for v in edge_payload.values())} frames)")
for name, frames in default_payload.items():
    print(f"  {name}: {len(frames)}")

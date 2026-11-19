"""Export exact T4 Huffman frames used by unit tests.

The frames come from the same CPython source the browser executes in Pyodide;
only the input and `trace()` collector are local.
"""
from __future__ import annotations

import json
from pathlib import Path

from verify_huffman_python import DEFAULT, EDGE, run

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/test/fixtures/huffman-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/huffman-edge-frames.json"

default_payload = {name: run(payload) for name, payload in DEFAULT.items()}
edge_payload = {name: run(payload) for name, payload in EDGE.items()}
OUT.write_text(json.dumps(default_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {OUT} ({sum(len(v) for v in default_payload.values())} frames)")
print(f"wrote {EDGE_OUT} ({sum(len(v) for v in edge_payload.values())} frames)")
for name, frames in {**default_payload, **edge_payload}.items():
    print(f"  {name}: {len(frames)}")

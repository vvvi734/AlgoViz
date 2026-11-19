"""Export exact S1 sorting frames used by unit tests.

Frames come from the same CPython source Pyodide executes; only the input and the
`trace()` collector are local. `sorting-default-frames.json` holds the three
official inputs, while `sorting-edge-frames.json` holds sorted, reverse,
duplicates, negative, mixed, single and empty inputs.
"""
from __future__ import annotations

import json
from pathlib import Path

from verify_sorting_python import ALGORITHMS, CASES, OFFICIAL, run

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "src/test/fixtures/sorting-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/sorting-edge-frames.json"

default_payload = {
    "selection": run("selection", OFFICIAL["selection"]),
    "insertion": run("insertion", OFFICIAL["insertion"]),
    "shell": run("shell", OFFICIAL["shell"]),
}
edge_payload = {
    case: {algorithm: run(algorithm, payload) for algorithm in ALGORITHMS}
    for case, payload in CASES.items()
}

DEFAULT_OUT.write_text(json.dumps(default_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {DEFAULT_OUT} ({sum(len(v) for v in default_payload.values())} frames)")
print(f"wrote {EDGE_OUT} ({sum(len(frames) for group in edge_payload.values() for frames in group.values())} frames)")
for algorithm, frames in default_payload.items():
    print(f"  {algorithm}: {len(frames)}")

"""Write the exact G3 default trace frames used by unit tests and the UI fixtures."""
from __future__ import annotations

import json
from pathlib import Path

from verify_dag_python import (
    CRITICAL_SOURCE,
    TOPOLOGICAL_SOURCE,
    run,
)

TOPOLOGICAL_DEFAULT_INPUT = {
    "nodes": ["A", "B", "C", "D", "E", "F", "G"],
    "edges": [["A", "C"], ["A", "D"], ["B", "C"], ["B", "E"], ["C", "F"], ["D", "F"], ["E", "G"], ["F", "G"]],
}
CRITICAL_PATH_DEFAULT_INPUT = {
    "nodes": ["A", "B", "C", "D", "E", "F"],
    "edges": [["A", "B", 3], ["A", "C", 2], ["B", "D", 2], ["B", "E", 6], ["C", "D", 4], ["D", "E", 3], ["E", "F", 2]],
}

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/test/fixtures/dag-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/dag-edge-frames.json"

TOPOLOGICAL_EDGE_CASES = {
    "disconnected": {"nodes": ["A", "B", "C", "D"], "edges": [["A", "B"], ["C", "D"]]},
    "cycle": {"nodes": ["A", "B", "C"], "edges": [["A", "B"], ["B", "C"], ["C", "A"]]},
    "single": {"nodes": ["A"], "edges": []},
    "empty": {"nodes": [], "edges": []},
}
CRITICAL_EDGE_CASES = {
    "multiSource": {"nodes": ["A", "B", "C", "D"], "edges": [["A", "C", 2], ["B", "C", 3], ["C", "D", 1]]},
    "multiSink": {"nodes": ["A", "B", "C"], "edges": [["A", "B", 2], ["A", "C", 5]]},
    "single": {"nodes": ["A"], "edges": []},
    "empty": {"nodes": [], "edges": []},
}

topological = run(TOPOLOGICAL_SOURCE, TOPOLOGICAL_DEFAULT_INPUT)
critical = run(CRITICAL_SOURCE, CRITICAL_PATH_DEFAULT_INPUT)
payload = {"topological": topological, "critical": critical}
OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

edge_payload = {
    "topological": {
        name: run(TOPOLOGICAL_SOURCE, graph) for name, graph in TOPOLOGICAL_EDGE_CASES.items()
    },
    "critical": {
        name: run(CRITICAL_SOURCE, graph) for name, graph in CRITICAL_EDGE_CASES.items()
    },
}
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {OUT} ({len(topological)} topological frames, {len(critical)} critical frames)")
print(f"wrote {EDGE_OUT} ({sum(len(v) for v in edge_payload['topological'].values())} topological edge frames, {sum(len(v) for v in edge_payload['critical'].values())} critical edge frames)")

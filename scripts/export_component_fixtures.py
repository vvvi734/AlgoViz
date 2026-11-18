"""Export the exact G4 frames used by unit tests and the real-browser E2E."""
from __future__ import annotations

import json
from pathlib import Path

from verify_components_python import (
    CC_EDGE_CASES,
    DEFAULT_CC,
    DEFAULT_SCC,
    SCC_EDGE_CASES,
    run,
    CC_SOURCE,
    SCC_SOURCE,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/test/fixtures/components-default-frames.json"
EDGE_OUT = ROOT / "src/test/fixtures/components-edge-frames.json"

cc = run(CC_SOURCE, DEFAULT_CC)
scc = run(SCC_SOURCE, DEFAULT_SCC)
OUT.write_text(json.dumps({"components": cc, "scc": scc}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

edge_payload = {
    "components": {name: run(CC_SOURCE, graph) for name, graph in CC_EDGE_CASES.items()},
    "scc": {name: run(SCC_SOURCE, graph) for name, graph in SCC_EDGE_CASES.items()},
}
EDGE_OUT.write_text(json.dumps(edge_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

print(f"wrote {OUT} ({len(cc)} component frames, {len(scc)} Kosaraju frames)")
print(f"wrote {EDGE_OUT} ({sum(len(v) for v in edge_payload['components'].values())} component edge frames, {sum(len(v) for v in edge_payload['scc'].values())} SCC edge frames)")

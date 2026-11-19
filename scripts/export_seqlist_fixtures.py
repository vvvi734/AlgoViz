"""Export L1B real Python frames to the shared test fixtures.

Usage: python scripts/export_seqlist_fixtures.py
"""
from __future__ import annotations

from seqlist_common import EDGE, OFFICIAL, ROOT, dump_json, run_case

OUT = ROOT / "src/test/fixtures"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    official = {name: run_case(cfg) for name, cfg in OFFICIAL.items()}
    edge = {name: run_case(cfg) for name, cfg in EDGE.items()}
    dump_json(OUT / "seqlist-official-frames.json", official)
    dump_json(OUT / "seqlist-edge-frames.json", edge)
    total = sum(len(frames) for frames in official.values()) + sum(len(frames) for frames in edge.values())
    print(f"wrote {len(official)} official cases / {len(edge)} edge cases")
    print(f"frames: official={sum(len(v) for v in official.values())}, "
          f"edge={sum(len(v) for v in edge.values())}, total={total}")


if __name__ == "__main__":
    main()

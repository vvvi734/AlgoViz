"""Export real CPython frames for MATRIX-01 sparse-matrix fast transpose.

JSON is generated from the exact Python shipped in `sparseTransposeExamples.ts`.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/sparseTransposeExamples.ts").read_text(encoding="utf-8")
OUT_DEFAULT = ROOT / "src/test/fixtures/sparse-transpose-default-frames.json"
OUT_EDGE = ROOT / "src/test/fixtures/sparse-transpose-edge-frames.json"

MARKER = "export const SPARSE_TRANSPOSE_PYTHON = `"
SOURCE = TS.split(MARKER, 1)[1].split("`;", 1)[0]
assert "${" not in SOURCE, "unexpanded template expression"

DEFAULT = {
    "rows": 4,
    "cols": 5,
    "triples": [
        {"row": 0, "col": 0, "value": 3},
        {"row": 0, "col": 2, "value": 7},
        {"row": 1, "col": 2, "value": 5},
        {"row": 2, "col": 1, "value": 4},
        {"row": 3, "col": 0, "value": 6},
        {"row": 3, "col": 2, "value": 8},
    ],
}
CASES = {
    "rectangle_3x7": {
        "rows": 3,
        "cols": 7,
        "triples": [
            {"row": 0, "col": 0, "value": 1},
            {"row": 0, "col": 6, "value": 2},
            {"row": 1, "col": 3, "value": 3},
            {"row": 2, "col": 2, "value": 4},
            {"row": 2, "col": 5, "value": 5},
        ],
    },
    "empty_zero_dims": {"rows": 0, "cols": 0, "triples": []},
    "empty_cells": {"rows": 3, "cols": 4, "triples": []},
    "one_column": {
        "rows": 4,
        "cols": 3,
        "triples": [
            {"row": 0, "col": 0, "value": 2},
            {"row": 1, "col": 0, "value": -3},
            {"row": 3, "col": 0, "value": 5},
        ],
    },
    "one_row": {
        "rows": 3,
        "cols": 5,
        "triples": [
            {"row": 0, "col": 0, "value": 1},
            {"row": 0, "col": 2, "value": 2},
            {"row": 0, "col": 4, "value": 3},
        ],
    },
    "single": {"rows": 1, "cols": 1, "triples": [{"row": 0, "col": 0, "value": 9}]},
    "negative_values": {
        "rows": 3,
        "cols": 4,
        "triples": [
            {"row": 0, "col": 1, "value": -2},
            {"row": 1, "col": 0, "value": 4},
            {"row": 2, "col": 3, "value": -6},
        ],
    },
    "max_dims": {
        "rows": 10,
        "cols": 10,
        "triples": [
            {"row": 0, "col": 9, "value": 7},
            {"row": 3, "col": 2, "value": 1},
            {"row": 7, "col": 4, "value": 8},
            {"row": 9, "col": 0, "value": 5},
        ],
    },
    "two_denseish_rows": {
        "rows": 4,
        "cols": 4,
        "triples": [
            {"row": 0, "col": 0, "value": 1},
            {"row": 0, "col": 2, "value": 2},
            {"row": 0, "col": 3, "value": 3},
            {"row": 1, "col": 1, "value": 4},
            {"row": 2, "col": 0, "value": 5},
            {"row": 2, "col": 2, "value": 6},
            {"row": 3, "col": 1, "value": 7},
            {"row": 3, "col": 3, "value": 8},
        ],
    },
}


def run(payload) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(SOURCE, "<matrix-01-sparse-transpose>", "exec"), ns)
    return frames


def check(payload, frames, case: str):
    if not frames:
        raise SystemExit(f"{case}: empty frame stream")
    if len(frames) > 200:
        raise SystemExit(f"{case}: frame budget exceeded")
    if frames[0]["structure"].get("operation") != "init":
        raise SystemExit(f"{case}: stream does not start with init")
    if frames[-1]["structure"].get("operation") != "done":
        raise SystemExit(f"{case}: stream does not end with done")
    for index, entry in enumerate(frames):
        structure = entry["structure"]
        if structure.get("kind") != "sparse-transpose":
            raise SystemExit(f"{case}: frame {index} wrong kind")
        if structure.get("rows") != payload["rows"] or structure.get("cols") != payload["cols"]:
            raise SystemExit(f"{case}: frame {index} shape changed")
        if structure.get("triples") != payload["triples"]:
            raise SystemExit(f"{case}: frame {index} triples changed")
        if len(structure.get("num", [])) != payload["cols"]:
            raise SystemExit(f"{case}: frame {index} num length wrong")
        if len(structure.get("result", [])) != len(payload["triples"]):
            raise SystemExit(f"{case}: frame {index} result length wrong")


def main():
    frames = run(DEFAULT)
    check(DEFAULT, frames, "default")
    OUT_DEFAULT.write_text(json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"default: {len(frames)} frames, result={frames[-1]['structure']['result']}")

    edge = {}
    total = 0
    for case, payload in CASES.items():
        frames = run(payload)
        check(payload, frames, case)
        edge[case] = frames
        total += len(frames)
        print(f"{case}: {len(frames)} frames, result={frames[-1]['structure']['result']}")
    OUT_EDGE.write_text(json.dumps(edge, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_DEFAULT.name} and {OUT_EDGE.name}; {total} edge frames")


if __name__ == "__main__":
    main()

"""Export real CPython frames for the F1 search courses.

The fixture is generated from the exact Python shipped in `searchExamples.ts`.
The independent reference and invariant audit lives in `verify_search_python.py`.
"""
from __future__ import annotations

import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/searchExamples.ts").read_text(encoding="utf-8")
OUT_DEFAULT = ROOT / "src/test/fixtures/search-default-frames.json"
OUT_EDGE = ROOT / "src/test/fixtures/search-edge-frames.json"

SOURCES = {}
for name in ("LINEAR_PYTHON", "BINARY_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"linear": SOURCES["LINEAR_PYTHON"], "binary": SOURCES["BINARY_PYTHON"]}
DEFAULT = {
    "linear": {"nums": [6, 3, 9, 2, 7, 4], "target": 7},
    "binary": {"nums": [1, 3, 5, 7, 9, 11, 13], "target": 9},
}
CASES = {
    "linear": {
        "success_first": {"nums": [7, 3, 9, 2], "target": 7},
        "success_last": {"nums": [4, 2, 9, 7], "target": 7},
        "missing": {"nums": [6, 3, 9, 2, 7, 4], "target": 5},
        "empty": {"nums": [], "target": 7},
        "single_hit": {"nums": [5], "target": 5},
        "single_miss": {"nums": [5], "target": 4},
        "duplicates": {"nums": [2, 2, 3, 2], "target": 2},
        "negative": {"nums": [-5, -3, -1, 0], "target": -1},
        "middle": {"nums": [1, 3, 5, 7, 9], "target": 5},
        "two_missing": {"nums": [1, 4], "target": 3},
    },
    "binary": {
        "success_first": {"nums": [7, 9, 13], "target": 7},
        "success_last": {"nums": [1, 3, 7], "target": 7},
        "missing": {"nums": [1, 3, 5, 7], "target": 4},
        "empty": {"nums": [], "target": 7},
        "single_hit": {"nums": [5], "target": 5},
        "single_miss": {"nums": [5], "target": 4},
        "duplicates": {"nums": [2, 2, 2, 3], "target": 2},
        "negative": {"nums": [-9, -5, -2, 0], "target": -2},
        "middle": {"nums": [1, 3, 5, 7, 9], "target": 5},
        "two_missing": {"nums": [1, 4], "target": 3},
        "unsorted": {"nums": [3, 1, 2], "target": 2},
    },
}


def normalize(raw):
    if not isinstance(raw, dict) or not isinstance(raw.get("nums"), list):
        return []
    values = []
    for item in raw["nums"][:32]:
        if isinstance(item, bool):
            continue
        if isinstance(item, (int, float)) and math.isfinite(item):
            values.append(item)
    return values


def run(algorithm: str, payload) -> list[dict]:
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
    exec(compile(ALGORITHMS[algorithm], f"<f1-{algorithm}>", "exec"), ns)
    return frames


def check(algorithm, payload, frames):
    raw = normalize(payload)
    if not frames:
        raise SystemExit(f"{algorithm}: empty frame stream")
    if len(frames) > 500:
        raise SystemExit(f"{algorithm}: {len(frames)} frames exceeds the 500 budget")
    for index, entry in enumerate(frames):
        structure = entry["structure"]
        if structure.get("kind") != "search" or structure.get("algorithm") != algorithm:
            raise SystemExit(f"{algorithm} frame {index}: wrong kind/algorithm")
        values = [cell["value"] for cell in structure["elements"]]
        if values != raw:
            raise SystemExit(f"{algorithm} frame {index}: elements are not the input")
        if entry["state"].get("values") != values:
            raise SystemExit(f"{algorithm} frame {index}: state and elements disagree")
        if [cell["id"] for cell in structure["elements"]] != [f"p{i}" for i in range(len(raw))]:
            raise SystemExit(f"{algorithm} frame {index}: slot ids are wrong")
    final = frames[-1]["structure"]
    if algorithm == "linear":
        if final["operation"] not in ("found", "not-found"):
            raise SystemExit("linear stream has no terminal frame")
        if final["operation"] == "found" and raw[final["result"]] != payload["target"]:
            raise SystemExit("linear found index is not a match")
    else:
        if final["operation"] not in ("binary-found", "binary-not-found", "invalid"):
            raise SystemExit("binary stream has no terminal frame")
        if final["operation"] == "binary-found" and raw[final["result"]] != payload["target"]:
            raise SystemExit("binary found index is not a match")


def main():
    default = {}
    for algorithm, payload in DEFAULT.items():
        frames = run(algorithm, payload)
        check(algorithm, payload, frames)
        default[algorithm] = frames
        print(f"{algorithm}: {len(frames)} default frames")
    OUT_DEFAULT.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")

    edge = {}
    total = 0
    for algorithm, cases in CASES.items():
        edge[algorithm] = {}
        for case, payload in cases.items():
            frames = run(algorithm, payload)
            check(algorithm, payload, frames)
            edge[algorithm][case] = frames
            total += len(frames)
            print(f"{algorithm}/{case}: {len(frames)} frames")
    OUT_EDGE.write_text(json.dumps(edge, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_DEFAULT.name} and {OUT_EDGE.name}; {total} edge frames")


if __name__ == "__main__":
    main()

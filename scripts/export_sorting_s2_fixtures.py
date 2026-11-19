"""Export real CPython frames for the S2 quick/merge courses.

The fixture is generated from the exact Python source shipped in
`sortingExamples.ts`; tests compare the app model against this capture. The
independent invariant check lives in `verify_divide_sort_python.py`.
"""
from __future__ import annotations

import copy
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/sortingExamples.ts").read_text(encoding="utf-8")
OUT_DEFAULT = ROOT / "src/test/fixtures/sorting-s2-default-frames.json"
OUT_EDGE = ROOT / "src/test/fixtures/sorting-s2-edge-frames.json"

SOURCES = {}
for name in ("QUICK_PYTHON", "MERGE_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"quick": SOURCES["QUICK_PYTHON"], "merge": SOURCES["MERGE_PYTHON"]}
DEFAULT = {"quick": [8, 3, 1, 7, 5, 2, 9, 4], "merge": [7, 3, 5, 1, 9, 2, 8, 4]}
CASES = {
    "sorted": [1, 2, 3, 4, 5, 6],
    "reverse": [6, 5, 4, 3, 2, 1],
    "duplicates": [3, 1, 3, 2, 1, 3],
    "negative": [-2, 5, 0, -7, 3, -1],
    "all_same": [7, 7, 7, 7, 7],
    "single": [5],
    "empty": [],
}


def normalize(raw):
    if not isinstance(raw, list):
        return []
    values = []
    for item in raw[:20]:
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
    exec(compile(ALGORITHMS[algorithm], f"<s2-{algorithm}>", "exec"), ns)
    return frames


def capture(payload):
    return {algorithm: run(algorithm, payload) for algorithm in ALGORITHMS}


def check(algorithm, payload, frames):
    raw = normalize(payload)
    values = [cell["value"] for cell in frames[-1]["structure"]["elements"]]
    if values != sorted(raw):
        raise SystemExit(f"{algorithm}: final array is not sorted for {payload!r}: {values!r}")
    if Counter(values) != Counter(raw):
        raise SystemExit(f"{algorithm}: multiset changed for {payload!r}")
    if len(frames) > 500:
        raise SystemExit(f"{algorithm}: {len(frames)} frames exceeds the 500-frame budget")
    for index, entry in enumerate(frames):
        if entry["structure"]["kind"] != "sorting" or entry["structure"]["algorithm"] != algorithm:
            raise SystemExit(f"{algorithm} frame {index}: wrong kind/algorithm")
        if entry["state"]["values"] != [cell["value"] for cell in entry["structure"]["elements"]]:
            raise SystemExit(f"{algorithm} frame {index}: state and elements disagree")


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
    for case, payload in CASES.items():
        edge[case] = {}
        for algorithm in ALGORITHMS:
            frames = run(algorithm, payload)
            check(algorithm, payload, frames)
            edge[case][algorithm] = frames
            total += len(frames)
            print(f"{algorithm}/{case}: {len(frames)} frames")
    OUT_EDGE.write_text(json.dumps(edge, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_DEFAULT.name} and {OUT_EDGE.name}; {total} edge frames")


if __name__ == "__main__":
    main()

"""Export real CPython frames for TEXTBOOK-11 external-sorting modules.

Each fixture executes the exact Python source shipped in the matching
`*Examples.ts` file. No algorithm is reimplemented here.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def extract(ts_file: str, marker: str, tag: str) -> str:
    ts = (ROOT / "src/domain/algorithms" / ts_file).read_text(encoding="utf-8")
    source = ts.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in source, f"{tag}: unexpanded template expression"
    return source


MULTIWAY_SOURCE = extract(
    "multiwayExamples.ts", "export const MULTIWAY_PYTHON = `", "multiway"
)
REPLACEMENT_SOURCE = extract(
    "replacementExamples.ts", "export const REPLACEMENT_PYTHON = `", "replacement"
)
OPTIMAL_SOURCE = extract(
    "optimalMergeExamples.ts", "export const OPTIMAL_MERGE_PYTHON = `", "optimal"
)


def run(source: str, payload: dict, tag: str, max_frames: int = 400) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append(
            {
                "state": copy.deepcopy(state),
                "message": message,
                "line": line,
                "variables": copy.deepcopy(variables),
                "lessonStepId": lesson_step,
                "structure": copy.deepcopy(structure),
            }
        )

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(source, f"<{tag}>", "exec"), ns)
    if not frames:
        raise SystemExit(f"{tag}: empty frame stream")
    if len(frames) > max_frames:
        raise SystemExit(f"{tag}: frame budget exceeded ({len(frames)})")
    operations = [frame["structure"].get("operation") for frame in frames]
    if operations[0] != "init":
        raise SystemExit(f"{tag}: stream does not start with init ({operations[:3]})")
    if operations[-1] != "done":
        raise SystemExit(f"{tag}: stream does not end with done ({operations[-3:]})")
    return frames


MULTIWAY_CASES = {
    "two-way": {
        "preset": "two-way", "k": 2, "runs": [[2, 5, 9], [1, 6, 10]],
        "bufferCapacity": 2, "blockSize": 1,
    },
    "three-way": {
        "preset": "three-way", "k": 3, "runs": [[1, 4, 9, 12], [2, 3, 7], [5, 10]],
        "bufferCapacity": 2, "blockSize": 1,
    },
    "four-way": {
        "preset": "four-way", "k": 4, "runs": [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]],
        "bufferCapacity": 2, "blockSize": 1,
    },
    "duplicates": {
        "preset": "duplicates", "k": 2, "runs": [[1, 3, 3], [2, 3, 4]],
        "bufferCapacity": 2, "blockSize": 2,
    },
    "empty-run": {
        "preset": "empty-run", "k": 3, "runs": [[1, 4], [], [2, 5]],
        "bufferCapacity": 2, "blockSize": 1,
    },
    "buffer-one": {
        "preset": "buffer-one", "k": 2, "runs": [[2, 5, 9], [1, 6, 10]],
        "bufferCapacity": 1, "blockSize": 1,
    },
}

REPLACEMENT_CASES = {
    "normal": {
        "preset": "normal", "values": [7, 3, 9, 1, 8, 2, 6, 4, 5], "workspaceCapacity": 3,
    },
    "nearly-sorted": {
        "preset": "nearly-sorted", "values": [1, 2, 3, 5, 4, 6, 8, 7, 9],
        "workspaceCapacity": 3,
    },
    "reversed": {
        "preset": "reversed", "values": [9, 8, 7, 6, 5, 4, 3, 2, 1], "workspaceCapacity": 3,
    },
    "duplicates": {
        "preset": "duplicates", "values": [5, 3, 5, 1, 3, 5, 2, 3], "workspaceCapacity": 3,
    },
    "small-workspace": {
        "preset": "small-workspace", "values": [7, 3, 9, 1, 8, 2, 6, 4, 5],
        "workspaceCapacity": 2,
    },
    "large-workspace": {
        "preset": "large-workspace", "values": [9, 4, 7, 1, 8, 3, 6, 2, 5],
        "workspaceCapacity": 5,
    },
    "single": {"preset": "single", "values": [5], "workspaceCapacity": 2},
}

OPTIMAL_CASES = {
    "two-way": {"preset": "two-way", "segmentWeights": [3, 5, 8, 11], "k": 2},
    "three-way": {"preset": "three-way", "segmentWeights": [4, 5, 6, 9, 11], "k": 3},
    "virtual-dummy": {
        "preset": "virtual-dummy", "segmentWeights": [4, 5, 9, 10, 12, 15], "k": 3,
    },
    "equal": {"preset": "equal", "segmentWeights": [5, 5, 5, 5, 5], "k": 2},
    "uneven": {"preset": "uneven", "segmentWeights": [1, 2, 100, 101, 102], "k": 2},
    "four-way": {"preset": "four-way", "segmentWeights": [4, 5, 6, 7, 8, 9], "k": 4},
    "single": {"preset": "single", "segmentWeights": [8], "k": 2},
}


def main():
    fixtures = ROOT / "src/test/fixtures"
    outputs = [
        ("multiway", MULTIWAY_SOURCE, MULTIWAY_CASES, "chapter11-multiway-frames.json"),
        ("replacement", REPLACEMENT_SOURCE, REPLACEMENT_CASES, "chapter11-replacement-frames.json"),
        ("optimal", OPTIMAL_SOURCE, OPTIMAL_CASES, "chapter11-optimal-tree-frames.json"),
    ]
    for tag, source, cases, filename in outputs:
        bundle = {}
        for case, payload in cases.items():
            frames = run(source, payload, f"{tag}/{case}")
            bundle[case] = {"input": payload, "frames": frames}
            print(tag, case, len(frames), [frame["structure"]["operation"] for frame in frames])
        (fixtures / filename).write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print("wrote chapter 11 fixtures")


if __name__ == "__main__":
    main()

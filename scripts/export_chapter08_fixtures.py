"""Export real CPython frames for TEXTBOOK-08 dynamic storage modules.

Each JSON file is produced by executing the exact Python shipped in the matching
`*Examples.ts` file. No algorithm is reimplemented in the exporter.
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


FREE_SOURCE = extract("freeListExamples.ts", "export const FREE_LIST_PYTHON = `", "free-list")
BUDDY_SOURCE = extract("buddyExamples.ts", "export const BUDDY_PYTHON = `", "buddy")
GC_SOURCE = extract(
    "garbageCollectionExamples.ts",
    "export const GARBAGE_COLLECTION_PYTHON = `",
    "gc",
)


def run(source: str, payload: dict, tag: str) -> list[dict]:
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
    if len(frames) > 400:
        raise SystemExit(f"{tag}: frame budget exceeded ({len(frames)})")
    if frames[0]["structure"].get("operation") != "init":
        raise SystemExit(f"{tag}: stream does not start with init")
    if frames[-1]["structure"].get("operation") != "done":
        raise SystemExit(f"{tag}: stream does not end with done")
    return frames


FREE_CASES = {
    "first-fit-default": {
        "capacity": 64,
        "policy": "first-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 12},
            {"op": "alloc", "id": "B", "size": 16},
            {"op": "alloc", "id": "C", "size": 10},
            {"op": "alloc", "id": "D", "size": 12},
            {"op": "alloc", "id": "E", "size": 4},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "D"},
            {"op": "alloc", "id": "F", "size": 8},
            {"op": "free", "id": "C"},
            {"op": "free", "id": "F"},
        ],
    },
    "best-fit-default": {
        "capacity": 64,
        "policy": "best-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 12},
            {"op": "alloc", "id": "B", "size": 16},
            {"op": "alloc", "id": "C", "size": 10},
            {"op": "alloc", "id": "D", "size": 12},
            {"op": "alloc", "id": "E", "size": 4},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "D"},
            {"op": "alloc", "id": "F", "size": 8},
            {"op": "free", "id": "C"},
            {"op": "free", "id": "F"},
        ],
    },
    "external-fragmentation": {
        "capacity": 64,
        "policy": "first-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 20},
            {"op": "alloc", "id": "B", "size": 10},
            {"op": "alloc", "id": "C", "size": 10},
            {"op": "free", "id": "A"},
            {"op": "alloc", "id": "D", "size": 25},
            {"op": "free", "id": "B"},
            {"op": "alloc", "id": "E", "size": 30},
        ],
    },
    "coalesce-both-sides": {
        "capacity": 48,
        "policy": "first-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 8},
            {"op": "alloc", "id": "B", "size": 8},
            {"op": "alloc", "id": "C", "size": 8},
            {"op": "alloc", "id": "D", "size": 8},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "C"},
            {"op": "free", "id": "A"},
            {"op": "free", "id": "D"},
        ],
    },
    "first-vs-best-first": {
        "capacity": 32,
        "policy": "first-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 16},
            {"op": "alloc", "id": "B", "size": 8},
            {"op": "alloc", "id": "C", "size": 8},
            {"op": "free", "id": "A"},
            {"op": "free", "id": "C"},
            {"op": "alloc", "id": "D", "size": 6},
        ],
    },
    "first-vs-best-best": {
        "capacity": 32,
        "policy": "best-fit",
        "operations": [
            {"op": "alloc", "id": "A", "size": 16},
            {"op": "alloc", "id": "B", "size": 8},
            {"op": "alloc", "id": "C", "size": 8},
            {"op": "free", "id": "A"},
            {"op": "free", "id": "C"},
            {"op": "alloc", "id": "D", "size": 6},
        ],
    },
}

BUDDY_CASES = {
    "default": {
        "capacity": 32,
        "operations": [
            {"op": "alloc", "id": "A", "size": 3},
            {"op": "alloc", "id": "B", "size": 5},
            {"op": "alloc", "id": "C", "size": 2},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "A"},
            {"op": "free", "id": "C"},
            {"op": "alloc", "id": "D", "size": 20},
            {"op": "free", "id": "D"},
        ],
    },
    "merge-multi": {
        "capacity": 32,
        "operations": [
            {"op": "alloc", "id": "A", "size": 3},
            {"op": "alloc", "id": "B", "size": 5},
            {"op": "alloc", "id": "C", "size": 2},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "C"},
            {"op": "free", "id": "A"},
        ],
    },
    "merge-one": {
        "capacity": 32,
        "operations": [
            {"op": "alloc", "id": "A", "size": 3},
            {"op": "alloc", "id": "B", "size": 5},
            {"op": "alloc", "id": "C", "size": 2},
            {"op": "free", "id": "C"},
            {"op": "free", "id": "A"},
        ],
    },
    "buddy-busy": {
        "capacity": 32,
        "operations": [
            {"op": "alloc", "id": "A", "size": 3},
            {"op": "alloc", "id": "B", "size": 5},
            {"op": "alloc", "id": "C", "size": 2},
            {"op": "free", "id": "B"},
            {"op": "free", "id": "A"},
        ],
    },
    "insufficient": {
        "capacity": 32,
        "operations": [
            {"op": "alloc", "id": "A", "size": 3},
            {"op": "alloc", "id": "B", "size": 5},
            {"op": "alloc", "id": "C", "size": 20},
        ],
    },
}

GC_DEFAULT_OBJECTS = [
    {"id": "A", "size": 12, "refs": ["B", "C"]},
    {"id": "E", "size": 8, "refs": ["F"]},
    {"id": "B", "size": 10, "refs": ["D"]},
    {"id": "F", "size": 8, "refs": ["E"]},
    {"id": "C", "size": 8, "refs": ["B"]},
    {"id": "G", "size": 6, "refs": []},
    {"id": "D", "size": 12, "refs": []},
    {"id": "H", "size": 8, "refs": ["A"]},
]

GC_CASES = {
    "mark-sweep-default": {
        "mode": "mark-sweep",
        "capacity": 96,
        "roots": ["A"],
        "objects": GC_DEFAULT_OBJECTS,
    },
    "mark-sweep-cycle": {
        "mode": "mark-sweep",
        "capacity": 24,
        "roots": ["A"],
        "objects": [
            {"id": "A", "size": 6, "refs": ["B"]},
            {"id": "B", "size": 6, "refs": ["A"]},
            {"id": "C", "size": 6, "refs": []},
        ],
    },
    "mark-sweep-multi-root": {
        "mode": "mark-sweep",
        "capacity": 48,
        "roots": ["A", "C"],
        "objects": [
            {"id": "A", "size": 6, "refs": ["B"]},
            {"id": "B", "size": 6, "refs": []},
            {"id": "C", "size": 6, "refs": []},
            {"id": "D", "size": 6, "refs": []},
            {"id": "E", "size": 6, "refs": []},
        ],
    },
    "compaction-default": {
        "mode": "compaction",
        "capacity": 96,
        "roots": ["A"],
        "objects": GC_DEFAULT_OBJECTS,
    },
    "compaction-multi-root": {
        "mode": "compaction",
        "capacity": 48,
        "roots": ["A", "C"],
        "objects": [
            {"id": "A", "size": 6, "refs": ["B"]},
            {"id": "B", "size": 6, "refs": []},
            {"id": "C", "size": 6, "refs": []},
            {"id": "D", "size": 6, "refs": []},
            {"id": "E", "size": 6, "refs": []},
        ],
    },
}


def main():
    free_out = {}
    for case, payload in FREE_CASES.items():
        free_out[case] = {"input": payload, "frames": run(FREE_SOURCE, payload, f"free/{case}")}
        print("free", case, len(free_out[case]["frames"]))

    buddy_out = {}
    for case, payload in BUDDY_CASES.items():
        buddy_out[case] = {"input": payload, "frames": run(BUDDY_SOURCE, payload, f"buddy/{case}")}
        print("buddy", case, len(buddy_out[case]["frames"]))

    gc_out = {}
    for case, payload in GC_CASES.items():
        gc_out[case] = {"input": payload, "frames": run(GC_SOURCE, payload, f"gc/{case}")}
        print("gc", case, len(gc_out[case]["frames"]))

    fixtures = ROOT / "src/test/fixtures"
    (fixtures / "chapter08-free-list-frames.json").write_text(
        json.dumps(free_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (fixtures / "chapter08-buddy-frames.json").write_text(
        json.dumps(buddy_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (fixtures / "chapter08-gc-frames.json").write_text(
        json.dumps(gc_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("wrote chapter 8 fixtures")


if __name__ == "__main__":
    main()

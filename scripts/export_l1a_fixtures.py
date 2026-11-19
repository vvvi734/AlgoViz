"""Export real CPython frames for the L1A linked-list courses.

The sources are extracted from `advancedLinkedListExamples.ts` and executed with
a local trace collector. The independent operation-level audit lives in
`verify_l1a_python.py`; this script only captures what the shipped preset emits.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/advancedLinkedListExamples.ts").read_text(encoding="utf-8")
OUT = ROOT / "src/test/fixtures"

SOURCES = {}
for name in ("DOUBLY_PYTHON", "CIRCULAR_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"doubly": SOURCES["DOUBLY_PYTHON"], "circular": SOURCES["CIRCULAR_PYTHON"]}

DOUBLY_DEFAULT = [
    ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
    ["insert_after", 5, 6], ["insert_tail", 8],
    ["traverse_forward"], ["traverse_reverse"], ["find", 6], ["find", 99],
    ["delete", 6], ["delete_head"], ["delete_tail"], ["delete", 5], ["delete_tail", 7],
    ["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"],
]

CIRCULAR_DEFAULT = [
    ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
    ["insert_after", 5, 6], ["insert_tail", 8],
    ["traverse_circle"], ["find", 6], ["find", 99],
    ["delete", 6], ["delete_head"], ["delete_tail"], ["delete", 5], ["delete_tail", 7],
    ["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"],
]

DEFAULT = {"doubly": DOUBLY_DEFAULT, "circular": CIRCULAR_DEFAULT}

EDGE = {
    "doubly": {
        "empty": [],
        "single_forward_reverse": [
            ["insert_head", 5], ["traverse_forward"], ["traverse_reverse"],
            ["find", 5], ["find", 99], ["delete_head"],
        ],
        "head_tail": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["delete_head"], ["delete_tail"],
        ],
        "middle": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["insert_after", 5, 6], ["insert_tail", 8], ["delete", 6],
        ],
        "missing_insert": [["insert_head", 5], ["insert_after", 99, 8], ["find", 99], ["delete", 99]],
        "delete_all": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["delete_head"], ["delete_tail"], ["delete", 2],
        ],
        "rebuild": [
            ["insert_head", 9], ["delete_head"], ["insert_head", 11],
            ["insert_tail", 13], ["delete_tail"], ["insert_head", 15],
        ],
        "order": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["insert_tail", 4], ["insert_tail", 5], ["delete", 2], ["delete", 4],
        ],
    },
    "circular": {
        "empty": [],
        "single_self_loop": [
            ["insert_head", 5], ["traverse_circle"], ["find", 5], ["delete_head"],
        ],
        "head_tail": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["traverse_circle"], ["delete_head"], ["delete_tail"],
        ],
        "middle": [
            ["insert_head", 5], ["insert_tail", 7], ["insert_head", 3],
            ["insert_after", 5, 6], ["insert_tail", 8], ["delete", 6],
            ["traverse_circle"],
        ],
        "delete_last": [["insert_head", 9], ["insert_tail", 11], ["delete_head"], ["delete_tail"]],
        "missing": [["insert_head", 5], ["find", 99], ["insert_after", 99, 8], ["delete", 99]],
        "rebuild": [
            ["insert_head", 9], ["delete_head"], ["insert_head", 11],
            ["insert_tail", 13], ["traverse_circle"], ["delete_tail"], ["insert_head", 15],
        ],
        "order": [
            ["insert_head", 1], ["insert_tail", 2], ["insert_tail", 3],
            ["insert_tail", 4], ["insert_tail", 5], ["delete", 2], ["delete", 4],
            ["traverse_circle"],
        ],
    },
}


def run(algorithm: str, operations) -> list[dict]:
    frames: list[dict] = []

    def trace(state, message="", line=None, variables=None, lesson_step=None, structure=None):
        frames.append({
            "state": copy.deepcopy(state),
            "message": message,
            "line": line,
            "variables": copy.deepcopy(variables),
            "lessonStepId": lesson_step,
            "structure": copy.deepcopy(structure),
        })

    env = {"input": copy.deepcopy(operations), "trace": trace, "__name__": "l1a_fixture"}
    exec(compile(ALGORITHMS[algorithm], f"{algorithm}.py", "exec"), env)
    return frames


def main():
    default = {algorithm: run(algorithm, operations) for algorithm, operations in DEFAULT.items()}
    edge = {
        algorithm: {name: run(algorithm, operations) for name, operations in cases.items()}
        for algorithm, cases in EDGE.items()
    }
    for algorithm, payload in default.items():
        path = OUT / f"l1a-{algorithm}-default-frames.json"
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)} ({len(payload)} frames)")
    for algorithm, cases in edge.items():
        path = OUT / f"l1a-{algorithm}-edge-frames.json"
        path.write_text(json.dumps(cases, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)} ({sum(len(v) for v in cases.values())} frames)")


if __name__ == "__main__":
    main()

"""Export real CPython frames for the F2 hash-table courses.

The fixtures are generated from the exact Python shipped in `hashExamples.ts`.
The independent reference audit lives in `verify_hash_python.py`.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/hashExamples.ts").read_text(encoding="utf-8")
OUT_DEFAULT = ROOT / "src/test/fixtures/hash-default-frames.json"
OUT_EDGE = ROOT / "src/test/fixtures/hash-edge-frames.json"

SOURCES = {}
for name in ("CHAINING_PYTHON", "PROBING_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"hash-chain": SOURCES["CHAINING_PYTHON"], "hash-probe": SOURCES["PROBING_PYTHON"]}

DEFAULT = {
    "hash-chain": {
        "tableSize": 7,
        "operations": [
            ["insert", 1], ["insert", 8], ["insert", 15], ["insert", 8],
            ["find", 8], ["find", 99], ["delete", 8], ["find", 1],
            ["delete", 1], ["find", 15], ["delete", 15], ["insert", 22], ["find", 22],
        ],
    },
    "hash-probe": {
        "tableSize": 7,
        "operations": [
            ["insert", 1], ["insert", 8], ["insert", 15], ["find", 8],
            ["find", 99], ["delete", 8], ["find", 15], ["delete", 99],
            ["insert", 22], ["insert", 3], ["insert", 10], ["insert", 17],
            ["insert", 24], ["insert", 31], ["delete", 15], ["find", 24],
            ["delete", 24], ["find", 31], ["insert", 31], ["insert", 38],
        ],
    },
}

EDGE = {
    "hash-chain": {
        "empty": {"tableSize": 7, "operations": []},
        "single": {"tableSize": 7, "operations": [["insert", 5], ["find", 5], ["delete", 5], ["find", 5]]},
        "negative": {"tableSize": 7, "operations": [["insert", -1], ["insert", -8], ["insert", -15], ["find", -8], ["delete", -1], ["find", -15]]},
        "delete_orders": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["insert", 22], ["delete", 1], ["delete", 15], ["delete", 8], ["delete", 22]]},
        "duplicate": {"tableSize": 7, "operations": [["insert", 5], ["insert", 5], ["find", 5], ["delete", 5], ["delete", 5]]},
        "table2": {"tableSize": 2, "operations": [["insert", 1], ["insert", 3], ["find", 5], ["delete", 3], ["find", 1]]},
        "long_chain": {"tableSize": 2, "operations": [["insert", 1], ["insert", 3], ["insert", 5], ["insert", 7], ["find", 7], ["delete", 5], ["find", 3]]},
        "missing": {"tableSize": 7, "operations": [["delete", 99], ["find", 99]]},
    },
    "hash-probe": {
        "empty": {"tableSize": 7, "operations": []},
        "single": {"tableSize": 7, "operations": [["insert", 5], ["find", 5], ["delete", 5], ["find", 5]]},
        "negative": {"tableSize": 7, "operations": [["insert", -1], ["insert", -8], ["insert", -15], ["find", -8], ["delete", -1], ["find", -15]]},
        "tombstone": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["delete", 8], ["find", 15], ["insert", 22], ["delete", 22], ["find", 15]]},
        "table2_full": {"tableSize": 2, "operations": [["insert", 0], ["insert", 2], ["insert", 4], ["delete", 0], ["insert", 4], ["find", 2], ["delete", 2], ["find", 4]]},
        "wrap": {"tableSize": 3, "operations": [["insert", 1], ["insert", 4], ["insert", 7], ["insert", 10], ["find", 7], ["delete", 4], ["find", 7], ["insert", 10], ["find", 1]]},
        "duplicate": {"tableSize": 7, "operations": [["insert", 5], ["insert", 5], ["find", 5], ["delete", 5], ["delete", 5]]},
        "tombstone_chain": {"tableSize": 7, "operations": [["insert", 1], ["insert", 8], ["insert", 15], ["delete", 1], ["delete", 8], ["delete", 15], ["find", 15], ["insert", 22], ["find", 22]]},
        "table17": {"tableSize": 17, "operations": [["insert", 1], ["insert", 18], ["insert", 35], ["insert", 52], ["insert", 69], ["find", 69], ["delete", 35], ["find", 52], ["insert", 86]]},
    },
}


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

    env = {"input": copy.deepcopy(payload), "trace": trace, "__name__": "hash_fixture"}
    exec(compile(ALGORITHMS[algorithm], f"{algorithm}.py", "exec"), env)
    return frames


def main():
    default = {algorithm: run(algorithm, payload) for algorithm, payload in DEFAULT.items()}
    edge = {
        algorithm: {name: run(algorithm, payload) for name, payload in cases.items()}
        for algorithm, cases in EDGE.items()
    }
    OUT_DEFAULT.write_text(json.dumps(default, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    OUT_EDGE.write_text(json.dumps(edge, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(f"wrote {OUT_DEFAULT.relative_to(ROOT)} ({sum(len(v) for v in default.values())} frames)")
    print(f"wrote {OUT_EDGE.relative_to(ROOT)} ({sum(len(v) for case in edge.values() for v in case.values())} frames)")


if __name__ == "__main__":
    main()

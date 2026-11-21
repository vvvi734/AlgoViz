"""Export real CPython frames for TEXTBOOK-12 file-structure modules.

Every fixture runs the exact Python source embedded in the matching
`*Examples.ts` file. The script does not reimplement any algorithm.
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


FILE_INDEX_SOURCE = extract(
    "fileIndexExamples.ts", "export const FILE_INDEX_PYTHON = `", "file-index"
)
ISAM_SOURCE = extract("isamExamples.ts", "export const ISAM_PYTHON = `", "isam")
INVERTED_SOURCE = extract(
    "invertedIndexExamples.ts", "export const INVERTED_INDEX_PYTHON = `", "inverted-index"
)


def run(source: str, payload: dict, tag: str, max_frames: int = 500) -> list[dict]:
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


BASE_RECORDS = [
    {"key": 101, "label": "A"},
    {"key": 102, "label": "B"},
    {"key": 103, "label": "C"},
    {"key": 104, "label": "D"},
    {"key": 105, "label": "E"},
    {"key": 106, "label": "F"},
    {"key": 107, "label": "G"},
    {"key": 108, "label": "H"},
]

FILE_INDEX_CASES = {
    "dense-hit": {
        "preset": "dense-hit", "indexKind": "dense", "blockCapacity": 3,
        "targetKey": 106, "records": BASE_RECORDS,
    },
    "dense-miss": {
        "preset": "dense-miss", "indexKind": "dense", "blockCapacity": 3,
        "targetKey": 109, "records": BASE_RECORDS,
    },
    "sparse-hit": {
        "preset": "sparse-hit", "indexKind": "sparse", "blockCapacity": 3,
        "targetKey": 106, "records": BASE_RECORDS,
    },
    "sparse-miss": {
        "preset": "sparse-miss", "indexKind": "sparse", "blockCapacity": 3,
        "targetKey": 100, "records": BASE_RECORDS,
    },
    "small-blocks": {
        "preset": "small-blocks", "indexKind": "dense", "blockCapacity": 2,
        "targetKey": 105, "records": BASE_RECORDS,
    },
    "large-blocks": {
        "preset": "large-blocks", "indexKind": "sparse", "blockCapacity": 4,
        "targetKey": 107, "records": BASE_RECORDS,
    },
}

ISAM_CASES = {
    "find-hit": {
        "preset": "find-hit", "command": "find", "blockCapacity": 2,
        "targetKey": 104, "records": BASE_RECORDS,
    },
    "find-overflow": {
        "preset": "find-overflow", "command": "insert", "blockCapacity": 2,
        "targetKey": 105, "newLabel": "I", "records": [
            row for row in BASE_RECORDS if row["key"] != 105
        ],
    },
    "find-miss": {
        "preset": "find-miss", "command": "find", "blockCapacity": 2,
        "targetKey": 109, "records": BASE_RECORDS,
    },
    "insert-main": {
        "preset": "insert-main", "command": "insert", "blockCapacity": 3,
        "targetKey": 108, "newLabel": "I", "records": BASE_RECORDS[:7],
    },
    "insert-overflow": {
        "preset": "insert-overflow", "command": "insert", "blockCapacity": 3,
        "targetKey": 105, "newLabel": "I", "records": [
            row for row in BASE_RECORDS if row["key"] != 105
        ],
    },
    "small-blocks": {
        "preset": "small-blocks", "command": "find", "blockCapacity": 2,
        "targetKey": 107, "records": BASE_RECORDS,
    },
}

INVERTED_CASES = {
    "and-query": {
        "preset": "and-query", "mode": "and", "queryTerms": ["算法", "排序"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R2", "keywords": ["算法", "排序"]},
            {"id": "R3", "keywords": ["数据结构", "排序"]},
            {"id": "R4", "keywords": ["索引", "算法"]},
        ],
    },
    "or-query": {
        "preset": "or-query", "mode": "or", "queryTerms": ["算法", "排序"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R2", "keywords": ["算法", "排序"]},
            {"id": "R3", "keywords": ["数据结构", "排序"]},
            {"id": "R4", "keywords": ["索引", "算法"]},
        ],
    },
    "no-match": {
        "preset": "no-match", "mode": "and", "queryTerms": ["算法", "索引", "图形"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R2", "keywords": ["算法", "排序"]},
            {"id": "R3", "keywords": ["数据结构", "排序"]},
            {"id": "R4", "keywords": ["索引", "算法"]},
        ],
    },
    "shared-keyword": {
        "preset": "shared-keyword", "mode": "or", "queryTerms": ["数据结构"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R3", "keywords": ["数据结构", "排序"]},
        ],
    },
    "missing-term": {
        "preset": "missing-term", "mode": "and", "queryTerms": ["算法", "图形"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R2", "keywords": ["算法", "排序"]},
            {"id": "R3", "keywords": ["数据结构", "排序"]},
            {"id": "R4", "keywords": ["索引", "算法"]},
        ],
    },
    "single-term": {
        "preset": "single-term", "mode": "and", "queryTerms": ["算法"],
        "records": [
            {"id": "R1", "keywords": ["数据结构", "算法"]},
            {"id": "R2", "keywords": ["算法", "排序"]},
        ],
    },
}


def main():
    fixtures = ROOT / "src/test/fixtures"
    outputs = [
        ("file-index", FILE_INDEX_SOURCE, FILE_INDEX_CASES, "chapter12-file-index-frames.json"),
        ("isam", ISAM_SOURCE, ISAM_CASES, "chapter12-isam-frames.json"),
        ("inverted", INVERTED_SOURCE, INVERTED_CASES, "chapter12-inverted-frames.json"),
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
    print("wrote chapter 12 fixtures")


if __name__ == "__main__":
    main()

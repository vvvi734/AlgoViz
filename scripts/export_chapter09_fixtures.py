"""Export real CPython frames for TEXTBOOK-09 search modules.

Each JSON file executes the exact Python source shipped in the matching
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


BLOCK_SOURCE = extract(
    "blockSearchExamples.ts", "export const BLOCK_SEARCH_PYTHON = `", "block"
)
BPLUS_SOURCE = extract(
    "bplusExamples.ts", "export const BPLUS_TREE_PYTHON = `", "bplus"
)
KEY_SOURCE = extract("keyTreeExamples.ts", "export const KEY_TREE_PYTHON = `", "key")
BTREE_SOURCE = extract("btreeExamples.ts", "export const BTREE_PYTHON = `", "btree")


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


BLOCK_TREE = [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69]
BLOCK_CASES = {
    "hit-middle": {"preset": "hit-middle", "data": BLOCK_TREE, "blockSize": 4, "target": 38},
    "miss-between": {"preset": "miss-between", "data": BLOCK_TREE, "blockSize": 4, "target": 60},
    "hit-last-block": {
        "preset": "hit-last-block",
        "data": BLOCK_TREE,
        "blockSize": 4,
        "target": 73,
    },
    "hit-boundary": {
        "preset": "hit-boundary",
        "data": BLOCK_TREE,
        "blockSize": 4,
        "target": 35,
    },
    "hit-first-block": {
        "preset": "hit-first-block",
        "data": BLOCK_TREE,
        "blockSize": 4,
        "target": 8,
    },
    "miss-all": {"preset": "miss-all", "data": BLOCK_TREE, "blockSize": 4, "target": 99},
}

BPLUS_TREE_8 = [5, 10, 15, 20, 25, 30, 35, 40]
BPLUS_CASES = {
    "find-hit": {
        "preset": "find-hit",
        "tree": BPLUS_TREE_8,
        "operation": "find",
        "target": 25,
        "end": 33,
    },
    "find-miss": {
        "preset": "find-miss",
        "tree": BPLUS_TREE_8,
        "operation": "find",
        "target": 27,
        "end": 33,
    },
    "insert-leaf": {
        "preset": "insert-leaf",
        "tree": BPLUS_TREE_8,
        "operation": "insert",
        "target": 22,
        "end": 33,
    },
    "insert-leaf-split": {
        "preset": "insert-leaf-split",
        "tree": [10, 20, 30, 40, 50, 60, 70],
        "operation": "insert",
        "target": 55,
        "end": 33,
    },
    "insert-root-split": {
        "preset": "insert-root-split",
        "tree": [5, 10, 15, 20, 25, 30, 35, 40, 45],
        "operation": "insert",
        "target": 37,
        "end": 33,
    },
    "range-query": {
        "preset": "range-query",
        "tree": BPLUS_TREE_8,
        "operation": "range",
        "target": 18,
        "end": 33,
    },
}

KEY_WORDS = ["car", "card", "care", "cat", "dog", "do"]
KEY_CASES = {
    "shared-prefix-hit": {
        "preset": "shared-prefix-hit",
        "words": KEY_WORDS,
        "operation": "find",
        "target": "care",
    },
    "prefix-is-not-word": {
        "preset": "prefix-is-not-word",
        "words": KEY_WORDS,
        "operation": "find",
        "target": "ca",
    },
    "missing-branch": {
        "preset": "missing-branch",
        "words": KEY_WORDS,
        "operation": "find",
        "target": "cow",
    },
    "insert-shared": {
        "preset": "insert-shared",
        "words": KEY_WORDS,
        "operation": "insert",
        "target": "cargo",
    },
    "insert-new-branch": {
        "preset": "insert-new-branch",
        "words": KEY_WORDS,
        "operation": "insert",
        "target": "dot",
    },
    "insert-prefix": {
        "preset": "insert-prefix",
        "words": KEY_WORDS,
        "operation": "insert",
        "target": "ca",
    },
}

BTREE_CASES = {
    "delete-leaf-plain": {
        "preset": "delete-leaf-plain",
        "operation": "delete",
        "tree": [10, 20, 30, 40, 50, 60, 70],
        "target": 60,
    },
    "delete-internal-replace": {
        "preset": "delete-internal-replace",
        "operation": "delete",
        "tree": [21, 10, 26, 42, 4, 5, 35, 7],
        "target": 21,
    },
    "delete-borrow": {
        "preset": "delete-borrow",
        "operation": "delete",
        "tree": [27, 5, 16, 6, 36, 28, 4, 37],
        "target": 27,
    },
    "delete-merge": {
        "preset": "delete-merge",
        "operation": "delete",
        "tree": [45, 16, 6, 37, 20, 34, 32, 22],
        "target": 45,
    },
    "delete-root-shrink": {
        "preset": "delete-root-shrink",
        "operation": "delete",
        "tree": [17, 2, 34, 30, 21, 23, 29, 27, 49],
        "target": 17,
    },
    "delete-missing": {
        "preset": "delete-missing",
        "operation": "delete",
        "tree": [10, 20, 30, 40, 50, 60, 70],
        "target": 35,
    },
}


def main():
    outputs = [
        ("block", BLOCK_SOURCE, BLOCK_CASES, "chapter09-block-search-frames.json"),
        ("bplus", BPLUS_SOURCE, BPLUS_CASES, "chapter09-bplus-tree-frames.json"),
        ("key", KEY_SOURCE, KEY_CASES, "chapter09-key-tree-frames.json"),
        ("btree", BTREE_SOURCE, BTREE_CASES, "chapter09-btree-delete-frames.json"),
    ]
    fixtures = ROOT / "src/test/fixtures"
    for tag, source, cases, filename in outputs:
        bundle = {}
        for case, payload in cases.items():
            frames = run(source, payload, f"{tag}/{case}")
            bundle[case] = {"input": payload, "frames": frames}
            print(tag, case, len(frames), [frame["structure"]["operation"] for frame in frames])
        (fixtures / filename).write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print("wrote chapter 9 fixtures")


if __name__ == "__main__":
    main()

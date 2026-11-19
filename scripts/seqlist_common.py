"""Shared CPython harness for L1B sequential-list verification.

The shipped Python source is extracted from the TypeScript template literal and
run against a collector that records exactly what `trace(..., structure=...)`
received. This module has no reference model: it is only the independent
execution surface used by both the verifier and the fixture exporter.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
TS_PATH = ROOT / "src/domain/algorithms/sequentialListExamples.ts"


def extract_python() -> str:
    text = TS_PATH.read_text(encoding="utf-8")
    marker = "export const SEQUENTIAL_LIST_PYTHON = `"
    source = text.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in source, "unexpanded TypeScript template expression"
    return source


PYTHON = extract_python()


def run_case(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    """Execute the real teaching program in a fresh globals dict."""
    frames: list[dict[str, Any]] = []

    def trace(
        state: Any,
        message: str = "",
        line: int | None = None,
        variables: dict[str, Any] | None = None,
        lesson_step: str | None = None,
        structure: dict[str, Any] | None = None,
        **extra: Any,
    ) -> None:
        assert structure is not None, "sequential-list frame must carry structure"
        frames.append(
            {
                "state": copy.deepcopy(state),
                "message": message,
                "sourceLocation": {"line": line} if line is not None else None,
                "variables": copy.deepcopy(variables or {}),
                "lessonStepId": lesson_step,
                "structure": copy.deepcopy(structure),
                "extra": copy.deepcopy(extra),
            }
        )

    scope: dict[str, Any] = {
        "input": copy.deepcopy(cfg),
        "trace": trace,
        "__name__": "__main__",
    }
    exec(compile(PYTHON, "sequential_list_teaching.py", "exec"), scope)
    return frames


OFFICIAL: dict[str, dict[str, Any]] = {
    "access-middle": {
        "preset": "access-middle", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "access", "index": 2,
    },
    "access-out": {
        "preset": "access-out", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "access", "index": 9,
    },
    "search-hit": {
        "preset": "search-hit", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "search", "target": 30,
    },
    "search-miss": {
        "preset": "search-miss", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "search", "target": 99,
    },
    "insert-middle": {
        "preset": "insert-middle", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "insert", "index": 2, "value": 25,
    },
    "insert-head": {
        "preset": "insert-head", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "insert", "index": 0, "value": 5,
    },
    "insert-tail": {
        "preset": "insert-tail", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "insert", "index": 5, "value": 60,
    },
    "delete-middle": {
        "preset": "delete-middle", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "delete", "index": 1,
    },
    "delete-head": {
        "preset": "delete-head", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "delete", "index": 0,
    },
    "delete-tail": {
        "preset": "delete-tail", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "delete", "index": 4,
    },
    "traverse": {
        "preset": "traverse", "capacity": 8, "values": [10, 20, 30, 40, 50],
        "operation": "traverse",
    },
    "empty": {
        "preset": "empty", "capacity": 8, "values": [], "operation": "traverse",
    },
    "empty-delete": {
        "preset": "empty-delete", "capacity": 8, "values": [],
        "operation": "delete", "index": 0,
    },
    "full-insert": {
        "preset": "full-insert", "capacity": 8,
        "values": [1, 2, 3, 4, 5, 6, 7, 8], "operation": "insert", "index": 0, "value": 0,
    },
}


EDGE: dict[str, dict[str, Any]] = {
    "capacity-one": {
        "capacity": 1, "values": [7], "operation": "delete", "index": 0,
    },
    "capacity-one-full-insert": {
        "capacity": 1, "values": [7], "operation": "insert", "index": 0, "value": 6,
    },
    "negative-and-duplicate": {
        "capacity": 6, "values": [-5, 3, 3, 0, -5], "operation": "search", "target": 3,
    },
    "negative-values": {
        "capacity": 6, "values": [-1, -2, -3, -4, -5], "operation": "insert", "index": 2, "value": -9,
    },
    "access-zero": {
        "capacity": 5, "values": [4, 5], "operation": "access", "index": 0,
    },
    "access-negative": {
        "capacity": 5, "values": [4, 5], "operation": "access", "index": -1,
    },
    "access-empty": {
        "capacity": 5, "values": [], "operation": "access", "index": 0,
    },
    "insert-negative": {
        "capacity": 5, "values": [1, 2], "operation": "insert", "index": -1, "value": 0,
    },
    "insert-past-end": {
        "capacity": 5, "values": [1, 2], "operation": "insert", "index": 3, "value": 9,
    },
    "insert-at-empty": {
        "capacity": 3, "values": [], "operation": "insert", "index": 0, "value": 42,
    },
    "append-first-free": {
        "capacity": 4, "values": [1, 2], "operation": "insert", "index": 2, "value": 3,
    },
    "delete-negative": {
        "capacity": 5, "values": [1, 2], "operation": "delete", "index": -1,
    },
    "delete-past-end": {
        "capacity": 5, "values": [1, 2], "operation": "delete", "index": 2,
    },
    "delete-only": {
        "capacity": 3, "values": [9], "operation": "delete", "index": 0,
    },
    "delete-to-empty": {
        "capacity": 4, "values": [1], "operation": "delete", "index": 0,
    },
    "traverse-empty": {
        "capacity": 4, "values": [], "operation": "traverse",
    },
    "search-empty": {
        "capacity": 4, "values": [], "operation": "search", "target": 5,
    },
    "search-first": {
        "capacity": 5, "values": [5, 6, 7, 8], "operation": "search", "target": 5,
    },
    "search-last": {
        "capacity": 5, "values": [5, 6, 7, 8], "operation": "search", "target": 8,
    },
    "initial-over-capacity": {
        "capacity": 3, "values": [1, 2, 3, 4, 5], "operation": "traverse",
    },
    "full-delete-tail": {
        "capacity": 4, "values": [1, 2, 3, 4], "operation": "delete", "index": 3,
    },
}


def dump_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

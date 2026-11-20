"""Independent CPython check for MATRIX-01 sparse-matrix fast transpose.

The script reads the exact Python source shipped in `sparseTransposeExamples.ts`,
executes it with a local `trace()` collector, and compares every frame with an
independently written transpose reference. It also checks rectangular, empty,
single-entry and one-column/one-row matrices; invalid inputs must be rejected.
"""
from __future__ import annotations

import copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/sparseTransposeExamples.ts").read_text(encoding="utf-8")
MARKER = "export const SPARSE_TRANSPOSE_PYTHON = `"
SOURCE = TS.split(MARKER, 1)[1].split("`;", 1)[0]
assert "${" not in SOURCE, "unexpanded template expression"

OFFICIAL = {
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
    "official": OFFICIAL,
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
    "single": {
        "rows": 1,
        "cols": 1,
        "triples": [{"row": 0, "col": 0, "value": 9}],
    },
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


def num_ref(cols: int, triples: list[dict]) -> list[int]:
    num = [0] * cols
    for item in triples:
        num[item["col"]] += 1
    return num


def cpot_ref(num: list[int]) -> list[int]:
    cpot = [0] * len(num)
    for col in range(1, len(num)):
        cpot[col] = cpot[col - 1] + num[col - 1]
    return cpot


def transpose_ref(triples: list[dict], cols: int) -> list[dict]:
    cpot = cpot_ref(num_ref(cols, triples))
    result = [None] * len(triples)
    for item in triples:
        slot = cpot[item["col"]]
        result[slot] = {"row": item["col"], "col": item["row"], "value": item["value"]}
        cpot[item["col"]] += 1
    return result


def partial_ref(triples: list[dict], cols: int, processed: int) -> list:
    cpot = cpot_ref(num_ref(cols, triples))
    result = [None] * len(triples)
    for item in triples[:processed]:
        slot = cpot[item["col"]]
        result[slot] = {"row": item["col"], "col": item["row"], "value": item["value"]}
        cpot[item["col"]] += 1
    return result


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


def validate(payload, frames) -> list[str]:
    errors: list[str] = []
    rows = payload["rows"]
    cols = payload["cols"]
    triples = payload["triples"]
    count = len(triples)
    num = num_ref(cols, triples)
    starts = cpot_ref(num)
    final = transpose_ref(triples, cols)

    if not frames:
        return ["no frames"]
    if frames[0]["structure"].get("operation") != "init":
        errors.append("stream does not start with init")
    if frames[-1]["structure"].get("operation") != "done":
        errors.append("stream does not end with done")

    order = []
    cpot = starts[:]
    for item in triples:
        order.append(cpot[item["col"]])
        cpot[item["col"]] += 1

    counts = {"count-scan": 0, "cpot-compute": 0, "place-read": 0, "place-write": 0, "place-update": 0}
    for index, frame in enumerate(frames):
        snapshot = frame["structure"]
        if not isinstance(snapshot, dict) or snapshot.get("kind") != "sparse-transpose":
            errors.append(f"frame {index}: wrong structure")
            continue
        op = snapshot["operation"]
        if snapshot["rows"] != rows or snapshot["cols"] != cols or snapshot["triples"] != triples:
            errors.append(f"frame {index}: input changed")
        if len(snapshot["num"]) != cols or len(snapshot["cpot"]) != cols:
            errors.append(f"frame {index}: num/cpot length wrong")
        if len(snapshot["result"]) != count:
            errors.append(f"frame {index}: result length wrong")
        source = snapshot["sourceIndex"]
        target = snapshot["targetIndex"]
        if op in counts:
            counts[op] += 1

        if op in ("init", "count-start"):
            expected_num = [0] * cols
            expected_cpot = [0] * cols
            expected_result = [None] * count
        elif op == "count-scan":
            expected_num = num_ref(cols, triples[: source + 1])
            expected_cpot = [0] * cols
            expected_result = [None] * count
        elif op in ("count-complete", "cpot-start", "cpot-compute", "cpot-complete"):
            expected_num = num
            if op == "cpot-start":
                expected_cpot = [0] * cols
            elif op == "cpot-compute":
                active = snapshot["columnIndex"]
                expected_cpot = [starts[col] if col <= active else 0 for col in range(cols)]
            elif op == "cpot-complete":
                expected_cpot = starts
            else:
                expected_cpot = [0] * cols
            expected_result = [None] * count
        elif op == "place-start":
            expected_num = num
            expected_cpot = starts
            expected_result = [None] * count
        elif op == "done":
            expected_num = num
            expected_cpot = [starts[col] + num[col] for col in range(cols)]
            expected_result = final
        else:
            expected_num = num
            processed = source if op == "place-read" else source + 1
            expected_result = partial_ref(triples, cols, processed)
            active = triples[source]
            expected_cpot = starts[:]
            for item in triples[:source]:
                expected_cpot[item["col"]] += 1
            if op == "place-update":
                expected_cpot[active["col"]] += 1

        if snapshot["num"] != expected_num:
            errors.append(f"frame {index}/{op}: num mismatch")
        if snapshot["cpot"] != expected_cpot:
            errors.append(f"frame {index}/{op}: cpot mismatch")
        if snapshot["result"] != expected_result:
            errors.append(f"frame {index}/{op}: result mismatch")

        if op in ("count-scan", "place-read", "place-write", "place-update"):
            if source is None or not 0 <= source < count:
                errors.append(f"frame {index}/{op}: bad source")
            elif snapshot["columnIndex"] != triples[source]["col"]:
                errors.append(f"frame {index}/{op}: active column mismatch")
        if op in ("place-read", "place-write", "place-update"):
            if target != order[source]:
                errors.append(f"frame {index}/{op}: target slot {target} != {order[source]}")
        if op == "cpot-compute":
            active = snapshot["columnIndex"]
            if active is None or active < 1 or active >= cols:
                errors.append(f"frame {index}: bad cpot column")
            if snapshot["cpotReady"] != active + 1:
                errors.append(f"frame {index}: cpotReady wrong")
        if op == "cpot-start" and cols and snapshot["cpotReady"] != 1:
            errors.append("frame cpot-start: cpotReady != 1")
        if op == "done":
            if snapshot["result"] != final:
                errors.append("done result != reference")
            if snapshot["cpot"] != [starts[col] + num[col] for col in range(cols)]:
                errors.append("done cpot != starts + num")

    if counts["count-scan"] != count:
        errors.append(f"count-scan frames {counts['count-scan']} != {count}")
    if counts["cpot-compute"] != max(0, cols - 1):
        errors.append(f"cpot-compute frames {counts['cpot-compute']} != {max(0, cols - 1)}")
    for op in ("place-read", "place-write", "place-update"):
        if counts[op] != count:
            errors.append(f"{op} frames {counts[op]} != {count}")
    if frames[-1]["structure"]["result"] != final:
        errors.append("final result != reference")
    return errors


def expect_rejected(payload, label: str) -> None:
    try:
        run(payload)
    except ValueError as error:
        print(f"ok {label}: rejected ({error})")
        return
    raise SystemExit(f"{label}: invalid input was not rejected")


def main():
    total = 0
    for case, payload in CASES.items():
        frames = run(payload)
        errors = validate(payload, frames)
        total += len(frames)
        if len(frames) > 200:
            raise SystemExit(f"{case}: frame budget exceeded")
        if errors:
            print(f"FAIL {case}: {len(errors)} errors")
            for error in errors[:12]:
                print(f"  - {error}")
            raise SystemExit(1)
        print(f"ok {case}: {len(frames)} frames, result={frames[-1]['structure']['result']}")

    official = run(OFFICIAL)
    if official[-1]["structure"]["num"] != [2, 1, 3, 0, 0]:
        raise SystemExit(f"official num {official[-1]['structure']['num']} != [2,1,3,0,0]")
    if official[-1]["structure"]["cpot"] != [2, 3, 6, 6, 6]:
        raise SystemExit(f"official final cpot {official[-1]['structure']['cpot']} != [2,3,6,6,6]")

    expect_rejected({**OFFICIAL, "triples": [{"row": 0, "col": 2, "value": 7}, {"row": 0, "col": 0, "value": 3}]}, "unsorted")
    expect_rejected({**OFFICIAL, "triples": [{"row": 0, "col": 0, "value": 3}, {"row": 0, "col": 0, "value": 4}]}, "duplicate")
    expect_rejected({**OFFICIAL, "triples": [{"row": 0, "col": 0, "value": 0}]}, "zero_value")
    expect_rejected({**OFFICIAL, "rows": 2}, "out_of_bounds")
    expect_rejected({**OFFICIAL, "cols": 11}, "too_many_cols")

    print(f"verified {total} frames across {len(CASES)} cases")


if __name__ == "__main__":
    main()

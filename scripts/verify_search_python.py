"""Independent CPython verification for F1 sequential and binary search.

Reads the real Python shipped in `searchExamples.ts`, executes it with a local
`trace()` collector, and compares the whole operation stream with separately
written reference implementations. The reference never imports the app schema.
"""
from __future__ import annotations

import copy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/searchExamples.ts").read_text(encoding="utf-8")

SOURCES = {}
for name in ("LINEAR_PYTHON", "BINARY_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"linear": SOURCES["LINEAR_PYTHON"], "binary": SOURCES["BINARY_PYTHON"]}

OFFICIAL = {
    "linear": {"nums": [6, 3, 9, 2, 7, 4], "target": 7},
    "binary": {"nums": [1, 3, 5, 7, 9, 11, 13], "target": 9},
}
CASES = {
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
}
BINARY_CASES = {
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
}
BINARY_UNSORTED = {"nums": [3, 1, 2], "target": 2}


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


# ---------------------------------------------------------------------------
# Independent reference operation streams.
# ---------------------------------------------------------------------------

def linear_ref(payload):
    a = normalize(payload)
    target = payload.get("target")
    n = len(a)
    result = []

    def emit(operation, **fields):
        entry = {
            "operation": operation,
            "index": None,
            "checked": [],
            "matched": None,
            "result": None,
            "found": None,
            **fields,
        }
        result.append(entry)

    emit("init")
    if n == 0:
        emit("not-found", checked=[], result=-1, found=False)
        return result
    emit("scan-start", index=0)
    for i, value in enumerate(a):
        matched = value == target
        emit("scan-compare", index=i, checked=list(range(i)), matched=matched)
        if matched:
            emit("found", index=i, checked=list(range(i)), result=i, found=True, matched=True)
            return result
        if i + 1 < n:
            emit("scan-next", index=i + 1, checked=list(range(i + 1)))
    emit("not-found", checked=list(range(n)), result=-1, found=False)
    return result


def binary_ref(payload):
    a = normalize(payload)
    target = payload.get("target")
    n = len(a)
    result = []

    def emit(operation, **fields):
        entry = {
            "operation": operation,
            "left": None,
            "right": None,
            "mid": None,
            "comparison": None,
            "matched": None,
            "index": None,
            "result": None,
            "found": None,
            "reason": None,
            **fields,
        }
        result.append(entry)

    if n == 0:
        emit("binary-init", left=0, right=-1)
        emit("binary-not-found", left=0, right=-1, result=-1, found=False)
        return result
    if any(a[i] > a[i + 1] for i in range(n - 1)):
        emit("invalid", reason="unsorted")
        return result

    left, right = 0, n - 1
    emit("binary-init", left=left, right=right)
    while left <= right:
        mid = (left + right) // 2
        emit("binary-mid", left=left, right=right, mid=mid)
        if a[mid] == target:
            emit("binary-compare", left=left, right=right, mid=mid,
                 comparison="equal", matched=True)
            emit("binary-found", left=left, right=right, mid=mid, index=mid,
                 result=mid, found=True, comparison="equal", matched=True)
            return result
        if a[mid] < target:
            emit("binary-compare", left=left, right=right, mid=mid,
                 comparison="less", matched=False)
            left = mid + 1
            emit("binary-exclude-left", left=left, right=right, mid=mid,
                 comparison="less", matched=False)
        else:
            emit("binary-compare", left=left, right=right, mid=mid,
                 comparison="greater", matched=False)
            right = mid - 1
            emit("binary-exclude-right", left=left, right=right, mid=mid,
                 comparison="greater", matched=False)
    emit("binary-not-found", left=left, right=right, result=-1, found=False)
    return result


REFERENCES = {"linear": linear_ref, "binary": binary_ref}


def live_range(structure):
    left, right = structure["left"], structure["right"]
    if left is None or right is None or left > right:
        return None
    return {"low": left, "high": right}


def validate(algorithm, payload, frames):
    errors = []
    expected = REFERENCES[algorithm](payload)
    a = normalize(payload)
    target = payload.get("target")

    if len(frames) != len(expected):
        return [f"frame count {len(frames)} != reference {len(expected)}"]

    for index, (actual, want) in enumerate(zip(frames, expected)):
        structure = actual["structure"]
        state = actual["state"]
        if structure.get("kind") != "search":
            errors.append(f"frame {index}: kind is not search")
            continue
        if structure.get("algorithm") != algorithm:
            errors.append(f"frame {index}: algorithm mismatch")
        if state.get("type") != "array":
            errors.append(f"frame {index}: state is not an array")
        values = [cell["value"] for cell in structure["elements"]]
        if values != a:
            errors.append(f"frame {index}: elements {values!r} != input {a!r}")
        if state.get("values") != values:
            errors.append(f"frame {index}: state and elements disagree")
        if [cell["id"] for cell in structure["elements"]] != [f"p{i}" for i in range(len(a))]:
            errors.append(f"frame {index}: slot ids are not p0..p(n-1)")
        for field in ("operation", "index", "matched", "result", "found"):
            if structure.get(field) != want[field]:
                errors.append(f"frame {index}: {field} {structure.get(field)!r} != {want[field]!r}")
        if algorithm == "linear" and structure.get("checked") != want["checked"]:
            errors.append(f"frame {index}: checked {structure.get('checked')!r} != {want['checked']!r}")

        if algorithm == "linear":
            if any(structure.get(field) is not None for field in ("left", "right", "mid", "range", "comparison")):
                errors.append(f"frame {index}: linear search leaked binary fields")
            checked = structure["checked"]
            if checked != list(range(len(checked))):
                errors.append(f"frame {index}: checked is not a prefix")
            if structure["operation"] in ("scan-compare", "found"):
                if checked != list(range(structure["index"])):
                    errors.append(f"frame {index}: checked prefix does not stop before current index")
        else:
            if structure.get("checked") != []:
                errors.append(f"frame {index}: binary search leaked a checked list")
            if structure["operation"] != "invalid":
                if structure["range"] != live_range(structure):
                    errors.append(f"frame {index}: range is not derived from left/right")
                if structure["operation"] in ("binary-mid", "binary-compare", "binary-found"):
                    if structure["left"] <= structure["right"] and structure["mid"] is not None:
                        if not (structure["left"] <= structure["mid"] <= structure["right"]):
                            errors.append(f"frame {index}: mid outside live interval")
            else:
                for field, value in (
                    ("left", None), ("right", None), ("mid", None), ("range", None),
                    ("index", None), ("result", None), ("found", None),
                    ("matched", None), ("comparison", None),
                ):
                    if structure.get(field) != value:
                        errors.append(f"frame {index}: invalid frame carries {field}")

        for field in ("left", "right", "mid", "comparison", "matched", "reason"):
            if algorithm == "binary" and structure.get(field) != want[field]:
                errors.append(f"frame {index}: {field} {structure.get(field)!r} != {want[field]!r}")

    # Terminal result and search properties.
    final = frames[-1]["structure"]
    if algorithm == "linear":
        if final["operation"] not in ("found", "not-found"):
            errors.append("linear search did not end with found/not-found")
        if final["operation"] == "found":
            first = a.index(target)
            if final["result"] != first:
                errors.append(f"linear search returned {final['result']}, expected first match {first}")
        elif final["result"] != -1:
            errors.append("linear not-found must return -1")
    else:
        if final["operation"] not in ("binary-found", "binary-not-found", "invalid"):
            errors.append("binary search did not end with a terminal frame")
        if final["operation"] == "binary-not-found" and final["left"] <= final["right"]:
            errors.append("binary not-found must end with left > right")
        if final["operation"] == "binary-found":
            if a[final["result"]] != target:
                errors.append("binary found index does not hold the target")

    # Every exclusion must discard a half that cannot contain the target.
    if algorithm == "binary" and target in a:
        for index, entry in enumerate(frames):
            structure = entry["structure"]
            if structure["operation"] not in ("binary-exclude-left", "binary-exclude-right"):
                continue
            mid = structure["mid"]
            if structure["operation"] == "binary-exclude-left":
                discarded = a[: mid + 1]
                if any(value == target for value in discarded):
                    errors.append(f"frame {index}: left exclusion discarded the target")
            else:
                discarded = a[mid:]
                if any(value == target for value in discarded):
                    errors.append(f"frame {index}: right exclusion discarded the target")

    return errors


def main():
    total = 0
    for algorithm in ("linear", "binary"):
        print(f"[{algorithm}]")
        cases = [("official", OFFICIAL[algorithm]), *CASES.items()]
        if algorithm == "binary":
            cases = [("official", OFFICIAL[algorithm]), *BINARY_CASES.items(), ("unsorted", BINARY_UNSORTED)]
        for case, payload in cases:
            frames = run(algorithm, payload)
            errors = validate(algorithm, payload, frames)
            total += len(frames)
            if len(frames) > 500:
                raise SystemExit(f"{algorithm}/{case}: frame budget exceeded")
            if errors:
                print(f"  FAIL {case}: {len(errors)} errors")
                for error in errors[:8]:
                    print(f"    - {error}")
                raise SystemExit(1)
            print(f"  ok {case}: {len(frames)} frames")

    # Dedicated duplicate and unsorted checks.
    dup = run("binary", {"nums": [2, 2, 2, 3], "target": 2})
    dup_result = dup[-1]["structure"]["result"]
    if dup[-1]["structure"]["operation"] != "binary-found" or dup_result not in (0, 1, 2):
        raise SystemExit("duplicate binary result is not a valid matching index")
    print(f"duplicate binary: valid index {dup_result}")
    unsorted = run("binary", BINARY_UNSORTED)
    if len(unsorted) != 1 or unsorted[0]["structure"]["operation"] != "invalid":
        raise SystemExit("unsorted input produced a fake binary animation")
    if unsorted[0]["structure"]["reason"] != "unsorted":
        raise SystemExit("unsorted frame lacks an explicit reason")
    print("unsorted binary: one explicit invalid frame, no search progress")
    print(f"verified {total} frames across linear/binary and {len(CASES) + len(BINARY_CASES) + 3} inputs")


if __name__ == "__main__":
    main()

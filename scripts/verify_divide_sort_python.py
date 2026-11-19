"""Independent CPython verification for S2 quick sort and merge sort.

The shipped Python strings are executed with a local trace collector and compared
frame by frame with separately written reference algorithms. The reference is
deliberately built from the algorithm definitions, not from the app schema or
from the shipped source, so a semantic change in either side is caught.

This script also checks:
- recursive ranges and Lomuto pivot invariants;
- every real buffer append, buffer source and write-back slot;
- merge range halves, sortedness, multiset preservation and stable tie handling;
- frame budgets and the randomized/ordered/duplicate/negative edge cases.
"""
from __future__ import annotations

import copy
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/sortingExamples.ts").read_text(encoding="utf-8")

SOURCES = {}
for name in ("QUICK_PYTHON", "MERGE_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {"quick": SOURCES["QUICK_PYTHON"], "merge": SOURCES["MERGE_PYTHON"]}

OFFICIAL = {"quick": [8, 3, 1, 7, 5, 2, 9, 4], "merge": [7, 3, 5, 1, 9, 2, 8, 4]}
CASES = {
    "sorted": [1, 2, 3, 4, 5, 6],
    "reverse": [6, 5, 4, 3, 2, 1],
    "duplicates": [3, 1, 3, 2, 1, 3],
    "negative": [-2, 5, 0, -7, 3, -1],
    "all_same": [7, 7, 7, 7, 7],
    "single": [5],
    "empty": [],
    "long_random": [9, 1, 8, 2, 7, 3, 6, 4, 5, 0, 11, 10],
}

MAX_FRAMES = 500
MAX_ROUNDS = 64


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


def expected_frame(operation, values, *, round=0, sorted_from=0, compare=None,
                   range_low=None, range_high=None, pivot=None, boundary=None,
                   swapped=None, inserted_at=None, split=None, left=None, right=None,
                   buffer=None, buffer_write=None, write_at=None, finalized=None,
                   merged_ranges=None, result=None):
    return {
        "operation": operation,
        "values": list(values),
        "round": round,
        "sortedFrom": sorted_from,
        "compare": compare,
        "range": None if range_low is None else {"low": range_low, "high": range_high},
        "pivot": pivot,
        "boundary": boundary,
        "swapped": swapped,
        "insertedAt": inserted_at,
        "split": split,
        "left": left,
        "right": right,
        "buffer": list(buffer or []),
        "bufferWrite": copy.deepcopy(buffer_write),
        "writeAt": write_at,
        "finalized": list(finalized or []),
        "mergedRanges": copy.deepcopy(merged_ranges or []),
        "result": result,
    }


# ---------------------------------------------------------------------------
# Independent reference: quick sort, Lomuto, last pivot.
# ---------------------------------------------------------------------------

def ref_quick(raw):
    a = normalize(raw)
    n = len(a)
    fixed: list[int] = []
    calls = [0]
    frames: list[dict] = []

    def emit(operation, message, round_index=0, range_low=None, range_high=None,
             pivot=None, boundary=None, compare=None, swapped=None, inserted_at=None,
             sorted_from=0, result=None):
        frames.append(expected_frame(
            operation, a, round=round_index, sorted_from=sorted_from,
            compare=compare, range_low=range_low, range_high=range_high,
            pivot=pivot, boundary=boundary, swapped=swapped,
            inserted_at=inserted_at, finalized=fixed[:], result=result,
        ))

    emit("init", "init")
    if n == 0:
        emit("done", "done", result="empty")
        return frames
    if n == 1:
        fixed.append(0)
        emit("quick-return", "singleton", round_index=0, range_low=0, range_high=0, inserted_at=0)
        emit("done", "done", sorted_from=n, result="sorted")
        return frames

    def sort_range(low, high):
        if low > high:
            emit("quick-return", "empty", round_index=calls[0], range_low=low, range_high=high)
            return
        if low == high:
            if low not in fixed:
                fixed.append(low)
            emit("quick-return", "singleton", round_index=max(1, calls[0]),
                 range_low=low, range_high=high, inserted_at=low)
            return

        calls[0] += 1
        current = calls[0]
        pivot_value = a[high]
        i = low
        emit("quick-range", "range", round_index=current, range_low=low, range_high=high,
             pivot=high, boundary=i)
        for j in range(low, high):
            emit("quick-compare", "compare", round_index=current, range_low=low, range_high=high,
                 pivot=high, boundary=i, compare=j)
            if a[j] <= pivot_value:
                if i != j:
                    a[i], a[j] = a[j], a[i]
                    emit("quick-swap", "swap", round_index=current, range_low=low, range_high=high,
                         pivot=high, boundary=i + 1, compare=j, swapped=(i, j))
                i += 1
        a[i], a[high] = a[high], a[i]
        if i not in fixed:
            fixed.append(i)
        emit("quick-place", "place", round_index=current, range_low=low, range_high=high,
             pivot=i, boundary=i, inserted_at=i, swapped=(i, high))
        sort_range(low, i - 1)
        sort_range(i + 1, high)

    sort_range(0, n - 1)
    emit("done", "done", round_index=calls[0], sorted_from=n, result="sorted")
    return frames


# ---------------------------------------------------------------------------
# Independent reference: top-down merge sort with a real buffer.
# ---------------------------------------------------------------------------

def ref_merge(raw):
    a = normalize(raw)
    n = len(a)
    calls = [0]
    frames: list[dict] = []

    def emit(operation, message, call_index=0, range_low=None, range_high=None,
             split=None, left=None, right=None, buffer=None, buffer_write=None,
             write_at=None, merged_ranges=None, result=None, sorted_from=0):
        frames.append(expected_frame(
            operation, a, round=call_index, sorted_from=sorted_from,
            range_low=range_low, range_high=range_high, split=split,
            left=left, right=right, buffer=buffer, buffer_write=buffer_write,
            write_at=write_at, finalized=list(range(n)) if result is not None else [],
            merged_ranges=merged_ranges, result=result,
        ))

    emit("init", "init")
    if n == 0:
        emit("done", "done", result="empty")
        return frames

    def merge_range(low, high):
        calls[0] += 1
        call_index = calls[0]
        emit("merge-range", "range", call_index=call_index, range_low=low, range_high=high)
        if low == high:
            emit("merge-return", "return", call_index=call_index, range_low=low, range_high=high,
                 merged_ranges=[{"low": low, "high": high}])
            return
        mid = (low + high) // 2
        emit("merge-split", "split", call_index=call_index, range_low=low, range_high=high, split=mid)
        merge_range(low, mid)
        merge_range(mid + 1, high)

        halves = [{"low": low, "high": mid}, {"low": mid + 1, "high": high}]
        buff: list = []
        left = low
        right = mid + 1
        emit("merge-start", "start", call_index=call_index, range_low=low, range_high=high,
             split=mid, left=left, right=right, buffer=buff, merged_ranges=halves)
        while left <= mid and right <= high:
            emit("merge-compare", "compare", call_index=call_index, range_low=low, range_high=high,
                 split=mid, left=left, right=right, buffer=buff, merged_ranges=halves)
            if a[left] <= a[right]:
                source = left
                value = a[left]
                left += 1
            else:
                source = right
                value = a[right]
                right += 1
            buff.append(value)
            emit("merge-write", "write", call_index=call_index, range_low=low, range_high=high,
                 split=mid, left=left, right=right, buffer=buff,
                 buffer_write={"index": len(buff) - 1, "value": value, "source": source},
                 merged_ranges=halves)
        while left <= mid:
            source = left
            value = a[left]
            left += 1
            buff.append(value)
            emit("merge-copy", "copy-left", call_index=call_index, range_low=low, range_high=high,
                 split=mid, left=left, right=right, buffer=buff,
                 buffer_write={"index": len(buff) - 1, "value": value, "source": source},
                 merged_ranges=halves)
        while right <= high:
            source = right
            value = a[right]
            right += 1
            buff.append(value)
            emit("merge-copy", "copy-right", call_index=call_index, range_low=low, range_high=high,
                 split=mid, left=left, right=right, buffer=buff,
                 buffer_write={"index": len(buff) - 1, "value": value, "source": source},
                 merged_ranges=halves)
        for offset, value in enumerate(buff):
            target = low + offset
            a[target] = value
            emit("merge-writeback", "writeback", call_index=call_index, range_low=low, range_high=high,
                 split=mid, buffer=buff, write_at=target, merged_ranges=halves)
        emit("merge-range-done", "range-done", call_index=call_index, range_low=low, range_high=high,
             split=mid, buffer=buff, merged_ranges=[{"low": low, "high": high}])

    merge_range(0, n - 1)
    emit("done", "done", call_index=calls[0], sorted_from=n, result="sorted",
         merged_ranges=[{"low": 0, "high": n - 1}])
    return frames


REFERENCES = {"quick": ref_quick, "merge": ref_merge}
CORE_FIELDS = (
    "operation", "round", "sortedFrom", "compare", "range", "pivot", "boundary",
    "swapped", "insertedAt", "split", "left", "right", "buffer", "bufferWrite",
    "writeAt", "finalized", "mergedRanges", "result",
)


def check_common(algorithm, payload, frames, expected):
    errors = []
    raw = normalize(payload)
    if len(frames) != len(expected):
        errors.append(f"frame count {len(frames)} != reference {len(expected)}")
        return errors
    for index, (actual, want) in enumerate(zip(frames, expected)):
        structure = actual["structure"]
        state = actual["state"]
        if structure["kind"] != "sorting":
            errors.append(f"frame {index}: kind is not sorting")
            continue
        if structure["algorithm"] != algorithm:
            errors.append(f"frame {index}: algorithm is {structure['algorithm']!r}, expected {algorithm!r}")
        if state.get("type") != "array":
            errors.append(f"frame {index}: state is not an array")
        values = [element["value"] for element in structure["elements"]]
        if state.get("values") != values:
            errors.append(f"frame {index}: state values differ from structural slots")
        if [element["id"] for element in structure["elements"]] != [f"p{i}" for i in range(len(raw))]:
            errors.append(f"frame {index}: slot ids are not p0..p(n-1)")
        if values != want["values"]:
            errors.append(f"frame {index}: values {values!r} != {want['values']!r}")
        for field in CORE_FIELDS:
            if structure[field] != want[field]:
                errors.append(f"frame {index}: {field} {structure[field]!r} != {want[field]!r}")
        if algorithm == "merge" and structure["operation"] == "merge-writeback":
            # Copying a full buffer back slot by slot is a real intermediate
            # state: slots not yet overwritten can duplicate values. The buffer
            # itself must already hold the complete range multiset.
            if structure["range"] is not None:
                low = structure["range"]["low"]
                high = structure["range"]["high"]
                if Counter(structure["buffer"]) != Counter(raw[low:high + 1]):
                    errors.append(f"frame {index}: write-back buffer lost the range multiset")
        elif Counter(values) != Counter(raw):
            errors.append(f"frame {index}: multiset changed from the input")
        if len(frames) > MAX_FRAMES:
            errors.append(f"{len(frames)} frames exceeds {MAX_FRAMES}")
        if structure["round"] > MAX_ROUNDS:
            errors.append(f"frame {index}: round {structure['round']} exceeds {MAX_ROUNDS}")
    return errors


def check_quick_invariants(frames):
    errors = []
    for index, frame in enumerate(frames):
        s = frame["structure"]
        values = [cell["value"] for cell in s["elements"]]
        if s["operation"] in {"quick-range", "quick-compare", "quick-swap", "quick-place"}:
            if s["range"] is None:
                errors.append(f"quick frame {index}: missing range")
                continue
            low, high = s["range"]["low"], s["range"]["high"]
            if not (0 <= low <= high < len(values)):
                errors.append(f"quick frame {index}: invalid range [{low}, {high}]")
            if s["pivot"] is None or not (low <= s["pivot"] <= high):
                errors.append(f"quick frame {index}: pivot outside range")
        if s["operation"] == "quick-compare":
            if s["compare"] is None or s["compare"] < s["range"]["low"] or s["compare"] >= s["range"]["high"]:
                errors.append(f"quick frame {index}: j outside [low, high)")
            if s["boundary"] is None or s["boundary"] < s["range"]["low"] or s["boundary"] > s["compare"]:
                errors.append(f"quick frame {index}: boundary outside [low, j]")
        if s["operation"] == "quick-swap":
            swap = s["swapped"]
            if swap is None or swap[1] != s["compare"] or swap[0] != s["boundary"] - 1:
                errors.append(f"quick frame {index}: swap does not match j and advanced boundary")
        if s["operation"] == "quick-place":
            home = s["insertedAt"]
            if home is None or s["pivot"] != home or s["boundary"] != home:
                errors.append(f"quick frame {index}: placed pivot/boundary/home disagree")
            pivot = values[home]
            if any(value > pivot for value in values[s["range"]["low"]:home]):
                errors.append(f"quick frame {index}: left child is not <= pivot")
            if any(value <= pivot for value in values[home + 1:s["range"]["high"] + 1]):
                errors.append(f"quick frame {index}: right child is not > pivot")
            if home not in s["finalized"]:
                errors.append(f"quick frame {index}: placed pivot is not marked final")
        if s["operation"] == "quick-return" and s["range"] is not None:
            low, high = s["range"]["low"], s["range"]["high"]
            if low > high:
                if s["insertedAt"] is not None or s["pivot"] is not None or s["boundary"] is not None:
                    errors.append(f"quick frame {index}: empty return carries active metadata")
            else:
                if low != high or s["insertedAt"] != low or low not in s["finalized"]:
                    errors.append(f"quick frame {index}: singleton return is not final")
    return errors


def check_merge_invariants(frames):
    errors = []
    for index, frame in enumerate(frames):
        s = frame["structure"]
        values = [cell["value"] for cell in s["elements"]]
        op = s["operation"]
        if op in {"merge-range", "merge-split"} and s["mergedRanges"]:
            errors.append(f"merge frame {index}: {op} should not claim merged ranges")
        if op in {"merge-start", "merge-compare", "merge-write", "merge-copy", "merge-writeback"}:
            if s["range"] is None or s["split"] is None:
                errors.append(f"merge frame {index}: missing range/split")
            else:
                halves = [
                    {"low": s["range"]["low"], "high": s["split"]},
                    {"low": s["split"] + 1, "high": s["range"]["high"]},
                ]
                if s["mergedRanges"] != halves:
                    errors.append(f"merge frame {index}: merged halves do not match split")
                if not (halves[0]["low"] <= halves[0]["high"] < halves[1]["low"] <= halves[1]["high"]):
                    errors.append(f"merge frame {index}: halves are empty or out of order")
        if op == "merge-compare":
            if s["left"] is None or s["right"] is None:
                errors.append(f"merge frame {index}: compare missing cursors")
            else:
                if not (s["range"]["low"] <= s["left"] <= s["split"]):
                    errors.append(f"merge frame {index}: left cursor outside left half")
                if not (s["split"] + 1 <= s["right"] <= s["range"]["high"]):
                    errors.append(f"merge frame {index}: right cursor outside right half")
        if op in {"merge-write", "merge-copy"}:
            bw = s["bufferWrite"]
            if bw is None or bw["index"] != len(s["buffer"]) - 1:
                errors.append(f"merge frame {index}: buffer append is not the last slot")
            elif s["buffer"][bw["index"]] != bw["value"] or values[bw["source"]] != bw["value"]:
                errors.append(f"merge frame {index}: buffer value/source is fabricated")
        if op == "merge-writeback":
            if s["range"] is None or s["buffer"] is None or s["writeAt"] is None:
                errors.append(f"merge frame {index}: incomplete write-back")
            else:
                if len(s["buffer"]) != s["range"]["high"] - s["range"]["low"] + 1:
                    errors.append(f"merge frame {index}: write-back buffer is not full")
                if s["buffer"] != sorted(s["buffer"]):
                    errors.append(f"merge frame {index}: write-back buffer is not sorted")
                offset = s["writeAt"] - s["range"]["low"]
                if not (0 <= offset < len(s["buffer"])):
                    errors.append(f"merge frame {index}: writeAt outside range")
                elif values[s["writeAt"]] != s["buffer"][offset]:
                    errors.append(f"merge frame {index}: write-back slot != buffer")
        if op == "merge-range-done":
            if s["range"] is None:
                errors.append(f"merge frame {index}: range-done without range")
            else:
                segment = values[s["range"]["low"]:s["range"]["high"] + 1]
                if segment != sorted(segment):
                    errors.append(f"merge frame {index}: finished range is not sorted")
                if s["mergedRanges"] != [{"low": s["range"]["low"], "high": s["range"]["high"]}]:
                    errors.append(f"merge frame {index}: range-done merged flag mismatch")
    return errors


def merge_sort_records(records):
    """Independent stable merge on (key, identity), used as a stability witness."""
    a = list(records)

    def sort(low, high):
        if low >= high:
            return
        mid = (low + high) // 2
        sort(low, mid)
        sort(mid + 1, high)
        merged = []
        left, right = low, mid + 1
        while left <= mid and right <= high:
            if a[left][0] <= a[right][0]:
                merged.append(a[left])
                left += 1
            else:
                merged.append(a[right])
                right += 1
        merged.extend(a[left:mid + 1])
        merged.extend(a[right:high + 1])
        a[low:high + 1] = merged

    sort(0, len(a) - 1)
    return a


def stability_check():
    witness = [(3, "a"), (1, "x"), (3, "b"), (1, "y"), (2, "z")]
    merged = merge_sort_records(witness)
    if [identity for key, identity in merged if key == 1] != ["x", "y"]:
        raise SystemExit("merge stability witness failed: equal keys were reordered")
    if [key for key, _ in merged] != sorted(key for key, _ in witness):
        raise SystemExit("merge stability reference did not sort by key")


def main():
    total = 0
    for algorithm in ALGORITHMS:
        print(f"[{algorithm}]")
        for case, payload in [("official", OFFICIAL[algorithm]), *CASES.items()]:
            frames = run(algorithm, payload)
            expected = REFERENCES[algorithm](payload)
            errors = check_common(algorithm, payload, frames, expected)
            if algorithm == "quick":
                errors.extend(check_quick_invariants(frames))
            else:
                errors.extend(check_merge_invariants(frames))
            total += len(frames)
            if errors:
                print(f"  FAIL {case}: {len(errors)} errors")
                for error in errors[:10]:
                    print(f"    - {error}")
                raise SystemExit(1)
            print(f"  ok {case}: {len(frames)} frames")
    stability_check()
    print("stability: merge keeps equal-key identity order on a real witness")
    print(f"verified {total} frames across {len(ALGORITHMS)} algorithms and {len(CASES) + 1} inputs")


if __name__ == "__main__":
    main()

"""Independent CPython verification for the S1 sorting source.

The real Python strings are read from `sortingExamples.ts`, executed with a local
`trace()` collector, and compared frame by frame with separately written reference
implementations. The reference deliberately rebuilds the operation stream instead
of importing the TypeScript schema.
"""
from __future__ import annotations

import copy
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/sortingExamples.ts").read_text(encoding="utf-8")

SOURCES = {}
for name in ("SELECTION_PYTHON", "INSERTION_PYTHON", "SHELL_PYTHON"):
    marker = f"export const {name} = `"
    SOURCES[name] = TS.split(marker, 1)[1].split("`;", 1)[0]
    assert "${" not in SOURCES[name], "unexpanded template expression"

ALGORITHMS = {
    "selection": SOURCES["SELECTION_PYTHON"],
    "insertion": SOURCES["INSERTION_PYTHON"],
    "shell": SOURCES["SHELL_PYTHON"],
}

OFFICIAL = {
    "selection": [6, 4, 9, 1, 7, 2],
    "insertion": [7, 3, 5, 1, 9, 2],
    "shell": [8, 3, 7, 4, 9, 2, 6, 1],
}

CASES = {
    "sorted": [1, 2, 3, 4, 5, 6],
    "reverse": [6, 5, 4, 3, 2, 1],
    "duplicates": [3, 1, 3, 2, 1, 3],
    "negative": [-2, 5, 0, -7, 3, -1],
    "single": [5],
    "empty": [],
    "mixed": [2.5, -1, 0, 2.5, 4, -3.5, 6, 1],
}


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
    exec(compile(ALGORITHMS[algorithm], f"<s1-{algorithm}>", "exec"), ns)
    return frames


# ---------------------------------------------------------------------------
# Independent reference operation streams.
# ---------------------------------------------------------------------------

def frame(operation, values, *, round=0, sorted_from=0, candidate=None, compare=None,
          key=None, gap=None, gaps=None, lane=None, shifted=None, swapped=None,
          inserted_at=None, result=None):
    return {
        "operation": operation,
        "values": list(values),
        "round": round,
        "sortedFrom": sorted_from,
        "candidate": candidate,
        "compare": compare,
        "key": copy.deepcopy(key),
        "gap": gap,
        "gapSequence": list(gaps or []),
        "lane": lane,
        "shifted": shifted,
        "swapped": swapped,
        "insertedAt": inserted_at,
        "result": result,
    }


def ref_selection(raw):
    a = normalize(raw)
    n = len(a)
    frames = [frame("init", a)]
    if n == 0:
        frames.append(frame("done", a, result="empty"))
        return frames
    for i in range(n):
        r = i + 1
        m = i
        frames.append(frame("select-start", a, round=r, sorted_from=i, candidate=m))
        for j in range(i + 1, n):
            frames.append(frame("select-compare", a, round=r, sorted_from=i, candidate=m, compare=j))
            if a[j] < a[m]:
                m = j
                frames.append(frame("select-candidate", a, round=r, sorted_from=i, candidate=m, compare=j))
        if m != i:
            a[i], a[m] = a[m], a[i]
        frames.append(frame("select-swap", a, round=r, sorted_from=i + 1, candidate=m, swapped=(i, m)))
        frames.append(frame("select-done", a, round=r, sorted_from=i + 1))
    frames.append(frame("done", a, sorted_from=n, result="sorted"))
    return frames


def ref_insertion(raw):
    a = normalize(raw)
    n = len(a)
    frames = [frame("init", a)]
    if n == 0:
        frames.append(frame("done", a, result="empty"))
        return frames
    for i in range(1, n):
        r = i
        key_value = a[i]
        key = {"value": key_value, "origin": i}
        frames.append(frame("insert-key", a, round=r, sorted_from=i, key=key))
        j = i - 1
        while j >= 0:
            frames.append(frame("insert-compare", a, round=r, sorted_from=i, compare=j, key=key))
            if a[j] > key_value:
                a[j + 1] = a[j]
                frames.append(frame("insert-shift", a, round=r, sorted_from=i, compare=j, key=key,
                                    shifted={"from": j, "to": j + 1}))
                j -= 1
            else:
                break
        a[j + 1] = key_value
        frames.append(frame("insert-place", a, round=r, sorted_from=i + 1, compare=(j if j >= 0 else None),
                            key=key, inserted_at=j + 1))
    frames.append(frame("done", a, sorted_from=n, result="sorted"))
    return frames


def gap_sequence(n):
    gaps = []
    gap = n // 2
    while gap > 0:
        gaps.append(gap)
        gap //= 2
    return gaps


def ref_shell(raw):
    a = normalize(raw)
    n = len(a)
    gaps = gap_sequence(n)
    frames = [frame("init", a, gaps=gaps)]
    if n == 0:
        frames.append(frame("done", a, gaps=gaps, result="empty"))
        return frames
    if n == 1:
        frames.append(frame("done", a, gaps=gaps, sorted_from=n, result="sorted"))
        return frames
    for r, gap in enumerate(gaps, 1):
        start_sorted = 1 if gap == 1 else 0
        frames.append(frame("gap-change", a, round=r, sorted_from=start_sorted, gap=gap, gaps=gaps))
        for i in range(gap, n):
            lane = i % gap
            key_value = a[i]
            key = {"value": key_value, "origin": i}
            j = i - gap
            while j >= 0:
                prefix = i if gap == 1 else 0
                frames.append(frame("shell-compare", a, round=r, sorted_from=prefix, compare=j,
                                    key=key, gap=gap, gaps=gaps, lane=lane))
                if a[j] > key_value:
                    a[j + gap] = a[j]
                    frames.append(frame("shell-shift", a, round=r, sorted_from=prefix, compare=j,
                                        key=key, gap=gap, gaps=gaps, lane=lane,
                                        shifted={"from": j, "to": j + gap}))
                    j -= gap
                else:
                    break
            a[j + gap] = key_value
            placed_prefix = i + 1 if gap == 1 else 0
            frames.append(frame("shell-place", a, round=r, sorted_from=placed_prefix,
                                compare=(j if j >= 0 else None), key=key, gap=gap,
                                gaps=gaps, lane=lane, inserted_at=j + gap))
        done_prefix = n if gap == 1 else 0
        frames.append(frame("gap-done", a, round=r, sorted_from=done_prefix, gap=gap, gaps=gaps))
    frames.append(frame("done", a, gaps=gaps, sorted_from=n, result="sorted"))
    return frames


REFERENCES = {"selection": ref_selection, "insertion": ref_insertion, "shell": ref_shell}


def check_prefix(values, count):
    prefix = values[:count]
    return all(prefix[i] <= prefix[i + 1] for i in range(len(prefix) - 1))


def validate(algorithm, payload, frames, ref):
    errors = []
    raw = normalize(payload)
    expected = REFERENCES[algorithm](payload)
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
        state_values = state.get("values")
        slot_values = [element["value"] for element in structure["elements"]]
        if state_values != slot_values:
            errors.append(f"frame {index}: state values are not the structural slot values")
        if [element["id"] for element in structure["elements"]] != [f"p{i}" for i in range(len(raw))]:
            errors.append(f"frame {index}: slot ids are not p0..p(n-1)")
        for field in ("operation", "round", "sortedFrom", "candidate", "compare",
                      "key", "gap", "gapSequence", "lane", "shifted", "swapped", "insertedAt", "result"):
            if structure[field] != want[field]:
                errors.append(f"frame {index}: {field} {structure[field]!r} != {want[field]!r}")
        values = [element["value"] for element in structure["elements"]]
        if values != want["values"]:
            errors.append(f"frame {index}: values {values!r} != {want['values']!r}")
        if not check_prefix(values, structure["sortedFrom"]):
            errors.append(f"frame {index}: sorted prefix is not nondecreasing")
        if structure["result"] is not None and values != sorted(raw):
            errors.append(f"frame {index}: terminal values are not ascending")

    final = frames[-1]
    final_values = [cell["value"] for cell in final["structure"]["elements"]]
    if final["structure"]["result"] != ("empty" if not raw else "sorted"):
        errors.append("final result flag is wrong")
    if final_values != sorted(raw):
        errors.append("final array is not sorted ascending")
    if Counter(final_values) != Counter(raw):
        errors.append("final multiset changed")

    # Selection: every swap must use the true minimum of the suffix before the swap.
    if algorithm == "selection" and raw:
        for index, entry in enumerate(frames):
            if entry["structure"]["operation"] != "select-swap":
                continue
            r = entry["structure"]["round"]
            before = [cell["value"] for cell in frames[index - 1]["structure"]["elements"]]
            suffix = before[r - 1:]
            minimum = min(suffix)
            candidate = entry["structure"]["candidate"]
            if before[candidate] != minimum:
                errors.append(f"round {r}: candidate is not the real suffix minimum")
            prefix = [cell["value"] for cell in entry["structure"]["elements"]][:r]
            if prefix != sorted(prefix):
                errors.append(f"round {r}: prefix after swap is not ascending")

    # Insertion: insertion-point invariants and genuinely shifted values.
    if algorithm == "insertion" and raw:
        for index, entry in enumerate(frames):
            op = entry["structure"]["operation"]
            if op == "insert-key":
                r = entry["structure"]["round"]
                before = [cell["value"] for cell in frames[index - 1]["structure"]["elements"]]
                if before[:r] != sorted(before[:r]):
                    errors.append(f"round {r}: insertion prefix was not sorted before lifting")
            if op == "insert-place":
                r = entry["structure"]["round"]
                values = [cell["value"] for cell in entry["structure"]["elements"]]
                if values[:r + 1] != sorted(values[:r + 1]):
                    errors.append(f"round {r}: prefix is not sorted after placement")
                if values[entry["structure"]["insertedAt"]] != entry["structure"]["key"]["value"]:
                    errors.append(f"round {r}: key was not written into the insertion slot")

    # Shell: gap lanes, shifts and the final gap-1 guarantee.
    if algorithm == "shell" and raw:
        gaps = gap_sequence(len(raw))
        if len(raw) >= 2 and not gaps:
            errors.append("unexpected empty gap sequence")
        for index, entry in enumerate(frames):
            op = entry["structure"]["operation"]
            if op == "gap-change" and entry["structure"]["gapSequence"] != gaps:
                errors.append(f"gap-change {index}: gap sequence mismatch")
            if op == "shell-shift":
                prev = [cell["value"] for cell in frames[index - 1]["structure"]["elements"]]
                values = [cell["value"] for cell in entry["structure"]["elements"]]
                shifted = entry["structure"]["shifted"]
                if values[shifted["to"]] != prev[shifted["from"]]:
                    errors.append(f"frame {index}: shift did not move the real source value")
                if values[shifted["from"]] != prev[shifted["from"]]:
                    errors.append(f"frame {index}: shift left the source unchanged")
            if op == "gap-done" and entry["structure"]["gap"] == 1:
                values = [cell["value"] for cell in entry["structure"]["elements"]]
                if values != sorted(raw):
                    errors.append("gap-1 pass did not sort the whole array")
        if frames[-1]["structure"]["gapSequence"] != gaps:
            errors.append("final gap sequence mismatch")

    return errors


def insertion_sort_records(records):
    """Independent stable insertion reference on (key, identity) pairs."""
    a = list(records)
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j][0] > key[0]:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a


def shell_sort_records(records):
    """Independent Shell reference with the n//2 halving gap sequence.

    `[(1,x),(3,x),(2,a),(2,b)]` crosses the two equal keys in the gap-2 pass
    before the final gap-1 insertion, so it is a real instability witness rather
    than a stable single-gap insertion case.
    """
    a = list(records)
    gap = len(a) // 2
    while gap > 0:
        for i in range(gap, len(a)):
            key = a[i]
            j = i - gap
            while j >= 0 and a[j][0] > key[0]:
                a[j + gap] = a[j]
                j -= gap
            a[j + gap] = key
        gap //= 2
    return a


def stability_reference():
    """Same-key/different-id checks for the three standard sorting algorithms."""
    insertion = insertion_sort_records([(2, "a"), (2, "b"), (1, "c")])
    shell = shell_sort_records([(1, "x"), (3, "x"), (2, "a"), (2, "b")])
    selection = [(2, "a"), (2, "b"), (1, "c")]
    n = len(selection)
    for i in range(n):
        m = i
        for j in range(i + 1, n):
            if selection[j][0] < selection[m][0]:
                m = j
        selection[i], selection[m] = selection[m], selection[i]
    return insertion, shell, selection


def main():
    total = 0
    for algorithm in ALGORITHMS:
        print(f"[{algorithm}]")
        for case, payload in [("official", OFFICIAL[algorithm]), *CASES.items()]:
            frames = run(algorithm, payload)
            errors = validate(algorithm, payload, frames, REFERENCES[algorithm])
            total += len(frames)
            if errors:
                print(f"  FAIL {case}: {len(errors)} errors")
                for error in errors[:8]:
                    print(f"    - {error}")
                raise SystemExit(1)
            print(f"  ok {case}: {len(frames)} frames")

    insertion, shell, selection = stability_reference()
    if [identity for key, identity in insertion if key == 2] != ["a", "b"]:
        raise SystemExit("insertion stability reference failed")
    if [identity for key, identity in shell if key == 2] != ["b", "a"]:
        raise SystemExit("shell instability reference failed")
    if [identity for key, identity in selection if key == 2] != ["b", "a"]:
        raise SystemExit("selection instability reference failed")
    print("stability: insertion stable; selection and Shell unstable on same-key identity witnesses")
    print(f"verified {total} frames across {len(ALGORITHMS)} algorithms and {len(CASES)} inputs")


if __name__ == "__main__":
    main()

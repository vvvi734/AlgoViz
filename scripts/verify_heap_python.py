"""Independent CPython verification for the T3 max-heap Python source.

Reads the real `HEAP_PYTHON` string from `heapExamples.ts`, executes it with a
fake `trace()`, validates every recorded snapshot's structural invariants and
compares final arrays against an independently implemented max heap. The TS
schema is intentionally not imported: this is a second implementation.
"""
from __future__ import annotations

import copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/heapExamples.ts").read_text(encoding="utf-8")
BODY = TS.split("export const HEAP_PYTHON = `", 1)[1].split("`;\n\nexport function heapCommandFromInput", 1)[0]
assert "${" not in BODY, "unexpanded template expression"
SOURCE = BODY

COMMAND_OPS = {
    "build": {"init", "build-start", "heapify-node", "compare-parent-child", "compare-children", "swap", "done"},
    "push": {"init", "push-append", "compare-parent-child", "swap", "done"},
    "extract": {"init", "extract-select", "replace-root", "compare-parent-child", "compare-children", "swap", "done"},
    "sort": {"init", "build-start", "heapify-node", "compare-parent-child", "compare-children", "swap", "build-done", "sort-select", "swap-to-end", "done"},
}


def run(payload: dict) -> list[dict]:
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

    ns = {"input": copy.deepcopy(payload), "trace": trace}
    exec(compile(SOURCE, "<t3>", "exec"), ns)
    return frames


class RefMaxHeap:
    def __init__(self, values):
        self.values = list(values)

    def sift_down(self, start: int, size: int) -> None:
        current = start
        while True:
            left = 2 * current + 1
            if left >= size:
                return
            right = left + 1
            child = left
            if right < size and self.values[right] > self.values[left]:
                child = right
            if self.values[current] >= self.values[child]:
                return
            self.values[current], self.values[child] = self.values[child], self.values[current]
            current = child

    def build(self) -> None:
        for parent in range(len(self.values) // 2 - 1, -1, -1):
            self.sift_down(parent, len(self.values))

    def push(self, value) -> None:
        self.values.append(value)
        current = len(self.values) - 1
        while current > 0:
            parent = (current - 1) // 2
            if self.values[parent] >= self.values[current]:
                return
            self.values[parent], self.values[current] = self.values[current], self.values[parent]
            current = parent

    def extract(self):
        if not self.values:
            return None
        maximum = self.values[0]
        tail = self.values.pop()
        if self.values:
            self.values[0] = tail
            self.sift_down(0, len(self.values))
        return maximum

    def sort(self) -> None:
        self.build()
        for end in range(len(self.values) - 1, 0, -1):
            self.values[0], self.values[end] = self.values[end], self.values[0]
            self.sift_down(0, end)


def is_max_heap(values) -> bool:
    for parent in range(len(values) // 2):
        for child in (2 * parent + 1, 2 * parent + 2):
            if child < len(values) and values[parent] < values[child]:
                return False
    return True


def validate_frames(label: str, payload: dict, frames: list[dict]) -> None:
    assert frames, f"{label}: no frames"
    command = payload["operation"]
    for index, frame in enumerate(frames):
        state = frame["state"]
        structure = frame["structure"]
        assert frame["lessonStepId"], f"{label}#{index}: missing lesson step"
        assert state["type"] == "array", f"{label}#{index}: state type"
        assert structure["kind"] == "max-heap", f"{label}#{index}: structure kind"
        assert structure["command"] == command, f"{label}#{index}: command"
        assert structure["operation"] in COMMAND_OPS[command], f"{label}#{index}: operation not allowed"
        assert structure["totalSize"] == len(structure["elements"]), f"{label}#{index}: totalSize"
        assert len(state["values"]) == structure["totalSize"], f"{label}#{index}: state/structure size"
        assert all(value == state["values"][slot] for slot, value in enumerate(e["value"] for e in structure["elements"])), f"{label}#{index}: values"
        assert all(element["slot"] == slot for slot, element in enumerate(structure["elements"])), f"{label}#{index}: contiguous slots"
        ids = [element["id"] for element in structure["elements"]]
        assert len(ids) == len(set(ids)), f"{label}#{index}: duplicate ids"
        assert structure["heapSize"] <= structure["totalSize"], f"{label}#{index}: heap size"
        if structure["sortedFrom"] is not None:
            assert structure["sortedFrom"] == structure["heapSize"], f"{label}#{index}: sortedFrom"
        if structure["heapSize"]:
            assert structure["rootId"] == ids[0], f"{label}#{index}: root id"
        else:
            assert structure["rootId"] is None, f"{label}#{index}: empty root"
        if structure["activeId"] is not None:
            active = ids.index(structure["activeId"])
            assert active < structure["heapSize"], f"{label}#{index}: active outside heap"
            assert structure["pathIds"], f"{label}#{index}: missing path"
            assert structure["pathIds"][0] == structure["rootId"], f"{label}#{index}: path start"
            assert structure["pathIds"][-1] == structure["activeId"], f"{label}#{index}: path end"
            path_slots = [ids.index(item) for item in structure["pathIds"]]
            for parent, child in zip(path_slots, path_slots[1:]):
                assert (child - 1) // 2 == parent, f"{label}#{index}: path parent"
        else:
            assert structure["pathIds"] == [], f"{label}#{index}: path without active"

        compare_parent = structure["compareParent"]
        if compare_parent is not None:
            parent = ids.index(compare_parent["parentId"])
            child = ids.index(compare_parent["childId"])
            assert child > 0 and (child - 1) // 2 == parent, f"{label}#{index}: parent pair"
            assert child < structure["heapSize"], f"{label}#{index}: parent pair heap"
        compare_children = structure["compareChildren"]
        if compare_children is not None:
            left = ids.index(compare_children["leftId"])
            right = ids.index(compare_children["rightId"])
            assert right == left + 1 and left % 2 == 1, f"{label}#{index}: sibling pair"
            assert right < structure["heapSize"], f"{label}#{index}: sibling heap"

        swap = structure["swap"]
        if swap is not None:
            first = ids.index(swap["firstId"])
            second = ids.index(swap["secondId"])
            assert first != second, f"{label}#{index}: swap identity"
            if structure["operation"] == "swap-to-end":
                assert first == 0 and second == structure["heapSize"], f"{label}#{index}: swap-to-end slots"
            else:
                assert first < structure["heapSize"] and second < structure["heapSize"], f"{label}#{index}: swap heap"

        removed = structure["removed"]
        if removed is not None:
            assert removed["id"] not in ids, f"{label}#{index}: removed still present"
            assert structure["command"] == "extract", f"{label}#{index}: removed command"
        replacement = structure["replacement"]
        if replacement is not None:
            assert structure["operation"] == "replace-root", f"{label}#{index}: replacement op"
            assert replacement["id"] == structure["rootId"], f"{label}#{index}: replacement root"
            assert replacement["toSlot"] == 0, f"{label}#{index}: replacement slot"
            assert replacement["fromSlot"] == structure["totalSize"], f"{label}#{index}: replacement tail"

        if structure["operation"] == "push-append":
            added = ids.index(structure["addedId"])
            assert added == structure["totalSize"] - 1, f"{label}#{index}: append tail"
            assert structure["activeId"] == structure["addedId"], f"{label}#{index}: append active"
        if structure["operation"] == "swap-to-end":
            assert structure["sortedFrom"] == structure["heapSize"], f"{label}#{index}: swap-to-end suffix"
            assert structure["activeId"] == structure["rootId"], f"{label}#{index}: swap-to-end root"
        if structure["operation"] == "sort-select":
            assert structure["activeId"] == structure["rootId"], f"{label}#{index}: sort-select root"

        values = [element["value"] for element in structure["elements"]]
        if structure["sortedFrom"] is not None:
            suffix = values[structure["sortedFrom"]:]
            assert suffix == sorted(suffix), f"{label}#{index}: sorted suffix"

        if structure["operation"] in {"done", "build-done"}:
            if command == "sort" and structure["operation"] == "done":
                assert values == sorted(values), f"{label}#{index}: final ascending"
            else:
                assert is_max_heap(values[: structure["heapSize"]]), f"{label}#{index}: final heap"

    final = frames[-1]["structure"]
    assert final["operation"] == "done", f"{label}: last frame is not done"
    assert sum(1 for frame in frames if frame["structure"]["operation"] == "done") == 1, f"{label}: multiple done"
    values = [element["value"] for element in final["elements"]]

    if command == "build":
        assert final["result"] == "built"
        assert is_max_heap(values)
        assert sorted(values) == sorted(payload["heap"])
    elif command == "push":
        assert final["result"] == "pushed"
        assert is_max_heap(values)
        assert sorted(values) == sorted(list(payload["heap"]) + [payload["value"]])
    elif command == "extract":
        initial = list(payload["heap"])
        if not initial:
            assert final["result"] == "empty"
            assert values == []
        else:
            assert final["result"] == "extracted"
            expected_max = max(initial)
            assert final["removed"]["value"] == expected_max
            assert sorted(values) == sorted(initial)[:-1]
            assert is_max_heap(values)
    else:
        assert final["result"] == "sorted"
        assert values == sorted(payload["heap"])
        assert final["totalSize"] == len(final["elements"])
        assert final["heapSize"] == 0


def reference(payload: dict):
    heap = RefMaxHeap(payload["heap"])
    command = payload["operation"]
    if command == "build":
        heap.build()
        return heap.values
    if command == "push":
        heap.push(payload["value"])
        return heap.values
    if command == "extract":
        heap.extract()
        return heap.values
    heap.sort()
    return heap.values

DEFAULT = {
    "build": {"preset": "build", "operation": "build", "heap": [4, 9, 2, 7, 5, 9, 1], "value": None},
    "push": {"preset": "push", "operation": "push", "heap": [9, 8, 6, 3, 7, 2], "value": 10},
    "extract": {"preset": "extract", "operation": "extract", "heap": [9, 8, 6, 3, 7, 2, 5], "value": None},
    "sort": {"preset": "sort", "operation": "sort", "heap": [5, 1, 9, 3, 9, 2, 6], "value": None},
}

EDGE = {
    "build-empty": {"operation": "build", "heap": [], "value": None},
    "build-single": {"operation": "build", "heap": [7], "value": None},
    "build-duplicate": {"operation": "build", "heap": [5, 5, 4], "value": None},
    "push-empty": {"operation": "push", "heap": [], "value": 7},
    "push-single": {"operation": "push", "heap": [5], "value": 9},
    "push-duplicate": {"operation": "push", "heap": [5, 5], "value": 5},
    "extract-empty": {"operation": "extract", "heap": [], "value": None},
    "extract-single": {"operation": "extract", "heap": [7], "value": None},
    "extract-duplicate": {"operation": "extract", "heap": [5, 5], "value": None},
    "sort-empty": {"operation": "sort", "heap": [], "value": None},
    "sort-single": {"operation": "sort", "heap": [7], "value": None},
    "sort-duplicate": {"operation": "sort", "heap": [5, 5, 4, 5], "value": None},
}


def validate_case(label: str, payload: dict) -> list[dict]:
    frames = run(payload)
    validate_frames(label, payload, frames)
    final_values = [element["value"] for element in frames[-1]["structure"]["elements"]]
    expected = reference(payload)
    assert final_values == expected, f"{label}: reference mismatch {final_values} != {expected}"
    print(f"  {label}: {len(frames)} frames, final {final_values}")
    return frames


def main() -> None:
    print(f"max-heap Python: {len(SOURCE.splitlines())} lines")
    for label, payload in DEFAULT.items():
        validate_case(label, payload)
    for label, payload in EDGE.items():
        validate_case(label, payload)
    print("all max-heap invariants and reference results passed")


if __name__ == "__main__":
    main()

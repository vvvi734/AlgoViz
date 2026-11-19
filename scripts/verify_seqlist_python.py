"""Independent CPython verification for L1B fixed-capacity sequential lists.

The real teaching program is extracted from `sequentialListExamples.ts` and run
with a trace collector. A separately written reference model replays the same
input and compares every recorded structure frame, not only the final array.

Checks include:
  - 0 <= length <= capacity and contiguous, zero-based slots;
  - complete-frame live/free invariants;
  - every change.before equals the previous frame's slot and change.after
    equals the current frame's slot;
  - rightward insertion shifts are source -> source + 1, leftward deletion
    shifts are source -> source - 1;
  - insert/delete length updates, full/empty rejection, out-of-range rejection
    without damaging existing slots;
  - duplicate, negative, single-element and append/head/tail cases;
  - key intermediate assignment frames, not just final state.

Run: python scripts/verify_seqlist_python.py
"""
from __future__ import annotations

import math
import sys
from typing import Any

from seqlist_common import EDGE, OFFICIAL, run_case


def clean_number(value: Any, fallback: Any = 0) -> Any:
    if isinstance(value, bool):
        return fallback
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return value
    return fallback


def as_int(value: Any, fallback: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        return fallback
    return value


class Reference:
    """A second implementation of the fixed-capacity contract.

    It intentionally keeps its own slots/length and writes a reference frame for
    every assignment so the real trace can be diffed frame by frame.
    """

    def __init__(self, cfg: dict[str, Any]):
        self.operation = cfg.get("operation", "insert")
        capacity = cfg.get("capacity", 8)
        if isinstance(capacity, bool) or not isinstance(capacity, int):
            capacity = 8
        self.capacity = max(1, min(capacity, 16))
        source = cfg.get("values", [])
        values = [clean_number(item) for item in source[: self.capacity]] if isinstance(source, list) else []
        self.length = min(len(values), self.capacity)
        self.data: list[Any] = [None] * self.capacity
        for i in range(self.length):
            self.data[i] = values[i]
        self.index = as_int(cfg.get("index"), self.length)
        self.target = clean_number(cfg.get("target"), 0)
        self.insert_value = clean_number(cfg.get("value"), 0)
        preset = cfg.get("preset")
        self.preset = preset if isinstance(preset, str) else None
        self.frames: list[dict[str, Any]] = []

    def slots(self) -> list[dict[str, Any]]:
        return [{"index": i, "value": self.data[i]} for i in range(self.capacity)]

    def emit(self, action: str, phase: str, op: str | None = None, **extra: Any) -> None:
        payload: dict[str, Any] = {
            "kind": "sequential-list",
            "operation": op or self.operation,
            "action": action,
            "phase": phase,
            "capacity": self.capacity,
            "length": self.length,
            "slots": self.slots(),
        }
        if self.preset is not None:
            payload["preset"] = self.preset
        for key, value in extra.items():
            if value is not None:
                payload[key] = value
        self.frames.append(payload)

    def init(self) -> None:
        self.emit(
            "complete", "complete", op="init",
            focusIndex=0 if self.length > 0 else None,
        )

    def finish(self) -> None:
        self.emit("complete", "complete", op="done")

    def reject(self, error: str) -> None:
        self.emit(
            "reject", "complete",
            focusIndex=self.index if 0 <= self.index < self.capacity else None,
            requestedIndex=self.index,
            error=error,
        )

    def run(self) -> list[dict[str, Any]]:
        self.init()
        if self.operation == "access":
            if self.index < 0 or self.index >= self.length:
                self.reject("index-out-of-range")
            else:
                self.emit(
                    "check", "intermediate",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                self.emit(
                    "read", "complete",
                    focusIndex=self.index, requestedIndex=self.index,
                    found=True, foundIndex=self.index, result=self.data[self.index],
                )
                self.finish()
        elif self.operation == "search":
            checked: list[int] = []
            found_at: int | None = None
            for i in range(self.length):
                self.emit(
                    "compare", "intermediate",
                    focusIndex=i, checked=list(checked), searchValue=self.target,
                )
                if self.data[i] == self.target:
                    found_at = i
                    break
                checked.append(i)
            if found_at is not None:
                self.emit(
                    "complete", "complete",
                    focusIndex=found_at, checked=list(checked), searchValue=self.target,
                    found=True, foundIndex=found_at, result=self.data[found_at],
                )
            else:
                self.emit(
                    "complete", "complete",
                    checked=list(range(self.length)), searchValue=self.target, found=False,
                )
            self.finish()
        elif self.operation == "insert":
            if self.index < 0 or self.index > self.length:
                self.reject("index-out-of-range")
            elif self.length == self.capacity:
                self.emit(
                    "check", "intermediate",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                self.reject("capacity-full")
            else:
                self.emit(
                    "check", "intermediate",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                old_length = self.length
                for i in range(old_length - 1, self.index - 1, -1):
                    before = self.data[i + 1]
                    self.data[i + 1] = self.data[i]
                    self.emit(
                        "shift-right", "intermediate",
                        focusIndex=i + 1, sourceIndex=i, targetIndex=i + 1,
                        requestedIndex=self.index,
                        change={"index": i + 1, "before": before, "after": self.data[i + 1]},
                    )
                before_write = self.data[self.index]
                self.data[self.index] = self.insert_value
                self.emit(
                    "write", "intermediate",
                    focusIndex=self.index, targetIndex=self.index, requestedIndex=self.index,
                    change={
                        "index": self.index, "before": before_write,
                        "after": self.data[self.index],
                    },
                )
                self.length = old_length + 1
                self.emit(
                    "complete", "complete",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                self.finish()
        elif self.operation == "delete":
            if self.length == 0:
                self.reject("list-empty")
            elif self.index < 0 or self.index >= self.length:
                self.reject("index-out-of-range")
            else:
                self.emit(
                    "check", "intermediate",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                removed = self.data[self.index]
                self.emit(
                    "save", "intermediate",
                    focusIndex=self.index, requestedIndex=self.index,
                    removedIndex=self.index, removedValue=removed,
                )
                for i in range(self.index, self.length - 1):
                    before = self.data[i]
                    self.data[i] = self.data[i + 1]
                    self.emit(
                        "shift-left", "intermediate",
                        focusIndex=i, sourceIndex=i + 1, targetIndex=i,
                        requestedIndex=self.index, removedIndex=self.index,
                        removedValue=removed,
                        change={"index": i, "before": before, "after": self.data[i]},
                    )
                self.length -= 1
                before_clear = self.data[self.length]
                self.data[self.length] = None
                self.emit(
                    "clear", "intermediate",
                    focusIndex=self.length, targetIndex=self.length,
                    requestedIndex=self.index, removedIndex=self.index,
                    removedValue=removed,
                    change={"index": self.length, "before": before_clear, "after": None},
                )
                self.emit(
                    "complete", "complete",
                    focusIndex=self.index, requestedIndex=self.index,
                )
                self.finish()
        elif self.operation == "traverse":
            checked: list[int] = []
            for i in range(self.length):
                self.emit(
                    "visit", "intermediate",
                    focusIndex=i, checked=list(checked),
                )
                checked.append(i)
            self.emit("complete", "complete", checked=list(checked))
            self.finish()
        else:
            self.emit("complete", "complete", focusIndex=None)
        return self.frames


def structure_only(frame: dict[str, Any]) -> dict[str, Any]:
    return frame["structure"]


def assert_frame_invariants(frames: list[dict[str, Any]], label: str) -> None:
    assert frames, f"{label}: no frames emitted"
    previous_slots: list[dict[str, Any]] | None = None
    for position, frame in enumerate(frames):
        snapshot = structure_only(frame)
        assert snapshot["kind"] == "sequential-list", (label, position, snapshot)
        capacity = snapshot["capacity"]
        length = snapshot["length"]
        slots = snapshot["slots"]
        assert 1 <= capacity <= 16, (label, position, capacity)
        assert 0 <= length <= capacity, (label, position, length, capacity)
        assert len(slots) == capacity, (label, position, len(slots), capacity)
        assert [slot["index"] for slot in slots] == list(range(capacity)), (label, position)
        for name in ("focusIndex", "sourceIndex", "targetIndex", "foundIndex", "removedIndex"):
            value = snapshot.get(name)
            if value is not None:
                assert 0 <= value < capacity, (label, position, name, value)
        checks = snapshot.get("checked", [])
        assert len(checks) == len(set(checks)), (label, position, "duplicate checked")
        assert all(0 <= index < capacity for index in checks), (label, position, "checked range")

        if snapshot["phase"] == "complete":
            for slot in slots[:length]:
                assert slot["value"] is not None, (label, position, "live slot null", slot)
            for slot in slots[length:]:
                assert slot["value"] is None, (label, position, "free slot not null", slot)

        change = snapshot.get("change")
        if change is not None:
            index = change["index"]
            assert snapshot["phase"] == "intermediate", (label, position, "change on complete")
            assert slots[index]["value"] == change["after"], (label, position, "after mismatch")
            if previous_slots is not None:
                assert previous_slots[index]["value"] == change["before"], (
                    label, position, "before mismatch", index, previous_slots[index], change
                )
            if snapshot["action"] == "shift-right":
                assert snapshot["operation"] == "insert"
                assert snapshot["targetIndex"] == snapshot["sourceIndex"] + 1
                assert slots[snapshot["sourceIndex"]]["value"] == previous_slots[snapshot["sourceIndex"]]["value"]
            if snapshot["action"] == "shift-left":
                assert snapshot["operation"] == "delete"
                assert snapshot["targetIndex"] == snapshot["sourceIndex"] - 1
                assert slots[snapshot["sourceIndex"]]["value"] == previous_slots[snapshot["sourceIndex"]]["value"]
        if snapshot["action"] == "write":
            assert snapshot["operation"] == "insert"
            assert snapshot["targetIndex"] is not None and change is not None
        if snapshot["action"] == "clear":
            assert snapshot["operation"] == "delete"
            assert snapshot["targetIndex"] == length
            assert slots[length]["value"] is None
        if snapshot["action"] == "save":
            assert snapshot["operation"] == "delete"
            assert snapshot.get("removedIndex") is not None
            assert snapshot.get("removedValue") is not None
        if snapshot["action"] == "read":
            assert snapshot["operation"] == "access"
            assert snapshot["phase"] == "complete"
            assert snapshot["found"] is True
            assert snapshot["foundIndex"] == snapshot["focusIndex"]
            assert snapshot["result"] == slots[snapshot["focusIndex"]]["value"]
        if snapshot["action"] == "reject":
            assert snapshot["phase"] == "complete"
            assert snapshot["error"] in ("index-out-of-range", "capacity-full", "list-empty")
        if snapshot["operation"] == "done" or snapshot["operation"] == "init":
            assert snapshot["phase"] == "complete" and snapshot["action"] == "complete"
        if snapshot["operation"] == "search" and snapshot["action"] == "complete":
            if snapshot["found"]:
                assert snapshot["result"] == slots[snapshot["foundIndex"]]["value"]
            else:
                assert "foundIndex" not in snapshot

        previous_slots = slots


def compare_case(label: str, cfg: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    actual = run_case(cfg)
    expected = Reference(cfg).run()
    assert len(actual) == len(expected), (label, len(actual), len(expected))
    for position, (real, ref) in enumerate(zip(actual, expected)):
        assert structure_only(real) == ref, (
            label, position, "frame mismatch", structure_only(real), ref
        )
    assert_frame_invariants(actual, label)
    return actual, expected


def check_known_moves(label: str, frames: list[dict[str, Any]], sources: list[int], action: str) -> None:
    moves = [
        frame["structure"] for frame in frames
        if frame["structure"]["action"] == action
    ]
    assert [move["sourceIndex"] for move in moves] == sources, (label, moves)
    for move in moves:
        step = 1 if action == "shift-right" else -1
        assert move["targetIndex"] == move["sourceIndex"] + step


def reject_leaves_data(label: str, frames: list[dict[str, Any]]) -> None:
    initial = frames[0]["structure"]["slots"]
    reject = [frame["structure"] for frame in frames if frame["structure"]["action"] == "reject"]
    assert len(reject) == 1, (label, "expected one reject frame")
    assert reject[0]["slots"] == initial, (label, "rejection changed data")


def main() -> None:
    official_counts: dict[str, int] = {}
    for name, cfg in OFFICIAL.items():
        frames, _ = compare_case(f"official/{name}", cfg)
        official_counts[name] = len(frames)

    assert official_counts["insert-middle"] == 8, official_counts
    assert official_counts["delete-middle"] == 9, official_counts
    insert_frames, _ = compare_case("official/insert-middle", OFFICIAL["insert-middle"])
    delete_frames, _ = compare_case("official/delete-middle", OFFICIAL["delete-middle"])
    check_known_moves("insert-middle", insert_frames, [4, 3, 2], "shift-right")
    check_known_moves("delete-middle", delete_frames, [2, 3, 4], "shift-left")

    final_insert = insert_frames[-2]["structure"]
    assert final_insert["operation"] == "insert" and final_insert["phase"] == "complete"
    assert final_insert["length"] == 6
    assert [slot["value"] for slot in final_insert["slots"]] == [10, 20, 25, 30, 40, 50, None, None]

    final_delete = delete_frames[-2]["structure"]
    assert final_delete["operation"] == "delete" and final_delete["phase"] == "complete"
    assert final_delete["length"] == 4
    assert [slot["value"] for slot in final_delete["slots"]] == [10, 30, 40, 50, None, None, None, None]

    edge_counts: dict[str, int] = {}
    for name, cfg in EDGE.items():
        frames, _ = compare_case(f"edge/{name}", cfg)
        edge_counts[name] = len(frames)

    for name in ("access-out", "empty-delete", "full-insert"):
        frames, _ = compare_case(f"official/{name}", OFFICIAL[name])
        assert frames[-1]["structure"]["action"] == "reject", (name, frames[-1])
        reject_leaves_data(name, frames)

    negative_frames, _ = compare_case("edge/negative-values", EDGE["negative-values"])
    assert negative_frames[-2]["structure"]["length"] == 6
    assert negative_frames[-2]["structure"]["slots"][2]["value"] == -9

    one_frames, _ = compare_case("edge/capacity-one", EDGE["capacity-one"])
    assert one_frames[-2]["structure"]["length"] == 0
    assert one_frames[-2]["structure"]["slots"][0]["value"] is None

    to_empty, _ = compare_case("edge/delete-to-empty", EDGE["delete-to-empty"])
    assert to_empty[-2]["structure"]["length"] == 0
    assert all(slot["value"] is None for slot in to_empty[-2]["structure"]["slots"])

    duplicate, _ = compare_case("edge/negative-and-duplicate", EDGE["negative-and-duplicate"])
    hit = [frame["structure"] for frame in duplicate if frame["structure"].get("found") is True]
    assert hit and hit[0]["foundIndex"] == 1, hit

    over, _ = compare_case("edge/initial-over-capacity", EDGE["initial-over-capacity"])
    first = over[0]["structure"]
    final = over[-2]["structure"]
    assert first["capacity"] == final["capacity"] == 3
    assert first["length"] == final["length"] == 3
    assert first["slots"] == final["slots"], "traversal over capacity must stay fixed"

    print(f"official cases: {len(OFFICIAL)} / frames: {sum(official_counts.values())}")
    print(f"edge cases: {len(EDGE)} / frames: {sum(edge_counts.values())}")
    print("all frame-level reference, invariant, move-direction and boundary checks passed")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as error:
        import traceback
        traceback.print_exc()
        print("FAILED:", error)
        sys.exit(1)

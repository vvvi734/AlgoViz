"""Independent CPython checks for the T1 BST Python source.

The script reads the actual `BST_PYTHON` string from the TypeScript source and
runs it with a fake `trace()`. It never imports the TypeScript schema. Final
trees are compared against an independently implemented BST, not against fixed
screenshots.

Usage:
    python scripts/verify_bst_python.py
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TS = (ROOT / "src/domain/algorithms/bstExamples.ts").read_text(encoding="utf-8")
BODY = TS.split("export const BST_PYTHON = `", 1)[1].split("`;\n\nexport function bstCommandFromInput", 1)[0]
assert "${" not in BODY, "unexpanded template expression"
SOURCE = BODY


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
    exec(compile(SOURCE, "<t1>", "exec"), ns)
    return frames


class RefNode:
    def __init__(self, value: int):
        self.value = value
        self.left = None
        self.right = None


class RefBST:
    def __init__(self):
        self.root = None

    def insert(self, value: int) -> bool:
        if self.root is None:
            self.root = RefNode(value)
            return True
        node = self.root
        while True:
            if value == node.value:
                return False
            if value < node.value:
                if node.left is None:
                    node.left = RefNode(value)
                    return True
                node = node.left
            else:
                if node.right is None:
                    node.right = RefNode(value)
                    return True
                node = node.right

    def find(self, value: int) -> RefNode | None:
        node = self.root
        while node is not None:
            if value == node.value:
                return node
            node = node.left if value < node.value else node.right
        return None

    def parent(self, target: RefNode) -> RefNode | None:
        if target is self.root:
            return None
        stack = [self.root]
        while stack:
            node = stack.pop()
            if node is None:
                continue
            if node.left is target or node.right is target:
                return node
            for child in (node.left, node.right):
                if child is not None:
                    stack.append(child)
        return None

    def delete(self, value: int) -> tuple[bool, dict | None]:
        target = self.find(value)
        if target is None:
            return False, None
        parent = self.parent(target)
        side = None if parent is None else ("left" if parent.left is target else "right")
        kids = int(target.left is not None) + int(target.right is not None)
        if kids == 0:
            if parent is None:
                self.root = None
            elif side == "left":
                parent.left = None
            else:
                parent.right = None
            return True, {"case": "leaf", "removed": value, "replacement": None}
        if kids == 1:
            child = target.left if target.left is not None else target.right
            if parent is None:
                self.root = child
            elif side == "left":
                parent.left = child
            else:
                parent.right = child
            return True, {"case": "one-child", "removed": value, "replacement": child.value}
        successor = target.right
        while successor.left is not None:
            successor = successor.left
        successor_parent = self.parent(successor)
        successor_right = successor.right
        if successor_parent is target:
            target.right = successor_right
        elif successor_parent.left is successor:
            successor_parent.left = successor_right
        else:
            successor_parent.right = successor_right
        successor.right = None
        if parent is None:
            self.root = successor
        elif side == "left":
            parent.left = successor
        else:
            parent.right = successor
        successor.left = target.left
        successor.right = target.right
        target.left = None
        target.right = None
        return True, {"case": "two-child", "removed": value, "replacement": successor.value}

    def inorder(self) -> list[RefNode]:
        result: list[RefNode] = []
        stack: list[RefNode] = []
        node = self.root
        while node is not None or stack:
            while node is not None:
                stack.append(node)
                node = node.left
            node = stack.pop()
            result.append(node)
            node = node.right
        return result


def build_ref(values: list) -> RefBST:
    tree = RefBST()
    for value in values:
        if value is None:
            continue
        tree.insert(value)
    return tree


def snapshot_tree(structure: dict) -> dict:
    nodes = structure["nodes"]
    by_id = {node["id"]: node for node in nodes}
    root = structure["rootId"]
    assert root is None or root in by_id
    for node in nodes:
        for key in ("leftId", "rightId"):
            ref = node[key]
            assert ref is None or ref in by_id, f"dangling {key} {ref}"
    return by_id


def check_snapshot(structure: dict) -> None:
    assert structure["kind"] == "bst"
    by_id = snapshot_tree(structure)
    assert len(by_id) == len(structure["nodes"]), "duplicate node ids"
    inorder = structure["inorderIds"]
    assert len(inorder) == len(structure["nodes"]), "inorder length mismatch"
    values = [by_id[node_id]["value"] for node_id in inorder]
    assert values == sorted(values), f"inorder not sorted: {values}"
    assert len(values) == len(set(values)), f"duplicate values: {values}"
    if structure["currentNodeId"] is not None:
        assert structure["currentNodeId"] in by_id
        assert structure["pathIds"][-1] == structure["currentNodeId"], "path must end at current"
    else:
        assert structure["pathIds"] == [], "no current must mean empty path"
    for ref in ("targetNodeId", "nextNodeId", "parentId", "insertedId", "replacementId"):
        if structure[ref] is not None:
            assert structure[ref] in by_id, f"{ref} must be attached"
    if structure["successorId"] is not None and structure["operation"] != "successor-detach":
        assert structure["successorId"] in by_id, "successorId must be attached"
    if structure["removedNode"] is not None:
        removed = structure["removedNode"]
        assert removed["id"] not in by_id, "removed node must not remain attached"
        if removed["parentId"] is not None:
            assert removed["parentId"] in by_id, "removed parent must remain attached"
        if removed["replacementId"] is not None:
            assert removed["replacementId"] in by_id, "replacement must remain attached"


def reference_graph(tree: RefBST) -> set[tuple[int, int | None, int | None]]:
    triples = set()
    for node in tree.inorder():
        triples.add((
            node.value,
            node.left.value if node.left is not None else None,
            node.right.value if node.right is not None else None,
        ))
    return triples


def snapshot_graph(structure: dict) -> set[tuple[int, int | None, int | None]]:
    by_id = snapshot_tree(structure)
    triples = set()
    for node in by_id.values():
        triples.add((
            node["value"],
            by_id[node["leftId"]]["value"] if node["leftId"] else None,
            by_id[node["rightId"]]["value"] if node["rightId"] else None,
        ))
    return triples


def assert_final_matches(frames: list[dict], ref: RefBST) -> None:
    final = frames[-1]["structure"]
    check_snapshot(final)
    assert final["operation"] == "done"
    assert snapshot_graph(final) == reference_graph(ref)
    assert sorted(node["value"] for node in final["nodes"]) == sorted(node.value for node in ref.inorder())


def check_find(payload: dict, found: bool) -> None:
    frames = run(payload)
    assert frames[0]["structure"]["operation"] == "init"
    assert frames[-1]["structure"]["operation"] == "done"
    for frame in frames:
        check_snapshot(frame["structure"])
    final = frames[-1]["structure"]
    if found:
        assert final["result"] == "found"
        assert any(frame["structure"]["operation"] == "found" for frame in frames)
    else:
        assert final["result"] == "not-found"
        assert any(frame["structure"]["operation"] == "not-found" for frame in frames)
    ref = build_ref(payload["tree"])
    assert_final_matches(frames, ref)



def check_insert(payload: dict, duplicate: bool = False) -> None:
    frames = run(payload)
    for frame in frames:
        check_snapshot(frame["structure"])
    ref = build_ref(payload["tree"])
    if duplicate:
        assert ref.find(payload["target"]) is not None
        assert frames[-1]["structure"]["result"] == "duplicate"
        assert any(frame["structure"]["operation"] == "duplicate" for frame in frames)
        assert snapshot_graph(frames[-1]["structure"]) == reference_graph(ref)
        return
    assert ref.insert(payload["target"])
    assert frames[-1]["structure"]["result"] == "inserted"
    attach = next(frame["structure"] for frame in frames if frame["structure"]["operation"] == "attach")
    assert attach["insertedId"] is not None
    assert attach["insertedId"] in {node["id"] for node in attach["nodes"]}
    assert snapshot_graph(frames[-1]["structure"]) == reference_graph(ref)
    stable = {node["value"]: node["id"] for node in frames[0]["structure"]["nodes"]}
    for node in frames[-1]["structure"]["nodes"]:
        if node["value"] in stable:
            assert node["id"] == stable[node["value"]], "insert must not rename existing nodes"


def check_delete(payload: dict, expected_case: str) -> None:
    frames = run(payload)
    for frame in frames:
        check_snapshot(frame["structure"])
    ref = build_ref(payload["tree"])
    before = {node["value"]: node["id"] for node in frames[1]["structure"]["nodes"]}
    ok, info = ref.delete(payload["target"])
    assert ok and info
    assert info["case"] == expected_case
    final = frames[-1]["structure"]
    assert final["result"] == "deleted"
    assert snapshot_graph(final) == reference_graph(ref), f"{expected_case}: final tree differs"
    transition = next(
        frame["structure"] for frame in frames
        if frame["structure"]["operation"] in ("delete-leaf", "delete-one", "transplant")
    )
    removed = transition["removedNode"]
    assert removed is not None
    assert removed["value"] == payload["target"]
    if expected_case == "leaf":
        assert transition["operation"] == "delete-leaf"
        assert removed["replacementId"] is None
    elif expected_case == "one-child":
        assert transition["operation"] == "delete-one"
        assert removed["replacementId"] is not None
    else:
        assert transition["operation"] == "transplant"
        assert removed["replacementId"] is not None
        assert any(frame["structure"]["operation"] == "successor-detach" for frame in frames)
        assert any(frame["structure"]["operation"] == "successor-found" for frame in frames)
    for node in final["nodes"]:
        if node["value"] in before:
            assert node["id"] == before[node["value"]], "delete must not rename survivors"


def check_delete_missing(payload: dict) -> None:
    frames = run(payload)
    for frame in frames:
        check_snapshot(frame["structure"])
    assert frames[-1]["structure"]["result"] == "missing"
    assert any(frame["structure"]["operation"] == "not-found" for frame in frames)
    ref = build_ref(payload["tree"])
    assert_final_matches(frames, ref)


def main() -> None:
    cases = {
        "find-success": ({"operation": "find", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 40}, check_find, True),
        "find-missing": ({"operation": "find", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 55}, check_find, False),
        "find-empty": ({"operation": "find", "tree": [], "target": 9}, check_find, False),
        "find-single": ({"operation": "find", "tree": [7], "target": 7}, check_find, True),
    }
    for name, (payload, checker, flag) in cases.items():
        checker(payload, flag) if checker is check_find else checker(payload)
        print(f"ok {name}: {len(run(payload))} frames")

    check_insert({"operation": "insert", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 35})
    print("ok insert")
    check_insert({"operation": "insert", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 40}, duplicate=True)
    print("ok duplicate")
    check_insert({"operation": "insert", "tree": [], "target": 7})
    print("ok insert-empty")

    check_delete({"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 20}, "leaf")
    check_delete({"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, None, None, None, None, None, 65], "target": 60}, "one-child")
    check_delete({"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80, None, None, None, None, None, 65], "target": 50}, "two-child")
    check_delete_missing({"operation": "delete", "tree": [50, 30, 70, 20, 40, 60, 80], "target": 99})
    print("ok delete cases")

    # Root one-child delete must update rootId.
    frames = run({"operation": "delete", "tree": [50, 30], "target": 50})
    final = frames[-1]["structure"]
    assert final["rootId"] == next(node["id"] for node in final["nodes"] if node["value"] == 30)
    assert final["operation"] == "done"

    # Empty delete / insert are safe.
    empty_delete = run({"operation": "delete", "tree": [], "target": 5})
    assert empty_delete[-1]["structure"]["result"] == "missing"
    assert empty_delete[-1]["structure"]["nodes"] == []
    print(f"all BST Python checks passed; {len(SOURCE.splitlines())} source lines")


if __name__ == "__main__":
    main()

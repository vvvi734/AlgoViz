/**
 * F1: real Python sequential and iterative binary search.
 *
 * Both programs emit one `search` structure per real comparison/boundary move.
 * Binary search never guesses an excluded half in the UI: the renderer only
 * derives excluded cells from the `left`/`right` values Python actually wrote.
 */

export const LINEAR_DEFAULT_INPUT: unknown = { nums: [6, 3, 9, 2, 7, 4], target: 7 };
export const BINARY_DEFAULT_INPUT: unknown = { nums: [1, 3, 5, 7, 9, 11, 13], target: 9 };

export const LINEAR_PYTHON = `# Linear search: inspect every slot from left to right until the target matches.
import math

raw = input
if isinstance(raw, dict):
    nums = raw.get("nums", [])
    target = raw.get("target")
else:
    nums = raw
    target = None
if not isinstance(nums, list):
    nums = []
a = []
for item in nums[:32]:
    if isinstance(item, bool):
        continue
    if isinstance(item, (int, float)) and math.isfinite(item):
        a.append(item)
n = len(a)


def emit(operation, message, lesson, index=None, checked=None, result=None,
         found=None, matched=None):
    checked = checked or []
    trace(
        {"type": "array", "values": a[:], "focus": [] if index is None else [index]},
        message,
        variables={"nums": a[:], "target": target, "index": index,
                   "checked": checked[:], "result": result, "found": found},
        lesson_step=lesson,
        structure={
            "kind": "search", "algorithm": "linear", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "target": target, "phase": "init" if operation == "init" else
            ("scan" if operation in ("scan-start", "scan-next") else
             ("compare" if operation == "scan-compare" else
              ("found" if operation == "found" else "failed"))),
            "index": index, "left": None, "right": None, "mid": None,
            "checked": checked, "range": None, "comparison": None,
            "matched": matched, "result": result, "found": found, "reason": None,
        },
    )


emit("init", "初始化数组与目标值，尚未比较 / Initialize the array and target", "init")
if n == 0:
    emit("not-found", "空数组：没有元素可检查，返回 -1 / Empty array: return -1", "done",
         checked=[], result=-1, found=False)
else:
    emit("scan-start", "从索引 0 开始顺序扫描 / Start at index 0", "scan-start",
         index=0, checked=[])
    i = 0
    while i < n:
        value = a[i]
        matched = value == target
        emit("scan-compare", f"检查 a[{i}]={value} 是否等于目标 {target} / Compare a[{i}] with target",
             "scan-compare", index=i, checked=list(range(i)), matched=matched)
        if matched:
            emit("found", f"找到目标：返回索引 {i} / Target found at index {i}", "done",
                 index=i, checked=list(range(i)), result=i, found=True, matched=True)
            break
        if i + 1 < n:
            emit("scan-next", f"不匹配，移动到索引 {i + 1} / Move to index {i + 1}", "scan-next",
                 index=i + 1, checked=list(range(i + 1)))
        i += 1
    else:
        emit("not-found", "全部检查完毕，没有匹配，返回 -1 / Every slot checked; return -1", "done",
             index=None, checked=list(range(n)), result=-1, found=False)
`;

export const BINARY_PYTHON = `# Iterative binary search: maintain a closed [left, right] candidate interval.
import math

raw = input
if isinstance(raw, dict):
    nums = raw.get("nums", [])
    target = raw.get("target")
else:
    nums = raw
    target = None
if not isinstance(nums, list):
    nums = []
a = []
for item in nums[:32]:
    if isinstance(item, bool):
        continue
    if isinstance(item, (int, float)) and math.isfinite(item):
        a.append(item)
n = len(a)


def is_sorted(values):
    return all(values[i] <= values[i + 1] for i in range(len(values) - 1))


def emit(operation, message, lesson, left=None, right=None, mid=None,
         comparison=None, matched=None, result=None, found=None, index=None,
         reason=None):
    phase = "invalid" if operation == "invalid" else (
        "init" if operation == "binary-init" else
        "scan" if operation == "binary-mid" else
        ("compare" if operation == "binary-compare" else
         ("narrow" if operation in ("binary-exclude-left", "binary-exclude-right") else
          ("found" if operation == "binary-found" else "failed"))))
    live = left is not None and right is not None and left <= right
    trace(
        {"type": "array", "values": a[:],
         "focus": [] if index is None else [index]},
        message,
        variables={"nums": a[:], "target": target, "left": left, "right": right,
                   "mid": mid, "result": result, "found": found},
        lesson_step=lesson,
        structure={
            "kind": "search", "algorithm": "binary", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "target": target, "phase": phase, "index": index,
            "left": left, "right": right, "mid": mid, "checked": [],
            "range": ({"low": left, "high": right} if live else None),
            "comparison": comparison, "matched": matched, "result": result,
            "found": found, "reason": reason,
        },
    )


if n == 0:
    emit("binary-init", "空数组：初始区间为空 / Empty array: the initial interval is empty", "init",
         left=0, right=-1)
    emit("binary-not-found", "区间为空，返回 -1 / Empty interval: return -1", "done",
         left=0, right=-1, result=-1, found=False)
elif not is_sorted(a):
    emit("invalid", "数组不是升序：二分查找要求有序输入，未开始搜索 / Unsorted input: binary search refuses to start",
         "init", reason="unsorted")
else:
    left = 0
    right = n - 1
    emit("binary-init", f"初始化闭区间 [{left}, {right}] / Initialize the closed interval", "init",
         left=left, right=right)
    while left <= right:
        mid = (left + right) // 2
        emit("binary-mid", f"mid = ({left} + {right}) // 2 = {mid} / Compute the midpoint", "binary-mid",
             left=left, right=right, mid=mid)
        value = a[mid]
        if value == target:
            emit("binary-compare", f"a[{mid}]={value} 等于目标 {target} / Equality", "binary-compare",
                 left=left, right=right, mid=mid, comparison="equal", matched=True)
            emit("binary-found", f"找到目标：返回 mid={mid} / Target found at mid={mid}", "done",
                 left=left, right=right, mid=mid, index=mid, result=mid,
                 found=True, comparison="equal", matched=True)
            break
        if value < target:
            emit("binary-compare", f"a[{mid}]={value} 小于目标 {target} / Smaller than target", "binary-compare",
                 left=left, right=right, mid=mid, comparison="less", matched=False)
            left = mid + 1
            emit("binary-exclude-left", f"排除左半区（含 mid）：left 变为 {left} / Discard the left half", "binary-narrow",
                 left=left, right=right, mid=mid, comparison="less", matched=False)
        else:
            emit("binary-compare", f"a[{mid}]={value} 大于目标 {target} / Greater than target", "binary-compare",
                 left=left, right=right, mid=mid, comparison="greater", matched=False)
            right = mid - 1
            emit("binary-exclude-right", f"排除右半区（含 mid）：right 变为 {right} / Discard the right half", "binary-narrow",
                 left=left, right=right, mid=mid, comparison="greater", matched=False)
    else:
        emit("binary-not-found", f"区间为空：left={left} > right={right}，返回 -1 / Empty interval: return -1", "done",
             left=left, right=right, result=-1, found=False)
`;

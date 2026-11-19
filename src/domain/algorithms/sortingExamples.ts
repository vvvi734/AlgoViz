/**
 * S1: real Python selection sort, direct insertion sort and Shell sort.
 *
 * These strings are executed by the Pyodide worker. Every frame is emitted after
 * the corresponding real comparison, move or placement; the renderer never
 * replays a precomputed answer. The `sorting` structure follows the typed
 * snapshot in `schema.ts`, while `state.values` is always the actual Python
 * array, including the intermediate duplicate produced by a right shift.
 */

export const SELECTION_DEFAULT_INPUT: unknown = [6, 4, 9, 1, 7, 2];
export const INSERTION_DEFAULT_INPUT: unknown = [7, 3, 5, 1, 9, 2];
export const SHELL_DEFAULT_INPUT: unknown = [8, 3, 7, 4, 9, 2, 6, 1];

export const SELECTION_PYTHON = `# Selection sort: find the minimum of the unsorted suffix, then swap it to the front.
import math

raw = input
if isinstance(raw, dict):
    raw = raw.get("values", [])
if not isinstance(raw, list):
    raw = []
a = []
for item in raw[:20]:
    if isinstance(item, bool):
        continue
    if isinstance(item, (int, float)) and math.isfinite(item):
        a.append(item)
n = len(a)


def emit(operation, message, lesson, round_index=0, sorted_from=0, candidate=None,
         compare=None, swapped=None, result=None):
    focus = []
    if candidate is not None:
        focus.append(candidate)
    if compare is not None and compare not in focus:
        focus.append(compare)
    if swapped is not None:
        focus = [swapped[0], swapped[1]]
    trace(
        {"type": "array", "values": a[:], "focus": focus},
        message,
        variables={"round": round_index, "sortedFrom": sorted_from,
                   "candidate": candidate, "compare": compare, "arr": a[:]},
        lesson_step=lesson,
        structure={
            "kind": "sorting", "algorithm": "selection", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": round_index, "sortedFrom": sorted_from,
            "candidate": candidate, "compare": compare, "key": None,
            "gap": None, "gapSequence": [], "lane": None, "shifted": None,
            "swapped": swapped, "insertedAt": None, "result": result,
        },
    )


if n == 0:
    emit("init", "空数组：没有元素需要排序 / Empty array: nothing to sort", "init")
    emit("done", "排序完成：空数组 / Done: empty array", "done", result="empty")
else:
    emit("init", "初始化：整个数组都未排序 / Initial array: the whole suffix is unsorted", "init")
    for i in range(n):
        round_index = i + 1
        minimum = i
        emit("select-start", f"第 {round_index} 轮：从位置 {i} 开始找最小值 / Pass {round_index}: start at slot {i}",
             "select-start", round_index=round_index, sorted_from=i, candidate=minimum)
        for j in range(i + 1, n):
            emit("select-compare", f"比较 a[{j}]={a[j]} 与当前最小 a[{minimum}]={a[minimum]} / Compare a[{j}] with current min",
                 "select-compare", round_index=round_index, sorted_from=i,
                 candidate=minimum, compare=j)
            if a[j] < a[minimum]:
                minimum = j
                emit("select-candidate", f"新的最小值候选：a[{j}]={a[j]} / New minimum candidate",
                     "select-candidate", round_index=round_index, sorted_from=i,
                     candidate=minimum, compare=j)
        if minimum != i:
            a[i], a[minimum] = a[minimum], a[i]
        emit("select-swap", f"本轮最小放到位置 {i}：{'交换' if minimum != i else '已在原位'} / Place the minimum",
             "select-swap", round_index=round_index, sorted_from=i + 1,
             candidate=minimum, swapped=(i, minimum))
        emit("select-done", f"第 {round_index} 轮完成：前 {i + 1} 个位置已确定 / Pass complete",
             "select-done", round_index=round_index, sorted_from=i + 1)
    emit("done", "排序完成：整个数组升序 / Sorted: the whole array is ascending", "done", sorted_from=n, result="sorted")
`;

export const INSERTION_PYTHON = `# Direct insertion sort: lift the key, shift larger values right, then insert it.
import math

raw = input
if isinstance(raw, dict):
    raw = raw.get("values", [])
if not isinstance(raw, list):
    raw = []
a = []
for item in raw[:20]:
    if isinstance(item, bool):
        continue
    if isinstance(item, (int, float)) and math.isfinite(item):
        a.append(item)
n = len(a)


def emit(operation, message, lesson, round_index=0, sorted_from=0, compare=None,
         key=None, shifted=None, inserted_at=None, result=None):
    focus = []
    if compare is not None:
        focus.append(compare)
    if inserted_at is not None:
        focus.append(inserted_at)
    trace(
        {"type": "array", "values": a[:], "focus": focus},
        message,
        variables={"round": round_index, "sortedFrom": sorted_from,
                   "compare": compare, "key": key, "arr": a[:]},
        lesson_step=lesson,
        structure={
            "kind": "sorting", "algorithm": "insertion", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": round_index, "sortedFrom": sorted_from,
            "candidate": None, "compare": compare, "key": key,
            "gap": None, "gapSequence": [], "lane": None, "shifted": shifted,
            "swapped": None, "insertedAt": inserted_at, "result": result,
        },
    )


if n == 0:
    emit("init", "空数组：没有元素需要插入 / Empty array: nothing to insert", "init")
    emit("done", "排序完成：空数组 / Done: empty array", "done", result="empty")
else:
    emit("init", "初始化：a[0] 单独构成有序前缀 / Initial array: a[0] is a sorted prefix", "init")
    for i in range(1, n):
        round_index = i
        key_value = a[i]
        key = {"value": key_value, "origin": i}
        emit("insert-key", f"取出 key=a[{i}]={key_value}，位置 {i} 暂时空出 / Lift the key",
             "insert-key", round_index=round_index, sorted_from=i, key=key)
        j = i - 1
        while j >= 0:
            emit("insert-compare", f"比较 a[{j}]={a[j]} 与 key={key_value} / Compare key with a[{j}]",
                 "insert-compare", round_index=round_index, sorted_from=i,
                 compare=j, key=key)
            if a[j] > key_value:
                a[j + 1] = a[j]
                emit("insert-shift", f"a[{j}]={a[j]} 右移到 a[{j + 1}]，留下空位 / Shift right",
                     "insert-shift", round_index=round_index, sorted_from=i,
                     compare=j, key=key, shifted={"from": j, "to": j + 1})
                j -= 1
            else:
                break
        a[j + 1] = key_value
        emit("insert-place", f"key={key_value} 写入位置 {j + 1}，有序前缀扩展到 {i + 1} / Insert the key",
             "insert-place", round_index=round_index, sorted_from=i + 1,
             compare=(j if j >= 0 else None), key=key, inserted_at=j + 1)
    emit("done", "排序完成：整个数组升序 / Sorted: the whole array is ascending", "done", sorted_from=n, result="sorted")
`;

export const SHELL_PYTHON = `# Shell sort: insertion sort inside each gap lane, halve the gap, finish at gap 1.
import math

raw = input
if isinstance(raw, dict):
    raw = raw.get("values", [])
if not isinstance(raw, list):
    raw = []
a = []
for item in raw[:20]:
    if isinstance(item, bool):
        continue
    if isinstance(item, (int, float)) and math.isfinite(item):
        a.append(item)
n = len(a)
gaps = []
gap = n // 2
while gap > 0:
    gaps.append(gap)
    gap //= 2


def emit(operation, message, lesson, round_index=0, sorted_from=0, compare=None,
         key=None, gap=None, lane=None, shifted=None, inserted_at=None, result=None):
    focus = []
    if compare is not None:
        focus.append(compare)
    if inserted_at is not None:
        focus.append(inserted_at)
    trace(
        {"type": "array", "values": a[:], "focus": focus},
        message,
        variables={"round": round_index, "sortedFrom": sorted_from,
                   "gap": gap, "lane": lane, "compare": compare,
                   "key": key, "arr": a[:]},
        lesson_step=lesson,
        structure={
            "kind": "sorting", "algorithm": "shell", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": round_index, "sortedFrom": sorted_from,
            "candidate": None, "compare": compare, "key": key,
            "gap": gap, "gapSequence": gaps[:], "lane": lane, "shifted": shifted,
            "swapped": None, "insertedAt": inserted_at, "result": result,
        },
    )


if n == 0:
    emit("init", "空数组：没有 gap 需要处理 / Empty array: no gaps", "init")
    emit("done", "排序完成：空数组 / Done: empty array", "done", result="empty")
elif n == 1:
    emit("init", "单元素：没有 gap，数组已经有序 / One element: no gaps needed", "init")
    emit("done", "排序完成：单元素天然有序 / Done: a single element is sorted", "done", sorted_from=n, result="sorted")
else:
    emit("init", f"初始化：gap 序列为 {gaps} / Initial array with gap sequence {gaps}", "init")
    for round_index, gap in enumerate(gaps, 1):
        start_sorted = 1 if gap == 1 else 0
        emit("gap-change", f"第 {round_index} 个间隔：gap={gap} / Gap pass {round_index}: gap={gap}",
             "gap-change", round_index=round_index, sorted_from=start_sorted, gap=gap)
        for i in range(gap, n):
            lane = i % gap
            key_value = a[i]
            key = {"value": key_value, "origin": i}
            j = i - gap
            while j >= 0:
                prefix = i if gap == 1 else 0
                emit("shell-compare", f"gap={gap} lane={lane}：比较 a[{j}]={a[j]} 与 key={key_value} / Compare across the gap",
                     "shell-compare", round_index=round_index, sorted_from=prefix,
                     compare=j, key=key, gap=gap, lane=lane)
                if a[j] > key_value:
                    a[j + gap] = a[j]
                    emit("shell-shift", f"a[{j}]={a[j]} 按 gap={gap} 右移到 a[{j + gap}] / Shift by one gap",
                         "shell-shift", round_index=round_index, sorted_from=prefix,
                         compare=j, key=key, gap=gap, lane=lane,
                         shifted={"from": j, "to": j + gap})
                    j -= gap
                else:
                    break
            a[j + gap] = key_value
            placed_prefix = i + 1 if gap == 1 else 0
            emit("shell-place", f"key={key_value} 写入 lane {lane} 的位置 {j + gap} / Place the key in its lane",
                 "shell-place", round_index=round_index, sorted_from=placed_prefix,
                 compare=(j if j >= 0 else None), key=key, gap=gap, lane=lane,
                 inserted_at=j + gap)
        done_prefix = n if gap == 1 else 0
        emit("gap-done", f"gap={gap} 的各个子序列处理完成 / Gap {gap} complete",
             "gap-done", round_index=round_index, sorted_from=done_prefix, gap=gap)
    emit("done", "排序完成：gap=1 的最后一轮把整个数组排好 / Done: the final gap-1 pass sorts the array",
         "done", sorted_from=n, result="sorted")
`;

export const SORTING_PYTHON = {
  selection: SELECTION_PYTHON,
  insertion: INSERTION_PYTHON,
  shell: SHELL_PYTHON,
} as const;

export const SORTING_DEFAULT_INPUT = {
  selection: SELECTION_DEFAULT_INPUT,
  insertion: INSERTION_DEFAULT_INPUT,
  shell: SHELL_DEFAULT_INPUT,
} as const;

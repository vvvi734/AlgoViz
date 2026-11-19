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

export const QUICK_DEFAULT_INPUT: unknown = [8, 3, 1, 7, 5, 2, 9, 4];
export const MERGE_DEFAULT_INPUT: unknown = [7, 3, 5, 1, 9, 2, 8, 4];

export const QUICK_PYTHON = `# Quick sort: Lomuto partition with the last element as pivot.
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
fixed = []
calls = [0]


def emit(operation, message, lesson, round_index=0, range_low=None, range_high=None,
         pivot=None, boundary=None, compare=None, swapped=None, inserted_at=None,
         sorted_from=0, result=None):
    focus = []
    if pivot is not None:
        focus.append(pivot)
    if compare is not None and compare not in focus:
        focus.append(compare)
    if swapped is not None:
        focus = [swapped[0], swapped[1]]
    if inserted_at is not None and inserted_at not in focus:
        focus.append(inserted_at)
    trace(
        {"type": "array", "values": a[:], "focus": focus},
        message,
        variables={"round": round_index, "rangeLow": range_low, "rangeHigh": range_high,
                   "pivot": pivot, "boundary": boundary, "compare": compare, "arr": a[:]},
        lesson_step=lesson,
        structure={
            "kind": "sorting", "algorithm": "quick", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": round_index, "sortedFrom": sorted_from,
            "candidate": None, "compare": compare, "key": None,
            "gap": None, "gapSequence": [], "lane": None, "shifted": None,
            "swapped": swapped, "insertedAt": inserted_at, "result": result,
            "range": None if range_low is None else {"low": range_low, "high": range_high},
            "pivot": pivot, "boundary": boundary, "split": None,
            "left": None, "right": None, "buffer": [], "bufferWrite": None,
            "writeAt": None, "finalized": fixed[:], "mergedRanges": [],
        },
    )


def sort_range(low, high):
    if low > high:
        emit("quick-return", f"空区间 [{low}, {high}] 直接返回 / Empty range returns",
             "quick-place", round_index=calls[0], range_low=low, range_high=high)
        return
    if low == high:
        if low not in fixed:
            fixed.append(low)
        emit("quick-return", f"区间 [{low}, {high}] 只有一个元素，已在最终位置 / Singleton is final",
             "quick-place", round_index=max(1, calls[0]), range_low=low, range_high=high,
             inserted_at=low)
        return

    calls[0] += 1
    current = calls[0]
    pivot_value = a[high]
    i = low
    emit("quick-range", f"分区 {current}：区间 [{low}, {high}]，pivot=a[{high}]={pivot_value} / Enter partition",
         "quick-partition", round_index=current, range_low=low, range_high=high,
         pivot=high, boundary=i)

    for j in range(low, high):
        emit("quick-compare", f"比较 a[{j}]={a[j]} 与 pivot={pivot_value} / Compare a[{j}] with pivot",
             "quick-partition", round_index=current, range_low=low, range_high=high,
             pivot=high, boundary=i, compare=j)
        if a[j] <= pivot_value:
            if i != j:
                left_value, right_value = a[i], a[j]
                a[i], a[j] = a[j], a[i]
                emit("quick-swap", f"a[{j}]={right_value} ≤ pivot：与边界 i={i} 的 {left_value} 真实交换 / Real Lomuto swap",
                     "quick-swap", round_index=current, range_low=low, range_high=high,
                     pivot=high, boundary=i + 1, compare=j, swapped=(i, j))
            i += 1

    a[i], a[high] = a[high], a[i]
    if i not in fixed:
        fixed.append(i)
    emit("quick-place", f"pivot={pivot_value} 归位到 p{i}；左区间 [{low}, {i - 1}]，右区间 [{i + 1}, {high}] / Pivot is final",
         "quick-place", round_index=current, range_low=low, range_high=high,
         pivot=i, boundary=i, inserted_at=i, swapped=(i, high))

    sort_range(low, i - 1)
    sort_range(i + 1, high)


if n == 0:
    emit("init", "空数组：没有元素需要排序 / Empty array: nothing to sort", "init")
    emit("done", "排序完成：空数组 / Done: empty array", "done", result="empty")
elif n == 1:
    emit("init", "单元素：数组已经有序 / One element is already sorted", "init")
    fixed.append(0)
    emit("quick-return", "单元素区间已经是最终位置 / Singleton is final",
         "quick-place", range_low=0, range_high=0, inserted_at=0)
    emit("done", "排序完成：单元素天然有序 / Done: a singleton is sorted", "done", sorted_from=n, result="sorted")
else:
    emit("init", f"初始化：{n} 个元素，使用 Lomuto 末尾 pivot 分区 / Initial array with last-slot Lomuto pivots", "init")
    sort_range(0, n - 1)
    emit("done", "排序完成：每个 pivot 都已归位 / Done: every pivot has reached its final slot",
         "done", round_index=calls[0], sorted_from=n, result="sorted")
`;

export const MERGE_PYTHON = `# Merge sort: top-down split to singletons, merge through a real temporary buffer.
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
calls = [0]


def emit(operation, message, lesson, call_index=0, range_low=None, range_high=None,
         split=None, left=None, right=None, buffer=None, buffer_write=None,
         write_at=None, merged_ranges=None, result=None):
    buffer = [] if buffer is None else buffer
    merged_ranges = [] if merged_ranges is None else merged_ranges
    focus = []
    if left is not None:
        focus.append(left)
    if right is not None and right not in focus:
        focus.append(right)
    if write_at is not None and write_at not in focus:
        focus.append(write_at)
    trace(
        {"type": "array", "values": a[:], "focus": focus},
        message,
        variables={"round": call_index, "rangeLow": range_low, "rangeHigh": range_high,
                   "split": split, "left": left, "right": right,
                   "buffer": buffer[:], "arr": a[:]},
        lesson_step=lesson,
        structure={
            "kind": "sorting", "algorithm": "merge", "operation": operation,
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": call_index, "sortedFrom": 0,
            "candidate": None, "compare": None, "key": None,
            "gap": None, "gapSequence": [], "lane": None, "shifted": None,
            "swapped": None, "insertedAt": None, "result": result,
            "range": None if range_low is None else {"low": range_low, "high": range_high},
            "pivot": None, "boundary": None, "split": split,
            "left": left, "right": right, "buffer": buffer[:], "bufferWrite": buffer_write,
            "writeAt": write_at, "finalized": [], "mergedRanges": merged_ranges,
        },
    )


def merge_range(low, high):
    calls[0] += 1
    call_index = calls[0]
    emit("merge-range", f"递归调用 {call_index}：进入区间 [{low}, {high}] / Enter range",
         "merge-split", call_index=call_index, range_low=low, range_high=high)
    if low == high:
        emit("merge-return", f"区间 [{low}, {high}] 只有一个元素，返回 / Singleton returns",
             "merge-split", call_index=call_index, range_low=low, range_high=high,
             merged_ranges=[{"low": low, "high": high}])
        return

    mid = (low + high) // 2
    emit("merge-split", f"拆分 [{low}, {high}]：mid={mid} / Split at mid={mid}",
         "merge-split", call_index=call_index, range_low=low, range_high=high, split=mid)
    merge_range(low, mid)
    merge_range(mid + 1, high)

    halves = [{"low": low, "high": mid}, {"low": mid + 1, "high": high}]
    buff = []
    left = low
    right = mid + 1
    emit("merge-start", f"开始归并 [{low}, {high}]：左 [{low}, {mid}]，右 [{mid + 1}, {high}] / Start merging",
         "merge-compare", call_index=call_index, range_low=low, range_high=high,
         split=mid, left=left, right=right, buffer=buff, merged_ranges=halves)

    while left <= mid and right <= high:
        emit("merge-compare", f"比较左 a[{left}]={a[left]} 与右 a[{right}]={a[right]} / Compare left and right",
             "merge-compare", call_index=call_index, range_low=low, range_high=high,
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
        emit("merge-write", f"较小值 {value} 从 p{source} 写入缓冲区 b{len(buff) - 1} / Append smaller value",
             "merge-compare", call_index=call_index, range_low=low, range_high=high,
             split=mid, left=left, right=right, buffer=buff,
             buffer_write={"index": len(buff) - 1, "value": value, "source": source},
             merged_ranges=halves)

    while left <= mid:
        source = left
        value = a[left]
        left += 1
        buff.append(value)
        emit("merge-copy", f"右侧耗尽：复制 p{source}={value} 到缓冲区 b{len(buff) - 1} / Copy remaining left",
             "merge-buffer", call_index=call_index, range_low=low, range_high=high,
             split=mid, left=left, right=right, buffer=buff,
             buffer_write={"index": len(buff) - 1, "value": value, "source": source},
             merged_ranges=halves)

    while right <= high:
        source = right
        value = a[right]
        right += 1
        buff.append(value)
        emit("merge-copy", f"左侧耗尽：复制 p{source}={value} 到缓冲区 b{len(buff) - 1} / Copy remaining right",
             "merge-buffer", call_index=call_index, range_low=low, range_high=high,
             split=mid, left=left, right=right, buffer=buff,
             buffer_write={"index": len(buff) - 1, "value": value, "source": source},
             merged_ranges=halves)

    for offset, value in enumerate(buff):
        target = low + offset
        a[target] = value
        emit("merge-writeback", f"缓冲区 b{offset}={value} 写回 p{target} / Write buffer slot back",
             "merge-writeback", call_index=call_index, range_low=low, range_high=high,
             split=mid, buffer=buff, write_at=target, merged_ranges=halves)

    emit("merge-range-done", f"区间 [{low}, {high}] 合并完成 / Range merged",
         "merge-writeback", call_index=call_index, range_low=low, range_high=high,
         split=mid, buffer=buff, merged_ranges=[{"low": low, "high": high}])


if n == 0:
    emit("init", "空数组：没有元素需要归并 / Empty array: nothing to merge", "init")
    emit("done", "排序完成：空数组 / Done: empty array", "done", result="empty")
else:
    emit("init", f"初始化：{n} 个元素，自顶向下拆分 / Initial array for top-down merge sort", "init")
    calls[0] = 0
    merge_range(0, n - 1)

    # The final frame must mark every slot final and the whole array merged.
    trace(
        {"type": "array", "values": a[:], "focus": []},
        "排序完成：整个数组升序 / Done: the whole array is ascending",
        variables={"round": calls[0], "arr": a[:]},
        lesson_step="merge-writeback",
        structure={
            "kind": "sorting", "algorithm": "merge", "operation": "done",
            "elements": [{"id": f"p{i}", "value": a[i]} for i in range(n)],
            "round": calls[0], "sortedFrom": n,
            "candidate": None, "compare": None, "key": None,
            "gap": None, "gapSequence": [], "lane": None, "shifted": None,
            "swapped": None, "insertedAt": None, "result": "sorted",
            "range": None, "pivot": None, "boundary": None, "split": None,
            "left": None, "right": None, "buffer": [], "bufferWrite": None,
            "writeAt": None, "finalized": list(range(n)),
            "mergedRanges": [{"low": 0, "high": n - 1}],
        },
    )
`;

export const SORTING_PYTHON = {
  selection: SELECTION_PYTHON,
  insertion: INSERTION_PYTHON,
  shell: SHELL_PYTHON,
  quick: QUICK_PYTHON,
  merge: MERGE_PYTHON,
} as const;

export const SORTING_DEFAULT_INPUT = {
  selection: SELECTION_DEFAULT_INPUT,
  insertion: INSERTION_DEFAULT_INPUT,
  shell: SHELL_DEFAULT_INPUT,
  quick: QUICK_DEFAULT_INPUT,
  merge: MERGE_DEFAULT_INPUT,
} as const;

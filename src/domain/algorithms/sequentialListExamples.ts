/**
 * L1B teaching program: a fixed-capacity sequential list.
 *
 * `data` is a real Python list used as the physical slot array. `length` is the
 * live prefix and `capacity` is never changed. Python's `list.insert()` and
 * `list.pop()` are deliberately not used: every insertion/deletion emits a
 * snapshot for each real `data[target] = data[source]` assignment, so the UI
 * shows the actual right-to-left / left-to-right copying order.
 *
 * The default example keeps the teaching contract visible: capacity 8, live
 * [10, 20, 30, 40, 50], insertion of 25 at index 2.
 *
 * INPUT-04 adds an optional `operations` array. Each entry is one operation
 * (`['insert', index, value]`, `['delete', index]`, `['search', value]`,
 * `['access', index]` or `['traverse']`); the same physical `data`/`length`
 * state carries into the next operation and one final `done` frame is emitted.
 */

export const SEQUENTIAL_LIST_DEFAULT_INPUT = {
  capacity: 8,
  values: [10, 20, 30, 40, 50],
  operation: 'insert',
  index: 2,
  value: 25,
  preset: 'insert-middle',
};

export const SEQUENTIAL_LIST_PYTHON = `# Fixed-capacity sequential list: data is the real slot array.
import math

cfg = input if isinstance(input, dict) else {}
operation = cfg.get("operation", "insert")
capacity = cfg.get("capacity", 8)
if isinstance(capacity, bool) or not isinstance(capacity, int):
    capacity = 8
capacity = max(1, min(capacity, 16))
preset = cfg.get("preset")
preset = preset if isinstance(preset, str) else None
raw_operations = cfg.get("operations")
sequence_mode = isinstance(raw_operations, list) and len(raw_operations) > 0


def number(value, fallback=0):
    if isinstance(value, bool):
        return fallback
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return value
    return fallback


def integer(value, fallback):
    if isinstance(value, bool) or not isinstance(value, int):
        return fallback
    return value


def raw_values():
    source = cfg.get("values", [])
    if not isinstance(source, list):
        return []
    return [number(item) for item in source[:capacity]]


data = [None] * capacity
initial = raw_values()
length = min(len(initial), capacity)
for i in range(length):
    data[i] = initial[i]

index = integer(cfg.get("index"), length)
target = number(cfg.get("target"), 0)
insert_value = number(cfg.get("value"), 0)
checked = []


def emit(op, action, phase, lesson, message, **extra):
    payload = {
        "kind": "sequential-list",
        "operation": op,
        "action": action,
        "phase": phase,
        "capacity": capacity,
        "length": length,
        "slots": [{"index": i, "value": data[i]} for i in range(capacity)],
    }
    if preset is not None:
        payload["preset"] = preset
    for key, value in extra.items():
        if value is not None:
            payload[key] = value
    effective = [data[i] for i in range(length)]
    trace(
        {"type": "array", "values": effective,
         "focus": [extra["focusIndex"]] if extra.get("focusIndex") is not None
         and extra["focusIndex"] < length else []},
        message,
        variables={
            "data": [data[i] for i in range(capacity)],
            "length": length,
            "capacity": capacity,
            "index": index,
            "checked": list(checked),
            "value": insert_value,
            "target": target,
        },
        lesson_step=lesson,
        structure=payload,
    )


def finish():
    # A single operation keeps its established frames, including the final
    # done frame. A sequence emits one done frame after every operation.
    if not sequence_mode:
        emit("done", "complete", "complete", "done",
             "操作完成，最终槽位与真实数组一致 / done: final slots match the real array")


def reject(lesson, message, error):
    emit(operation, "reject", "complete", lesson, message,
         focusIndex=index if 0 <= index < capacity else None,
         requestedIndex=index, error=error)


emit("init", "complete", "complete", "init",
     "初始化：capacity 是物理槽位数，length 是有效元素数 / init: capacity vs length",
     focusIndex=0 if length > 0 else None)


def apply_entry(entry):
    global operation, index, target, insert_value, length, checked
    if not isinstance(entry, list) or not entry:
        return
    op = entry[0]
    if not isinstance(op, str):
        return
    operation = op
    index = integer(cfg.get("index"), length)
    target = number(cfg.get("target"), 0)
    insert_value = number(cfg.get("value"), 0)
    if op == "insert":
        index = integer(entry[1] if len(entry) > 1 else cfg.get("index"), length)
        insert_value = number(entry[2] if len(entry) > 2 else cfg.get("value"), 0)
    elif op == "delete" or op == "access":
        index = integer(entry[1] if len(entry) > 1 else cfg.get("index"), length)
    elif op == "search":
        target = number(entry[1] if len(entry) > 1 else cfg.get("target"), 0)
    checked = []

    if operation == "access":
        if index < 0 or index >= length:
            reject("access", "索引越界：无法读取空闲区或容量外槽位 / invalid index", "index-out-of-range")
        else:
            emit("access", "check", "intermediate", "access",
                 "检查索引：0 <= index < length / bounds check",
                 focusIndex=index, requestedIndex=index)
            emit("access", "read", "complete", "access",
                 "直接定位 data[index]，随机访问 O(1) / direct slot read is O(1)",
                 focusIndex=index, requestedIndex=index, found=True,
                 foundIndex=index, result=data[index])
            finish()

    elif operation == "search":
        found_at = None
        for i in range(length):
            emit("search", "compare", "intermediate", "search",
                 "比较 data[i] 与目标值 / compare data[i] with target",
                 focusIndex=i, checked=list(checked), searchValue=target)
            if data[i] == target:
                found_at = i
                break
            checked.append(i)
        if found_at is not None:
            emit("search", "complete", "complete", "search",
                 "查找成功：目标值位于该索引 / found at this index",
                 focusIndex=found_at, checked=list(checked), searchValue=target,
                 found=True, foundIndex=found_at, result=data[found_at])
        else:
            checked = list(range(length))
            emit("search", "complete", "complete", "search",
                 "查找失败：已检查全部有效元素 / not found after scanning the live prefix",
                 checked=checked, searchValue=target, found=False)
        finish()

    elif operation == "insert":
        if index < 0 or index > length:
            reject("insert", "插入位置非法：必须满足 0 <= index <= length / invalid insertion index",
                   "index-out-of-range")
        elif length >= capacity:
            emit("insert", "check", "intermediate", "insert",
                 "检查容量：length == capacity，无法插入 / the slot array is full",
                 focusIndex=index, requestedIndex=index)
            reject("insert", "满表插入被拒绝：没有空闲槽位 / full table rejects insertion",
                   "capacity-full")
        else:
            emit("insert", "check", "intermediate", "insert",
                 "检查索引与剩余容量 / check index and free capacity",
                 focusIndex=index, requestedIndex=index)
            old_length = length
            for i in range(old_length - 1, index - 1, -1):
                before = data[i + 1]
                data[i + 1] = data[i]
                emit("insert", "shift-right", "intermediate", "insert",
                     "从后向前搬移：data[" + str(i + 1) + "] = data[" + str(i) + "] / shift right",
                     focusIndex=i + 1, sourceIndex=i, targetIndex=i + 1,
                     requestedIndex=index,
                     change={"index": i + 1, "before": before, "after": data[i + 1]})
            before_write = data[index]
            data[index] = insert_value
            emit("insert", "write", "intermediate", "insert",
                 "写入新元素到保留槽位 / write the new value into the reserved slot",
                 focusIndex=index, targetIndex=index, requestedIndex=index,
                 change={"index": index, "before": before_write, "after": data[index]})
            length = old_length + 1
            emit("insert", "complete", "complete", "insert",
                 "length 更新为 " + str(length) + "，插入完成 / insertion complete",
                 focusIndex=index, requestedIndex=index)
            finish()

    elif operation == "delete":
        if length == 0:
            reject("delete", "空表删除被拒绝：没有有效元素 / empty table rejects deletion",
                   "list-empty")
        elif index < 0 or index >= length:
            reject("delete", "删除位置非法：必须满足 0 <= index < length / invalid deletion index",
                   "index-out-of-range")
        else:
            emit("delete", "check", "intermediate", "delete",
                 "检查索引：被删位置必须位于有效区 / bounds check",
                 focusIndex=index, requestedIndex=index)
            removed = data[index]
            emit("delete", "save", "intermediate", "delete",
                 "保存被删除元素 / remember the removed value",
                 focusIndex=index, requestedIndex=index, removedIndex=index,
                 removedValue=removed)
            for i in range(index, length - 1):
                before = data[i]
                data[i] = data[i + 1]
                emit("delete", "shift-left", "intermediate", "delete",
                     "从前向后搬移：data[" + str(i) + "] = data[" + str(i + 1) + "] / shift left",
                     focusIndex=i, sourceIndex=i + 1, targetIndex=i,
                     requestedIndex=index, removedIndex=index, removedValue=removed,
                     change={"index": i, "before": before, "after": data[i]})
            length = length - 1
            before_clear = data[length]
            data[length] = None
            emit("delete", "clear", "intermediate", "delete",
                 "清理最后一个无效槽位 / clear the first free slot",
                 focusIndex=length, targetIndex=length, requestedIndex=index,
                 removedIndex=index, removedValue=removed,
                 change={"index": length, "before": before_clear, "after": None})
            emit("delete", "complete", "complete", "delete",
                 "length 更新为 " + str(length) + "，删除完成 / deletion complete",
                 focusIndex=index, requestedIndex=index)
            finish()

    elif operation == "traverse":
        for i in range(length):
            emit("traverse", "visit", "intermediate", "traverse",
                 "访问有效槽位 / visit one live slot",
                 focusIndex=i, checked=list(checked))
            checked.append(i)
        emit("traverse", "complete", "complete", "traverse",
             "遍历完成：只访问 [0, length) / traversal stops at length",
             checked=list(checked))
        finish()

    else:
        emit("init", "complete", "complete", "init",
             "未知操作，默认展示初始化状态 / unknown operation", focusIndex=None)


if sequence_mode:
    for entry in raw_operations:
        apply_entry(entry)
    emit("done", "complete", "complete", "done",
         "操作序列完成，最终槽位与真实数组一致 / sequence done: final slots match the real array")
else:
    single = [operation]
    if operation == "insert":
        single = [operation, cfg.get("index"), cfg.get("value")]
    elif operation == "delete" or operation == "access":
        single = [operation, cfg.get("index")]
    elif operation == "search":
        single = [operation, cfg.get("target")]
    apply_entry(single)
`;

export const SEQUENTIAL_LIST_PRESETS = [
  { id: 'access-middle', label: 'seqPresetAccessMiddle', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'access', index: 2 } },
  { id: 'access-out', label: 'seqPresetAccessOut', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'access', index: 9 } },
  { id: 'search-hit', label: 'seqPresetSearchHit', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'search', target: 30 } },
  { id: 'search-miss', label: 'seqPresetSearchMiss', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'search', target: 99 } },
  { id: 'insert-middle', label: 'seqPresetInsertMiddle', input: SEQUENTIAL_LIST_DEFAULT_INPUT },
  { id: 'insert-head', label: 'seqPresetInsertHead', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'insert', index: 0, value: 5 } },
  { id: 'insert-tail', label: 'seqPresetInsertTail', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'insert', index: 5, value: 60 } },
  { id: 'delete-middle', label: 'seqPresetDeleteMiddle', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'delete', index: 1 } },
  { id: 'delete-head', label: 'seqPresetDeleteHead', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'delete', index: 0 } },
  { id: 'delete-tail', label: 'seqPresetDeleteTail', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'delete', index: 4 } },
  { id: 'traverse', label: 'seqPresetTraverse', input: { capacity: 8, values: [10, 20, 30, 40, 50], operation: 'traverse' } },
  { id: 'empty', label: 'seqPresetEmpty', input: { capacity: 8, values: [], operation: 'traverse' } },
  { id: 'empty-delete', label: 'seqPresetEmptyDelete', input: { capacity: 8, values: [], operation: 'delete', index: 0 } },
  { id: 'full-insert', label: 'seqPresetFullInsert', input: { capacity: 8, values: [1, 2, 3, 4, 5, 6, 7, 8], operation: 'insert', index: 0, value: 0 } },
] as const;

export type SequentialListPreset = (typeof SEQUENTIAL_LIST_PRESETS)[number];
export type SequentialListPresetId = SequentialListPreset['id'];

export function sequentialListPresetFromInput(value: unknown): SequentialListPresetId | null {
  if (!value || typeof value !== 'object') return null;
  const preset = (value as { preset?: unknown }).preset;
  return typeof preset === 'string'
    ? SEQUENTIAL_LIST_PRESETS.find((item) => item.id === preset)?.id ?? null
    : null;
}

export function sequentialListPresetInput(id: SequentialListPresetId): unknown {
  const preset = SEQUENTIAL_LIST_PRESETS.find((item) => item.id === id) ?? SEQUENTIAL_LIST_PRESETS[0];
  return { ...preset.input, preset: preset.id };
}

export function sequentialListPythonExample(): string {
  return SEQUENTIAL_LIST_PYTHON;
}

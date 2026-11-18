/**
 * T3: real Python max-heap teaching program.
 *
 * The array is the source of truth: `VALUES[slot]` and `IDS[slot]` are the
 * current contents of one array index. A swap moves both the value and its
 * stable teaching id; the complete binary tree is always derived from `slot`,
 * so swapping can never reshape the tree. Every frame snapshots the array after
 * the operation named on that frame.
 */

export const MAX_HEAP_COMMAND = ['build', 'push', 'extract', 'sort'] as const;
export type HeapCommand = (typeof MAX_HEAP_COMMAND)[number];

export const HEAP_PRESETS = [
  {
    id: 'build',
    command: 'build',
    label: 'heapPresetBuild',
    heap: [4, 9, 2, 7, 5, 9, 1],
    value: null,
  },
  {
    id: 'push',
    command: 'push',
    label: 'heapPresetPush',
    heap: [9, 8, 6, 3, 7, 2],
    value: 10,
  },
  {
    id: 'extract',
    command: 'extract',
    label: 'heapPresetExtract',
    heap: [9, 8, 6, 3, 7, 2, 5],
    value: null,
  },
  {
    id: 'sort',
    command: 'sort',
    label: 'heapPresetSort',
    heap: [5, 1, 9, 3, 9, 2, 6],
    value: null,
  },
] as const;

export type HeapPreset = (typeof HEAP_PRESETS)[number];
export type HeapPresetId = HeapPreset['id'];

export const HEAP_DEFAULT_INPUT: unknown = {
  preset: 'build',
  operation: 'build',
  heap: [4, 9, 2, 7, 5, 9, 1],
  value: null,
};

export const HEAP_PYTHON = `# Max heap in one real Python array. Slots own positions; ids own identities.
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
OPERATION = raw_input.get("operation", "build")
if OPERATION not in ("build", "push", "extract", "sort"):
    OPERATION = "build"
raw_heap = raw_input.get("heap", [])
if not isinstance(raw_heap, list):
    raw_heap = []
VALUES = []
for item in raw_heap:
    if isinstance(item, bool) or not isinstance(item, (int, float)):
        continue
    if not math.isfinite(item):
        continue
    VALUES.append(item)
VALUES = VALUES[:24]
raw_value = raw_input.get("value", 0)
if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)) or not math.isfinite(raw_value):
    raw_value = 0
PUSH_VALUE = raw_value
PRESET = raw_input.get("preset")
if PRESET is not None and not isinstance(PRESET, str):
    PRESET = None

IDS = ["h" + str(index + 1) for index in range(len(VALUES))]
TOTAL = len(VALUES)
HEAP_SIZE = TOTAL
SORTED_FROM = None

def do_swap(first, second):
    VALUES[first], VALUES[second] = VALUES[second], VALUES[first]
    IDS[first], IDS[second] = IDS[second], IDS[first]

def ancestry(slot):
    if slot is None or slot < 0 or slot >= HEAP_SIZE:
        return []
    result = []
    current = slot
    while True:
        result.append(IDS[current])
        if current == 0:
            break
        current = (current - 1) // 2
    result.reverse()
    return result

def parent_pair(parent, child):
    return {"parentId": IDS[parent], "childId": IDS[child]}

def children_pair(left):
    return {"leftId": IDS[left], "rightId": IDS[left + 1]}

def swap_pair(first, second):
    return {"firstId": IDS[first], "secondId": IDS[second]}

def snapshot(operation, active_slot, compare_parent, compare_children, swapped,
             added_id, removed, replacement, result):
    elements = []
    for slot in range(TOTAL):
        elements.append({"id": IDS[slot], "value": VALUES[slot], "slot": slot})
    return {
        "kind": "max-heap",
        "preset": PRESET,
        "command": OPERATION,
        "operation": operation,
        "totalSize": TOTAL,
        "heapSize": HEAP_SIZE,
        "elements": elements,
        "rootId": IDS[0] if HEAP_SIZE > 0 else None,
        "activeId": IDS[active_slot] if active_slot is not None and 0 <= active_slot < HEAP_SIZE else None,
        "pathIds": ancestry(active_slot),
        "compareParent": compare_parent,
        "compareChildren": compare_children,
        "swap": swapped,
        "addedId": added_id,
        "removed": removed,
        "replacement": replacement,
        "sortedFrom": SORTED_FROM,
        "result": result,
    }

def emit(operation, message, line, lesson, active_slot=None,
         compare_parent=None, compare_children=None, swapped=None,
         added=None, removed=None, replacement=None, result=None):
    payload = snapshot(
        operation, active_slot, compare_parent, compare_children,
        swapped, added, removed, replacement, result,
    )
    focus = [active_slot] if active_slot is not None and 0 <= active_slot < HEAP_SIZE else []
    state = {
        "type": "array",
        "values": list(VALUES),
        "focus": focus,
        "done": operation == "done",
    }
    variables = {
        "array": list(VALUES),
        "ids": list(IDS),
        "heap_size": HEAP_SIZE,
        "root": VALUES[0] if HEAP_SIZE > 0 else None,
        "sorted_from": SORTED_FROM,
    }
    if removed is not None:
        variables["removed"] = removed["value"]
    trace(state, message, line=line, variables=variables,
          lesson_step=lesson, structure=payload)

def sift_down(start):
    current = start
    while True:
        left = 2 * current + 1
        if left >= HEAP_SIZE:
            return
        right = left + 1
        if right < HEAP_SIZE:
            emit("compare-children",
                 "比较左右孩子 #" + str(left) + "=" + str(VALUES[left]) + " 与 #" + str(right) + "=" + str(VALUES[right]) + " / compare children",
                 82, "compare-children", active_slot=current,
                 compare_children=children_pair(left))
            child = left if VALUES[left] >= VALUES[right] else right
        else:
            child = left
        emit("compare-parent-child",
             "比较父 #" + str(current) + "=" + str(VALUES[current]) + " 与子 #" + str(child) + "=" + str(VALUES[child]) + " / compare parent and child",
             86, "compare-parent", active_slot=current,
             compare_parent=parent_pair(current, child))
        if VALUES[current] >= VALUES[child]:
            return
        do_swap(current, child)
        emit("swap",
             "交换 #" + str(current) + " ↔ #" + str(child) + "：" + str(VALUES[child]) + " 下沉 / sift down",
             90, "swap", active_slot=child, swapped=swap_pair(current, child))
        current = child

def sift_up(start):
    current = start
    while current > 0:
        parent = (current - 1) // 2
        emit("compare-parent-child",
             "上浮比较父 #" + str(parent) + "=" + str(VALUES[parent]) + " 与 #" + str(current) + "=" + str(VALUES[current]) + " / sift-up compare",
             105, "compare-parent", active_slot=current,
             compare_parent=parent_pair(parent, current))
        if VALUES[parent] >= VALUES[current]:
            return
        do_swap(parent, current)
        emit("swap",
             "上浮交换 #" + str(parent) + " ↔ #" + str(current) + "：" + str(VALUES[parent]) + " 继续向上 / sift up",
             109, "swap", active_slot=parent, swapped=swap_pair(parent, current))
        current = parent

def build_max_heap(final):
    global HEAP_SIZE, SORTED_FROM
    HEAP_SIZE = TOTAL
    SORTED_FROM = None
    emit("init", "数组按层序对应完全二叉树：槽位 i 的左孩子 2i+1、右孩子 2i+2 / array as a complete tree",
         120, "init")
    last_parent = TOTAL // 2 - 1
    if last_parent >= 0:
        emit("build-start",
             "从最后一个非叶节点 #" + str(last_parent) + " 开始，自底向上建堆 / build from the last non-leaf",
             124, "build")
        for start in range(last_parent, -1, -1):
            emit("heapify-node",
                 "下沉调整以 #" + str(start) + "=" + str(VALUES[start]) + " 为根的子树 / heapify subtree",
                 128, "heapify", active_slot=start)
            sift_down(start)
    else:
        emit("build-start", "数组不足两个元素，没有非叶节点 / no non-leaf node",
             124, "build")
    if final:
        emit("done", "建堆完成：每个父节点都不小于孩子 / build complete",
             134, "done", result="built")
    else:
        emit("build-done", "最大堆已建立，开始堆排序 / max heap ready for heap sort",
             138, "build")

def push_value(value):
    global TOTAL, HEAP_SIZE, SORTED_FROM
    HEAP_SIZE = TOTAL
    SORTED_FROM = None
    emit("init", "当前最大堆：插入前先确认数组 / max heap before push", 150, "init")
    slot = TOTAL
    IDS.append("h" + str(slot + 1))
    VALUES.append(value)
    TOTAL += 1
    HEAP_SIZE += 1
    added_id = IDS[slot]
    emit("push-append",
         "把 " + str(value) + " 追加到数组末尾 #" + str(slot) + "，准备上浮 / append at the tail",
         155, "insert", active_slot=slot, added=added_id)
    sift_up(slot)
    emit("done", "插入完成：" + str(value) + " 已进入正确位置 / push complete",
         161, "done", result="pushed")

def extract_max():
    global TOTAL, HEAP_SIZE, SORTED_FROM
    HEAP_SIZE = TOTAL
    SORTED_FROM = None
    emit("init", "当前最大堆：堆顶是最大值 / current max heap", 170, "init")
    if HEAP_SIZE == 0:
        emit("extract-select", "空堆：没有可删除的堆顶 / empty heap", 174, "extract")
        emit("done", "空堆删除结果：empty / extract from empty heap",
             180, "done", result="empty")
        return
    root_value = VALUES[0]
    root_id = IDS[0]
    emit("extract-select",
         "堆顶最大值 #0=" + str(root_value) + "；记录返回值并准备删除 / select maximum",
         174, "extract", active_slot=0)
    removed = {"id": root_id, "value": root_value, "slot": 0}
    if HEAP_SIZE == 1:
        VALUES.pop()
        IDS.pop()
        TOTAL = 0
        HEAP_SIZE = 0
        emit("replace-root", "只有一个元素：删除后堆为空 / single element leaves an empty heap",
             184, "extract", removed=removed)
        emit("done", "删除堆顶完成，返回 " + str(root_value) + " / extract complete",
             190, "done", removed=removed, result="extracted")
        return
    old_tail = HEAP_SIZE - 1
    tail_id = IDS[old_tail]
    tail_value = VALUES[old_tail]
    VALUES.pop()
    IDS.pop()
    TOTAL -= 1
    HEAP_SIZE -= 1
    VALUES[0] = tail_value
    IDS[0] = tail_id
    replacement = {"id": tail_id, "fromSlot": old_tail, "toSlot": 0}
    emit("replace-root",
         "末尾元素 " + str(tail_value) + " 移到 #0；堆大小变为 " + str(HEAP_SIZE) + "，准备下沉 / tail replaces root",
         184, "extract", active_slot=0, removed=removed, replacement=replacement)
    if HEAP_SIZE > 1:
        sift_down(0)
    emit("done", "删除堆顶完成，返回 " + str(root_value) + " / extract complete",
         190, "done", removed=removed, result="extracted")

def heap_sort():
    global HEAP_SIZE, SORTED_FROM, TOTAL
    build_max_heap(False)
    for end in range(TOTAL - 1, 0, -1):
        emit("sort-select",
             "当前堆顶 #0=" + str(VALUES[0]) + " 是最大值；与堆尾 #" + str(end) + " 交换 / select maximum",
             204, "sort", active_slot=0)
        do_swap(0, end)
        HEAP_SIZE = end
        SORTED_FROM = end
        emit("swap-to-end",
             "交换 #0 ↔ #" + str(end) + "，堆区缩小到 " + str(end) + "；后缀开始有序 / swap root to the sorted suffix",
             208, "sort", active_slot=0, swapped=swap_pair(0, end))
        if HEAP_SIZE > 1:
            sift_down(0)
    HEAP_SIZE = 0
    SORTED_FROM = 0
    emit("done", "堆排序完成，数组升序：" + str(VALUES) + " / heap sort complete",
         218, "done", result="sorted")

if OPERATION == "build":
    build_max_heap(True)
elif OPERATION == "push":
    push_value(PUSH_VALUE)
elif OPERATION == "extract":
    extract_max()
else:
    heap_sort()
`;

export function heapCommandFromInput(input: unknown): HeapCommand {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'build';
  const operation = (input as { operation?: unknown }).operation;
  return operation === 'push' || operation === 'extract' || operation === 'sort' ? operation : 'build';
}

export function heapValuesFromInput(input: unknown): unknown[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return [];
  const heap = (input as { heap?: unknown }).heap;
  return Array.isArray(heap) ? heap : [];
}

export function heapValueFromInput(input: unknown): number {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 0;
  const value = (input as { value?: unknown }).value;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function heapPresetFromInput(input: unknown): HeapPresetId | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const preset = (input as { preset?: unknown }).preset;
  return HEAP_PRESETS.some((item) => item.id === preset) ? (preset as HeapPresetId) : null;
}

export function heapPresetInput(id: HeapPresetId): unknown {
  const preset = HEAP_PRESETS.find((item) => item.id === id) ?? HEAP_PRESETS[0];
  return {
    preset: preset.id,
    operation: preset.command,
    heap: [...preset.heap],
    value: preset.value,
  };
}

export function heapPythonExample(): string {
  return HEAP_PYTHON;
}

/**
 * TEXTBOOK-08: mark-and-sweep and storage compaction over a small object graph.
 *
 * Both modes share one object model. Reachability is computed from the root set;
 * a cycle with no root is therefore unreachable, while an object with an in-edge
 * from unreachable garbage is not automatically live. Compaction moves only live
 * objects, records old/new addresses, and recomputes every reference address.
 */
import type { AlgorithmEntry } from './types';

export const GARBAGE_COLLECTION_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '◎',
  name: ['无用单元收集与存储紧缩', 'Garbage collection and compaction'],
  desc: [
    '以根集合为起点标记可达对象，再把不可达对象回收。Mark-Sweep 模式留下分散空洞；Compaction 模式把存活对象移到连续区域，并同步更新所有引用地址。',
    'Mark reachable objects from the root set, then reclaim the rest. Mark-Sweep leaves scattered holes; Compaction moves live objects into a contiguous region and updates every reference address.',
  ],
  time: 'Mark O(N + E); compaction adds moving live bytes',
  space: 'O(N + E) for marks, ids and references',
  input: undefined,
  code: "trace({type:'graph',values:['Garbage collection: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const GARBAGE_COLLECTION_DEFAULT_INPUT: unknown = {
  mode: 'mark-sweep',
  capacity: 96,
  roots: ['A'],
  objects: [
    { id: 'A', size: 12, refs: ['B', 'C'] },
    { id: 'E', size: 8, refs: ['F'] },
    { id: 'B', size: 10, refs: ['D'] },
    { id: 'F', size: 8, refs: ['E'] },
    { id: 'C', size: 8, refs: ['B'] },
    { id: 'G', size: 6, refs: [] },
    { id: 'D', size: 12, refs: [] },
    { id: 'H', size: 8, refs: ['A'] },
  ],
};

export const GARBAGE_COLLECTION_PYTHON = `import re
import sys

raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be {mode, capacity, objects, roots}")
mode = raw.get("mode", "mark-sweep")
capacity = raw.get("capacity")
objects_input = raw.get("objects")
roots_input = raw.get("roots", [])
if mode not in ("mark-sweep", "compaction"):
    raise ValueError("mode must be mark-sweep or compaction")
if not isinstance(capacity, int) or isinstance(capacity, bool) or capacity < 16 or capacity > 128:
    raise ValueError("capacity must be an integer from 16 to 128")
if not isinstance(objects_input, list) or not objects_input or len(objects_input) > 8:
    raise ValueError("objects must contain 1 to 8 entries")
if not isinstance(roots_input, list) or len(roots_input) > 4:
    raise ValueError("roots must contain at most 4 ids")

objects = {}
order = []
total_size = 0
for index, item in enumerate(objects_input, 1):
    if not isinstance(item, dict):
        raise ValueError("object " + str(index) + " must be an object")
    object_id = item.get("id")
    size = item.get("size")
    refs = item.get("refs", [])
    if not isinstance(object_id, str) or not re.match(r"^[A-Za-z0-9]{1,3}$", object_id):
        raise ValueError("object " + str(index) + " needs a 1-3 character id")
    if object_id in objects:
        raise ValueError("duplicate object id " + object_id)
    if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
        raise ValueError("object " + object_id + " needs a positive size")
    if not isinstance(refs, list):
        raise ValueError("refs of " + object_id + " must be an array")
    total_size += size
    if total_size > capacity:
        raise ValueError("objects exceed capacity")
    objects[object_id] = {
        "id": object_id,
        "size": size,
        "status": "allocated",
        "marked": False,
        "reachable": False,
        "root": False,
        "previousStart": None,
    }
    order.append(object_id)

refs = []
edge_count = 0
for item in objects_input:
    source = item["id"]
    for target in item.get("refs", []):
        if not isinstance(target, str) or target not in objects:
            raise ValueError("reference target " + str(target) + " does not exist")
        edge_count += 1
        if edge_count > 16:
            raise ValueError("at most 16 references are supported")
        refs.append({"id": "e" + str(edge_count), "fromId": source, "toId": target})

roots = []
for root in roots_input:
    if not isinstance(root, str) or root not in objects:
        raise ValueError("root " + str(root) + " does not exist")
    if root not in roots:
        roots.append(root)
    objects[root]["root"] = True

# Initial placement is contiguous in input order, leaving one tail free span.
cursor = 0
for object_id in order:
    objects[object_id]["start"] = cursor
    cursor += objects[object_id]["size"]

graph = {object_id: [] for object_id in order}
for ref in refs:
    graph[ref["fromId"]].append(ref["toId"])


def reachable_from_roots():
    reached = set()
    queue = list(roots)
    while queue:
        object_id = queue.pop(0)
        if object_id in reached:
            continue
        reached.add(object_id)
        for target in graph[object_id]:
            if target not in reached:
                queue.append(target)
    return reached


reachable_all = reachable_from_roots()


def allocated_objects():
    return [objects[object_id] for object_id in order if objects[object_id]["status"] == "allocated"]


def free_spans():
    spans = []
    cursor = 0
    for object_value in sorted(allocated_objects(), key=lambda value: value["start"]):
        if object_value["start"] > cursor:
            spans.append({"start": cursor, "size": object_value["start"] - cursor})
        cursor = object_value["start"] + object_value["size"]
    if cursor < capacity:
        spans.append({"start": cursor, "size": capacity - cursor})
    return spans


def ref_payload():
    # References owned by reclaimed objects no longer exist. Keeping them would
    # display a stale address after compaction, so only live edges are emitted.
    return [
        {
            "id": ref["id"],
            "fromId": ref["fromId"],
            "toId": ref["toId"],
            "fromStart": objects[ref["fromId"]]["start"],
            "toStart": objects[ref["toId"]]["start"],
        }
        for ref in refs
        if objects[ref["fromId"]]["status"] == "allocated"
        and objects[ref["toId"]]["status"] == "allocated"
    ]


def emit(operation, message, lesson, current=None, target=None, moved=None, updated=None, decision=None):
    global last_move
    if moved is not None:
        last_move = moved
    marked = [object_id for object_id in order if objects[object_id]["marked"]]
    occupied = allocated_objects()
    live_bytes = sum(item["size"] for item in occupied)
    payload = {
        "kind": "garbage-collection",
        "algorithm": "garbage-collection",
        "mode": mode,
        "operation": operation,
        "capacity": capacity,
        "objects": [
            {
                "id": item["id"],
                "size": item["size"],
                "start": item["start"],
                "status": item["status"],
                "marked": item["marked"],
                "reachable": item["reachable"],
                "root": item["root"],
                "previousStart": item["previousStart"],
            }
            for item in (objects[object_id] for object_id in order)
        ],
        "refs": ref_payload(),
        "roots": roots[:],
        "reachableIds": sorted(reachable_all),
        "markedIds": marked,
        "freeSpans": free_spans(),
        "currentObjectId": current,
        "targetObjectId": target,
        "stackIds": work_stack[:],
        "lastMove": last_move,
        "updatedRefIds": updated or [],
        "liveBytes": live_bytes,
        "freeBytes": capacity - live_bytes,
        "decision": decision,
    }
    variables = {
        "mode": mode,
        "roots": roots[:],
        "marked": marked,
        "reachable": sorted(reachable_all),
        "free_spans": [[span["start"], span["size"]] for span in free_spans()],
        "addresses": {object_id: objects[object_id]["start"] for object_id in order},
    }
    trace(
        {
            "type": "graph",
            "values": order,
            "focus": [current] if current is not None else [],
            "visited": marked,
        },
        message,
        line=sys._getframe(1).f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


work_stack = []
queued = set()
last_move = None
emit("init", "初始化：从根集合出发，对象图与内存对象一一对应 / Init: roots and object graph", "init")

# Mark phase. A queued object is never pushed twice, so cycles terminate.
for root in roots:
    if root not in queued and not objects[root]["marked"]:
        work_stack.append(root)
        queued.add(root)
        emit("root", "根引用 " + root + " 入栈 / Push root " + root, "root", current=root, decision="root-push")
    else:
        emit("root", "根引用 " + root + " 已在待访问集合，跳过重复入栈 / Root already queued", "root", current=root, decision="already-marked")

while work_stack:
    current = work_stack.pop()
    queued.discard(current)
    if objects[current]["marked"]:
        emit("skip", current + " 已经标记，不再重复访问 / Already marked; skip", "skip", current=current, decision="already-marked")
        continue
    objects[current]["marked"] = True
    objects[current]["reachable"] = True
    emit(
        "visit",
        "访问并标记 " + current + "；当前已标记 " + str(len([item for item in order if objects[item]["marked"]])) + " 个对象 / Visit and mark " + current,
        "visit",
        current=current,
        decision="visit",
    )
    for target in graph[current]:
        if objects[target]["marked"]:
            emit(
                "skip",
                "引用 " + current + "→" + target + " 指向已标记对象，跳过 / Target already marked",
                "skip",
                current=current,
                target=target,
                decision="already-marked",
            )
        elif target in queued:
            emit(
                "skip",
                "引用 " + current + "→" + target + " 已在栈中，避免重复 / Target already queued",
                "skip",
                current=current,
                target=target,
                decision="already-marked",
            )
        else:
            work_stack.append(target)
            queued.add(target)
            emit(
                "follow",
                "沿引用 " + current + "→" + target + " 把目标入栈 / Follow " + current + "→" + target,
                "follow",
                current=current,
                target=target,
                decision="follow",
            )

emit(
    "marked",
    "标记结束：可达对象 " + str(sorted(reachable_all)) + "；不可达对象不会被标记 / Mark complete",
    "marked",
    decision="done",
)

if mode == "mark-sweep":
    for object_id in order:
        item = objects[object_id]
        if item["marked"]:
            emit(
                "sweep",
                "扫描 " + object_id + "：已标记，保留 / Sweep " + object_id + ": marked, keep",
                "sweep",
                current=object_id,
                decision="sweep-live",
            )
        else:
            item["status"] = "free"
            item["reachable"] = False
            emit(
                "free",
                "扫描 " + object_id + "：从根不可达，回收其 " + str(item["size"]) + " 字节 / Reclaim unreachable " + object_id,
                "free",
                current=object_id,
                decision="sweep-free",
            )
else:
    # Compact mode reuses the marked set. Dead objects stop occupying memory
    # first; then every live object is moved to the next packed address.
    for object_id in order:
        if not objects[object_id]["marked"]:
            objects[object_id]["status"] = "free"
    emit(
        "select",
        "紧缩开始：不可达对象不再占用内存，存活对象按地址顺序前移 / Compaction starts; dead objects no longer occupy memory",
        "select",
        decision="compact-start",
    )
    next_free = 0
    for object_id in order:
        item = objects[object_id]
        if not item["marked"]:
            continue
        old_start = item["start"]
        if old_start == next_free:
            emit(
                "select",
                "存活对象 " + object_id + " 已在目标地址 " + str(next_free) + "，无需移动 / " + object_id + " is already in place",
                "select",
                current=object_id,
                decision="in-place",
            )
        else:
            item["previousStart"] = old_start
            item["start"] = next_free
            incoming = [ref["id"] for ref in refs if ref["toId"] == object_id]
            moved = {"objectId": object_id, "from": old_start, "to": next_free}
            emit(
                "move",
                "移动 " + object_id + "：" + str(old_start) + " → " + str(next_free) + "，旧地址立即失效 / Move " + object_id + " from " + str(old_start) + " to " + str(next_free),
                "move",
                current=object_id,
                moved=moved,
                decision="move",
            )
            emit(
                "update",
                "更新 " + str(len(incoming)) + " 条指向 " + object_id + " 的引用到新地址 " + str(next_free) + " / Update incoming references",
                "update",
                current=object_id,
                moved=moved,
                updated=incoming,
                decision="move",
            )
        next_free += item["size"]

emit(
    "done",
    "完成：存活对象 " + str(len([object_id for object_id in order if objects[object_id]["marked"]])) + " 个，空闲字节 " + str(capacity - sum(objects[object_id]["size"] for object_id in order if objects[object_id]["marked"])) + " / Done",
    "done",
    decision="done",
)

live_objects = [objects[object_id] for object_id in order if objects[object_id]["marked"]]
print("mode", mode)
print("live", [(item["id"], item["start"], item["size"]) for item in live_objects])
print("free", [(span["start"], span["size"]) for span in free_spans()])
print("refs", [(ref["fromId"], ref["toId"], objects[ref["toId"]]["start"]) for ref in refs])
`;

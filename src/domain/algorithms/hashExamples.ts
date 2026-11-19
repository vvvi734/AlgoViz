/**
 * F2: real Python hash tables.
 *
 * Chaining stores real Node objects with real `next` references; probing stores
 * tri-state slots (EMPTY / OCCUPIED / DELETED). Both emit one `hash` structure
 * per real hash, comparison, relink or probe move.
 */

export const HASH_CHAIN_INPUT: unknown = {
  tableSize: 7,
  operations: [
    ['insert', 1],
    ['insert', 8],
    ['insert', 15],
    ['insert', 8],
    ['find', 8],
    ['find', 99],
    ['delete', 8],
    ['find', 1],
    ['delete', 1],
    ['find', 15],
    ['delete', 15],
    ['insert', 22],
    ['find', 22],
  ],
};

export const HASH_PROBE_INPUT: unknown = {
  tableSize: 7,
  operations: [
    ['insert', 1],
    ['insert', 8],
    ['insert', 15],
    ['find', 8],
    ['find', 99],
    ['delete', 8],
    ['find', 15],
    ['delete', 99],
    ['insert', 22],
    ['insert', 3],
    ['insert', 10],
    ['insert', 17],
    ['insert', 24],
    ['insert', 31],
    ['delete', 15],
    ['find', 24],
    ['delete', 24],
    ['find', 31],
    ['insert', 31],
    ['insert', 38],
  ],
};

export const CHAINING_PYTHON = `# Separate chaining: buckets hold real Node objects linked by real next references.
import math

raw = input
if isinstance(raw, dict):
    operations = raw.get("operations", [])
    table_size = raw.get("tableSize", 7)
else:
    operations = raw
    table_size = 7
if not isinstance(table_size, int) or isinstance(table_size, bool):
    table_size = 7
m = max(2, min(17, table_size))

class Node:
    __slots__ = ("id", "key", "next")
    def __init__(self, node_id, key, next_node=None):
        self.id = node_id
        self.key = key
        self.next = next_node

buckets = [None for _ in range(m)]
count = 0
sequence = 0

PHASES = {
    "init": "init", "hash": "hash", "bucket": "locate", "chain-compare": "compare",
    "insert": "insert", "duplicate": "compare", "found": "result", "not-found": "failed",
    "delete-head": "relink", "delete-middle": "relink", "delete-tail": "relink",
    "delete-missing": "failed", "done": "result",
}


def collect_nodes():
    items = []
    for bucket in range(m):
        node = buckets[bucket]
        while node is not None:
            items.append({
                "id": node.id, "key": node.key, "bucket": bucket,
                "nextId": node.next.id if node.next is not None else None,
            })
            node = node.next
    return items


def emit(operation, message, lesson, key=None, bucket_index=None, current=None,
         previous=None, comparison=None, conflict=None, removed=None,
         result=None, found=None):
    items = collect_nodes()
    values = [entry["key"] for entry in items]
    trace(
        {"type": "array", "values": values, "focus": []},
        message,
        variables={
            "tableSize": m, "buckets": [None if buckets[i] is None else buckets[i].key for i in range(m)],
            "count": count, "loadFactor": count / m, "key": key,
            "bucketIndex": bucket_index, "current": None if current is None else current.key,
            "result": result,
        },
        lesson_step=lesson,
        structure={
            "kind": "hash", "algorithm": "chaining", "operation": operation,
            "phase": PHASES[operation], "tableSize": m, "key": key,
            "hashIndex": None if key is None else key % m, "bucketIndex": bucket_index,
            "currentNodeId": None if current is None else current.id,
            "previousNodeId": None if previous is None else previous.id,
            "comparison": comparison,
            "buckets": [{"index": i, "headId": None if buckets[i] is None else buckets[i].id} for i in range(m)],
            "nodes": items, "slots": [], "probePath": [], "currentIndex": None,
            "reusedDeleted": False, "conflict": conflict, "removed": removed,
            "result": result, "found": found, "elementCount": count,
            "loadFactor": count / m, "reason": None,
        },
    )


def normalize_operation(entry):
    if not isinstance(entry, (list, tuple)) or len(entry) < 2:
        return None, None
    op = entry[0]
    key = entry[1]
    if op not in ("insert", "find", "delete"):
        return None, None
    if not isinstance(key, int) or isinstance(key, bool):
        return None, None
    return op, key


emit("init", f"空表：{m} 个桶全部为 NULL / Empty table: all {m} buckets are NULL", "init")
for entry in operations:
    op, key = normalize_operation(entry)
    if op is None:
        continue
    bucket = key % m
    emit("hash", f"h({key}) = {key} % {m} = {bucket} / compute the hash", "hash", key=key, bucket_index=bucket)
    occupied = buckets[bucket] is not None
    emit("bucket", f"定位桶 {bucket}：{'已有节点，发生冲突' if occupied else '空桶'} / locate bucket",
         "collision" if occupied else "hash", key=key, bucket_index=bucket,
         conflict=occupied)

    if op == "insert":
        node = buckets[bucket]
        previous = None
        while node is not None:
            same = node.key == key
            emit("chain-compare", f"比较节点 {node.id}：键 {node.key} {'=' if same else '≠'} {key} / compare",
                 "collision", key=key, bucket_index=bucket, current=node, previous=previous,
                 comparison="equal" if same else "different", conflict=True)
            if same:
                emit("duplicate", f"键 {key} 已存在：拒绝重复插入，表不变 / duplicate key rejected",
                     "result", key=key, bucket_index=bucket, current=node, previous=previous,
                     comparison="equal", conflict=True, result="duplicate")
                break
            previous = node
            node = node.next
        else:
            sequence += 1
            new_node = Node(f"n{sequence}", key, buckets[bucket])
            buckets[bucket] = new_node
            count += 1
            emit("insert", f"新节点 {new_node.id} 成为桶 {bucket} 的桶头，next → 原桶头 / link new head",
                 "resolve", key=key, bucket_index=bucket, current=new_node, previous=None,
                 conflict=occupied, result="inserted")

    elif op == "find":
        node = buckets[bucket]
        previous = None
        while node is not None:
            same = node.key == key
            emit("chain-compare", f"比较节点 {node.id}：键 {node.key} {'=' if same else '≠'} {key} / compare",
                 "collision", key=key, bucket_index=bucket, current=node, previous=previous,
                 comparison="equal" if same else "different", conflict=True)
            if same:
                emit("found", f"在桶 {bucket} 命中节点 {node.id}：键 {key} / found in bucket",
                     "result", key=key, bucket_index=bucket, current=node, previous=previous,
                     comparison="equal", conflict=occupied, result="found", found=True)
                break
            previous = node
            node = node.next
        else:
            emit("not-found", f"沿桶 {bucket} 的链表到 NULL 仍未找到 {key} / reached NULL: not found",
                 "result", key=key, bucket_index=bucket, current=None, conflict=occupied,
                 result="not-found", found=False)

    else:
        node = buckets[bucket]
        previous = None
        while node is not None:
            same = node.key == key
            emit("chain-compare", f"比较节点 {node.id}：键 {node.key} {'=' if same else '≠'} {key} / compare",
                 "collision", key=key, bucket_index=bucket, current=node, previous=previous,
                 comparison="equal" if same else "different", conflict=True)
            if same:
                next_node = node.next
                if previous is None:
                    buckets[bucket] = next_node
                    position = "head"
                    operation_name = "delete-head"
                elif next_node is None:
                    previous.next = None
                    position = "tail"
                    operation_name = "delete-tail"
                else:
                    previous.next = next_node
                    position = "middle"
                    operation_name = "delete-middle"
                count -= 1
                removed = {
                    "kind": "node", "id": node.id, "key": node.key,
                    "nextId": None if next_node is None else next_node.id, "position": position,
                }
                emit(operation_name, f"删除 {position} 节点 {node.id}（键 {key}），重连 next / unlink node",
                     "resolve", key=key, bucket_index=bucket, current=None, previous=previous,
                     comparison="equal", conflict=True, removed=removed, result="deleted")
                break
            previous = node
            node = node.next
        else:
            emit("delete-missing", f"桶 {bucket} 中没有键 {key}：删除失败，链表不变 / delete missing",
                 "result", key=key, bucket_index=bucket, current=None, previous=None,
                 conflict=occupied, result="missing", found=False)

emit("done", f"最终表：{count} 个元素，装载因子 {count}/{m} = {count / m:.3f} / final table",
     "result", result=None)
`;

export const PROBING_PYTHON = `# Linear probing: tri-state slots EMPTY / OCCUPIED / DELETED. Delete leaves a tombstone.
import math

raw = input
if isinstance(raw, dict):
    operations = raw.get("operations", [])
    table_size = raw.get("tableSize", 7)
else:
    operations = raw
    table_size = 7
if not isinstance(table_size, int) or isinstance(table_size, bool):
    table_size = 7
m = max(2, min(17, table_size))

class Entry:
    __slots__ = ("id", "key")
    def __init__(self, entry_id, key):
        self.id = entry_id
        self.key = key

TOMBSTONE = object()
table = [None for _ in range(m)]
sequence = 0

PHASES = {
    "init": "init", "hash": "hash", "probe-check": "compare", "probe-next": "locate",
    "insert": "insert", "duplicate": "compare", "found": "result", "not-found": "failed",
    "delete": "relink", "delete-missing": "failed", "table-full": "full", "done": "result",
}


def slot_state(slot):
    if slot is None:
        return "empty"
    if slot is TOMBSTONE:
        return "deleted"
    return "occupied"


def occupied_count():
    return sum(1 for slot in table if isinstance(slot, Entry))


def emit(operation, message, lesson, key=None, path=None, current_index=None,
         comparison=None, conflict=None, removed=None, result=None, found=None,
         reused_deleted=False):
    path = [] if path is None else path
    count = occupied_count()
    slots = []
    for index, slot in enumerate(table):
        state = slot_state(slot)
        slots.append({
            "index": index, "state": state,
            "key": slot.key if isinstance(slot, Entry) else None,
            "id": slot.id if isinstance(slot, Entry) else None,
        })
    trace(
        {"type": "array", "values": [slot.key if isinstance(slot, Entry) else None for slot in table], "focus": []},
        message,
        variables={"tableSize": m, "slots": [slot_state(slot) for slot in table],
                   "count": count, "loadFactor": count / m, "key": key,
                   "probePath": path[:], "currentIndex": current_index, "result": result},
        lesson_step=lesson,
        structure={
            "kind": "hash", "algorithm": "probing", "operation": operation,
            "phase": PHASES[operation], "tableSize": m, "key": key,
            "hashIndex": None if key is None else key % m, "bucketIndex": None,
            "currentNodeId": None, "previousNodeId": None, "comparison": comparison,
            "buckets": [], "nodes": [], "slots": slots, "probePath": path[:],
            "currentIndex": current_index, "reusedDeleted": reused_deleted,
            "conflict": conflict, "removed": removed, "result": result, "found": found,
            "elementCount": count, "loadFactor": count / m,
            "reason": "full" if operation == "table-full" else None,
        },
    )


def normalize_operation(entry):
    if not isinstance(entry, (list, tuple)) or len(entry) < 2:
        return None, None
    op = entry[0]
    key = entry[1]
    if op not in ("insert", "find", "delete"):
        return None, None
    if not isinstance(key, int) or isinstance(key, bool):
        return None, None
    return op, key


def probe_for(key):
    start = key % m
    path = [start]
    first_deleted = None
    index = start
    for step in range(m):
        slot = table[index]
        if slot is None:
            emit("probe-check", f"槽 {index} 是 EMPTY：从未使用，查找在此停止 / empty slot stops the probe",
                 "probe", key=key, path=path, current_index=index, comparison=None, conflict=False)
            return {"kind": "empty", "index": index, "path": path, "first_deleted": first_deleted}
        if slot is TOMBSTONE:
            if first_deleted is None:
                first_deleted = index
            emit("probe-check", f"槽 {index} 是 DELETED：这是删除标记，必须继续探测 / tombstone, keep probing",
                 "probe", key=key, path=path, current_index=index, comparison=None, conflict=False)
        else:
            same = slot.key == key
            emit("probe-check", f"槽 {index} 被键 {slot.key} 占用：{'键相等' if same else '键不同，发生冲突'} / inspect occupied slot",
                 "probe", key=key, path=path, current_index=index,
                 comparison="equal" if same else "different", conflict=not same)
            if same:
                return {"kind": "hit", "index": index, "path": path, "first_deleted": first_deleted, "entry": slot}
        if step + 1 < m:
            next_index = (start + step + 1) % m
            path.append(next_index)
            emit("probe-next", f"探测指针移到槽 {next_index}：(h({key}) + {step + 1}) % {m} / move to the next slot",
                 "probe", key=key, path=path, current_index=next_index,
                 comparison=None, conflict=(slot is not TOMBSTONE))
            index = next_index
    return {"kind": "full", "index": None, "path": path, "first_deleted": first_deleted}


emit("init", f"空表：{m} 个槽全部为 EMPTY / Empty table: all {m} slots are EMPTY", "init")
for entry in operations:
    op, key = normalize_operation(entry)
    if op is None:
        continue
    start = key % m
    emit("hash", f"h({key}) = {key} % {m} = {start} / compute the initial slot", "hash", key=key)

    if op == "insert":
        result = probe_for(key)
        if result["kind"] == "hit":
            emit("duplicate", f"槽 {result['index']} 已存键 {key}：拒绝重复插入，表不变 / duplicate rejected",
                 "result", key=key, path=result["path"], current_index=result["index"],
                 comparison="equal", conflict=True, result="duplicate")
        elif result["kind"] == "full" and result["first_deleted"] is None:
            emit("table-full", f"连续 {m} 个槽都是 OCCUPIED，表满，插入失败 / table full",
                 "result", key=key, path=result["path"], current_index=result["path"][-1],
                 comparison=None, conflict=True, result="full")
        else:
            reuse = result["first_deleted"]
            target = reuse if reuse is not None else result["index"]
            if target is None:
                target = result["path"][-1]
            sequence += 1
            table[target] = Entry(f"e{sequence}", key)
            emit("insert", f"键 {key} 写入槽 {target}：{'复用 DELETED 槽' if reuse is not None else 'EMPTY 槽'} / write the entry",
                 "resolve", key=key, path=result["path"], current_index=target,
                 comparison=None, conflict=(len(result["path"]) > 1), result="inserted",
                 reused_deleted=(reuse is not None))

    elif op == "find":
        result = probe_for(key)
        if result["kind"] == "hit":
            emit("found", f"在槽 {result['index']} 命中键 {key} / found in slot",
                 "result", key=key, path=result["path"], current_index=result["index"],
                 comparison="equal", conflict=(len(result["path"]) > 1), result="found", found=True)
        else:
            emit("not-found", f"探测结束仍未找到 {key}：返回失败 / probe finished: not found",
                 "result", key=key, path=result["path"],
                 current_index=(result["path"][-1] if result["path"] else None),
                 comparison=None, conflict=(len(result["path"]) > 1), result="not-found", found=False)

    else:
        result = probe_for(key)
        if result["kind"] == "hit":
            entry = table[result["index"]]
            table[result["index"]] = TOMBSTONE
            removed = {"kind": "slot", "index": result["index"], "key": entry.key, "id": entry.id}
            emit("delete", f"删除槽 {result['index']} 的键 {key}，写入 DELETED 标记 / leave a tombstone",
                 "resolve", key=key, path=result["path"], current_index=result["index"],
                 comparison="equal", conflict=(len(result["path"]) > 1), removed=removed, result="deleted")
        else:
            emit("delete-missing", f"未找到键 {key}：删除失败，槽位不变 / delete missing",
                 "result", key=key, path=result["path"],
                 current_index=(result["path"][-1] if result["path"] else None),
                 comparison=None, conflict=(len(result["path"]) > 1), result="missing", found=False)

emit("done", f"最终表：{occupied_count()} 个元素，装载因子 {occupied_count()}/{m} = {occupied_count() / m:.3f} / final table",
     "result", result=None)
`;

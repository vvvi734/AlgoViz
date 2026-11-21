/**
 * TEXTBOOK-08: buddy-system allocation and release.
 *
 * Requests are rounded up to a power-of-two block level. Searching starts at the
 * smallest adequate level and moves upward; an available larger block is split
 * repeatedly. On release only the true buddy (same size, aligned, address differs
 * by exactly the block size) may merge, and merging repeats upward.
 */
import type { AlgorithmEntry } from './types';

export const BUDDY_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '◫',
  name: ['伙伴系统（Buddy System）', 'Buddy system allocation'],
  desc: [
    '按 2 的幂等级管理内存：申请时从最小合适等级向上寻找空闲块并逐级平分；释放时先按异或地址找到真正的伙伴，只有伙伴也空闲才逐级合并。相邻但大小不同或地址不对齐的块不是伙伴。',
    'Manage memory by power-of-two levels: search upward from the smallest adequate level and split a larger free block; on release compute the true buddy by address and merge only when that buddy is free. Adjacent blocks of different sizes or misaligned addresses are not buddies.',
  ],
  time: 'O(L) per split/merge chain, L = log₂(capacity)',
  space: 'O(B) for B current blocks',
  input: undefined,
  code: "trace({type:'tree',values:['Buddy system: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const BUDDY_DEFAULT_INPUT: unknown = {
  capacity: 32,
  operations: [
    { op: 'alloc', id: 'A', size: 3 },
    { op: 'alloc', id: 'B', size: 5 },
    { op: 'alloc', id: 'C', size: 2 },
    { op: 'free', id: 'B' },
    { op: 'free', id: 'A' },
    { op: 'free', id: 'C' },
    { op: 'alloc', id: 'D', size: 20 },
    { op: 'free', id: 'D' },
  ],
};

export const BUDDY_PYTHON = `import re
import sys

raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be {capacity, operations}")
capacity = raw.get("capacity")
operations = raw.get("operations")
if not isinstance(capacity, int) or isinstance(capacity, bool) or capacity < 8 or capacity > 128:
    raise ValueError("capacity must be an integer from 8 to 128")
if capacity & (capacity - 1):
    raise ValueError("capacity must be a power of two")
if not isinstance(operations, list) or not operations or len(operations) > 12:
    raise ValueError("operations must contain 1 to 12 entries")

max_level = 0
value = capacity
while value > 1:
    value //= 2
    max_level += 1

live_ids = set()
clean_ops = []
for index, item in enumerate(operations, 1):
    if not isinstance(item, dict):
        raise ValueError("operation " + str(index) + " must be an object")
    op = item.get("op")
    block_id = item.get("id")
    if op not in ("alloc", "free"):
        raise ValueError("operation " + str(index) + " has an unknown op")
    if not isinstance(block_id, str) or not re.match(r"^[A-Za-z0-9]{1,3}$", block_id):
        raise ValueError("operation " + str(index) + " needs a 1-3 character id")
    if op == "alloc":
        size = item.get("size")
        if not isinstance(size, int) or isinstance(size, bool) or size <= 0 or size > capacity:
            raise ValueError("allocation " + block_id + " needs a size from 1 to capacity")
        if block_id in live_ids:
            raise ValueError("duplicate allocation id " + block_id)
        live_ids.add(block_id)
        clean_ops.append({"op": "alloc", "id": block_id, "size": size})
    else:
        if block_id not in live_ids:
            raise ValueError("cannot free " + block_id + ": it is not allocated")
        live_ids.remove(block_id)
        clean_ops.append({"op": "free", "id": block_id, "size": None})

blocks = [{"start": 0, "size": capacity, "level": max_level, "status": "free", "label": None}]
allocated = {}
requested_id = None
requested_size = None
target_level = None
current_level = None
current_start = None
selected_start = None
buddy_start = None
merge_start = None
block_size = None
internal_fragment = 0


def block_level(size):
    # Round up to the next power of two: a 3-byte request needs a level-2
    # (4-byte) block, never a 2-byte block that cannot hold it.
    level = 0
    value = 1
    while value < size:
        value *= 2
        level += 1
    return level


def find_block(start, size):
    for index, block in enumerate(blocks):
        if block["start"] == start and block["size"] == size:
            return index
    return -1


def emit(operation, message, lesson, chosen=None, candidate=None, buddy=None, moved=None, decision=None):
    payload = {
        "kind": "buddy-system",
        "algorithm": "buddy-system",
        "operation": operation,
        "capacity": capacity,
        "maxLevel": max_level,
        "blocks": [dict(block) for block in blocks],
        "requestedId": requested_id,
        "requestedSize": requested_size,
        "targetLevel": target_level,
        "currentLevel": current_level,
        "currentStart": current_start,
        "selectedStart": chosen,
        "buddyStart": buddy,
        "mergeStart": moved,
        "blockSize": block_size,
        "internalFragment": internal_fragment,
        "allocationId": requested_id if operation in ("release", "buddy-check", "merge") else (requested_id if operation in ("allocate", "split", "found", "search", "fail") else None),
        "decision": decision,
    }
    variables = {
        "capacity": capacity,
        "free_levels": sorted(set(block["level"] for block in blocks if block["status"] == "free")),
        "requested": None if requested_id is None else [requested_id, requested_size],
        "blocks": [[block["start"], block["size"], block["level"], block["status"], block["label"]] for block in blocks],
    }
    trace(
        {
            "type": "tree",
            "values": [block["size"] for block in blocks],
            "focus": [chosen] if chosen is not None else ([current_start] if current_start is not None else []),
            "visited": sorted(allocated.keys()),
        },
        message,
        line=sys._getframe(1).f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


emit("init", "初始化：" + str(capacity) + " 字节是一棵完整伙伴树，根等级 " + str(max_level) + " / Init: one root block", "init")

for item in clean_ops:
    requested_id = item["id"]
    if item["op"] == "alloc":
        requested_size = item["size"]
        target_level = block_level(requested_size)
        current_level = target_level
        current_start = None
        selected_start = None
        buddy_start = None
        merge_start = None
        block_size = None
        internal_fragment = 0
        emit(
            "search",
            "申请 " + requested_id + "：" + str(requested_size) + " 字节，向上取整到等级 " + str(target_level) + "（块大小 " + str(2 ** target_level) + "）/ Request " + requested_id + " rounds up to level " + str(target_level),
            "locate",
            candidate=None,
            decision="search-up",
        )
        found = None
        for level in range(target_level, max_level + 1):
            current_level = level
            candidates = [block for block in blocks if block["level"] == level and block["status"] == "free"]
            if not candidates:
                current_start = None
                emit(
                    "search",
                    "等级 " + str(level) + " 没有空闲块，向更大等级寻找 / No free block at level " + str(level) + "; search upward",
                    "locate",
                    decision="search-up",
                )
                continue
            found = min(candidates, key=lambda block: block["start"])
            current_start = found["start"]
            selected_start = found["start"]
            current_level = level
            emit(
                "found",
                "在等级 " + str(level) + " 找到空闲块 [" + str(found["start"]) + ", " + str(found["start"] + found["size"]) + ") / Found a free block at level " + str(level),
                "found",
                chosen=found["start"],
                decision="found",
            )
            break
        if found is None:
            current_level = None
            selected_start = None
            block_size = None
            internal_fragment = 0
            emit(
                "fail",
                "直到根等级都没有足够大的空闲块：申请 " + requested_id + " 失败，伙伴树保持原状 / Allocation fails without changing the tree",
                "fail",
                decision="no-fit",
            )
            continue

        block_size = 2 ** target_level
        internal_fragment = block_size - requested_size
        while found["level"] > target_level:
            index = find_block(found["start"], found["size"])
            half = found["size"] // 2
            left = {"start": found["start"], "size": half, "level": found["level"] - 1, "status": "free", "label": None}
            right = {"start": found["start"] + half, "size": half, "level": found["level"] - 1, "status": "free", "label": None}
            blocks[index:index + 1] = [left, right]
            found = left
            current_level = left["level"]
            current_start = left["start"]
            selected_start = left["start"]
            emit(
                "split",
                "把 [" + str(left["start"]) + ", " + str(right["start"] + right["size"]) + ") 平分；左半继续向下分裂 / Split into two buddies and continue with the left half",
                "split",
                chosen=left["start"],
                decision="split",
            )

        found["status"] = "allocated"
        found["label"] = requested_id
        allocated[requested_id] = {"requested": requested_size, "block": found["size"], "start": found["start"]}
        internal_fragment = found["size"] - requested_size
        emit(
            "allocate",
            "分配 " + requested_id + "：请求 " + str(requested_size) + " 字节，实际块 " + str(found["size"]) + " 字节，内部碎片 " + str(internal_fragment) + " / Allocate with internal fragmentation",
            "allocate",
            chosen=found["start"],
            decision="exact" if internal_fragment == 0 else "split",
        )
    else:
        info = allocated.get(requested_id)
        requested_size = info["requested"]
        block_size = info["block"]
        internal_fragment = block_size - requested_size
        index = next(position for position, block in enumerate(blocks) if block["label"] == requested_id)
        block = blocks[index]
        block["status"] = "free"
        block["label"] = None
        del allocated[requested_id]
        current_level = block["level"]
        current_start = block["start"]
        selected_start = block["start"]
        buddy_start = block["start"] ^ block["size"]
        merge_start = None
        emit(
            "release",
            "释放 " + requested_id + "：块 [" + str(block["start"]) + ", " + str(block["start"] + block["size"]) + ") 变空闲；伙伴候选地址 = " + str(block["start"]) + " xor " + str(block["size"]) + " = " + str(buddy_start) + " / Release and compute the buddy",
            "release",
            chosen=block["start"],
            buddy=buddy_start,
            decision="buddy-busy" if block["level"] == max_level else "buddy-free",
        )

        while block["level"] < max_level:
            current_level = block["level"]
            buddy_start = block["start"] ^ block["size"]
            current_start = block["start"]
            buddy = None
            for candidate in blocks:
                if candidate["start"] == buddy_start and candidate["size"] == block["size"]:
                    buddy = candidate
                    break
            if buddy is None or buddy["status"] != "free":
                emit(
                    "buddy-check",
                    "伙伴 [" + str(buddy_start) + ", " + str(buddy_start + block["size"]) + ") 不存在或已分配，不能合并 / Buddy is absent or allocated; stop merging",
                    "buddy-check",
                    chosen=block["start"],
                    buddy=buddy_start,
                    decision="buddy-busy",
                )
                break
            emit(
                "buddy-check",
                "伙伴 [" + str(buddy_start) + ", " + str(buddy_start + block["size"]) + ") 也空闲，可以合并 / The true buddy is free and can merge",
                "buddy-check",
                chosen=block["start"],
                buddy=buddy_start,
                decision="buddy-free",
            )
            left_index = find_block(min(block["start"], buddy_start), block["size"])
            right_index = find_block(max(block["start"], buddy_start), block["size"])
            low = blocks[min(left_index, right_index)]
            high = blocks[max(left_index, right_index)]
            merged = {
                "start": min(low["start"], high["start"]),
                "size": block["size"] * 2,
                "level": block["level"] + 1,
                "status": "free",
                "label": None,
            }
            blocks[min(left_index, right_index):max(left_index, right_index) + 1] = [merged]
            emit(
                "merge",
                "与伙伴合并成 [" + str(merged["start"]) + ", " + str(merged["start"] + merged["size"]) + ")，等级 " + str(merged["level"]) + "；继续向上检查 / Merge and repeat upward",
                "merge",
                chosen=merged["start"],
                buddy=buddy_start,
                moved=merged["start"],
                decision="merged",
            )
            block = merged
            merge_start = merged["start"]
            if block["level"] >= max_level:
                break

requested_id = None
requested_size = None
target_level = None
current_level = None
current_start = None
selected_start = None
buddy_start = None
merge_start = None
block_size = None
internal_fragment = 0
emit(
    "done",
    "伙伴系统操作完成：当前 " + str(len(blocks)) + " 个分区 / Done with " + str(len(blocks)) + " current partitions",
    "done",
    decision="done",
)

print("buddy", capacity)
print("allocated", sorted((key, value["requested"], value["block"]) for key, value in allocated.items()))
print("blocks", [(block["start"], block["size"], block["status"]) for block in blocks])
`;

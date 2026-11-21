/**
 * TEXTBOOK-08: free-space list with First Fit / Best Fit and boundary tags.
 *
 * The Python program below is the executable source of every animation frame.
 * Allocations always use the half-open interval [start, start + size); a free
 * block is split in place, and release immediately inspects both neighbours
 * before coalescing. No allocated block is ever moved to make a request fit.
 */
import type { AlgorithmEntry } from './types';

export const FREE_LIST_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '▤',
  name: ['空闲空间分配与回收（首次/最佳适应）', 'Free-space list (First Fit / Best Fit)'],
  desc: [
    '在同一条内存带上模拟可利用空间表的分配、分裂、释放与相邻空闲块合并。首次适应按地址顺序选择第一个足够大的块；最佳适应选择满足请求后剩余空间最小的块。',
    'Simulate allocation, splitting, release and adjacent coalescing on a single memory band. First Fit chooses the first adequate block in address order; Best Fit chooses the block with the smallest adequate remainder.',
  ],
  time: 'O(M · F) for M operations and F free blocks',
  space: 'O(F + B) for F free and B total blocks',
  input: undefined,
  code: "trace({type:'array',values:['Free-space list: use the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const FREE_LIST_DEFAULT_INPUT: unknown = {
  capacity: 64,
  policy: 'first-fit',
  operations: [
    { op: 'alloc', id: 'A', size: 12 },
    { op: 'alloc', id: 'B', size: 16 },
    { op: 'alloc', id: 'C', size: 10 },
    { op: 'alloc', id: 'D', size: 12 },
    { op: 'alloc', id: 'E', size: 4 },
    { op: 'free', id: 'B' },
    { op: 'free', id: 'D' },
    { op: 'alloc', id: 'F', size: 8 },
    { op: 'free', id: 'C' },
    { op: 'free', id: 'F' },
  ],
};

export const FREE_LIST_PYTHON = `import re
import sys

raw = input
if not isinstance(raw, dict):
    raise ValueError("input must be {capacity, policy, operations}")
capacity = raw.get("capacity")
policy = raw.get("policy", "first-fit")
operations = raw.get("operations")
if not isinstance(capacity, int) or isinstance(capacity, bool) or capacity < 8 or capacity > 128:
    raise ValueError("capacity must be an integer from 8 to 128")
if policy not in ("first-fit", "best-fit"):
    raise ValueError("policy must be first-fit or best-fit")
if not isinstance(operations, list) or not operations or len(operations) > 12:
    raise ValueError("operations must contain 1 to 12 entries")

# Validate the whole sequence before drawing any frame. A release must refer to
# a block that is allocated at that point, and an id cannot be allocated twice.
live_ids = set()
used_ids = set()
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
        if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
            raise ValueError("allocation " + block_id + " needs a positive integer size")
        if block_id in used_ids:
            raise ValueError("duplicate allocation id " + block_id)
        used_ids.add(block_id)
        live_ids.add(block_id)
        clean_ops.append({"op": "alloc", "id": block_id, "size": size})
    else:
        if block_id not in live_ids:
            raise ValueError("cannot free " + block_id + ": it is not allocated")
        live_ids.remove(block_id)
        clean_ops.append({"op": "free", "id": block_id, "size": None})

# One contiguous partition. Every block owns both a head and a tail tag; the
# snapshot derives both from the same record so they cannot disagree.
blocks = [{"start": 0, "size": capacity, "status": "free", "label": None}]
allocated = {}
request = None
current_start = None
candidate_start = None
selected_start = None


def free_blocks():
    return [block for block in blocks if block["status"] == "free"]


def snapshot_blocks():
    payload = []
    for block in blocks:
        payload.append({
            "start": block["start"],
            "size": block["size"],
            "status": block["status"],
            "label": block["label"],
            "boundary": {
                "headSize": block["size"],
                "tailSize": block["size"],
                "headStatus": block["status"],
                "tailStatus": block["status"],
            },
        })
    return payload


def emit(operation, message, lesson, chosen=None, candidate=None, request_value=None, chosen_decision=None):
    free = free_blocks()
    free_payload = []
    for block in free:
        free_payload.append({
            "start": block["start"],
            "size": block["size"],
            "status": "free",
            "label": None,
            "boundary": {
                "headSize": block["size"],
                "tailSize": block["size"],
                "headStatus": "free",
                "tailStatus": "free",
            },
        })
    payload = {
        "kind": "free-list",
        "algorithm": "free-list",
        "operation": operation,
        "policy": policy,
        "capacity": capacity,
        "blocks": snapshot_blocks(),
        "freeBlocks": free_payload,
        "request": request_value,
        "currentStart": current_start,
        "candidateStart": candidate,
        "selectedStart": chosen,
        "decision": chosen_decision,
        "internalFragment": 0,
        "freeRegionCount": len(free),
        "totalFree": sum(block["size"] for block in free),
        "largestFree": max([block["size"] for block in free] or [0]),
        "allocatedCount": len(allocated),
    }
    variables = {
        "policy": policy,
        "request": request_value,
        "free_regions": [[block["start"], block["size"]] for block in free],
        "allocated": sorted(allocated.keys()),
        "blocks": [[block["start"], block["size"], block["status"], block["label"]] for block in blocks],
    }
    trace(
        {
            "type": "array",
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


def index_of_start(start):
    for index, block in enumerate(blocks):
        if block["start"] == start:
            return index
    return -1


emit("init", "初始化：" + str(capacity) + " 字节整块空闲，策略 " + policy + " / Init: one free block of " + str(capacity), "init")

for item in clean_ops:
    if item["op"] == "alloc":
        rid = item["id"]
        rsize = item["size"]
        request = {"id": rid, "size": rsize}
        current_start = None
        candidate_start = None
        selected_start = None
        emit(
            "consider",
            "申请 " + rid + "：" + str(rsize) + " 字节；扫描可利用空间表 / Request " + rid + ": " + str(rsize) + " bytes; scan the free list",
            "scan",
            request_value=request,
            chosen_decision="scan",
        )
        chosen = None
        best_remainder = None
        for block in sorted(free_blocks(), key=lambda value: value["start"]):
            candidate_start = block["start"]
            current_start = block["start"]
            if block["size"] < rsize:
                emit(
                    "consider",
                    "检查 [" + str(block["start"]) + ", " + str(block["start"] + block["size"]) + ")：" + str(block["size"]) + " < " + str(rsize) + "，放不下 / Too small",
                    "scan",
                    request_value=request,
                    candidate=block["start"],
                    chosen_decision="too-small",
                )
                continue
            remainder = block["size"] - rsize
            emit(
                "consider",
                "检查 [" + str(block["start"]) + ", " + str(block["start"] + block["size"]) + ")：" + str(block["size"]) + " ≥ " + str(rsize) + "，可容纳 / Fits",
                "scan",
                request_value=request,
                candidate=block["start"],
                chosen_decision="fit",
            )
            if policy == "first-fit":
                chosen = block
                break
            if best_remainder is None or remainder < best_remainder:
                best_remainder = remainder
                chosen = block
        if chosen is None:
            selected_start = None
            current_start = None
            emit(
                "fail",
                "没有足够大的连续空闲块：申请 " + rid + " 失败，内存保持原状 / No adequate contiguous block: request " + rid + " fails without moving data",
                "fail",
                request_value=request,
                chosen_decision="no-fit",
            )
            continue

        selected_start = chosen["start"]
        current_start = chosen["start"]
        emit(
            "select",
            ("首次适应" if policy == "first-fit" else "最佳适应")
            + "选择 [" + str(chosen["start"]) + ", " + str(chosen["start"] + chosen["size"]) + ")，剩余 "
            + str(chosen["size"] - rsize) + " 字节 / Select the block",
            "select",
            chosen=chosen["start"],
            request_value=request,
            chosen_decision="fit",
        )
        index = index_of_start(chosen["start"])
        old_size = chosen["size"]
        split = old_size > rsize
        if split:
            chosen["size"] = rsize
            chosen["status"] = "allocated"
            chosen["label"] = rid
            blocks.insert(index + 1, {
                "start": chosen["start"] + rsize,
                "size": old_size - rsize,
                "status": "free",
                "label": None,
            })
            allocated[rid] = rsize
            emit(
                "split",
                "块大于申请：在地址 " + str(chosen["start"] + rsize) + " 分裂，剩余 " + str(old_size - rsize) + " 字节成为新空闲块 / Split the remainder",
                "split",
                chosen=chosen["start"],
                request_value=request,
                chosen_decision="split",
            )
        else:
            chosen["status"] = "allocated"
            chosen["label"] = rid
            allocated[rid] = rsize
        emit(
            "allocate",
            "分配 " + rid + " 到 [" + str(chosen["start"]) + ", " + str(chosen["start"] + rsize) + ")，更新块头/块尾 / Allocate " + rid,
            "allocate",
            chosen=chosen["start"],
            request_value=request,
            chosen_decision="split" if split else "exact",
        )
    else:
        rid = item["id"]
        rsize = allocated.get(rid)
        request = {"id": rid, "size": rsize}
        index = next(position for position, block in enumerate(blocks) if block["label"] == rid)
        block = blocks[index]
        current_start = block["start"]
        candidate_start = None
        selected_start = block["start"]
        block["status"] = "free"
        block["label"] = None
        del allocated[rid]
        left_free = index > 0 and blocks[index - 1]["status"] == "free"
        right_free = index + 1 < len(blocks) and blocks[index + 1]["status"] == "free"
        case = "both-free" if left_free and right_free else ("left-free" if left_free else ("right-free" if right_free else "isolated"))
        emit(
            "release",
            "释放 " + rid + "：[" + str(block["start"]) + ", " + str(block["start"] + block["size"]) + ") 重新空闲；左邻"
            + ("空闲" if left_free else "占用") + "，右邻" + ("空闲" if right_free else "占用") + " / Release " + rid,
            "release",
            chosen=block["start"],
            request_value=request,
            chosen_decision=case,
        )

        if left_free:
            left = blocks[index - 1]
            merged = {
                "start": left["start"],
                "size": left["size"] + block["size"],
                "status": "free",
                "label": None,
            }
            blocks[index - 1:index + 1] = [merged]
            block = merged
            index -= 1
            emit(
                "merge",
                "与左邻合并：新空闲块 [" + str(merged["start"]) + ", " + str(merged["start"] + merged["size"]) + ")，块尾标记随新块大小更新 / Coalesce with the left neighbour",
                "merge",
                chosen=merged["start"],
                request_value=request,
                chosen_decision="merged",
            )
        if right_free and index + 1 < len(blocks) and blocks[index + 1]["status"] == "free":
            right = blocks[index + 1]
            merged = {
                "start": block["start"],
                "size": block["size"] + right["size"],
                "status": "free",
                "label": None,
            }
            blocks[index:index + 2] = [merged]
            emit(
                "merge",
                "与右邻合并：新空闲块 [" + str(merged["start"]) + ", " + str(merged["start"] + merged["size"]) + ")，相邻空闲区消失 / Coalesce with the right neighbour",
                "merge",
                chosen=merged["start"],
                request_value=request,
                chosen_decision="merged",
            )

request = None
selected_start = None
current_start = None
candidate_start = None
emit(
    "done",
    "操作序列完成：已分配 " + str(len(allocated)) + " 块，空闲区 " + str(len(free_blocks())) + " 个 / Done",
    "done",
    chosen_decision="done",
)

print("free-list", policy)
print("allocated", sorted(allocated.items()))
print("free", [(block["start"], block["size"]) for block in blocks if block["status"] == "free"])
`;

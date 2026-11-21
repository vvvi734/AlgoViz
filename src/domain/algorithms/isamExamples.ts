/**
 * TEXTBOOK-12: real Python execution for an ISAM-style index-sequential file.
 *
 * Main blocks are filled in key order. The top index stores each block's largest
 * resident key. A lookup chooses one block by its upper bound, scans the main
 * block, then follows only that block's overflow chain. Insertion uses the same
 * block choice; if the main block is full, the record joins the chain. The
 * inserted key is immediately looked up again so the trace proves it is reachable.
 */
import type { AlgorithmEntry } from './types';

export const ISAM_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '▥',
  name: ['ISAM 文件与溢出链', 'ISAM file with overflow chains'],
  desc: [
    'ISAM 由主数据区、上层索引和溢出区组成。索引给出每个主块的键上界；查找先选一个主块，再扫描该块及其溢出链。插入在主块满时进入溢出区，索引上界随最大键维护。',
    'ISAM combines a main data area, an index layer and overflow chains. The index stores an upper key bound per main block; a lookup selects one block, scans it and follows only its overflow chain. A full block sends an insertion to overflow, while index bounds track the largest resident key.',
  ],
  time: 'Index probe + one main-block scan + overflow-chain scan',
  space: 'Main blocks + overflow nodes + one index entry per main block',
  input: undefined,
  code: "trace({type:'array',values:['ISAM: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const ISAM_DEFAULT_INPUT: unknown = {
  preset: 'overflow-insert',
  command: 'insert',
  blockCapacity: 2,
  targetKey: 105,
  newLabel: 'I',
  records: [
    { key: 101, label: 'A' },
    { key: 102, label: 'B' },
    { key: 103, label: 'C' },
    { key: 104, label: 'D' },
    { key: 106, label: 'F' },
    { key: 108, label: 'H' },
  ],
};

export const ISAM_PYTHON = `# ISAM-style index-sequential file over a simulated store. Main blocks are
# filled in key order and each owns an overflow chain. The index stores one
# upper bound per block. This is a relative-static ISAM model, not a B+ tree.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("ISAM input must be an object")
    command = raw.get("command", "find")
    if command not in ("find", "insert"):
        raise ValueError("command must be find or insert")
    capacity = raw.get("blockCapacity", 2)
    if isinstance(capacity, bool) or not isinstance(capacity, int) or not 2 <= capacity <= 4:
        raise ValueError("blockCapacity must be an integer from 2 to 4")
    target = raw.get("targetKey")
    if isinstance(target, bool) or not isinstance(target, int) or not 0 <= target <= 9999:
        raise ValueError("targetKey must be an integer from 0 to 9999")
    rows = raw.get("records")
    if not isinstance(rows, list) or not 4 <= len(rows) <= 18:
        raise ValueError("provide 4 to 18 records")
    records = []
    keys = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("each record must be an object")
        key = row.get("key")
        label = row.get("label")
        if isinstance(key, bool) or not isinstance(key, int) or not 0 <= key <= 9999:
            raise ValueError("record keys must be integers from 0 to 9999")
        if key in keys:
            raise ValueError("record keys must be unique")
        keys.add(key)
        if not isinstance(label, str) or not 1 <= len(label) <= 12:
            raise ValueError("record labels must contain 1 to 12 characters")
        records.append({"key": key, "label": label})
    if command == "insert" and target in keys:
        raise ValueError("the inserted key already exists")
    new_label = raw.get("newLabel", "N")
    if not isinstance(new_label, str) or not 1 <= len(new_label) <= 12:
        raise ValueError("newLabel must contain 1 to 12 characters")
    preset = raw.get("preset")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return command, capacity, target, records, new_label, preset


COMMAND, CAPACITY, TARGET, RAW_RECORDS, NEW_LABEL, PRESET = _read_input(input)
RECORDS = []
BY_ID = {}
BLOCKS = []
INDEX = []
OVERFLOW = []
CURRENT_INDEX = None
SELECTED_BLOCK = None
CURRENT_BLOCK = None
CURRENT_OVERFLOW = None
COMPARE_ID = None
FOUND_ID = None
INSERTED_ID = None
MAIN_READS = 0
OVERFLOW_READS = 0
TRACING = True


def indexed_key(block):
    record_ids = list(block["recordIds"])
    for node in OVERFLOW:
        if node["blockId"] == block["id"]:
            record_ids.extend(node["recordIds"])
    return max(BY_ID[record_id]["key"] for record_id in record_ids)


def refresh_index():
    global INDEX
    INDEX = [{"key": indexed_key(block), "blockId": block["id"]} for block in BLOCKS]


def emit(operation, message, lesson, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": [record["key"] for record in RECORDS], "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "command": COMMAND,
            "targetKey": TARGET,
            "mainBlocks": len(BLOCKS),
            "overflowNodes": len(OVERFLOW),
            "indexBlockReads": 1,
            "mainBlockReads": MAIN_READS,
            "overflowBlockReads": OVERFLOW_READS,
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "isam",
            "preset": PRESET,
            "command": COMMAND,
            "operation": operation,
            "blockCapacity": CAPACITY,
            "targetKey": TARGET,
            "records": [dict(record) for record in RECORDS],
            "blocks": [{
                **block,
                "recordIds": list(block["recordIds"]),
            } for block in BLOCKS],
            "indexEntries": [dict(entry) for entry in INDEX],
            "overflowNodes": [{
                **node,
                "recordIds": list(node["recordIds"]),
            } for node in OVERFLOW],
            "currentIndexIndex": CURRENT_INDEX,
            "selectedBlockId": SELECTED_BLOCK,
            "currentBlockId": CURRENT_BLOCK,
            "currentOverflowId": CURRENT_OVERFLOW,
            "compareId": COMPARE_ID,
            "foundId": FOUND_ID,
            "insertedId": INSERTED_ID,
            "indexBlockReads": 1,
            "mainBlockReads": MAIN_READS,
            "overflowBlockReads": OVERFLOW_READS,
            "result": result,
        },
    )


def choose_block(key):
    global CURRENT_INDEX, SELECTED_BLOCK
    chosen = len(INDEX) - 1
    for position, entry in enumerate(INDEX):
        CURRENT_INDEX = position
        if entry["key"] >= key:
            chosen = position
            break
    SELECTED_BLOCK = INDEX[chosen]["blockId"]
    return SELECTED_BLOCK


def insert_into_overflow(record):
    global CURRENT_OVERFLOW
    nodes = [node for node in OVERFLOW if node["blockId"] == SELECTED_BLOCK]
    linked = False
    if not nodes:
        node = {
            "id": "O" + str(len(OVERFLOW)),
            "blockId": SELECTED_BLOCK,
            "recordIds": [record["id"]],
            "nextId": None,
        }
        OVERFLOW.append(node)
        block = next(item for item in BLOCKS if item["id"] == SELECTED_BLOCK)
        block["overflowHead"] = node["id"]
        CURRENT_OVERFLOW = node["id"]
        linked = True
    else:
        last = nodes[-1]
        if len(last["recordIds"]) >= CAPACITY:
            node = {
                "id": "O" + str(len(OVERFLOW)),
                "blockId": SELECTED_BLOCK,
                "recordIds": [record["id"]],
                "nextId": None,
            }
            last["nextId"] = node["id"]
            OVERFLOW.append(node)
            CURRENT_OVERFLOW = node["id"]
            linked = True
        else:
            last["recordIds"].append(record["id"])
            last["recordIds"].sort(key=lambda record_id: BY_ID[record_id]["key"])
            CURRENT_OVERFLOW = last["id"]
    return linked


def lookup(key):
    global CURRENT_BLOCK, CURRENT_OVERFLOW, COMPARE_ID, FOUND_ID
    global MAIN_READS, OVERFLOW_READS
    FOUND_ID = None
    COMPARE_ID = None
    CURRENT_OVERFLOW = None
    block_id = choose_block(key)
    emit(
        "index-probe",
        "索引上界选中主块 " + block_id + " / choose a main block by its upper bound",
        "index-probe",
    )
    block = next(item for item in BLOCKS if item["id"] == block_id)
    CURRENT_BLOCK = block_id
    MAIN_READS += 1
    emit(
        "read-main",
        "读入主区 " + block_id + " 并检查块内记录 / read and scan the main block",
        "read-main",
    )
    for record_id in block["recordIds"]:
        COMPARE_ID = record_id
        emit(
            "compare",
            "比较主块记录 " + str(BY_ID[record_id]["key"]) + " / compare a main-block record",
            "compare",
        )
        if BY_ID[record_id]["key"] == key:
            FOUND_ID = record_id
            break
    if FOUND_ID is None:
        node_id = block["overflowHead"]
        while node_id is not None:
            node = next(item for item in OVERFLOW if item["id"] == node_id)
            CURRENT_OVERFLOW = node_id
            OVERFLOW_READS += 1
            emit(
                "read-overflow",
                "继续读溢出节点 " + node_id + " / read the linked overflow node",
                "read-overflow",
            )
            for record_id in node["recordIds"]:
                COMPARE_ID = record_id
                emit(
                    "compare",
                    "比较溢出记录 " + str(BY_ID[record_id]["key"]) + " / compare an overflow record",
                    "compare",
                )
                if BY_ID[record_id]["key"] == key:
                    FOUND_ID = record_id
                    break
            if FOUND_ID is not None:
                break
            node_id = node["nextId"]
    COMPARE_ID = None
    CURRENT_OVERFLOW = None
    if FOUND_ID is not None:
        emit(
            "found",
            "在" + ("主区" if any(FOUND_ID in block["recordIds"] for block in BLOCKS) else "溢出区") + "命中 " + FOUND_ID + " / record found",
            "found",
        )
    else:
        emit(
            "not-found",
            "主块与溢出链均未命中 / the main block and overflow chain miss the key",
            "not-found",
        )
    return FOUND_ID


for position, record in enumerate(sorted(RAW_RECORDS, key=lambda item: item["key"])):
    record["id"] = "R" + str(position + 1)
    BY_ID[record["id"]] = record
    RECORDS.append(record)

for start in range(0, len(RECORDS), CAPACITY):
    ids = [record["id"] for record in RECORDS[start:start + CAPACITY]]
    BLOCKS.append({
        "id": "B" + str(len(BLOCKS)),
        "indexKey": BY_ID[ids[-1]]["key"],
        "recordIds": ids,
        "overflowHead": None,
    })
refresh_index()
emit(
    "init",
    "建立主数据区、每块索引上界与空溢出链 / build main blocks, index bounds and empty chains",
    "init",
)

if COMMAND == "insert":
    block_id = choose_block(TARGET)
    emit(
        "index-probe",
        "按新关键字选择主块 " + block_id + " / choose a block for insertion",
        "index-probe",
    )
    record = {"id": "R" + str(len(RECORDS) + 1), "key": TARGET, "label": NEW_LABEL}
    RECORDS.append(record)
    BY_ID[record["id"]] = record
    block = next(item for item in BLOCKS if item["id"] == block_id)
    CURRENT_BLOCK = block_id
    if len(block["recordIds"]) < CAPACITY:
        block["recordIds"].append(record["id"])
        block["recordIds"].sort(key=lambda record_id: BY_ID[record_id]["key"])
        INSERTED_ID = record["id"]
        old_bound = block["indexKey"]
        block["indexKey"] = indexed_key(block)
        refresh_index()
        emit(
            "insert-main",
            "主块仍有空间，记录 " + record["id"] + " 插入主区 / insert into the main block",
            "insert-main",
        )
        if block["indexKey"] != old_bound:
            emit(
                "index-update",
                "主块最大键变化，刷新索引上界 / refresh the index upper bound",
                "index-update",
            )
    else:
        linked = insert_into_overflow(record)
        INSERTED_ID = record["id"]
        old_bound = block["indexKey"]
        block["indexKey"] = indexed_key(block)
        refresh_index()
        emit(
            "insert-overflow",
            "主块已满，记录 " + record["id"] + " 进入溢出链 / append the record to overflow",
            "insert-overflow",
        )
        if linked:
            emit(
                "link-overflow",
                "新溢出节点已链接到 " + block_id + " / link the new overflow node",
                "link-overflow",
            )
        if block["indexKey"] != old_bound:
            emit(
                "index-update",
                "溢出记录扩大上界，刷新索引 / refresh the index after overflow",
                "index-update",
            )

FOUND_ID = None
COMPARE_ID = None
lookup(TARGET)
emit(
    "done",
    ("插入后重新查找成功" if COMMAND == "insert" else "查找结束") + " / ISAM operation complete",
    "done",
    result="inserted" if COMMAND == "insert" else ("found" if FOUND_ID is not None else "not-found"),
)
`;

export const ISAM_RANDOM_SCENARIOS = [
  { id: 'find-hit', label: ['主区命中', 'Main-block hit'] },
  { id: 'find-overflow', label: ['溢出区命中', 'Overflow hit'] },
  { id: 'find-miss', label: ['查找失败', 'Miss'] },
  { id: 'insert-main', label: ['插入主区', 'Insert into main'] },
  { id: 'insert-overflow', label: ['插入溢出区', 'Insert into overflow'] },
  { id: 'small-blocks', label: ['小块容量', 'Small blocks'] },
] as const;

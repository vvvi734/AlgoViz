/**
 * TEXTBOOK-12: real Python execution for indexed-file lookup.
 *
 * The data file is sorted by key and split into fixed-capacity blocks. A dense
 * index maps every record key to its block; a sparse index maps each block's
 * first key to that block. The program reads the index once, selects one block,
 * reads that block once, and scans it. These counters are simulated teaching
 * events, never browser disk access.
 */
import type { AlgorithmEntry } from './types';

export const FILE_INDEX_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '▤',
  name: ['索引文件查找', 'Indexed-file lookup'],
  desc: [
    '有序记录被分到多个文件块，索引表保存关键字与块地址。稠密索引为每条记录建一项，稀疏索引只为每块首关键字建一项；先查索引再读一个数据块并在块内确认记录。',
    'Sorted records are partitioned into file blocks, and an index maps keys to block addresses. A dense index has one entry per record; a sparse index keeps one entry per block’s first key. The lookup reads the index, selects one data block, then scans that block.',
  ],
  time: 'Dense: one index entry; sparse: index search + one block scan; 1 simulated index block + 1 data block',
  space: 'Dense O(n) index entries; sparse O(n/B) entries; data file unchanged',
  input: undefined,
  code: "trace({type:'array',values:['indexed file: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const FILE_INDEX_DEFAULT_INPUT: unknown = {
  preset: 'dense-hit',
  indexKind: 'dense',
  blockCapacity: 3,
  targetKey: 106,
  records: [
    { key: 101, label: 'A' },
    { key: 102, label: 'B' },
    { key: 103, label: 'C' },
    { key: 104, label: 'D' },
    { key: 105, label: 'E' },
    { key: 106, label: 'F' },
    { key: 107, label: 'G' },
    { key: 108, label: 'H' },
  ],
};

export const FILE_INDEX_PYTHON = `# Indexed-file lookup over a simulated external store. A sorted data file is
# split into fixed-capacity blocks. The dense index owns one entry per record;
# the sparse index owns one entry per block. Index and data-block counters are
# teaching-model events, not real browser disk access.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("indexed-file input must be an object")
    kind = raw.get("indexKind", "dense")
    if kind not in ("dense", "sparse"):
        raise ValueError("indexKind must be dense or sparse")
    capacity = raw.get("blockCapacity", 3)
    if isinstance(capacity, bool) or not isinstance(capacity, int) or not 2 <= capacity <= 4:
        raise ValueError("blockCapacity must be an integer from 2 to 4")
    target = raw.get("targetKey")
    if isinstance(target, bool) or not isinstance(target, int) or not 0 <= target <= 9999:
        raise ValueError("targetKey must be an integer from 0 to 9999")
    rows = raw.get("records")
    if not isinstance(rows, list) or not 3 <= len(rows) <= 12:
        raise ValueError("provide 3 to 12 records")
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
    records.sort(key=lambda item: item["key"])
    preset = raw.get("preset")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return kind, capacity, target, records, preset


KIND, CAPACITY, TARGET, RAW_RECORDS, PRESET = _read_input(input)
RECORDS = []
BLOCKS = []
INDEX = []
BLOCK_READS = 0
INDEX_PROBES = 0
CURRENT_INDEX = None
CURRENT_BLOCK = None
COMPARE_ID = None
FOUND_ID = None
TRACING = True


def refresh_index():
    global INDEX
    INDEX = []
    for block in BLOCKS:
        first_id = block["recordIds"][0]
        if KIND == "dense":
            for record_id in block["recordIds"]:
                INDEX.append({"key": BY_ID[record_id]["key"], "blockId": block["id"]})
        else:
            INDEX.append({"key": BY_ID[first_id]["key"], "blockId": block["id"]})


def emit(operation, message, lesson, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": [record["key"] for record in RECORDS], "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "indexKind": KIND,
            "blockCapacity": CAPACITY,
            "targetKey": TARGET,
            "indexEntries": len(INDEX),
            "dataBlocks": len(BLOCKS),
            "indexBlockReads": 1,
            "dataBlockReads": BLOCK_READS,
            "indexEntryProbes": INDEX_PROBES,
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "file-index",
            "preset": PRESET,
            "indexKind": KIND,
            "operation": operation,
            "blockCapacity": CAPACITY,
            "targetKey": TARGET,
            "records": [{**record, "id": record["id"]} for record in RECORDS],
            "blocks": [{
                **block,
                "recordIds": list(block["recordIds"]),
            } for block in BLOCKS],
            "indexEntries": [dict(entry) for entry in INDEX],
            "currentIndexIndex": CURRENT_INDEX,
            "currentBlockId": CURRENT_BLOCK,
            "compareId": COMPARE_ID,
            "foundId": FOUND_ID,
            "indexBlockReads": 1,
            "dataBlockReads": BLOCK_READS,
            "indexEntryProbes": INDEX_PROBES,
            "result": result,
        },
    )


def pick_block():
    global CURRENT_INDEX, INDEX_PROBES
    chosen_index = 0
    for position, entry in enumerate(INDEX):
        CURRENT_INDEX = position
        INDEX_PROBES += 1
        emit(
            "index-probe",
            "在索引中检查关键字 " + str(entry["key"]) + " 与块 " + entry["blockId"] + " / inspect the index entry",
            "index-probe",
        )
        if entry["key"] == TARGET:
            chosen_index = position
            break
        if entry["key"] > TARGET:
            break
        chosen_index = position
    return INDEX[chosen_index]


BY_ID = {}
for position, record in enumerate(RAW_RECORDS):
    record["id"] = "R" + str(position + 1)
    BY_ID[record["id"]] = record
    RECORDS.append(record)

for start in range(0, len(RECORDS), CAPACITY):
    ids = [record["id"] for record in RECORDS[start:start + CAPACITY]]
    last_key = BY_ID[ids[-1]]["key"]
    BLOCKS.append({
        "id": "B" + str(len(BLOCKS)),
        "indexKey": last_key,
        "recordIds": ids,
    })

refresh_index()
emit(
    "init",
    "建立有序数据块，并按" + ("稠密" if KIND == "dense" else "稀疏") + "规则建立索引 / build blocks and the index",
    "init",
)

entry = pick_block()
CURRENT_BLOCK = entry["blockId"]
BLOCK_READS = 1
emit(
    "read-block",
    "索引项指向 " + CURRENT_BLOCK + "：读入该数据块 / read the selected data block",
    "read-block",
)

for record_id in next(block for block in BLOCKS if block["id"] == CURRENT_BLOCK)["recordIds"]:
    COMPARE_ID = record_id
    emit(
        "compare",
        "在块内比较关键字 " + str(BY_ID[record_id]["key"]) + " / compare the resident record",
        "compare",
    )
    if BY_ID[record_id]["key"] == TARGET:
        FOUND_ID = record_id
        emit(
            "found",
            "命中记录 " + record_id + "：索引定位完成 / record found through the index",
            "found",
        )
        break

if FOUND_ID is None:
    COMPARE_ID = None
    emit(
        "not-found",
        "索引与块内扫描均未命中 / the index and block scan did not find the key",
        "not-found",
    )
else:
    COMPARE_ID = None

emit(
    "done",
    "查找结束：" + ("成功" if FOUND_ID is not None else "失败") + " / indexed-file lookup complete",
    "done",
    result="found" if FOUND_ID is not None else "not-found",
)
`;

export const FILE_INDEX_RANDOM_SCENARIOS = [
  { id: 'dense-hit', label: ['稠密索引命中', 'Dense-index hit'] },
  { id: 'dense-miss', label: ['稠密索引失败', 'Dense-index miss'] },
  { id: 'sparse-hit', label: ['稀疏索引命中', 'Sparse-index hit'] },
  { id: 'sparse-miss', label: ['稀疏索引失败', 'Sparse-index miss'] },
  { id: 'small-blocks', label: ['小块容量', 'Small blocks'] },
  { id: 'large-blocks', label: ['大块容量', 'Large blocks'] },
] as const;

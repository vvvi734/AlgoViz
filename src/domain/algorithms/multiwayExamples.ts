/**
 * TEXTBOOK-11: k-way balanced merge over a simulated external store.
 *
 * Input runs are already sorted. Each run owns a FIFO input buffer; only its
 * head can be a candidate. Emitting the minimum appends to a shared output
 * buffer, and a full buffer becomes one simulated write block. Read/write
 * counters are teaching-model events, never browser disk access.
 */
import type { AlgorithmEntry } from './types';

export const MULTIWAY_ENTRY: AlgorithmEntry = {
  group: 'sort',
  icon: '⇉',
  name: ['多路平衡归并（k 路）', 'k-way balanced merge'],
  desc: [
    '同时维护 k 个已经有序的归并段，每段用一个小输入缓冲区提供当前候选；选出最小候选写入输出缓冲区，缓冲区满时模拟写出一个数据块。k 越大，归并趟数越少，但候选比较和缓冲区开销越高。',
    'Merge k already sorted runs while each run exposes one candidate from a small input buffer. Emit the minimum into a shared output buffer, flushing one simulated block when full. A larger k reduces merge passes but raises candidate-comparison and buffer costs.',
  ],
  time: 'One merge pass: O(n × k) candidate scans as shown; a loser tree reduces comparisons to O(n log k), plus O(n/B) simulated blocks',
  space: 'O(k × B + B) buffer slots, plus the output sequence',
  input: undefined,
  code: "trace({type:'array',values:['k-way merge: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const MULTIWAY_DEFAULT_INPUT: unknown = {
  preset: 'two-way',
  k: 2,
  runs: [[2, 5, 9], [1, 6, 10]],
  bufferCapacity: 2,
  blockSize: 1,
};

export const MULTIWAY_PYTHON = `# k-way balanced merge over a simulated external store. Each run has a FIFO
# input buffer, and only its head is a merge candidate. Output is flushed as a
# teaching-model block; these counters never touch a real disk.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("multiway input must be an object")
    k = raw.get("k")
    runs = raw.get("runs")
    capacity = raw.get("bufferCapacity", 2)
    block = raw.get("blockSize", 1)
    preset = raw.get("preset")
    if isinstance(k, bool) or not isinstance(k, int) or not 2 <= k <= 4:
        raise ValueError("k must be an integer from 2 to 4")
    if not isinstance(runs, list) or len(runs) != k:
        raise ValueError("provide exactly k runs")
    if isinstance(capacity, bool) or not isinstance(capacity, int) or not 1 <= capacity <= 3:
        raise ValueError("buffer capacity must be 1 to 3")
    if isinstance(block, bool) or not isinstance(block, int) or not 1 <= block <= 3:
        raise ValueError("block size must be 1 to 3")
    clean = []
    total = 0
    for run in runs:
        if not isinstance(run, list) or len(run) > 6:
            raise ValueError("each run must be a list of at most 6 integers")
        values = []
        for value in run:
            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError("run values must be integers")
            if value < -1000000 or value > 1000000:
                raise ValueError("run value outside the supported range")
            values.append(value)
        if any(values[index - 1] > values[index] for index in range(1, len(values))):
            raise ValueError("every input run must already be sorted")
        clean.append(values)
        total += len(values)
    if not 1 <= total <= 24:
        raise ValueError("multiway merge needs 1 to 24 records")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return k, clean, capacity, block, preset


K, RUN_VALUES, CAPACITY, BLOCK_SIZE, PRESET = _read_input(input)
LABELS = "ABCDEFGHIJKLMNOPQRSTUVWX"
RECORDS = []
RUNS = []
next_id = 0
for run_index, values in enumerate(RUN_VALUES):
    record_ids = []
    for value in values:
        record_id = LABELS[next_id]
        next_id += 1
        RECORDS.append({
            "id": record_id,
            "value": value,
            "originalIndex": next_id - 1,
            "runIndex": run_index,
        })
        record_ids.append(record_id)
    RUNS.append({
        "id": "R" + str(run_index),
        "label": "R" + str(run_index + 1),
        "recordIds": record_ids,
        "cursor": 0,
        "buffer": [],
        "currentId": None,
        "exhausted": len(record_ids) == 0,
    })
BY_ID = {record["id"]: record for record in RECORDS}
OUTPUT = []
OUTPUT_BUFFER = []
READ_BLOCKS = 0
WRITE_BLOCKS = 0
TRACING = True


def fmt(value):
    return str(value)


def candidates():
    result = []
    for run in RUNS:
        if run["buffer"]:
            result.append(run["buffer"][0])
    return result


def refresh(run):
    run["currentId"] = run["buffer"][0] if run["buffer"] else None
    run["exhausted"] = run["cursor"] >= len(run["recordIds"]) and not run["buffer"]


def emit(operation, message, lesson, winner_id=None, new_id=None, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": list(OUTPUT), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "k": K,
            "bufferCapacity": CAPACITY,
            "blockSize": BLOCK_SIZE,
            "readBlocks": READ_BLOCKS,
            "writeBlocks": WRITE_BLOCKS,
            "candidates": len(candidates()),
            "winner": winner_id,
            "output": len(OUTPUT),
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "multiway",
            "preset": PRESET,
            "operation": operation,
            "records": [{**record} for record in RECORDS],
            "runs": [{
                **run,
                "recordIds": list(run["recordIds"]),
                "buffer": list(run["buffer"]),
                "currentId": run["currentId"],
            } for run in RUNS],
            "k": K,
            "bufferCapacity": CAPACITY,
            "blockSize": BLOCK_SIZE,
            "candidateIds": list(candidates()),
            "winnerId": winner_id,
            "output": list(OUTPUT),
            "outputBuffer": list(OUTPUT_BUFFER),
            "readBlocks": READ_BLOCKS,
            "writeBlocks": WRITE_BLOCKS,
            "mergePasses": 1,
            "result": result,
        },
    )


def fill(run, lesson):
    global READ_BLOCKS
    remaining = len(run["recordIds"]) - run["cursor"]
    take = min(BLOCK_SIZE, CAPACITY - len(run["buffer"]), remaining)
    if take <= 0:
        return None
    start = run["cursor"]
    run["buffer"].extend(run["recordIds"][start:start + take])
    run["cursor"] += take
    READ_BLOCKS += 1
    refresh(run)
    new_id = run["buffer"][-1]
    emit(
        "read",
        "从归并段读入一个数据块并放入输入缓冲 / read one block into the run's input buffer",
        lesson,
        new_id=new_id,
    )
    return new_id


def flush_output():
    global WRITE_BLOCKS
    if not OUTPUT_BUFFER:
        return
    OUTPUT.extend(OUTPUT_BUFFER)
    OUTPUT_BUFFER.clear()
    WRITE_BLOCKS += 1
    emit(
        "flush",
        "输出缓冲区写满，模拟写出一个数据块 / the output buffer is full and becomes one simulated block",
        "output",
    )


emit("init", "登记 k 个已有序归并段，缓冲区为空 / register k sorted runs with empty buffers", "init")

for run in RUNS:
    fill(run, "read")

while True:
    current = candidates()
    if not current:
        break
    emit(
        "compare",
        "比较各归并段输入缓冲的队首候选 / compare the FIFO heads of every unfinished run",
        "compare",
    )
    winner = min(current, key=lambda rid: (BY_ID[rid]["value"], BY_ID[rid]["originalIndex"]))
    emit(
        "select",
        "选出全局最小候选记录 / choose the smallest candidate across all runs",
        "select",
        winner_id=winner,
    )
    owner = None
    for run in RUNS:
        if run["buffer"] and run["buffer"][0] == winner:
            owner = run
            break
    if owner is None:
        raise ValueError("winner is not at any run head")
    owner["buffer"].pop(0)
    OUTPUT_BUFFER.append(winner)
    refresh(owner)
    emit(
        "output",
        "赢家写入输出缓冲区，对应归并段前进 / append the winner to the output buffer and advance its run",
        "output",
        winner_id=winner,
    )

    if len(OUTPUT_BUFFER) >= CAPACITY:
        flush_output()

    if not owner["buffer"] and owner["cursor"] < len(owner["recordIds"]):
        fill(owner, "read")

# The final partial block is still one simulated write.
if OUTPUT_BUFFER:
    OUTPUT.extend(OUTPUT_BUFFER)
    OUTPUT_BUFFER.clear()
    WRITE_BLOCKS += 1
    emit(
        "flush",
        "剩余输出组成最后一个不完整数据块 / write the final partial output block",
        "output",
    )

if len(OUTPUT) != len(RECORDS):
    raise ValueError("multiway merge did not output every record")
for index in range(1, len(OUTPUT)):
    left = BY_ID[OUTPUT[index - 1]]
    right = BY_ID[OUTPUT[index]]
    if (left["value"], left["originalIndex"]) > (right["value"], right["originalIndex"]):
        raise ValueError("multiway output is not stably sorted")

emit(
    "done",
    "所有归并段耗尽，输出按关键字稳定升序 / every run is exhausted and the output is stably sorted",
    "done",
    result="sorted",
)`;

export function multiwayPythonExample(): string {
  return MULTIWAY_PYTHON;
}

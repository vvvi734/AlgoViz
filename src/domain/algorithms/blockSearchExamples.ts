/**
 * TEXTBOOK-09: indexed sequential (block) search.
 *
 * The data array is stored in its original order. `blockSize` partitions the
 * prefix into consecutive blocks; it never reorders values. Each block exposes
 * its real maximum, and the block maxima must strictly increase while every
 * value in block i must be smaller than every value in block i+1. That is the
 * exact prerequisite of a sequential index table. Inside a block the values may
 * be unsorted, so the second stage is a genuine linear scan.
 */
import type { AlgorithmEntry } from './types';

export const BLOCK_SEARCH_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '▥',
  name: ['分块查找（索引顺序查找）', 'Indexed sequential (block) search'],
  desc: [
    '按原顺序把记录切成若干块，为每块建立最大关键字索引；先顺序查索引，再进入第一个 max ≥ target 的块做块内顺序扫描。块内可无序，块间必须满足范围递增。',
    'Records stay in their original order. A sequential index stores each block maximum; probe the index, enter the first block whose max reaches the target, then scan that real block. Blocks may be unsorted internally but their key ranges must increase.',
  ],
  time: 'O(b + s); about O(√n) when b ≈ s ≈ √n',
  space: 'O(b) index plus the original records',
  input: undefined,
  code: "trace({type:'array',values:['Indexed sequential search: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const BLOCK_SEARCH_PRESETS = [
  {
    id: 'hit-middle',
    label: 'blockSearchPresetHit',
    data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
    blockSize: 4,
    target: 38,
  },
  {
    id: 'miss-between',
    label: 'blockSearchPresetMiss',
    data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
    blockSize: 4,
    target: 60,
  },
  {
    id: 'hit-last-block',
    label: 'blockSearchPresetLast',
    data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
    blockSize: 4,
    target: 73,
  },
  {
    id: 'hit-boundary',
    label: 'blockSearchPresetBoundary',
    data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
    blockSize: 4,
    target: 35,
  },
  {
    id: 'hit-first-block',
    label: 'blockSearchPresetFirst',
    data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
    blockSize: 4,
    target: 8,
  },
] as const;

export type BlockSearchPreset = (typeof BLOCK_SEARCH_PRESETS)[number];
export type BlockSearchPresetId = BlockSearchPreset['id'];

export const BLOCK_SEARCH_DEFAULT_INPUT: unknown = {
  preset: 'hit-middle',
  data: [22, 8, 14, 35, 41, 57, 66, 38, 73, 81, 94, 69],
  blockSize: 4,
  target: 38,
};

export const BLOCK_SEARCH_PYTHON = `# Indexed sequential search: build a real index table, probe it, then scan one block.
# The values stay in their original order; blockSize only partitions the prefix.
# Prerequisite: block maxima increase, and every value of block i is smaller
# than every value of block i+1. Inside a block values may be unsorted.
import inspect
import math

raw_input = input
if not isinstance(raw_input, dict):
    raw_input = {}
raw_data = raw_input.get("data", [])
if not isinstance(raw_data, list):
    raw_data = []
DATA = []
for item in raw_data:
    if isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item):
        continue
    DATA.append(item)
DATA = DATA[:24]
raw_size = raw_input.get("blockSize", 4)
if isinstance(raw_size, bool) or not isinstance(raw_size, (int, float)) or not math.isfinite(raw_size):
    raw_size = 4
BLOCK_SIZE = max(1, min(8, int(raw_size)))
raw_target = raw_input.get("target", 0)
if isinstance(raw_target, bool) or not isinstance(raw_target, (int, float)) or not math.isfinite(raw_target):
    raw_target = 0
TARGET = raw_target
PRESET = raw_input.get("preset")
if PRESET is not None and not isinstance(PRESET, str):
    PRESET = None

TRACING = False


def fmt(value):
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def build_blocks():
    blocks = []
    for start in range(0, len(DATA), BLOCK_SIZE):
        values = list(DATA[start:start + BLOCK_SIZE])
        blocks.append({
            "index": len(blocks),
            "start": start,
            "length": len(values),
            "max": max(values),
            "values": values,
        })
    return blocks


BLOCKS = build_blocks()
INDEX = [
    {
        "blockIndex": block["index"],
        "max": block["max"],
        "start": block["start"],
        "length": block["length"],
    }
    for block in BLOCKS
]


def validate_index():
    if not BLOCKS:
        return
    for left, right in zip(BLOCKS, BLOCKS[1:]):
        left_max = left["max"]
        right_min = min(right["values"])
        if left_max >= right_min:
            raise ValueError("block " + str(left["index"]) + " max " + fmt(left_max) + " >= block " + str(right["index"]) + " min " + fmt(right_min))
    for left, right in zip(BLOCKS, BLOCKS[1:]):
        if left["max"] >= right["max"]:
            raise ValueError("index maxima must strictly increase")


validate_index()


def emit(operation, message, lesson, phase, current_index=None, current_block=None,
         current_pos=None, compare=None, result=None, index_count=0, block_count=0):
    if not TRACING:
        return
    payload = {
        "kind": "block-search",
        "preset": PRESET,
        "operation": operation,
        "targetValue": TARGET,
        "blockSize": BLOCK_SIZE,
        "data": list(DATA),
        "blocks": [dict(block) for block in BLOCKS],
        "indexEntries": [dict(entry) for entry in INDEX],
        "currentIndex": current_index,
        "currentBlock": current_block,
        "currentPos": current_pos,
        "compareValue": compare,
        "phase": phase,
        "indexComparisons": index_count,
        "blockComparisons": block_count,
        "result": result,
    }
    variables = {
        "n": len(DATA),
        "blockSize": BLOCK_SIZE,
        "blocks": len(BLOCKS),
        "target": TARGET,
        "currentIndex": current_index,
        "currentBlock": current_block,
        "currentPos": current_pos,
        "indexComparisons": index_count,
        "blockComparisons": block_count,
        "result": result if result is not None else "pending",
    }
    trace(
        {"type": "array", "values": list(DATA), "done": phase == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables=variables,
        lesson_step=lesson,
        structure=payload,
    )


FINAL_INDEX_COUNT = 0
FINAL_BLOCK_COUNT = 0


def search():
    global FINAL_INDEX_COUNT, FINAL_BLOCK_COUNT
    if not BLOCKS:
        FINAL_INDEX_COUNT = 0
        FINAL_BLOCK_COUNT = 0
        emit("not-found", "空表：没有可查的块 / empty table: no block to search", "not-found",
             "done", result="not-found", index_count=0, block_count=0)
        return "not-found"
    index_count = 0
    selected = None
    for entry in INDEX:
        index_count += 1
        emit(
            "index-compare",
            f"索引项 {entry['blockIndex'] + 1}：比较 {fmt(TARGET)} 与块最大值 {fmt(entry['max'])} / compare target with block max",
            "index-compare",
            "index",
            current_index=entry["blockIndex"],
            compare=entry["max"],
            index_count=index_count,
            block_count=0,
        )
        if TARGET <= entry["max"]:
            selected = entry["blockIndex"]
            emit(
                "index-select",
                f"第一个 max ≥ target 的块是第 {selected + 1} 块：进入块内扫描 / first block whose max is at least the target",
                "index-select",
                "block",
                current_index=selected,
                current_block=selected,
                compare=entry["max"],
                index_count=index_count,
                block_count=0,
            )
            break
    if selected is None:
        emit(
            "not-found",
            "所有索引项的最大值都小于 target：查找失败 / every block max is smaller: not found",
            "not-found",
            "done",
            result="not-found",
            index_count=index_count,
            block_count=0,
        )
        FINAL_INDEX_COUNT = index_count
        FINAL_BLOCK_COUNT = 0
        return "not-found"

    block_count = 0
    block = BLOCKS[selected]
    for pos, value in enumerate(block["values"]):
        block_count += 1
        emit(
            "block-compare",
            f"块内第 {pos + 1} 项：比较 {fmt(TARGET)} 与 {fmt(value)} / compare inside the selected block",
            "block-compare",
            "block",
            current_index=selected,
            current_block=selected,
            current_pos=pos,
            compare=value,
            index_count=index_count,
            block_count=block_count,
        )
        if value == TARGET:
            emit(
                "found",
                f"命中 {fmt(TARGET)}：块内下标 {pos} / hit at block offset {pos}",
                "found",
                "done",
                current_index=selected,
                current_block=selected,
                current_pos=pos,
                compare=value,
                result="found",
                index_count=index_count,
                block_count=block_count,
            )
            FINAL_INDEX_COUNT = index_count
            FINAL_BLOCK_COUNT = block_count
            return "found"
    emit(
        "not-found",
        f"第 {selected + 1} 块扫描完仍未命中：查找失败 / selected block scanned without a hit",
        "not-found",
        "done",
        current_index=selected,
        current_block=selected,
        result="not-found",
        index_count=index_count,
        block_count=block_count,
    )
    FINAL_INDEX_COUNT = index_count
    FINAL_BLOCK_COUNT = block_count
    return "not-found"


TRACING = True
emit(
    "init",
    f"{len(DATA)} 个记录、{len(BLOCKS)} 个块：索引表已按块最大值建好 / {len(DATA)} records in {len(BLOCKS)} blocks",
    "init",
    "index",
    index_count=0,
    block_count=0,
)
outcome = search()
emit(
    "done",
    "查找完成 / search complete",
    "done",
    "done",
    result=outcome,
    index_count=FINAL_INDEX_COUNT,
    block_count=FINAL_BLOCK_COUNT,
)
`;

export function blockSearchCommandFromInput(input: unknown): { data: number[]; blockSize: number; target: number } {
  if (!input || typeof input !== 'object') return { data: [], blockSize: 4, target: 0 };
  const record = input as { data?: unknown; blockSize?: unknown; target?: unknown };
  const data = Array.isArray(record.data)
    ? record.data.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    : [];
  const blockSize = typeof record.blockSize === 'number' && Number.isFinite(record.blockSize)
    ? Math.max(1, Math.min(8, Math.trunc(record.blockSize)))
    : 4;
  const target = typeof record.target === 'number' && Number.isFinite(record.target) ? record.target : 0;
  return { data, blockSize, target };
}

export function blockSearchPresetFromInput(input: unknown): BlockSearchPresetId | null {
  if (!input || typeof input !== 'object') return null;
  const preset = (input as { preset?: unknown }).preset;
  return typeof preset === 'string' && BLOCK_SEARCH_PRESETS.some((entry) => entry.id === preset)
    ? (preset as BlockSearchPresetId)
    : null;
}

export function blockSearchPresetInput(id: BlockSearchPresetId): unknown {
  const preset = BLOCK_SEARCH_PRESETS.find((entry) => entry.id === id) ?? BLOCK_SEARCH_PRESETS[0];
  return {
    preset: preset.id,
    data: [...preset.data],
    blockSize: preset.blockSize,
    target: preset.target,
  };
}

export function blockSearchPythonExample(): string {
  return BLOCK_SEARCH_PYTHON;
}

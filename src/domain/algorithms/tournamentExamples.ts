/**
 * TEXTBOOK-10: tournament (tree-selection) sort authored for AlgoViz.
 *
 * The tree is complete and padded to a power of two. Every internal node stores
 * the winner record of its subtree; ties choose the smaller original index, so
 * this implementation is stable. One output costs one leaf-to-root update.
 */
import type { AlgorithmEntry } from './types';

export const TOURNAMENT_ENTRY: AlgorithmEntry = {
  group: 'sort',
  icon: '▧',
  name: ['树形选择排序（锦标赛排序）', 'Tournament (tree-selection) sort'],
  desc: [
    '把记录放在完全二叉树的叶子上，内部节点保存两个孩子的较优者；根就是当前最小值。取出根后只重算被取走叶子到根的路径，避免每次都扫描全部记录。相等关键字按原始下标决胜，因此本实现稳定。',
    'Place records on complete-tree leaves and store the better child at every internal node, so the root is the current minimum. After emitting the root, recompute only the removed leaf-to-root path instead of rescanning all records. Equal keys use the original index as a stable tie-break.',
  ],
  time: 'O(n log n) comparisons; build O(n), then O(log n) per output',
  space: 'O(n) records plus O(n) tree nodes and output',
  input: undefined,
  code: "trace({type:'array',values:['Tournament sort: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const TOURNAMENT_PRESETS = [
  { id: 'normal', label: 'tournamentPresetNormal', values: [8, 3, 11, 1, 7, 2, 9, 4] },
  { id: 'duplicates', label: 'tournamentPresetDuplicates', values: [3, 1, 3, 2, 1, 3, 2, 1] },
  { id: 'single', label: 'tournamentPresetSingle', values: [5] },
  { id: 'non-power', label: 'tournamentPresetNonPower', values: [9, 2, 14, 5, 8] },
  { id: 'reversed', label: 'tournamentPresetReversed', values: [9, 8, 7, 6, 5, 4, 3, 2] },
  { id: 'negatives', label: 'tournamentPresetNegatives', values: [-3, 5, 0, -3, 2] },
] as const;

export type TournamentPreset = (typeof TOURNAMENT_PRESETS)[number];

export const TOURNAMENT_DEFAULT_INPUT: unknown = {
  preset: 'normal',
  values: [8, 3, 11, 1, 7, 2, 9, 4],
};

export const TOURNAMENT_PYTHON = `# Tournament sort: complete tree, winner at every internal node, and a
# stable tie-break by original record identity. Only the removed leaf-to-root
# path is recomputed after one winner leaves the root.
import inspect


def _read_values(raw):
    if isinstance(raw, dict):
        preset = raw.get("preset")
        values = raw.get("values", [])
    elif isinstance(raw, list):
        preset = None
        values = raw
    else:
        raise ValueError("tournament input must be an array or an object with values")
    if preset is not None and not isinstance(preset, str):
        preset = None
    clean = []
    for value in values:
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("tournament values must be integers")
        if value < -1000000 or value > 1000000:
            raise ValueError("tournament value outside the supported range")
        clean.append(value)
    if not 1 <= len(clean) <= 12:
        raise ValueError("tournament needs 1 to 12 integer records")
    return clean, preset


DATA, PRESET = _read_values(input)
N = len(DATA)
LABELS = [chr(ord("A") + index) for index in range(N)]
RECORDS = {
    LABELS[index]: {
        "id": LABELS[index],
        "value": DATA[index],
        "originalIndex": index,
        "leafId": "L" + str(index),
        "active": True,
    }
    for index in range(N)
}
LEAF_COUNT = 1
while LEAF_COUNT < N:
    LEAF_COUNT *= 2
HEIGHT = LEAF_COUNT.bit_length() - 1
NODES = []
for slot in range(LEAF_COUNT):
    NODES.append({
        "id": "L" + str(slot),
        "level": 0,
        "slot": slot,
        "leaf": True,
        "filled": slot < N,
        "recordId": LABELS[slot] if slot < N else None,
        "leftId": None,
        "rightId": None,
    })
for level in range(1, HEIGHT + 1):
    for slot in range(LEAF_COUNT // (2 ** level)):
        left = "L" + str(slot * 2) if level == 1 else "N" + str(level - 1) + "-" + str(slot * 2)
        right = "L" + str(slot * 2 + 1) if level == 1 else "N" + str(level - 1) + "-" + str(slot * 2 + 1)
        NODES.append({
            "id": "N" + str(level) + "-" + str(slot),
            "level": level,
            "slot": slot,
            "leaf": False,
            "filled": False,
            "recordId": None,
            "leftId": left,
            "rightId": right,
        })
BY_ID = {node["id"]: node for node in NODES}
ROOT = BY_ID["L0"] if HEIGHT == 0 else BY_ID["N" + str(HEIGHT) + "-0"]
OUTPUT = []
FINAL_WINNER = None
FINAL_PATH = []

TRACING = True


def fmt(value):
    return str(value)


def winner(candidates):
    real = [rid for rid in candidates if rid is not None and RECORDS[rid]["active"]]
    if not real:
        return None
    return min(real, key=lambda rid: (RECORDS[rid]["value"], RECORDS[rid]["originalIndex"]))


def copy_records():
    return [{**record, "leafId": record["leafId"]} for record in RECORDS.values()]


def copy_nodes():
    return [{**node} for node in NODES]


def emit(operation, message, lesson, current_node=None, compare_ids=None,
         winner_id=None, affected=None, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": list(DATA), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "n": N,
            "leafCount": LEAF_COUNT,
            "height": HEIGHT,
            "output": len(OUTPUT),
            "currentNode": current_node,
            "winner": winner_id,
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "tournament",
            "preset": PRESET,
            "operation": operation,
            "records": copy_records(),
            "nodes": copy_nodes(),
            "rootId": ROOT["id"],
            "output": list(OUTPUT),
            "activeCount": sum(1 for record in RECORDS.values() if record["active"]),
            "currentNodeId": current_node,
            "compareIds": list(compare_ids or []),
            "winnerId": winner_id,
            "affectedNodeIds": list(affected or []),
            "result": result,
        },
    )


emit("init", "选择树将按真实记录建立 / the complete tournament tree will be built from the real records", "init")

# Build every internal node bottom-up. Padding-only subtrees stay unfilled.
for level in range(1, HEIGHT + 1):
    for slot in range(LEAF_COUNT // (2 ** level)):
        node = BY_ID["N" + str(level) + "-" + str(slot)]
        left = BY_ID[node["leftId"]]
        right = BY_ID[node["rightId"]]
        candidates = [left["recordId"], right["recordId"]]
        best = winner(candidates)
        if best is None:
            continue
        node["recordId"] = best
        node["filled"] = True
        emit(
            "build",
            "内部节点比较两个孩子，把较优记录上送 / compare the two child winners and promote the better record",
            "build",
            node["id"],
            [rid for rid in candidates if rid is not None],
            best,
        )

while len(OUTPUT) < N:
    winner_id = ROOT["recordId"]
    if winner_id is None:
        raise ValueError("tournament tree has no winner before all records are output")
    emit(
        "select",
        "根节点是当前最小记录 / the root holds the current minimum",
        "select",
        ROOT["id"],
        [],
        winner_id,
    )
    OUTPUT.append(winner_id)
    emit(
        "output",
        "输出根节点赢家，形成有序前缀 / emit the root winner to grow the sorted prefix",
        "output",
        ROOT["id"],
        [],
        winner_id,
    )

    # Remove the winning leaf and recompute only its ancestors.
    RECORDS[winner_id]["active"] = False
    path = [RECORDS[winner_id]["leafId"]]
    cursor = path[0]
    while cursor != ROOT["id"]:
        parent = None
        for candidate in NODES:
            if not candidate["leaf"] and cursor in (candidate["leftId"], candidate["rightId"]):
                parent = candidate
                break
        if parent is None:
            raise ValueError("broken tournament parent link")
        cursor = parent["id"]
        path.append(cursor)

    for node_id in path[1:]:
        node = BY_ID[node_id]
        left = BY_ID[node["leftId"]]
        right = BY_ID[node["rightId"]]
        best = winner([left["recordId"], right["recordId"]])
        node["recordId"] = best
        node["filled"] = best is not None
    if HEIGHT == 0:
        ROOT["recordId"] = None
        ROOT["filled"] = False
    FINAL_WINNER = ROOT["recordId"]
    FINAL_PATH = path
    emit(
        "update",
        "取走叶子后，只沿叶到根路径重算赢家 / remove the leaf and recompute only its leaf-to-root path",
        "update",
        ROOT["id"],
        [],
        FINAL_WINNER,
        path,
    )

emit("done", "所有记录均已输出，序列按关键字稳定升序 / every record is out and the sequence is stable ascending", "done", result="sorted")`;

export function tournamentPythonExample(): string {
  return TOURNAMENT_PYTHON;
}

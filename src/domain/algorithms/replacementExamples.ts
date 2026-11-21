/**
 * TEXTBOOK-11: replacement selection for long initial runs.
 *
 * A fixed workspace holds eligible records (`value >= lastOutput`) and frozen
 * records (`value < lastOutput`). Emitting the minimum eligible record lets one
 * new input record enter the workspace. When no eligible record remains, the
 * current run closes and every frozen record is unfrozen for the next run. The
 * resulting runs can therefore grow beyond the workspace size.
 */
import type { AlgorithmEntry } from './types';

export const REPLACEMENT_ENTRY: AlgorithmEntry = {
  group: 'sort',
  icon: '⇄',
  name: ['置换选择排序（初始归并段）', 'Replacement selection (initial runs)'],
  desc: [
    '在固定大小的工作区中反复选择“不小于当前输出阈值”的最小记录，并读入下一条记录；低于阈值的记录冻结到下一段。当前段没有可输出记录时，解冻全部冻结记录，开始下一段。得到的初始归并段通常比工作区更长。',
    'Repeatedly select the smallest record still eligible for the current run (`key >= last output`) while reading one new record into the fixed workspace. Records below the threshold freeze for the next run. When no eligible record remains, unfreeze all frozen records and start a new run; generated runs can exceed workspace size.',
  ],
  time: 'O(n log W) with a heap selection structure, W = workspace capacity; the teaching model scans W slots',
  space: 'O(W) workspace slots plus the generated run lists',
  input: undefined,
  code: "trace({type:'array',values:['Replacement selection: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const REPLACEMENT_DEFAULT_INPUT: unknown = {
  preset: 'normal',
  values: [7, 3, 9, 1, 8, 2, 6, 4, 5],
  workspaceCapacity: 3,
};

export const REPLACEMENT_PYTHON = `# Replacement selection: a fixed workspace, a movable output threshold, and a
# frozen reservoir. A run closes only when no eligible record remains; then all
# frozen records are unfrozen together for the next run.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("replacement input must be an object")
    values = raw.get("values")
    capacity = raw.get("workspaceCapacity", 3)
    preset = raw.get("preset")
    if not isinstance(values, list):
        raise ValueError("values must be a list")
    clean = []
    for value in values:
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("replacement values must be integers")
        if value < -1000000 or value > 1000000:
            raise ValueError("replacement value outside the supported range")
        clean.append(value)
    if not 1 <= len(clean) <= 20:
        raise ValueError("replacement selection needs 1 to 20 records")
    if isinstance(capacity, bool) or not isinstance(capacity, int) or not 2 <= capacity <= 6:
        raise ValueError("workspace capacity must be 2 to 6")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return clean, capacity, preset


DATA, CAPACITY, PRESET = _read_input(input)
N = len(DATA)
LABELS = "ABCDEFGHIJKLMNOPQRST"
RECORDS = [
    {"id": LABELS[index], "value": DATA[index], "originalIndex": index}
    for index in range(N)
]
BY_ID = {record["id"]: record for record in RECORDS}
INPUT_INDEX = min(CAPACITY, N)
WORKSPACE = []
for index in range(CAPACITY):
    if index < INPUT_INDEX:
        WORKSPACE.append({"recordId": LABELS[index], "state": "eligible"})
    else:
        WORKSPACE.append({"recordId": None, "state": "empty"})
LAST_OUTPUT = None
CURRENT_RUN = []
RUNS = []
CURRENT_ID = None
NEW_ID = None
TRACING = True


def fmt(value):
    return str(value)


def eligible_ids():
    return [slot["recordId"] for slot in WORKSPACE if slot["state"] == "eligible"]


def frozen_ids():
    return [slot["recordId"] for slot in WORKSPACE if slot["state"] == "frozen"]


def emit(operation, message, lesson, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": list(DATA), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "n": N,
            "workspaceCapacity": CAPACITY,
            "inputIndex": INPUT_INDEX,
            "lastOutput": LAST_OUTPUT,
            "currentRun": len(CURRENT_RUN),
            "frozen": len(frozen_ids()),
            "runs": len(RUNS),
            "current": CURRENT_ID,
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "replacement",
            "preset": PRESET,
            "operation": operation,
            "records": [{**record} for record in RECORDS],
            "workspaceCapacity": CAPACITY,
            "workspace": [{**slot} for slot in WORKSPACE],
            "eligibleIds": eligible_ids(),
            "frozenIds": frozen_ids(),
            "inputIndex": INPUT_INDEX,
            "lastOutput": LAST_OUTPUT,
            "currentId": CURRENT_ID,
            "newId": NEW_ID,
            "currentRun": list(CURRENT_RUN),
            "runs": [list(run) for run in RUNS],
            "result": result,
        },
    )


emit("init", "工作区装入首批记录，当前段阈值尚未建立 / fill the workspace; the current-run threshold is open", "init")

while True:
    eligible = eligible_ids()
    if not eligible:
        if CURRENT_RUN:
            RUNS.append(list(CURRENT_RUN))
            CURRENT_RUN.clear()
            CURRENT_ID = None
            NEW_ID = None
            emit(
                "segment-end",
                "当前段已无可输出记录，封段 / no eligible record remains, so the current run closes",
                "segment",
            )
        frozen = frozen_ids()
        if frozen:
            for slot in WORKSPACE:
                if slot["state"] == "frozen":
                    slot["state"] = "eligible"
            LAST_OUTPUT = None
            CURRENT_ID = None
            NEW_ID = None
            emit(
                "advance",
                "解冻全部冻结记录，开始下一归并段 / unfreeze every frozen record and start the next run",
                "segment",
            )
            continue
        break

    winner = min(eligible, key=lambda rid: (BY_ID[rid]["value"], BY_ID[rid]["originalIndex"]))
    CURRENT_ID = winner
    NEW_ID = None
    emit(
        "select",
        "在当前可输出记录中选出最小者 / choose the smallest record still eligible for this run",
        "select",
    )

    for slot in WORKSPACE:
        if slot["recordId"] == winner:
            slot["recordId"] = None
            slot["state"] = "empty"
            break
    CURRENT_RUN.append(winner)
    LAST_OUTPUT = BY_ID[winner]["value"]
    emit(
        "output",
        "赢家写入当前归并段 / write the winner into the current initial run",
        "select",
    )

    if INPUT_INDEX < N:
        incoming = LABELS[INPUT_INDEX]
        INPUT_INDEX += 1
        target = next(slot for slot in WORKSPACE if slot["state"] == "empty")
        target["recordId"] = incoming
        target["state"] = "eligible" if LAST_OUTPUT is None or BY_ID[incoming]["value"] >= LAST_OUTPUT else "frozen"
        NEW_ID = incoming
        emit(
            "read",
            "读入下一条记录，判断它能否继续属于当前段 / read the next record and test it against the threshold",
            "read",
        )
        if target["state"] == "frozen":
            emit(
                "freeze",
                "新记录低于当前阈值，冻结到下一段 / the new record is below the threshold and freezes for the next run",
                "freeze",
            )

if CURRENT_RUN:
    RUNS.append(list(CURRENT_RUN))
    CURRENT_RUN.clear()

if not RUNS:
    raise ValueError("replacement selection produced no run")
for run in RUNS:
    for index in range(1, len(run)):
        left = BY_ID[run[index - 1]]
        right = BY_ID[run[index]]
        if (left["value"], left["originalIndex"]) > (right["value"], right["originalIndex"]):
            raise ValueError("an initial run is not sorted")
if sum(len(run) for run in RUNS) != N:
    raise ValueError("initial runs do not cover every input record")

CURRENT_ID = None
NEW_ID = None
emit(
    "done",
    "输入耗尽，得到若干有序初始归并段 / the input is exhausted and every initial run is sorted",
    "done",
    result="runs-ready",
)`;

export function replacementPythonExample(): string {
  return REPLACEMENT_PYTHON;
}

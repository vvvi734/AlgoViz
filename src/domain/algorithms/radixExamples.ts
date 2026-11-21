/**
 * TEXTBOOK-10: LSD decimal radix sort authored for AlgoViz.
 *
 * Inputs are non-negative integers in 0..9999. Ten FIFO buckets distribute the
 * current order at the active digit, then collect 0..9. The current order is
 * replaced only after a complete collection, and equal keys keep their original
 * identities because every pass is stable.
 */
import type { AlgorithmEntry } from './types';

export const RADIX_ENTRY: AlgorithmEntry = {
  group: 'sort',
  icon: '▦',
  name: ['基数排序（LSD，十进制）', 'Radix sort (LSD, decimal)'],
  desc: [
    '不直接比较完整关键字，而是从个位开始，按当前十进制位把记录放入 0–9 号桶，再按桶号稳定收集；更高位重复同样过程。桶是先进先出队列，因此相等关键字在最终序列中保持原始先后。',
    'Do not compare whole keys. Starting at the units digit, distribute records into buckets 0–9 by the active decimal digit, then collect buckets in order; repeat for higher digits. FIFO buckets make every pass stable, so equal keys keep their original identities.',
  ],
  time: 'O(d × (n + 10)); d is the number of decimal digits',
  space: 'O(n + 10) for records, buckets and collected output',
  input: undefined,
  code: "trace({type:'array',values:['Radix sort: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const RADIX_PRESETS = [
  { id: 'multi-digit', label: 'radixPresetMultiDigit', values: [170, 45, 75, 90, 802, 24, 2, 66] },
  { id: 'mixed-length', label: 'radixPresetMixedLength', values: [7, 1000, 23, 5, 999, 0, 12] },
  { id: 'duplicates', label: 'radixPresetDuplicates', values: [21, 12, 21, 12, 3, 21] },
  { id: 'zero', label: 'radixPresetZero', values: [0, 10, 2, 100, 0] },
  { id: 'single', label: 'radixPresetSingle', values: [7] },
  { id: 'identical', label: 'radixPresetIdentical', values: [42, 42, 42, 42] },
] as const;

export type RadixPreset = (typeof RADIX_PRESETS)[number];

export const RADIX_DEFAULT_INPUT: unknown = {
  preset: 'multi-digit',
  values: [170, 45, 75, 90, 802, 24, 2, 66],
};

export const RADIX_PYTHON = `# LSD decimal radix sort: ten FIFO buckets, one active digit per pass, and
# stable distribution/collection. Equal keys keep their original identities.
import inspect


def _read_values(raw):
    if isinstance(raw, dict):
        preset = raw.get("preset")
        values = raw.get("values", [])
    elif isinstance(raw, list):
        preset = None
        values = raw
    else:
        raise ValueError("radix input must be an array or an object with values")
    if preset is not None and not isinstance(preset, str):
        preset = None
    clean = []
    for value in values:
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("radix values must be integers")
        if value < 0:
            raise ValueError("radix sort only accepts non-negative integers")
        if value > 9999:
            raise ValueError("radix sort currently supports 0..9999")
        clean.append(value)
    if not 1 <= len(clean) <= 16:
        raise ValueError("radix sort needs 1 to 16 values")
    return clean, preset


DATA, PRESET = _read_values(input)
N = len(DATA)
LABELS = [chr(ord("A") + index) for index in range(N)]
RECORDS = [
    {"id": LABELS[index], "value": DATA[index], "originalIndex": index}
    for index in range(N)
]
BY_ID = {record["id"]: record for record in RECORDS}
ORDER = [record["id"] for record in RECORDS]
MAX_DIGITS = max(len(str(record["value"])) for record in RECORDS)
BUCKETS = [[] for _ in range(10)]
COLLECTED = []
PASS = 0
TRACING = True


def fmt(value):
    return str(value)


def digit_of(record_id, power):
    return (BY_ID[record_id]["value"] // power) % 10


def emit(operation, message, lesson, current_id=None, current_bucket=None,
         current_digit=None, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": list(DATA), "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "n": N,
            "pass": PASS,
            "maxDigits": MAX_DIGITS,
            "digitPower": 10 ** PASS,
            "currentId": current_id,
            "bucket": current_bucket,
            "collected": len(COLLECTED),
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "radix",
            "preset": PRESET,
            "operation": operation,
            "records": [{**record} for record in RECORDS],
            "order": list(ORDER),
            "buckets": [list(bucket) for bucket in BUCKETS],
            "collected": list(COLLECTED),
            "pass": PASS,
            "maxDigits": MAX_DIGITS,
            "digitPower": 10 ** PASS,
            "currentId": current_id,
            "currentBucket": current_bucket,
            "currentDigit": current_digit,
            "result": result,
        },
    )


emit("init", "读入原始序列，准备从个位开始 / read the original order and prepare the units pass", "init")

for digit_index in range(MAX_DIGITS):
    PASS = digit_index
    power = 10 ** PASS
    BUCKETS = [[] for _ in range(10)]
    COLLECTED = []
    emit(
        "digit-start",
        "开始第 " + str(PASS + 1) + " 趟：当前位权 " + fmt(power) + " / start this pass at the active digit",
        "digit-start",
    )

    for record_id in ORDER:
        digit = digit_of(record_id, power)
        BUCKETS[digit].append(record_id)
        emit(
            "distribute",
            "按当前位 " + str(digit) + " 放入桶 " + str(digit) + "，桶内保持在先记录 / put the record into its digit bucket in stable order",
            "distribute",
            record_id,
            digit,
            digit,
        )

    for digit in range(10):
        if not BUCKETS[digit]:
            continue
        COLLECTED.extend(BUCKETS[digit])
        emit(
            "collect",
            "按桶号收集：从桶 " + str(digit) + " 依次取出记录 / collect bucket " + str(digit) + " in FIFO order",
            "collect",
            None,
            digit,
            digit,
        )

    ORDER = [record_id for bucket in BUCKETS for record_id in bucket]
    COLLECTED = list(ORDER)
    emit(
        "pass-end",
        "本趟收集完成，得到按低位有序的新序列 / this pass is collected into the new sequence",
        "pass-end",
    )

emit("done", "所有数位处理完成，得到稳定升序序列 / every digit is processed and the final sequence is stably sorted", "done", result="sorted")`;

export function radixPythonExample(): string {
  return RADIX_PYTHON;
}

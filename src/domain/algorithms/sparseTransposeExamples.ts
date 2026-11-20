/**
 * MATRIX-01 sparse-matrix fast transpose source.
 *
 * The animation is driven by this real Python program. Every frame is emitted
 * by the loops below; no num/cpot value or result triple is prewritten by the UI.
 *
 * Conventions used everywhere in this course:
 *   - matrix rows, columns and triple-table positions are 0-based;
 *   - the input triple table is sorted row-major;
 *   - the result is another row-major triple table for the transposed matrix.
 */
import type { AlgorithmEntry } from './types';

export const SPARSE_TRANSPOSE_DEFAULT_INPUT: unknown = {
  rows: 4,
  cols: 5,
  triples: [
    { row: 0, col: 0, value: 3 },
    { row: 0, col: 2, value: 7 },
    { row: 1, col: 2, value: 5 },
    { row: 2, col: 1, value: 4 },
    { row: 3, col: 0, value: 6 },
    { row: 3, col: 2, value: 8 },
  ],
};

export const SPARSE_TRANSPOSE_PYTHON = `# Sparse matrix fast transpose: scan triplets -> count columns -> cpot -> place.
# Everything is 0-based: matrix coordinates and the triple table.
raw = input if isinstance(input, dict) else {}
rows = raw.get("rows", 0)
cols = raw.get("cols", 0)
raw_triples = raw.get("triples", [])
if not isinstance(rows, int) or isinstance(rows, bool) or rows < 0 or rows > 10:
    raise ValueError("rows must be an integer in 0..10")
if not isinstance(cols, int) or isinstance(cols, bool) or cols < 0 or cols > 10:
    raise ValueError("cols must be an integer in 0..10")
if not isinstance(raw_triples, list) or len(raw_triples) > 24:
    raise ValueError("triples must be a list of at most 24 entries")

triples = []
last_row, last_col = -1, -1
for item in raw_triples:
    if isinstance(item, dict):
        r, c, v = item.get("row"), item.get("col"), item.get("value")
    elif isinstance(item, (list, tuple)) and len(item) == 3:
        r, c, v = item
    else:
        raise ValueError("each triplet must be {row, col, value} or [row, col, value]")
    if not isinstance(r, int) or isinstance(r, bool) or not isinstance(c, int) or isinstance(c, bool):
        raise ValueError("triplet coordinates must be integers")
    if not isinstance(v, int) or isinstance(v, bool):
        raise ValueError("triplet value must be an integer")
    if r < 0 or r >= rows or c < 0 or c >= cols:
        raise ValueError("triplet coordinate outside the matrix")
    if v == 0:
        raise ValueError("a sparse triplet must be non-zero")
    if r < last_row or (r == last_row and c <= last_col):
        raise ValueError("triples must be strictly row-major and unique")
    last_row, last_col = r, c
    triples.append({"row": r, "col": c, "value": v})

nnz = len(triples)
dense = [0] * (rows * cols)
for item in triples:
    dense[item["row"] * cols + item["col"]] = item["value"]

# num[c] counts originals in column c; cpot[c] is the first free output slot.
num = [0] * cols
cpot = [0] * cols
result = [None] * nnz
ready = 0


def emit(operation, message, lesson, source_index=None, target_index=None,
         column_index=None, cpot_ready=None):
    focus = []
    if source_index is not None:
        item = triples[source_index]
        focus = [item["row"] * cols + item["col"]]
    trace(
        {"type": "array", "values": dense[:], "focus": focus},
        message,
        variables={"rows": rows, "cols": cols, "nnz": nnz, "num": num[:],
                   "cpot": cpot[:], "sourceIndex": source_index,
                   "targetIndex": target_index},
        lesson_step=lesson,
        structure={
            "kind": "sparse-transpose",
            "phase": ("count" if lesson.startswith("count") or lesson == "init"
                      else "cpot" if lesson.startswith("cpot")
                      else "done" if lesson == "done" else "place"),
            "operation": operation, "rows": rows, "cols": cols,
            "triples": [item.copy() for item in triples],
            "num": num[:], "cpot": cpot[:],
            "cpotReady": ready if cpot_ready is None else cpot_ready,
            "sourceIndex": source_index, "targetIndex": target_index,
            "columnIndex": column_index,
            "result": [None if item is None else item.copy() for item in result],
        },
    )


# ---- Phase 1: count non-zero entries per column ---------------------------
ready = 0
emit("init", "读入稀疏矩阵与行优先三元组表 / Read the sparse matrix and row-major triplets", "init")
emit("count-start", "初始化 num 计数数组 / Initialize the num counters", "count-start")

for k, item in enumerate(triples):
    num[item["col"]] += 1
    emit("count-scan", "扫描三元组：num[col] 加一 / Scan a triplet: increment num[col]",
         "count-scan", k, None, item["col"])

emit("count-complete", "各列非零元素数量统计完成 / Column counts complete", "count-complete")

# ---- Phase 2: compute the first output slot for each column --------------
if cols > 0:
    cpot[0] = 0
    ready = 1
    emit("cpot-start", "cpot[0] = 0 / The first column starts at slot 0", "cpot-start",
         None, None, 0)
    for c in range(1, cols):
        cpot[c] = cpot[c - 1] + num[c - 1]
        ready = c + 1
        emit("cpot-compute", "cpot[c] = cpot[c-1] + num[c-1] / Compute the next start",
             "cpot-compute", None, None, c)
ready = cols
emit("cpot-complete", "所有列的起始位置计算完成 / All column starts are ready", "cpot-complete")

# ---- Phase 3: place every source triplet directly into its final slot ----
emit("place-start", "开始遍历源三元组 / Start placing source triplets", "place-start")

for k, item in enumerate(triples):
    q = cpot[item["col"]]
    emit("place-read", "读取源三元组，目标位置 q = cpot[col] / Read the source and compute q = cpot[col]",
         "place-read", k, q, item["col"])
    result[q] = {"row": item["col"], "col": item["row"], "value": item["value"]}
    emit("place-write", "写入 (col, row, value)，不重新排序 / Write (col, row, value) directly",
         "place-write", k, q, item["col"])
    cpot[item["col"]] = q + 1
    emit("place-update", "cpot[col] 前移一格 / Advance cpot[col] by one", "place-update",
         k, q, item["col"])

emit("done", "转置完成，结果三元组表按行优先排列 / Transpose complete; the result is row-major", "done")
`;

export const SPARSE_TRANSPOSE_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '▦',
  name: ['稀疏矩阵快速转置', 'Fast transpose of a sparse matrix'],
  desc: [
    '用真实 Python 三元组表执行快速转置：先统计各列非零数 num，再计算起始位置 cpot，最后把每个元素直接写入结果表。',
    'Real Python transposes a triplet table: count non-zeros per column into num, compute starting slots in cpot, then place each entry directly into the result table.',
  ],
  time: 'O(t + c)',
  space: 'O(c) 额外',
  input: SPARSE_TRANSPOSE_DEFAULT_INPUT,
  code: "trace({type:'array',values:[0,0,0],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

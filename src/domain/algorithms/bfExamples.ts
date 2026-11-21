/**
 * 朴素模式匹配（BF）课程源。
 *
 * 视觉层不预生成任何一帧：下面的 Python 程序真的逐起点、逐字符运行，
 * 并在每次比较、失配、命中和结束时通过 trace() 发出状态。
 *
 * 课程语义与 KMP 保持一致：
 *   - 0 基下标；
 *   - 返回全部匹配起点；
 *   - 找到一个匹配后仍继续检查后面的起点，所以支持重叠匹配；
 *   - 空主串合法，结果为空列表；
 *   - 空模式串无效，入口处直接拒绝。
 */
import type { AlgorithmEntry } from './types';

export const BF_DEFAULT_INPUT: unknown = {
  text: 'ABABABCABABABC',
  pattern: 'ABABC',
};

export const BF_PYTHON = `# 朴素模式匹配：外层枚举候选起点，内层逐字符比较。
# 与 KMP 课程一致：返回全部匹配起点，允许重叠，使用 0 基下标。
raw = input if isinstance(input, dict) else {}
text = raw.get("text", "")
pattern = raw.get("pattern", "")
if not isinstance(text, str):
    text = ""
if not isinstance(pattern, str):
    pattern = ""
if pattern == "":
    raise ValueError("pattern must be a non-empty string")

n = len(text)
m = len(pattern)
matches = []
current_match = None
seen = [0] * n              # 每个主串字符累计被比较了多少次
checked = 0                 # 已经尝试过多少个候选起点
comparisons = 0             # 累计字符比较次数


def emit(operation, message, lesson, start=None, j=None, matched=None,
         compare_index=None, next_start=None):
    """发出一个真实状态帧；结构字段与 bfSchema 一一对应。"""
    focus = [] if compare_index is None else [compare_index]
    trace(
        {"type": "array", "values": list(text), "focus": focus,
         "done": operation == "done"},
        message,
        variables={"text": text, "pattern": pattern, "start": start, "j": j,
                   "matches": matches[:], "comparisons": comparisons},
        lesson_step=lesson,
        structure={
            "kind": "bf", "operation": operation,
            "text": text, "pattern": pattern,
            "start": start, "j": j,
            "compareIndex": compare_index, "matched": matched,
            "nextStart": next_start, "seen": seen[:],
            "checkedCandidates": checked, "comparisonCount": comparisons,
            "matches": matches[:], "currentMatchStart": current_match,
        },
    )


emit("init", "读入主串与模式串 / Read text and pattern", "init")

# 主串短于模式串时没有任何合法起点，直接结束。
if n < m:
    emit("done", "主串短于模式串，没有候选起点 / Text shorter than pattern: no candidate start",
         "done")
else:
    # 外层循环：s 是模式串首字符当前对齐到的主串位置。
    for start in range(0, n - m + 1):
        checked += 1
        emit("candidate-start",
             f"候选起点 s={start}，模式串从头比较 / Candidate start s={start}; compare from P[0]",
             "candidate-start", start, 0)

        # 内层循环：j 同时表示“已匹配前缀长度”和“下一个待比较的模式下标”。
        j = 0
        while j < m:
            compare_index = start + j
            seen[compare_index] += 1
            comparisons += 1
            same = text[compare_index] == pattern[j]
            emit("compare",
                 f"比较 T[{compare_index}] 与 P[{j}] / Compare T[{compare_index}] with P[{j}]",
                 "compare", start, j, same, compare_index)

            if same:
                j += 1
                if j == m:
                    # 整个模式串都比较完，当前起点是一次完整匹配。
                    matches.append(start)
                    current_match = start
                    emit("match-found",
                         f"起点 s={start} 完整匹配；继续检查 s+1，允许重叠 / Full match at s={start}; continue at s+1 for overlaps",
                         "match-found", start, j, True, start + m - 1, start + 1)
                else:
                    emit("advance",
                         f"字符相同，j 前进到 {j} / Characters equal; advance j to {j}",
                         "advance", start, j, True, start + j - 1)
            else:
                # 失配后当前起点不可能再匹配，只能整体右移一格。
                emit("mismatch",
                     f"T[{compare_index}] != P[{j}]；起点 s 右移到 {start + 1} / Mismatch; shift s to {start + 1}",
                     "mismatch", start, j, False, compare_index, start + 1)
                break

    emit("done", "所有候选起点检查完毕 / All candidate starts checked", "done")
`;

export const BF_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '⌕',
  name: ['朴素模式匹配（BF）', 'Naive pattern matching (BF)'],
  desc: [
    '真实 Python 逐个移动候选起点、逐字符比较，标出已匹配前缀、失配位置与被重新扫描的字符，返回全部重叠匹配。',
    'Real Python shifts each candidate start and compares character by character, marking the matched prefix, mismatch and rescanned cells while returning every overlapping match.',
  ],
  time: 'O(nm)',
  space: 'O(1)',
  input: BF_DEFAULT_INPUT,
  code: "trace({type:'array',values:['BF: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

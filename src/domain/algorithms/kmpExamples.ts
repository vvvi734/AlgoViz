/**
 * KMP course source. The visual is driven by this real Python program:
 * every frame below is emitted by a live loop, never precomputed by the UI.
 *
 * LPS convention used everywhere in this course:
 *   lps[k] = length of the longest proper prefix of pattern[0..k]
 *            that is also a suffix of pattern[0..k].
 * It is zero-based; textbooks that use next[] may store a shifted variant.
 */
import type { AlgorithmEntry } from './types';

export const KMP_DEFAULT_INPUT: unknown = {
  text: 'ABABABCABABABC',
  pattern: 'ABABC',
};

export const KMP_PYTHON = `# KMP: build lps, then scan the text without moving i back.
# lps[k] = longest proper prefix of pattern[0..k] that is also its suffix.
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
lps = [0] * m
ready = 0                 # no entry is final before the build starts
matches = []
current_match = None


def emit(operation, message, lesson, i=None, j=None, matched=None,
         fallback_from=None, fallback_to=None):
    trace(
        {"type": "array", "values": list(text), "focus": [] if i is None else [i]},
        message,
        variables={"text": text, "pattern": pattern, "i": i, "j": j,
                   "lps": lps[:], "matches": matches[:]},
        lesson_step=lesson,
        structure={
            "kind": "kmp", "phase": "build" if lesson.startswith("build") or lesson == "init" else "search",
            "operation": operation, "text": text, "pattern": pattern,
            "lps": lps[:], "lpsReady": ready,
            "i": i, "j": j, "matched": matched,
            "fallbackFrom": fallback_from, "fallbackTo": fallback_to,
            "matches": matches[:], "currentMatchStart": current_match,
        },
    )


# ---- Phase A: build the prefix table --------------------------------------
emit("init", "读入主串与模式串 / Read text and pattern", "init")
i, j = 1, 0
ready = 1                 # lps[0] is final from here on
emit("build-start", "lps[0] 固定为 0，从 i=1 开始 / lps[0] is 0; start at i=1", "build-start", i, j, None)

while i < m:
    same = pattern[i] == pattern[j]
    emit("build-compare",
         "比较 pattern[i] 与 pattern[j] / Compare pattern[i] with pattern[j]",
         "build-compare", i, j, same)
    if same:
        j += 1
        lps[i] = j
        ready = i + 1
        emit("build-record", "匹配：j 前进并记录 lps[i]=j / Match: advance j and record lps[i]=j",
             "build-record", i, j, None)
        i += 1
    elif j > 0:
        fallback_from = j
        j = lps[j - 1]
        emit("build-fallback", "失配：j 回退到 lps[j-1] / Mismatch: j falls back to lps[j-1]",
             "build-fallback", i, j, False, fallback_from, j)
    else:
        lps[i] = 0
        ready = i + 1
        emit("build-record", "失配且 j=0：记录 lps[i]=0 / Mismatch at j=0: record lps[i]=0",
             "build-record", i, 0, None)
        i += 1

ready = m
emit("build-complete", "前缀表构建完成 / Prefix table complete", "build-complete",
     m, lps[m - 1], None)

# ---- Phase B: search every occurrence, including overlaps ----------------
i, j = 0, 0
current_match = None
emit("search-start", "从 i=0, j=0 开始匹配 / Start matching at i=0, j=0", "search-start", i, j, None)

while i < n:
    same = text[i] == pattern[j]
    emit("search-compare", "比较 text[i] 与 pattern[j] / Compare text[i] with pattern[j]",
         "search-compare", i, j, same)

    if same:
        i += 1
        j += 1
        if j == m:
            start = i - j
            matches.append(start)
            current_match = start
            emit("match-found", "找到完整匹配 / Full match found", "match-found", i, j, True)
            j = lps[j - 1]
        else:
            emit("search-advance", "匹配：i 与 j 同时前进 / Match: advance i and j together",
                 "search-advance", i, j, True)
    elif j > 0:
        fallback_from = j
        j = lps[j - 1]
        emit("search-fallback",
             "失配：j 回退，i 保持不动 / Mismatch: j falls back, i stays put",
             "search-fallback", i, j, False, fallback_from, j)
    else:
        i += 1
        emit("search-miss", "j=0 仍失配：主串 i 前进一格 / Mismatch at j=0: advance i by one",
             "search-miss", i, j, False)

emit("search-done", "匹配结束 / Search complete", "search-done", n, 0, None)
`;

export const KMP_ENTRY: AlgorithmEntry = {
  group: 'ds',
  icon: '⇄',
  name: ['KMP 模式匹配', 'KMP pattern matching'],
  desc: [
    '真实 Python 构造前缀表 lps，再在不回退主串指针的前提下找出全部匹配位置，包括重叠匹配。',
    'Real Python builds the lps prefix table, then finds every occurrence without moving the text pointer back, including overlapping matches.',
  ],
  time: 'O(n + m)',
  space: 'O(m)',
  input: KMP_DEFAULT_INPUT,
  code: "trace({type:'array',values:['KMP: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

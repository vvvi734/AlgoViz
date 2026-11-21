import { z } from 'zod';

/**
 * BF（Brute Force / 朴素模式匹配）的 Trace 协议。
 *
 * 课程语义与 KMP 对齐：返回全部匹配起点，允许重叠，统一使用 0 基下标。
 * 空主串合法，结果为空；空模式串无效，由输入层和 Python 程序共同拒绝。
 */
export const BF_OPERATIONS = [
  'init',
  'candidate-start',
  'compare',
  'advance',
  'mismatch',
  'match-found',
  'done',
] as const;

export type BfOperation = (typeof BF_OPERATIONS)[number];

export const BF_MAX_TEXT = 24;
export const BF_MAX_PATTERN = 12;

/**
 * 独立的朴素匹配参考实现，只用于校验 Trace 的最终结果。
 * 这里的循环结构与 Python 教学程序、C/C++ 参考实现保持一致。
 */
export function computeBfMatches(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  const matches: number[] = [];
  const n = text.length;
  const m = pattern.length;
  for (let start = 0; start <= n - m; start += 1) {
    let j = 0;
    while (j < m && text[start + j] === pattern[j]) j += 1;
    if (j === m) matches.push(start);
  }
  return matches;
}

const integer = z.number().int().finite();

export const bfSnapshotSchema = z
  .object({
    kind: z.literal('bf'),
    operation: z.enum(BF_OPERATIONS),
    /** 主串，最多 24 个字符。 */
    text: z.string().max(BF_MAX_TEXT),
    /** 模式串，至少 1 个字符；空模式串在入口处拒绝。 */
    pattern: z.string().min(1).max(BF_MAX_PATTERN),
    /** 当前候选起点 s；init/done 时为空。 */
    start: integer.nullable(),
    /** 当前模式串下标 j，也就是“已经匹配的前缀长度”。 */
    j: integer.nullable(),
    /** 当前比较的主串下标 s+j；只应在比较类帧中出现。 */
    compareIndex: integer.nullable(),
    /** 当前两个字符是否相等；非比较帧为空。 */
    matched: z.boolean().nullable(),
    /** 失配或命中后，下一个候选起点 s+1。 */
    nextStart: integer.nullable(),
    /** 每个主串字符累计被比较过多少次，用来标出“被重新扫描”的格子。 */
    seen: z.array(integer.min(0).max(BF_MAX_PATTERN)).max(BF_MAX_TEXT),
    /** 已经检查过的候选起点数量。 */
    checkedCandidates: integer.min(0).max(BF_MAX_TEXT),
    /** 累计字符比较次数。 */
    comparisonCount: integer.min(0).max(BF_MAX_TEXT * BF_MAX_PATTERN),
    /** 目前找到的全部匹配起点，严格递增。 */
    matches: z.array(integer.min(0).max(BF_MAX_TEXT)).max(BF_MAX_TEXT),
    /** 最近一次完整匹配，用于继续搜索时保持高亮。 */
    currentMatchStart: integer.nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const issue = (path: string[], message: string) => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    };
    const n = snapshot.text.length;
    const m = snapshot.pattern.length;
    const expected = computeBfMatches(snapshot.text, snapshot.pattern);
    const candidateCount = Math.max(0, n - m + 1);

    if (snapshot.seen.length !== n) {
      issue(['seen'], `seen length ${snapshot.seen.length} != text length ${n}`);
    }
    const seenTotal = snapshot.seen.reduce((sum, value) => sum + value, 0);
    if (seenTotal !== snapshot.comparisonCount) {
      issue(['comparisonCount'], `seen total ${seenTotal} != comparisonCount ${snapshot.comparisonCount}`);
    }
    if (snapshot.checkedCandidates > candidateCount) {
      issue(['checkedCandidates'], `checked ${snapshot.checkedCandidates} exceeds ${candidateCount} candidates`);
    }

    for (const start of snapshot.matches) {
      if (start < 0 || start + m > n) issue(['matches'], `match start ${start} is outside the text`);
      else if (snapshot.text.slice(start, start + m) !== snapshot.pattern) {
        issue(['matches'], `recorded match at ${start} does not equal the pattern`);
      }
    }
    if (snapshot.matches.some((start, index) => index > 0 && start <= snapshot.matches[index - 1])) {
      issue(['matches'], 'matches must be strictly increasing');
    }
    if (snapshot.currentMatchStart !== null) {
      if (snapshot.currentMatchStart < 0 || snapshot.currentMatchStart + m > n) {
        issue(['currentMatchStart'], 'currentMatchStart is outside the text');
      } else if (snapshot.text.slice(snapshot.currentMatchStart, snapshot.currentMatchStart + m) !== snapshot.pattern) {
        issue(['currentMatchStart'], 'currentMatchStart does not point at the pattern');
      }
      if (!snapshot.matches.includes(snapshot.currentMatchStart)) {
        issue(['currentMatchStart'], 'currentMatchStart must be the latest recorded match');
      }
      if (snapshot.matches[snapshot.matches.length - 1] !== snapshot.currentMatchStart) {
        issue(['currentMatchStart'], 'currentMatchStart must be the last match');
      }
    }

    if (snapshot.operation === 'init') {
      if (snapshot.start !== null || snapshot.j !== null) issue([], 'init must not have live pointers');
      if (snapshot.compareIndex !== null || snapshot.matched !== null || snapshot.nextStart !== null) {
        issue([], 'init must not carry comparison state');
      }
      if (snapshot.checkedCandidates !== 0 || snapshot.comparisonCount !== 0) {
        issue([], 'init must not have counted work');
      }
      if (snapshot.seen.some((value) => value !== 0)) issue(['seen'], 'init must start with zero comparisons');
      if (snapshot.matches.length > 0 || snapshot.currentMatchStart !== null) {
        issue(['matches'], 'init must not have matches');
      }
      return;
    }

    if (snapshot.operation === 'done') {
      if (snapshot.start !== null || snapshot.j !== null) issue([], 'done must not leave live candidate pointers');
      if (snapshot.compareIndex !== null || snapshot.matched !== null || snapshot.nextStart !== null) {
        issue([], 'done must not carry comparison state');
      }
      if (snapshot.checkedCandidates !== candidateCount) {
        issue(['checkedCandidates'], 'done must have checked every candidate');
      }
      if (JSON.stringify(snapshot.matches) !== JSON.stringify(expected)) {
        issue(['matches'], `done matches must equal the reference ${JSON.stringify(expected)}`);
      }
      return;
    }

    if (snapshot.start === null || snapshot.j === null) {
      issue([], `${snapshot.operation} needs both candidate and pattern indices`);
      return;
    }
    if (snapshot.start < 0 || snapshot.start > n - m) {
      issue(['start'], `start ${snapshot.start} is outside 0..${n - m}`);
    }
    if (snapshot.j < 0 || snapshot.j > m) {
      issue(['j'], `j ${snapshot.j} is outside 0..${m}`);
    }
    if (snapshot.checkedCandidates !== snapshot.start + 1) {
      issue(['checkedCandidates'], 'checkedCandidates must equal start + 1');
    }

    if (snapshot.operation === 'candidate-start') {
      if (snapshot.j !== 0) issue(['j'], 'candidate-start must reset j to 0');
      if (snapshot.compareIndex !== null || snapshot.matched !== null || snapshot.nextStart !== null) {
        issue([], 'candidate-start must not carry a comparison result');
      }
      return;
    }

    const compareIndex = snapshot.start + snapshot.j;
    if (snapshot.operation === 'compare') {
      if (compareIndex < 0 || compareIndex >= n) {
        issue(['compareIndex'], 'compare index must lie inside the text');
        return;
      }
      if (snapshot.compareIndex !== compareIndex) {
        issue(['compareIndex'], 'compareIndex must equal start + j');
      }
      const actual = snapshot.text[compareIndex] === snapshot.pattern[snapshot.j];
      if (snapshot.matched !== actual) {
        issue(['matched'], 'compare result disagrees with the two characters');
      }
      if (snapshot.nextStart !== null) issue(['nextStart'], 'compare must not set a next start');
      if (snapshot.seen[compareIndex] < 1) issue(['seen'], 'the compared text cell must be marked');
      return;
    }

    if (snapshot.operation === 'advance') {
      if (snapshot.matched !== true) issue(['matched'], 'advance follows an equal comparison');
      if (snapshot.j < 1 || snapshot.j >= m) issue(['j'], 'advance must leave 1 <= j < m');
      if (snapshot.nextStart !== null) issue(['nextStart'], 'advance must not set a next start');
      if (snapshot.compareIndex !== snapshot.start + snapshot.j - 1) {
        issue(['compareIndex'], 'advance keeps the last compared text index');
      }
      return;
    }

    if (snapshot.operation === 'mismatch') {
      if (compareIndex < 0 || compareIndex >= n) {
        issue(['compareIndex'], 'mismatch index must lie inside the text');
        return;
      }
      if (snapshot.compareIndex !== compareIndex) {
        issue(['compareIndex'], 'mismatch compareIndex must equal start + j');
      }
      if (snapshot.matched !== false) issue(['matched'], 'mismatch must record inequality');
      if (snapshot.nextStart !== snapshot.start + 1) {
        issue(['nextStart'], 'mismatch must advance the candidate start by one');
      }
      if (snapshot.text[compareIndex] === snapshot.pattern[snapshot.j]) {
        issue(['matched'], 'mismatch frame compares equal characters');
      }
      return;
    }

    if (snapshot.operation === 'match-found') {
      if (snapshot.j !== m) issue(['j'], 'match-found must have j = m');
      if (snapshot.matched !== true) issue(['matched'], 'match-found must record equality');
      if (snapshot.compareIndex !== snapshot.start + m - 1) {
        issue(['compareIndex'], 'match-found keeps the last compared text index');
      }
      if (snapshot.nextStart !== snapshot.start + 1) {
        issue(['nextStart'], 'match-found must continue with the next start');
      }
      if (snapshot.currentMatchStart !== snapshot.start) {
        issue(['currentMatchStart'], 'match-found must highlight the current start');
      }
      if (!snapshot.matches.includes(snapshot.start)) {
        issue(['matches'], 'match-found start must be recorded');
      }
      if (snapshot.text.slice(snapshot.start, snapshot.start + m) !== snapshot.pattern) {
        issue(['text'], 'match-found substring does not equal the pattern');
      }
    }
  });

export type BfSnapshot = z.infer<typeof bfSnapshotSchema>;

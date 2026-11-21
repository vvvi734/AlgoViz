import type { BfOperation, BfSnapshot } from '../trace/bfSchema';

/**
 * BF 的纯视觉模型。
 *
 * 这里只把已经通过 Trace 校验的状态翻译成“每个格子该显示什么”，
 * 不重新执行匹配，也不推测未记录的失配/命中。
 */
export type BfCellTone = 'none' | 'start' | 'prefix' | 'match' | 'mismatch' | 'found';

export interface BfCellModel {
  index: number;
  char: string;
  tone: BfCellTone;
  /** 该字符在所有候选对齐中累计被比较的次数；>1 说明被重新扫描。 */
  seenCount: number;
}

export interface BfVisualModel {
  kind: 'bf';
  operation: BfOperation;
  text: string;
  pattern: string;
  textCells: BfCellModel[];
  patternCells: BfCellModel[];
  start: number | null;
  j: number | null;
  compareIndex: number | null;
  nextStart: number | null;
  nextStartValid: boolean;
  alignment: number;
  boardColumns: number;
  matched: boolean | null;
  matches: number[];
  currentMatchStart: number | null;
  checkedCandidates: number;
  totalCandidates: number;
  comparisonCount: number;
  emptyText: boolean;
}

function toneCell(index: number, char: string, seenCount: number): BfCellModel {
  return { index, char, tone: 'none', seenCount };
}

export function buildBfModel(snapshot: BfSnapshot): BfVisualModel {
  const textChars = [...snapshot.text];
  const patternChars = [...snapshot.pattern];
  const n = textChars.length;
  const m = patternChars.length;
  const totalCandidates = Math.max(0, n - m + 1);
  const start = snapshot.start;
  const j = snapshot.j;
  const compareIndex = snapshot.compareIndex;

  const alignment =
    start ??
    snapshot.currentMatchStart ??
    (n >= m ? Math.max(0, n - m) : 0);
  const boardColumns = Math.max(
    n,
    alignment + m,
    snapshot.currentMatchStart === null ? 0 : snapshot.currentMatchStart + m,
    1,
  );

  const textCells = textChars.map((char, index) =>
    toneCell(index, char, snapshot.seen[index] ?? 0),
  );
  const patternCells = patternChars.map((char, index) => toneCell(index, char, 0));

  // 已经找到的匹配先标出起点；当前这次完整匹配会覆盖为整段 found。
  for (const match of snapshot.matches) {
    if (match < n) textCells[match].tone = 'start';
  }

  const matchedPrefix = Math.max(0, Math.min(j ?? 0, m));
  for (let offset = 0; offset < matchedPrefix; offset += 1) {
    const index = alignment + offset;
    if (index < n) textCells[index].tone = 'prefix';
    if (offset < m) patternCells[offset].tone = 'prefix';
  }

  if (snapshot.operation === 'candidate-start' && start !== null && start < n) {
    textCells[start].tone = 'start';
  }

  if (snapshot.operation === 'compare' && compareIndex !== null && compareIndex < n) {
    textCells[compareIndex].tone = snapshot.matched ? 'match' : 'mismatch';
    if (j !== null && j < m) patternCells[j].tone = snapshot.matched ? 'match' : 'mismatch';
  }

  if (snapshot.operation === 'advance' && start !== null && j !== null) {
    // j 已经后移；实际刚比较过的是 j-1。
    const lastCompared = start + j - 1;
    if (lastCompared >= 0 && lastCompared < n) textCells[lastCompared].tone = 'match';
    if (j - 1 < m) patternCells[j - 1].tone = 'match';
  }

  if (snapshot.operation === 'mismatch' && compareIndex !== null && compareIndex < n) {
    textCells[compareIndex].tone = 'mismatch';
    if (j !== null && j < m) patternCells[j].tone = 'mismatch';
  }

  if (
    snapshot.currentMatchStart !== null &&
    (snapshot.operation === 'match-found' || snapshot.operation === 'done')
  ) {
    const matchStart = snapshot.currentMatchStart;
    for (let offset = 0; offset < m; offset += 1) {
      const textIndex = matchStart + offset;
      if (textIndex < n) textCells[textIndex].tone = 'found';
      patternCells[offset].tone = 'found';
    }
  }

  return {
    kind: 'bf',
    operation: snapshot.operation,
    text: snapshot.text,
    pattern: snapshot.pattern,
    textCells,
    patternCells,
    start: snapshot.start,
    j: snapshot.j,
    compareIndex: snapshot.compareIndex,
    nextStart: snapshot.nextStart,
    nextStartValid: snapshot.nextStart !== null && snapshot.nextStart <= n - m,
    alignment,
    boardColumns,
    matched: snapshot.matched,
    matches: snapshot.matches,
    currentMatchStart: snapshot.currentMatchStart,
    checkedCandidates: snapshot.checkedCandidates,
    totalCandidates,
    comparisonCount: snapshot.comparisonCount,
    emptyText: n === 0,
  };
}

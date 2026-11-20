import type { KmpOperation, KmpPhase, KmpSnapshot } from '../trace/kmpSchema';

export type KmpCellTone = 'none' | 'compare' | 'match' | 'mismatch' | 'prefix' | 'found' | 'start' | 'fallback';

export interface KmpCellModel {
  index: number;
  char: string;
  tone: KmpCellTone;
}

export interface KmpLpsCellModel {
  index: number;
  /** Null means this lps entry has not been computed yet. */
  value: number | null;
  current: boolean;
}

export interface KmpVisualModel {
  kind: 'kmp';
  phase: KmpPhase;
  operation: KmpOperation;
  text: string;
  pattern: string;
  lps: number[];
  lpsReady: number;
  lpsCells: KmpLpsCellModel[];
  textCells: KmpCellModel[];
  patternCells: KmpCellModel[];
  i: number | null;
  j: number | null;
  alignment: number;
  boardColumns: number;
  matched: boolean | null;
  fallbackFrom: number | null;
  fallbackTo: number | null;
  matches: number[];
  currentMatchStart: number | null;
  emptyText: boolean;
}

function toneCell(index: number, char: string, tone: KmpCellTone = 'none'): KmpCellModel {
  return { index, char, tone };
}

function buildPatternCells(snapshot: KmpSnapshot): KmpCellModel[] {
  const chars = [...snapshot.pattern];
  const cells = chars.map((char, index) => toneCell(index, char));
  const i = snapshot.i;
  const j = snapshot.j;
  const prefixLength = j ?? 0;

  if (snapshot.operation === 'build-compare') {
    for (let index = 0; index < prefixLength; index += 1) cells[index].tone = 'prefix';
    const result: KmpCellTone = snapshot.matched ? 'match' : 'mismatch';
    if (j !== null && j < cells.length) cells[j].tone = result;
    if (i !== null && i < cells.length) cells[i].tone = result;
  } else if (snapshot.operation === 'build-record') {
    if (i !== null && i < cells.length) {
      cells[i].tone = (snapshot.lps[i] ?? 0) > 0 ? 'match' : 'mismatch';
    }
  } else if (snapshot.operation === 'build-fallback') {
    for (let index = 0; index < prefixLength; index += 1) cells[index].tone = 'prefix';
    if (snapshot.fallbackFrom !== null && snapshot.fallbackFrom < cells.length) {
      cells[snapshot.fallbackFrom].tone = 'fallback';
    }
    if (j !== null && j < cells.length) cells[j].tone = 'compare';
  } else if (snapshot.operation === 'build-start' || snapshot.operation === 'build-complete') {
    for (let index = 0; index < Math.min(prefixLength, cells.length); index += 1) {
      cells[index].tone = 'prefix';
    }
  }
  return cells;
}

function buildSearchCells(snapshot: KmpSnapshot): { textCells: KmpCellModel[]; patternCells: KmpCellModel[]; alignment: number } {
  const textChars = [...snapshot.text];
  const patternChars = [...snapshot.pattern];
  const i = snapshot.i;
  const j = snapshot.j;
  const alignment = snapshot.operation === 'search-done'
    ? snapshot.currentMatchStart ?? Math.max(0, textChars.length - patternChars.length)
    : i !== null && j !== null
      ? Math.max(0, i - j)
      : snapshot.currentMatchStart ?? 0;
  const textCells = textChars.map((char, index) => toneCell(index, char));
  const patternCells = patternChars.map((char, index) => toneCell(index, char));

  for (const start of snapshot.matches) {
    if (start < textCells.length) textCells[start].tone = 'start';
  }
  // The confirmed text segment behind the current alignment.
  const prefixLength = Math.max(0, Math.min(j ?? 0, patternChars.length));
  for (let offset = 0; offset < prefixLength; offset += 1) {
    const index = alignment + offset;
    if (index >= 0 && index < textCells.length && textCells[index].tone === 'none') {
      textCells[index].tone = 'prefix';
    }
  }
  if (
    snapshot.currentMatchStart !== null &&
    (snapshot.operation === 'match-found' || snapshot.operation === 'search-done')
  ) {
    for (let offset = 0; offset < patternChars.length; offset += 1) {
      const index = snapshot.currentMatchStart + offset;
      if (index >= 0 && index < textCells.length) textCells[index].tone = 'found';
    }
  } else if (i !== null && i < textCells.length && (snapshot.operation === 'search-compare' || snapshot.operation === 'search-fallback')) {
    textCells[i].tone = snapshot.matched ? 'match' : 'mismatch';
  } else if (snapshot.operation === 'search-miss' && i !== null && i > 0 && i - 1 < textCells.length) {
    // Python emits this frame after i advances at j=0; the compared cell is i-1.
    textCells[i - 1].tone = 'mismatch';
  }

  if (snapshot.operation === 'match-found' || snapshot.operation === 'search-done') {
    for (const cell of patternCells) cell.tone = 'found';
  } else {
    for (let index = 0; index < prefixLength; index += 1) patternCells[index].tone = 'prefix';
    if (j !== null && j < patternCells.length) {
      if (snapshot.operation === 'search-compare') {
        patternCells[j].tone = snapshot.matched ? 'match' : 'mismatch';
      } else if (snapshot.operation === 'search-fallback') {
        patternCells[j].tone = 'compare';
      } else if (snapshot.operation === 'search-miss') {
        patternCells[j].tone = 'mismatch';
      }
    }
    if (snapshot.operation === 'search-fallback' && snapshot.fallbackFrom !== null) {
      const from = snapshot.fallbackFrom;
      if (from >= 0 && from < patternCells.length) patternCells[from].tone = 'fallback';
    }
  }
  return { textCells, patternCells, alignment };
}

export function buildKmpModel(snapshot: KmpSnapshot): KmpVisualModel {
  const text = [...snapshot.text];
  const pattern = [...snapshot.pattern];
  const search = snapshot.phase === 'search';
  const searchCells = search
    ? buildSearchCells(snapshot)
    : { textCells: [], patternCells: buildPatternCells(snapshot), alignment: 0 };
  const lpsReady = snapshot.lpsReady;
  const lpsCells = pattern.map((_, index) => ({
    index,
    value: index < lpsReady ? snapshot.lps[index] : null,
    current: snapshot.phase === 'build' && index === snapshot.i,
  }));
  const alignment = searchCells.alignment;
  const boardColumns = search
    ? Math.max(text.length, alignment + pattern.length, (snapshot.currentMatchStart ?? 0) + pattern.length)
    : Math.max(pattern.length, 1);

  return {
    kind: 'kmp',
    phase: snapshot.phase,
    operation: snapshot.operation,
    text: snapshot.text,
    pattern: snapshot.pattern,
    lps: snapshot.lps,
    lpsReady,
    lpsCells,
    textCells: searchCells.textCells,
    patternCells: searchCells.patternCells,
    i: snapshot.i,
    j: snapshot.j,
    alignment,
    boardColumns,
    matched: snapshot.matched,
    fallbackFrom: snapshot.fallbackFrom,
    fallbackTo: snapshot.fallbackTo,
    matches: snapshot.matches,
    currentMatchStart: snapshot.currentMatchStart,
    emptyText: text.length === 0,
  };
}

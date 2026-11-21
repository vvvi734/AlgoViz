/**
 * TEXTBOOK-09: view model for indexed sequential search. The block rows are the
 * real snapshot partition, not a decorative grouping of cells.
 */
import type { BlockSearchSnapshot } from '../trace/blockSearchSchema';

export interface BlockSearchCellModel {
  value: number;
  position: number;
  compared: boolean;
  scanned: boolean;
  matched: boolean;
}

export interface BlockSearchRowModel {
  index: number;
  start: number;
  length: number;
  max: number;
  selected: boolean;
  visible: boolean;
  cells: BlockSearchCellModel[];
}

export interface BlockSearchIndexRowModel {
  index: number;
  max: number;
  start: number;
  length: number;
  passed: boolean;
  selected: boolean;
}

export interface BlockSearchVisualModel {
  kind: 'block-search';
  target: number;
  phase: BlockSearchSnapshot['phase'];
  operation: BlockSearchSnapshot['operation'];
  result: BlockSearchSnapshot['result'];
  overview: number[];
  rows: BlockSearchRowModel[];
  indexRows: BlockSearchIndexRowModel[];
  currentIndex: number | null;
  currentBlock: number | null;
  currentPos: number | null;
  compareValue: number | null;
  indexComparisons: number;
  blockComparisons: number;
  empty: boolean;
}

export function buildBlockSearchModel(snapshot: BlockSearchSnapshot): BlockSearchVisualModel {
  const selectedBlock = snapshot.currentBlock;
  const selectedIndex =
    snapshot.currentIndex ??
    (snapshot.phase === 'done' ? snapshot.currentBlock : null);
  const rows: BlockSearchRowModel[] = snapshot.blocks.map((block) => {
    const current = block.index === selectedBlock;
    return {
      index: block.index,
      start: block.start,
      length: block.length,
      max: block.max,
      selected: current,
      visible: true,
      cells: block.values.map((value, position) => ({
        value,
        position,
        compared: current && snapshot.currentPos === position && snapshot.compareValue === value,
        scanned: current && snapshot.currentPos !== null && position < snapshot.currentPos,
        matched: current && snapshot.currentPos === position && snapshot.compareValue === value && value === snapshot.targetValue,
      })),
    };
  });

  const indexRows: BlockSearchIndexRowModel[] = snapshot.indexEntries.map((entry) => ({
    index: entry.blockIndex,
    max: entry.max,
    start: entry.start,
    length: entry.length,
    passed:
      snapshot.phase !== 'index' &&
      selectedIndex !== null &&
      entry.blockIndex < selectedIndex,
    selected: entry.blockIndex === selectedIndex,
  }));

  return {
    kind: 'block-search',
    target: snapshot.targetValue,
    phase: snapshot.phase,
    operation: snapshot.operation,
    result: snapshot.result,
    overview: [...snapshot.data],
    rows,
    indexRows,
    currentIndex: snapshot.currentIndex,
    currentBlock: snapshot.currentBlock,
    currentPos: snapshot.currentPos,
    compareValue: snapshot.compareValue,
    indexComparisons: snapshot.indexComparisons,
    blockComparisons: snapshot.blockComparisons,
    empty: snapshot.blocks.length === 0,
  };
}

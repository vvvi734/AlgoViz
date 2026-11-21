/**
 * TEXTBOOK-12 visual projections for files and multi-key indexes.
 *
 * The models expose only validated snapshot facts: index entries, data blocks,
 * overflow links, posting lists and the current trace cursor. Components format
 * and paint; no lookup or set operation is recomputed here.
 */
import type { FileIndexSnapshot, FileIndexOperation } from '../trace/fileIndexSchema';
import type { IsamSnapshot, IsamOperation } from '../trace/isamSchema';
import type { InvertedSnapshot, InvertedOperation } from '../trace/invertedIndexSchema';

export type FileRecordState = 'idle' | 'pending' | 'scanning' | 'compare' | 'found' | 'inserted' | 'matched';

export interface FileRecordView {
  id: string;
  key: number;
  label: string;
  state: FileRecordState;
}

export interface FileIndexBlockView {
  id: string;
  indexKey: number;
  records: FileRecordView[];
  current: boolean;
}

export interface FileIndexEntryView {
  key: number;
  blockId: string;
  active: boolean;
  path: boolean;
}

export interface FileIndexVisualModel {
  kind: 'file-index';
  operation: FileIndexOperation;
  presets: string | null;
  indexKind: 'dense' | 'sparse';
  targetKey: number;
  entries: FileIndexEntryView[];
  blocks: FileIndexBlockView[];
  currentIndexIndex: number | null;
  currentBlockId: string | null;
  foundId: string | null;
  indexBlockReads: number;
  dataBlockReads: number;
  indexEntryProbes: number;
  blockCapacity: number;
  result: FileIndexSnapshot['result'];
}

export interface IsamOverflowView {
  id: string;
  records: FileRecordView[];
  nextId: string | null;
  active: boolean;
}

export interface IsamBlockView {
  id: string;
  indexKey: number;
  records: FileRecordView[];
  overflowHead: string | null;
  current: boolean;
  overflow: IsamOverflowView[];
}

export interface IsamEntryView {
  key: number;
  blockId: string;
  active: boolean;
  path: boolean;
}

export interface IsamVisualModel {
  kind: 'isam';
  operation: IsamOperation;
  command: 'find' | 'insert';
  targetKey: number;
  entries: IsamEntryView[];
  blocks: IsamBlockView[];
  overflowNodes: IsamOverflowView[];
  currentIndexIndex: number | null;
  selectedBlockId: string | null;
  currentBlockId: string | null;
  currentOverflowId: string | null;
  foundId: string | null;
  insertedId: string | null;
  indexBlockReads: number;
  mainBlockReads: number;
  overflowBlockReads: number;
  blockCapacity: number;
  result: IsamSnapshot['result'];
}

export interface InvertedRecordView {
  id: string;
  keywords: string[];
  state: FileRecordState;
}

export interface InvertedEntryView {
  term: string;
  postings: string[];
  active: boolean;
  currentPostingIds: string[];
}

export interface InvertedVisualModel {
  kind: 'inverted-index';
  operation: InvertedOperation;
  mode: 'and' | 'or';
  records: InvertedRecordView[];
  entries: InvertedEntryView[];
  queryTerms: string[];
  currentTerm: string | null;
  termPostings: string[];
  matchedIds: string[];
  builtCount: number;
  result: InvertedSnapshot['result'];
}

export function buildFileIndexModel(snapshot: FileIndexSnapshot): FileIndexVisualModel {
  const targetId = snapshot.foundId;
  const recordView = (
    id: string,
    blockId: string,
  ): FileRecordView => {
    const record = snapshot.records.find((item) => item.id === id)!;
    let state: FileRecordState = 'idle';
    if (id === snapshot.compareId) state = 'compare';
    else if (id === targetId) state = 'found';
    else if (blockId === snapshot.currentBlockId) state = 'scanning';
    return { id, key: record.key, label: record.label, state };
  };

  return {
    kind: 'file-index',
    operation: snapshot.operation,
    presets: snapshot.preset,
    indexKind: snapshot.indexKind,
    targetKey: snapshot.targetKey,
    entries: snapshot.indexEntries.map((entry, index) => ({
      key: entry.key,
      blockId: entry.blockId,
      active: index === snapshot.currentIndexIndex,
      path: entry.blockId === snapshot.currentBlockId,
    })),
    blocks: snapshot.blocks.map((block) => ({
      id: block.id,
      indexKey: block.indexKey,
      records: block.recordIds.map((id) => recordView(id, block.id)),
      current: block.id === snapshot.currentBlockId,
    })),
    currentIndexIndex: snapshot.currentIndexIndex,
    currentBlockId: snapshot.currentBlockId,
    foundId: snapshot.foundId,
    indexBlockReads: snapshot.indexBlockReads,
    dataBlockReads: snapshot.dataBlockReads,
    indexEntryProbes: snapshot.indexEntryProbes,
    blockCapacity: snapshot.blockCapacity,
    result: snapshot.result,
  };
}

export function buildIsamModel(snapshot: IsamSnapshot): IsamVisualModel {
  const recordView = (id: string, blockId: string): FileRecordView => {
    const record = snapshot.records.find((item) => item.id === id)!;
    let state: FileRecordState = 'idle';
    if (id === snapshot.compareId) state = 'compare';
    else if (id === snapshot.foundId) state = 'found';
    else if (id === snapshot.insertedId) state = 'inserted';
    else if (blockId === snapshot.currentBlockId) state = 'scanning';
    return { id, key: record.key, label: record.label, state };
  };

  const overflowViews = new Map<string, IsamOverflowView[]>();
  for (const block of snapshot.blocks) overflowViews.set(block.id, []);
  for (const node of snapshot.overflowNodes) {
    overflowViews.get(node.blockId)!.push({
      id: node.id,
      records: node.recordIds.map((id) => recordView(id, node.blockId)),
      nextId: node.nextId,
      active: node.id === snapshot.currentOverflowId,
    });
  }

  return {
    kind: 'isam',
    operation: snapshot.operation,
    command: snapshot.command,
    targetKey: snapshot.targetKey,
    entries: snapshot.indexEntries.map((entry, index) => ({
      key: entry.key,
      blockId: entry.blockId,
      active: index === snapshot.currentIndexIndex,
      path: entry.blockId === snapshot.selectedBlockId,
    })),
    blocks: snapshot.blocks.map((block) => ({
      id: block.id,
      indexKey: block.indexKey,
      records: block.recordIds.map((id) => recordView(id, block.id)),
      overflowHead: block.overflowHead,
      current: block.id === snapshot.currentBlockId,
      overflow: overflowViews.get(block.id) ?? [],
    })),
    overflowNodes: snapshot.overflowNodes.map((node) => ({
      id: node.id,
      records: node.recordIds.map((id) => recordView(id, node.blockId)),
      nextId: node.nextId,
      active: node.id === snapshot.currentOverflowId,
    })),
    currentIndexIndex: snapshot.currentIndexIndex,
    selectedBlockId: snapshot.selectedBlockId,
    currentBlockId: snapshot.currentBlockId,
    currentOverflowId: snapshot.currentOverflowId,
    foundId: snapshot.foundId,
    insertedId: snapshot.insertedId,
    indexBlockReads: snapshot.indexBlockReads,
    mainBlockReads: snapshot.mainBlockReads,
    overflowBlockReads: snapshot.overflowBlockReads,
    blockCapacity: snapshot.blockCapacity,
    result: snapshot.result,
  };
}

export function buildInvertedModel(snapshot: InvertedSnapshot): InvertedVisualModel {
  const matched = new Set(snapshot.matchedIds);
  const recordViews = snapshot.records.map((record, index) => ({
    id: record.id,
    keywords: [...record.keywords],
    state: matched.has(record.id)
      ? 'matched'
      : record.id === snapshot.currentRecordId
        ? 'scanning'
        : (index < snapshot.builtCount ? 'idle' : 'pending') as FileRecordState,
  }));

  return {
    kind: 'inverted-index',
    operation: snapshot.operation,
    mode: snapshot.mode,
    records: recordViews,
    entries: snapshot.index.map((entry) => ({
      term: entry.term,
      postings: [...entry.postings],
      active: entry.term === snapshot.currentTerm,
      currentPostingIds: entry.term === snapshot.currentTerm ? [...snapshot.termPostings] : [],
    })),
    queryTerms: [...snapshot.queryTerms],
    currentTerm: snapshot.currentTerm,
    termPostings: [...snapshot.termPostings],
    matchedIds: [...snapshot.matchedIds],
    builtCount: snapshot.builtCount,
    result: snapshot.result,
  };
}
